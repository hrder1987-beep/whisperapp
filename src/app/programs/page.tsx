
"use client"

import { useState, useMemo, useRef } from "react"
import { Header } from "@/components/whisper/Header"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection, query, orderBy, addDoc } from "firebase/firestore"
import { TrainingProgram } from "@/lib/types"
import { Plus, Search, Building2, MessageSquare, Camera, Sparkles, Calendar, CreditCard, Link as LinkIcon, Users, Clock, Globe, Laptop, GraduationCap, Youtube, Video, ImageIcon, X, Type, Bold, Italic, List } from "lucide-react"
import Image from "next/image"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"
import { MessageDialog } from "@/components/whisper/MessageDialog"

const PROGRAM_CATEGORIES = [
  { id: "all", name: "전체" },
  { id: "strategy", name: "인사전략/HRM" },
  { id: "recruitment", name: "채용/리크루팅" },
  { id: "hrd", name: "HRD/교육" },
  { id: "cb", name: "평가/보상(C&B)" },
  { id: "culture", name: "조직문화/EVP" },
  { id: "hrtech", name: "HR 테크/AI" },
  { id: "labor", name: "노무/법률" },
  { id: "leadership", name: "리더십/코칭" },
  { id: "business", name: "비즈니스 스킬" },
  { id: "etc", name: "기타 솔루션" },
]

const MOCK_PROGRAMS: (TrainingProgram & { detailImageUrl?: string })[] = [
  {
    id: "sample-p1",
    title: "HR 애널리틱스 실무 마스터 클래스",
    description: "데이터로 말하는 HR 담당자를 위한 실무 과정입니다. 파이썬과 태블로를 활용한 인사 데이터 시각화 및 전략 도출 기법을 전수합니다.",
    instructorName: "데이터인사이트 연구소",
    category: "hrtech",
    startDate: "2024-12-15",
    endDate: "2025-02-28",
    imageUrl: "https://images.unsplash.com/photo-1551288049-bbbda536339a?q=80&w=800",
    userId: "mock-p1",
    createdAt: 1714521600000,
    cost: "1,200,000원",
    websiteUrl: "https://example.com/hr-analytics",
    targetAudience: "데이터 기반 의사결정이 필요한 3년차 이상 인사담당자",
    type: 'program',
    videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
  },
  {
    id: "sample-s1",
    title: "Whisper LMS - 올인원 인사관리 플랫폼",
    description: "임직원 교육 관리부터 성과 평가까지, 중소/중견 기업에 최적화된 클라우드 기반 HR 솔루션입니다. 24시간 실시간 기술 지원 및 커스터마이징을 지원합니다.",
    instructorName: "위스퍼 테크놀로지",
    category: "hrtech",
    startDate: "상시",
    endDate: "상시",
    imageUrl: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=800",
    userId: "mock-s1",
    createdAt: 1714608000000,
    cost: "월 50,000원 (인당)",
    websiteUrl: "https://example.com/lms-solution",
    targetAudience: "체계적인 교육 관리가 필요한 50인 이상 조직",
    type: 'solution'
  }
]

