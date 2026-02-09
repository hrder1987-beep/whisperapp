
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
import { Calendar, GraduationCap, Plus, BookOpen, Clock, ChevronRight, Hash, Sparkles, Search, Camera, X } from "lucide-react"
import Image from "next/image"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"

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
    description: "데이터로 말하는 HR 담당자를 위한 실무 과정. 파이썬과 태블로를 활용한 인사 데이터 시각화 및 전략 도출 기법을 전수합니다.",
    instructorName: "데이터인사이트 연구소",
    category: "ai",
    subCategory: "데이터 분석 실무",
    startDate: "2024-05-15",
    endDate: "2024-06-30",
    imageUrl: "https://images.unsplash.com/photo-1551288049-bbbda536339a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwyfHxkYXRhJTIwYW5hbHl0aWNzfGVufDB8fHx8MTc3MDI4MTYxN3ww&ixlib=rb-4.1.0&q=80&w=1080",
    userId: "mock-p1",
    createdAt: Date.now()
  },
  {
    id: "prog-2",
    title: "MZ세대와 소통하는 리더십 온보딩",
    description: "신임 팀장님들을 위한 세대 간 갈등 관리 및 성과 코칭 프로그램. 실제 사례 기반의 롤플레잉으로 현장 적응력을 높입니다.",
    instructorName: "컬쳐테크 컨설팅",
    category: "leader",
    subCategory: "신임 팀장 리더십",
    startDate: "2024-05-20",
    endDate: "2024-05-22",
    imageUrl: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw1fHx0ZWFtJTIwbWVldGluZ3xlbnwwfHx8fDE3NzAyODE2MTd8MA&ixlib=rb-4.1.0&q=80&w=1080",
    userId: "mock-p2",
    createdAt: Date.now()
  },
  {
    id: "prog-3",
    title: "생성형 AI를 활용한 HR 업무 혁신 과정",
    description: "ChatGPT와 미드저니를 활용해 채용 공고 작성부터 사내 교육 콘텐츠 제작까지 10배 빠르게 처리하는 노하우를 공개합니다.",
    instructorName: "AI-HR 혁신포럼",
    category: "ai",
    subCategory: "ChatGPT 업무활용",
    startDate: "2024-06-01",
    endDate: "2024-06-05",
    imageUrl: "https://images.unsplash.com/photo-1677442136019-21780ecad995?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwzfHxhcnRpZmljaWFsJTIwaW50ZWxsaWdlbmNlfGVufDB8fHx8MTc3MDI4MTYxN3ww&ixlib=rb-4.1.0&q=80&w=1080",
    userId: "mock-p3",
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

  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [instructorName, setInstructorName] = useState("")
  const [category, setCategory] = useState("")
  const [subCategory, setSubCategory] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
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
        instructorName,
        category,
        subCategory,
        startDate,
        endDate,
        imageUrl: imageUrl || `https://picsum.photos/seed/${Date.now()}/800/400`,
        userId: user.uid,
        createdAt: Date.now()
      })
      toast({ title: "등록 완료", description: "프로그램 광고가 성공적으로 등록되었습니다." })
      setIsDialogOpen(false)
      setTitle(""); setDescription(""); setInstructorName(""); setCategory(""); setSubCategory(""); setStartDate(""); setEndDate(""); setImageUrl(null)
    } catch (error) {
      toast({ title: "오류 발생", description: "등록 중 문제가 발생했습니다.", variant: "destructive" })
    } finally {
      setIsSubmitting(false)
    }
  }

  const selectedCategoryData = PROGRAM_CATEGORIES.find(c => c.id === category);

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 py-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-10 mb-16">
          <div className="space-y-4 flex-1">
            <div className="flex items-center gap-3">
              <div className="h-1.5 w-16 bg-accent rounded-full"></div>
              <span className="text-xs font-black text-accent uppercase tracking-[0.2em]">Ad Center</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-primary tracking-tighter">프로그램</h1>
            <p className="text-lg font-bold text-primary/30">현직 HR 전문가들이 선택한 검증된 교육 솔루션</p>
            
            <div className="relative max-w-xl group pt-4">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-primary/30 group-focus-within:text-accent transition-colors" />
              <Input 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="관심 있는 프로그램이나 강사명을 검색해보세요..." 
                className="h-14 pl-14 pr-6 bg-white border-none rounded-2xl shadow-sm focus-visible:ring-accent/50 text-sm font-bold placeholder:text-primary/20"
              />
            </div>
          </div>

          <Button 
            onClick={handleOpenDialog}
            className="gold-gradient text-primary font-black h-16 px-12 rounded-[2rem] shadow-2xl hover:scale-105 active:scale-95 transition-all gap-3"
          >
            <Plus className="w-6 h-6" />
            프로그램 등록하기
          </Button>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent className="max-w-2xl bg-white border-none rounded-[3rem] p-10 max-h-[90vh] overflow-y-auto shadow-2xl">
              <DialogHeader>
                <DialogTitle className="text-2xl font-black text-primary mb-8 flex items-center gap-3">
                  <Sparkles className="w-7 h-7 text-accent" />
                  프로그램 광고 등록
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddProgram} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-black text-primary/40 ml-2">광고 배너 이미지 (16:9 추천)</label>
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="relative w-full aspect-video bg-primary/5 rounded-[2rem] border-2 border-dashed border-primary/10 flex flex-col items-center justify-center cursor-pointer hover:border-accent transition-all overflow-hidden"
                  >
                    {imageUrl ? (
                      <img src={imageUrl} alt="preview" className="w-full h-full object-cover" />
                    ) : (
                      <>
                        <Camera className="w-12 h-12 text-primary/20 mb-2" />
                        <p className="text-primary/40 text-sm font-bold">이미지 파일을 선택하세요</p>
                      </>
                    )}
                  </div>
                  <input type="file" ref={fileInputRef} onChange={handleImageChange} accept="image/*" className="hidden" />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-primary/40 ml-2">프로그램 제목</label>
                  <Input value={title} onChange={e => setTitle(e.target.value)} required placeholder="과정의 핵심을 담은 제목" className="h-12 bg-primary/5 border-none rounded-xl" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-primary/40 ml-2">대분류</label>
                    <Select onValueChange={setCategory} required>
                      <SelectTrigger className="h-12 bg-primary/5 border-none rounded-xl"><SelectValue placeholder="카테고리" /></SelectTrigger>
                      <SelectContent>
                        {PROGRAM_CATEGORIES.filter(c => c.id !== "all").map(c => (
                          <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-primary/40 ml-2">소분류</label>
                    <Select onValueChange={setSubCategory} disabled={!category}>
                      <SelectTrigger className="h-12 bg-primary/5 border-none rounded-xl"><SelectValue placeholder="세부 주제" /></SelectTrigger>
                      <SelectContent>
                        {selectedCategoryData?.sub.map(s => (
                          <SelectItem key={s} value={s}>{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-primary/40 ml-2">강사 및 교육기관</label>
                  <Input value={instructorName} onChange={e => setInstructorName(e.target.value)} required placeholder="성함 또는 기업명" className="h-12 bg-primary/5 border-none rounded-xl" />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-primary/40 ml-2">프로그램 소개</label>
                  <Textarea value={description} onChange={e => setDescription(e.target.value)} required placeholder="인사 담당자의 눈길을 끌 수 있는 핵심 내용을 입력하세요" className="bg-primary/5 border-none rounded-xl min-h-[120px]" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-primary/40 ml-2">시작일</label>
                    <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} required className="h-12 bg-primary/5 border-none rounded-xl" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-primary/40 ml-2">종료일</label>
                    <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} required className="h-12 bg-primary/5 border-none rounded-xl" />
                  </div>
                </div>
                
                <Button type="submit" disabled={isSubmitting} className="w-full h-16 bg-primary text-accent font-black rounded-2xl shadow-lg mt-6 text-lg">
                  {isSubmitting ? "등록 중..." : "프로그램 광고 신청"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          <aside className="lg:col-span-3">
            <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-primary/5 sticky top-32">
              <h3 className="text-xl font-black text-primary mb-8 flex items-center gap-3">
                <Hash className="w-6 h-6 text-accent" />
                카테고리
              </h3>
              <div className="flex flex-col gap-1.5">
                {PROGRAM_CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={cn(
                      "flex items-center justify-between px-5 py-4 rounded-2xl transition-all font-black text-[15px] text-left",
                      selectedCategory === cat.id 
                        ? "bg-primary text-accent shadow-xl translate-x-2" 
                        : "text-primary/40 hover:bg-primary/5 hover:text-primary"
                    )}
                  >
                    <span>{cat.name}</span>
                    {selectedCategory === cat.id && <ChevronRight className="w-4 h-4" />}
                  </button>
                ))}
              </div>
            </div>
          </aside>

          <div className="lg:col-span-9">
            {isLoading ? (
              <div className="flex justify-center py-40"><Clock className="w-16 h-16 animate-spin text-accent" /></div>
            ) : filteredPrograms.length === 0 ? (
              <div className="py-40 text-center bg-white rounded-[3rem] border-2 border-dashed border-primary/5">
                <p className="text-2xl font-black text-primary/10">조건에 맞는 프로그램이 아직 없습니다.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                {filteredPrograms.map((p) => {
                  const catName = PROGRAM_CATEGORIES.find(c => c.id === p.category)?.name || "기타";
                  return (
                    <Card key={p.id} className="group bg-white border-primary/5 rounded-[3rem] overflow-hidden shadow-sm hover:shadow-2xl hover:-translate-y-3 transition-all duration-500 flex flex-col">
                      <div className="relative h-64 w-full overflow-hidden">
                        <Image 
                          src={p.imageUrl || "https://images.unsplash.com/photo-1524178232363-1fb2b075b655"} 
                          alt={p.title} 
                          fill 
                          className="object-cover transition-transform duration-1000 group-hover:scale-110" 
                          data-ai-hint="business seminar"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-primary/80 via-primary/20 to-transparent opacity-60"></div>
                        <div className="absolute top-6 left-6 flex flex-wrap gap-2">
                          <Badge className="bg-accent text-primary font-black border-none px-4 py-1.5 rounded-full text-[11px] shadow-2xl">#{catName}</Badge>
                        </div>
                      </div>
                      <CardContent className="p-8 flex-1 flex flex-col">
                        <h3 className="text-2xl font-black text-primary mb-3 line-clamp-1 group-hover:text-accent transition-colors leading-tight">
                          {p.title}
                        </h3>
                        <p className="text-sm font-bold text-accent/80 mb-6 line-clamp-2 leading-relaxed">
                          {p.description}
                        </p>
                        <div className="space-y-3 mb-8">
                          <div className="flex items-center gap-3 text-primary/60 text-[13px] font-black">
                            <GraduationCap className="w-4 h-4 text-accent" /> {p.instructorName}
                          </div>
                          <div className="flex items-center gap-3 text-primary/60 text-[13px] font-black">
                            <Calendar className="w-4 h-4 text-accent" /> {p.startDate} ~ {p.endDate}
                          </div>
                        </div>
                        <Button className="w-full h-14 mt-auto bg-primary/5 hover:bg-primary text-primary hover:text-accent font-black rounded-2xl transition-all gap-2 text-[15px]">
                          상세 정보 및 신청하기
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
