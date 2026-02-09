
"use client"

import { useState, useMemo, useRef } from "react"
import { Header } from "@/components/chuchot/Header"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection, query, orderBy, addDoc } from "firebase/firestore"
import { Instructor } from "@/lib/types"
import { Plus, Search, Star, Award, Briefcase, MessageSquare, Camera, Check, ChevronRight, GraduationCap } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"

const INSTRUCTOR_CATEGORIES = [
  "전체보기", "HRD/교육공학", "리더십/코칭", "조직문화/개발", "채용/면접관", "인사전략/HRM", "DX/AI 활용", "비즈니스 스킬", "공공/법정의무", "심리/힐링"
]

const MOCK_INSTRUCTORS: Instructor[] = [
  {
    id: "inst-1",
    name: "최영희",
    specialty: "비즈니스 커뮤니케이션",
    bio: "국내 대기업 및 공공기관 500회 이상의 출강 경력을 보유하고 있습니다. 갈등 관리와 비즈니스 매너, 세대 간 소통 전문가로서 실질적인 변화를 이끌어냅니다.",
    profilePictureUrl: "https://picsum.photos/seed/inst1/400/400",
    userId: "mock-i1",
    createdAt: Date.now()
  },
  {
    id: "inst-2",
    name: "정성진",
    specialty: "DX/AI 활용 실무",
    bio: "HR 테크와 AI 도입 전략 전문가입니다. 생성형 AI를 활용한 업무 자동화 및 HR 데이터 분석 강의를 통해 조직의 디지털 전환을 돕고 있습니다.",
    profilePictureUrl: "https://picsum.photos/seed/inst2/400/400",
    userId: "mock-i2",
    createdAt: Date.now()
  },
  {
    id: "inst-3",
    name: "강수진",
    specialty: "기획력 및 문서작성",
    bio: "논리적 사고 기반의 기획서 작성 및 프레젠테이션 스킬을 전수합니다. 한 장의 보고서로 의사결정권자를 설득하는 압도적인 노하우를 공유합니다.",
    profilePictureUrl: "https://picsum.photos/seed/inst3/400/400",
    userId: "mock-i3",
    createdAt: Date.now()
  }
]

