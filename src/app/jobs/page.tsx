
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
import { Briefcase, MapPin, Calendar, Plus, Search, Building2, Flame, Award, Clock, Camera, Target, Info, X, ExternalLink, Mail } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"

const JOB_CATEGORIES = [
  "전체보기", "인사기획/전략", "채용/리크루팅", "HRD/교육", "급여/보상/C&B", "조직문화/EVP", "노무/ER", "HR 애널리틱스"
]

const MOCK_JOBS: JobListing[] = [
  {
    id: "job-1",
    companyName: "(주)위스퍼랩스",
    title: "Head of Talent Acquisition (채용 총괄 리더)",
    location: "서울 강남구 (역삼)",
    experience: "경력 10년 이상",
    education: "대졸 이상",
    deadline: "2024-06-30",
    tags: ["채용브랜딩", "조직성장"],
    logoUrl: "https://images.unsplash.com/photo-1551288049-bbbda536339a?q=80&w=200",
    adImageUrl: "https://images.unsplash.com/photo-1551288049-bbbda536339a?q=80&w=1080",
    category: "채용/리크루팅",
    contactEmail: "recruit@whisperlabs.io",
    createdAt: Date.now() - 100000,
    userId: "mock-j1"
  },
  {
    id: "job-2",
    companyName: "피플앤컬처 그룹",
    title: "조직문화 및 EVP 강화 담당자 (Culture Lead)",
    location: "서울 송파구 (잠실)",
    experience: "경력 5-8년",
    education: "대졸 이상",
    deadline: "2024-07-15",
    tags: ["조직문화", "심리적안전감"],
    logoUrl: "https://images.unsplash.com/photo-1521737711867-e3b97375f902?q=80&w=200",
    adImageUrl: "https://images.unsplash.com/photo-1521737711867-e3b97375f902?q=80&w=1080",
    category: "조직문화/EVP",
    contactEmail: "hr@peopleandculture.com",
    createdAt: Date.now() - 200000,
    userId: "mock-j2"
  },
  {
    id: "job-3",
    companyName: "테크인사이드",
    title: "HR 데이터 사이언티스트 (People Analytics)",
    location: "경기도 성남시 (판교)",
    experience: "경력 3-7년",
    education: "대졸 이상",
    deadline: "상시채용",
    tags: ["데이터분석", "인사통계"],
    logoUrl: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=200",
    adImageUrl: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=1080",
    category: "HR 애널리틱스",
    contactEmail: "careers@techinside.kr",
    createdAt: Date.now() - 300000,
    userId: "mock-j3"
  }
]

