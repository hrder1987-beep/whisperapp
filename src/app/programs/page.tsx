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
        detailImageUrl: detailImageUrl || null, videoUrl: videoUrl || null,
        cost, startDate: startDate || "상시", endDate: endDate || "상시", websiteUrl, targetAudience,
        userId: user.uid, createdAt: Date.now()
      })
      toast({ title: "등록 완료" })
      setIsDialogOpen(false)
      setTitle(""); setDescription(""); setInstructorName(""); setImageUrl(null); setDetailImageUrl(null);
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
                  <Button className="naver-button h-14 px-10 rounded-xl shadow-xl gap-3 text-base"><Plus className="w-5 h-5" /> 신규 정보 등록</Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl bg-white border-none rounded-none p-0 shadow-2xl overflow-hidden max-h-[95vh] flex flex-col">
                  <DialogHeader className="bg-white border-b border-black/5 p-8 shrink-0 text-left">
                    <DialogTitle className="text-2xl font-black text-accent">전문 콘텐츠 등록</DialogTitle>
                  </DialogHeader>
                  <div className="flex-1 overflow-y-auto p-10">
                    <form onSubmit={handleAddProgram} className="space-y-12">
                      <Button type="submit" disabled={isSubmitting} className="w-full h-16 naver-button text-lg rounded-xl shadow-2xl">등록 완료</Button>
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
                    }} className="h-12 rounded-xl naver-button text-xs gap-2"><MessageSquare className="w-4 h-4" /> 상담 문의</Button>
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
            <div className="flex-1 overflow-y-auto">
              <div className="p-12 space-y-8">
                <h2 className="text-3xl md:text-5xl font-black text-accent">{selectedProgram.title}</h2>
                <p className="text-lg leading-relaxed text-accent/80 whitespace-pre-wrap">{selectedProgram.description}</p>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
      {messageTarget && <MessageDialog isOpen={!!messageTarget} onClose={() => setMessageTarget(null)} receiverId={messageTarget.id} receiverNickname={messageTarget.nickname} />}
    </div>
  )
}
