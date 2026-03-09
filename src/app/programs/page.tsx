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
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection, query, orderBy, addDoc } from "firebase/firestore"
import { TrainingProgram } from "@/lib/types"
import { Plus, Search, MessageSquare, Camera, Sparkles, Globe, Laptop, Calendar, CreditCard, Link as LinkIcon } from "lucide-react"
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
    type: 'program'
  }
]

export default function ProgramsPage() {
  const { user } = useUser()
  const db = useFirestore()
  const { toast } = useToast()
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedProgram, setSelectedProgram] = useState<(TrainingProgram & { detailImageUrl?: string }) | null>(null)
  const [messageTarget, setMessageTarget] = useState<{ id: string, nickname: string } | null>(null)

  const [contentType, setContentType] = useState<"program" | "solution">("program")
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [instructorName, setInstructorName] = useState("")
  const [category, setCategory] = useState("")
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [cost, setCost] = useState("")
  const [startDate, setStartDate] = useState("")
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

  const handleOpenDialog = (open: boolean) => {
    if (open && !user) {
      toast({ title: "로그인 필요", description: "정보를 등록하려면 로그인이 필요합니다.", variant: "destructive" })
      router.push("/auth?mode=login")
      return
    }
    setIsDialogOpen(open)
  }

  const handleAddProgram = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) { router.push("/auth?mode=login"); return; }
    setIsSubmitting(true)
    try {
      await addDoc(collection(db, "trainingPrograms"), {
        type: contentType, title, description, instructorName, category, 
        imageUrl: imageUrl || `https://picsum.photos/seed/${Date.now()}/800/400`,
        cost, startDate: startDate || "상시", endDate: "상시", websiteUrl, targetAudience,
        userId: user.uid, createdAt: Date.now()
      })
      toast({ title: "등록 완료" })
      setIsDialogOpen(false)
      setTitle(""); setDescription(""); setInstructorName(""); setImageUrl(null);
    } catch (error) { toast({ title: "오류", variant: "destructive" }) }
    finally { setIsSubmitting(false) }
  }

  return (
    <div className="min-h-screen bg-[#F5F6F7]">
      <Header />
      <main className="max-w-7xl mx-auto px-4 py-8 md:py-16 pb-24">
        <div className="flex flex-col gap-8 mb-16">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-1">
              <h1 className="text-3xl md:text-4xl font-black text-[#1E1E23] tracking-tighter">솔루션 및 프로그램</h1>
              <p className="text-sm md:text-base font-bold text-[#888]">전문가가 엄선한 프리미엄 교육 프로그램과 HR IT 솔루션</p>
            </div>

            <div className="hidden md:block">
              <Dialog open={isDialogOpen} onOpenChange={handleOpenDialog}>
                <DialogTrigger asChild>
                  <Button className="naver-button h-14 px-10 rounded-xl shadow-xl gap-3 text-base text-white"><Plus className="w-5 h-5" /> 신규 정보 등록</Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl bg-white border-none rounded-none p-0 shadow-2xl overflow-hidden max-h-[95vh] flex flex-col">
                  <DialogHeader className="bg-white border-b border-black/5 p-8 shrink-0 text-left">
                    <DialogTitle className="text-2xl font-black text-accent">전문 콘텐츠 등록</DialogTitle>
                  </DialogHeader>
                  <div className="flex-1 overflow-y-auto p-10">
                    <form onSubmit={handleAddProgram} className="space-y-8">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-2">
                          <label className="text-xs font-black text-accent/40 uppercase tracking-widest ml-1">콘텐츠 종류</label>
                          <div className="flex gap-2">
                            <Button type="button" onClick={() => setContentType('program')} variant={contentType === 'program' ? 'default' : 'outline'} className={cn("flex-1 h-12 rounded-xl font-black", contentType === 'program' ? "bg-accent text-white" : "border-accent/10")}>교육 프로그램</Button>
                            <Button type="button" onClick={() => setContentType('solution')} variant={contentType === 'solution' ? 'default' : 'outline'} className={cn("flex-1 h-12 rounded-xl font-black", contentType === 'solution' ? "bg-accent text-white" : "border-accent/10")}>IT 솔루션</Button>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-black text-accent/40 uppercase tracking-widest ml-1">전문 분야 (카테고리)</label>
                          <Select value={category} onValueChange={setCategory}>
                            <SelectTrigger className="h-12 bg-accent/5 border-none rounded-xl font-bold">
                              <SelectValue placeholder="분야 선택" />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl shadow-3xl border-none">
                              {PROGRAM_CATEGORIES.filter(c => c.id !== "all").map(cat => (
                                <SelectItem key={cat.id} value={cat.id} className="rounded-xl py-3 font-bold">{cat.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-black text-accent/40 uppercase tracking-widest ml-1">과정/솔루션 명칭</label>
                        <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="과정이나 솔루션의 제목을 입력하세요" className="h-14 bg-accent/5 border-none rounded-xl font-black text-lg shadow-inner" required />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-2">
                          <label className="text-xs font-black text-accent/40 uppercase tracking-widest ml-1">제공 기관/강사명</label>
                          <Input value={instructorName} onChange={e => setInstructorName(e.target.value)} placeholder="회사명 혹은 강사 성함" className="h-12 bg-accent/5 border-none rounded-xl font-bold shadow-inner" required />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-black text-accent/40 uppercase tracking-widest ml-1">비용 안내</label>
                          <Input value={cost} onChange={e => setCost(e.target.value)} placeholder="예: 월 50,000원 / 1,200,000원" className="h-12 bg-accent/5 border-none rounded-xl font-bold shadow-inner" />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-black text-accent/40 uppercase tracking-widest ml-1">상세 내용 소개</label>
                        <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="프로그램 혹은 솔루션의 핵심 기능과 차별점을 소개해주세요." className="min-h-[150px] bg-accent/5 border-none rounded-xl p-6 font-medium shadow-inner resize-none" required />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-2">
                          <label className="text-xs font-black text-accent/40 uppercase tracking-widest ml-1">홈페이지 링크</label>
                          <div className="relative">
                            <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-accent/20" />
                            <Input value={websiteUrl} onChange={e => setWebsiteUrl(e.target.value)} placeholder="https://..." className="h-12 pl-11 bg-accent/5 border-none rounded-xl font-bold shadow-inner" />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-black text-accent/40 uppercase tracking-widest ml-1">권장 대상</label>
                          <Input value={targetAudience} onChange={e => setTargetAudience(e.target.value)} placeholder="예: 3년차 이상의 인사담당자" className="h-12 bg-accent/5 border-none rounded-xl font-bold shadow-inner" />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-black text-accent/40 uppercase tracking-widest ml-1">대표 이미지</label>
                        <div onClick={() => fileInputRef.current?.click()} className="relative aspect-[16/9] bg-accent/5 rounded-xl border-2 border-dashed border-accent/10 flex flex-col items-center justify-center cursor-pointer overflow-hidden group">
                          {imageUrl ? <img src={imageUrl} alt="preview" className="w-full h-full object-cover" /> : <Camera className="w-10 h-10 text-accent/10 group-hover:text-primary transition-colors" />}
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all text-white text-xs font-black">이미지 변경</div>
                        </div>
                        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => {
                          const file = e.target.files?.[0]; if (file) { const reader = new FileReader(); reader.onloadend = () => setImageUrl(reader.result as string); reader.readAsDataURL(file); }
                        }} />
                      </div>

                      <Button type="submit" disabled={isSubmitting} className="w-full h-16 naver-button text-lg rounded-xl shadow-2xl text-white font-black">{isSubmitting ? "등록 중..." : "콘텐츠 등록 완료"}</Button>
                    </form>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <div className="relative group">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-black/20 z-10" />
              <Input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="과정명, 솔루션명, 제공기관명으로 검색해 보세요" className="h-16 pl-16 pr-8 bg-white border-2 border-primary rounded-2xl shadow-lg text-lg font-black focus-visible:ring-0" />
            </div>
            
            <div className="hidden md:flex flex-wrap gap-2 md:gap-3 py-2">
              {PROGRAM_CATEGORIES.map((cat) => (
                <button key={cat.id} onClick={() => setSelectedCategory(cat.id)} className={cn("px-8 py-3.5 rounded-full text-xs font-black transition-all border-2 whitespace-nowrap", selectedCategory === cat.id ? "bg-primary text-accent border-primary shadow-md" : "bg-white text-black/30 border-black/5 hover:border-primary/30")}>{cat.name}</button>
              ))}
            </div>

            <div className="md:hidden">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-full h-14 bg-white border-2 border-black/5 rounded-2xl font-black text-accent px-6">
                  <div className="flex items-center gap-2"><span className="text-primary">분류:</span><SelectValue>{PROGRAM_CATEGORIES.find(c => c.id === selectedCategory)?.name}</SelectValue></div>
                </SelectTrigger>
                <SelectContent className="rounded-2xl shadow-3xl border-none p-2">
                  {PROGRAM_CATEGORIES.map((cat) => (<SelectItem key={cat.id} value={cat.id} className="rounded-xl py-3 font-bold">{cat.name}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {isLoading ? ( <div className="flex justify-center py-40"><Sparkles className="w-14 h-14 animate-spin text-primary" /></div> ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10">
            {filteredPrograms.map((p) => (
              <Card key={p.id} className="group cursor-pointer flex flex-col h-full bg-white border border-black/[0.06] hover:border-primary/20 hover:shadow-2xl rounded-[2.5rem] overflow-hidden transition-all duration-500">
                <div className="relative aspect-[16/10] w-full overflow-hidden bg-black/5" onClick={() => setSelectedProgram(p)}>
                  <Image src={p.imageUrl || "https://images.unsplash.com/photo-1524178232363-1fb2b075b655"} alt={p.title} fill className="object-cover transition-transform duration-1000 group-hover:scale-110" />
                </div>
                <CardContent className="p-8 flex-1 flex flex-col">
                  <h3 className="text-xl font-black text-accent group-hover:text-primary transition-colors line-clamp-2 leading-tight mb-4">{p.title}</h3>
                  <div className="mt-auto grid grid-cols-2 gap-3">
                    <Button onClick={() => setSelectedProgram(p)} variant="ghost" className="h-12 rounded-xl bg-[#F5F6F7] text-black/40 font-black text-xs">상세 보기</Button>
                    <Button onClick={() => {
                      if (!user) { toast({ title: "로그인 필요", description: "문의를 위해 로그인이 필요합니다.", variant: "destructive" }); router.push("/auth?mode=login"); return; }
                      setMessageTarget({ id: p.userId, nickname: p.instructorName })
                    }} className="h-12 rounded-xl naver-button text-xs gap-2 text-white"><MessageSquare className="w-4 h-4" /> 상담 문의</Button>
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
              <div className="p-12 space-y-8">
                <h2 className="text-3xl md:text-5xl font-black text-accent">{selectedProgram.title}</h2>
                <div className="flex flex-wrap gap-4">
                  <Badge className="bg-primary text-accent px-4 py-1.5 rounded-full font-black">#{selectedProgram.category.toUpperCase()}</Badge>
                  <span className="text-accent/40 font-bold flex items-center gap-2"><Globe className="w-4 h-4" /> {selectedProgram.instructorName}</span>
                </div>
                <div className="h-px bg-accent/5 w-full"></div>
                <p className="text-lg leading-relaxed text-accent/80 whitespace-pre-wrap">{selectedProgram.description}</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6">
                  <div className="bg-[#FBFBFC] p-6 rounded-2xl space-y-2">
                    <p className="text-[10px] font-black text-accent/30 uppercase tracking-widest">비용 정보</p>
                    <p className="text-lg font-black text-accent flex items-center gap-2"><CreditCard className="w-5 h-5 text-primary" /> {selectedProgram.cost || "별도 문의"}</p>
                  </div>
                  <div className="bg-[#FBFBFC] p-6 rounded-2xl space-y-2">
                    <p className="text-[10px] font-black text-accent/30 uppercase tracking-widest">진행 일정</p>
                    <p className="text-lg font-black text-accent flex items-center gap-2"><Calendar className="w-5 h-5 text-primary" /> {selectedProgram.startDate}</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-8 bg-[#FBFBFC] border-t border-accent/5 flex justify-end gap-4">
              <Button variant="ghost" onClick={() => setSelectedProgram(null)} className="h-14 px-8 rounded-xl font-black text-accent/40">닫기</Button>
              <Button onClick={() => {
                if (!user) { toast({ title: "로그인 필요", description: "문의를 위해 로그인이 필요합니다.", variant: "destructive" }); router.push("/auth?mode=login"); return; }
                setMessageTarget({ id: selectedProgram.userId, nickname: selectedProgram.instructorName })
              }} className="h-14 px-12 naver-button text-white rounded-xl shadow-xl gap-2 font-black">1:1 상담 신청하기 <MessageSquare className="w-5 h-5" /></Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
      {messageTarget && <MessageDialog isOpen={!!messageTarget} onClose={() => setMessageTarget(null)} receiverId={messageTarget.id} receiverNickname={messageTarget.nickname} />}
    </div>
  )
}
