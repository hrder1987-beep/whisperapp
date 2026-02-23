
"use client"

import { useState, useRef, useMemo } from "react"
import { Header } from "@/components/chuchot/Header"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc } from "@/firebase"
import { collection, query, addDoc, where, doc } from "firebase/firestore"
import { Instructor, Question } from "@/lib/types"
import { MessageSquare, Search, FileText, Check, Plus, Sparkles, Mail } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { MessageDialog } from "@/components/chuchot/MessageDialog"
import { AvatarIcon } from "@/components/chuchot/AvatarIcon"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

const MENTOR_CATEGORIES = ["전체", "전략/기획", "채용", "조직문화", "HRD", "평가/보상", "노무/ER"]

const MOCK_MENTORS: Instructor[] = [
  {
    id: "mentor-1",
    name: "김민수",
    company: "Toss",
    jobTitle: "Head of Talent Acquisition",
    specialty: "채용",
    bio: "국내 유수의 IT 유니콘 기업에서 10년간 기술 인재 채용을 담당했습니다. 데이터 기반의 인재 검증 프로세스 설계와 EVP 강화를 위한 실무 노하우를 공유합니다.",
    profilePictureUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=400",
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
    specialty: "조직문화",
    bio: "심리적 안정감이 성과에 미치는 영향을 연구하고 현장에 적용합니다. 리더들의 코칭 역량 강화와 수평적 조직문화 내재화 프로젝트를 다수 수행했습니다.",
    profilePictureUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=400",
    userId: "mock-m2",
    role: "mentor",
    createdAt: Date.now(),
    isVerified: true
  }
]

