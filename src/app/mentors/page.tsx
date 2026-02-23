
"use client"

import { useState, useRef, useMemo, useEffect } from "react"
import { Header } from "@/components/chuchot/Header"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc } from "@/firebase"
import { collection, query, orderBy, addDoc, where, doc } from "firebase/firestore"
import { Instructor, Question } from "@/lib/types"
import { Star, Award, Briefcase, MessageSquare, Crown, Camera, Search, Building2, User as UserIcon, FileText, X, Check, Info, Plus } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { MessageDialog } from "@/components/chuchot/MessageDialog"
import { AvatarIcon } from "@/components/chuchot/AvatarIcon"
import { useRouter } from "next/navigation"

const MOCK_MENTORS: Instructor[] = [
  {
    id: "mentor-1",
    name: "김민수",
    company: "Toss",
    jobTitle: "Head of Talent Acquisition",
    specialty: "전략적 리크루팅",
    bio: "국내 유수의 IT 유니콘 기업에서 10년간 기술 인재 채용을 담당했습니다. 데이터 기반의 인재 검증 프로세스 설계와 EVP 강화를 위한 실무 노하우를 공유합니다.",
    profilePictureUrl: "https://picsum.photos/seed/mentor1/400/400",
    userId: "mock-m1",
    role: "mentor",
    createdAt: Date.now(),
    isVerified: true
  },
  {
    id: "mentor-2",
    name: "이나래",
    company: "Woowa Bros",
    jobTitle: "Culture Design Lead",
    specialty: "조직문화 및 리더십",
    bio: "심리적 안정감이 성과에 미치는 영향을 연구하고 현장에 적용합니다. 리더들의 코칭 역량 강화와 수평적 조직문화 내재화 프로젝트를 다수 수행했습니다.",
    profilePictureUrl: "https://picsum.photos/seed/mentor2/400/400",
    userId: "mock-m2",
    role: "mentor",
    createdAt: Date.now(),
    isVerified: true
  }
]

