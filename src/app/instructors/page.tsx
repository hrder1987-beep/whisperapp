
"use client"

import { useState, useMemo, useRef } from "react"
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
import { Instructor } from "@/lib/types"
import { Plus, Search, Camera, FileText, Sparkles } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"

const INSTRUCTOR_CATEGORIES = ["전체", "리더십", "직무역량", "HRD/교육", "DX/AI", "조직문화", "커뮤니케이션", "기타"]

const MOCK_INSTRUCTORS: Instructor[] = [
  {
    id: "inst-sample-1",
    name: "김지현",
    specialty: "리더십",
    bio: "국내 10대 기업 대상 15년간 리더십 코칭을 수행해온 전문가입니다. 특히 '심리적 안정감' 기반의 고성과 팀 구축 전략에 특화되어 있습니다. 수많은 임원과 팀장들의 행동 변화를 이끌어낸 실질적인 방법론을 전수합니다.",
    profilePictureUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=400",
    userId: "mock-i1",
    createdAt: Date.now() - 86400000 * 3,
    isVerified: true,
    company: "리더십인사이트"
  },
  {
    id: "inst-sample-2",
    name: "이승우",
    specialty: "DX/AI",
    bio: "HR 테크 및 데이터 분석 전문가입니다. 생성형 AI(ChatGPT 등)를 채용과 교육에 즉각적으로 도입할 수 있는 실무 프로세스를 제안합니다. 대기업 HR transformation 프로젝트 다수 수행.",
    profilePictureUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=400",
    userId: "mock-i2",
    createdAt: Date.now() - 86400000 * 1,
    isVerified: true,
    company: "HR테크 연구소"
  },
  {
    id: "inst-sample-3",
    name: "박민정",
    specialty: "커뮤니케이션",
    bio: "현업에서 바로 쓰는 '비즈니스 커뮤니케이션' 및 '세대 간 갈등 관리' 전문 강사입니다. 전직 아나운서 출신으로 명확한 전달력과 심리학 기반의 소통 스킬을 전파하며 수강생 만족도 4.9/5.0를 기록하고 있습니다.",
    profilePictureUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=400",
    userId: "mock-i3",
    createdAt: Date.now() - 86400000 * 7,
    isVerified: true,
    company: "소통의정석"
  }
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

  const handleAddInstructor = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) { toast({ title: "로그인 필요", description: "강사 등록을 위해 로그인이 필요합니다.", variant: "destructive" }); router.push("/auth?mode=login"); return; }
    setIsSubmitting(true)
    try {
      await addDoc(collection(db, "instructors"), {
        name, specialty, bio, profilePictureUrl: profilePictureUrl || `https://picsum.photos/seed/${name}/400/400`,
        userId: user.uid, createdAt: Date.now(), isVerified: false 
      })
      toast({ title: "등록 완료", description: "강사 프로필이 생성되었습니다. 검토 후 공식 등록됩니다." })
      setIsDialogOpen(false); setName(""); setSpecialty(""); setBio("")
    } catch (error) { toast({ title: "오류", description: "문제가 발생했습니다.", variant: "destructive" }) }
    finally { setIsSubmitting(false) }
  }

  return (
    <div className="min-h-screen bg-[#F5F6F7]">
      <Header />
      <main className="max-w-7xl mx-auto px-4 py-8 md:py-16">
        <div className="flex flex-col gap-8 mb-16">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-1">
              <h1 className="text-3xl md:text-4xl font-black text-[#1E1E23] tracking-tighter">강사 인텔리전스</h1>
              <p className="text-sm md:text-base font-bold text-[#888]">분야별 최고의 전문 강사진 프로필 및 섭외 정보</p>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="naver-button h-14 px-10 rounded-xl shadow-xl transition-all gap-3 text-base">
                  <Plus className="w-5 h-5" />
                  전문 강사 등록
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl bg-white border-none rounded-[2.5rem] p-0 shadow-2xl overflow-hidden">
                <DialogHeader className="bg-white border-b border-black/5 p-8">
                  <DialogTitle className="text-2xl font-black text-accent">강사 프로필 게시</DialogTitle>
                  <p className="text-black/40 text-[10px] font-bold mt-1 uppercase tracking-widest">Register Professional Instructor</p>
                </DialogHeader>
                <form onSubmit={handleAddInstructor} className="p-10 space-y-8">
                  <div className="flex flex-col md:flex-row gap-10">
                    <div onClick={() => fileInputRef.current?.click()} className="w-40 h-40 rounded-2xl bg-[#F5F6F7] border-2 border-dashed border-black/10 flex items-center justify-center cursor-pointer hover:border-primary overflow-hidden shrink-0 shadow-inner group">
                      {profilePictureUrl ? <img src={profilePictureUrl} className="w-full h-full object-cover" alt="preview" /> : <Camera className="w-10 h-10 text-black/10 group-hover:text-primary transition-colors" />}
                    </div>
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => {
                      const file = e.target.files?.[0]; if (file) { const reader = new FileReader(); reader.onloadend = () => setProfilePictureUrl(reader.result as string); reader.readAsDataURL(file); }
                    }} />
                    <div className="flex-1 space-y-6">
                      <div className="space-y-2">
                        <label className="text-[11px] font-black text-accent/40 uppercase tracking-widest ml-1">성함</label>
                        <Input value={name} onChange={e => setName(e.target.value)} required placeholder="강사 실명" className="h-12 bg-[#F5F6F7] border-none rounded-xl font-bold shadow-inner" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[11px] font-black text-accent/40 uppercase tracking-widest ml-1">전문 카테고리</label>
                        <Select onValueChange={setSpecialty} required>
                          <SelectTrigger className="h-12 bg-[#F5F6F7] border-none rounded-xl font-bold shadow-inner"><SelectValue placeholder="카테고리 선택" /></SelectTrigger>
                          <SelectContent>{INSTRUCTOR_CATEGORIES.filter(c => c !== "전체").map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-accent/40 uppercase tracking-widest ml-1">강사 상세 소개</label>
                    <Textarea value={bio} onChange={e => setBio(e.target.value)} required placeholder="주요 강의 이력 및 전문 분야를 상세히 적어주세요." className="min-h-[200px] bg-[#F5F6F7] border-none rounded-2xl p-6 text-sm leading-relaxed font-medium shadow-inner" />
                  </div>
                  <Button type="submit" disabled={isSubmitting} className="w-full h-14 naver-button text-lg rounded-xl shadow-xl">강사 프로필 등록 요청</Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="flex flex-col gap-6">
            <div className="relative group">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-black/20 group-focus-within:text-primary transition-colors" />
              <Input 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="검색어를 입력해 보세요 (예: 리더십, 김지현)" 
                className="h-16 pl-16 pr-8 bg-white border-2 border-primary rounded-2xl shadow-lg focus-visible:ring-0 text-lg font-black placeholder:text-black/10"
              />
            </div>
            <div className="flex overflow-x-auto gap-3 scrollbar-hide py-2">
              {INSTRUCTOR_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={cn(
                    "px-8 py-3.5 rounded-full text-sm font-black transition-all border-2 whitespace-nowrap",
                    selectedCategory === cat 
                      ? "bg-primary text-white border-primary shadow-lg" 
                      : "bg-white text-black/30 border-black/5 hover:border-primary/30"
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-40"><Sparkles className="w-14 h-14 animate-spin text-primary" /></div>
        ) : filteredInstructors.length === 0 ? (
          <div className="py-40 text-center bg-white border border-black/5 rounded-[3rem]">
            <p className="text-black/20 font-black text-xl">준비된 강사 정보가 없습니다.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10">
            {filteredInstructors.map((i) => (
              <Card key={i.id} className="group bg-white border border-black/[0.06] hover:border-primary/20 hover:shadow-2xl transition-all duration-500 rounded-[2.5rem] overflow-hidden flex flex-col h-full">
                <CardContent className="p-10 flex flex-col items-center text-center">
                  <div className="relative mb-8">
                    <div className="w-40 h-40 rounded-full overflow-hidden border-4 border-white shadow-xl">
                       <img src={i.profilePictureUrl} alt={i.name} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" />
                    </div>
                    {i.isVerified && <Badge className="absolute -bottom-2 right-2 bg-accent text-primary font-black border-none px-4 py-1.5 rounded-full text-[9px] shadow-lg">VERIFIED</Badge>}
                  </div>
                  <h3 className="text-2xl font-black text-accent mb-1">{i.name} 강사</h3>
                  {i.company && <p className="text-xs font-bold text-black/30 mb-4">{i.company}</p>}
                  <Badge variant="outline" className="mb-8 border-primary/20 text-primary font-black text-xs px-5 py-1 rounded-full">#{i.specialty}</Badge>
                  <p className="text-sm text-black/50 line-clamp-3 mb-10 font-medium leading-relaxed italic px-4">"{i.bio}"</p>
                  <Button onClick={() => setViewTarget(i)} className="w-full h-12 rounded-xl naver-button text-sm gap-2 shadow-lg group-hover:scale-[1.02] transition-transform">상세 프로필 확인</Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      {viewTarget && (
        <Dialog open={!!viewTarget} onOpenChange={() => setViewTarget(null)}>
          <DialogContent className="max-w-2xl bg-white border-none rounded-[2.5rem] p-0 shadow-2xl overflow-hidden">
            <DialogHeader className="bg-white border-b border-black/5 p-8">
              <DialogTitle className="text-2xl font-black text-accent">{viewTarget.name} 강사 상세 프로필</DialogTitle>
            </DialogHeader>
            <div className="p-10">
              <div className="flex items-center gap-10 mb-12">
                <div className="w-36 h-36 rounded-full overflow-hidden border-4 border-white shadow-xl">
                  <img src={viewTarget.profilePictureUrl} alt={viewTarget.name} className="w-full h-full object-cover" />
                </div>
                <div className="space-y-3">
                  <h2 className="text-3xl font-black text-accent">{viewTarget.name} 강사</h2>
                  <div className="flex flex-wrap gap-2">
                    <Badge className="bg-primary text-white font-black border-none px-4 py-1.5 rounded-full">#{viewTarget.specialty}</Badge>
                    {viewTarget.company && <Badge variant="outline" className="border-black/10 text-black/40 font-bold px-4 py-1.5 rounded-full">{viewTarget.company}</Badge>}
                  </div>
                </div>
              </div>
              <div className="space-y-8 max-h-[40vh] overflow-y-auto bg-[#F5F6F7] p-10 rounded-[2rem] shadow-inner">
                <section className="space-y-4">
                  <h4 className="text-[11px] font-black text-accent/30 uppercase tracking-widest flex items-center gap-2"><FileText className="w-4 h-4 text-primary" /> 강사 상세 소개 및 주요 이력</h4>
                  <p className="text-base leading-relaxed text-accent/80 whitespace-pre-wrap font-medium">{viewTarget.bio}</p>
                </section>
              </div>
              <div className="pt-10 flex justify-end">
                <Button onClick={() => setViewTarget(null)} className="h-14 px-12 rounded-xl naver-button text-lg shadow-xl">창 닫기</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
