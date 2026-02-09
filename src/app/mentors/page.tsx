
"use client"

import { useState, useRef, useMemo } from "react"
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
import { Plus, Star, Award, Briefcase, MessageSquare, Crown, Camera, X, Sparkles, Search, Building2, User as UserIcon } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { MessageDialog } from "@/components/chuchot/MessageDialog"

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
    createdAt: Date.now()
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
    createdAt: Date.now()
  },
  {
    id: "mentor-3",
    name: "박지훈",
    company: "Coupang",
    jobTitle: "Senior L&D Manager",
    specialty: "L&D 설계 및 운영",
    bio: "단순 교육을 넘어 비즈니스 임팩트를 만드는 학습 여정을 설계합니다. 사내 강사 양성 과정 및 디지털 트랜스포메이션 역량 강화 교육 전문가입니다.",
    profilePictureUrl: "https://picsum.photos/seed/mentor3/400/400",
    userId: "mock-m3",
    role: "mentor",
    createdAt: Date.now()
  },
  {
    id: "mentor-4",
    name: "정혜원",
    company: "Kakao",
    jobTitle: "HR Strategy Specialist",
    specialty: "인사 전략 및 노무",
    bio: "변화하는 노동법 환경에 최적화된 유연근무제 설계와 갈등 관리 솔루션을 제공합니다. 실무에서 바로 쓰이는 인사 관리 규정 정비의 달인입니다.",
    profilePictureUrl: "https://picsum.photos/seed/mentor4/400/400",
    userId: "mock-m4",
    role: "mentor",
    createdAt: Date.now()
  }
]

