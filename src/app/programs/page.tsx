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
    id: "sample-p1",
    title: "HR 애널리틱스 실무 마스터 클래스",
    description: "데이터로 말하는 HR 담당자를 위한 실무 과정입니다. 파이썬과 태블로를 활용한 인사 데이터 시각화 및 전략 도출 기법을 전수합니다. 실제 사내 데이터를 활용한 캡스톤 프로젝트 포함.",
    instructorName: "데이터인사이트 연구소",
    category: "ai",
    startDate: "2024-12-15",
    endDate: "2025-02-28",
    imageUrl: "https://images.unsplash.com/photo-1551288049-bbbda536339a?q=80&w=800",
    userId: "mock-p1",
    createdAt: 1714521600000
  },
  {
    id: "sample-p2",
    title: "성과 중심의 '애자일 리더십' 워크숍",
    description: "전통적인 인사 고과 방식을 넘어 실시간 피드백과 협업을 끌어내는 애자일 조직 관리법을 배웁니다. 글로벌 IT 기업들의 성공적인 리더십 사례를 바탕으로 우리 조직에 맞는 시스템을 설계합니다.",
    instructorName: "글로벌 코칭 그룹",
    category: "leader",
    startDate: "2025-01-10",
    endDate: "2025-01-12",
    imageUrl: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=800",
    userId: "mock-p2",
    createdAt: 1714608000000
  },
  {
    id: "sample-p3",
    title: "생성형 AI 기반 '채용 브랜딩' 혁신 과정",
    description: "채용 공고 작성부터 면접 질문 생성까지, ChatGPT와 미드저니를 활용해 채용 브랜딩의 퀄리티를 300% 향상시키는 노하우를 공개합니다. HR 실무 시간을 획기적으로 줄여드립니다.",
    instructorName: "AI HR 솔루션즈",
    category: "ai",
    startDate: "2024-12-20",
    endDate: "2024-12-21",
    imageUrl: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?q=80&w=800",
    userId: "mock-p3",
    createdAt: 1714694400000
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
    const merged = [...fetched]
    MOCK_PROGRAMS.forEach(mp => { if (!merged.some(p => p.id === mp.id)) merged.push(mp) })
    return merged.sort((a, b) => b.createdAt - a.createdAt)
  }, [programsData])

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
        <div className="flex flex-col gap-8 mb-16">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-1">
              <h1 className="text-3xl md:text-4xl font-black text-[#1E1E23] tracking-tighter">솔루션 및 프로그램</h1>
              <p className="text-sm md:text-base font-bold text-[#888]">검증된 교육기관과 전문가가 제안하는 프리미엄 HR 솔루션</p>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="naver-button h-14 px-10 rounded-xl shadow-xl transition-all gap-3 text-base">
                  <Plus className="w-5 h-5" />
                  신규 프로그램 등록
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl bg-white border-none rounded-[2.5rem] p-0 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
                <DialogHeader className="bg-white border-b border-black/5 p-8 shrink-0">
                  <DialogTitle className="text-2xl font-black text-accent">전문 교육 프로그램 등록</DialogTitle>
                  <p className="text-black/40 text-[10px] font-bold mt-1 uppercase tracking-widest">Register Training Program</p>
                </DialogHeader>
                <div className="flex-1 overflow-y-auto">
                  <form onSubmit={handleAddProgram} className="p-10 space-y-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                      <div onClick={() => fileInputRef.current?.click()} className="relative aspect-video bg-[#F5F6F7] border-2 border-dashed border-black/10 flex items-center justify-center cursor-pointer rounded-2xl overflow-hidden group hover:border-primary shadow-inner">
                        {imageUrl ? <img src={imageUrl} alt="preview" className="w-full h-full object-cover" /> : <Camera className="w-10 h-10 text-black/10 group-hover:text-primary transition-colors" />}
                      </div>
                      <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => {
                        const file = e.target.files?.[0]; if (file) { const reader = new FileReader(); reader.onloadend = () => setImageUrl(reader.result as string); reader.readAsDataURL(file); }
                      }} />
                      <div className="space-y-6">
                        <div className="space-y-2">
                          <label className="text-[11px] font-black text-accent/40 uppercase tracking-widest ml-1">프로그램 명</label>
                          <Input value={title} onChange={e => setTitle(e.target.value)} required placeholder="과정 제목을 입력하세요" className="h-12 bg-[#F5F6F7] border-none rounded-xl font-bold shadow-inner" />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[11px] font-black text-accent/40 uppercase tracking-widest ml-1">기관/강사명</label>
                          <Input value={instructorName} onChange={e => setInstructorName(e.target.value)} required placeholder="소속 및 성함" className="h-12 bg-[#F5F6F7] border-none rounded-xl font-bold shadow-inner" />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[11px] font-black text-accent/40 uppercase tracking-widest ml-1">카테고리</label>
                          <Select onValueChange={setCategory} required>
                            <SelectTrigger className="h-12 bg-[#F5F6F7] border-none rounded-xl font-bold shadow-inner focus:ring-0"><SelectValue placeholder="분류 선택" /></SelectTrigger>
                            <SelectContent>{PROGRAM_CATEGORIES.filter(c => c.id !== "all").map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[11px] font-black text-accent/40 uppercase tracking-widest ml-1">상세 교육 내용</label>
                      <Textarea value={description} onChange={e => setDescription(e.target.value)} required placeholder="커리큘럼, 대상자, 참여 혜택 등을 정성껏 입력해 주세요." className="min-h-[200px] bg-[#F5F6F7] border-none rounded-2xl p-8 text-base leading-relaxed font-medium shadow-inner" />
                    </div>
                    <Button type="submit" disabled={isSubmitting} className="w-full h-14 naver-button text-lg rounded-xl shadow-xl">솔루션 정보 게시 완료</Button>
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
                placeholder="과정명, 교육기관, 키워드로 검색해 보세요" 
                className="h-16 pl-16 pr-8 bg-white border-2 border-primary rounded-2xl shadow-lg focus-visible:ring-0 text-lg font-black placeholder:text-black/10"
              />
            </div>
            <div className="flex overflow-x-auto gap-3 scrollbar-hide py-2">
              {PROGRAM_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={cn(
                    "px-8 py-3.5 rounded-full text-sm font-black transition-all border-2 whitespace-nowrap",
                    selectedCategory === cat.id 
                      ? "bg-primary text-white border-primary shadow-lg" 
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
            <p className="text-black/20 font-black text-xl">등록된 프로그램이 없습니다.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10">
            {filteredPrograms.map((p) => (
              <Card key={p.id} className="group cursor-pointer flex flex-col h-full bg-white border border-black/[0.06] hover:border-primary/20 hover:shadow-2xl rounded-[2.5rem] overflow-hidden transition-all duration-500">
                <div className="relative aspect-[16/10] w-full overflow-hidden bg-black/5" onClick={() => setSelectedProgram(p)}>
                  <Image src={p.imageUrl || "https://images.unsplash.com/photo-1524178232363-1fb2b075b655"} alt={p.title} fill className="object-cover transition-transform duration-1000 group-hover:scale-110" />
                  <div className="absolute top-5 left-5">
                    <Badge className="bg-primary text-white font-black border-none px-4 py-1.5 rounded-full text-[10px] shadow-lg">#{PROGRAM_CATEGORIES.find(c => c.id === p.category)?.name || "기타"}</Badge>
                  </div>
                </div>
                <CardContent className="p-8 flex-1 flex flex-col">
                  <div className="space-y-4 mb-8">
                    <h3 className="text-xl font-black text-accent group-hover:text-primary transition-colors line-clamp-2 leading-tight min-h-[3.5rem]">{p.title}</h3>
                    <p className="text-sm font-bold text-black/40 flex items-center gap-2"><Building2 className="w-4 h-4 text-primary" /> {p.instructorName}</p>
                    <p className="text-sm font-medium text-black/50 line-clamp-2 leading-relaxed">{p.description}</p>
                  </div>
                  <div className="mt-auto grid grid-cols-2 gap-3">
                    <Button onClick={() => setSelectedProgram(p)} variant="ghost" className="h-12 rounded-xl bg-[#F5F6F7] hover:bg-black/5 text-black/40 font-black text-xs">상세 보기</Button>
                    <Button onClick={() => {
                      if (!user) { toast({ title: "로그인 필요", description: "문의를 위해 로그인이 필요합니다.", variant: "destructive" }); return; }
                      setMessageTarget({ id: p.userId, nickname: p.instructorName })
                    }} className="h-12 rounded-xl naver-button text-xs gap-2 shadow-lg transition-transform hover:scale-[1.02]">
                      <MessageSquare className="w-4 h-4" /> 상담 문의
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
          <DialogContent className="max-w-3xl bg-white border-none rounded-[2.5rem] p-0 shadow-2xl overflow-hidden">
            <DialogHeader className="sr-only"><DialogTitle>{selectedProgram.title}</DialogTitle></DialogHeader>
            <div className="relative h-72 md:h-96 w-full">
              <Image src={selectedProgram.imageUrl || "https://images.unsplash.com/photo-1524178232363-1fb2b075b655"} alt={selectedProgram.title} fill className="object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent"></div>
              <div className="absolute bottom-10 left-10 right-10">
                <Badge className="bg-primary text-white font-black border-none px-4 py-1.5 rounded-full text-[10px] mb-4 shadow-xl">#{PROGRAM_CATEGORIES.find(c => c.id === selectedProgram.category)?.name}</Badge>
                <h2 className="text-3xl md:text-4xl font-black text-white leading-tight tracking-tight">{selectedProgram.title}</h2>
                <p className="text-primary font-black mt-3 flex items-center gap-2 text-lg"><Building2 className="w-5 h-5" /> {selectedProgram.instructorName}</p>
              </div>
            </div>
            <div className="p-10 space-y-8 max-h-[50vh] overflow-y-auto bg-white">
              <p className="text-lg leading-relaxed text-accent/80 whitespace-pre-wrap font-medium">{selectedProgram.description}</p>
            </div>
            <div className="p-8 bg-[#F5F6F7] flex justify-end">
              <Button onClick={() => setSelectedProgram(null)} className="h-14 px-12 rounded-xl naver-button text-lg shadow-xl">창 닫기</Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {messageTarget && <MessageDialog isOpen={!!messageTarget} onClose={() => setMessageTarget(null)} receiverId={messageTarget.id} receiverNickname={messageTarget.nickname} />}
    </div>
  )
}
