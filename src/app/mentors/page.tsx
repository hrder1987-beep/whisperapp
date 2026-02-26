
"use client"

import { useState, useMemo } from "react"
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
import { MessageSquare, Search, FileText, Check, Plus, Sparkles, Briefcase, Award, Zap, Link as LinkIcon, History } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { MessageDialog } from "@/components/chuchot/MessageDialog"
import { AvatarIcon } from "@/components/chuchot/AvatarIcon"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

const MENTOR_CATEGORIES = ["전체", "전략/기획", "채용", "조직문화", "HRD", "평가/보상", "노무/ER"]

const MOCK_MENTORS: Instructor[] = [
  {
    id: "mentor-sample-1",
    name: "김민수",
    company: "Toss (토스)",
    jobTitle: "Head of Talent Acquisition",
    specialty: "채용",
    bio: "국내 최고의 IT 유니콘 기업에서 10년간 기술 인재 채용과 채용 브랜딩을 총괄해왔습니다. 데이터에 기반한 인재 검증 시스템과 Candidate Experience 강화 전략에 대한 깊은 통찰을 공유해 드립니다.",
    profilePictureUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=400",
    userId: "mock-m1",
    role: "mentor",
    createdAt: 1714521600000,
    isVerified: true
  },
  {
    id: "mentor-sample-2",
    name: "이나래",
    company: "우아한형제들 (배달의민족)",
    jobTitle: "Culture Design Lead",
    specialty: "조직문화",
    bio: "성장하는 조직에서의 수평적 문화 안착과 핵심가치 내재화 프로젝트를 리딩하고 있습니다. 심리적 안정감이 성과에 미치는 영향과 리더들의 코칭 역량 강화에 대한 실전 가이드를 제공합니다.",
    profilePictureUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=400",
    userId: "mock-m2",
    role: "mentor",
    createdAt: 1714608000000,
    isVerified: true
  },
  {
    id: "mentor-sample-3",
    name: "정태호",
    company: "쿠팡 (Coupang)",
    jobTitle: "Senior C&B Specialist",
    specialty: "평가/보상",
    bio: "글로벌 커머스 기업에서의 보상 체계 고도화와 성과 관리 시스템 운영 전문가입니다. 합리적인 평가 등급 산출과 동기부여를 위한 보상 패키지 설계에 대한 실무 노하우를 나누고 싶습니다.",
    profilePictureUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=400",
    userId: "mock-m3",
    role: "mentor",
    createdAt: 1714694400000,
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
      <DialogContent className="max-w-4xl bg-[#F5F6F7] border-none rounded-[3rem] p-0 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        <DialogHeader className="bg-white border-b border-black/5 p-8">
          <DialogTitle className="text-2xl font-black text-accent flex items-center gap-4">
            <FileText className="w-8 h-8 text-primary" /> {userName} 위스퍼러의 지식 나눔
          </DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto p-10 space-y-6">
          {isLoading ? (
            <div className="flex justify-center py-20"><Sparkles className="w-12 h-12 animate-spin text-primary" /></div>
          ) : posts.length === 0 ? (
            <div className="text-center py-24 bg-white border border-dashed border-black/5 rounded-[2.5rem]">
              <p className="text-black/20 font-black">아직 작성한 게시글이 없습니다.</p>
            </div>
          ) : (
            posts.map(p => (
              <Card key={p.id} className="bg-white border-none rounded-[2rem] shadow-sm hover:shadow-xl transition-all border border-black/5">
                <CardContent className="p-8">
                  <div className="flex justify-between items-start mb-4">
                    <Badge className="bg-primary/10 text-primary font-black border-none px-3 py-1 rounded-full text-[10px]">#{p.category || "일반"}</Badge>
                    <span className="text-[11px] font-bold text-black/20">{new Date(p.createdAt).toLocaleDateString()}</span>
                  </div>
                  <h4 className="text-lg font-black text-accent mb-3">{p.title}</h4>
                  <p className="text-sm text-black/50 line-clamp-2 mb-6 leading-relaxed font-medium">{p.text}</p>
                  <div className="flex items-center gap-6 text-[11px] font-black text-black/20">
                    <span className="flex items-center gap-1.5">조회 {p.viewCount}</span>
                    <span className="flex items-center gap-1.5">답변 {p.answerCount}</span>
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
  const [career, setCareer] = useState("")
  const [keySkills, setKeySkills] = useState("")
  const [projects, setProjects] = useState("")
  const [website, setWebsite] = useState("")
  const [bio, setBio] = useState("")

  const mentorsQuery = useMemoFirebase(() => db ? query(collection(db, "mentors"), where("isVerified", "==", true)) : null, [db])
  const { data: mentorsData, isLoading } = useCollection<Instructor>(mentorsQuery)
  
  const mentors = useMemo(() => {
    const fetched = mentorsData || []
    const merged = [...fetched]
    MOCK_MENTORS.forEach(mm => { if (!merged.some(m => m.id === mm.id)) merged.push(mm) })
    return merged.sort((a, b) => b.createdAt - a.createdAt)
  }, [mentorsData])

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
        name: profile.name, 
        company: profile.company, 
        jobTitle: profile.jobTitle, 
        phoneNumber: profile.phoneNumber,
        email: profile.email,
        specialty, 
        career,
        keySkills,
        projects,
        website,
        bio, 
        profilePictureUrl: profile.profilePictureUrl || `https://picsum.photos/seed/${profile.name}/400/400`,
        userId: user.uid, 
        role: "mentor", 
        createdAt: Date.now(), 
        isVerified: false 
      })
      toast({ title: "신청 완료", description: "위스퍼러 프로필이 등록되었습니다. 관리자 승인 후 공식 뱃지가 부여됩니다." })
      setIsDialogOpen(false)
      setSpecialty(""); setCareer(""); setKeySkills(""); setProjects(""); setWebsite(""); setBio("")
    } catch (error) { toast({ title: "오류", description: "등록 중 문제가 발생했습니다.", variant: "destructive" }) }
    finally { setIsSubmitting(false) }
  }

  return (
    <div className="min-h-screen bg-[#F5F6F7]">
      <Header />
      <main className="max-w-7xl mx-auto px-4 py-8 md:py-16">
        <div className="flex flex-col gap-8 mb-16">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-1">
              <h1 className="text-3xl md:text-4xl font-black text-[#1E1E23] tracking-tighter">위스퍼러 (Whisperer)</h1>
              <p className="text-sm md:text-base font-bold text-[#888]">대한민국 최고의 실무 시니어 전문가들과의 1:1 인사이트 연결</p>
            </div>

            {/* 위스퍼러 신청은 모바일에서도 가능 */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="naver-button h-14 px-10 rounded-xl shadow-xl transition-all gap-3 text-base text-accent">
                  <Plus className="w-5 h-5" />
                  위스퍼러 자격 신청
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl bg-white border-none rounded-[2.5rem] p-0 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
                <DialogHeader className="bg-white border-b border-black/5 p-8 shrink-0 text-left">
                  <DialogTitle className="text-2xl font-black text-accent">위스퍼러 공식 전문가 등록</DialogTitle>
                  <p className="text-black/40 text-[10px] font-bold mt-1 uppercase tracking-widest">Apply for Official HR Expert</p>
                </DialogHeader>
                <div className="flex-1 overflow-y-auto">
                  <div className="p-10">
                    {profile ? (
                      <form onSubmit={handleAddMentor} className="space-y-12">
                        <div className="bg-[#F5F6F7] p-8 flex items-center gap-6 rounded-2xl shadow-inner border border-black/5">
                          <AvatarIcon src={profile.profilePictureUrl} seed={profile.username} className="w-20 h-20 border-4 border-white shadow-xl" />
                          <div>
                            <p className="font-black text-accent text-2xl">{profile.name} 전문가님</p>
                            <p className="text-sm font-bold text-black/40 mt-1">{profile.company} · {profile.jobTitle}</p>
                            <div className="mt-3 flex gap-2">
                              <Badge className="bg-primary text-accent border-none font-black text-[10px]">인증대기</Badge>
                              <Badge variant="outline" className="text-black/30 border-black/10 text-[10px]">{profile.email}</Badge>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-10">
                          <div className="space-y-4">
                            <div className="flex items-center gap-2 px-1">
                              <div className="w-1 h-4 bg-primary rounded-full"></div>
                              <Label className="text-sm font-black text-accent uppercase tracking-widest flex items-center gap-2">
                                <Award className="w-4 h-4 text-primary" /> 핵심 전문 분야
                              </Label>
                            </div>
                            <Input value={specialty} onChange={e => setSpecialty(e.target.value)} required placeholder="예: IT 테크 채용 전략" className="h-12 bg-[#F5F6F7] border-none rounded-xl font-bold shadow-inner" />
                          </div>

                          <div className="space-y-4">
                            <div className="flex items-center gap-2 px-1">
                              <div className="w-1 h-4 bg-primary rounded-full"></div>
                              <Label className="text-sm font-black text-accent uppercase tracking-widest flex items-center gap-2">
                                <Zap className="w-4 h-4 text-primary" /> 핵심 역량 키워드
                              </Label>
                            </div>
                            <Input value={keySkills} onChange={e => setKeySkills(e.target.value)} required placeholder="콤마(,)로 구분 (예: 채용브랜딩, 노무진단)" className="h-12 bg-[#F5F6F7] border-none rounded-xl font-bold shadow-inner" />
                          </div>

                          <div className="space-y-4">
                            <div className="flex items-center gap-2 px-1">
                              <div className="w-1 h-4 bg-primary rounded-full"></div>
                              <Label className="text-sm font-black text-accent uppercase tracking-widest flex items-center gap-2">
                                <History className="w-4 h-4 text-primary" /> 주요 경력 및 이력
                              </Label>
                            </div>
                            <Textarea value={career} onChange={e => setCareer(e.target.value)} required placeholder="경력 요약" className="min-h-[150px] bg-[#F5F6F7] border-none rounded-2xl p-6 font-bold text-sm leading-relaxed shadow-inner resize-none" />
                          </div>

                          <div className="space-y-4">
                            <div className="flex items-center gap-2 px-1">
                              <div className="w-1 h-4 bg-primary rounded-full"></div>
                              <Label className="text-sm font-black text-accent uppercase tracking-widest flex items-center gap-2">
                                <Briefcase className="w-4 h-4 text-primary" /> 주요 프로젝트 및 성과
                              </Label>
                            </div>
                            <Textarea value={projects} onChange={e => setProjects(e.target.value)} required placeholder="성과 위주 작성" className="min-h-[150px] bg-[#F5F6F7] border-none rounded-2xl p-6 font-bold text-sm leading-relaxed shadow-inner resize-none" />
                          </div>

                          <div className="space-y-4">
                            <div className="flex items-center gap-2 px-1">
                              <div className="w-1 h-4 bg-primary rounded-full"></div>
                              <Label className="text-sm font-black text-accent uppercase tracking-widest flex items-center gap-2">
                                <FileText className="w-4 h-4 text-primary" /> 위스퍼러 지식 나눔 포부
                              </Label>
                            </div>
                            <Textarea value={bio} onChange={e => setBio(e.target.value)} required placeholder="나눔의 가치" className="min-h-[120px] bg-[#F5F6F7] border-none rounded-2xl p-6 font-bold text-sm leading-relaxed shadow-inner resize-none" />
                          </div>

                          <div className="space-y-4">
                            <div className="flex items-center gap-2 px-1">
                              <div className="w-1 h-4 bg-primary rounded-full"></div>
                              <Label className="text-sm font-black text-accent uppercase tracking-widest flex items-center gap-2">
                                <LinkIcon className="w-4 h-4 text-primary" /> 웹사이트 / SNS (링크드인 등)
                              </Label>
                            </div>
                            <Input value={website} onChange={e => setWebsite(e.target.value)} placeholder="https://..." className="h-12 bg-[#F5F6F7] border-none rounded-xl font-bold shadow-inner" />
                          </div>
                        </div>

                        <div className="pt-6 sticky bottom-0 bg-white pb-4">
                          <Button type="submit" disabled={isSubmitting} className="w-full h-16 naver-button text-accent font-black text-lg rounded-xl shadow-2xl transition-all hover:scale-[1.01]">
                            {isSubmitting ? "신청 중..." : "위스퍼러 공식 전문가 신청 완료"}
                          </Button>
                        </div>
                      </form>
                    ) : <div className="py-24 text-center text-black/20 font-black">프로필을 불러오고 있습니다...</div>}
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="flex flex-col gap-6">
            <div className="relative group">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-black/20 group-focus-within:text-primary transition-colors" />
              <Input 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="전문가 성함, 기업명, 주요 전문 분야로 검색해 보세요" 
                className="h-16 pl-16 pr-8 bg-white border-2 border-primary rounded-2xl shadow-lg focus-visible:ring-0 text-lg font-black placeholder:text-black/10"
              />
            </div>
            <div className="flex flex-wrap gap-2 md:gap-3 py-2">
              {MENTOR_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={cn(
                    "px-8 py-3.5 rounded-full text-sm font-black transition-all border-2 whitespace-nowrap",
                    selectedCategory === cat 
                      ? "bg-primary text-accent border-primary shadow-lg" 
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
        ) : filteredMentors.length === 0 ? (
          <div className="py-40 text-center bg-white border border-black/5 rounded-[3rem]">
            <p className="text-black/20 font-black text-xl">조건과 일치하는 전문가를 찾지 못했습니다.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10">
            {filteredMentors.map((m) => (
              <Card key={m.id} className="group bg-white border border-black/[0.06] hover:border-primary/20 hover:shadow-2xl transition-all duration-500 rounded-[2.5rem] overflow-hidden flex flex-col h-full">
                <CardContent className="p-10 flex flex-col items-center text-center flex-1">
                  <div className="relative mb-10">
                    <div className="relative w-40 h-40 rounded-full overflow-hidden border-4 border-white shadow-2xl">
                       <img src={m.profilePictureUrl} alt={m.name} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" />
                    </div>
                    {m.isVerified && (
                      <Badge className="absolute -bottom-2 right-4 bg-primary text-accent font-black border-none px-4 py-1.5 rounded-full flex gap-2 items-center shadow-xl text-[10px]">
                        <Check className="w-3.5 h-3.5" /> WHISPERER
                      </Badge>
                    )}
                  </div>
                  
                  <div className="space-y-2 mb-6">
                    <h3 className="text-2xl font-black text-accent">{m.name} 전문가</h3>
                    <p className="text-black/40 text-xs font-bold">{m.company} · {m.jobTitle}</p>
                  </div>

                  <Badge variant="outline" className="mb-8 border-primary/20 text-primary font-black text-[11px] px-5 py-1 rounded-full">#{m.specialty}</Badge>
                  
                  <p className="text-sm text-black/50 line-clamp-3 mb-10 font-medium leading-relaxed italic px-4">
                    "{m.bio}"
                  </p>

                  <div className="grid grid-cols-1 w-full gap-3 mt-auto">
                    <Button 
                      onClick={() => setPostViewTarget({ id: m.userId, name: m.name })}
                      variant="ghost" 
                      className="h-12 rounded-xl bg-[#F5F6F7] hover:bg-accent hover:text-white text-black/40 font-black gap-2 text-xs transition-all"
                    >
                      <FileText className="w-4 h-4" /> 최근 지식 나눔 보기
                    </Button>
                    <Button 
                      onClick={() => {
                        if (!user) { toast({ title: "로그인 필요", description: "문의를 위해 로그인이 필요합니다.", variant: "destructive" }); return; }
                        setMessageTarget({ id: m.userId, nickname: m.name })
                      }}
                      className="h-12 rounded-xl naver-button text-accent font-black gap-2 shadow-lg transition-transform hover:scale-[1.02] text-sm"
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
