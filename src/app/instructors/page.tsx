"use client"

import { useState, useMemo, useRef } from "react"
import { Header } from "@/components/whisper/Header"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection, query, orderBy, addDoc } from "firebase/firestore"
import { Instructor } from "@/lib/types"
import { Plus, Search, Camera, FileText, Sparkles, Phone, Mail, Award, Briefcase, Video, ImageIcon, Type, Bold, Italic, List, Youtube, X } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"
import Image from "next/image"

const INSTRUCTOR_CATEGORIES = ["전체", "인사전략", "채용/리크루팅", "HRD/교육", "평가/보상(C&B)", "조직문화/EVP", "DX/AI", "노무/ER", "리더십/코칭", "비즈니스 스킬", "면접관 교육", "기타"]

const MOCK_INSTRUCTORS: Instructor[] = [
  { id: "inst-sample-1", name: "김지현", specialty: "리더십", bio: "국내 10대 기업 대상 15년간 리더십 코칭을 수행해온 전문가입니다.", profilePictureUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=400", userId: "mock-i1", createdAt: 1714521600000, isVerified: true, company: "리더십인사이트" }
]

export default function InstructorsPage() {
  const { user } = useUser()
  const db = useFirestore()
  const { toast } = useToast()
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("전체")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [viewTarget, setViewTarget] = useState<Instructor | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [name, setName] = useState("")
  const [specialty, setSpecialty] = useState("")
  const [company, setCompany] = useState("")
  const [bio, setBio] = useState("")
  const [profilePictureUrl, setProfilePictureUrl] = useState<string | null>(null)

  const instructorsQuery = useMemoFirebase(() => db ? query(collection(db, "instructors"), orderBy("createdAt", "desc")) : null, [db])
  const { data: instructorsData, isLoading } = useCollection<Instructor>(instructorsQuery)
  
  const instructors = useMemo(() => {
    const fetched = instructorsData || []
    const merged = [...fetched]
    MOCK_INSTRUCTORS.forEach(mi => { if (!merged.some(i => i.id === mi.id)) merged.push(mi) })
    return merged.sort((a, b) => b.createdAt - a.createdAt)
  }, [instructorsData])

  const filteredInstructors = instructors.filter(i => {
    const matchesSearch = i.name.toLowerCase().includes(searchQuery.toLowerCase()) || i.bio.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === "전체" || i.specialty === selectedCategory
    return matchesSearch && matchesCategory
  })

  const handleOpenDialog = (open: boolean) => {
    if (open && !user) {
      toast({ title: "로그인 필요", description: "강사 등록을 위해 로그인이 필요합니다.", variant: "destructive" }); 
      router.push("/auth?mode=login"); 
      return; 
    }
    setIsDialogOpen(open)
  }

  const handleAddInstructor = async (e: React.FormEvent) => {
    e.preventDefault(); if (!user) return;
    setIsSubmitting(true)
    try {
      await addDoc(collection(db, "instructors"), {
        name, specialty, company, bio, profilePictureUrl: profilePictureUrl || `https://picsum.photos/seed/${name}/400/400`,
        userId: user.uid, createdAt: Date.now(), isVerified: false 
      })
      toast({ title: "등록 완료" }); setIsDialogOpen(false)
    } catch (error) { toast({ title: "오류", variant: "destructive" }) }
    finally { setIsSubmitting(false) }
  }

  return (
    <div className="min-h-screen bg-[#F5F6F7]">
      <Header />
      <main className="max-w-7xl mx-auto px-4 py-8 md:py-16 pb-24">
        <div className="flex flex-col gap-8 mb-16">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-1">
              <h1 className="text-3xl md:text-4xl font-black text-[#1E1E23] tracking-tighter">강사 인텔리전스</h1>
              <p className="text-sm md:text-base font-bold text-[#888]">분야별 최고의 전문 강사진 프로필 및 섭외 정보</p>
            </div>
            <div className="hidden md:block">
              <Dialog open={isDialogOpen} onOpenChange={handleOpenDialog}>
                <DialogTrigger asChild><Button className="naver-button h-14 px-10 rounded-xl shadow-xl gap-3 text-base"><Plus className="w-5 h-5" /> 전문 강사 등록</Button></DialogTrigger>
                <DialogContent className="max-w-4xl bg-white border-none rounded-none p-0 shadow-2xl overflow-hidden max-h-[95vh] flex flex-col">
                  <DialogHeader className="bg-white border-b border-black/5 p-8 shrink-0"><DialogTitle className="text-2xl font-black text-accent">전문 강사 프로필 게시</DialogTitle></DialogHeader>
                  <div className="flex-1 overflow-y-auto p-10"><form onSubmit={handleAddInstructor} className="space-y-12"><Button type="submit" disabled={isSubmitting} className="w-full h-16 naver-button text-lg rounded-xl shadow-2xl">강사 등록 요청 완료</Button></form></div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <div className="relative group">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-black/20" />
              <Input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="강사 성함, 전문 분야, 소속 기업으로 검색해 보세요" className="h-16 pl-16 pr-8 bg-white border-2 border-primary rounded-2xl shadow-lg focus-visible:ring-0 text-lg font-black" />
            </div>
            <div className="hidden md:flex flex-wrap gap-2 md:gap-3 py-2">
              {INSTRUCTOR_CATEGORIES.map((cat) => (
                <button key={cat} onClick={() => setSelectedCategory(cat)} className={cn("px-8 py-3.5 rounded-full text-xs font-black transition-all border-2 whitespace-nowrap", selectedCategory === cat ? "bg-primary text-accent border-primary shadow-lg" : "bg-white text-black/30 border-black/5 hover:border-primary/30")}>{cat}</button>
              ))}
            </div>
            <div className="md:hidden">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-full h-14 bg-white border-2 border-black/5 rounded-2xl font-black text-accent px-6">
                  <div className="flex items-center gap-2"><span className="text-primary">전문분야:</span><SelectValue /></div>
                </SelectTrigger>
                <SelectContent className="rounded-2xl shadow-3xl border-none p-2">{INSTRUCTOR_CATEGORIES.map((cat) => (<SelectItem key={cat} value={cat} className="rounded-xl py-3 font-bold">{cat}</SelectItem>))}</SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {isLoading ? ( <div className="flex justify-center py-40"><Sparkles className="w-14 h-14 animate-spin text-primary" /></div> ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10">
            {filteredInstructors.map((i) => (
              <Card key={i.id} className="group bg-white border border-black/[0.06] hover:border-primary/20 hover:shadow-2xl transition-all duration-500 rounded-[2.5rem] overflow-hidden flex flex-col h-full">
                <CardContent className="p-10 flex flex-col items-center text-center">
                  <div className="w-40 h-40 rounded-full overflow-hidden border-4 border-white shadow-xl mb-8"><img src={i.profilePictureUrl} alt={i.name} className="w-full h-full object-cover" /></div>
                  <h3 className="text-2xl font-black text-accent mb-1">{i.name} 강사</h3>
                  <Badge variant="outline" className="mb-8 border-primary/20 text-primary font-black text-xs px-5 py-1 rounded-full">#{i.specialty}</Badge>
                  <Button onClick={() => setViewTarget(i)} className="w-full h-12 rounded-xl naver-button text-accent text-sm gap-2">상세 프로필 확인</Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}