export default function JobsPage() {
  const { user } = useUser()
  const db = useFirestore()
  const { toast } = useToast()
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("전체보기")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [viewJob, setViewJob] = useState<JobListing | null>(null)

  // Registration Form States
  const [companyName, setCompanyName] = useState("")
  const [title, setTitle] = useState("")
  const [location, setLocation] = useState("")
  const [experience, setExperience] = useState("경력")
  const [deadline, setDeadline] = useState("")
  const [category, setCategory] = useState("")
  const [contactEmail, setContactEmail] = useState("")
  const [adImageUrl, setAdImageUrl] = useState<string | null>(null)

  const jobsQuery = useMemoFirebase(() => {
    if (!db) return null
    return query(collection(db, "jobs"), orderBy("createdAt", "desc"))
  }, [db])

  const { data: jobsData, isLoading } = useCollection<JobListing>(jobsQuery)
  
  const jobs = useMemo(() => {
    const fetched = jobsData || []
    const merged = [...fetched]
    MOCK_JOBS.forEach(mj => {
      if (!merged.some(j => j.id === mj.id)) merged.push(mj)
    })
    return merged.sort((a, b) => b.createdAt - a.createdAt)
  }, [jobsData])

  const filteredJobs = useMemo(() => {
    return jobs.filter(j => {
      const matchesSearch = j.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          j.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === "전체보기" || j.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [jobs, searchQuery, selectedCategory]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => setAdImageUrl(reader.result as string)
      reader.readAsDataURL(file)
    }
  }

  const handleAddJob = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) {
      toast({ title: "로그인 필요", description: "공고를 등록하려면 로그인이 필요합니다.", variant: "destructive" })
      return
    }

    if (!contactEmail.includes("@")) {
      toast({ title: "이메일 형식 오류", description: "올바른 이메일 주소를 입력해주세요.", variant: "destructive" })
      return
    }

    setIsSubmitting(true)
    try {
      await addDoc(collection(db, "jobs"), {
        companyName,
        title,
        location,
        experience,
        education: "대졸 이상",
        deadline,
        tags: [experience, category],
        logoUrl: adImageUrl || `https://picsum.photos/seed/${companyName}/100/100`,
        adImageUrl: adImageUrl || null,
        category,
        contactEmail,
        createdAt: Date.now(),
        userId: user.uid
      })
      toast({ title: "공고 등록 완료", description: "HR 인재를 위한 공고가 성공적으로 게시되었습니다." })
      setIsDialogOpen(false)
      setCompanyName(""); setTitle(""); setLocation(""); setDeadline(""); setCategory(""); setContactEmail(""); setAdImageUrl(null);
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
                채용 정보 <span className="text-accent/40 font-light tracking-widest block md:inline md:ml-2 text-3xl md:text-5xl">Careers</span>
              </h1>
              <p className="text-xl md:text-2xl font-medium text-primary/50 max-w-4xl leading-relaxed text-balance">
                대한민국 모든 <span className="text-primary font-black underline decoration-accent/30 underline-offset-4">HR 전문가</span>들의 커리어 성장을 지원합니다. <br className="hidden md:block" />
                HR 전문가들의 새로운 도약을 위한 다양한 커리어 기회를 연결합니다.
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
              <Button className="hidden md:flex gold-gradient text-primary font-black h-20 px-12 rounded-[2.5rem] shadow-2xl hover:scale-105 active:scale-95 transition-all gap-3 text-lg shrink-0">
                <Plus className="w-6 h-6" />
                공고 등록하기
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl bg-white border-none rounded-[3rem] p-0 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
              <DialogHeader className="premium-gradient p-10 shrink-0">
                <DialogTitle className="text-3xl font-black text-white flex items-center gap-3">
                  <Briefcase className="w-8 h-8 text-accent" />
                  HR 채용공고 등록
                </DialogTitle>
                <p className="text-accent/70 text-sm font-bold mt-2">공고 포스터 이미지를 업로드하고 핵심 정보와 지원처를 입력하세요.</p>
              </DialogHeader>
              
              <div className="flex-1 overflow-y-auto p-10">
                <form onSubmit={handleAddJob} className="space-y-8">
                  <section className="space-y-4">
                    <label className="text-[10px] font-black text-primary/40 ml-1 uppercase">공고 포스터 이미지 (필수)</label>
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      className="relative w-full aspect-[4/5] md:aspect-video bg-primary/5 rounded-2xl border-2 border-dashed border-primary/10 flex flex-col items-center justify-center cursor-pointer overflow-hidden transition-all hover:border-accent shadow-inner"
                    >
                      {adImageUrl ? (
                        <div className="relative w-full h-full">
                          <img src={adImageUrl} alt="ad preview" className="w-full h-full object-contain" />
                          <button 
                            type="button" 
                            onClick={(e) => { e.stopPropagation(); setAdImageUrl(null); }}
                            className="absolute top-4 right-4 bg-red-500 text-white p-2 rounded-full shadow-lg"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <Camera className="w-12 h-12 text-primary/20 mb-3" />
                          <p className="text-sm text-primary/40 font-black">공고 이미지 업로드</p>
                          <p className="text-[10px] text-primary/20 mt-1">클릭하여 파일을 선택하세요</p>
                        </>
                      )}
                    </div>
                    <input type="file" ref={fileInputRef} onChange={handleImageChange} accept="image/*" className="hidden" />
                  </section>

                  <section className="space-y-6">
                    <h4 className="text-xs font-black text-primary/30 uppercase tracking-widest flex items-center gap-2">
                      <Target className="w-4 h-4 text-accent" /> 노출용 핵심 정보
                    </h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-primary/40 ml-1 uppercase">기업명</label>
                        <Input value={companyName} onChange={e => setCompanyName(e.target.value)} required placeholder="예: (주)인사피플" className="h-12 bg-primary/5 border-none rounded-xl font-bold" />
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
                      <label className="text-[10px] font-black text-primary/40 ml-1 uppercase">공고 제목 (메인 노출)</label>
                      <Input value={title} onChange={e => setTitle(e.target.value)} required placeholder="예: 시니어 채용 담당자 모집" className="h-14 bg-primary/5 border-none rounded-xl text-lg font-black" />
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

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-primary/40 ml-1 uppercase">지원받을 이메일 주소 (필수)</label>
                      <Input 
                        type="email" 
                        value={contactEmail} 
                        onChange={e => setContactEmail(e.target.value)} 
                        required 
                        placeholder="recruit@company.com" 
                        className="h-12 bg-primary/5 border-none rounded-xl font-bold" 
                      />
                    </div>

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
                  </section>

                  <Button type="submit" disabled={isSubmitting || !adImageUrl} className="w-full h-16 bg-primary text-accent font-black rounded-2xl shadow-xl text-lg hover:scale-[1.02] transition-all">
                    {isSubmitting ? "공고 등록 중..." : "HR 채용 공고 게시하기"}
                  </Button>
                </form>
              </div>
            </DialogContent>
          </Dialog>
        </div>

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
                        <img src={job.logoUrl} alt={job.companyName} className="w-full h-full object-cover" />
                      </div>
                      <Badge className="bg-red-50 text-red-500 border-none font-black text-[10px] px-3 py-1 animate-pulse">HOT</Badge>
                    </div>
                    <div className="space-y-1 mb-6">
                      <p className="text-xs font-black text-primary/40 uppercase tracking-tighter">{job.companyName}</p>
                      <h3 className="text-xl font-black text-primary group-hover:text-accent transition-colors leading-snug line-clamp-2 text-balance">
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
                      <Button onClick={() => setViewJob(job)} variant="ghost" size="sm" className="text-accent hover:text-accent font-black h-8 p-0">상세보기</Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

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
                  <h3 className="text-xl font-black text-primary group-hover:text-accent transition-colors leading-tight text-balance">{job.title}</h3>
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
                  <Button onClick={() => setViewJob(job)} className="h-12 px-8 rounded-xl bg-primary/5 hover:bg-primary text-primary hover:text-accent font-black transition-all">
                    상세보기
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      <Dialog open={!!viewJob} onOpenChange={(open) => !open && setViewJob(null)}>
        <DialogContent className="max-w-4xl bg-white border-none rounded-[3rem] p-0 overflow-hidden shadow-2xl max-h-[90vh] flex flex-col">
          <DialogHeader className="sr-only">
            <DialogTitle>{viewJob?.title || "채용 상세"}</DialogTitle>
          </DialogHeader>
          {viewJob && (
            <>
              <div className="premium-gradient p-8 md:p-12 flex flex-col md:flex-row md:items-center justify-between gap-6 shrink-0">
                <div className="space-y-2">
                  <Badge className="bg-accent text-primary font-black border-none px-3 py-1 rounded-lg text-[10px]">PREMIUM HIRING</Badge>
                  <h2 className="text-2xl md:text-4xl font-black text-white leading-tight text-balance">{viewJob.title}</h2>
                  <p className="text-accent/80 font-bold text-sm flex items-center gap-2">
                    <Building2 className="w-4 h-4" /> {viewJob.companyName}
                  </p>
                </div>
                <Button onClick={() => setViewJob(null)} variant="ghost" className="text-white/40 hover:text-white p-0 h-auto w-fit hidden md:block">
                  <X className="w-8 h-8" />
                </Button>
              </div>
              
              <div className="flex-1 overflow-y-auto bg-[#F8F9FA] p-6 md:p-10">
                <div className="max-w-3xl mx-auto space-y-10">
                  <div className="bg-white rounded-[2rem] overflow-hidden shadow-xl border border-primary/5">
                    {viewJob.adImageUrl ? (
                      <img src={viewJob.adImageUrl} alt="job poster" className="w-full h-auto" />
                    ) : (
                      <div className="aspect-[4/5] flex flex-col items-center justify-center text-primary/10">
                        <Camera className="w-20 h-20 mb-4" />
                        <p className="font-black text-xl">상세 이미지가 없습니다.</p>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-10">
                    <div className="bg-white p-8 rounded-3xl shadow-sm border border-primary/5 space-y-4">
                      <h4 className="text-xs font-black text-primary/30 uppercase tracking-widest flex items-center gap-2">
                        <Target className="w-4 h-4 text-accent" /> 포지션 핵심 정보
                      </h4>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center text-sm">
                          <span className="font-bold text-primary/40">근무지</span>
                          <span className="font-black text-primary">{viewJob.location}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="font-bold text-primary/40">경력조건</span>
                          <span className="font-black text-primary">{viewJob.experience}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="font-bold text-primary/40">지원마감</span>
                          <span className="font-black text-red-500">{viewJob.deadline}</span>
                        </div>
                      </div>
                    </div>
                    <div className="bg-primary text-accent p-8 rounded-3xl shadow-xl space-y-4 flex flex-col justify-center">
                      <div className="text-center space-y-2">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">How to Apply</p>
                        <p className="text-lg font-black leading-tight">아래 연락처로 지원 서류를<br/>보내주시기 바랍니다.</p>
                      </div>
                      <div className="bg-white/10 p-4 rounded-xl flex items-center gap-3">
                        <Mail className="w-5 h-5 text-accent" />
                        <span className="font-black text-sm truncate">{viewJob.contactEmail || "포스터 참조"}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
