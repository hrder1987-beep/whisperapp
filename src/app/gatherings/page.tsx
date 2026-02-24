
"use client"

import { useState, useMemo, useRef } from "react"
import { Header } from "@/components/chuchot/Header"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { useUser, useFirestore, useCollection, useMemoFirebase, addDocumentNonBlocking } from "@/firebase"
import { collection, query, orderBy } from "firebase/firestore"
import { Gathering, GatheringQuestion } from "@/lib/types"
import { Plus, Calendar as CalendarIcon, Search, Clock, MapPin, Globe, Image as ImageIcon, Video, FileText, Type, Sparkles, X, ListPlus, Trash2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { MOCK_GATHERINGS } from "@/lib/mock-gatherings"
import { format } from "date-fns"
import { ko } from "date-fns/locale"

const GATHERING_CATEGORIES = ["전체", "COP/학습", "네트워킹/친목", "컨퍼런스", "북클럽", "프로젝트"]

export default function GatheringsPage() {
  const { user } = useUser()
  const db = useFirestore()
  const { toast } = useToast()
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const detailImageInputRef = useRef<HTMLInputElement>(null)

  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("전체")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Form States
  const [title, setTitle] = useState("")
  const [summary, setSummary] = useState("")
  const [tagInput, setTagInput] = useState("")
  const [description, setDescription] = useState("")
  const [type, setType] = useState<"online" | "offline">("online")
  const [location, setLocation] = useState("")
  const [startDate, setStartDate] = useState<Date | undefined>(undefined)
  const [endDate, setEndDate] = useState<Date | undefined>(undefined)
  const [startTime, setStartTime] = useState("14:00")
  const [endTime, setEndTime] = useState("16:00")
  const [capacity, setCapacity] = useState("10")
  const [sessionCount, setSessionCount] = useState("6")
  const [category, setCategory] = useState("COP/학습")
  const [questions, setQuestions] = useState<GatheringQuestion[]>([])
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [detailImages, setDetailImages] = useState<string[]>([])

  const gatheringsQuery = useMemoFirebase(() => {
    if (!db) return null
    return query(collection(db, "gatherings"), orderBy("createdAt", "desc"))
  }, [db])

  const { data: gatheringsData, isLoading } = useCollection<Gathering>(gatheringsQuery)

  const gatherings = useMemo(() => {
    const fetched = gatheringsData || []
    const merged = [...fetched]
    const existingIds = new Set(merged.map(g => g.id))
    MOCK_GATHERINGS.forEach(mg => { if (!existingIds.has(mg.id)) merged.push(mg) })
    return merged.sort((a, b) => b.createdAt - a.createdAt)
  }, [gatheringsData])

  const filteredGatherings = useMemo(() => {
    return gatherings.filter(g => {
      const matchesSearch = g.title.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesCategory = selectedCategory === "전체" || g.category === selectedCategory
      return matchesSearch && matchesCategory
    })
  }, [gatherings, searchQuery, selectedCategory])

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => setImageUrl(reader.result as string)
      reader.readAsDataURL(file)
    }
  }

  const handleDetailImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setDetailImages(prev => [...prev, reader.result as string])
        toast({ title: "이미지 추가됨", description: "상세 정보 하단에 이미지가 삽입되었습니다." })
      }
      reader.readAsDataURL(file)
    }
  }

  const addQuestion = () => {
    if (questions.length >= 10) {
      toast({ title: "질문 개수 제한", description: "설문 질문은 최대 10개까지 가능합니다.", variant: "destructive" })
      return
    }
    setQuestions([...questions, { id: Date.now().toString(), text: "", type: "text" }])
  }

  const updateQuestion = (id: string, updates: Partial<GatheringQuestion>) => {
    setQuestions(questions.map(q => q.id === id ? { ...q, ...updates } : q))
  }

  const removeQuestion = (id: string) => {
    setQuestions(questions.filter(q => q.id !== id))
  }

  const handleCreateGathering = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) {
      toast({ title: "로그인 필요", description: "모임을 개설하려면 로그인이 필요합니다.", variant: "destructive" })
      router.push("/auth?mode=login")
      return
    }

    if (!startDate || !endDate) {
      toast({ title: "일정 선택 필요", description: "모임의 시작일과 종료일을 선택해 주세요.", variant: "destructive" })
      return
    }

    setIsSubmitting(true)
    try {
      const tags = tagInput.split(/[, ]+/).filter(t => t.startsWith('#')).map(t => t.replace('#', ''))
      const finalDescription = description + (detailImages.length > 0 ? "\n\n[첨부 이미지]\n" + detailImages.join("\n") : "");

      const scheduleStr = format(startDate, "yyyy년 M월 d일") + ` ${startTime}` + 
        (startDate.getTime() !== endDate.getTime() 
          ? ` ~ ${format(endDate, "M월 d일")} ${endTime}` 
          : ` ~ ${endTime}`)

      await addDocumentNonBlocking(collection(db, "gatherings"), {
        title,
        summary,
        description: finalDescription,
        tags: tags.length > 0 ? tags : [category],
        creatorId: user.uid,
        creatorName: user.displayName || "익명전문가",
        type,
        location: type === "online" ? "온라인(상세 링크)" : location,
        schedule: scheduleStr,
        startDate: startDate.getTime(),
        endDate: endDate.getTime(),
        capacity: parseInt(capacity),
        sessionCount: parseInt(sessionCount),
        participantCount: 0,
        status: "recruiting",
        category,
        questions: questions.length > 0 ? questions : [],
        imageUrl: imageUrl || `https://picsum.photos/seed/${Date.now()}/800/400`,
        createdAt: Date.now(),
        resources: []
      })
      
      toast({ title: "모임 개설 완료", description: "새로운 HR 지식 모임이 개설되었습니다!" })
      setIsDialogOpen(false)
      setTitle(""); setSummary(""); setTagInput(""); setDescription(""); setLocation(""); setStartDate(undefined); setEndDate(undefined); setCapacity("10"); setSessionCount("6"); setQuestions([]); setImageUrl(null); setDetailImages([]);
    } catch (error) {
      toast({ title: "오류 발생", description: "모임 개설 중 문제가 발생했습니다.", variant: "destructive" })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F5F6F7]">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 py-8 md:py-16">
        <div className="flex flex-col gap-8 mb-16">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-1">
              <h1 className="text-3xl md:text-4xl font-black text-[#1E1E23] tracking-tighter">모임 인텔리전스</h1>
              <p className="text-sm md:text-base font-bold text-[#888]">대한민국 HR 전문가들의 오프라인/온라인 동행</p>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="naver-button h-14 px-10 rounded-xl shadow-xl transition-all gap-3 text-base">
                  <Plus className="w-5 h-5" />
                  신규 모임 만들기
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl bg-white border-none rounded-none p-0 shadow-2xl overflow-hidden max-h-[95vh] flex flex-col">
                <DialogHeader className="bg-white border-b border-black/5 p-8 shrink-0">
                  <DialogTitle className="text-2xl font-black text-accent">새로운 지식 모임 개설</DialogTitle>
                  <p className="text-black/40 text-[10px] font-bold mt-1 uppercase tracking-widest">Create Professional Gathering</p>
                </DialogHeader>
                
                <div className="flex-1 overflow-y-auto">
                  <form onSubmit={handleCreateGathering} className="p-8 md:p-12 space-y-12 pb-32">
                    {/* 썸네일 */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <label className="text-sm font-black text-[#1E1E23]">썸네일 이미지</label>
                        <Badge className="bg-primary text-white border-none rounded-sm px-2 py-0.5 text-[10px] font-black">필수</Badge>
                      </div>
                      <div className="flex flex-col md:flex-row gap-8">
                        <div className="w-48 h-48 bg-[#F5F6F7] border border-black/5 rounded-xl flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
                          {imageUrl ? <img src={imageUrl} className="w-full h-full object-cover" alt="preview" /> : <div className="text-center p-4"><ImageIcon className="w-10 h-10 text-black/10 mx-auto mb-2" /><p className="text-[10px] text-black/20 font-bold">PREVIEW</p></div>}
                        </div>
                        <div onClick={() => fileInputRef.current?.click()} className="flex-1 border-2 border-dashed border-black/10 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-all p-8 bg-[#FBFBFC] group">
                          <div className="text-center">
                            <ImageIcon className="w-8 h-8 text-black/10 mx-auto mb-4 group-hover:text-primary transition-colors" />
                            <p className="text-sm font-bold text-primary mb-1">파일 선택 또는 드래그 앤 드롭</p>
                            <p className="text-xs text-black/30 font-medium">권장 크기: 800px × 600px (4:3 비율)</p>
                          </div>
                        </div>
                        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageChange} />
                      </div>
                    </div>

                    <div className="bg-[#FBFBFC] p-8 space-y-10 border border-black/5 rounded-2xl">
                      <h3 className="text-base font-black text-accent flex items-center gap-2">
                        <div className="w-1.5 h-5 bg-primary rounded-full"></div>
                        기본 모임 정보
                      </h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        <div className="space-y-6">
                          <div className="space-y-3">
                            <label className="text-[11px] font-black text-[#1E1E23]/40 uppercase tracking-widest ml-1">카테고리</label>
                            <Select value={category} onValueChange={setCategory}>
                              <SelectTrigger className="h-12 bg-white border-black/10 rounded-xl font-bold shadow-sm">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {GATHERING_CATEGORIES.filter(c => c !== "전체").map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div className="space-y-3">
                            <label className="text-[11px] font-black text-[#1E1E23]/40 uppercase tracking-widest ml-1">진행 방식</label>
                            <div className="grid grid-cols-2 gap-3">
                              <Button 
                                type="button" 
                                onClick={() => setType('online')} 
                                variant={type === 'online' ? 'default' : 'outline'} 
                                className={cn("rounded-xl font-black h-12 gap-2 transition-all", type === 'online' ? "bg-primary text-white shadow-lg" : "bg-white border-black/10 text-black/30")}
                              >
                                <Globe className="w-4 h-4" /> 온라인
                              </Button>
                              <Button 
                                type="button" 
                                onClick={() => setType('offline')} 
                                variant={type === 'offline' ? 'default' : 'outline'} 
                                className={cn("rounded-xl font-black h-12 gap-2 transition-all", type === 'offline' ? "bg-primary text-white shadow-lg" : "bg-white border-black/10 text-black/30")}
                              >
                                <MapPin className="w-4 h-4" /> 오프라인
                              </Button>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-6">
                          <div className="space-y-3">
                            <label className="text-[11px] font-black text-[#1E1E23]/40 uppercase tracking-widest ml-1">모임 일정 및 시간</label>
                            <div className="space-y-3">
                              <div className="grid grid-cols-2 gap-2">
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <Button variant="outline" className="h-12 bg-white border-black/10 rounded-xl font-bold shadow-sm justify-start gap-2">
                                      <CalendarIcon className="w-4 h-4 text-black/20" />
                                      {startDate ? format(startDate, "yyyy-MM-dd") : "시작일"}
                                    </Button>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-auto p-0 z-[100] min-w-fit bg-white shadow-2xl border-none" align="start">
                                    <Calendar 
                                      mode="single" 
                                      selected={startDate} 
                                      onSelect={(date) => setStartDate(date || undefined)} 
                                      initialFocus 
                                      locale={ko} 
                                    />
                                  </PopoverContent>
                                </Popover>
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <Button variant="outline" className="h-12 bg-white border-black/10 rounded-xl font-bold shadow-sm justify-start gap-2">
                                      <CalendarIcon className="w-4 h-4 text-black/20" />
                                      {endDate ? format(endDate, "yyyy-MM-dd") : "종료일"}
                                    </Button>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-auto p-0 z-[100] min-w-fit bg-white shadow-2xl border-none" align="start">
                                    <Calendar 
                                      mode="single" 
                                      selected={endDate} 
                                      onSelect={(date) => setEndDate(date || undefined)} 
                                      initialFocus 
                                      locale={ko} 
                                    />
                                  </PopoverContent>
                                </Popover>
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                <div className="flex items-center gap-2 bg-white border border-black/10 rounded-xl px-3 h-12 shadow-sm">
                                  <Clock className="w-4 h-4 text-black/20" />
                                  <Input 
                                    type="time" 
                                    value={startTime} 
                                    onChange={(e) => setStartTime(e.target.value)} 
                                    className="border-none shadow-none focus-visible:ring-0 p-0 font-bold"
                                  />
                                </div>
                                <div className="flex items-center gap-2 bg-white border border-black/10 rounded-xl px-3 h-12 shadow-sm">
                                  <Clock className="w-4 h-4 text-black/20" />
                                  <Input 
                                    type="time" 
                                    value={endTime} 
                                    onChange={(e) => setEndTime(e.target.value)} 
                                    className="border-none shadow-none focus-visible:ring-0 p-0 font-bold"
                                  />
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-3">
                              <label className="text-[11px] font-black text-[#1E1E23]/40 uppercase tracking-widest ml-1">정원(명)</label>
                              <Input type="number" value={capacity} onChange={e => setCapacity(e.target.value)} required className="h-12 bg-white border-black/10 rounded-xl font-bold shadow-sm" />
                            </div>
                            <div className="space-y-3">
                              <label className="text-[11px] font-black text-[#1E1E23]/40 uppercase tracking-widest ml-1">총 회차(회)</label>
                              <Input type="number" value={sessionCount} onChange={e => setSessionCount(e.target.value)} required className="h-12 bg-white border-black/10 rounded-xl font-bold shadow-sm" />
                            </div>
                          </div>
                        </div>
                      </div>

                      {type === 'offline' && (
                        <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                          <label className="text-[11px] font-black text-[#1E1E23]/40 uppercase tracking-widest ml-1">오프라인 장소</label>
                          <Input value={location} onChange={e => setLocation(e.target.value)} placeholder="상세 주소를 입력하세요" className="h-12 bg-white border-black/10 rounded-xl font-bold shadow-sm" />
                        </div>
                      )}
                    </div>

                    <div className="space-y-8">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2"><label className="text-sm font-black text-[#1E1E23]">모임 제목</label><Badge className="bg-primary text-white border-none rounded-sm px-2 py-0.5 text-[10px] font-black">필수</Badge></div>
                          <span className="text-[11px] font-bold text-black/20">{title.length}/50</span>
                        </div>
                        <Input value={title} onChange={e => setTitle(e.target.value.slice(0, 50))} required placeholder="모임의 목적이 잘 드러나는 제목" className="h-14 bg-white border-black/10 rounded-xl font-black text-lg focus-visible:ring-primary/30 shadow-sm" />
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2"><label className="text-sm font-black text-[#1E1E23]">한 줄 요약</label><Badge className="bg-primary text-white border-none rounded-sm px-2 py-0.5 text-[10px] font-black">필수</Badge></div>
                          <span className="text-[11px] font-bold text-black/20">{summary.length}/100</span>
                        </div>
                        <Input value={summary} onChange={e => setSummary(e.target.value.slice(0, 100))} required placeholder="카드 리스트에 노출될 요약 문구" className="h-12 bg-white border-black/10 rounded-xl font-bold text-base focus-visible:ring-primary/30 shadow-sm" />
                      </div>
                    </div>

                    {/* 다중 설문 빌더 */}
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <label className="text-sm font-black text-[#1E1E23]">참가 신청자 사전 설문</label>
                          <Badge className="bg-blue-500 text-white border-none rounded-sm px-2 py-0.5 text-[10px] font-black">최대 10개</Badge>
                        </div>
                        <Button type="button" variant="outline" onClick={addQuestion} className="h-9 gap-2 border-primary/20 text-primary font-black rounded-lg">
                          <ListPlus className="w-4 h-4" /> 질문 추가
                        </Button>
                      </div>
                      
                      <div className="space-y-4">
                        {questions.length === 0 ? (
                          <div className="py-10 text-center border-2 border-dashed border-black/5 rounded-2xl bg-[#FBFBFC]">
                            <p className="text-[11px] font-bold text-black/20 uppercase tracking-widest">설문 질문이 없습니다.</p>
                          </div>
                        ) : (
                          questions.map((q, idx) => (
                            <div key={q.id} className="p-6 bg-[#FBFBFC] border border-black/5 rounded-2xl space-y-4 animate-in fade-in slide-in-from-top-2">
                              <div className="flex items-center justify-between gap-4">
                                <Badge className="bg-black/10 text-black/40 font-black border-none h-6 w-6 p-0 flex items-center justify-center rounded-full text-[10px] shrink-0">{idx + 1}</Badge>
                                <Input 
                                  value={q.text} 
                                  onChange={e => updateQuestion(q.id, { text: e.target.value })} 
                                  placeholder="질문 내용을 입력하세요 (예: 신청 이유가 무엇인가요?)" 
                                  className="flex-1 h-11 border-black/10 rounded-xl font-bold text-sm shadow-sm"
                                />
                                <Select value={q.type} onValueChange={(val: any) => updateQuestion(q.id, { type: val })}>
                                  <SelectTrigger className="w-32 h-11 border-black/10 rounded-xl font-bold shadow-sm">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="text">주관식</SelectItem>
                                    <SelectItem value="multiple">객관식</SelectItem>
                                  </SelectContent>
                                </Select>
                                <Button type="button" variant="ghost" size="icon" onClick={() => removeQuestion(q.id)} className="text-red-400 hover:text-red-600 hover:bg-red-50 shrink-0">
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                              
                              {q.type === 'multiple' && (
                                <div className="pl-10 space-y-3">
                                  <div className="flex items-center gap-2">
                                    <label className="text-[10px] font-black text-black/30 uppercase tracking-widest">선택지 입력 (콤마로 구분)</label>
                                  </div>
                                  <Input 
                                    value={q.options?.join(', ') || ""} 
                                    onChange={e => updateQuestion(q.id, { options: e.target.value.split(',').map(s => s.trim()).filter(s => s) })} 
                                    placeholder="예: 초급, 중급, 고급" 
                                    className="h-10 border-black/10 rounded-xl font-medium text-xs bg-white"
                                  />
                                </div>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <label className="text-sm font-black text-[#1E1E23]">해시태그</label>
                        <Badge className="bg-primary text-white border-none rounded-sm px-2 py-0.5 text-[10px] font-black">필수</Badge>
                      </div>
                      <Input value={tagInput} onChange={e => setTagInput(e.target.value)} required placeholder="#인사전략 #네트워킹 #데이터분석" className="h-12 bg-white border-black/10 rounded-xl font-bold text-sm shadow-sm" />
                    </div>

                    <div className="space-y-4">
                      <label className="text-sm font-black text-[#1E1E23]">모임 상세 소개</label>
                      <div className="border border-black/10 rounded-2xl overflow-hidden shadow-sm">
                        <div className="bg-[#FBFBFC] border-b border-black/10 p-3 flex items-center gap-2">
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="icon" 
                            className="h-9 w-9 text-black/40 hover:text-primary"
                            onClick={() => detailImageInputRef.current?.click()}
                          >
                            <ImageIcon className="w-5 h-5" />
                          </Button>
                          <input 
                            type="file" 
                            ref={detailImageInputRef} 
                            className="hidden" 
                            accept="image/*" 
                            onChange={handleDetailImageChange} 
                          />
                          <Button type="button" variant="ghost" size="icon" className="h-9 w-9 text-black/40 hover:text-primary"><FileText className="w-5 h-5" /></Button>
                          <Button type="button" variant="ghost" size="icon" className="h-9 w-9 text-black/40 hover:text-primary"><Video className="w-5 h-5" /></Button>
                          <div className="w-px h-5 bg-black/10 mx-2" />
                          <Button type="button" variant="ghost" size="icon" className="h-9 w-9 text-black/40 hover:text-primary"><Type className="w-5 h-5" /></Button>
                        </div>
                        <Textarea 
                          value={description} 
                          onChange={e => setDescription(e.target.value)} 
                          required 
                          placeholder="프로그램 내용, 참여 혜택, 커리큘럼 등을 정성껏 작성해 주세요." 
                          className="min-h-[400px] border-none shadow-none focus-visible:ring-0 p-8 text-base font-medium leading-relaxed resize-none" 
                        />
                      </div>
                      
                      {detailImages.length > 0 && (
                        <div className="flex flex-wrap gap-4 pt-4">
                          {detailImages.map((img, idx) => (
                            <div key={idx} className="relative w-28 h-28 border border-black/5 rounded-xl group overflow-hidden">
                              <img src={img} className="w-full h-full object-cover" alt="detail" />
                              <button 
                                type="button" 
                                onClick={() => setDetailImages(prev => prev.filter((_, i) => i !== idx))}
                                className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="fixed bottom-0 left-0 right-0 p-6 bg-white/80 backdrop-blur-md border-t border-black/5 flex justify-end z-50">
                      <Button type="submit" disabled={isSubmitting} className="h-14 px-16 naver-button text-lg shadow-2xl rounded-xl">
                        {isSubmitting ? "모임 개설 중..." : "모임 개설 완료하기"}
                      </Button>
                    </div>
                  </form>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="flex flex-col gap-6">
            <div className="relative group">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-black/20 group-focus-within:text-primary transition-colors" />
              <Input 
                value={searchQuery} 
                onChange={e => setSearchQuery(e.target.value)} 
                placeholder="관심 있는 모임 주제나 키워드를 입력해 보세요" 
                className="h-16 pl-16 pr-8 bg-white border-2 border-primary rounded-2xl shadow-lg focus-visible:ring-0 text-lg font-black placeholder:text-black/10" 
              />
            </div>
            <div className="flex overflow-x-auto gap-3 scrollbar-hide py-2">
              {GATHERING_CATEGORIES.map((cat) => (
                <button 
                  key={cat} 
                  onClick={() => setSelectedCategory(cat)} 
                  className={cn(
                    "px-8 py-3.5 rounded-full text-sm font-black transition-all border-2 whitespace-nowrap", 
                    selectedCategory === cat 
                      ? "bg-primary text-white border-primary shadow-lg" 
                      : "bg-white text-black/60 border-black/5 hover:border-primary/30"
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-40"><Sparkles className="w-14 h-14 animate-spin text-primary" /></div>
        ) : filteredGatherings.length === 0 ? (
          <div className="py-40 text-center bg-white border border-black/5 rounded-[3rem]">
            <p className="text-black/20 font-black text-xl">검색 결과와 일치하는 모임이 없습니다.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {filteredGatherings.map((g) => {
              const isClosed = g.status === 'closed' || g.participantCount >= g.capacity;
              return (
                <div key={g.id} className="group cursor-pointer flex flex-col h-full bg-white border border-black/[0.06] hover:border-primary/20 hover:shadow-2xl rounded-[2.5rem] overflow-hidden transition-all duration-500" onClick={() => router.push(`/gatherings/${g.id}`)}>
                  <div className="relative aspect-[4/3] w-full overflow-hidden bg-black/5">
                    <Image src={g.imageUrl || "https://images.unsplash.com/photo-1522071820081-009f0129c71c"} alt={g.title} fill className={cn("object-cover transition-transform duration-1000 group-hover:scale-110", isClosed && "grayscale opacity-60")} />
                    <div className="absolute top-5 left-5 flex flex-col gap-2">
                      <Badge className={cn("border-none px-4 py-1.5 rounded-full text-[10px] font-black shadow-lg", isClosed ? "bg-black/60 text-white" : "bg-primary text-white")}>{isClosed ? "모집 마감" : "모집 중"}</Badge>
                      <Badge className="bg-white/95 backdrop-blur-sm text-accent font-black border-none px-4 py-1.5 rounded-full text-[10px] shadow-md">#{g.category}</Badge>
                    </div>
                    <div className="absolute bottom-5 right-5"><div className="bg-black/40 backdrop-blur-md px-3 py-1.5 flex items-center gap-2 rounded-full border border-white/10">{g.type === 'online' ? <Globe className="w-3.5 h-3.5 text-primary" /> : <MapPin className="w-3.5 h-3.5 text-primary" />}<span className="text-[10px] font-black text-white uppercase tracking-widest">{g.type}</span></div></div>
                  </div>
                  <div className="p-8 flex-1 flex flex-col">
                    <div className="space-y-4 mb-8">
                      <h3 className="text-xl font-black text-[#1E1E23] group-hover:text-primary transition-colors line-clamp-2 leading-tight min-h-[3.5rem]">{g.title}</h3>
                      {g.summary && <p className="text-sm font-bold text-black/40 line-clamp-2 leading-relaxed">{g.summary}</p>}
                      <div className="flex flex-col gap-2 pt-2">
                        <div className="flex items-center gap-2.5 text-[12px] font-bold text-[#888]"><CalendarIcon className="w-4 h-4 text-primary" /><span>{g.schedule}</span></div>
                        <div className="flex items-center gap-2.5 text-[12px] font-bold text-[#888]"><Clock className="w-4 h-4 text-primary" /><span>총 {g.sessionCount}회차 프로젝트</span></div>
                      </div>
                    </div>
                    <div className="mt-auto space-y-5 pt-6 border-t border-black/5">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-black text-black/30 flex items-center gap-2 uppercase tracking-tighter">Host. <span className="text-accent">@{g.creatorName}</span></span>
                        <span className="text-[12px] font-black text-primary">{g.participantCount} / {g.capacity} 명</span>
                      </div>
                      <div className="space-y-1.5">
                        <Progress value={(g.participantCount / g.capacity) * 100} className="h-1.5 bg-black/5" />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  )
}
