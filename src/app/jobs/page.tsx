
"use client"

import { useState, useMemo, useRef } from "react"
import { Header } from "@/components/chuchot/Header"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection, query, orderBy, addDoc } from "firebase/firestore"
import { JobListing } from "@/lib/types"
import { Briefcase, MapPin, Calendar, Plus, Search, Building2, Flame, Award, Clock, Camera, Mail, X, ChevronRight } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"

const JOB_CATEGORIES = ["전체보기", "인사기획/전략", "채용/리크루팅", "HRD/교육", "급여/보상", "조직문화", "노무/ER"]

const MOCK_JOBS: JobListing[] = [
  {
    id: "job-1",
    companyName: "(주)위스퍼랩스",
    title: "Head of Talent Acquisition (채용 총괄 리더)",
    location: "서울 강남구",
    experience: "10년 이상",
    deadline: "2024-06-30",
    tags: ["채용브랜딩"],
    logoUrl: "https://images.unsplash.com/photo-1551288049-bbbda536339a?q=80&w=200",
    category: "채용/리크루팅",
    createdAt: Date.now(),
    userId: "mock-j1"
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
    MOCK_JOBS.forEach(mj => { if (!merged.some(j => j.id === mj.id)) merged.push(mj) })
    return merged.sort((a, b) => b.createdAt - a.createdAt)
  }, [jobsData])

  const filteredJobs = jobs.filter(j => {
    const matchesSearch = j.companyName.toLowerCase().includes(searchQuery.toLowerCase()) || j.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "전체보기" || j.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleAddJob = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) {
      toast({ title: "로그인 필요", description: "공고 등록을 하려면 로그인이 필요합니다.", variant: "destructive" })
      router.push("/auth?mode=login")
      return
    }
    setIsSubmitting(true)
    try {
      await addDoc(collection(db, "jobs"), {
        companyName, title, location, experience, deadline, category, contactEmail,
        tags: [experience, category], createdAt: Date.now(), userId: user.uid,
        logoUrl: adImageUrl || `https://picsum.photos/seed/${companyName}/100/100`, adImageUrl
      })
      toast({ title: "공고 등록 완료", description: "채용 공고가 게시되었습니다." })
      setIsDialogOpen(false)
      setTitle(""); setCompanyName(""); setAdImageUrl(null)
    } catch (error) { toast({ title: "오류", description: "문제가 발생했습니다.", variant: "destructive" }) }
    finally { setIsSubmitting(false) }
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 py-8 md:py-12">
        <div className="flex flex-col gap-8 mb-12">
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            <div className="space-y-1">
              <h1 className="text-3xl font-black text-primary tracking-tight">채용 정보</h1>
              <p className="text-sm font-medium text-primary/40">HR 전문가를 위한 최적의 커리어 기회를 연결합니다.</p>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-primary text-accent hover:bg-primary/95 font-black h-11 px-6 rounded-xl shadow-lg transition-all gap-2 text-xs border border-accent/20">
                  <Plus className="w-4 h-4" />
                  공고 등록하기
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl bg-white border-none rounded-[2rem] p-10 max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-black text-primary mb-2">채용 공고 등록</DialogTitle>
                  <DialogDescription className="text-sm font-bold text-primary/40">전문 인재를 찾기 위한 공고 내용을 입력해 주세요.</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleAddJob} className="space-y-6 mt-6">
                  <div onClick={() => fileInputRef.current?.click()} className="relative aspect-video bg-primary/5 rounded-xl border-2 border-dashed border-primary/10 flex items-center justify-center cursor-pointer hover:border-accent overflow-hidden group">
                    {adImageUrl ? <img src={adImageUrl} className="w-full h-full object-contain" alt="preview" /> : <Camera className="w-8 h-8 text-primary/20" />}
                  </div>
                  <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => {
                    const file = e.target.files?.[0]; if (file) {
                      const reader = new FileReader(); reader.onloadend = () => setAdImageUrl(reader.result as string); reader.readAsDataURL(file);
                    }
                  }} />
                  <div className="grid grid-cols-2 gap-4">
                    <Input value={companyName} onChange={e => setCompanyName(e.target.value)} required placeholder="기업명" className="h-11 bg-primary/5 border-none rounded-xl" />
                    <Select onValueChange={setCategory} required>
                      <SelectTrigger className="h-11 bg-primary/5 border-none rounded-xl"><SelectValue placeholder="직무 분류" /></SelectTrigger>
                      <SelectContent>{JOB_CATEGORIES.filter(c => c !== "전체보기").map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <Input value={title} onChange={e => setTitle(e.target.value)} required placeholder="공고 제목" className="h-11 bg-primary/5 border-none rounded-xl font-bold" />
                  <div className="grid grid-cols-2 gap-4">
                    <Input value={location} onChange={e => setLocation(e.target.value)} required placeholder="근무지" className="h-11 bg-primary/5 border-none rounded-xl" />
                    <Input value={deadline} onChange={e => setDeadline(e.target.value)} required placeholder="마감일 (상시채용 등)" className="h-11 bg-primary/5 border-none rounded-xl" />
                  </div>
                  <Button type="submit" disabled={isSubmitting} className="w-full h-14 bg-primary text-accent font-black rounded-xl">공고 게시 완료</Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="relative max-w-2xl group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary/20 group-focus-within:text-accent transition-colors" />
            <Input 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="기업명 또는 직무를 검색하세요..." 
              className="h-12 pl-12 pr-6 bg-white border-none rounded-xl shadow-sm focus-visible:ring-accent/50 text-sm font-bold placeholder:text-primary/20"
            />
          </div>
        </div>

        <div className="flex overflow-x-auto gap-2 mb-12 scrollbar-hide">
          {JOB_CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={cn(
                "px-5 py-2.5 rounded-xl text-xs font-black transition-all border-2 whitespace-nowrap",
                selectedCategory === cat ? "bg-primary text-accent border-primary shadow-md" : "bg-white text-primary/30 border-primary/5 hover:border-accent/30 hover:text-primary"
              )}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-primary/5 overflow-hidden">
          <div className="divide-y divide-primary/5">
            {isLoading ? (
              <div className="flex justify-center py-40"><Clock className="w-12 h-12 animate-spin text-accent" /></div>
            ) : filteredJobs.map((job) => (
              <div key={job.id} className="p-6 hover:bg-primary/[0.01] transition-all group flex flex-col md:flex-row md:items-center gap-6">
                <div className="w-16 h-16 rounded-xl bg-primary/5 flex items-center justify-center overflow-hidden border border-primary/5 flex-shrink-0">
                  <img src={job.logoUrl} alt={job.companyName} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 space-y-1">
                  <p className="text-[11px] font-black text-primary/40">{job.companyName}</p>
                  <h3 className="text-base font-black text-primary group-hover:text-accent transition-colors">{job.title}</h3>
                  <div className="flex items-center gap-4 text-[10px] font-bold text-primary/50">
                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {job.location}</span>
                    <span className="flex items-center gap-1"><Award className="w-3 h-3" /> {job.experience}</span>
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {job.deadline}</span>
                  </div>
                </div>
                <Button onClick={() => setViewJob(job)} className="h-10 px-6 rounded-xl bg-primary text-accent hover:bg-primary/90 font-black transition-all text-xs border border-accent/20">
                  상세보기
                </Button>
              </div>
            ))}
          </div>
        </div>
      </main>

      {viewJob && (
        <Dialog open={!!viewJob} onOpenChange={() => setViewJob(null)}>
          <DialogContent className="max-w-3xl bg-white border-none rounded-[2rem] p-0 overflow-hidden shadow-2xl">
            <DialogHeader className="bg-primary p-8 text-left space-y-1">
              <DialogTitle className="text-2xl font-black text-white">{viewJob.title}</DialogTitle>
              <DialogDescription className="text-accent font-bold opacity-100">{viewJob.companyName}</DialogDescription>
            </DialogHeader>
            <div className="p-8 max-h-[50vh] overflow-y-auto bg-[#F8F9FA]">
              {viewJob.adImageUrl ? <img src={viewJob.adImageUrl} className="w-full h-auto rounded-xl shadow-lg" alt="poster" /> : <p className="text-primary/20 text-center py-20 font-black">상세 이미지가 없습니다.</p>}
            </div>
            <div className="p-6 bg-white border-t border-primary/5 flex justify-end">
              <Button onClick={() => setViewJob(null)} className="h-11 px-8 rounded-xl bg-primary text-accent font-black">닫기</Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