export default function InstructorsPage() {
  const { user } = useUser()
  const db = useFirestore()
  const { toast } = useToast()
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("전체보기")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [name, setName] = useState("")
  const [specialty, setSpecialty] = useState("")
  const [bio, setBio] = useState("")
  const [profilePictureUrl, setProfilePictureUrl] = useState<string | null>(null)

  const instructorsQuery = useMemoFirebase(() => {
    if (!db) return null
    return query(collection(db, "instructors"), orderBy("createdAt", "desc"))
  }, [db])

  const { data: instructorsData, isLoading } = useCollection<Instructor>(instructorsQuery)
  
  const instructors = useMemo(() => {
    const fetched = instructorsData || []
    if (fetched.length === 0 && !searchQuery) return MOCK_INSTRUCTORS
    return fetched
  }, [instructorsData, searchQuery])

  const filteredInstructors = useMemo(() => {
    return instructors.filter(i => {
      const matchesSearch = i.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          i.specialty.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          i.bio.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === "전체보기" || i.specialty.includes(selectedCategory);
      return matchesSearch && matchesCategory;
    });
  }, [instructors, searchQuery, selectedCategory]);

  const handleOpenDialog = () => {
    if (!user) {
      toast({ title: "로그인 필요", description: "강사 프로필을 등록하려면 로그인이 필요합니다.", variant: "destructive" })
      router.push("/auth?mode=login")
      return
    }
    setIsDialogOpen(true)
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => setProfilePictureUrl(reader.result as string)
      reader.readAsDataURL(file)
    }
  }

  const handleAddInstructor = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setIsSubmitting(true)
    try {
      await addDoc(collection(db, "instructors"), {
        name,
        specialty,
        bio,
        profilePictureUrl: profilePictureUrl || `https://picsum.photos/seed/${name}/400/400`,
        userId: user.uid,
        createdAt: Date.now()
      })
      toast({ title: "등록 완료", description: "강사 프로필이 성공적으로 생성되었습니다." })
      setIsDialogOpen(false)
      setName(""); setSpecialty(""); setBio(""); setProfilePictureUrl(null)
    } catch (error) {
      toast({ title: "오류 발생", description: "등록 중 문제가 발생했습니다.", variant: "destructive" })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 py-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-10 mb-16">
          <div className="space-y-4 flex-1">
            <div className="flex items-center gap-3">
              <div className="h-1.5 w-16 bg-accent rounded-full"></div>
              <span className="text-xs font-black text-accent uppercase tracking-[0.2em]">Instructor PR Center</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-primary tracking-tighter">강사 정보</h1>
            <p className="text-lg font-bold text-primary/30 max-w-2xl">압도적인 전문성과 검증된 강의력을 갖춘 최고의 HR 파트너들을 소개합니다.</p>
            
            <div className="relative max-w-xl group pt-4">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-primary/30 group-focus-within:text-accent transition-colors" />
              <Input 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="찾으시는 강사명이나 전문 강의 주제를 검색하세요..." 
                className="h-14 pl-14 pr-6 bg-white border-none rounded-2xl shadow-sm focus-visible:ring-accent/50 text-sm font-bold placeholder:text-primary/20"
              />
            </div>
          </div>

          <Button 
            onClick={handleOpenDialog}
            className="gold-gradient text-primary font-black h-16 px-10 rounded-[2rem] shadow-2xl hover:scale-105 active:scale-95 transition-all gap-3"
          >
            <Plus className="w-6 h-6" />
            강사 프로필 등록하기
          </Button>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent className="max-w-xl bg-white border-none rounded-[3rem] p-10 shadow-2xl">
              <DialogHeader>
                <DialogTitle className="text-2xl font-black text-primary mb-8 flex items-center gap-3">
                  <GraduationCap className="w-8 h-8 text-accent" />
                  강사 프로필 등록
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddInstructor} className="space-y-6">
                <div className="flex flex-col items-center mb-6">
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="relative w-40 h-40 rounded-[2.5rem] bg-primary/5 border-2 border-dashed border-primary/10 flex flex-col items-center justify-center cursor-pointer hover:border-accent transition-all overflow-hidden shadow-inner"
                  >
                    {profilePictureUrl ? (
                      <img src={profilePictureUrl} alt="preview" className="w-full h-full object-cover" />
                    ) : (
                      <>
                        <Camera className="w-10 h-10 text-primary/20 mb-2" />
                        <p className="text-[11px] text-primary/40 font-black">사진 파일 선택</p>
                      </>
                    )}
                  </div>
                  <input type="file" ref={fileInputRef} onChange={handleImageChange} accept="image/*" className="hidden" />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-primary/40 ml-2">성함</label>
                  <Input value={name} onChange={e => setName(e.target.value)} required placeholder="강사 성함" className="h-12 bg-primary/5 border-none rounded-xl" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-primary/40 ml-2">전문 분야</label>
                  <Select onValueChange={setSpecialty} required>
                    <SelectTrigger className="h-12 bg-primary/5 border-none rounded-xl"><SelectValue placeholder="주요 분야 선택" /></SelectTrigger>
                    <SelectContent>
                      {INSTRUCTOR_CATEGORIES.filter(c => c !== "전체보기").map(c => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-primary/40 ml-2">자기 소개 및 주요 경력</label>
                  <Textarea value={bio} onChange={e => setBio(e.target.value)} required placeholder="주요 출강 기관 및 대표 강의 주제를 설명해주세요" className="bg-primary/5 border-none rounded-xl min-h-[150px]" />
                </div>
                <Button type="submit" disabled={isSubmitting} className="w-full h-14 bg-primary text-accent font-black rounded-2xl shadow-lg mt-6">
                  {isSubmitting ? "등록 중..." : "강사 프로필 게시하기"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="flex flex-wrap gap-3 mb-16">
          {INSTRUCTOR_CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={cn(
                "px-6 py-3 rounded-2xl text-[15px] font-black transition-all border-2",
                selectedCategory === cat 
                  ? "bg-primary text-accent border-primary shadow-xl scale-105" 
                  : "bg-white text-primary/30 border-primary/5 hover:border-accent/30 hover:text-primary"
              )}
            >
              {cat}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-40"><Star className="w-16 h-16 animate-spin text-accent" /></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10">
            {filteredInstructors.map((i) => (
              <Card key={i.id} className="group bg-white border-primary/5 rounded-[3.5rem] overflow-hidden shadow-sm hover:shadow-2xl hover:-translate-y-4 transition-all duration-500">
                <CardContent className="p-10 flex flex-col items-center text-center">
                  <div className="relative mb-10">
                    <div className="absolute inset-0 bg-accent blur-3xl opacity-10 group-hover:opacity-30 transition-opacity"></div>
                    <div className="relative w-44 h-44 rounded-[3rem] overflow-hidden border-4 border-white shadow-2xl">
                       <img src={i.profilePictureUrl} alt={i.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                    </div>
                    <Badge className="absolute -bottom-3 right-0 bg-primary text-accent font-black border-none px-5 py-2 rounded-xl shadow-2xl flex gap-1.5 items-center animate-pulse">
                      <Check className="w-4 h-4" /> VERIFIED
                    </Badge>
                  </div>
                  
                  <div className="space-y-1.5 mb-8">
                    <h3 className="text-2xl font-black text-primary group-hover:text-accent transition-colors">{i.name} 강사</h3>
                    <p className="text-accent font-black text-xs uppercase tracking-[0.25em]">#{i.specialty}</p>
                  </div>
                  
                  <div className="w-16 h-1.5 bg-primary/5 rounded-full mb-8 group-hover:w-28 group-hover:bg-accent transition-all duration-500"></div>
                  
                  <p className="text-sm text-primary/60 line-clamp-4 mb-12 font-medium leading-relaxed italic px-2">
                    "{i.bio}"
                  </p>

                  <div className="grid grid-cols-1 w-full gap-4 mt-auto">
                    <Button className="h-14 rounded-2xl bg-primary/5 hover:bg-primary text-primary hover:text-accent font-black transition-all gap-2">
                      <Briefcase className="w-5 h-5" /> 대표 커리큘럼 보기
                    </Button>
                    <Button variant="outline" className="h-14 rounded-2xl border-primary/10 text-primary font-black gap-2 hover:bg-accent/10 transition-all">
                      <MessageSquare className="w-5 h-5" /> 섭외 및 견적 문의
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
