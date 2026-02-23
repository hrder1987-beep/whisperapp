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
import { useUser, useFirestore, useCollection, useMemoFirebase, addDocumentNonBlocking } from "@/firebase"
import { collection, query, orderBy } from "firebase/firestore"
import { Gathering } from "@/lib/types"
import { Plus, Calendar, Search, Clock, MapPin, Globe, Image as ImageIcon, Info, Video, FileText, Type, HelpCircle, Sparkles } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"
import Image from "next/image"

const GATHERING_CATEGORIES = ["전체", "COP/학습", "네트워킹/친목", "컨퍼런스", "북클럽", "프로젝트"]

export default function GatheringsPage() {
  const { user } = useUser()
  const db = useFirestore()
  const { toast } = useToast()
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

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
  const [schedule, setSchedule] = useState("")
  const [capacity, setCapacity] = useState("10")
  const [sessionCount, setSessionCount] = useState("6")
  const [category, setCategory] = useState("COP/학습")
  const [registrationQuestion, setRegistrationQuestion] = useState("") 
  const [imageUrl, setImageUrl] = useState<string | null>(null)

  const gatheringsQuery = useMemoFirebase(() => {
    if (!db) return null
    return query(collection(db, "gatherings"), orderBy("createdAt", "desc"))
  }, [db])

  const { data: gatheringsData, isLoading } = useCollection<Gathering>(gatheringsQuery)

  const filteredGatherings = useMemo(() => {
    if (!gatheringsData) return []
    return gatheringsData.filter(g => {
      const matchesSearch = g.title.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesCategory = selectedCategory === "전체" || g.category === selectedCategory
      return matchesSearch && matchesCategory
    })
  }, [gatheringsData, searchQuery, selectedCategory])

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => setImageUrl(reader.result as string)
      reader.readAsDataURL(file)
    }
  }

  const handleCreateGathering = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) {
      toast({ title: "로그인 필요", description: "모임을 개설하려면 로그인이 필요합니다.", variant: "destructive" })
      router.push("/auth?mode=login")
      return
    }

    setIsSubmitting(true)
    try {
      const tags = tagInput.split(/[, ]+/).filter(t => t.startsWith('#')).map(t => t.replace('#', ''))
      
      await addDocumentNonBlocking(collection(db, "gatherings"), {
        title,
        summary,
        description,
        tags: tags.length > 0 ? tags : [category],
        creatorId: user.uid,
        creatorName: user.displayName || "익명전문가",
        type,
        location: type === "online" ? "온라인(상세 링크)" : location,
        schedule,
        capacity: parseInt(capacity),
        sessionCount: parseInt(sessionCount),
        participantCount: 0,
        status: "recruiting",
        category,
        registrationQuestion: registrationQuestion.trim() || undefined,
        imageUrl: imageUrl || `https://picsum.photos/seed/${Date.now()}/800/400`,
        createdAt: Date.now(),
        resources: []
      })
      
      toast({ title: "모임 개설 완료", description: "새로운 HR 지식 모임이 개설되었습니다!" })
      setIsDialogOpen(false)
      setTitle(""); setSummary(""); setTagInput(""); setDescription(""); setLocation(""); setSchedule(""); setCapacity("10"); setSessionCount("6"); setRegistrationQuestion(""); setImageUrl(null);
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
        <div className="flex flex-col gap-10 mb-16">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
            <div className="space-y-3">
              <h1 className="text-3xl md:text-4xl font-black text-[#1E1E23] tracking-tighter">모임 인텔리전스</h1>
              <p className="text-sm md:text-base font-bold text-[#888]">대한민국 HR 전문가들의 오프라인/온라인 동행</p>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="naver-button h-12 md:h-14 px-8 shadow-md transition-all gap-2 text-sm">
                  <Plus className="w-5 h-5" />
                  새로운 모임 만들기
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl bg-white border-none rounded-none p-0 shadow-2xl overflow-hidden max-h-[95vh] flex flex-col">
                <DialogHeader className="bg-[#1E1E23] p-6 shrink-0">
                  <DialogTitle className="text-xl font-black text-primary">신규 모임 개설</DialogTitle>
                  <p className="text-white/40 text-[10px] font-bold mt-0.5 uppercase tracking-widest">Create Professional Gathering</p>
                </DialogHeader>
                
                <div className="flex-1 overflow-y-auto">
                  <form onSubmit={handleCreateGathering} className="p-8 md:p-12 space-y-12 pb-32">
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <label className="text-sm font-black text-[#1E1E23]">썸네일 이미지</label>
                        <Badge className="bg-orange-100 text-orange-600 border-none rounded-sm px-1.5 py-0 text-[10px] font-black">필수</Badge>
                      </div>
                      <div className="flex flex-col md:flex-row gap-6">
                        <div className="w-40 h-40 bg-[#F5F6F7] border border-black/5 rounded-sm flex items-center justify-center overflow-hidden shrink-0">
                          {imageUrl ? <img src={imageUrl} className="w-full h-full object-cover" alt="preview" /> : <div className="text-center p-4"><ImageIcon className="w-8 h-8 text-black/10 mx-auto mb-2" /><p className="text-[10px] text-black/20 font-bold">PREVIEW</p></div>}
                        </div>
                        <div onClick={() => fileInputRef.current?.click()} className="flex-1 border-2 border-dashed border-black/10 rounded-sm flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-colors p-6 bg-[#FBFBFC]">
                          <div className="text-center"><ImageIcon className="w-6 h-6 text-black/20 mx-auto mb-3" /><p className="text-xs font-bold text-primary mb-1"><span className="text-primary underline underline-offset-2">이미지를 선택</span>하거나, 이곳에 끌어다 놓으세요</p><p className="text-[10px] text-black/30 font-medium">권장 크기: 440px × 440px</p></div>
                        </div>
                        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageChange} />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2"><label className="text-sm font-black text-[#1E1E23]">제목</label><Badge className="bg-orange-100 text-orange-600 border-none rounded-sm px-1.5 py-0 text-[10px] font-black">필수</Badge></div>
                        <span className="text-[11px] font-bold text-black/20">{title.length}/50</span>
                      </div>
                      <Input value={title} onChange={e => setTitle(e.target.value.slice(0, 50))} required placeholder="한글/영문/숫자/띄어쓰기 포함 50자 이내로 입력해 주세요" className="h-12 bg-white border-black/10 rounded-none font-bold text-base focus-visible:ring-primary/30" />
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2"><label className="text-sm font-black text-[#1E1E23]">설명 문구</label><Badge className="bg-orange-100 text-orange-600 border-none rounded-sm px-1.5 py-0 text-[10px] font-black">필수</Badge></div>
                        <span className="text-[11px] font-bold text-black/20">{summary.length}/100</span>
                      </div>
                      <Input value={summary} onChange={e => setSummary(e.target.value.slice(0, 100))} required placeholder="한글/영문/숫자/띄어쓰기 포함 100자 이내로 입력해 주세요" className="h-12 bg-white border-black/10 rounded-none font-bold text-base focus-visible:ring-primary/30" />
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center gap-2"><label className="text-sm font-black text-[#1E1E23]">참가 신청자에게 물어볼 질문</label><Badge className="bg-blue-100 text-blue-600 border-none rounded-sm px-1.5 py-0 text-[10px] font-black">선택</Badge></div>
                      <Input value={registrationQuestion} onChange={e => setRegistrationQuestion(e.target.value)} placeholder="예: 이 모임에 참여하고 싶은 이유와 현재 담당 업무를 간단히 적어주세요." className="h-12 bg-white border-black/10 rounded-none font-bold text-sm focus-visible:ring-primary/30" />
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center gap-2"><label className="text-sm font-black text-[#1E1E23]">해시 태그</label><Badge className="bg-orange-100 text-orange-600 border-none rounded-sm px-1.5 py-0 text-[10px] font-black">필수</Badge></div>
                      <Input value={tagInput} onChange={e => setTagInput(e.target.value)} required placeholder="키워드 입력 (#ai, #교육 등)" className="h-12 bg-white border-black/10 rounded-none font-bold text-sm focus-visible:ring-primary/30" />
                    </div>

                    <div className="space-y-4">
                      <label className="text-sm font-black text-[#1E1E23]">상세 정보</label>
                      <div className="border border-black/10 rounded-none overflow-hidden">
                        <div className="bg-[#FBFBFC] border-b border-black/10 p-2 flex items-center gap-1">
                          <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-black/40 hover:text-primary"><ImageIcon className="w-4 h-4" /></Button>
                          <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-black/40 hover:text-primary"><FileText className="w-4 h-4" /></Button>
                          <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-black/40 hover:text-primary"><Video className="w-4 h-4" /></Button>
                          <div className="w-px h-4 bg-black/10 mx-1" />
                          <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-black/40 hover:text-primary"><Type className="w-4 h-4" /></Button>
                        </div>
                        <Textarea value={description} onChange={e => setDescription(e.target.value)} required placeholder="전문가들과 나눌 지혜의 상세 내용을 적어주세요." className="min-h-[300px] border-none shadow-none focus-visible:ring-0 p-6 text-sm font-medium leading-relaxed resize-none" />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-black/5">
                      <div className="space-y-6">
                        <div className="space-y-2"><label className="text-[10px] font-black text-[#1E1E23]/40 uppercase tracking-widest ml-1">카테고리</label>
                          <Select value={category} onValueChange={setCategory}><SelectTrigger className="h-12 bg-[#F5F6F7] border-none rounded-none font-bold"><SelectValue /></SelectTrigger><SelectContent>{GATHERING_CATEGORIES.filter(c => c !== "전체").map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select>
                        </div>
                        <div className="space-y-2"><label className="text-[10px] font-black text-[#1E1E23]/40 uppercase tracking-widest ml-1">모임 방식</label>
                          <div className="grid grid-cols-2 gap-2"><Button type="button" onClick={() => setType('online')} variant={type === 'online' ? 'default' : 'outline'} className={cn("rounded-none font-black h-12", type === 'online' ? "naver-button" : "border-black/5")}>온라인</Button><Button type="button" onClick={() => setType('offline')} variant={type === 'offline' ? 'default' : 'outline'} className={cn("rounded-none font-black h-12", type === 'offline' ? "naver-button" : "border-black/5")}>오프라인</Button></div>
                        </div>
                      </div>
                      <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-4"><div className="space-y-2"><label className="text-[10px] font-black text-[#1E1E23]/40 uppercase tracking-widest ml-1">모집 정원(명)</label><Input type="number" value={capacity} onChange={e => setCapacity(e.target.value)} required className="h-12 bg-[#F5F6F7] border-none rounded-none font-bold" /></div><div className="space-y-2"><label className="text-[10px] font-black text-[#1E1E23]/40 uppercase tracking-widest ml-1">전체 회차(회)</label><Input type="number" value={sessionCount} onChange={e => setSessionCount(e.target.value)} required className="h-12 bg-[#F5F6F7] border-none rounded-none font-bold" /></div></div>
                        <div className="space-y-2"><label className="text-[10px] font-black text-[#1E1E23]/40 uppercase tracking-widest ml-1">일정 안내</label><Input value={schedule} onChange={e => setSchedule(e.target.value)} required placeholder="예: 매주 목요일 19:00" className="h-12 bg-[#F5F6F7] border-none rounded-none font-bold" /></div>
                      </div>
                    </div>

                    <div className="fixed bottom-0 left-0 right-0 p-6 bg-white border-t border-black/5 flex justify-end z-50">
                      <Button type="submit" disabled={isSubmitting} className="h-14 px-16 naver-button text-lg">
                        {isSubmitting ? "모임 정보 전송 중..." : "모임 개설 완료하기"}
                      </Button>
                    </div>
                  </form>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="flex flex-col md:flex-row md:items-center gap-6">
            <div className="relative flex-1 group">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-black/20 group-focus-within:text-primary transition-colors" />
              <Input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="모임 제목, 주제, 키워드로 검색해 보세요" className="h-14 pl-14 pr-6 bg-white border-2 border-primary rounded-none shadow-sm focus-visible:ring-0 text-base font-black placeholder:text-black/10" />
            </div>
            <div className="flex overflow-x-auto gap-2 scrollbar-hide py-1">
              {GATHERING_CATEGORIES.map((cat) => (
                <button key={cat} onClick={() => setSelectedCategory(cat)} className={cn("px-6 py-3 rounded-none text-xs font-black transition-all border-2 whitespace-nowrap", selectedCategory === cat ? "bg-[#1E1E23] text-primary border-[#1E1E23] shadow-md" : "bg-white text-black/30 border-black/5 hover:border-primary/30 hover:text-[#1E1E23]")}>{cat}</button>
              ))}
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-40"><Sparkles className="w-12 h-12 animate-spin text-primary" /></div>
        ) : filteredGatherings.length === 0 ? (
          <div className="py-40 text-center bg-white border border-black/5">
            <p className="text-black/20 font-black text-xl">준비된 모임이 없습니다.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-12">
            {filteredGatherings.map((g) => {
              const isClosed = g.status === 'closed' || g.participantCount >= g.capacity;
              return (
                <div key={g.id} className="group cursor-pointer flex flex-col h-full bg-white border border-black/[0.06] hover:border-black/[0.12] transition-all duration-500" onClick={() => router.push(`/gatherings/${g.id}`)}>
                  <div className="relative aspect-[4/3] w-full overflow-hidden bg-black/5">
                    <Image src={g.imageUrl || "https://images.unsplash.com/photo-1522071820081-009f0129c71c"} alt={g.title} fill className={cn("object-cover transition-transform duration-1000 group-hover:scale-105", isClosed && "grayscale opacity-60")} />
                    <div className="absolute top-4 left-4 flex flex-col gap-2">
                      <Badge className={cn("border-none px-3 py-1 rounded-none text-[10px] font-black shadow-lg", isClosed ? "bg-black/60 text-white" : "bg-primary text-[#1E1E23]")}>{isClosed ? "모집 마감" : "모집 중"}</Badge>
                      <Badge className="bg-white/90 backdrop-blur-sm text-[#1E1E23] font-black border-none px-3 py-1 rounded-none text-[10px] shadow-md">#{g.category}</Badge>
                    </div>
                    <div className="absolute top-4 right-4"><div className="bg-black/40 backdrop-blur-sm px-2 py-1 flex items-center gap-1.5 rounded-none border border-white/10">{g.type === 'online' ? <Globe className="w-3 h-3 text-primary" /> : <MapPin className="w-3 h-3 text-primary" />}<span className="text-[9px] font-black text-white uppercase tracking-widest">{g.type}</span></div></div>
                  </div>
                  <div className="p-6 flex-1 flex flex-col">
                    <div className="space-y-3 mb-6">
                      <h3 className="text-lg font-black text-[#1E1E23] group-hover:text-primary transition-colors line-clamp-2 leading-tight min-h-[3rem]">{g.title}</h3>
                      {g.summary && <p className="text-xs font-bold text-black/40 line-clamp-1">{g.summary}</p>}
                      <div className="flex flex-col gap-1.5"><div className="flex items-center gap-2 text-[11px] font-bold text-[#888]"><Calendar className="w-3.5 h-3.5 text-primary" /><span>{g.schedule}</span></div><div className="flex items-center gap-2 text-[11px] font-bold text-[#888]"><Clock className="w-3.5 h-3.5 text-primary" /><span>총 {g.sessionCount}회차 프로젝트</span></div></div>
                    </div>
                    <div className="mt-auto space-y-4 pt-4 border-t border-black/5"><div className="flex items-center justify-between"><span className="text-[11px] font-black text-black/30 flex items-center gap-1.5 uppercase tracking-tighter">Host. <span className="text-[#1E1E23]">@{g.creatorName}</span></span><span className="text-[11px] font-black text-primary">{g.participantCount} / {g.capacity} 명</span></div><div className="space-y-1"><Progress value={(g.participantCount / g.capacity) * 100} className="h-1 bg-black/5" /></div></div>
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