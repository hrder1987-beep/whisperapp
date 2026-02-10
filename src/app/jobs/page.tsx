
"use client"

import { useState, useMemo, useRef } from "react"
import { Header } from "@/components/chuchot/Header"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection, query, orderBy, addDoc } from "firebase/firestore"
import { JobListing } from "@/lib/types"
import { Briefcase, MapPin, Calendar, Plus, Search, ChevronRight, Building2, Flame, Award, Clock, Sparkles, Check, Info, Target, Zap } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"

const JOB_CATEGORIES = [
  "전체보기", "인사기획/전략", "채용/리크루팅", "HRD/교육", "급여/보상/C&B", "조직문화/EVP", "노무/ER", "HR 애널리틱스"
]

const HR_SKILLS = [
  "근로기준법", "급여아웃소싱", "SAP", "Workday", "인터뷰기법", "성과평가설계", "조직진단", "EVP수립", "데이터분석", "코칭", "퍼실리테이션"
]

const CORE_COMPETENCIES = [
  "문제해결능력", "전략적 사고", "커뮤니케이션", "유연성", "공감능력", "윤리의식", "데이터 리터러시", "실행력"
]

const MOCK_JOBS: JobListing[] = [
  {
    id: "job-1",
    companyName: "위스퍼 테크놀로지",
    title: "시니어 HR 매니저 (인사전략 및 조직문화)",
    location: "서울 강남구",
    experience: "경력 7-12년",
    education: "대졸 이상",
    deadline: "2024-05-30",
    tags: ["스톡옵션", "자율출퇴근", "인센티브"],
    logoUrl: "https://picsum.photos/seed/company1/100/100",
    category: "인사기획/전략",
    createdAt: Date.now(),
    userId: "mock-j1"
  },
  {
    id: "job-2",
    companyName: "글로벌 에듀그룹",
    title: "HRD 교육 컨텐츠 설계 담당자 채용",
    location: "서울 서초구",
    experience: "경력 3-5년",
    education: "대졸 이상",
    deadline: "2024-06-15",
    tags: ["재택근무", "교육비지원", "식대제공"],
    logoUrl: "https://picsum.photos/seed/company2/100/100",
    category: "HRD/교육",
    createdAt: Date.now(),
    userId: "mock-j2"
  }
]

