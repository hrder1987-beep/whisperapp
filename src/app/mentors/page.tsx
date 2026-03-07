
"use client"

import { useState, useMemo } from "react"
import { Header } from "@/components/whisper/Header"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc } from "@/firebase"
import { collection, query, addDoc, where, doc } from "firebase/firestore"
import { Instructor, Question, SiteBranding } from "@/lib/types"
import { MessageSquare, Search, FileText, Check, Plus, Sparkles, Briefcase, Award, Zap, Link as LinkIcon, History } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { MessageDialog } from "@/components/whisper/MessageDialog"
import { AvatarIcon } from "@/components/whisper/AvatarIcon"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

const MENTOR_CATEGORIES = ["전체", "전략/기획", "채용", "조직문화", "HRD", "평가/보상", "노무/ER"]

const MOCK_MENTORS: Instructor[] = [
  { id: "mentor-sample-1", name: "김민수", company: "Toss (토스)", jobTitle: "Head of Talent Acquisition", specialty: "채용", bio: "국내 최고의 IT 유니콘 기업에서 10년간 기술 인재 채용과 채용 브랜딩을 총괄해왔습니다.", profilePictureUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=400", userId: "mock-m1", role: "mentor", createdAt: 1714521600000, isVerified: true }
]

export default function MentorsPage() {
  const { user } = useUser()
  const db = useFirestore()
  const { toast } = useToast()
  const router = useRouter()

  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("전체")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [messageTarget, setMessageTarget] = useState<{ id: string, nickname: string } | null>(null)

  const configDocRef = useMemoFirebase(() => db ? doc(db, "admin_configuration", "site_settings") : null, [db])
  const { data: config } = useDoc<any>(configDocRef)
  const branding = useMemo(() => {
    if (config?.brandingSettings) { try { return JSON.parse(config.brandingSettings) as SiteBranding } catch (e) { return null } }
    return null;
  }, [config]);

  const mentorsQuery = useMemoFirebase(() => db ? query(collection(db, "mentors"), where("isVerified", "==", true)) : null, [db])
  const { data: mentorsData, isLoading } = useCollection<Instructor>(mentorsQuery)
  
  const mentors = useMemo(() => {
    const fetched = mentorsData || []
    const merged = [...fetched]
    MOCK_MENTORS.forEach(mm => { if (!merged.some(m => m.id === mm.id)) merged.push(mm) })
    return merged.sort((a, b) => b.createdAt - a.createdAt)
  }, [mentorsData])

  const filteredMentors = mentors.filter(m => {
    const matchesSearch = m.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === "전체" || m.specialty === selectedCategory
    return matchesSearch && matchesCategory
  })

  const handleMentorApplyClick = () => {
    if (!user) {
      toast({ title: "로그인 필요", description: "자격 신청을 하려면 로그인이 필요합니다.", variant: "destructive" })
      router.push("/auth?mode=login")
      return
    }
    setIsDialogOpen(true)
  }

  return (
    <div className="min-h-screen bg-[#F5F6F7]">
      <Header />
      <main className="max-w-7xl mx-auto px-4 py-8 md:py-16 pb-24">
        <div className="flex flex-col gap-8 mb-16">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-1">
              <h1 className="text-3xl md:text-4xl font-black text-[#1E1E23] tracking-tighter">{branding?.mentorTitle || "위스퍼러 (Whisperer)"}</h1>
              <p className="text-sm md:text-base font-bold text-[#888]">{branding?.mentorSubtitle || "대한민국 최고의 실무 전문가들과의 1:1 인사이트 연결"}</p>
            </div>
            <Button onClick={handleMentorApplyClick} className="naver-button h-14 px-10 rounded-xl shadow-xl gap-3 text-base text-accent"><Plus className="w-5 h-5" /> 위스퍼러 자격 신청</Button>
          </div>
          <div className="flex flex-col gap-6">
            <div className="relative group">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-black/20" />
              <Input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="전문가 성함, 기업명, 주요 전문 분야로 검색해 보세요" className="h-16 pl-16 pr-8 bg-white border-2 border-primary rounded-2xl shadow-lg focus-visible:ring-0 text-lg font-black" />
            </div>
            
            {/* Desktop Categories */}
            <div className="hidden md:flex flex-wrap gap-2 md:gap-3 py-2">
              {MENTOR_CATEGORIES.map((cat) => (
                <button key={cat} onClick={() => setSelectedCategory(cat)} className={cn("px-8 py-3.5 rounded-full text-sm font-black transition-all border-2 whitespace-nowrap shrink-0", selectedCategory === cat ? "bg-primary text-accent border-primary shadow-lg" : "bg-white text-black/60 border-black/5 hover:border-primary/30")}>{cat}</button>
              ))}
            </div>

            {/* Mobile Categories - Dropdown Style */}
            <div className="md:hidden">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-full h-14 bg-white border-2 border-black/5 rounded-2xl font-black text-accent px-6">
                  <div className="flex items-center gap-2">
                    <span className="text-primary">전문분야:</span>
                    <SelectValue />
                  </div>
                </SelectTrigger>
                <SelectContent className="rounded-2xl shadow-3xl border-none p-2">
                  {MENTOR_CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat} className="rounded-xl py-3 font-bold">{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        {isLoading ? ( <div className="flex justify-center py-40"><Sparkles className="w-14 h-14 animate-spin text-primary" /></div> ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10">
            {filteredMentors.map((m) => (
              <Card key={m.id} className="group bg-white border border-black/[0.06] hover:border-primary/20 hover:shadow-2xl transition-all duration-500 rounded-[2.5rem] overflow-hidden flex flex-col h-full">
                <CardContent className="p-10 flex flex-col items-center text-center">
                  <div className="relative mb-10"><div className="w-40 h-40 rounded-full overflow-hidden border-4 border-white shadow-2xl"><img src={m.profilePictureUrl} alt={m.name} className="w-full h-full object-cover" /></div>{m.isVerified && <Badge className="absolute -bottom-2 right-4 bg-primary text-accent font-black border-none px-4 py-1.5 rounded-full flex gap-2 items-center shadow-xl text-[10px]"><Check className="w-3.5 h-3.5" /> WHISPERER</Badge>}</div>
                  <h3 className="text-2xl font-black text-accent mb-1">{m.name} 전문가</h3>
                  <p className="text-black/40 text-xs font-bold mb-4">{m.company} · {m.jobTitle}</p>
                  <Badge variant="outline" className="mb-8 border-primary/20 text-primary font-black text-[11px] px-5 py-1 rounded-full">#{m.specialty}</Badge>
                  <Button onClick={() => {
                    if(!user) {
                      toast({ title: "로그인 필요", description: "문의를 위해 로그인이 필요합니다.", variant: "destructive" })
                      router.push("/auth?mode=login")
                      return
                    }
                    setMessageTarget({ id: m.userId, nickname: m.name })
                  }} className="w-full h-12 rounded-xl naver-button text-accent font-black text-sm shadow-lg">1:1 인사이트 문의</Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
      {messageTarget && <MessageDialog isOpen={!!messageTarget} onClose={() => setMessageTarget(null)} receiverId={messageTarget.id} receiverNickname={messageTarget.nickname} />}
    </div>
  )
}