export default function MentorsPage() {
  const { user } = useUser()
  const db = useFirestore()
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [searchQuery, setSearchQuery] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [messageTarget, setMessageTarget] = useState<{ id: string, nickname: string } | null>(null)

  // Form states
  const [name, setName] = useState("")
  const [specialty, setSpecialty] = useState("")
  const [bio, setBio] = useState("")
  const [company, setCompany] = useState("")
  const [department, setDepartment] = useState("")
  const [jobTitle, setJobTitle] = useState("")
  const [phone, setPhone] = useState("")
  const [profilePictureUrl, setProfilePictureUrl] = useState<string | null>(null)

  const mentorsQuery = useMemoFirebase(() => {
    if (!db) return null
    return query(collection(db, "mentors"), orderBy("createdAt", "desc"))
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
      reader.onloadend = () => setProfilePictureUrl(reader.result as string)
      reader.readAsDataURL(file)
    }
  }

  const handleAddMentor = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) {
      toast({ title: "로그인 필요", description: "위스퍼러 신청을 하시려면 로그인이 필요합니다.", variant: "destructive" })
      return
    }

    setIsSubmitting(true)
    try {
      await addDoc(collection(db, "mentors"), {
        name,
        specialty,
        bio,
        company,
        department,
        jobTitle,
        phoneNumber: phone,
        profilePictureUrl: profilePictureUrl || `https://picsum.photos/seed/${name}/400/400`,
        userId: user.uid,
        role: "mentor",
        createdAt: Date.now()
      })
      toast({ title: "신청 완료", description: "위스퍼러 프로필이 등록되었습니다. 관리자 승인 후 뱃지가 부여됩니다." })
      setIsDialogOpen(false)
      setName(""); setSpecialty(""); setBio(""); setCompany(""); setDepartment(""); setJobTitle(""); setPhone(""); setProfilePictureUrl(null)
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
      <Header onSearch={setSearchQuery} />
      
      <main className="max-w-7xl mx-auto px-4 py-12">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-10 mb-16">
          <div className="space-y-4 flex-1">
            <div className="flex items-center gap-3">
              <Sparkles className="w-6 h-6 text-accent animate-pulse" />
              <span className="text-xs font-black text-accent uppercase tracking-[0.2em]">Voices of Wisdom</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-primary tracking-tighter">위스퍼러 (Whisperer)</h1>
            <p className="text-lg font-bold text-primary/30 max-w-2xl">침묵을 깨는 지혜의 목소리, Whisper가 인증한 각 분야 최고의 HR 인사이트 파트너들을 소개합니다.</p>
            
            <div className="relative max-w-xl group pt-4">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-primary/30 group-focus-within:text-accent transition-colors" />
              <Input 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="전문 위스퍼러의 성함, 기업명, 분야를 검색하세요..." 
                className="h-14 pl-14 pr-6 bg-white border-none rounded-2xl shadow-sm focus-visible:ring-accent/50 text-sm font-bold placeholder:text-primary/20"
              />
            </div>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gold-gradient text-primary font-black h-16 px-10 rounded-[2rem] shadow-2xl hover:scale-105 active:scale-95 transition-all gap-3">
                <Crown className="w-6 h-6" />
                위스퍼러 신청하기
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-xl bg-white border-none rounded-[3rem] p-10 shadow-2xl overflow-y-auto max-h-[90vh]">
              <DialogHeader>
                <DialogTitle className="text-2xl font-black text-primary mb-6">Whisperer Profile Registration</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddMentor} className="space-y-6">
                <div className="flex flex-col items-center mb-4">
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="relative w-36 h-36 rounded-[2.5rem] bg-primary/5 border-2 border-dashed border-primary/10 flex flex-col items-center justify-center cursor-pointer hover:border-accent transition-all overflow-hidden shadow-inner"
                  >
                    {profilePictureUrl ? (
                      <img src={profilePictureUrl} alt="preview" className="w-full h-full object-cover" />
                    ) : (
                      <>
                        <Camera className="w-10 h-10 text-primary/20 mb-2" />
                        <p className="text-[11px] text-primary/40 font-black">프로필 사진</p>
                      </>
                    )}
                  </div>
                  <input type="file" ref={fileInputRef} onChange={handleImageChange} accept="image/*" className="hidden" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-primary/40 ml-2">성함</label>
                    <Input value={name} onChange={e => setName(e.target.value)} required placeholder="성함" className="h-12 bg-primary/5 border-none rounded-xl" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-primary/40 ml-2">휴대전화</label>
                    <Input value={phone} onChange={e => setPhone(e.target.value)} required placeholder="010-0000-0000" className="h-12 bg-primary/5 border-none rounded-xl" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-primary/40 ml-2">소속(회사)</label>
                    <Input value={company} onChange={e => setCompany(e.target.value)} required placeholder="회사명" className="h-12 bg-primary/5 border-none rounded-xl" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-primary/40 ml-2">부서</label>
                    <Input value={department} onChange={e => setDepartment(e.target.value)} required placeholder="부서명" className="h-12 bg-primary/5 border-none rounded-xl" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-primary/40 ml-2">직함</label>
                    <Input value={jobTitle} onChange={e => setJobTitle(e.target.value)} required placeholder="직함" className="h-12 bg-primary/5 border-none rounded-xl" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-primary/40 ml-2">전문 분야</label>
                    <Input value={specialty} onChange={e => setSpecialty(e.target.value)} required placeholder="예: 채용 전략" className="h-12 bg-primary/5 border-none rounded-xl" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-primary/40 ml-2">소개 및 핵심 역량</label>
                  <Textarea value={bio} onChange={e => setBio(e.target.value)} required placeholder="전문가들에게 전하고 싶은 가치를 입력하세요" className="bg-primary/5 border-none rounded-xl min-h-[120px]" />
                </div>
                <Button type="submit" disabled={isSubmitting} className="w-full h-14 bg-primary text-accent font-black rounded-2xl shadow-lg mt-6">
                  {isSubmitting ? "등록 중..." : "위스퍼러 프로필 등록"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-40"><Star className="w-16 h-16 animate-spin text-accent" /></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10">
            {filteredMentors.map((m) => (
              <Card key={m.id} className="group bg-white border-primary/5 rounded-[3rem] overflow-hidden shadow-sm hover:shadow-2xl hover:-translate-y-3 transition-all duration-500">
                <CardContent className="p-8 flex flex-col items-center text-center">
                  <div className="relative mb-6">
                    <div className="absolute inset-0 bg-accent blur-3xl opacity-20 group-hover:opacity-40 transition-opacity"></div>
                    <div className="relative w-36 h-36 rounded-[2.5rem] overflow-hidden border-4 border-white shadow-2xl">
                       <img src={m.profilePictureUrl} alt={m.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                    </div>
                    <Badge className="absolute -bottom-2 right-0 bg-primary text-accent font-black border-none px-3 py-1 rounded-xl flex gap-1.5 items-center animate-bounce shadow-xl text-[10px]">
                      <Award className="w-3 h-3" /> WHISPERER
                    </Badge>
                  </div>
                  
                  <div className="space-y-1 mb-4">
                    <h3 className="text-xl font-black text-primary group-hover:text-accent transition-colors">{m.name}</h3>
                    <div className="flex flex-col items-center gap-0.5">
                      <p className="text-primary/60 text-[11px] font-black uppercase flex items-center gap-1">
                        <Building2 className="w-3 h-3" /> {m.company || "전문가"}
                      </p>
                      <p className="text-primary/30 text-[10px] font-bold">{m.jobTitle || "HR Consultant"}</p>
                    </div>
                  </div>

                  <Badge variant="outline" className="mb-6 border-accent/20 text-accent font-black text-[10px] px-3 py-0.5">#{m.specialty}</Badge>
                  
                  <p className="text-xs text-primary/50 line-clamp-3 mb-8 font-medium leading-relaxed italic px-2">
                    "{m.bio}"
                  </p>

                  <div className="grid grid-cols-1 w-full gap-4 mt-auto">
                    <Button 
                      onClick={() => handleMessageClick(m)}
                      variant="outline" 
                      className="h-12 rounded-2xl border-primary/10 text-primary font-black gap-2 hover:bg-primary hover:text-accent transition-all text-xs"
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

      {messageTarget && (
        <MessageDialog 
          isOpen={!!messageTarget}
          onClose={() => setMessageTarget(null)}
          receiverId={messageTarget.id}
          receiverNickname={messageTarget.nickname}
        />
      )}
    </div>
  )
}