export function MentorPostsDialog({ userId, userName, isOpen, onClose }: { userId: string, userName: string, isOpen: boolean, onClose: () => void }) {
  const db = useFirestore()
  
  const postsQuery = useMemoFirebase(() => {
    if (!db || !userId) return null
    return query(collection(db, "questions"), where("userId", "==", userId))
  }, [db, userId])
  
  const { data: postsData, isLoading } = useCollection<Question>(postsQuery)

  const posts = useMemo(() => {
    if (!postsData) return []
    return [...postsData].sort((a, b) => b.createdAt - a.createdAt)
  }, [postsData])

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl bg-[#F8F9FA] border-none rounded-[2rem] p-8 shadow-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="mb-8">
          <DialogTitle className="text-xl font-black text-primary flex items-center gap-3">
            <FileText className="w-6 h-6 text-accent" />
            {userName} 위스퍼러의 활동 기록
          </DialogTitle>
        </DialogHeader>
        
        {isLoading ? (
          <div className="flex justify-center py-20"><Plus className="w-10 h-10 animate-spin text-accent" /></div>
        ) : !posts || posts.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-primary/10">
            <p className="text-primary/20 font-black">아직 작성한 게시글이 없습니다.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map(p => (
              <Card key={p.id} className="bg-white border-primary/5 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-2">
                    <Badge className="bg-primary/5 text-primary/40 font-black border-none text-[9px]">#{p.category || "일반"}</Badge>
                    <span className="text-[10px] font-bold text-primary/20">{new Date(p.createdAt).toLocaleDateString()}</span>
                  </div>
                  <h4 className="text-base font-black text-primary mb-2">{p.title}</h4>
                  <p className="text-xs text-primary/60 line-clamp-2 mb-4 leading-relaxed">{p.text}</p>
                  <div className="flex items-center gap-4 text-[10px] font-black text-primary/30">
                    <span>조회 {p.viewCount}</span>
                    <span>답변 {p.answerCount}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

export default function MentorsPage() {
  const { user } = useUser()
  const db = useFirestore()
  const { toast } = useToast()
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [searchQuery, setSearchQuery] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [messageTarget, setMessageTarget] = useState<{ id: string, nickname: string } | null>(null)
  const [postViewTarget, setPostViewTarget] = useState<{ id: string, name: string } | null>(null)

  const userDocRef = useMemoFirebase(() => (user && db) ? doc(db, "users", user.uid) : null, [user, db])
  const { data: profile } = useDoc<any>(userDocRef)

  const [specialty, setSpecialty] = useState("")
  const [bio, setBio] = useState("")
  const [mentorProfilePic, setMentorProfilePic] = useState<string | null>(null)

  const mentorsQuery = useMemoFirebase(() => {
    if (!db) return null
    return query(collection(db, "mentors"), where("isVerified", "==", true))
  }, [db])

  const { data: mentorsData, isLoading } = useCollection<Instructor>(mentorsQuery)
  
  const mentors = useMemo(() => {
    const fetched = mentorsData || []
    if (fetched.length === 0 && !searchQuery) return MOCK_MENTORS
    return fetched
  }, [mentorsData, searchQuery])

  const filteredMentors = mentors.filter(m => 
    m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.specialty.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (m.company && m.company.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => setMentorProfilePic(reader.result as string)
      reader.readAsDataURL(file)
    }
  }

  const handleAddMentor = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !profile) {
      toast({ title: "로그인 필요", description: "위스퍼러 신청을 하시려면 로그인이 필요합니다.", variant: "destructive" })
      router.push("/auth?mode=login")
      return
    }

    setIsSubmitting(true)
    try {
      await addDoc(collection(db, "mentors"), {
        name: profile.name,
        company: profile.company,
        jobTitle: profile.jobTitle,
        phoneNumber: profile.phoneNumber,
        specialty,
        bio,
        profilePictureUrl: mentorProfilePic || profile.profilePictureUrl || `https://picsum.photos/seed/${profile.name}/400/400`,
        userId: user.uid,
        role: "mentor",
        createdAt: Date.now(),
        isVerified: false 
      })
      toast({ title: "신청 완료", description: "위스퍼러 프로필이 등록되었습니다. 관리자 승인 후 공식 뱃지가 부여됩니다." })
      setIsDialogOpen(false)
      setSpecialty(""); setBio(""); setMentorProfilePic(null)
    } catch (error) {
      toast({ title: "오류 발생", description: "등록 중 문제가 발생했습니다.", variant: "destructive" })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleMessageClick = (m: Instructor) => {
    if (!user) {
      toast({ title: "로그인 필요", description: "인사이트 문의를 하려면 로그인이 필요합니다.", variant: "destructive" })
      return
    }
    if (user.uid === m.userId) {
      toast({ title: "본인에게 문의 불가", description: "자신의 프로필에는 문의할 수 없습니다.", variant: "destructive" })
      return
    }
    setMessageTarget({ id: m.userId, nickname: m.name })
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 py-8 md:py-12">
        <div className="flex flex-col gap-8 mb-12">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-1">
              <h1 className="text-3xl font-black text-primary tracking-tight">위스퍼러</h1>
              <p className="text-sm font-medium text-primary/40">각 분야 최고의 HR 인사이트 파트너들을 소개합니다.</p>
            </div>
            
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-primary text-accent hover:bg-primary/95 font-black h-11 px-6 rounded-xl shadow-lg transition-all gap-2 text-xs border border-accent/20">
                  <Crown className="w-4 h-4" />
                  위스퍼러 신청하기
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-xl bg-white border-none rounded-[2rem] p-10 shadow-2xl overflow-y-auto max-h-[90vh]">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-black text-primary mb-2">위스퍼러 신청</DialogTitle>
                  <p className="text-sm font-bold text-primary/40">전문가님의 지혜를 나눌 준비가 되셨나요?</p>
                </DialogHeader>
                {profile ? (
                  <form onSubmit={handleAddMentor} className="space-y-8 mt-6">
                    <div className="bg-primary/5 p-6 rounded-2xl space-y-4">
                      <div className="flex items-center gap-4">
                        <AvatarIcon src={profile.profilePictureUrl} seed={profile.username} className="w-12 h-12" />
                        <div>
                          <p className="font-black text-primary">{profile.name} 전문가</p>
                          <p className="text-xs font-bold text-primary/40">{profile.company} · {profile.jobTitle}</p>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <Label className="text-xs font-black text-primary/40 ml-2">전문 분야 (Expertise)</Label>
                        <Input value={specialty} onChange={e => setSpecialty(e.target.value)} required placeholder="예: 채용 전략, 조직문화 설계" className="h-12 bg-primary/5 border-none rounded-xl font-bold" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-black text-primary/40 ml-2">소개 및 핵심 역량 (Bio)</Label>
                        <Textarea value={bio} onChange={e => setBio(e.target.value)} required placeholder="나만의 인사이트와 경력을 상세히 적어주세요." className="bg-primary/5 border-none rounded-xl min-h-[120px] p-5 text-sm" />
                      </div>
                    </div>
                    <Button type="submit" disabled={isSubmitting} className="w-full h-14 bg-primary text-accent font-black rounded-xl shadow-xl border border-accent/20">
                      {isSubmitting ? "처리 중..." : "위스퍼러 신청 완료"}
                    </Button>
                  </form>
                ) : <div className="py-20 text-center text-primary/20 font-black">회원 정보를 불러오는 중...</div>}
              </DialogContent>
            </Dialog>
          </div>

          <div className="relative max-w-2xl group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary/20 group-focus-within:text-accent transition-colors" />
            <Input 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="성함, 기업명, 분야를 검색하세요..." 
              className="h-12 pl-12 pr-6 bg-white border-none rounded-xl shadow-sm focus-visible:ring-accent/50 text-sm font-bold placeholder:text-primary/20"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-40"><Plus className="w-12 h-12 animate-spin text-accent" /></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {filteredMentors.map((m) => (
              <Card key={m.id} className="group bg-white border-primary/5 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 flex flex-col">
                <CardContent className="p-8 flex flex-col items-center text-center flex-1">
                  <div className="relative mb-6">
                    <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-lg">
                       <img src={m.profilePictureUrl} alt={m.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                    </div>
                    {m.isVerified && (
                      <Badge className="absolute -bottom-1 right-0 bg-primary text-accent font-black border-none px-3 py-1 rounded-lg flex gap-1 items-center shadow-lg text-[9px]">
                        <Check className="w-3 h-3" /> WHISPERER
                      </Badge>
                    )}
                  </div>
                  
                  <div className="space-y-1 mb-4">
                    <h3 className="text-lg font-black text-primary">{m.name} 전문가</h3>
                    <p className="text-primary/40 text-[11px] font-bold">{m.company} · {m.jobTitle}</p>
                  </div>

                  <Badge variant="outline" className="mb-6 border-accent/20 text-accent font-black text-[10px]">#{m.specialty}</Badge>
                  
                  <p className="text-xs text-primary/50 line-clamp-3 mb-8 font-medium leading-relaxed italic px-2">
                    "{m.bio}"
                  </p>

                  <div className="grid grid-cols-1 w-full gap-2 mt-auto">
                    <Button 
                      onClick={() => setPostViewTarget({ id: m.userId, name: m.name })}
                      variant="ghost" 
                      className="h-10 rounded-xl bg-primary/5 hover:bg-primary/10 text-primary/60 font-black gap-2 text-xs"
                    >
                      <FileText className="w-4 h-4" /> 작성글 보기
                    </Button>
                    <Button 
                      onClick={() => handleMessageClick(m)}
                      variant="outline" 
                      className="h-10 rounded-xl border-primary/10 text-primary font-black gap-2 hover:bg-primary hover:text-accent transition-all text-xs"
                    >
                      <MessageSquare className="w-4 h-4" /> 1:1 문의
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      {messageTarget && (
        <MessageDialog isOpen={!!messageTarget} onClose={() => setMessageTarget(null)} receiverId={messageTarget.id} receiverNickname={messageTarget.nickname} />
      )}

      {postViewTarget && (
        <MentorPostsDialog userId={postViewTarget.id} userName={postViewTarget.name} isOpen={!!postViewTarget} onClose={() => setPostViewTarget(null)} />
      )}
    </div>
  )
}
