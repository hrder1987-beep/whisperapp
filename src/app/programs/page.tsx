"use client"

import { useState, useMemo, useRef } from "react"
import { Header } from "@/components/chuchot/Header"
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
import { Plus, Search, Building2, MessageSquare, Camera, Sparkles } from "lucide-react"
import Image from "next/image"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"
import { MessageDialog } from "@/components/chuchot/MessageDialog"

const PROGRAM_CATEGORIES = [
  { id: "all", name: "전체", sub: [] },
  { id: "hrd", name: "HRD/교육", sub: ["핵심인재 육성", "교육계획", "사내강사"] },
  { id: "leader", name: "리더십", sub: ["팀장 리더십", "임원 코칭", "성과관리"] },
  { id: "skill", name: "비즈니스 스킬", sub: ["문서작성", "문제해결", "커뮤니케이션"] },
  { id: "ai", name: "DX/생성형 AI", sub: ["ChatGPT", "데이터 분석"] },
  { id: "culture", name: "조직문화", sub: ["조직진단", "가치내재화"] },
]

const MOCK_PROGRAMS: TrainingProgram[] = [
  {
    id: "prog-1",
    title: "HR 애널리틱스 실무 마스터 클래스",
    description: "데이터로 말하는 HR 담당자를 위한 실무 과정입니다. 파이썬과 태블로를 활용한 인사 데이터 시각화 및 전략 도출 기법을 전수합니다.",
    instructorName: "데이터인사이트 연구소",
    category: "ai",
    startDate: "2024-05-15",
    endDate: "2024-06-30",
    imageUrl: "https://images.unsplash.com/photo-1551288049-bbbda536339a?q=80&w=1080",
    userId: "mock-p1",
    createdAt: Date.now()
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
  const [selectedProgram, setSelectedProgram] = useState<TrainingProgram | null>(null)
  const [messageTarget, setMessageTarget] = useState<{ id: string, nickname: string } | null>(null)

  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [instructorName, setInstructorName] = useState("")
  const [category, setCategory] = useState("")
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const programsQuery = useMemoFirebase(() => db ? query(collection(db, "trainingPrograms"), orderBy("createdAt", "desc")) : null, [db])
  const { data: programsData, isLoading } = useCollection<TrainingProgram>(programsQuery)
  
  const programs = useMemo(() => {
    const fetched = programsData || []
    if (fetched.length === 0 && !searchQuery) return MOCK_PROGRAMS
    return fetched
  }, [programsData, searchQuery])

  const filteredPrograms = programs.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) || p.instructorName.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === "all" || p.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const handleAddProgram = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) { toast({ title: "로그인 필요", description: "프로그램 등록을 하려면 로그인이 필요합니다.", variant: "destructive" }); router.push("/auth?mode=login"); return; }
    setIsSubmitting(true)
    try {
      await addDoc(collection(db, "trainingPrograms"), {
        title, description, instructorName, category, imageUrl: imageUrl || `https://picsum.photos/seed/${Date.now()}/800/400`,
        userId: user.uid, createdAt: Date.now()
      })
      toast({ title: "등록 완료", description: "프로그램 정보가 등록되었습니다!" })
      setIsDialogOpen(false); setTitle(""); setDescription(""); setInstructorName(""); setImageUrl(null)
    } catch (error) { toast({ title: "오류", description: "문제가 발생했습니다.", variant: "destructive" }) }
    finally { setIsSubmitting(false) }
  }

  return (
    <div className="min-h-screen bg-[#F5F6F7]">
      <Header />
      <main className="max-w-7xl mx-auto px-4 py-8 md:py-16">
        <div className="flex flex-col gap-10 mb-16">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
            <div className="space-y-3">
              <h1 className="text-3xl md:text-4xl font-black text-[#1E1E23] tracking-tighter">솔루션 및 프로그램</h1>
              <p className="text-sm md:text-base font-bold text-[#888]">검증된 교육기관과 전문가가 제안하는 프리미엄 HR 솔루션</p>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="naver-button h-12 md:h-14 px-8 shadow-md gap-2 text-sm">
                  <Plus className="w-5 h-5" /> 프로그램 등록하기
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl bg-white border-none rounded-none p-0 shadow-2xl overflow-hidden">
                <DialogHeader className="bg-[#1E1E23] p-6">
                  <DialogTitle className="text-xl font-black text-primary">신규 프로그램 등록</DialogTitle>
                  <p className="text-white/40 text-[10px] font-bold mt-0.5 uppercase tracking-widest">Register Training Program</p>
                </DialogHeader>
                <form onSubmit={handleAddProgram} className="p-8 space-y-8 overflow-y-auto max-h-[80vh]">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div onClick={() => fileInputRef.current?.click()} className="relative aspect-video bg-[#F5F6F7] border-2 border-dashed border-black/10 flex items-center justify-center cursor-pointer overflow-hidden group hover:border-primary">
                      {imageUrl ? <img src={imageUrl} alt="preview" className="w-full h-full object-cover" /> : <Camera className="w-8 h-8 text-black/10" />}
                    </div>
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => {
                      const file = e.target.files?.[0]; if (file) { const reader = new FileReader(); reader.onloadend = () => setImageUrl(reader.result as string); reader.readAsDataURL(file); }
                    }} />
                    <div className="space-y-4">
                      <Input value={title} onChange={e => setTitle(e.target.value)} required placeholder="프로그램 제목" className="h-12 bg-white border-black/10 rounded-none font-bold" />
                      <Input value={instructorName} onChange={e => setInstructorName(e.target.value)} required placeholder="교육기관/강사명" className="h-12 bg-white border-black/10 rounded-none" />
                      <Select onValueChange={setCategory} required>
                        <SelectTrigger className="h-12 bg-white border-black/10 rounded-none"><SelectValue placeholder="카테고리 선택" /></SelectTrigger>
                        <SelectContent>{PROGRAM_CATEGORIES.filter(c => c.id !== "all").map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Textarea value={description} onChange={e => setDescription(e.target.value)} required placeholder="커리큘럼 및 상세 특장점을 입력해 주세요." className="min-h-[200px] bg-white border-black/10 rounded-none p-4 text-sm leading-relaxed" />
                  <Button type="submit" disabled={isSubmitting} className="w-full h-14 naver-button text-base">솔루션 정보 게시 완료</Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="flex flex-col md:flex-row md:items-center gap-6">
            <div className="relative flex-1 group">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-black/20 group-focus-within:text-primary transition-colors" />
              <Input 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="주제, 기관명, 키워드로 프로그램을 검색해 보세요" 
                className="h-14 pl-14 pr-6 bg-white border-2 border-primary rounded-none shadow-sm focus-visible:ring-0 text-base font-black placeholder:text-black/10"
              />
            </div>
            <div className="flex overflow-x-auto gap-2 scrollbar-hide py-1">
              {PROGRAM_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={cn(
                    "px-6 py-3 rounded-none text-xs font-black transition-all border-2 whitespace-nowrap",
                    selectedCategory === cat.id 
                      ? "bg-[#1E1E23] text-primary border-[#1E1E23] shadow-md" 
                      : "bg-white text-black/30 border-black/5 hover:border-primary/30 hover:text-[#1E1E23]"
                  )}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-40"><Sparkles className="w-12 h-12 animate-spin text-primary" /></div>
        ) : filteredPrograms.length === 0 ? (
          <div className="py-40 text-center bg-white border border-black/5">
            <p className="text-black/20 font-black text-xl">등록된 프로그램이 없습니다.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 gap-y-12">
            {filteredPrograms.map((p) => (
              <Card key={p.id} className="group cursor-pointer flex flex-col h-full bg-white border border-black/[0.06] hover:border-black/[0.12] transition-all duration-500 rounded-none overflow-hidden">
                <div className="relative aspect-[16/10] w-full overflow-hidden bg-black/5" onClick={() => setSelectedProgram(p)}>
                  <Image src={p.imageUrl || "https://images.unsplash.com/photo-1524178232363-1fb2b075b655"} alt={p.title} fill className="object-cover transition-transform duration-1000 group-hover:scale-105" />
                  <div className="absolute top-4 left-4">
                    <Badge className="bg-primary text-[#1E1E23] font-black border-none px-3 py-1 rounded-none text-[10px]">#{PROGRAM_CATEGORIES.find(c => c.id === p.category)?.name || "기타"}</Badge>
                  </div>
                </div>
                <CardContent className="p-6 flex-1 flex flex-col">
                  <div className="space-y-3 mb-6">
                    <h3 className="text-lg font-black text-[#1E1E23] group-hover:text-primary transition-colors line-clamp-2 leading-tight min-h-[3rem]">{p.title}</h3>
                    <p className="text-xs font-bold text-black/40 flex items-center gap-1.5"><Building2 className="w-3.5 h-3.5" /> {p.instructorName}</p>
                    <p className="text-[13px] font-medium text-black/50 line-clamp-2 leading-relaxed">{p.description}</p>
                  </div>
                  <div className="mt-auto grid grid-cols-2 gap-2">
                    <Button onClick={() => setSelectedProgram(p)} variant="ghost" className="h-10 rounded-none bg-[#F5F6F7] hover:bg-black/5 text-black/40 font-black text-xs">상세 보기</Button>
                    <Button onClick={() => {
                      if (!user) { toast({ title: "로그인 필요", description: "문의를 위해 로그인이 필요합니다.", variant: "destructive" }); return; }
                      setMessageTarget({ id: p.userId, nickname: p.instructorName })
                    }} className="h-10 rounded-none naver-button text-xs gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5" /> 상담 문의
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
          <DialogContent className="max-w-3xl bg-white border-none rounded-none p-0 shadow-2xl overflow-hidden">
            <DialogHeader className="sr-only"><DialogTitle>{selectedProgram.title}</DialogTitle></DialogHeader>
            <div className="relative h-64 md:h-80 w-full">
              <Image src={selectedProgram.imageUrl || "https://images.unsplash.com/photo-1524178232363-1fb2b075b655"} alt={selectedProgram.title} fill className="object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
              <div className="absolute bottom-8 left-8 right-8">
                <Badge className="bg-primary text-[#1E1E23] font-black border-none px-3 py-1 rounded-none text-[10px] mb-3">#{PROGRAM_CATEGORIES.find(c => c.id === selectedProgram.category)?.name}</Badge>
                <h2 className="text-2xl md:text-3xl font-black text-white leading-tight">{selectedProgram.title}</h2>
                <p className="text-primary font-bold mt-2 flex items-center gap-2"><Building2 className="w-4 h-4" /> {selectedProgram.instructorName}</p>
              </div>
            </div>
            <div className="p-8 space-y-6 max-h-[50vh] overflow-y-auto bg-white">
              <p className="text-base leading-relaxed text-[#404040] whitespace-pre-wrap font-medium">{selectedProgram.description}</p>
            </div>
            <div className="p-6 bg-[#F5F6F7] flex justify-end">
              <Button onClick={() => setSelectedProgram(null)} className="h-12 px-10 rounded-none naver-button text-base">창 닫기</Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {messageTarget && <MessageDialog isOpen={!!messageTarget} onClose={() => setMessageTarget(null)} receiverId={messageTarget.id} receiverNickname={messageTarget.nickname} />}
    </div>
  )
}