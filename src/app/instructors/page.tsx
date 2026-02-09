
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
import { Plus, Search, User, Star, Award, Briefcase, MessageSquare, Camera, X, Check, ChevronRight } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"

const INSTRUCTOR_CATEGORIES = [
  "전체보기", "HRD/교육공학", "리더십/코칭", "조직문화/개발", "채용/면접관", "인사전략/HRM", "DX/AI 활용", "비즈니스 스킬", "공공/법정의무", "심리/힐링"
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

  // New instructor form state
  const [name, setName] = useState("")
  const [specialty, setSpecialty] = useState("")
  const [bio, setBio] = useState("")
  const [profilePictureUrl, setProfilePictureUrl] = useState<string | null>(null)

  const instructorsQuery = useMemoFirebase(() => {
    if (!db) return null
    return query(collection(db, "instructors"), orderBy("createdAt", "desc"))
  }, [db])

  const { data: instructorsData, isLoading } = useCollection<Instructor>(instructorsQuery)
  const instructors = instructorsData || []

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
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
          <div className="space-y-4 flex-1">
            <div className="flex items-center gap-2">
              <div className="h-1 w-12 bg-accent rounded-full"></div>
              <span className="text-xs font-black text-accent uppercase tracking-widest">Instructor PR Center</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-primary tracking-tighter">강사 정보</h1>
            <p className="text-lg font-bold text-primary/30">검증된 전문성과 통찰력을 갖춘 HR 최고의 파트너</p>
            
            <div className="relative max-w-xl group pt-4">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary/30 group-focus-within:text-accent transition-colors" />
              <Input 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="찾으시는 강사명이나 전문 분야를 입력하세요..." 
                className="h-14 pl-12 pr-4 bg-white border-none rounded-2xl shadow-sm focus-visible:ring-accent/50 text-sm font-bold placeholder:text-primary/20"
              />
            </div>
          </div>

          <Button 
            onClick={handleOpenDialog}
            className="gold-gradient text-primary font-black h-14 px-10 rounded-[1.5rem] shadow-xl hover:scale-105 active:scale-95 transition-all gap-3"
          >
            <Plus className="w-6 h-6" />
            강사 프로필 등록하기
          </Button>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent className="max-w-xl bg-white border-none rounded-[2.5rem] p-8 shadow-2xl">
              <DialogHeader>
                <DialogTitle className="text-2xl font-black text-primary mb-6 flex items-center gap-2">
                  <Star className="w-6 h-6 text-accent" />
                  새로운 강사 프로필 등록
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddInstructor} className="space-y-6">
                <div className="flex flex-col items-center mb-4">
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="relative w-32 h-32 rounded-[2.5rem] bg-primary/5 border-2 border-dashed border-primary/10 flex flex-col items-center justify-center cursor-pointer hover:border-accent transition-all overflow-hidden shadow-inner"
                  >
                    {profilePictureUrl ? (
                      <img src={profilePictureUrl} alt="preview" className="w-full h-full object-cover" />
                    ) : (
                      <>
                        <Camera className="w-8 h-8 text-primary/20 mb-1" />
                        <p className="text-[10px] text-primary/40 font-black text-center px-2">프로필 사진</p>
                      </>
                    )}
                  </div>
                  <input type="file" ref={fileInputRef} onChange={handleImageChange} accept="image/*" className="hidden" />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-primary/40 ml-1">성함</label>
                  <Input value={name} onChange={e => setName(e.target.value)} required placeholder="강사 성함" className="h-12 bg-primary/5 border-none rounded-xl" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-primary/40 ml-1">전문 분야</label>
                  <Select onValueChange={setSpecialty} required>
                    <SelectTrigger className="h-12 bg-primary/5 border-none rounded-xl">
                      <SelectValue placeholder="주요 분야 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      {INSTRUCTOR_CATEGORIES.filter(c => c !== "전체보기").map(c => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-primary/40 ml-1">자기 소개 및 주요 경력</label>
                  <Textarea value={bio} onChange={e => setBio(e.target.value)} required placeholder="강사님의 주요 경력과 핵심 강의 주제를 입력하세요" className="bg-primary/5 border-none rounded-xl min-h-[150px]" />
                </div>
                <Button type="submit" disabled={isSubmitting} className="w-full h-14 bg-primary text-accent font-black rounded-2xl shadow-lg mt-4">
                  {isSubmitting ? "등록 중..." : "강사 프로필 생성하기"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="flex flex-wrap gap-2 mb-12">
          {INSTRUCTOR_CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={cn(
                "px-5 py-2.5 rounded-2xl text-sm font-black transition-all border",
                selectedCategory === cat 
                  ? "bg-primary text-accent border-primary shadow-lg" 
                  : "bg-white text-primary/40 border-primary/5 hover:border-accent hover:text-primary"
              )}
            >
              {cat}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-32"><Star className="w-12 h-12 animate-spin text-accent" /></div>
        ) : filteredInstructors.length === 0 ? (
          <div className="py-32 text-center bg-white rounded-[3rem] border-2 border-dashed border-primary/5">
            <p className="text-xl font-bold text-primary/20">해당 조건에 맞는 강사님이 없습니다.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {filteredInstructors.map((i) => (
              <Card key={i.id} className="group bg-white border-primary/5 rounded-[3rem] overflow-hidden shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500">
                <CardContent className="p-8 flex flex-col items-center text-center">
                  <div className="relative mb-8">
                    <div className="absolute inset-0 bg-accent blur-3xl opacity-10 group-hover:opacity-30 transition-opacity"></div>
                    <div className="relative w-36 h-36 rounded-[2.5rem] overflow-hidden border-4 border-white shadow-2xl">
                       <img src={i.profilePictureUrl} alt={i.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                    </div>
                    <Badge className="absolute -bottom-2 right-0 bg-primary text-accent font-black border-none px-4 py-1.5 rounded-xl shadow-lg flex gap-1 items-center animate-bounce">
                      <Check className="w-3 h-3" /> VERIFIED
                    </Badge>
                  </div>
                  
                  <div className="space-y-1 mb-6">
                    <h3 className="text-2xl font-black text-primary group-hover:text-accent transition-colors">{i.name} 강사</h3>
                    <p className="text-accent font-black text-xs uppercase tracking-[0.2em]">#{i.specialty}</p>
                  </div>
                  
                  <div className="w-12 h-1 bg-primary/5 rounded-full mb-6 group-hover:w-24 group-hover:bg-accent transition-all duration-500"></div>
                  
                  <p className="text-sm text-primary/60 line-clamp-4 mb-10 font-medium leading-relaxed italic px-2">
                    "{i.bio}"
                  </p>

                  <div className="grid grid-cols-1 w-full gap-3 mt-auto">
                    <Button className="h-12 rounded-2xl bg-primary/5 hover:bg-primary text-primary hover:text-accent font-black transition-all gap-2">
                      <Briefcase className="w-4 h-4" /> 포트폴리오 보기
                    </Button>
                    <Button variant="outline" className="h-12 rounded-2xl border-primary/10 text-primary font-black gap-2 hover:bg-accent hover:border-accent hover:text-primary transition-all">
                      <MessageSquare className="w-4 h-4" /> 섭외 제안하기
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
