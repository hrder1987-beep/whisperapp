
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
import { Plus, Search, Building2, MessageSquare, Camera, Sparkles, Calendar, CreditCard, Link as LinkIcon, Info, Users, Clock, Globe } from "lucide-react"
import Image from "next/image"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"
import { MessageDialog } from "@/components/chuchot/MessageDialog"

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

const MOCK_PROGRAMS: TrainingProgram[] = [
  {
    id: "sample-p1",
    title: "HR 애널리틱스 실무 마스터 클래스",
    description: "데이터로 말하는 HR 담당자를 위한 실무 과정입니다. 파이썬과 태블로를 활용한 인사 데이터 시각화 및 전략 도출 기법을 전수합니다. 실제 사내 데이터를 활용한 캡스톤 프로젝트 포함.",
    instructorName: "데이터인사이트 연구소",
    category: "hrtech",
    startDate: "2024-12-15",
    endDate: "2025-02-28",
    imageUrl: "https://images.unsplash.com/photo-1551288049-bbbda536339a?q=80&w=800",
    userId: "mock-p1",
    createdAt: 1714521600000,
    cost: "1,200,000원",
    websiteUrl: "https://example.com/hr-analytics",
    targetAudience: "데이터 기반 의사결정이 필요한 3년차 이상 인사담당자"
  },
  {
    id: "sample-p2",
    title: "성과 중심의 '애자일 리더십' 워크숍",
    description: "전통적인 인사 고과 방식을 넘어 실시간 피드백과 협업을 끌어내는 애자일 조직 관리법을 배웁니다. 글로벌 IT 기업들의 성공적인 리더십 사례를 바탕으로 우리 조직에 맞는 시스템을 설계합니다.",
    instructorName: "글로벌 코칭 그룹",
    category: "leadership",
    startDate: "2025-01-10",
    endDate: "2025-01-12",
    imageUrl: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=800",
    userId: "mock-p2",
    createdAt: 1714608000000,
    cost: "850,000원",
    websiteUrl: "https://example.com/agile-leadership",
    targetAudience: "조직 체계 개편을 고민 중인 팀장 및 임원"
  },
  {
    id: "sample-p3",
    title: "생성형 AI 기반 '채용 브랜딩' 혁신 과정",
    description: "채용 공고 작성부터 면접 질문 생성까지, ChatGPT와 미드저니를 활용해 채용 브랜딩의 퀄리티를 300% 향상시키는 노하우를 공개합니다. HR 실무 시간을 획기적으로 줄여드립니다.",
    instructorName: "AI HR 솔루션즈",
    category: "recruitment",
    startDate: "2024-12-20",
    endDate: "2024-12-21",
    imageUrl: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?q=80&w=800",
    userId: "mock-p3",
    createdAt: 1714694400000,
    cost: "450,000원",
    websiteUrl: "https://example.com/ai-recruitment",
    targetAudience: "채용 효율화와 브랜딩 강화를 원하는 리크루터"
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

  // Registration Form States
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [instructorName, setInstructorName] = useState("")
  const [category, setCategory] = useState("")
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [cost, setCost] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [websiteUrl, setWebsiteUrl] = useState("")
  const [targetAudience, setTargetAudience] = useState("")
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
        title, 
        description, 
        instructorName, 
        category, 
        imageUrl: imageUrl || `https://picsum.photos/seed/${Date.now()}/800/400`,
        cost,
        startDate,
        endDate,
        websiteUrl,
        targetAudience,
        userId: user.uid, 
        createdAt: Date.now()
      })
      toast({ title: "등록 완료", description: "솔루션 정보가 성공적으로 게시되었습니다." })
      setIsDialogOpen(false)
      // Reset states
      setTitle(""); setDescription(""); setInstructorName(""); setImageUrl(null); 
      setCost(""); setStartDate(""); setEndDate(""); setWebsiteUrl(""); setTargetAudience("")
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
              <DialogContent className="max-w-4xl bg-white border-none rounded-[2.5rem] p-0 shadow-2xl overflow-hidden max-h-[95vh] flex flex-col">
                <DialogHeader className="bg-white border-b border-black/5 p-8 shrink-0">
                  <DialogTitle className="text-2xl font-black text-accent">전문 솔루션 프로그램 등록</DialogTitle>
                  <p className="text-black/40 text-[10px] font-bold mt-1 uppercase tracking-widest">Register Training Program & Solution</p>
                </DialogHeader>
                <div className="flex-1 overflow-y-auto">
                  <form onSubmit={handleAddProgram} className="p-10 space-y-12 pb-24">
                    {/* Basic Info & Media */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                      <div className="space-y-4">
                        <label className="text-[11px] font-black text-accent/40 uppercase tracking-widest ml-1 flex items-center gap-2"><Camera className="w-3.5 h-3.5" /> 대표 이미지</label>
                        <div onClick={() => fileInputRef.current?.click()} className="relative aspect-video bg-[#F5F6F7] border-2 border-dashed border-black/10 flex items-center justify-center cursor-pointer rounded-2xl overflow-hidden group hover:border-primary shadow-inner">
                          {imageUrl ? <img src={imageUrl} alt="preview" className="w-full h-full object-cover" /> : <div className="text-center"><Camera className="w-10 h-10 text-black/10 group-hover:text-primary transition-colors mx-auto mb-2" /><p className="text-[10px] font-bold text-black/20">권장: 16:9 비율</p></div>}
                        </div>
                        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => {
                          const file = e.target.files?.[0]; if (file) { const reader = new FileReader(); reader.onloadend = () => setImageUrl(reader.result as string); reader.readAsDataURL(file); }
                        }} />
                      </div>
                      <div className="space-y-6">
                        <div className="space-y-2">
                          <label className="text-[11px] font-black text-accent/40 uppercase tracking-widest ml-1">프로그램 명</label>
                          <Input value={title} onChange={e => setTitle(e.target.value)} required placeholder="과정 제목을 입력하세요" className="h-12 bg-[#F5F6F7] border-none rounded-xl font-bold shadow-inner" />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[11px] font-black text-accent/40 uppercase tracking-widest ml-1">제공 기관/강사명</label>
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

                    {/* Detailed Info Grid */}
                    <div className="bg-[#F5F6F7] p-8 rounded-3xl space-y-8 border border-black/5 shadow-inner">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-2">
                          <label className="text-[11px] font-black text-accent/40 uppercase tracking-widest ml-1 flex items-center gap-2"><CreditCard className="w-3.5 h-3.5" /> 참여 비용</label>
                          <Input value={cost} onChange={e => setCost(e.target.value)} placeholder="예: 500,000원 또는 무료" className="h-12 bg-white border-none rounded-xl font-bold" />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[11px] font-black text-accent/40 uppercase tracking-widest ml-1 flex items-center gap-2"><Users className="w-3.5 h-3.5" /> 교육 대상</label>
                          <Input value={targetAudience} onChange={e => setTargetAudience(e.target.value)} placeholder="예: 인사팀 팀장급 이상" className="h-12 bg-white border-none rounded-xl font-bold" />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-2">
                          <label className="text-[11px] font-black text-accent/40 uppercase tracking-widest ml-1 flex items-center gap-2"><Calendar className="w-3.5 h-3.5" /> 교육 일정 (시작일 ~ 종료일)</label>
                          <div className="flex items-center gap-2">
                            <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="h-12 bg-white border-none rounded-xl font-bold" />
                            <span className="font-bold text-black/20">~</span>
                            <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="h-12 bg-white border-none rounded-xl font-bold" />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[11px] font-black text-accent/40 uppercase tracking-widest ml-1 flex items-center gap-2"><LinkIcon className="w-3.5 h-3.5" /> 홈페이지 / 과정 소개 링크</label>
                          <Input value={websiteUrl} onChange={e => setWebsiteUrl(e.target.value)} placeholder="https://..." className="h-12 bg-white border-none rounded-xl font-bold" />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[11px] font-black text-accent/40 uppercase tracking-widest ml-1 flex items-center gap-2"><Info className="w-3.5 h-3.5" /> 상세 프로그램 소개</label>
                      <Textarea value={description} onChange={e => setDescription(e.target.value)} required placeholder="커리큘럼, 시간표, 기대 효과 등을 동료 전문가들이 충분히 이해할 수 있도록 상세히 적어주세요." className="min-h-[300px] bg-[#F5F6F7] border-none rounded-2xl p-8 text-base leading-relaxed font-medium shadow-inner resize-none" />
                    </div>

                    <Button type="submit" disabled={isSubmitting} className="w-full h-16 naver-button text-lg rounded-xl shadow-2xl hover:scale-[1.01] transition-all">
                      {isSubmitting ? "정보 등록 중..." : "솔루션 정보 게시 완료"}
                    </Button>
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
                  {p.cost && (
                    <div className="absolute bottom-4 right-4">
                      <Badge className="bg-black/60 backdrop-blur-md text-white font-black border-none px-3 py-1 rounded-lg text-[10px]">{p.cost}</Badge>
                    </div>
                  )}
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
          <DialogContent className="max-w-4xl bg-white border-none rounded-[3rem] p-0 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <DialogHeader className="sr-only"><DialogTitle>{selectedProgram.title}</DialogTitle></DialogHeader>
            <div className="flex-1 overflow-y-auto">
              <div className="relative h-80 md:h-[450px] w-full">
                <Image src={selectedProgram.imageUrl || "https://images.unsplash.com/photo-1524178232363-1fb2b075b655"} alt={selectedProgram.title} fill className="object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent"></div>
                <div className="absolute bottom-12 left-12 right-12">
                  <Badge className="bg-primary text-white font-black border-none px-5 py-1.5 rounded-full text-xs mb-6 shadow-xl">#{PROGRAM_CATEGORIES.find(c => c.id === selectedProgram.category)?.name}</Badge>
                  <h2 className="text-3xl md:text-5xl font-black text-white leading-tight tracking-tight mb-4">{selectedProgram.title}</h2>
                  <p className="text-primary font-black flex items-center gap-3 text-xl"><Building2 className="w-6 h-6" /> {selectedProgram.instructorName}</p>
                </div>
              </div>

              <div className="p-12 space-y-12">
                {/* Highlights Bar */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="bg-[#F5F6F7] p-6 rounded-2xl space-y-1">
                    <p className="text-[10px] font-black text-black/20 uppercase tracking-widest flex items-center gap-2"><CreditCard className="w-3.5 h-3.5 text-primary" /> 참여 비용</p>
                    <p className="text-lg font-black text-accent">{selectedProgram.cost || "별도 문의"}</p>
                  </div>
                  <div className="bg-[#F5F6F7] p-6 rounded-2xl space-y-1">
                    <p className="text-[10px] font-black text-black/20 uppercase tracking-widest flex items-center gap-2"><Calendar className="w-3.5 h-3.5 text-primary" /> 교육 일정</p>
                    <p className="text-base font-black text-accent">{selectedProgram.startDate ? `${selectedProgram.startDate} ~ ${selectedProgram.endDate}` : "상시 운영"}</p>
                  </div>
                  <div className="bg-[#F5F6F7] p-6 rounded-2xl space-y-1">
                    <p className="text-[10px] font-black text-black/20 uppercase tracking-widest flex items-center gap-2"><Users className="w-3.5 h-3.5 text-primary" /> 권장 대상</p>
                    <p className="text-base font-black text-accent line-clamp-1">{selectedProgram.targetAudience || "전체 전문가"}</p>
                  </div>
                  <div className="bg-[#F5F6F7] p-6 rounded-2xl flex flex-col justify-center">
                    {selectedProgram.websiteUrl ? (
                      <Button variant="outline" onClick={() => window.open(selectedProgram.websiteUrl, '_blank')} className="w-full h-full border-primary/20 text-primary font-black gap-2 hover:bg-primary/5 rounded-xl">
                        <Globe className="w-4 h-4" /> 홈페이지 방문
                      </Button>
                    ) : (
                      <p className="text-[10px] font-black text-black/20 text-center uppercase">상세 페이지 없음</p>
                    )}
                  </div>
                </div>

                <div className="space-y-6">
                  <h4 className="text-sm font-black text-accent/30 uppercase tracking-[0.2em] flex items-center gap-3">
                    <div className="w-8 h-px bg-accent/10"></div> 프로그램 상세 소개
                  </h4>
                  <p className="text-lg leading-relaxed text-accent/80 whitespace-pre-wrap font-medium">{selectedProgram.description}</p>
                </div>
              </div>
            </div>
            <div className="p-8 bg-[#F5F6F7] border-t border-black/5 flex justify-end gap-4">
              <Button onClick={() => {
                if (!user) { toast({ title: "로그인 필요", description: "문의를 위해 로그인이 필요합니다.", variant: "destructive" }); return; }
                setMessageTarget({ id: selectedProgram.userId, nickname: selectedProgram.instructorName })
              }} className="h-14 px-10 rounded-xl naver-button text-base gap-3 shadow-xl hover:scale-105 transition-all">
                <MessageSquare className="w-5 h-5" /> 전문가 상담 신청
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