export default function JobsPage() {
  const { user } = useUser()
  const db = useFirestore()
  const { toast } = useToast()
  const router = useRouter()
  
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("전체보기")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Registration Form States
  const [companyName, setCompanyName] = useState("")
  const [title, setTitle] = useState("")
  const [location, setLocation] = useState("")
  const [experience, setExperience] = useState("경력")
  const [employmentType, setEmploymentType] = useState("정규직")
  const [deadline, setDeadline] = useState("")
  const [category, setCategory] = useState("")
  const [selectedSkills, setSelectedSkills] = useState<string[]>([])
  const [selectedCompetencies, setSelectedCompetencies] = useState<string[]>([])

  const jobsQuery = useMemoFirebase(() => {
    if (!db) return null
    return query(collection(db, "jobs"), orderBy("createdAt", "desc"))
  }, [db])

  const { data: jobsData, isLoading } = useCollection<JobListing>(jobsQuery)
  
  const jobs = useMemo(() => {
    const fetched = jobsData || []
    if (fetched.length === 0 && !searchQuery) return MOCK_JOBS
    return fetched
  }, [jobsData, searchQuery])

  const filteredJobs = useMemo(() => {
    return jobs.filter(j => {
      const matchesSearch = j.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          j.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === "전체보기" || j.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [jobs, searchQuery, selectedCategory]);

  const toggleSkill = (skill: string) => {
    setSelectedSkills(prev => prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill])
  }

  const toggleCompetency = (comp: string) => {
    setSelectedCompetencies(prev => prev.includes(comp) ? prev.filter(c => c !== comp) : [...prev, comp])
  }

  const handleAddJob = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) {
      toast({ title: "로그인 필요", description: "공고를 등록하려면 로그인이 필요합니다.", variant: "destructive" })
      return
    }

    setIsSubmitting(true)
    try {
      const combinedTags = [...selectedSkills, ...selectedCompetencies, employmentType]
      
      await addDoc(collection(db, "jobs"), {
        companyName,
        title,
        location,
        experience,
        education: "대졸 이상",
        deadline,
        tags: combinedTags,
        logoUrl: `https://picsum.photos/seed/${companyName}/100/100`,
        category,
        createdAt: Date.now(),
        userId: user.uid
      })
      toast({ title: "공고 등록 완료", description: "HR 인재를 위한 공고가 성공적으로 게시되었습니다." })
      setIsDialogOpen(false)
      // Reset form
      setCompanyName(""); setTitle(""); setLocation(""); setDeadline(""); setCategory("");
      setSelectedSkills([]); setSelectedCompetencies([]);
    } catch (error) {
      toast({ title: "오류 발생", description: "등록 중 문제가 발생했습니다.", variant: "destructive" })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 py-12 md:py-20">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-12 mb-20">
          <div className="space-y-8 flex-1">
            <div className="inline-flex items-center gap-2 bg-accent/10 px-4 py-2 rounded-full border border-accent/20">
              <Briefcase className="w-4 h-4 text-accent" />
              <span className="text-[10px] font-black text-accent uppercase tracking-[0.2em]">HR Special Careers</span>
            </div>
            
            <div className="space-y-4">
              <h1 className="text-5xl md:text-7xl font-black text-primary tracking-tighter leading-[0.9]">
                채용 정보 <span className="text-accent/40 font-light tracking-widest block md:inline md:ml-2 text-3xl md:text-5xl text-pretty">Careers</span>
              </h1>
              <p className="text-xl md:text-2xl font-medium text-primary/50 max-w-4xl leading-relaxed text-balance">
                대한민국 모든 <span className="text-primary font-black underline decoration-accent/30 underline-offset-4">HR 전문가</span>들의 커리어 성장을 지원합니다. <br className="hidden md:block" />
                전문성이 검증된 HR 포지션만을 엄선하여 제공합니다.
              </p>
            </div>
            
            <div className="relative max-w-2xl group">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-primary/20 group-focus-within:text-accent transition-colors" />
              <Input 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="기업명 또는 직무를 검색하세요..." 
                className="h-16 pl-16 pr-8 bg-white border-none rounded-[2rem] shadow-xl focus-visible:ring-accent/50 text-base font-bold placeholder:text-primary/20"
              />
            </div>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gold-gradient text-primary font-black h-20 px-12 rounded-[2.5rem] shadow-2xl hover:scale-105 active:scale-95 transition-all gap-3 text-lg shrink-0">
                <Plus className="w-6 h-6" />
                공고 등록하기
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl bg-white border-none rounded-[3rem] p-0 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
              <DialogHeader className="premium-gradient p-10 shrink-0">
                <DialogTitle className="text-3xl font-black text-white flex items-center gap-3">
                  <Briefcase className="w-8 h-8 text-accent" />
                  어떤 포지션을 채용하시나요?
                </DialogTitle>
                <p className="text-accent/70 text-sm font-bold mt-2">HR 조직의 전문 인재를 찾기 위한 정보를 입력해 주세요.</p>
              </DialogHeader>
              
              <div className="flex-1 overflow-y-auto p-10">
                <form onSubmit={handleAddJob} className="space-y-10">
                  <section className="space-y-6">
                    <h4 className="text-xs font-black text-primary/30 uppercase tracking-widest flex items-center gap-2">
                      <Target className="w-4 h-4 text-accent" /> 기본 포지션 정보
                    </h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-primary/40 ml-1 uppercase">기업명</label>
                        <Input value={companyName} onChange={e => setCompanyName(e.target.value)} required placeholder="예: (주)위스퍼" className="h-12 bg-primary/5 border-none rounded-xl font-bold" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-primary/40 ml-1 uppercase">직무 분류</label>
                        <Select onValueChange={setCategory} required>
                          <SelectTrigger className="h-12 bg-primary/5 border-none rounded-xl font-bold"><SelectValue placeholder="카테고리 선택" /></SelectTrigger>
                          <SelectContent>
                            {JOB_CATEGORIES.filter(c => c !== "전체보기").map(c => (
                              <SelectItem key={c} value={c}>{c}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-primary/40 ml-1 uppercase">공고 제목 (포지션)</label>
                      <Input value={title} onChange={e => setTitle(e.target.value)} required placeholder="핵심 직무명을 포함하여 입력하세요 (예: 시니어 채용 담당자)" className="h-14 bg-primary/5 border-none rounded-xl text-lg font-black" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-primary/40 ml-1 uppercase">근무지</label>
                        <Input value={location} onChange={e => setLocation(e.target.value)} required placeholder="서울 강남구 / 재택 등" className="h-12 bg-primary/5 border-none rounded-xl font-bold" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-primary/40 ml-1 uppercase">마감일</label>
                        <Input value={deadline} onChange={e => setDeadline(e.target.value)} required placeholder="YYYY-MM-DD 또는 상시채용" className="h-12 bg-primary/5 border-none rounded-xl font-bold" />
                      </div>
                    </div>
                  </section>

                  <section className="space-y-6">
                    <h4 className="text-xs font-black text-primary/30 uppercase tracking-widest flex items-center gap-2">
                      <Zap className="w-4 h-4 text-accent" /> 상세 자격 요건
                    </h4>

                    <div className="space-y-4">
                      <label className="text-[10px] font-black text-primary/40 ml-1 uppercase">필요 스킬 (중복 선택)</label>
                      <div className="flex flex-wrap gap-2">
                        {HR_SKILLS.map(skill => (
                          <button
                            key={skill}
                            type="button"
                            onClick={() => toggleSkill(skill)}
                            className={cn(
                              "px-4 py-2 rounded-xl text-xs font-black transition-all border-2",
                              selectedSkills.includes(skill)
                                ? "bg-primary text-accent border-primary"
                                : "bg-white text-primary/30 border-primary/5 hover:border-accent/30"
                            )}
                          >
                            {skill}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <label className="text-[10px] font-black text-primary/40 ml-1 uppercase">핵심 역량 (중복 선택)</label>
                      <div className="flex flex-wrap gap-2">
                        {CORE_COMPETENCIES.map(comp => (
                          <button
                            key={comp}
                            type="button"
                            onClick={() => toggleCompetency(comp)}
                            className={cn(
                              "px-4 py-2 rounded-xl text-xs font-black transition-all border-2",
                              selectedCompetencies.includes(comp)
                                ? "bg-accent text-primary border-accent"
                                : "bg-white text-primary/30 border-primary/5 hover:border-accent/30"
                            )}
                          >
                            {comp}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-4">
                        <label className="text-[10px] font-black text-primary/40 ml-1 uppercase">경력 여부</label>
                        <div className="flex gap-2">
                          {["신입", "경력", "경력무관"].map(exp => (
                            <button
                              key={exp}
                              type="button"
                              onClick={() => setExperience(exp)}
                              className={cn(
                                "flex-1 h-12 rounded-xl text-xs font-black border-2 transition-all",
                                experience === exp ? "bg-primary text-accent border-primary" : "bg-white text-primary/20 border-primary/5"
                              )}
                            >
                              {exp}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="space-y-4">
                        <label className="text-[10px] font-black text-primary/40 ml-1 uppercase">고용 형태</label>
                        <div className="flex gap-2">
                          {["정규직", "계약직", "인턴"].map(type => (
                            <button
                              key={type}
                              type="button"
                              onClick={() => setEmploymentType(type)}
                              className={cn(
                                "flex-1 h-12 rounded-xl text-xs font-black border-2 transition-all",
                                employmentType === type ? "bg-primary text-accent border-primary" : "bg-white text-primary/20 border-primary/5"
                              )}
                            >
                              {type}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </section>

                  <div className="bg-accent/10 p-6 rounded-2xl flex items-start gap-3">
                    <Info className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                    <p className="text-[11px] text-primary/60 font-bold leading-relaxed">
                      본 플랫폼은 HR 전문가 전용 커뮤니티입니다. 허위 공고나 부적절한 내용은 관리자에 의해 무통보 삭제될 수 있습니다. 연봉 정보는 구직자와의 협의를 위해 입력 항목에서 제외되었습니다.
                    </p>
                  </div>

                  <Button type="submit" disabled={isSubmitting} className="w-full h-16 bg-primary text-accent font-black rounded-2xl shadow-xl text-lg hover:scale-[1.02] transition-all">
                    {isSubmitting ? "공고 등록 중..." : "HR 채용 공고 게시하기"}
                  </Button>
                </form>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Categories Bar */}
        <div className="flex overflow-x-auto gap-3 mb-12 scrollbar-hide pb-2">
          {JOB_CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={cn(
                "px-6 py-3 rounded-2xl text-sm font-black transition-all border-2 whitespace-nowrap",
                selectedCategory === cat 
                  ? "bg-primary text-accent border-primary shadow-xl" 
                  : "bg-white text-primary/30 border-primary/5 hover:border-accent/30 hover:text-primary"
              )}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Hot Picks Section */}
        {!searchQuery && selectedCategory === "전체보기" && (
          <div className="mb-16">
            <div className="flex items-center gap-2 mb-6">
              <Flame className="w-6 h-6 text-red-500 fill-red-500" />
              <h2 className="text-2xl font-black text-primary">실시간 HOT HR 공고</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {jobs.slice(0, 3).map((job) => (
                <Card key={job.id} className="bg-white border-primary/5 rounded-[2.5rem] overflow-hidden shadow-sm hover:shadow-2xl transition-all group">
                  <CardContent className="p-8">
                    <div className="flex justify-between items-start mb-6">
                      <div className="w-16 h-16 rounded-2xl bg-primary/5 flex items-center justify-center overflow-hidden border border-primary/10">
                        {job.logoUrl ? (
                          <img src={job.logoUrl} alt={job.companyName} className="w-full h-full object-cover" />
                        ) : (
                          <Building2 className="w-8 h-8 text-primary/20" />
                        )}
                      </div>
                      <Badge className="bg-red-50 text-red-500 border-none font-black text-[10px] px-3 py-1 animate-pulse">HOT</Badge>
                    </div>
                    <div className="space-y-1 mb-6">
                      <p className="text-xs font-black text-primary/40 uppercase tracking-tighter">{job.companyName}</p>
                      <h3 className="text-xl font-black text-primary group-hover:text-accent transition-colors leading-snug line-clamp-2">
                        {job.title}
                      </h3>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mb-8">
                      {job.tags?.slice(0, 3).map(tag => (
                        <Badge key={tag} variant="outline" className="border-primary/10 text-primary/40 font-bold text-[10px] px-2 py-0">#{tag}</Badge>
                      ))}
                    </div>
                    <div className="flex items-center justify-between text-[11px] font-black text-primary/30 pt-4 border-t border-primary/5">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {job.location}</span>
                        <span className="flex items-center gap-1"><Award className="w-3 h-3" /> {job.experience}</span>
                      </div>
                      <span className="text-red-400">D-{job.deadline.includes("-") ? "Day" : job.deadline}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Regular Listings */}
        <div className="bg-white rounded-[3rem] shadow-sm border border-primary/5 overflow-hidden">
          <div className="p-8 border-b border-primary/5 flex items-center justify-between">
            <h2 className="text-xl font-black text-primary">전체 채용 리스트 <span className="text-accent ml-2">{filteredJobs.length}</span></h2>
            <div className="flex gap-4 text-xs font-black text-primary/40">
              <button className="text-primary border-b-2 border-primary">최신순</button>
              <button className="hover:text-primary">마감임박순</button>
              <button className="hover:text-primary">인기순</button>
            </div>
          </div>
          
          <div className="divide-y divide-primary/5">
            {isLoading ? (
              <div className="flex justify-center py-40"><Clock className="w-12 h-12 animate-spin text-accent" /></div>
            ) : filteredJobs.map((job) => (
              <div key={job.id} className="p-8 hover:bg-primary/[0.01] transition-all group flex flex-col md:flex-row md:items-center gap-8">
                <div className="w-20 h-20 rounded-2xl bg-primary/5 flex items-center justify-center overflow-hidden border border-primary/5 flex-shrink-0">
                  <img src={job.logoUrl} alt={job.companyName} className="w-full h-full object-cover" />
                </div>
                
                <div className="flex-1 space-y-2">
                  <p className="text-sm font-black text-primary/40">{job.companyName}</p>
                  <h3 className="text-xl font-black text-primary group-hover:text-accent transition-colors leading-tight">{job.title}</h3>
                  <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-primary/50 pt-1">
                    <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-accent" /> {job.location}</span>
                    <span className="flex items-center gap-1.5"><Award className="w-3.5 h-3.5 text-accent" /> {job.experience}</span>
                    <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-accent" /> {job.deadline}</span>
                  </div>
                </div>
                
                <div className="flex flex-col md:items-end gap-3">
                  <Badge className="bg-primary/5 text-primary/40 font-black border-none px-3 py-1 rounded-full text-[10px] w-fit">
                    #{job.category}
                  </Badge>
                  <Button className="h-12 px-8 rounded-xl bg-primary/5 hover:bg-primary text-primary hover:text-accent font-black transition-all">
                    상세보기
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
