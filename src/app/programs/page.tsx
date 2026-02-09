
"use client"

import { useState, useMemo } from "react"
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
import { Calendar, GraduationCap, Plus, BookOpen, Clock, ChevronRight, Hash, Sparkles } from "lucide-react"
import Image from "next/image"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

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

export default function ProgramsPage() {
  const { user } = useUser()
  const db = useFirestore()
  const { toast } = useToast()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  // New program form state
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [instructorName, setInstructorName] = useState("")
  const [category, setCategory] = useState("")
  const [subCategory, setSubCategory] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [imageUrl, setImageUrl] = useState("")

  const programsQuery = useMemoFirebase(() => {
    if (!db) return null
    return query(collection(db, "trainingPrograms"), orderBy("createdAt", "desc"))
  }, [db])

  const { data: programsData, isLoading } = useCollection<TrainingProgram>(programsQuery)
  const programs = programsData || []

  const filteredPrograms = useMemo(() => {
    return programs.filter(p => {
      const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.instructorName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === "all" || p.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [programs, searchQuery, selectedCategory]);

  const handleAddProgram = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) {
      toast({ title: "로그인 필요", description: "교육 프로그램을 등록하려면 로그인이 필요합니다.", variant: "destructive" })
      return
    }

    try {
      await addDoc(collection(db, "trainingPrograms"), {
        title,
        description,
        instructorName,
        category: category,
        subCategory: subCategory,
        startDate,
        endDate,
        imageUrl: imageUrl || `https://picsum.photos/seed/${Date.now()}/800/400`,
        userId: user.uid,
        createdAt: Date.now()
      })
      toast({ title: "등록 완료", description: "교육 프로그램이 성공적으로 등록되었습니다." })
      setIsDialogOpen(false)
      setTitle(""); setDescription(""); setInstructorName(""); setCategory(""); setSubCategory(""); setStartDate(""); setEndDate(""); setImageUrl("")
    } catch (error) {
      toast({ title: "오류 발생", description: "등록 중 문제가 발생했습니다.", variant: "destructive" })
    }
  }

  const selectedCategoryData = PROGRAM_CATEGORIES.find(c => c.id === category);

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <Header onSearch={setSearchQuery} />
      
      <main className="max-w-7xl mx-auto px-4 py-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="h-1 w-12 bg-accent rounded-full"></div>
              <span className="text-xs font-black text-accent uppercase tracking-widest">Education Library</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-primary tracking-tighter mb-4">교육 프로그램</h1>
            <p className="text-lg font-bold text-primary/30">대한민국 HR 전문가들이 엄선한 최고의 실무 커리큘럼</p>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gold-gradient text-primary font-black h-14 px-10 rounded-[1.5rem] shadow-xl hover:scale-105 active:scale-95 transition-all gap-3">
                <Plus className="w-6 h-6" />
                프로그램 직접 제안하기
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl bg-white border-none rounded-[2.5rem] p-8 max-h-[90vh] overflow-y-auto shadow-2xl">
              <DialogHeader>
                <DialogTitle className="text-2xl font-black text-primary mb-6 flex items-center gap-2">
                  <Sparkles className="w-6 h-6 text-accent" />
                  새로운 교육 과정 등록
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddProgram} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-black text-primary/40 ml-1">과정명</label>
                  <Input value={title} onChange={e => setTitle(e.target.value)} required placeholder="인사담당자가 한눈에 알 수 있는 제목" className="h-12 bg-primary/5 border-none rounded-xl" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-primary/40 ml-1">대분류</label>
                    <Select onValueChange={setCategory} required>
                      <SelectTrigger className="h-12 bg-primary/5 border-none rounded-xl">
                        <SelectValue placeholder="카테고리 선택" />
                      </SelectTrigger>
                      <SelectContent>
                        {PROGRAM_CATEGORIES.filter(c => c.id !== "all").map(c => (
                          <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-primary/40 ml-1">소분류</label>
                    <Select onValueChange={setSubCategory} disabled={!category}>
                      <SelectTrigger className="h-12 bg-primary/5 border-none rounded-xl">
                        <SelectValue placeholder="세부 주제 선택" />
                      </SelectTrigger>
                      <SelectContent>
                        {selectedCategoryData?.sub.map(s => (
                          <SelectItem key={s} value={s}>{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-primary/40 ml-1">강사/교육기관</label>
                  <Input value={instructorName} onChange={e => setInstructorName(e.target.value)} required placeholder="성함 또는 업체명" className="h-12 bg-primary/5 border-none rounded-xl" />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-primary/40 ml-1">과정 상세 내용</label>
                  <Textarea value={description} onChange={e => setDescription(e.target.value)} required placeholder="과정의 핵심 목표와 특징을 300자 내외로 입력하세요" className="bg-primary/5 border-none rounded-xl min-h-[120px]" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-primary/40 ml-1">시작일</label>
                    <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} required className="h-12 bg-primary/5 border-none rounded-xl" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-primary/40 ml-1">종료일</label>
                    <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} required className="h-12 bg-primary/5 border-none rounded-xl" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-primary/40 ml-1">대표 이미지 URL (선택)</label>
                  <Input value={imageUrl} onChange={e => setImageUrl(e.target.value)} placeholder="https://..." className="h-12 bg-primary/5 border-none rounded-xl" />
                </div>
                
                <Button type="submit" className="w-full h-14 bg-primary text-accent font-black rounded-2xl shadow-lg mt-4 text-lg">프로그램 등록 신청</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Category Sidebar */}
          <aside className="lg:col-span-3 space-y-2">
            <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-primary/5">
              <h3 className="text-lg font-black text-primary mb-6 flex items-center gap-2">
                <Hash className="w-5 h-5 text-accent" />
                카테고리 필터
              </h3>
              <div className="flex flex-col gap-1">
                {PROGRAM_CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={cn(
                      "flex items-center justify-between px-4 py-3 rounded-xl transition-all font-bold text-sm",
                      selectedCategory === cat.id 
                        ? "bg-primary text-accent shadow-md translate-x-1" 
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

          {/* Program Grid */}
          <div className="lg:col-span-9">
            {isLoading ? (
              <div className="flex justify-center py-20"><Clock className="w-10 h-10 animate-spin text-accent" /></div>
            ) : filteredPrograms.length === 0 ? (
              <div className="py-32 text-center bg-white rounded-[2.5rem] border-2 border-dashed border-primary/5">
                <p className="text-xl font-bold text-primary/20">해당 카테고리에 등록된 프로그램이 없습니다.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {filteredPrograms.map((p) => {
                  const catName = PROGRAM_CATEGORIES.find(c => c.id === p.category)?.name || "기타";
                  return (
                    <Card key={p.id} className="group bg-white border-primary/5 rounded-[2rem] overflow-hidden shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-300">
                      <div className="relative h-56 w-full overflow-hidden">
                        <Image src={p.imageUrl || "https://images.unsplash.com/photo-1524178232363-1fb2b075b655"} alt={p.title} fill className="object-cover transition-transform duration-700 group-hover:scale-110" />
                        <div className="absolute inset-0 bg-gradient-to-t from-primary/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <div className="absolute top-4 left-4 flex gap-2">
                          <Badge className="bg-accent text-primary font-black border-none px-3 py-1 rounded-full text-[10px] shadow-lg">#{catName}</Badge>
                          {(p as any).subCategory && (
                            <Badge className="bg-white/90 text-primary font-black border-none px-3 py-1 rounded-full text-[10px] shadow-lg">{(p as any).subCategory}</Badge>
                          )}
                        </div>
                      </div>
                      <CardContent className="p-7">
                        <h3 className="text-xl md:text-2xl font-black text-primary mb-4 line-clamp-2 group-hover:text-accent transition-colors leading-tight">{p.title}</h3>
                        <div className="space-y-3 mb-6">
                          <div className="flex items-center gap-2 text-primary/60 text-sm font-bold">
                            <GraduationCap className="w-4 h-4 text-accent" /> {p.instructorName}
                          </div>
                          <div className="flex items-center gap-2 text-primary/60 text-sm font-bold">
                            <Calendar className="w-4 h-4 text-accent" /> {p.startDate} ~ {p.endDate}
                          </div>
                        </div>
                        <p className="text-sm text-primary/50 line-clamp-3 mb-8 font-medium leading-relaxed">{p.description}</p>
                        <Button className="w-full h-12 bg-primary/5 hover:bg-primary text-primary hover:text-accent font-black rounded-xl transition-all gap-2">
                          과정 상세 보기
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
