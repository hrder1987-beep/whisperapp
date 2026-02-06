
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
import { Instructor } from "@/lib/types"
import { Plus, Search, User, Star, Award, Briefcase, MessageSquare } from "lucide-react"
import { AvatarIcon } from "@/components/chuchot/AvatarIcon"
import { useToast } from "@/hooks/use-toast"

export default function InstructorsPage() {
  const { user } = useUser()
  const db = useFirestore()
  const { toast } = useToast()
  const [searchQuery, setSearchQuery] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  // New instructor form state
  const [name, setName] = useState("")
  const [specialty, setSpecialty] = useState("")
  const [bio, setBio] = useState("")
  const [profilePictureUrl, setProfilePictureUrl] = useState("")

  const instructorsQuery = useMemoFirebase(() => {
    if (!db) return null
    return query(collection(db, "instructors"), orderBy("createdAt", "desc"))
  }, [db])

  const { data: instructorsData, isLoading } = useCollection<Instructor>(instructorsQuery)
  const instructors = instructorsData || []

  const filteredInstructors = instructors.filter(i => 
    i.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    i.specialty.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleAddInstructor = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) {
      toast({ title: "로그인 필요", description: "강사 정보를 등록하려면 로그인이 필요합니다.", variant: "destructive" })
      return
    }

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
      setName(""); setSpecialty(""); setBio(""); setProfilePictureUrl("")
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
            <h1 className="text-4xl font-black text-primary tracking-tight mb-2">강사 정보</h1>
            <p className="text-lg font-bold text-primary/30">검증된 전문성과 통찰력을 갖춘 HRD 파트너</p>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gold-gradient text-primary font-black h-12 px-8 rounded-2xl shadow-xl hover:scale-105 transition-transform gap-2">
                <Plus className="w-5 h-5" />
                강사 프로필 등록
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-xl bg-white border-none rounded-[2.5rem] p-8">
              <DialogHeader>
                <DialogTitle className="text-2xl font-black text-primary mb-6">새로운 강사 프로필 등록</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddInstructor} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-black text-primary/40 ml-1">성함</label>
                  <Input value={name} onChange={e => setName(e.target.value)} required placeholder="강사 성함" className="h-12 bg-primary/5 border-none rounded-xl" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-primary/40 ml-1">주요 전문 분야</label>
                  <Input value={specialty} onChange={e => setSpecialty(e.target.value)} required placeholder="예: 조직문화, 리더십 코칭, DX 전환" className="h-12 bg-primary/5 border-none rounded-xl" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-primary/40 ml-1">자기 소개 및 경력</label>
                  <Textarea value={bio} onChange={e => setBio(e.target.value)} required placeholder="강사님의 주요 경력과 강점을 입력하세요" className="bg-primary/5 border-none rounded-xl min-h-[150px]" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-primary/40 ml-1">프로필 이미지 URL (선택)</label>
                  <Input value={profilePictureUrl} onChange={e => setProfilePictureUrl(e.target.value)} placeholder="https://..." className="h-12 bg-primary/5 border-none rounded-xl" />
                </div>
                <Button type="submit" className="w-full h-14 bg-primary text-accent font-black rounded-2xl shadow-lg mt-4">프로필 생성하기</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20"><Star className="w-10 h-10 animate-spin text-accent" /></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {filteredInstructors.map((i) => (
              <Card key={i.id} className="group bg-white border-primary/5 rounded-[2.5rem] overflow-hidden shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-300">
                <CardContent className="p-8 flex flex-col items-center text-center">
                  <div className="relative mb-6">
                    <div className="absolute inset-0 bg-accent blur-2xl opacity-20 group-hover:opacity-40 transition-opacity"></div>
                    <div className="relative w-32 h-32 rounded-[2rem] overflow-hidden border-4 border-white shadow-xl">
                       <img src={i.profilePictureUrl} alt={i.name} className="w-full h-full object-cover" />
                    </div>
                    <Badge className="absolute -bottom-2 right-0 bg-primary text-accent font-black border-none px-3 py-1 rounded-lg">PRO</Badge>
                  </div>
                  
                  <h3 className="text-2xl font-black text-primary mb-1 group-hover:text-accent transition-colors">{i.name}</h3>
                  <p className="text-accent font-black text-xs uppercase tracking-widest mb-4">#{i.specialty}</p>
                  
                  <div className="w-full h-px bg-primary/5 mb-6"></div>
                  
                  <p className="text-sm text-primary/50 line-clamp-4 mb-8 font-medium leading-relaxed italic">
                    "{i.bio}"
                  </p>

                  <div className="grid grid-cols-2 w-full gap-3 mt-auto">
                    <Button variant="outline" size="sm" className="h-10 rounded-xl border-primary/10 text-primary font-bold gap-1.5 hover:bg-primary hover:text-white transition-all">
                      <Briefcase className="w-3.5 h-3.5" /> 포트폴리오
                    </Button>
                    <Button variant="outline" size="sm" className="h-10 rounded-xl border-primary/10 text-primary font-bold gap-1.5 hover:bg-accent hover:text-primary transition-all">
                      <MessageSquare className="w-3.5 h-3.5" /> 섭외 제안
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
