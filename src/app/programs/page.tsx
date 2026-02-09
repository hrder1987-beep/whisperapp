
"use client"

import { useState, useMemo, useRef } from "react"
import { Header } from "@/components/chuchot/Header"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection, query, orderBy, addDoc } from "firebase/firestore"
import { TrainingProgram } from "@/lib/types"
import { Calendar, GraduationCap, Plus, ChevronRight, Search, Camera, Clock, Video, Building2, MessageSquare, Info, X, PlayCircle, BookOpen } from "lucide-react"
import Image from "next/image"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"
import { MessageDialog } from "@/components/chuchot/MessageDialog"

const PROGRAM_CATEGORIES = [
  { id: "all", name: "전체보기", sub: [] },
  { id: "hrd", name: "HRD", sub: ["핵심인재 육성", "연간 교육계획 수립", "교육평가 전문가", "사내강사 양성", "HRDer 자격과정"] },
  { id: "leader", name: "리더십", sub: ["신임 팀장 리더십", "임원 리더십 개발", "코칭/멘토링", "성과관리"] },
  { id: "new", name: "신입사원", sub: ["MZ세대 온보딩", "경력직 조기적응", "신입사원 입문교육"] },
  { id: "skill", name: "비즈니스 스킬", sub: ["기획력/문서작성", "문제해결/의사결정", "전략적 사고", "커뮤니케이션"] },
  { id: "ai", name: "DX/생성형 AI", sub: ["ChatGPT 업무활용", "데이터 분석 실무", "디지털 트랜스포메이션"] },
  { id: "change", name: "변화관리", sub: ["변화혁신", "비전/미션 내재화", "동기부여"] },
  { id: "common", name: "공통역량", sub: ["애자일 협업", "퍼실리테이션", "팔로워십"] },
  { id: "sales", name: "영업/CS", sub: ["영업 전략", "고객만족경영(CS)", "이미지메이킹"] },
  { id: "culture", name: "조직문화/개발", sub: ["조직 진단", "핵심가치 전파", "심리적 안정감"] },
  { id: "public", name: "공공조직 맞춤", sub: ["공공 계층별 교육", "조직 활성화"] },
  { id: "career", name: "커리어/생애설계", sub: ["재취업 지원", "은퇴 설계", "경력 개발"] },
  { id: "lang", name: "어학교육", sub: ["글로벌 비즈니스", "주재원 교육"] },
  { id: "legal", name: "법정의무교육", sub: ["성희롱예방", "개인정보보호", "산업안전", "직장 내 괴롭힘 예방"] },
  { id: "esg", name: "ESG/윤리경영", sub: ["ESG 실무", "기업윤리", "인권경영"] },
  { id: "etc", name: "기타", sub: ["인문학", "힐링 프로그램"] },
]

