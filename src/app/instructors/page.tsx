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
    id: "inst-1",
    name: "최영희",
    specialty: "커뮤니케이션",
    bio: "커뮤니케이션 및 갈등 관리 전문가. 국내 대기업 및 공공기관 500회 이상의 출강 경력을 보유하고 있습니다.",
    profilePictureUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=400",
    userId: "mock-i1",
    createdAt: Date.now(),
    isVerified: true
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
    if (fetched.length === 0 && !searchQuery) return MOCK_INSTRUCTORS
    return fetched
  }, [instructorsData, searchQuery])

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
        <div className="flex flex-col gap-10 mb-16">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
            <div className="space-y-3">
              <h1 className="text-3xl md:text-4xl font-black text-[#1E1E23] tracking-tighter">강사 인텔리전스</h1>
              <p className="text-sm md:text-base font-bold text-[#888]">분야별 최고의 전문 강사진 프로필 및 섭외 정보</p>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="naver-button h-12 md:h-14 px-8 shadow-md gap-2 text-sm">
                  <Plus className="w-5 h-5" /> 강사 프로필 등록하기
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl bg-white border-none rounded-none p-0 shadow-2xl overflow-hidden">
                <DialogHeader className="bg-[#1E1E23] p-6">
                  <DialogTitle className="text-xl font-black text-primary">전문 강사 프로필 등록</DialogTitle>
                  <p className="text-white/40 text-[10px] font-bold mt-0.5 uppercase tracking-widest">Register Professional Instructor</p>
                </DialogHeader>
                <form onSubmit={handleAddInstructor} className="p-8 space-y-8">
                  <div className="flex flex-col md:flex-row gap-8">
                    <div onClick={() => fileInputRef.current?.click()} className="w-32 h-32 rounded-none bg-[#F5F6F7] border-2 border-dashed border-black/10 flex items-center justify-center cursor-pointer hover:border-primary overflow-hidden shrink-0">
                      {profilePictureUrl ? <img src={profilePictureUrl} className="w-full h-full object-cover" alt="preview" /> : <Camera className="w-8 h-8 text-black/10" />}
                    </div>
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => {
                      const file = e.target.files?.[0]; if (file) { const reader = new FileReader(); reader.onloadend = () => setProfilePictureUrl(reader.result as string); reader.readAsDataURL(file); }
                    }} />
                    <div className="flex-1 space-y-4">
                      <Input value={name} onChange={e => setName(e.target.value)} required placeholder="성함" className="h-12 bg-white border-black/10 rounded-none font-bold" />
                      <Select onValueChange={setSpecialty} required>
                        <SelectTrigger className="h-12 bg-white border-black/10 rounded-none"><SelectValue placeholder="전문 카테고리" /></SelectTrigger>
                        <SelectContent>{INSTRUCTOR_CATEGORIES.filter(c => c !== "전체").map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Textarea value={bio} onChange={e => setBio(e.target.value)} required placeholder="강사 소개, 주요 강의 이력 및 전문 분야를 상세히 적어주세요." className="min-h-[150px] bg-white border-black/10 rounded-none p-4 text-sm leading-relaxed" />
                  <Button type="submit" disabled={isSubmitting} className="w-full h-14 naver-button text-base">프로필 게시 완료</Button>
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
                placeholder="강사명 또는 강의 주제를 검색해 보세요" 
                className="h-14 pl-14 pr-6 bg-white border-2 border-primary rounded-none shadow-sm focus-visible:ring-0 text-base font-black placeholder:text-black/10"
              />
            </div>
            <div className="flex overflow-x-auto gap-2 scrollbar-hide py-1">
              {INSTRUCTOR_CATEGORIES.map((cat) => (
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

        {isLoading ? (
          <div className="flex justify-center py-40"><Sparkles className="w-12 h-12 animate-spin text-primary" /></div>
        ) : filteredInstructors.length === 0 ? (
          <div className="py-40 text-center bg-white border border-black/5">
            <p className="text-black/20 font-black text-xl">준비된 강사 정보가 없습니다.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {filteredInstructors.map((i) => (
              <Card key={i.id} className="group bg-white border border-black/[0.06] hover:border-black/[0.12] transition-all duration-500 rounded-none overflow-hidden flex flex-col h-full">
                <CardContent className="p-8 flex flex-col items-center text-center">
                  <div className="relative mb-6">
                    <div className="w-32 h-32 rounded-none overflow-hidden border-2 border-black/5 shadow-md">
                       <img src={i.profilePictureUrl} alt={i.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                    </div>
                    {i.isVerified && <Badge className="absolute -bottom-2 right-0 bg-[#1E1E23] text-primary font-black border-none px-2 py-0.5 rounded-none text-[8px]">VERIFIED</Badge>}
                  </div>
                  <h3 className="text-xl font-black text-[#1E1E23] mb-1">{i.name} 강사</h3>
                  <Badge variant="outline" className="mb-6 border-primary/20 text-primary font-black text-[10px] px-3 rounded-none">#{i.specialty}</Badge>
                  <p className="text-[13px] text-black/50 line-clamp-3 mb-8 font-medium italic px-2">"{i.bio}"</p>
                  <Button onClick={() => setViewTarget(i)} className="w-full h-11 rounded-none naver-button text-xs gap-1.5 shadow-lg">상세 프로필 확인</Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      {viewTarget && (
        <Dialog open={!!viewTarget} onOpenChange={() => setViewTarget(null)}>
          <DialogContent className="max-w-2xl bg-white border-none rounded-none p-0 shadow-2xl overflow-hidden">
            <DialogHeader className="bg-[#1E1E23] p-6">
              <DialogTitle className="text-xl font-black text-primary">{viewTarget.name} 강사 상세 프로필</DialogTitle>
            </DialogHeader>
            <div className="p-8">
              <div className="flex items-center gap-8 mb-10">
                <div className="w-28 h-28 rounded-none overflow-hidden border-2 border-black/5">
                  <img src={viewTarget.profilePictureUrl} alt={viewTarget.name} className="w-full h-full object-cover" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-2xl font-black text-[#1E1E23]">{viewTarget.name} 강사</h2>
                  <Badge className="bg-primary text-[#1E1E23] font-black border-none px-3 py-1 rounded-none">#{viewTarget.specialty}</Badge>
                </div>
              </div>
              <div className="space-y-6 max-h-[40vh] overflow-y-auto bg-[#FBFBFC] p-6 border border-black/5">
                <section className="space-y-3">
                  <h4 className="text-[10px] font-black text-black/30 uppercase tracking-widest flex items-center gap-2"><FileText className="w-3 h-3" /> 강사 상세 소개</h4>
                  <p className="text-sm leading-relaxed text-[#404040] whitespace-pre-wrap font-medium">{viewTarget.bio}</p>
                </section>
              </div>
              <div className="pt-8 flex justify-end">
                <Button onClick={() => setViewTarget(null)} className="h-12 px-10 rounded-none naver-button text-base">프로필 닫기</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}