export function MentorPostsDialog({ userId, userName, isOpen, onClose }: { userId: string, userName: string, isOpen: boolean, onClose: () => void }) {
  const db = useFirestore()
  const postsQuery = useMemoFirebase(() => (db && userId) ? query(collection(db, "questions"), where("userId", "==", userId)) : null, [db, userId])
  const { data: postsData, isLoading } = useCollection<Question>(postsQuery)
  const posts = useMemo(() => (postsData || []).sort((a, b) => b.createdAt - a.createdAt), [postsData])

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl bg-[#F5F6F7] border-none rounded-none p-0 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        <DialogHeader className="bg-white border-b border-black/5 p-6">
          <DialogTitle className="text-xl font-black text-accent flex items-center gap-3">
            <FileText className="w-6 h-6 text-primary" /> {userName} 위스퍼러의 활동 기록
          </DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto p-8 space-y-4">
          {isLoading ? (
            <div className="flex justify-center py-20"><Sparkles className="w-10 h-10 animate-spin text-primary" /></div>
          ) : posts.length === 0 ? (
            <div className="text-center py-24 bg-white border border-dashed border-black/5">
              <p className="text-black/20 font-black">아직 작성한 게시글이 없습니다.</p>
            </div>
          ) : (
            posts.map(p => (
              <Card key={p.id} className="bg-white border-black/5 rounded-none shadow-sm hover:border-primary transition-all">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-2">
                    <Badge className="bg-[#F5F6F7] text-black/40 font-black border-none text-[9px]">#{p.category || "일반"}</Badge>
                    <span className="text-[10px] font-bold text-black/20">{new Date(p.createdAt).toLocaleDateString()}</span>
                  </div>
                  <h4 className="text-base font-black text-[#1E1E23] mb-2">{p.title}</h4>
                  <p className="text-xs text-black/50 line-clamp-2 mb-4 leading-relaxed">{p.text}</p>
                  <div className="flex items-center gap-4 text-[10px] font-black text-black/20">
                    <span>조회 {p.viewCount}</span>
                    <span>답변 {p.answerCount}</span>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default function MentorsPage() {
  const { user } = useUser()
  const db = useFirestore()
  const { toast } = useToast()
  const router = useRouter()

  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("전체")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [messageTarget, setMessageTarget] = useState<{ id: string, nickname: string } | null>(null)
  const [postViewTarget, setPostViewTarget] = useState<{ id: string, name: string } | null>(null)

  const userDocRef = useMemoFirebase(() => (user && db) ? doc(db, "users", user.uid) : null, [user, db])
  const { data: profile } = useDoc<any>(userDocRef)

  const [specialty, setSpecialty] = useState("")
  const [bio, setBio] = useState("")

  const mentorsQuery = useMemoFirebase(() => db ? query(collection(db, "mentors"), where("isVerified", "==", true)) : null, [db])
  const { data: mentorsData, isLoading } = useCollection<Instructor>(mentorsQuery)
  
  const mentors = useMemo(() => {
    const fetched = mentorsData || []
    if (fetched.length === 0 && !searchQuery) return MOCK_MENTORS
    return fetched
  }, [mentorsData, searchQuery])

  const filteredMentors = mentors.filter(m => {
    const matchesSearch = m.name.toLowerCase().includes(searchQuery.toLowerCase()) || m.bio.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === "전체" || m.specialty === selectedCategory
    return matchesSearch && matchesCategory
  })

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
        name: profile.name, company: profile.company, jobTitle: profile.jobTitle, phoneNumber: profile.phoneNumber,
        specialty, bio, profilePictureUrl: profile.profilePictureUrl || `https://picsum.photos/seed/${profile.name}/400/400`,
        userId: user.uid, role: "mentor", createdAt: Date.now(), isVerified: false 
      })
      toast({ title: "신청 완료", description: "위스퍼러 프로필이 등록되었습니다. 관리자 승인 후 공식 뱃지가 부여됩니다." })
      setIsDialogOpen(false)
      setSpecialty(""); setBio("")
    } catch (error) { toast({ title: "오류", description: "등록 중 문제가 발생했습니다.", variant: "destructive" }) }
    finally { setIsSubmitting(false) }
  }

  return (
    <div className="min-h-screen bg-[#F5F6F7]">
      <Header />
      <main className="max-w-7xl mx-auto px-4 py-8 md:py-16">
        <div className="flex flex-col gap-8 mb-16">
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-1">
              <h1 className="text-2xl md:text-3xl font-black text-[#1E1E23] tracking-tighter">위스퍼러 (Whisperer)</h1>
              <p className="text-xs md:text-sm font-bold text-[#888]">대한민국 최고의 실무 시니어 전문가들과의 1:1 인사이트 연결</p>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-primary text-white hover:brightness-105 font-black h-11 px-6 rounded-xl shadow-lg transition-all gap-2 text-xs border border-white/20">
                  <Plus className="w-4 h-4" />
                  위스퍼러 신청
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-xl bg-white border-none rounded-none p-0 shadow-2xl overflow-hidden">
                <DialogHeader className="bg-white border-b border-black/5 p-6">
                  <DialogTitle className="text-xl font-black text-accent">위스퍼러 등록 신청</DialogTitle>
                  <p className="text-black/40 text-[10px] font-bold mt-0.5 uppercase tracking-widest">Apply for Official Whisperer</p>
                </DialogHeader>
                <div className="p-8">
                  {profile ? (
                    <form onSubmit={handleAddMentor} className="space-y-8">
                      <div className="bg-[#F5F6F7] p-6 flex items-center gap-4">
                        <AvatarIcon src={profile.profilePictureUrl} seed={profile.username} className="w-14 h-14" />
                        <div>
                          <p className="font-black text-[#1E1E23] text-lg">{profile.name} 전문가님</p>
                          <p className="text-xs font-bold text-[#888]">{profile.company} · {profile.jobTitle}</p>
                        </div>
                      </div>
                      <div className="space-y-6">
                        <div className="space-y-2">
                          <Label className="text-xs font-black text-black/40 uppercase tracking-widest">전문 분야</Label>
                          <Input value={specialty} onChange={e => setSpecialty(e.target.value)} required placeholder="예: 채용 전략, 조직문화 설계" className="h-12 bg-white border-black/10 rounded-none font-bold" />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs font-black text-black/40 uppercase tracking-widest">인사이트 소개</Label>
                          <Textarea value={bio} onChange={e => setBio(e.target.value)} required placeholder="나만의 실무 노하우와 경력을 상세히 적어주세요." className="min-h-[150px] bg-white border-black/10 rounded-none p-4 font-bold text-sm leading-relaxed" />
                        </div>
                      </div>
                      <Button type="submit" disabled={isSubmitting} className="w-full h-14 naver-button text-base">
                        {isSubmitting ? "처리 중..." : "위스퍼러 자격 신청 완료"}
                      </Button>
                    </form>
                  ) : <div className="py-20 text-center text-black/20 font-black">회원 정보를 불러오는 중...</div>}
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="flex flex-col gap-6">
            <div className="relative group">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-black/20 group-focus-within:text-primary transition-colors" />
              <Input 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="전문가 성함, 기업명, 전문 분야로 검색해 보세요" 
                className="h-14 pl-14 pr-6 bg-white border-2 border-primary rounded-none shadow-sm focus-visible:ring-0 text-base font-black placeholder:text-black/10"
              />
            </div>
            <div className="flex overflow-x-auto gap-2 scrollbar-hide py-1">
              {MENTOR_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={cn(
                    "px-6 py-3 rounded-none text-xs font-black transition-all border-2 whitespace-nowrap",
                    selectedCategory === cat 
                      ? "bg-primary text-white border-primary shadow-md" 
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
        ) : filteredMentors.length === 0 ? (
          <div className="py-40 text-center bg-white border border-black/5">
            <p className="text-black/20 font-black text-xl">검색 결과와 일치하는 전문가가 없습니다.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {filteredMentors.map((m) => (
              <Card key={m.id} className="group bg-white border border-black/[0.06] hover:border-black/[0.12] transition-all duration-500 rounded-none overflow-hidden flex flex-col h-full">
                <CardContent className="p-8 flex flex-col items-center text-center flex-1">
                  <div className="relative mb-8">
                    <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-xl">
                       <img src={m.profilePictureUrl} alt={m.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                    </div>
                    {m.isVerified && (
                      <Badge className="absolute -bottom-1 right-0 bg-primary text-accent font-black border-none px-3 py-1 rounded-none flex gap-1 items-center shadow-lg text-[9px]">
                        <Check className="w-3 h-3" /> WHISPERER
                      </Badge>
                    )}
                  </div>
                  
                  <div className="space-y-1 mb-4">
                    <h3 className="text-xl font-black text-[#1E1E23]">{m.name} 전문가</h3>
                    <p className="text-black/40 text-xs font-bold">{m.company} · {m.jobTitle}</p>
                  </div>

                  <Badge variant="outline" className="mb-6 border-primary/20 text-primary font-black text-[10px] px-3 rounded-none">#{m.specialty}</Badge>
                  
                  <p className="text-xs text-black/50 line-clamp-3 mb-8 font-medium leading-relaxed italic px-2">
                    "{m.bio}"
                  </p>

                  <div className="grid grid-cols-1 w-full gap-2 mt-auto">
                    <Button 
                      onClick={() => setPostViewTarget({ id: m.userId, name: m.name })}
                      variant="ghost" 
                      className="h-11 rounded-none bg-[#F5F6F7] hover:bg-[#1E1E23] hover:text-primary text-black/40 font-black gap-2 text-xs transition-all"
                    >
                      <FileText className="w-4 h-4" /> 작성글 보기
                    </Button>
                    <Button 
                      onClick={() => {
                        if (!user) { toast({ title: "로그인 필요", description: "문의를 위해 로그인이 필요합니다.", variant: "destructive" }); return; }
                        setMessageTarget({ id: m.userId, nickname: m.name })
                      }}
                      className="h-11 rounded-none naver-button gap-2 hover:brightness-110 transition-all text-xs"
                    >
                      <MessageSquare className="w-4 h-4" /> 1:1 인사이트 문의
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      {messageTarget && <MessageDialog isOpen={!!messageTarget} onClose={() => setMessageTarget(null)} receiverId={messageTarget.id} receiverNickname={messageTarget.nickname} />}
      {postViewTarget && <MentorPostsDialog userId={postViewTarget.id} userName={postViewTarget.name} isOpen={!!postViewTarget} onClose={() => setPostViewTarget(null)} />}
    </div>
  )
}