const MOCK_PROGRAMS: TrainingProgram[] = [
  {
    id: "prog-1",
    title: "HR 애널리틱스 실무 마스터 클래스",
    description: "데이터로 말하는 HR 담당자를 위한 실무 과정입니다. 파이썬과 태블로를 활용한 인사 데이터 시각화 및 전략 도출 기법을 전수합니다. 본 과정은 실무 프로젝트 기반으로 운영되며, 교육 종료 후 즉시 현업에 적용 가능한 템플릿을 제공합니다.\n\n[주요 커리큘럼]\n1. HR 데이터의 이해와 가공\n2. 인사 통계의 기초와 분석 모델링\n3. 대시보드 설계 및 스토리텔링\n4. 데이터 기반 의사결정 프로세스",
    companyDescription: "데이터인사이트 연구소는 국내 최고의 HR 데이터 사이언스 전문 교육 및 컨설팅 기관입니다. 삼성, 현대, SK 등 국내 주요 대기업의 인사 데이터를 분석하고 최적화된 교육 솔루션을 제공하고 있습니다.",
    instructorName: "데이터인사이트 연구소",
    category: "ai",
    subCategory: "데이터 분석 실무",
    startDate: "2024-05-15",
    endDate: "2024-06-30",
    imageUrl: "https://images.unsplash.com/photo-1551288049-bbbda536339a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwyfHxkYXRhJTIwYW5hbHl0aWNzfGVufDB8fHx8MTc3MDI4MTYxN3ww&ixlib=rb-4.1.0&q=80&w=1080",
    videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
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

  // Form States
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

  const handleOpenDialog = () => {
    if (!user) {
      toast({ title: "로그인 필요", description: "프로그램을 등록하시려면 먼저 로그인을 해주세요.", variant: "destructive" })
      router.push("/auth?mode=login")
      return
    }
    setIsDialogOpen(true)
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => setImageUrl(reader.result as string)
      reader.readAsDataURL(file)
    }
  }

  const handleAddProgram = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setIsSubmitting(true)
    try {
      await addDoc(collection(db, "trainingPrograms"), {
        title,
        description,
        companyDescription,
        instructorName,
        category,
        subCategory,
        startDate,
        endDate,
        videoUrl: videoUrl || null,
        imageUrl: imageUrl || `https://picsum.photos/seed/${Date.now()}/800/400`,
        userId: user.uid,
        createdAt: Date.now()
      })
      toast({ title: "등록 완료", description: "프로그램 홍보가 성공적으로 시작되었습니다!" })
      setIsDialogOpen(false)
      // Reset form
      setTitle(""); setDescription(""); setCompanyDescription(""); setInstructorName(""); 
      setCategory(""); setSubCategory(""); setStartDate(""); setEndDate(""); setVideoUrl(""); setImageUrl(null)
    } catch (error) {
      toast({ title: "오류 발생", description: "등록 중 문제가 발생했습니다.", variant: "destructive" })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInquireClick = (p: TrainingProgram) => {
    if (!user) {
      toast({ title: "로그인 필요", description: "문의를 하려면 로그인이 필요합니다.", variant: "destructive" })
      router.push("/auth?mode=login")
      return
    }
    if (user.uid === p.userId) {
      toast({ title: "본인 프로그램", description: "자신이 등록한 프로그램에는 문의할 수 없습니다.", variant: "destructive" })
      return
    }
    setMessageTarget({ id: p.userId, nickname: p.instructorName })
  }

  const selectedCategoryDataForForm = PROGRAM_CATEGORIES.find(c => c.id === category);

  const getYoutubeEmbedUrl = (url?: string) => {
    if (!url) return null;
    let videoId = "";
    if (url.includes("v=")) {
      videoId = url.split("v=")[1].split("&")[0];
    } else if (url.includes("youtu.be/")) {
      videoId = url.split("youtu.be/")[1].split("?")[0];
    } else if (url.includes("embed/")) {
      videoId = url.split("embed/")[1].split("?")[0];
    }
    return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 py-8 md:py-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 md:gap-10 mb-8 md:mb-16">
          <div className="space-y-3 flex-1">
            <div className="flex items-center gap-3">
              <div className="h-1 w-12 bg-accent rounded-full"></div>
              <span className="text-[10px] font-black text-accent uppercase tracking-[0.2em]">Partner Solutions</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-black text-primary tracking-tighter">프로그램</h1>
            <p className="text-sm md:text-lg font-bold text-primary/30">현직 HR 전문가들이 직접 검증하고 제안하는 최고의 교육/컨설팅 솔루션</p>
            
            <div className="relative max-w-xl group pt-2">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/30 group-focus-within:text-accent transition-colors" />
              <Input 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="찾으시는 주제나 교육기관을 검색하세요..." 
                className="h-12 pl-12 pr-6 bg-white border-none rounded-xl shadow-sm focus-visible:ring-accent/50 text-xs font-bold"
              />
            </div>
          </div>

          <Button 
            onClick={handleOpenDialog}
            className="gold-gradient text-primary font-black h-12 md:h-16 px-8 md:px-12 rounded-xl md:rounded-[2rem] shadow-xl hover:scale-105 active:scale-95 transition-all gap-2 text-sm"
          >
            <Plus className="w-5 h-5" />
            무료 프로그램 등록
          </Button>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent className="max-w-3xl bg-white border-none rounded-[2rem] md:rounded-[3rem] p-6 md:p-10 max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-xl md:text-2xl font-black text-primary mb-4 md:mb-8 flex items-center gap-3">
                  <GraduationCap className="w-8 h-8 text-accent" />
                  프로그램 및 교육기관 등록
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddProgram} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-primary/40 ml-1 uppercase">대표 홍보 이미지</label>
                      <div 
                        onClick={() => fileInputRef.current?.click()}
                        className="relative w-full aspect-video bg-primary/5 rounded-xl border-2 border-dashed border-primary/10 flex flex-col items-center justify-center cursor-pointer overflow-hidden transition-all hover:border-accent"
                      >
                        {imageUrl ? (
                          <img src={imageUrl} alt="preview" className="w-full h-full object-cover" />
                        ) : (
                          <>
                            <Camera className="w-8 h-8 text-primary/20 mb-2" />
                            <p className="text-[10px] text-primary/30 font-black">이미지 업로드</p>
                          </>
                        )}
                      </div>
                      <input type="file" ref={fileInputRef} onChange={handleImageChange} accept="image/*" className="hidden" />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-primary/40 ml-1 uppercase">홍보 영상 URL (유튜브 등)</label>
                      <div className="relative">
                        <Video className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/30" />
                        <Input value={videoUrl} onChange={e => setVideoUrl(e.target.value)} placeholder="https://..." className="h-11 pl-10 bg-primary/5 border-none rounded-lg text-xs" />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-primary/40 ml-1 uppercase">프로그램 제목</label>
                      <Input value={title} onChange={e => setTitle(e.target.value)} required placeholder="매력적인 프로그램명을 입력하세요" className="h-11 bg-primary/5 border-none rounded-lg font-black" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-primary/40 ml-1 uppercase">카테고리</label>
                        <Select onValueChange={setCategory} required>
                          <SelectTrigger className="h-11 bg-primary/5 border-none rounded-lg text-xs"><SelectValue placeholder="대분류" /></SelectTrigger>
                          <SelectContent>
                            {PROGRAM_CATEGORIES.filter(c => c.id !== "all").map(c => (
                              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-primary/40 ml-1 uppercase">세부 주제</label>
                        <Select onValueChange={setSubCategory} disabled={!category}>
                          <SelectTrigger className="h-11 bg-primary/5 border-none rounded-lg text-xs"><SelectValue placeholder="소분류" /></SelectTrigger>
                          <SelectContent>
                            {selectedCategoryDataForForm?.sub.map(s => (
                              <SelectItem key={s} value={s}>{s}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-primary/40 ml-1 uppercase">기관명 / 강사명</label>
                      <Input value={instructorName} onChange={e => setInstructorName(e.target.value)} required placeholder="교육기관 또는 강사명을 입력하세요" className="h-11 bg-primary/5 border-none rounded-lg" />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-primary/40 ml-1 uppercase">프로그램 상세 소개</label>
                    <Textarea value={description} onChange={e => setDescription(e.target.value)} required placeholder="커리큘럼, 기대효과 등 상세 내용을 설명해주세요" className="bg-primary/5 border-none rounded-xl min-h-[120px] text-sm" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-primary/40 ml-1 uppercase">기관/기업 소개</label>
                    <Textarea value={companyDescription} onChange={e => setCompanyDescription(e.target.value)} placeholder="프로그램을 운영하는 기관에 대해 소개해주세요" className="bg-primary/5 border-none rounded-xl min-h-[80px] text-sm" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-primary/40 ml-1 uppercase">시작 일자</label>
                    <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} required className="h-11 bg-primary/5 border-none rounded-lg" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-primary/40 ml-1 uppercase">종료 일자</label>
                    <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} required className="h-11 bg-primary/5 border-none rounded-lg" />
                  </div>
                </div>

                <Button type="submit" disabled={isSubmitting} className="w-full h-14 bg-primary text-accent font-black rounded-2xl shadow-xl mt-4">
                  {isSubmitting ? "등록 중..." : "솔루션 홍보 게시하기"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12">
          {/* Categories Aside (Desktop Only) */}
          <aside className="hidden lg:block lg:col-span-3">
            <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-primary/5 sticky top-32">
              <h3 className="text-xl font-black text-primary mb-6 flex items-center gap-2">
                <Info className="w-5 h-5 text-accent" />
                분야별 탐색
              </h3>
              <div className="flex flex-col gap-1.5">
                {PROGRAM_CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={cn(
                      "flex items-center justify-between px-5 py-3 rounded-xl transition-all font-black text-[14px]",
                      selectedCategory === cat.id 
                        ? "bg-primary text-accent shadow-lg translate-x-2" 
                        : "text-primary/40 hover:bg-primary/5"
                    )}
                  >
                    <span>{cat.name}</span>
                    {selectedCategory === cat.id && <ChevronRight className="w-4 h-4" />}
                  </button>
                ))}
              </div>
            </div>
          </aside>

          {/* Programs List */}
          <div className="lg:col-span-9">
            <div className="lg:hidden mb-8 overflow-x-auto pb-4 scrollbar-hide">
              <div className="flex gap-2 whitespace-nowrap">
                {PROGRAM_CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={cn(
                      "px-5 py-2.5 rounded-full text-xs font-black transition-all",
                      selectedCategory === cat.id 
                        ? "bg-primary text-accent shadow-lg" 
                        : "bg-white text-primary/40 border border-primary/5"
                    )}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            {isLoading ? (
              <div className="flex justify-center py-40"><Clock className="w-12 h-12 animate-spin text-accent" /></div>
            ) : filteredPrograms.length === 0 ? (
              <div className="py-40 text-center bg-white rounded-[2rem] border-2 border-dashed border-primary/5 px-6">
                <p className="text-xl font-black text-primary/10">이 분야의 검증된 솔루션이 곧 찾아옵니다.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10">
                {filteredPrograms.map((p) => {
                  const catName = PROGRAM_CATEGORIES.find(c => c.id === p.category)?.name || "기타";
                  return (
                    <Card key={p.id} className="group bg-white border-primary/5 rounded-[2.5rem] overflow-hidden shadow-sm hover:shadow-2xl transition-all flex flex-col h-full">
                      <div className="relative h-56 md:h-72 w-full overflow-hidden">
                        <Image 
                          src={p.imageUrl || "https://images.unsplash.com/photo-1524178232363-1fb2b075b655"} 
                          alt={p.title} 
                          fill 
                          className="object-cover transition-transform duration-1000 group-hover:scale-110" 
                          data-ai-hint="business workshop"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                        <div className="absolute top-5 left-5">
                          <Badge className="bg-accent text-primary font-black border-none px-4 py-1.5 rounded-full text-[10px] shadow-lg">#{catName}</Badge>
                        </div>
                        {p.videoUrl && (
                          <div className="absolute bottom-5 right-5">
                            <div className="bg-white/20 backdrop-blur-md p-2 rounded-full border border-white/30">
                              <Video className="w-5 h-5 text-white" />
                            </div>
                          </div>
                        )}
                      </div>

                      <CardContent className="p-8 flex-1 flex flex-col">
                        <div className="space-y-4 mb-8">
                          <h3 className="text-xl md:text-2xl font-black text-primary leading-tight group-hover:text-accent transition-colors">
                            {p.title}
                          </h3>
                          <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-primary/5 rounded-lg">
                              <Building2 className="w-4 h-4 text-accent" />
                            </div>
                            <span className="text-sm font-black text-primary/60">{p.instructorName}</span>
                          </div>
                          <p className="text-sm font-medium text-primary/40 line-clamp-3 leading-relaxed">
                            {p.description}
                          </p>
                        </div>

                        <div className="space-y-2 py-4 border-y border-primary/5 mb-8">
                          <div className="flex items-center justify-between text-[11px] font-black">
                            <span className="text-primary/30 uppercase tracking-widest">일정</span>
                            <span className="text-primary/60">{p.startDate} ~ {p.endDate}</span>
                          </div>
                          {p.subCategory && (
                            <div className="flex items-center justify-between text-[11px] font-black">
                              <span className="text-primary/30 uppercase tracking-widest">분야</span>
                              <span className="text-accent">#{p.subCategory}</span>
                            </div>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-4 mt-auto">
                          <Button 
                            onClick={() => setSelectedProgram(p)}
                            className="h-12 md:h-14 bg-primary/5 hover:bg-primary text-primary hover:text-accent font-black rounded-xl transition-all text-xs md:text-sm"
                          >
                            상세 정보
                          </Button>
                          <Button 
                            onClick={() => handleInquireClick(p)}
                            className="h-12 md:h-14 bg-accent text-primary font-black rounded-xl shadow-lg hover:scale-105 active:scale-95 transition-all text-xs md:text-sm gap-2"
                          >
                            <MessageSquare className="w-4 h-4" />
                            문의하기
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Program Detail Dialog */}
      <Dialog open={!!selectedProgram} onOpenChange={(open) => !open && setSelectedProgram(null)}>
        <DialogContent className="max-w-4xl bg-white border-none rounded-[3rem] p-0 overflow-hidden shadow-2xl max-h-[95vh] flex flex-col">
          {selectedProgram && (
            <>
              <div className="relative h-[250px] md:h-[400px] w-full shrink-0">
                <Image 
                  src={selectedProgram.imageUrl || "https://images.unsplash.com/photo-1524178232363-1fb2b075b655"} 
                  alt={selectedProgram.title} 
                  fill 
                  className="object-cover" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                <button 
                  onClick={() => setSelectedProgram(null)}
                  className="absolute top-6 right-6 p-2 bg-black/20 backdrop-blur-md rounded-full text-white hover:bg-white/20 transition-all"
                >
                  <X className="w-6 h-6" />
                </button>
                <div className="absolute bottom-10 left-10 right-10">
                   <Badge className="bg-accent text-primary font-black mb-4 px-4 py-1.5 rounded-full text-[10px]">
                      #{PROGRAM_CATEGORIES.find(c => c.id === selectedProgram.category)?.name || "기타"}
                   </Badge>
                   <h2 className="text-3xl md:text-5xl font-black text-white leading-tight tracking-tighter drop-shadow-lg">
                      {selectedProgram.title}
                   </h2>
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto p-10 space-y-12">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                  <div className="md:col-span-2 space-y-10">
                    <section className="space-y-4">
                      <h3 className="text-2xl font-black text-primary flex items-center gap-2">
                        <BookOpen className="w-6 h-6 text-accent" />
                        프로그램 소개
                      </h3>
                      <p className="text-lg leading-relaxed text-primary/70 whitespace-pre-wrap font-medium">
                        {selectedProgram.description}
                      </p>
                    </section>

                    {selectedProgram.videoUrl && (
                      <section className="space-y-4">
                        <h3 className="text-2xl font-black text-primary flex items-center gap-2">
                          <PlayCircle className="w-6 h-6 text-accent" />
                          홍보 영상
                        </h3>
                        <div className="aspect-video w-full rounded-[2rem] overflow-hidden bg-black shadow-2xl">
                          {getYoutubeEmbedUrl(selectedProgram.videoUrl) ? (
                            <iframe 
                              src={getYoutubeEmbedUrl(selectedProgram.videoUrl)!}
                              className="w-full h-full"
                              allowFullScreen
                            ></iframe>
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-white/20">
                              <p>영상을 불러올 수 없습니다.</p>
                            </div>
                          )}
                        </div>
                      </section>
                    )}
                  </div>

                  <aside className="space-y-8">
                    <div className="bg-primary/5 rounded-[2.5rem] p-8 border border-primary/5 space-y-6">
                      <h4 className="text-lg font-black text-primary">상세 정보</h4>
                      <div className="space-y-4">
                        <div className="flex flex-col gap-1">
                          <span className="text-[10px] font-black text-primary/30 uppercase tracking-widest">진행 일정</span>
                          <span className="text-sm font-bold text-primary/70 flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-accent" />
                            {selectedProgram.startDate} ~ {selectedProgram.endDate}
                          </span>
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="text-[10px] font-black text-primary/30 uppercase tracking-widest">운영 기관</span>
                          <span className="text-sm font-bold text-primary/70 flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-accent" />
                            {selectedProgram.instructorName}
                          </span>
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="text-[10px] font-black text-primary/30 uppercase tracking-widest">세부 주제</span>
                          <Badge variant="outline" className="w-fit border-accent/20 text-accent font-black">
                            #{selectedProgram.subCategory}
                          </Badge>
                        </div>
                      </div>
                      <Button 
                        onClick={() => handleInquireClick(selectedProgram)}
                        className="w-full h-14 bg-accent text-primary font-black rounded-2xl shadow-lg gap-2"
                      >
                        <MessageSquare className="w-4 h-4" />
                        문의하기
                      </Button>
                    </div>

                    {selectedProgram.companyDescription && (
                      <div className="bg-white rounded-[2.5rem] p-8 border border-primary/5 shadow-sm space-y-4">
                        <h4 className="text-lg font-black text-primary flex items-center gap-2">
                          <Info className="w-5 h-5 text-accent" />
                          기관 소개
                        </h4>
                        <p className="text-sm leading-relaxed text-primary/60 font-medium">
                          {selectedProgram.companyDescription}
                        </p>
                      </div>
                    )}
                  </aside>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {messageTarget && (
        <MessageDialog 
          isOpen={!!messageTarget}
          onClose={() => setMessageTarget(null)}
          receiverId={messageTarget.id}
          receiverNickname={messageTarget.nickname}
        />
      )}
    </div>
  )
}
