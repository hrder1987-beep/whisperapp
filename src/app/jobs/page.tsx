
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
import { MapPin, Plus, Search, Award, Clock, Camera, Sparkles } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"

const JOB_CATEGORIES = ["전체", "인사기획/전략", "채용/리크루팅", "HRD/교육", "급여/보상", "조직문화", "노무/ER"]

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
    if (!user) { toast({ title: "로그인 필요", description: "공고 등록을 위해 로그인이 필요합니다.", variant: "destructive" }); router.push("/auth?mode=login"); return; }
    setIsSubmitting(true)
    try {
      await addDoc(collection(db, "jobs"), {
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
    <div className="min-h-screen bg-[#F5F6F7]">
      <Header />
      <main className="max-w-7xl mx-auto px-4 py-8 md:py-16">
        <div className="flex flex-col gap-10 mb-16">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
            <div className="space-y-3">
              <h1 className="text-3xl md:text-4xl font-black text-[#1E1E23] tracking-tighter">채용 인텔리전스</h1>
              <p className="text-sm md:text-base font-bold text-[#888]">HR 전문가만을 위한 엄선된 커리어 기회와 채용 소식</p>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="naver-button h-12 md:h-14 px-8 shadow-md gap-2 text-sm">
                  <Plus className="w-5 h-5" /> 공고 등록하기
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl bg-white border-none rounded-none p-0 shadow-2xl overflow-hidden">
                <DialogHeader className="bg-white border-b border-black/5 p-6">
                  <DialogTitle className="text-xl font-black text-accent">채용 공고 게시</DialogTitle>
                  <p className="text-black/40 text-[10px] font-bold mt-0.5 uppercase tracking-widest">Post HR Job Opportunity</p>
                </DialogHeader>
                <form onSubmit={handleAddJob} className="p-8 space-y-8 overflow-y-auto max-h-[80vh]">
                  <div onClick={() => fileInputRef.current?.click()} className="relative aspect-video bg-[#F5F6F7] border-2 border-dashed border-black/10 flex items-center justify-center cursor-pointer overflow-hidden group hover:border-primary">
                    {adImageUrl ? <img src={adImageUrl} className="w-full h-full object-contain" alt="preview" /> : <Camera className="w-8 h-8 text-black/10" />}
                  </div>
                  <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => {
                    const file = e.target.files?.[0]; if (file) { const reader = new FileReader(); reader.onloadend = () => setAdImageUrl(reader.result as string); reader.readAsDataURL(file); }
                  }} />
                  <div className="grid grid-cols-2 gap-4">
                    <Input value={companyName} onChange={e => setCompanyName(e.target.value)} required placeholder="기업명" className="h-12 bg-white border-black/10 rounded-none font-bold" />
                    <Select onValueChange={setCategory} required>
                      <SelectTrigger className="h-12 bg-white border-black/10 rounded-none"><SelectValue placeholder="직무 분류" /></SelectTrigger>
                      <SelectContent>{JOB_CATEGORIES.filter(c => c !== "전체").map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <Input value={title} onChange={e => setTitle(e.target.value)} required placeholder="공고 제목" className="h-12 bg-white border-black/10 rounded-none font-black text-base" />
                  <div className="grid grid-cols-2 gap-4">
                    <Input value={location} onChange={e => setLocation(e.target.value)} required placeholder="근무지 (예: 서울 강남구)" className="h-12 bg-white border-black/10 rounded-none" />
                    <Input value={deadline} onChange={e => setDeadline(e.target.value)} required placeholder="마감일 (예: 2024-12-31)" className="h-12 bg-white border-black/10 rounded-none" />
                  </div>
                  <Button type="submit" disabled={isSubmitting} className="w-full h-14 naver-button text-base">채용 공고 게시 완료</Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="flex flex-col md:flex-row md:items-center gap-6">
            <div className="relative flex-1 group">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-black/20 group-focus-within:text-primary transition-colors" />
              <Input 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="기업명 또는 직무 키워드로 채용 소식을 검색해 보세요" 
                className="h-14 pl-14 pr-6 bg-white border-2 border-primary rounded-none shadow-sm focus-visible:ring-0 text-base font-black placeholder:text-black/10"
              />
            </div>
            <div className="flex overflow-x-auto gap-2 scrollbar-hide py-1">
              {JOB_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={cn(
                    "px-6 py-3 rounded-none text-xs font-black transition-all border-2 whitespace-nowrap",
                    selectedCategory === cat 
                      ? "bg-[#1E1E23] text-primary border-[#1E1E23] shadow-md" 
                      : "bg-white text-black/30 border-black/5 hover:border-primary/30 hover:text-[#1E1E23]"
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white border border-black/[0.06] rounded-none shadow-sm overflow-hidden">
          <div className="divide-y divide-black/[0.06]">
            {isLoading ? (
              <div className="flex justify-center py-40"><Sparkles className="w-12 h-12 animate-spin text-primary" /></div>
            ) : filteredJobs.length === 0 ? (
              <div className="py-40 text-center">
                <p className="text-black/20 font-black text-xl">현재 진행 중인 채용 공고가 없습니다.</p>
              </div>
            ) : filteredJobs.map((job) => (
              <div key={job.id} className="p-8 hover:bg-[#FBFBFC] transition-all group flex flex-col md:flex-row md:items-center gap-8 cursor-pointer" onClick={() => setViewJob(job)}>
                <div className="w-20 h-20 rounded-none bg-[#F5F6F7] flex items-center justify-center overflow-hidden border border-black/5 shrink-0 shadow-sm">
                  <img src={job.logoUrl} alt={job.companyName} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 space-y-2">
                  <p className="text-[11px] font-black text-primary uppercase tracking-widest">{job.companyName}</p>
                  <h3 className="text-xl font-black text-[#1E1E23] group-hover:underline decoration-primary/30 underline-offset-4">{job.title}</h3>
                  <div className="flex flex-wrap items-center gap-4 text-[11px] font-bold text-black/30 uppercase tracking-tighter">
                    <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-black/10" /> {job.location}</span>
                    <span className="flex items-center gap-1.5"><Award className="w-3.5 h-3.5 text-black/10" /> {job.experience}</span>
                    <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-black/10" /> {job.deadline}</span>
                  </div>
                </div>
                <Button onClick={(e) => { e.stopPropagation(); setViewJob(job); }} className="h-12 px-8 rounded-none naver-button text-xs">
                  공고 상세 보기
                </Button>
              </div>
            ))}
          </div>
        </div>
      </main>

      {viewJob && (
        <Dialog open={!!viewJob} onOpenChange={() => setViewJob(null)}>
          <DialogContent className="max-w-3xl bg-white border-none rounded-none p-0 shadow-2xl overflow-hidden">
            <DialogHeader className="bg-white border-b border-black/5 p-8 text-left space-y-2">
              <div className="flex items-center justify-between">
                <Badge className="bg-primary text-accent border-none px-3 py-1 rounded-none text-[10px] font-black">RECRUITING</Badge>
                <span className="text-black/20 text-[10px] font-bold uppercase tracking-widest">Whisper Job Intelligence</span>
              </div>
              <DialogTitle className="text-2xl font-black text-accent leading-tight">{viewJob.title}</DialogTitle>
              <p className="text-primary font-black text-sm">@{viewJob.companyName}</p>
            </DialogHeader>
            <div className="p-8 max-h-[60vh] overflow-y-auto bg-white">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10 pb-10 border-b border-black/5">
                <div className="space-y-1">
                  <p className="text-[9px] font-black text-black/20 uppercase">Location</p>
                  <p className="text-sm font-bold text-[#1E1E23]">{job.location}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[9px] font-black text-black/20 uppercase">Experience</p>
                  <p className="text-sm font-bold text-[#1E1E23]">{job.experience}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[9px] font-black text-black/20 uppercase">Deadline</p>
                  <p className="text-sm font-bold text-[#1E1E23]">{job.deadline}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[9px] font-black text-black/20 uppercase">Category</p>
                  <p className="text-sm font-bold text-[#1E1E23]">{job.category}</p>
                </div>
              </div>
              {viewJob.adImageUrl ? (
                <div className="relative w-full border border-black/5 shadow-sm">
                  <img src={viewJob.adImageUrl} className="w-full h-auto" alt="job poster" />
                </div>
              ) : (
                <div className="py-24 text-center bg-[#F5F6F7] border border-dashed border-black/10">
                  <p className="text-black/20 font-black">상세 모집 공고 이미지가 없습니다.</p>
                </div>
              )}
            </div>
            <div className="p-6 bg-[#F5F6F7] border-t border-black/5 flex justify-end">
              <Button onClick={() => setViewJob(null)} className="h-12 px-10 rounded-none naver-button text-base">창 닫기</Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