export default function ProgramsPage() {
  const { user } = useUser()
  const db = useFirestore()
  const { toast } = useToast()
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const detailImageInputRef = useRef<HTMLInputElement>(null)
  
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedProgram, setSelectedProgram] = useState<(TrainingProgram & { detailImageUrl?: string }) | null>(null)
  const [messageTarget, setMessageTarget] = useState<{ id: string, nickname: string } | null>(null)

  // Registration Form States
  const [contentType, setContentType] = useState<"program" | "solution">("program")
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [instructorName, setInstructorName] = useState("")
  const [category, setCategory] = useState("")
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [detailImageUrl, setDetailImageUrl] = useState<string | null>(null)
  const [videoUrl, setVideoUrl] = useState("")
  const [showVideoInput, setShowVideoInput] = useState(false)
  const [cost, setCost] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [websiteUrl, setWebsiteUrl] = useState("")
  const [targetAudience, setTargetAudience] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const programsQuery = useMemoFirebase(() => db ? query(collection(db, "trainingPrograms"), orderBy("createdAt", "desc")) : null, [db])
  const { data: programsData, isLoading } = useCollection<TrainingProgram>(programsQuery)
  
  const programs = useMemo(() => {
    const fetched = (programsData || []) as (TrainingProgram & { detailImageUrl?: string })[]
    const merged = [...fetched]
    MOCK_PROGRAMS.forEach(mp => { if (!merged.some(p => p.id === mp.id)) merged.push(mp) })
    return merged.sort((a, b) => b.createdAt - a.createdAt)
  }, [programsData])

  const filteredPrograms = programs.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) || p.instructorName.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === "all" || p.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>, setter: (val: string | null) => void) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => setter(reader.result as string)
      reader.readAsDataURL(file)
    }
  }

  const handleAddProgram = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) { toast({ title: "로그인 필요", description: "등록을 하려면 로그인이 필요합니다.", variant: "destructive" }); router.push("/auth?mode=login"); return; }
    setIsSubmitting(true)
    try {
      await addDoc(collection(db, "trainingPrograms"), {
        type: contentType,
        title, 
        description, 
        instructorName, 
        category, 
        imageUrl: imageUrl || `https://picsum.photos/seed/${Date.now()}/800/400`,
        detailImageUrl: detailImageUrl || null,
        videoUrl: videoUrl || null,
        cost,
        startDate: startDate || "상시",
        endDate: endDate || "상시",
        websiteUrl,
        targetAudience,
        userId: user.uid, 
        createdAt: Date.now()
      })
      toast({ title: "등록 완료", description: `${contentType === 'program' ? '교육 과정' : '솔루션'} 정보가 성공적으로 게시되었습니다.` })
      setIsDialogOpen(false)
      setTitle(""); setDescription(""); setInstructorName(""); setImageUrl(null); setDetailImageUrl(null); setVideoUrl("");
      setCost(""); setStartDate(""); setEndDate(""); setWebsiteUrl(""); setTargetAudience(""); setShowVideoInput(false);
    } catch (error) { toast({ title: "오류", description: "문제가 발생했습니다.", variant: "destructive" }) }
    finally { setIsSubmitting(false) }
  }

  const getYoutubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  }

  return (
    <div className="min-h-screen bg-[#F5F6F7]">
      <Header />
      <main className="max-w-7xl mx-auto px-4 py-8 md:py-16">
        <div className="flex flex-col gap-8 mb-16">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-1">
              <h1 className="text-3xl md:text-4xl font-black text-[#1E1E23] tracking-tighter">솔루션 및 프로그램</h1>
              <p className="text-sm md:text-base font-bold text-[#888]">전문가가 엄선한 프리미엄 교육 프로그램과 HR IT 솔루션</p>
            </div>

            {/* 웹에서만 등록 가능 */}
            <div className="hidden md:block">
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="naver-button h-14 px-10 rounded-xl shadow-xl transition-all gap-3 text-base">
                    <Plus className="w-5 h-5" />
                    신규 정보 등록
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl bg-white border-none rounded-none p-0 shadow-2xl overflow-hidden max-h-[95vh] flex flex-col">
                  <DialogHeader className="bg-white border-b border-black/5 p-8 shrink-0 text-left">
                    <DialogTitle className="text-2xl font-black text-accent">전문 콘텐츠 등록</DialogTitle>
                    <p className="text-black/40 text-[10px] font-bold mt-1 uppercase tracking-widest">Register Training Program or IT Solution</p>
                  </DialogHeader>
                  
                  <div className="flex-1 overflow-y-auto">
                    <form onSubmit={handleAddProgram} className="p-10 space-y-12 pb-24">
                      <div className="space-y-4">
                        <label className="text-[11px] font-black text-accent/40 uppercase tracking-widest ml-1">콘텐츠 성격 선택</label>
                        <Tabs value={contentType} onValueChange={(v) => setContentType(v as any)} className="w-full">
                          <TabsList className="grid grid-cols-2 h-14 bg-[#F5F6F7] p-1 rounded-2xl">
                            <TabsTrigger value="program" className="rounded-xl font-black gap-2 data-[state=active]:bg-white data-[state=active]:text-accent data-[state=active]:shadow-md">
                              <GraduationCap className="w-4 h-4" /> 교육 프로그램 (과정)
                            </TabsTrigger>
                            <TabsTrigger value="solution" className="rounded-xl font-black gap-2 data-[state=active]:bg-white data-[state=active]:text-accent data-[state=active]:shadow-md">
                              <Laptop className="w-4 h-4" /> IT/HR 솔루션 (플랫폼)
                            </TabsTrigger>
                          </TabsList>
                        </Tabs>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        <div className="space-y-4">
                          <label className="text-[11px] font-black text-accent/40 uppercase tracking-widest ml-1 flex items-center gap-2"><Camera className="w-3.5 h-3.5" /> 대표 썸네일 이미지</label>
                          <div onClick={() => fileInputRef.current?.click()} className="relative aspect-video bg-[#F5F6F7] border-2 border-dashed border-black/10 flex items-center justify-center cursor-pointer rounded-2xl overflow-hidden group hover:border-primary shadow-inner">
                            {imageUrl ? <img src={imageUrl} alt="preview" className="w-full h-full object-cover" /> : <div className="text-center"><Camera className="w-10 h-10 text-black/10 group-hover:text-primary transition-colors mx-auto mb-2" /><p className="text-[10px] font-bold text-black/20">목록에 노출될 썸네일 (16:9)</p></div>}
                          </div>
                          <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => handleImageChange(e, setImageUrl)} />
                        </div>
                        <div className="space-y-6">
                          <div className="space-y-2">
                            <label className="text-[11px] font-black text-accent/40 uppercase tracking-widest ml-1">
                              {contentType === 'program' ? '프로그램 명' : '솔루션/플랫폼 명'}
                            </label>
                            <Input value={title} onChange={e => setTitle(e.target.value)} required placeholder={contentType === 'program' ? "예: 리더십 코칭 클래스" : "예: 클라우드 기반 LMS"} className="h-12 bg-[#F5F6F7] border-none rounded-xl font-bold shadow-inner" />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[11px] font-black text-accent/40 uppercase tracking-widest ml-1">
                              {contentType === 'program' ? '제공 기관/강사명' : '제공 기업명'}
                            </label>
                            <Input value={instructorName} onChange={e => setInstructorName(e.target.value)} required placeholder="소속 및 성함" className="h-12 bg-[#F5F6F7] border-none rounded-xl font-bold shadow-inner" />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[11px] font-black text-accent/40 uppercase tracking-widest ml-1">전문 카테고리</label>
                            <Select onValueChange={setCategory} required>
                              <SelectTrigger className="h-12 bg-[#F5F6F7] border-none rounded-xl font-bold shadow-inner focus:ring-0"><SelectValue placeholder="분류 선택" /></SelectTrigger>
                              <SelectContent className="max-h-80 overflow-y-auto">
                                {PROGRAM_CATEGORIES.filter(c => c.id !== "all").map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>

                      <div className="bg-[#F5F6F7] p-8 rounded-3xl space-y-8 border border-black/5 shadow-inner">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <div className="space-y-2">
                            <label className="text-[11px] font-black text-accent/40 uppercase tracking-widest ml-1 flex items-center gap-2">
                              <CreditCard className="w-3.5 h-3.5 text-primary" /> 
                              {contentType === 'program' ? '참여 비용' : '도입 및 이용 요금'}
                            </label>
                            <Input value={cost} onChange={e => setCost(e.target.value)} placeholder={contentType === 'program' ? "예: 500,000원" : "예: 월 5만원(인당) 또는 별도문의"} className="h-12 bg-white border-none rounded-xl font-bold" />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[11px] font-black text-accent/40 uppercase tracking-widest ml-1 flex items-center gap-2">
                              <Users className="w-3.5 h-3.5 text-primary" /> 
                              {contentType === 'program' ? '교육 권장 대상' : '주요 도입 권장 대상'}
                            </label>
                            <Input value={targetAudience} onChange={e => setTargetAudience(e.target.value)} placeholder={contentType === 'program' ? "예: 인사팀 팀장급 이상" : "예: 50인 이상 스타트업 또는 중견기업"} className="h-12 bg-white border-none rounded-xl font-bold" />
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <div className="space-y-2">
                            <label className="text-[11px] font-black text-accent/40 uppercase tracking-widest ml-1 flex items-center gap-2">
                              <Calendar className="w-3.5 h-3.5 text-primary" /> 
                              {contentType === 'program' ? '교육 일정' : '서비스 운영 및 계약 기간'}
                            </label>
                            <div className="flex items-center gap-2">
                              <Input value={startDate} onChange={e => setStartDate(e.target.value)} placeholder="시작일(또는 상시)" className="h-12 bg-white border-none rounded-xl font-bold" />
                              <span className="font-bold text-black/20">~</span>
                              <Input value={endDate} onChange={e => setEndDate(e.target.value)} placeholder="종료일(또는 상시)" className="h-12 bg-white border-none rounded-xl font-bold" />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <label className="text-[11px] font-black text-accent/40 uppercase tracking-widest ml-1 flex items-center gap-2"><LinkIcon className="w-3.5 h-3.5 text-primary" /> 상세 홈페이지 링크</label>
                            <Input value={websiteUrl} onChange={e => setWebsiteUrl(e.target.value)} placeholder="https://..." className="h-12 bg-white border-none rounded-xl font-bold" />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-10">
                        <div className="space-y-4">
                          <label className="text-sm font-black text-[#1E1E23]">상세 소개 및 홍보</label>
                          <div className="border border-black/10 rounded-2xl overflow-hidden shadow-sm">
                            <div className="bg-[#FBFBFC] border-b border-black/10 p-3 flex items-center gap-2">
                              <Button type="button" variant="ghost" size="icon" className="h-9 w-9 text-black/40 hover:text-primary" onClick={(e) => { e.preventDefault(); e.stopPropagation(); detailImageInputRef.current?.click(); }}><ImageIcon className="w-5 h-5" /></Button>
                              <input type="file" ref={detailImageInputRef} className="hidden" accept="image/*" onChange={(e) => handleImageChange(e, setDetailImageUrl)} />
                              <Button type="button" variant="ghost" size="icon" className={cn("h-9 w-9", showVideoInput ? "text-primary bg-primary/5" : "text-black/40 hover:text-primary")} onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowVideoInput(!showVideoInput); }}><Video className="w-5 h-5" /></Button>
                              <div className="w-px h-5 bg-black/10 mx-2" />
                              <Button type="button" variant="ghost" size="icon" className="h-9 w-9 text-black/40 hover:text-primary"><Type className="w-5 h-5" /></Button>
                              <Button type="button" variant="ghost" size="icon" className="h-9 w-9 text-black/40 hover:text-primary"><Bold className="w-4 h-4" /></Button>
                              <Button type="button" variant="ghost" size="icon" className="h-9 w-9 text-black/40 hover:text-primary"><List className="w-4 h-4" /></Button>
                            </div>

                            <div className="p-0">
                              {showVideoInput && (
                                <div className="bg-primary/5 p-4 border-b border-black/5 flex items-center gap-3">
                                  <Youtube className="w-5 h-5 text-[#FF0000]" />
                                  <Input value={videoUrl} onChange={e => setVideoUrl(e.target.value)} placeholder="유튜브 영상 주소를 입력하세요" className="h-10 bg-white border-black/10 rounded-lg text-sm font-bold" />
                                </div>
                              )}

                              {detailImageUrl && (
                                <div className="p-4 border-b border-black/5 bg-white flex justify-center relative group">
                                  <img src={detailImageUrl} alt="detail preview" className="max-h-60 rounded-lg object-contain shadow-md" />
                                  <Button type="button" variant="destructive" size="icon" className="absolute top-6 right-6 h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => setDetailImageUrl(null)}><X className="w-4 h-4" /></Button>
                                </div>
                              )}

                              <Textarea value={description} onChange={e => setDescription(e.target.value)} required placeholder="내용을 입력하세요" className="min-h-[400px] border-none shadow-none focus-visible:ring-0 p-8 text-base font-medium leading-relaxed resize-none bg-white" />
                            </div>
                          </div>
                        </div>
                      </div>

                      <Button type="submit" disabled={isSubmitting} className="w-full h-16 naver-button text-lg rounded-xl shadow-2xl hover:scale-[1.01] transition-all">등록 완료</Button>
                    </form>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <div className="relative group">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-black/20 group-focus-within:text-primary transition-colors" />
              <Input 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="과정명, 솔루션명, 제공기관명으로 검색해 보세요" 
                className="h-16 pl-16 pr-8 bg-white border-2 border-primary rounded-2xl shadow-lg focus-visible:ring-0 text-lg font-black placeholder:text-black/10"
              />
            </div>
            
            <div className="flex flex-wrap gap-2 md:gap-3 py-2">
              {PROGRAM_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={cn(
                    "px-8 py-3.5 rounded-full text-xs font-black transition-all border-2 whitespace-nowrap",
                    selectedCategory === cat.id 
                      ? "bg-primary text-accent border-primary shadow-md" 
                      : "bg-white text-black/30 border-black/5 hover:border-primary/30"
                  )}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-40"><Sparkles className="w-14 h-14 animate-spin text-primary" /></div>
        ) : filteredPrograms.length === 0 ? (
          <div className="py-40 text-center bg-white border border-black/5 rounded-[3rem]">
            <p className="text-black/20 font-black text-xl">등록된 정보가 없습니다.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10">
            {filteredPrograms.map((p) => (
              <Card key={p.id} className="group cursor-pointer flex flex-col h-full bg-white border border-black/[0.06] hover:border-primary/20 hover:shadow-2xl rounded-[2.5rem] overflow-hidden transition-all duration-500">
                <div className="relative aspect-[16/10] w-full overflow-hidden bg-black/5" onClick={() => setSelectedProgram(p)}>
                  <Image src={p.imageUrl || "https://images.unsplash.com/photo-1524178232363-1fb2b075b655"} alt={p.title} fill className="object-cover transition-transform duration-1000 group-hover:scale-110" />
                  <div className="absolute top-5 left-5 flex flex-col gap-2">
                    <Badge className={cn(
                      "border-none px-4 py-1.5 rounded-full text-[9px] font-black shadow-lg",
                      p.type === 'solution' ? "bg-accent text-white" : "bg-primary text-accent"
                    )}>
                      {p.type === 'solution' ? 'IT 솔루션' : '교육 과정'}
                    </Badge>
                    <Badge className="bg-white/90 backdrop-blur-sm text-accent font-black border-none px-4 py-1.5 rounded-full text-[9px] shadow-sm">#{PROGRAM_CATEGORIES.find(c => c.id === p.category)?.name || "기타"}</Badge>
                  </div>
                  {p.cost && (
                    <div className="absolute bottom-4 right-4">
                      <Badge className="bg-black/60 backdrop-blur-md text-white font-black border-none px-3 py-1 rounded-lg text-[9px]">{p.cost}</Badge>
                    </div>
                  )}
                </div>
                <CardContent className="p-8 flex-1 flex flex-col">
                  <div className="space-y-4 mb-8">
                    <h3 className="text-xl font-black text-accent group-hover:text-primary transition-colors line-clamp-2 leading-tight min-h-[3.5rem]">{p.title}</h3>
                    <p className="text-[12px] font-bold text-black/40 flex items-center gap-2"><Building2 className="w-4 h-4 text-primary" /> {p.instructorName}</p>
                    <p className="text-sm font-medium text-black/50 line-clamp-2 leading-relaxed">{p.description}</p>
                  </div>
                  <div className="mt-auto grid grid-cols-2 gap-3">
                    <Button onClick={() => setSelectedProgram(p)} variant="ghost" className="h-12 rounded-xl bg-[#F5F6F7] hover:bg-black/5 text-black/40 font-black text-xs">상세 보기</Button>
                    <Button onClick={() => {
                      if (!user) { toast({ title: "로그인 필요", description: "문의를 위해 로그인이 필요합니다.", variant: "destructive" }); return; }
                      setMessageTarget({ id: p.userId, nickname: p.instructorName })
                    }} className="h-12 rounded-xl naver-button text-xs gap-2 shadow-lg transition-transform hover:scale-[1.02]">
                      <MessageSquare className="w-4 h-4" /> 도입/상담 문의
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      {selectedProgram && (
        <Dialog open={!!selectedProgram} onOpenChange={() => setSelectedProgram(null)}>
          <DialogContent className="max-w-4xl bg-white border-none rounded-[3rem] p-0 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <DialogHeader className="sr-only">
              <DialogTitle>{selectedProgram.title} 상세 정보</DialogTitle>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto">
              <div className="relative h-80 md:h-[450px] w-full">
                <Image src={selectedProgram.imageUrl || "https://images.unsplash.com/photo-1524178232363-1fb2b075b655"} alt={selectedProgram.title} fill className="object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent"></div>
                <div className="absolute bottom-12 left-12 right-12">
                  <div className="flex gap-2 mb-6">
                    <Badge className={cn(
                      "border-none px-5 py-1.5 rounded-full text-xs shadow-xl font-black",
                      selectedProgram.type === 'solution' ? "bg-accent text-white" : "bg-primary text-accent"
                    )}>
                      {selectedProgram.type === 'solution' ? 'IT 솔루션' : '교육 프로그램'}
                    </Badge>
                    <Badge className="bg-white/20 backdrop-blur-md text-white font-black border-none px-5 py-1.5 rounded-full text-xs shadow-xl">#{PROGRAM_CATEGORIES.find(c => c.id === selectedProgram.category)?.name}</Badge>
                  </div>
                  <h2 className="text-3xl md:text-5xl font-black text-white leading-tight tracking-tight mb-4">{selectedProgram.title}</h2>
                  <p className="text-primary font-black flex items-center gap-3 text-xl"><Building2 className="w-6 h-6" /> {selectedProgram.instructorName}</p>
                </div>
              </div>

              <div className="p-12 space-y-16">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="bg-[#F5F6F7] p-6 rounded-2xl space-y-1">
                    <p className="text-[10px] font-black text-black/20 uppercase tracking-widest flex items-center gap-2">
                      <CreditCard className="w-3.5 h-3.5 text-primary" /> 
                      {selectedProgram.type === 'program' ? '참여 비용' : '도입 및 이용 요금'}
                    </p>
                    <p className="text-lg font-black text-accent">{selectedProgram.cost || "별도 문의"}</p>
                  </div>
                  <div className="bg-[#F5F6F7] p-6 rounded-2xl space-y-1">
                    <p className="text-[10px] font-black text-black/20 uppercase tracking-widest flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-primary" /> 
                      {selectedProgram.type === 'program' ? '교육 일정' : '서비스 운영 기간'}
                    </p>
                    <p className="text-sm font-black text-accent">{selectedProgram.startDate && selectedProgram.endDate ? `${selectedProgram.startDate} ~ ${selectedProgram.endDate}` : "상시 운영"}</p>
                  </div>
                  <div className="bg-[#F5F6F7] p-6 rounded-2xl space-y-1">
                    <p className="text-[10px] font-black text-black/20 uppercase tracking-widest flex items-center gap-2">
                      <Users className="w-3.5 h-3.5 text-primary" /> 
                      {selectedProgram.type === 'program' ? '교육 대상' : '도입 권장 대상'}
                    </p>
                    <p className="text-base font-black text-accent line-clamp-1">{selectedProgram.targetAudience || "전체 전문가"}</p>
                  </div>
                  <div className="bg-[#F5F6F7] p-6 rounded-2xl flex flex-col justify-center">
                    {selectedProgram.websiteUrl ? (
                      <Button variant="outline" onClick={() => window.open(selectedProgram.websiteUrl, '_blank')} className="w-full h-full border-primary/20 text-primary font-black gap-2 hover:bg-primary/5 rounded-xl text-xs">
                        <Globe className="w-4 h-4" /> 공식 홈페이지
                      </Button>
                    ) : (
                      <p className="text-[10px] font-black text-black/20 text-center uppercase">연결 링크 없음</p>
                    )}
                  </div>
                </div>

                {selectedProgram.videoUrl && getYoutubeId(selectedProgram.videoUrl) && (
                  <div className="space-y-6">
                    <h4 className="text-sm font-black text-accent/30 uppercase tracking-[0.2em] flex items-center gap-3">
                      <div className="w-8 h-px bg-accent/10"></div> 홍보 및 소개 영상
                    </h4>
                    <div className="relative w-full aspect-video rounded-3xl overflow-hidden border border-black/5 shadow-2xl bg-black">
                      <iframe
                        width="100%" height="100%"
                        src={`https://www.youtube.com/embed/${getYoutubeId(selectedProgram.videoUrl)}`}
                        title="Program Promotion Video" frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen
                      ></iframe>
                    </div>
                  </div>
                )}

                {selectedProgram.detailImageUrl && (
                  <div className="space-y-6">
                    <h4 className="text-sm font-black text-accent/30 uppercase tracking-[0.2em] flex items-center gap-3">
                      <div className="w-8 h-px bg-accent/10"></div> 상세 안내 이미지
                    </h4>
                    <div className="relative w-full border border-black/5 shadow-xl rounded-3xl overflow-hidden bg-white">
                      <img src={selectedProgram.detailImageUrl} alt="detail information" className="w-full h-auto block" />
                    </div>
                  </div>
                )}

                <div className="space-y-6">
                  <h4 className="text-sm font-black text-accent/30 uppercase tracking-[0.2em] flex items-center gap-3">
                    <div className="w-8 h-px bg-accent/10"></div> 
                    {selectedProgram.type === 'program' ? '프로그램 상세 소개' : '솔루션 주요 기능 및 도입 소개'}
                  </h4>
                  <div className="bg-[#FBFBFC] p-10 rounded-3xl border border-black/5">
                    <p className="text-lg leading-relaxed text-accent/80 whitespace-pre-wrap font-medium">{selectedProgram.description}</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-8 bg-[#F5F6F7] border-t border-black/5 flex justify-end gap-4">
              <Button onClick={() => {
                if (!user) { toast({ title: "로그인 필요", description: "문의를 위해 로그인이 필요합니다.", variant: "destructive" }); return; }
                setMessageTarget({ id: selectedProgram.userId, nickname: selectedProgram.instructorName })
              }} className="h-14 px-10 rounded-xl naver-button text-base gap-3 shadow-xl hover:scale-105 transition-all">
                <MessageSquare className="w-5 h-5" /> 도입/상담 신청
              </Button>
              <Button onClick={() => setSelectedProgram(null)} variant="ghost" className="h-14 px-10 rounded-xl font-black text-black/30 hover:bg-black/5">창 닫기</Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {messageTarget && <MessageDialog isOpen={!!messageTarget} onClose={() => setMessageTarget(null)} receiverId={messageTarget.id} receiverNickname={messageTarget.nickname} />}
    </div>
  )
}
