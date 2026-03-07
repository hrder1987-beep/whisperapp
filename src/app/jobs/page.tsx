"use client"

import { useState, useMemo, useRef } from "react"
import { Header } from "@/components/whisper/Header"
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
  { id: "job-sample-1", companyName: "(주)테크핀코리아", title: "HRD Manager", location: "서울 영등포구", experience: "7년 - 12년", deadline: "2024-12-31", tags: ["HRD", "정규직"], logoUrl: "https://images.unsplash.com/photo-1551288049-bbbda536339a?q=80&w=200", category: "HRD/교육", createdAt: 1714521600000, userId: "mock-j1", education: "대졸 이상" }
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

  const handleOpenDialog = (open: boolean) => {
    if (open && !user) {
      toast({ title: "로그인 필요", description: "공고 등록을 위해 로그인이 필요합니다.", variant: "destructive" }); 
      router.push("/auth?mode=login"); 
      return; 
    }
    setIsDialogOpen(open)
  }

  const handleAddJob = async (e: React.FormEvent) => {
    e.preventDefault(); if (!user) return;
    setIsSubmitting(true)
    try {
      await addDocumentNonBlocking(collection(db, "jobs"), {
        companyName, title, location, experience, deadline, category,
        tags: [experience, category], createdAt: Date.now(), userId: user.uid,
        logoUrl: `https://picsum.photos/seed/${companyName}/100/100`
      })
      toast({ title: "공고 등록 완료" }); setIsDialogOpen(false)
    } catch (error) { toast({ title: "오류 발생", variant: "destructive" }) }
    finally { setIsSubmitting(false) }
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <Header />
      <main className="max-w-5xl mx-auto px-4 py-10 md:py-16 pb-24">
        <div className="flex flex-col gap-10 mb-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-2">
              <h1 className="text-3xl md:text-4xl font-black text-accent tracking-tighter">채용 인텔리전스</h1>
              <p className="text-sm md:text-base font-bold text-accent/40">전문성이 검증된 HR 담당자를 위한 커리어 큐레이션</p>
            </div>
            <div className="hidden md:block">
              <Dialog open={isDialogOpen} onOpenChange={handleOpenDialog}>
                <DialogTrigger asChild><Button className="naver-button h-12 px-8 rounded-none shadow-sm gap-2 text-sm text-accent"><Plus className="w-4 h-4" /> 채용 공고 게시하기</Button></DialogTrigger>
                <DialogContent className="max-w-2xl bg-white border-none rounded-none p-0 shadow-2xl overflow-hidden">
                  <DialogHeader className="bg-white border-b border-black/5 p-8 text-left"><DialogTitle className="text-xl font-black text-accent">신규 채용 공고 등록</DialogTitle></DialogHeader>
                  <form onSubmit={handleAddJob} className="p-8 space-y-8"><Button type="submit" disabled={isSubmitting} className="w-full h-12 naver-button text-accent text-sm rounded-none shadow-md">작성 완료 및 게시</Button></form>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          <div className="space-y-6">
            <div className="relative group">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-black/20" />
              <Input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="관심 있는 기업이나 채용 키워드를 입력하세요" className="h-14 pl-14 pr-6 bg-white border-2 border-primary rounded-none shadow-sm text-base font-bold" />
            </div>
            <div className="hidden md:flex flex-wrap gap-2 py-1">
              {JOB_CATEGORIES.map((cat) => (
                <button key={cat} onClick={() => setSelectedCategory(cat)} className={cn("px-6 py-2.5 rounded-none text-xs font-black transition-all border whitespace-nowrap", selectedCategory === cat ? "bg-primary text-accent border-primary shadow-sm" : "bg-white text-black/40 border-black/5 hover:border-accent/20")}>{cat}</button>
              ))}
            </div>
            <div className="md:hidden">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-full h-14 bg-white border-2 border-black/5 rounded-none font-black text-accent px-6">
                  <div className="flex items-center gap-2"><span className="text-primary">직무:</span><SelectValue /></div>
                </SelectTrigger>
                <SelectContent className="rounded-none shadow-3xl border-none p-2">{JOB_CATEGORIES.map((cat) => (<SelectItem key={cat} value={cat} className="rounded-none py-3 font-bold">{cat}</SelectItem>))}</SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="space-y-1">
          {isLoading ? ( <div className="flex justify-center py-40"><Sparkles className="w-10 h-10 animate-spin text-primary" /></div> ) : filteredJobs.map((job) => (
            <div key={job.id} className="p-6 md:p-8 bg-white border-b border-black/[0.06] hover:bg-black/[0.01] transition-all group flex items-start md:items-center gap-6 md:gap-10 cursor-pointer" onClick={() => setViewJob(job)}>
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-lg bg-[#F5F6F7] overflow-hidden border border-black/5 shrink-0"><img src={job.logoUrl} alt={job.companyName} className="w-full h-full object-cover" /></div>
              <div className="flex-1 min-w-0">
                <span className="text-[11px] font-black text-primary uppercase tracking-wider">{job.companyName}</span>
                <h3 className="text-lg md:text-xl font-black text-accent group-hover:text-primary transition-colors leading-tight mb-3 truncate">{job.title}</h3>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}