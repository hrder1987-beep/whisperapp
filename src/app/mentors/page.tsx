
"use client"

import { useState, useRef } from "react"
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
import { Plus, Star, Award, Briefcase, MessageSquare, Crown, Camera, X } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function MentorsPage() {
  const { user } = useUser()
  const db = useFirestore()
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [searchQuery, setSearchQuery] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [name, setName] = useState("")
  const [specialty, setSpecialty] = useState("")
  const [bio, setBio] = useState("")
  const [profilePictureUrl, setProfilePictureUrl] = useState<string | null>(null)

  const mentorsQuery = useMemoFirebase(() => {
    if (!db) return null
    return query(collection(db, "mentors"), orderBy("createdAt", "desc"))
  }, [db])

  const { data: mentorsData, isLoading } = useCollection<Instructor>(mentorsQuery)
  const mentors = mentorsData || []

  const filteredMentors = mentors.filter(m => 
    m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.specialty.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => setProfilePictureUrl(reader.result as string)
      reader.readAsDataURL(file)
    }
  }

  const handleAddMentor = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) {
      toast({ title: "로그인 필요", description: "멘토 신청을 하시려면 로그인이 필요합니다.", variant: "destructive" })
      return
    }

    setIsSubmitting(true)
    try {
      await addDoc(collection(db, "mentors"), {
        name,
        specialty,
        bio,
        profilePictureUrl: profilePictureUrl || `https://picsum.photos/seed/${name}/400/400`,
        userId: user.uid,
        role: "mentor",
        createdAt: Date.now()
      })
      toast({ title: "신청 완료", description: "멘토 프로필이 등록되었습니다. 관리자 승인 후 뱃지가 부여됩니다." })
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
      <Header onSearch={setSearchQuery} />
      
      <main className="max-w-7xl mx-auto px-4 py-12">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <h1 className="text-4xl font-black text-primary tracking-tight mb-2">HR 멘토</h1>
            <p className="text-lg font-bold text-primary/30">각 분야 최고의 전문가들이 전하는 실무 인사이트</p>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gold-gradient text-primary font-black h-12 px-8 rounded-2xl shadow-xl hover:scale-105 transition-transform gap-2">
                <Crown className="w-5 h-5" />
                멘토 신청하기
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-xl bg-white border-none rounded-[2.5rem] p-8 shadow-2xl">
              <DialogHeader>
                <DialogTitle className="text-2xl font-black text-primary mb-6">Whisper HR 멘토 등록</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddMentor} className="space-y-6">
                <div className="flex flex-col items-center mb-4">
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="relative w-32 h-32 rounded-[2rem] bg-primary/5 border-2 border-dashed border-primary/10 flex flex-col items-center justify-center cursor-pointer hover:border-accent transition-all overflow-hidden"
                  >
                    {profilePictureUrl ? (
                      <img src={profilePictureUrl} alt="preview" className="w-full h-full object-cover" />
                    ) : (
                      <>
                        <Camera className="w-8 h-8 text-primary/20 mb-1" />
                        <p className="text-[10px] text-primary/40 font-black">프로필 사진</p>
                      </>
                    )}
                  </div>
                  <input type="file" ref={fileInputRef} onChange={handleImageChange} accept="image/*" className="hidden" />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-primary/40 ml-1">성함</label>
                  <Input value={name} onChange={e => setName(e.target.value)} required placeholder="성함" className="h-12 bg-primary/5 border-none rounded-xl" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-primary/40 ml-1">주요 전문 분야</label>
                  <Input value={specialty} onChange={e => setSpecialty(e.target.value)} required placeholder="예: 채용 전략, L&D 설계, 노무 관리" className="h-12 bg-primary/5 border-none rounded-xl" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-primary/40 ml-1">소개 및 핵심 역량</label>
                  <Textarea value={bio} onChange={e => setBio(e.target.value)} required placeholder="동료 HR 전문가들에게 전하고 싶은 가치와 경력을 입력하세요" className="bg-primary/5 border-none rounded-xl min-h-[150px]" />
                </div>
                <Button type="submit" disabled={isSubmitting} className="w-full h-14 bg-primary text-accent font-black rounded-2xl shadow-lg mt-4">
                  {isSubmitting ? "등록 중..." : "멘토 프로필 등록"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20"><Star className="w-10 h-10 animate-spin text-accent" /></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {filteredMentors.map((m) => (
              <Card key={m.id} className="group bg-white border-primary/5 rounded-[2.5rem] overflow-hidden shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-300">
                <CardContent className="p-8 flex flex-col items-center text-center">
                  <div className="relative mb-6">
                    <div className="absolute inset-0 bg-accent blur-2xl opacity-20 group-hover:opacity-40 transition-opacity"></div>
                    <div className="relative w-32 h-32 rounded-[2rem] overflow-hidden border-4 border-white shadow-xl">
                       <img src={m.profilePictureUrl} alt={m.name} className="w-full h-full object-cover" />
                    </div>
                    <Badge className="absolute -bottom-2 right-0 bg-primary text-accent font-black border-none px-3 py-1 rounded-lg flex gap-1 items-center">
                      <Award className="w-3 h-3" /> MENTOR
                    </Badge>
                  </div>
                  
                  <h3 className="text-2xl font-black text-primary mb-1 group-hover:text-accent transition-colors">{m.name}</h3>
                  <p className="text-accent font-black text-xs uppercase tracking-widest mb-4">#{m.specialty}</p>
                  
                  <div className="w-full h-px bg-primary/5 mb-6"></div>
                  
                  <p className="text-sm text-primary/50 line-clamp-4 mb-8 font-medium leading-relaxed italic">
                    "{m.bio}"
                  </p>

                  <div className="grid grid-cols-1 w-full gap-3 mt-auto">
                    <Button variant="outline" size="sm" className="h-12 rounded-xl border-primary/10 text-primary font-bold gap-1.5 hover:bg-primary hover:text-white transition-all">
                      <MessageSquare className="w-4 h-4" /> 1:1 멘토링 문의
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
