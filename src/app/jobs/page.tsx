
"use client"

import { useState, useMemo, useRef } from "react"
import { Header } from "@/components/chuchot/Header"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useUser, useFirestore, useCollection, useMemoFirebase, addDocumentNonBlocking } from "@/firebase"
import { collection, query, orderBy } from "firebase/firestore"
import { JobListing } from "@/lib/types"
import { MapPin, Plus, Search, Award, Clock, Camera, Sparkles, Building2, Bookmark, Share2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"

const JOB_CATEGORIES = ["전체", "인사기획/전략", "채용/리크루팅", "HRD/교육", "급여/보상", "조직문화", "노무/ER"]

const MOCK_JOBS: JobListing[] = [
  {
    id: "job-sample-1",
    companyName: "(주)테크핀코리아",
    title: "HRD Manager (교육 기획 및 조직문화 총괄)",
    location: "서울 영등포구",
    experience: "7년 - 12년",
    deadline: "2024-12-31",
    tags: ["HRD", "조직문화", "정규직"],
    logoUrl: "https://images.unsplash.com/photo-1551288049-bbbda536339a?q=80&w=200",
    category: "HRD/교육",
    createdAt: 1714521600000,
    userId: "mock-j1",
    education: "대졸 이상"
  },
  {
    id: "job-sample-2",
    companyName: "유니콘스타트업 '위스퍼'",
    title: "Senior Talent Acquisition (채용 브랜딩 리더)",
    location: "서울 강남구",
    experience: "5년 이상",
    deadline: "상시채용",
    tags: ["채용", "브랜딩", "스타트업"],
    logoUrl: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=200",
    category: "채용/리크루팅",
    createdAt: 1714608000000,
    userId: "mock-j2",
    education: "무관"
  },
  {
    id: "job-sample-3",
    companyName: "(주)글로벌인사",
    title: "C&B 전문 담당자 (급여/평가보상 제도 설계)",
    location: "서울 중구",
    experience: "3년 - 7년",
    deadline: "2024-12-25",
    tags: ["급여", "평가보상", "시니어"],
    logoUrl: "https://images.unsplash.com/photo-1454165833762-01049369290d?q=80&w=200",
    category: "급여/보상",
    createdAt: 1714694400000,
    userId: "mock-j3",
    education: "대졸"
  }
]

export default function JobsPage() {
  const { user } = useUser()
  const db = useFirestore()
  const { toast } = useToast()
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("전체")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [viewJob, setViewJob] = useState<JobListing | null>(null)

  const [companyName, setCompanyName] = useState("")
  const [title, setTitle] = useState("")
  const [location, setLocation] = useState("")
  const [experience, setExperience] = useState("경력")
  const [deadline, setDeadline] = useState("")
  const [category, setCategory] = useState("")
  const [adImageUrl, setAdImageUrl] = useState<string | null>(null)

  const jobsQuery = useMemoFirebase(() => db ? query(collection(db, "jobs"), orderBy("createdAt", "desc")) : null, [db])
  const { data: jobsData, isLoading } = useCollection<JobListing>(jobsQuery)
  
  const jobs = useMemo(() => {
    const fetched = jobsData || []
    const merged = [...fetched]
    MOCK_JOBS.forEach(mj => { if (!merged.some(j => j.id === mj.id)) merged.push(mj) })
    return merged.sort((a, b) => b.createdAt - a.createdAt)
  }, [jobsData])

  const filteredJobs = jobs.filter(j => {
    const matchesSearch = j.companyName.toLowerCase().includes(searchQuery.toLowerCase()) || j.title.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === "전체" || j.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const handleAddJob = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) { 
      toast({ title: "로그인 필요", description: "공고 등록을 위해 로그인이 필요합니다.", variant: "destructive" }); 
      router.push("/auth?mode=login"); 
      return; 
    }
    setIsSubmitting(true)
    try {
      await addDocumentNonBlocking(collection(db, "jobs"), {
        companyName, title, location, experience, deadline, category,
        tags: [experience, category], createdAt: Date.now(), userId: user.uid,
        logoUrl: adImageUrl || `https://picsum.photos/seed/${companyName}/100/100`, adImageUrl
      })
      toast({ title: "공고 등록 완료", description: "채용 공고가 게시되었습니다." })
      setIsDialogOpen(false); setTitle(""); setCompanyName(""); setAdImageUrl(null)
    } catch (error) { toast({ title: "오류", description: "문제가 발생했습니다.", variant: "destructive" }) }
    finally { setIsSubmitting(false) }
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <Header />
      <main className="max-w-5xl mx-auto px-4 py-10 md:py-16">
        <div className="flex flex-col gap-10 mb-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-2">
              <h1 className="text-3xl md:text-4xl font-black text-accent tracking-tighter">채용 인텔리전스</h1>
              <p className="text-sm md:text-base font-bold text-accent/40">전문성이 검증된 HR 담당자를 위한 커리어 큐레이션</p>
            </div>

            {/* 웹에서만 공고 게시 가능 */}
            <div className="hidden md:block">
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="naver-button h-12 px-8 rounded-none shadow-sm transition-all gap-2 text-sm text-accent">
                    <Plus className="w-4 h-4" />
                    채용 공고 게시하기
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl bg-white border-none rounded-none p-0 shadow-2xl overflow-hidden">
                  <DialogHeader className="bg-white border-b border-black/5 p-8 text-left">
                    <DialogTitle className="text-xl font-black text-accent">신규 채용 공고 등록</DialogTitle>
                    <p className="text-black/40 text-[10px] font-bold mt-1 uppercase tracking-widest">Recruitment Intelligence Registration</p>
                  </DialogHeader>
                  <form onSubmit={handleAddJob} className="p-8 space-y-8 overflow-y-auto max-h-[75vh]">
                    <div onClick={() => fileInputRef.current?.click()} className="relative aspect-[21/9] bg-[#F5F6F7] border-2 border-dashed border-black/10 flex items-center justify-center cursor-pointer overflow-hidden group hover:border-primary">
                      {adImageUrl ? <img src={adImageUrl} className="w-full h-full object-contain" alt="preview" /> : <div className="text-center"><Camera className="w-8 h-8 text-black/10 group-hover:text-primary transition-colors mx-auto mb-2" /><p className="text-[10px] font-bold text-black/20">공고 포스터 또는 로고 (21:9)</p></div>}
                    </div>
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => {
                      const file = e.target.files?.[0]; if (file) { const reader = new FileReader(); reader.onloadend = () => setAdImageUrl(reader.result as string); reader.readAsDataURL(file); }
                    }} />
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[11px] font-black text-accent/40 uppercase tracking-widest">기업명</label>
                        <Input value={companyName} onChange={e => setCompanyName(e.target.value)} required placeholder="회사명" className="h-11 bg-[#F5F6F7] border-none rounded-none font-bold" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[11px] font-black text-accent/40 uppercase tracking-widest">직무 분류</label>
                        <Select onValueChange={setCategory} required>
                          <SelectTrigger className="h-11 bg-[#F5F6F7] border-none rounded-none font-bold"><SelectValue placeholder="카테고리" /></SelectTrigger>
                          <SelectContent>{JOB_CATEGORIES.filter(c => c !== "전체").map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[11px] font-black text-accent/40 uppercase tracking-widest">공고 제목</label>
                      <Input value={title} onChange={e => setTitle(e.target.value)} required placeholder="예: [토스] 채용 브랜딩 리더" className="h-12 bg-[#F5F6F7] border-none rounded-none font-black text-base" />
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[11px] font-black text-accent/40 uppercase tracking-widest">근무지역</label>
                        <Input value={location} onChange={e => setLocation(e.target.value)} required placeholder="예: 서울 강남구" className="h-11 bg-[#F5F6F7] border-none rounded-none" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[11px] font-black text-accent/40 uppercase tracking-widest">마감기한</label>
                        <Input value={deadline} onChange={e => setDeadline(e.target.value)} required placeholder="예: 2024-12-31 또는 상시" className="h-11 bg-[#F5F6F7] border-none rounded-none" />
                      </div>
                    </div>
                    <Button type="submit" disabled={isSubmitting} className="w-full h-12 naver-button text-accent text-sm rounded-none shadow-md">작성 완료 및 게시</Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          <div className="space-y-6">
            <div className="relative group">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-black/20 group-focus-within:text-primary transition-colors" />
              <Input 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="관심 있는 기업이나 채용 키워드를 입력하세요" 
                className="h-14 pl-14 pr-6 bg-white border-2 border-primary rounded-none shadow-sm focus-visible:ring-0 text-base font-bold placeholder:text-black/10"
              />
            </div>
            <div className="flex flex-wrap gap-2 py-1">
              {JOB_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={cn(
                    "px-6 py-2.5 rounded-none text-xs font-black transition-all border whitespace-nowrap",
                    selectedCategory === cat 
                      ? "bg-primary text-accent border-primary shadow-sm" 
                      : "bg-white text-black/40 border-black/5 hover:border-accent/20"
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-1">
          {isLoading ? (
            <div className="flex justify-center py-40"><Sparkles className="w-10 h-10 animate-spin text-primary" /></div>
          ) : filteredJobs.length === 0 ? (
            <div className="py-40 text-center bg-white border border-black/5">
              <p className="text-black/20 font-black text-lg">진행 중인 채용 공고를 찾을 수 없습니다.</p>
            </div>
          ) : filteredJobs.map((job) => (
            <div 
              key={job.id} 
              className="p-6 md:p-8 bg-white border-b border-black/[0.06] hover:bg-black/[0.01] transition-all group flex items-start md:items-center gap-6 md:gap-10 cursor-pointer" 
              onClick={() => setViewJob(job)}
            >
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-lg bg-[#F5F6F7] flex items-center justify-center overflow-hidden border border-black/5 shrink-0 transition-transform group-hover:scale-105">
                <img src={job.logoUrl} alt={job.companyName} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-[11px] font-black text-primary uppercase tracking-wider">{job.companyName}</span>
                  {job.deadline === '상시채용' && <Badge className="bg-primary/10 text-primary border-none rounded-none text-[9px] h-4 font-black">상시</Badge>}
                </div>
                <h3 className="text-lg md:text-xl font-black text-accent group-hover:text-primary transition-colors leading-tight mb-3 truncate">{job.title}</h3>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-black/30">
                    <MapPin className="w-3 h-3" /> {job.location}
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-black/30">
                    <Award className="w-3 h-3" /> {job.experience}
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-black/30">
                    <Clock className="w-3 h-3" /> {job.deadline}
                  </div>
                  <div className="ml-auto hidden md:flex gap-1.5">
                    {job.tags?.slice(0, 3).map(tag => (
                      <Badge key={tag} variant="secondary" className="bg-[#F5F6F7] text-black/40 border-none rounded-none text-[9px] font-bold px-2 py-0">#{tag}</Badge>
                    ))}
                  </div>
                </div>
              </div>
              <div className="hidden lg:flex items-center gap-3">
                <Button variant="ghost" size="icon" className="text-black/10 hover:text-accent rounded-full"><Bookmark className="w-5 h-5" /></Button>
                <Button variant="ghost" size="icon" className="text-black/10 hover:text-accent rounded-full"><Share2 className="w-5 h-5" /></Button>
              </div>
            </div>
          ))}
        </div>
      </main>

      {viewJob && (
        <Dialog open={!!viewJob} onOpenChange={() => setViewJob(null)}>
          <DialogContent className="max-w-3xl bg-white border-none rounded-none p-0 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <DialogHeader className="bg-white border-b border-black/5 p-8 md:p-12 text-left space-y-4 shrink-0">
              <div className="flex items-center justify-between mb-2">
                <Badge className="bg-accent text-white border-none px-3 py-1 rounded-none text-[10px] font-black tracking-widest">RECRUITING</Badge>
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-black/20 hover:text-accent"><Bookmark className="w-4 h-4" /></Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-black/20 hover:text-accent"><Share2 className="w-4 h-4" /></Button>
                </div>
              </div>
              <div className="space-y-2">
                <DialogTitle className="text-2xl md:text-3xl font-black text-accent leading-tight">{viewJob.title}</DialogTitle>
                <p className="text-primary font-black text-lg flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-accent" /> @{viewJob.companyName}
                </p>
              </div>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto bg-white p-8 md:p-12">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12 pb-12 border-b border-black/5">
                <div className="space-y-1.5">
                  <p className="text-[10px] font-black text-black/20 uppercase tracking-widest">근무지</p>
                  <p className="text-sm font-bold text-accent">{viewJob.location}</p>
                </div>
                <div className="space-y-1.5">
                  <p className="text-[10px] font-black text-black/20 uppercase tracking-widest">경력조건</p>
                  <p className="text-sm font-bold text-accent">{viewJob.experience}</p>
                </div>
                <div className="space-y-1.5">
                  <p className="text-[10px] font-black text-black/20 uppercase tracking-widest">마감기한</p>
                  <p className="text-sm font-bold text-accent">{viewJob.deadline}</p>
                </div>
                <div className="space-y-1.5">
                  <p className="text-[10px] font-black text-black/20 uppercase tracking-widest">직무분류</p>
                  <p className="text-sm font-bold text-accent">{viewJob.category || "일반"}</p>
                </div>
              </div>
              
              {viewJob.adImageUrl ? (
                <div className="relative w-full border border-black/5 shadow-sm overflow-hidden">
                  <img src={viewJob.adImageUrl} className="w-full h-auto" alt="job poster" />
                </div>
              ) : (
                <div className="py-24 text-center bg-[#F5F6F7] border border-dashed border-black/10">
                  <p className="text-black/20 font-black text-sm">상세 공고 이미지가 등록되지 않았습니다.</p>
                </div>
              )}

              <div className="mt-12 space-y-6">
                <h4 className="text-base font-black text-accent flex items-center gap-2">
                  <div className="w-1.5 h-4 bg-primary"></div> 주요 요건 및 복지
                </h4>
                <div className="flex flex-wrap gap-2">
                  {viewJob.tags?.map(tag => (
                    <Badge key={tag} className="bg-accent/5 text-accent/60 border-none rounded-none px-4 py-1.5 font-bold text-xs">#{tag}</Badge>
                  ))}
                </div>
              </div>
            </div>
            <div className="p-8 bg-[#FBFBFC] border-t border-black/5 flex justify-end gap-3 shrink-0">
              <Button onClick={() => setViewJob(null)} variant="ghost" className="h-12 px-8 rounded-none font-black text-black/30 hover:bg-black/5">닫기</Button>
              <Button className="h-12 px-12 naver-button text-accent font-black text-sm rounded-none shadow-xl">입사 지원하기</Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
