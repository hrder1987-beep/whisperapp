
"use client"

import { useState, useMemo, useRef, useEffect } from "react"
import { Header } from "@/components/chuchot/Header"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection, query, orderBy, addDoc } from "firebase/firestore"
import { TrainingProgram } from "@/lib/types"
import { Calendar, GraduationCap, Plus, ChevronRight, ChevronLeft, Search, Camera, Video, Building2, MessageSquare, Info, X, PlayCircle, BookOpen, Clock } from "lucide-react"
import Image from "next/image"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"
import { MessageDialog } from "@/components/chuchot/MessageDialog"

const PROGRAM_CATEGORIES = [
  { id: "all", name: "전체보기", sub: [] },
  { id: "hrd", name: "HRD", sub: ["핵심인재 육성", "교육계획", "사내강사"] },
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
    companyDescription: "데이터인사이트 연구소는 국내 최고의 HR 데이터 전문 교육 기관입니다.",
    instructorName: "데이터인사이트 연구소",
    category: "ai",
    subCategory: "데이터 분석 실무",
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

  const [currentPage, setCurrentPage] = useState(1)
  const ITEMS_PER_PAGE = 6

  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [companyDescription, setCompanyDescription] = useState("")
  const [instructorName, setInstructorName] = useState("")
  const [category, setCategory] = useState("")
  const [subCategory, setSubCategory] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [videoUrl, setVideoUrl] = useState("")
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const programsQuery = useMemoFirebase(() => {
    if (!db) return null
    return query(collection(db, "trainingPrograms"), orderBy("createdAt", "desc"))
  }, [db])

  const { data: programsData, isLoading } = useCollection<TrainingProgram>(programsQuery)
  
  const programs = useMemo(() => {
    const fetched = programsData || []
    if (fetched.length === 0 && !searchQuery) return MOCK_PROGRAMS
    return fetched
  }, [programsData, searchQuery])

  const filteredPrograms = useMemo(() => {
    return programs.filter(p => {
      const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.instructorName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === "all" || p.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [programs, searchQuery, selectedCategory]);

  const paginatedPrograms = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE
    return filteredPrograms.slice(start, start + ITEMS_PER_PAGE)
  }, [filteredPrograms, currentPage])

  const totalPages = Math.ceil(filteredPrograms.length / ITEMS_PER_PAGE)

  useEffect(() => { setCurrentPage(1) }, [selectedCategory, searchQuery])

  const handleAddProgram = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) {
      toast({ title: "로그인 필요", description: "프로그램 등록을 하려면 로그인이 필요합니다.", variant: "destructive" })
      router.push("/auth?mode=login")
      return
    }
    setIsSubmitting(true)
    try {
      await addDoc(collection(db, "trainingPrograms"), {
        title, description, companyDescription, instructorName, category, subCategory, startDate, endDate,
        videoUrl: videoUrl || null, imageUrl: imageUrl || `https://picsum.photos/seed/${Date.now()}/800/400`,
        userId: user.uid, createdAt: Date.now()
      })
      toast({ title: "등록 완료", description: "프로그램 홍보가 시작되었습니다!" })
      setIsDialogOpen(false)
      setTitle(""); setDescription(""); setInstructorName(""); setCategory(""); setSubCategory(""); setImageUrl(null)
    } catch (error) {
      toast({ title: "오류 발생", description: "문제가 발생했습니다.", variant: "destructive" })
    } finally { setIsSubmitting(false) }
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 py-8 md:py-12">
        <div className="flex flex-col gap-8 mb-12">
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            <div className="space-y-1">
              <h1 className="text-3xl font-black text-primary tracking-tight">프로그램</h1>
              <p className="text-sm font-medium text-primary/40">검증된 교육기관의 솔루션을 한눈에 확인하세요.</p>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-primary text-accent hover:bg-primary/95 font-black h-11 px-6 rounded-xl shadow-lg transition-all gap-2 text-xs border border-accent/20">
                  <Plus className="w-4 h-4" />
                  프로그램 등록
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl bg-white border-none rounded-[2rem] p-10 max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-black text-primary mb-2">프로그램 정보 등록</DialogTitle>
                  <DialogDescription className="text-sm font-bold text-primary/40">전문가들에게 소개할 솔루션의 상세 내용을 입력해 주세요.</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleAddProgram} className="space-y-6 mt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div onClick={() => fileInputRef.current?.click()} className="relative aspect-video bg-primary/5 rounded-xl border-2 border-dashed border-primary/10 flex items-center justify-center cursor-pointer overflow-hidden group hover:border-accent">
                        {imageUrl ? <img src={imageUrl} alt="preview" className="w-full h-full object-cover" /> : <Camera className="w-8 h-8 text-primary/20" />}
                      </div>
                      <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => {
                        const file = e.target.files?.[0]; if (file) {
                          const reader = new FileReader(); reader.onloadend = () => setImageUrl(reader.result as string); reader.readAsDataURL(file);
                        }
                      }} />
                    </div>
                    <div className="space-y-4">
                      <Input value={title} onChange={e => setTitle(e.target.value)} required placeholder="프로그램 제목" className="h-11 bg-primary/5 border-none rounded-xl font-bold" />
                      <Input value={instructorName} onChange={e => setInstructorName(e.target.value)} required placeholder="기관/강사명" className="h-11 bg-primary/5 border-none rounded-xl" />
                      <div className="grid grid-cols-2 gap-4">
                        <Select onValueChange={setCategory} required>
                          <SelectTrigger className="h-11 bg-primary/5 border-none rounded-xl text-xs"><SelectValue placeholder="분류" /></SelectTrigger>
                          <SelectContent>{PROGRAM_CATEGORIES.filter(c => c.id !== "all").map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                        </Select>
                        <Input value={subCategory} onChange={e => setSubCategory(e.target.value)} placeholder="세부주제" className="h-11 bg-primary/5 border-none rounded-xl text-xs" />
                      </div>
                    </div>
                  </div>
                  <Textarea value={description} onChange={e => setDescription(e.target.value)} required placeholder="상세 커리큘럼 소개" className="min-h-[150px] bg-primary/5 border-none rounded-xl p-5 text-sm" />
                  <Button type="submit" disabled={isSubmitting} className="w-full h-14 bg-primary text-accent font-black rounded-xl">솔루션 등록 완료</Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="relative max-w-2xl group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary/20 group-focus-within:text-accent transition-colors" />
            <Input 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="주제나 교육기관을 검색하세요..." 
              className="h-12 pl-12 pr-6 bg-white border-none rounded-xl shadow-sm focus-visible:ring-accent/50 text-sm font-bold placeholder:text-primary/20"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-12">
          {PROGRAM_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={cn(
                "px-5 py-2.5 rounded-xl text-xs font-black transition-all border-2",
                selectedCategory === cat.id 
                  ? "bg-primary text-accent border-primary shadow-md" 
                  : "bg-white text-primary/30 border-primary/5 hover:border-accent/30 hover:text-primary"
              )}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-40"><Clock className="w-12 h-12 animate-spin text-accent" /></div>
        ) : filteredPrograms.length === 0 ? (
          <div className="py-40 text-center bg-white rounded-2xl border border-dashed border-primary/5">
            <p className="text-primary/20 font-black">해당 분야의 프로그램이 준비 중입니다.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {paginatedPrograms.map((p) => (
              <Card key={p.id} className="group bg-white border-primary/5 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all flex flex-col h-full">
                <div className="relative h-48 w-full overflow-hidden">
                  <Image src={p.imageUrl || "https://images.unsplash.com/photo-1524178232363-1fb2b075b655"} alt={p.title} fill className="object-cover transition-transform duration-1000 group-hover:scale-110" />
                  <div className="absolute top-4 left-4">
                    <Badge className="bg-accent text-primary font-black border-none px-2 py-0.5 rounded-sm text-[9px]">#{PROGRAM_CATEGORIES.find(c => c.id === p.category)?.name || "기타"}</Badge>
                  </div>
                </div>
                <CardContent className="p-6 flex-1 flex flex-col">
                  <div className="space-y-3 mb-6">
                    <h3 className="text-base font-black text-primary line-clamp-1 group-hover:text-accent transition-colors">{p.title}</h3>
                    <p className="text-xs font-bold text-primary/40 flex items-center gap-1.5"><Building2 className="w-3.5 h-3.5" /> {p.instructorName}</p>
                    <p className="text-xs font-medium text-primary/40 line-clamp-2 leading-relaxed">{p.description}</p>
                  </div>
                  <div className="mt-auto grid grid-cols-2 gap-2">
                    <Button onClick={() => setSelectedProgram(p)} variant="ghost" className="h-9 rounded-lg bg-primary/5 hover:bg-primary/10 text-primary font-black text-[11px]">상세 정보</Button>
                    <Button onClick={() => setMessageTarget({ id: p.userId, nickname: p.instructorName })} className="h-9 rounded-lg bg-primary text-accent hover:bg-primary/90 font-black text-[11px] gap-1.5 border border-accent/20">
                      <MessageSquare className="w-3.5 h-3.5" /> 문의
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-12">
            <Button variant="ghost" size="icon" disabled={currentPage === 1} onClick={() => setCurrentPage(p => Math.max(1, p - 1))} className="rounded-xl text-primary/40"><ChevronLeft className="w-5 h-5" /></Button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <Button key={page} onClick={() => setCurrentPage(page)} className={cn("w-9 h-9 rounded-xl font-black text-xs transition-all", currentPage === page ? "bg-primary text-accent shadow-md" : "bg-white text-primary/20 shadow-sm")}>{page}</Button>
            ))}
            <Button variant="ghost" size="icon" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} className="rounded-xl text-primary/40"><ChevronRight className="w-5 h-5" /></Button>
          </div>
        )}
      </main>

      {selectedProgram && (
        <Dialog open={!!selectedProgram} onOpenChange={() => setSelectedProgram(null)}>
          <DialogContent className="max-w-3xl bg-white border-none rounded-[2rem] p-0 overflow-hidden shadow-2xl">
            <DialogHeader className="sr-only">
              <DialogTitle>{selectedProgram.title}</DialogTitle>
              <DialogDescription>{selectedProgram.instructorName}</DialogDescription>
            </DialogHeader>
            <div className="relative h-64 md:h-80 w-full">
              <Image src={selectedProgram.imageUrl || "https://images.unsplash.com/photo-1524178232363-1fb2b075b655"} alt={selectedProgram.title} fill className="object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
              <div className="absolute bottom-8 left-8 right-8">
                <h2 className="text-2xl md:text-3xl font-black text-white leading-tight">{selectedProgram.title}</h2>
                <p className="text-accent font-bold mt-2">{selectedProgram.instructorName}</p>
              </div>
            </div>
            <div className="p-8 space-y-6 max-h-[50vh] overflow-y-auto">
              <p className="text-sm leading-relaxed text-primary/70 whitespace-pre-wrap font-medium">{selectedProgram.description}</p>
            </div>
            <div className="p-6 bg-primary/5 flex justify-end">
              <Button onClick={() => setSelectedProgram(null)} className="h-11 px-8 rounded-xl bg-primary text-accent font-black">닫기</Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {messageTarget && <MessageDialog isOpen={!!messageTarget} onClose={() => setMessageTarget(null)} receiverId={messageTarget.id} receiverNickname={messageTarget.nickname} />}
    </div>
  )
}
