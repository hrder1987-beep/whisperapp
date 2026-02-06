
"use client"

import { useState } from "react"
import { Header } from "@/components/chuchot/Header"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection, query, orderBy, addDoc } from "firebase/firestore"
import { TrainingProgram } from "@/lib/types"
import { Calendar, GraduationCap, MapPin, Plus, Search, BookOpen, Clock } from "lucide-react"
import Image from "next/image"
import { format } from "date-fns"
import { ko } from "date-fns/locale"
import { useToast } from "@/hooks/use-toast"

export default function ProgramsPage() {
  const { user } = useUser()
  const db = useFirestore()
  const { toast } = useToast()
  const [searchQuery, setSearchQuery] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  // New program form state
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [instructorName, setInstructorName] = useState("")
  const [category, setCategory] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [imageUrl, setImageUrl] = useState("")

  const programsQuery = useMemoFirebase(() => {
    if (!db) return null
    return query(collection(db, "trainingPrograms"), orderBy("createdAt", "desc"))
  }, [db])

  const { data: programsData, isLoading } = useCollection<TrainingProgram>(programsQuery)
  const programs = programsData || []

  const filteredPrograms = programs.filter(p => 
    p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.instructorName.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleAddProgram = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) {
      toast({ title: "로그인 필요", description: "교육 프로그램을 등록하려면 로그인이 필요합니다.", variant: "destructive" })
      return
    }

    try {
      await addDoc(collection(db, "trainingPrograms"), {
        title,
        description,
        instructorName,
        category,
        startDate,
        endDate,
        imageUrl: imageUrl || "https://images.unsplash.com/photo-1524178232363-1fb2b075b655",
        userId: user.uid,
        createdAt: Date.now()
      })
      toast({ title: "등록 완료", description: "교육 프로그램이 성공적으로 등록되었습니다." })
      setIsDialogOpen(false)
      // Reset form
      setTitle(""); setDescription(""); setInstructorName(""); setCategory(""); setStartDate(""); setEndDate(""); setImageUrl("")
    } catch (error) {
      toast({ title: "오류 발생", description: "등록 중 문제가 발생했습니다.", variant: "destructive" })
    }
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <Header onSearch={setSearchQuery} />
      
      <main className="max-w-7xl mx-auto px-4 py-12">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <h1 className="text-4xl font-black text-primary tracking-tight mb-2">교육 프로그램</h1>
            <p className="text-lg font-bold text-primary/30">L&D 현직자들이 추천하는 최신 실무 과정</p>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary text-accent font-black h-12 px-8 rounded-2xl shadow-xl hover:scale-105 transition-transform gap-2">
                <Plus className="w-5 h-5" />
                프로그램 직접 등록하기
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl bg-white border-none rounded-[2.5rem] p-8 max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-2xl font-black text-primary mb-6">새로운 교육 프로그램 등록</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddProgram} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-primary/40 ml-1">프로그램명</label>
                    <Input value={title} onChange={e => setTitle(e.target.value)} required placeholder="예: 생성형 AI 실무 활용 과정" className="h-12 bg-primary/5 border-none rounded-xl" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-primary/40 ml-1">카테고리</label>
                    <Input value={category} onChange={e => setCategory(e.target.value)} required placeholder="예: AI/DX, 리더십" className="h-12 bg-primary/5 border-none rounded-xl" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-primary/40 ml-1">강사명</label>
                  <Input value={instructorName} onChange={e => setInstructorName(e.target.value)} required placeholder="강사 성함을 입력하세요" className="h-12 bg-primary/5 border-none rounded-xl" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-primary/40 ml-1">프로그램 설명</label>
                  <Textarea value={description} onChange={e => setDescription(e.target.value)} required className="bg-primary/5 border-none rounded-xl min-h-[120px]" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-primary/40 ml-1">시작일</label>
                    <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} required className="h-12 bg-primary/5 border-none rounded-xl" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-primary/40 ml-1">종료일</label>
                    <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} required className="h-12 bg-primary/5 border-none rounded-xl" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-primary/40 ml-1">이미지 URL (선택)</label>
                  <Input value={imageUrl} onChange={e => setImageUrl(e.target.value)} placeholder="https://..." className="h-12 bg-primary/5 border-none rounded-xl" />
                </div>
                <Button type="submit" className="w-full h-14 bg-primary text-accent font-black rounded-2xl shadow-lg mt-4">등록 완료</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20"><Clock className="w-10 h-10 animate-spin text-accent" /></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredPrograms.map((p) => (
              <Card key={p.id} className="group bg-white border-primary/5 rounded-[2rem] overflow-hidden shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-300">
                <div className="relative h-48 w-full overflow-hidden">
                  <Image src={p.imageUrl || "https://images.unsplash.com/photo-1524178232363-1fb2b075b655"} alt={p.title} fill className="object-cover transition-transform duration-500 group-hover:scale-110" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                  <Badge className="absolute top-4 left-4 bg-accent text-primary font-black border-none px-3 py-1 rounded-full text-[10px]">#{p.category}</Badge>
                </div>
                <CardContent className="p-6">
                  <h3 className="text-xl font-black text-primary mb-3 line-clamp-2 group-hover:text-accent transition-colors">{p.title}</h3>
                  <div className="space-y-2 mb-6">
                    <div className="flex items-center gap-2 text-primary/50 text-sm font-bold">
                      <GraduationCap className="w-4 h-4" /> {p.instructorName} 강사
                    </div>
                    <div className="flex items-center gap-2 text-primary/50 text-sm font-bold">
                      <Calendar className="w-4 h-4" /> {p.startDate} ~ {p.endDate}
                    </div>
                  </div>
                  <p className="text-sm text-primary/60 line-clamp-3 mb-6 font-medium leading-relaxed">{p.description}</p>
                  <Button variant="outline" className="w-full h-11 border-primary/10 text-primary font-black rounded-xl group-hover:bg-primary group-hover:text-white transition-all">자세히 보기</Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
