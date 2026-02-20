
"use client"

import { useState, useMemo, useRef } from "react"
import { Header } from "@/components/chuchot/Header"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection, query, orderBy, addDoc } from "firebase/firestore"
import { Instructor } from "@/lib/types"
import { Plus, Search, Star, Award, Briefcase, Camera, Check, GraduationCap, Sparkles, Phone, Mail, Globe, FileText, X, User, ExternalLink, Info } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"

const INSTRUCTOR_CATEGORIES = [
  "전체보기", 
  "HRD", 
  "리더십", 
  "신입사원", 
  "비즈니스 스킬", 
  "DX/생성형 AI",
  "변화관리", 
  "공통역량", 
  "영업/CS", 
  "공공조직 맞춤교육", 
  "조직문화/조직개발", 
  "커리어컨설팅", 
  "조직활성화", 
  "어학교육", 
  "법정의무교육", 
  "기타"
]

const MOCK_INSTRUCTORS: Instructor[] = [
  {
    id: "inst-1",
    name: "최영희",
    specialty: "비즈니스 스킬",
    bio: "커뮤니케이션 및 갈등 관리 전문가. 국내 대기업 및 공공기관 500회 이상의 출강 경력을 보유하고 있으며, 실질적인 조직 내 관계 개선 솔루션을 제안합니다.",
    profilePictureUrl: "https://picsum.photos/seed/inst1/400/400",
    userId: "mock-i1",
    createdAt: Date.now(),
    phoneNumber: "010-1234-5678",
    email: "choi@expert.com",
    website: "https://choiexpert.com",
    references: "삼성전자, 현대자동차, SK하이닉스 등 다수 출강",
    isVerified: true
  },
  {
    id: "inst-2",
    name: "정성진",
    specialty: "리더십",
    bio: "팀장 리더십 개발 및 코칭 전문가. 신임 팀장들을 위한 성과 관리와 팀워크 구축 프로세스를 데이터 기반으로 강의합니다.",
    profilePictureUrl: "https://picsum.photos/seed/inst2/400/400",
    userId: "mock-i2",
    createdAt: Date.now(),
    phoneNumber: "010-2222-3333",
    email: "jung@leadership.com",
    references: "LG전자 신임팀장 과정 전담 강사",
    isVerified: true
  }
]

export default function InstructorsPage() {
  const { user } = useUser()
  const db = useFirestore()
  const { toast } = useToast()
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const pdfInputRef = useRef<HTMLInputElement>(null)
  
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("전체보기")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [viewTarget, setViewTarget] = useState<Instructor | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Registration Form States
  const [name, setName] = useState("")
  const [specialty, setSpecialty] = useState("")
  const [bio, setBio] = useState("")
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")
  const [website, setWebsite] = useState("")
  const [references, setReferences] = useState("")
  const [profilePictureUrl, setProfilePictureUrl] = useState<string | null>(null)
  const [curriculumPdfUrl, setCurriculumPdfUrl] = useState<string | null>(null)

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
      const matchesCategory = selectedCategory === "전체보기" || i.specialty === selectedCategory;
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

  const handlePdfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.type !== "application/pdf") {
        toast({ title: "파일 형식 오류", description: "PDF 파일만 업로드 가능합니다.", variant: "destructive" })
        return
      }
      const reader = new FileReader()
      reader.onloadend = () => setCurriculumPdfUrl(reader.result as string)
      reader.readAsDataURL(file)
      toast({ title: "파일 선택 완료", description: "커리큘럼 PDF가 준비되었습니다." })
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
        phoneNumber: phone,
        email,
        website,
        references,
        profilePictureUrl: profilePictureUrl || `https://picsum.photos/seed/${name}/400/400`,
        curriculumPdfUrl: curriculumPdfUrl || null,
        userId: user.uid,
        createdAt: Date.now(),
        isVerified: false 
      })
      toast({ title: "등록 완료", description: "강사 프로필이 성공적으로 생성되었습니다. 관리자 확인 후 인증 마크가 부여됩니다." })
      setIsDialogOpen(false)
      setName(""); setSpecialty(""); setBio(""); setPhone(""); setEmail(""); setWebsite(""); setReferences(""); setProfilePictureUrl(null); setCurriculumPdfUrl(null);
    } catch (error) {
      toast({ title: "오류 발생", description: "등록 중 문제가 발생했습니다.", variant: "destructive" })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 py-12 md:py-20">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-12 mb-20">
          <div className="space-y-8 flex-1">
            <div className="inline-flex items-center gap-2 bg-accent/10 px-4 py-2 rounded-full border border-accent/20">
              <Star className="w-4 h-4 text-accent" />
              <span className="text-[10px] font-black text-accent uppercase tracking-[0.2em]">Instructor PR Center</span>
            </div>
            
            <div className="space-y-4">
              <h1 className="text-5xl md:text-7xl font-black text-primary tracking-tighter leading-[0.9]">
                강사 정보 <span className="text-accent/40 font-light tracking-widest block md:inline md:ml-2 text-3xl md:text-5xl">Expert Pool</span>
              </h1>
              <p className="text-xl md:text-2xl font-medium text-primary/50 max-w-4xl leading-relaxed text-balance">
                최고의 전문 강사진과 함께 <span className="text-primary font-black underline decoration-accent/30 underline-offset-4">조직의 성장</span>을 도모하세요. <br className="hidden md:block" />
                현업의 지혜가 담긴 각 분야 최고의 강사진을 한눈에 확인하실 수 있습니다.
              </p>
            </div>
            
            <div className="relative max-w-2xl group">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-primary/20 group-focus-within:text-accent transition-colors" />
              <Input 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="강사명 또는 전문 강의 주제를 검색하세요..." 
                className="h-16 pl-16 pr-8 bg-white border-none rounded-[2rem] shadow-xl focus-visible:ring-accent/50 text-base font-bold placeholder:text-primary/20"
              />
            </div>
          </div>

          <Button 
            onClick={handleOpenDialog}
            className="hidden md:flex bg-primary text-accent hover:bg-primary/95 font-black h-20 px-12 rounded-[2.5rem] shadow-2xl hover:scale-105 active:scale-95 transition-all gap-3 text-lg shrink-0 border border-accent/20"
          >
            <Plus className="w-6 h-6" />
            강사 프로필 등록하기
          </Button>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent className="max-w-3xl bg-white border-none rounded-[3rem] p-10 shadow-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-2xl font-black text-primary mb-8 flex items-center gap-3">
                  <GraduationCap className="w-8 h-8 text-accent" />
                  강사 프로필 상세 등록
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddInstructor} className="space-y-8">
                <div className="flex flex-col md:flex-row gap-10">
                  <div className="flex flex-col items-center shrink-0">
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      className="relative w-44 h-44 rounded-[3rem] bg-primary/5 border-2 border-dashed border-primary/10 flex flex-col items-center justify-center cursor-pointer hover:border-accent transition-all overflow-hidden shadow-inner"
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
                    <p className="text-[10px] text-accent font-black mt-2 flex items-center gap-1"><Info className="w-3 h-3" /> 권장: 400x400px (1:1)</p>
                    
                    <div className="mt-6 w-full space-y-2">
                      <label className="text-[10px] font-black text-primary/40 ml-2 uppercase">대표 커리큘럼 (PDF)</label>
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => pdfInputRef.current?.click()}
                        className={cn(
                          "w-full h-12 rounded-xl border-primary/10 font-bold gap-2 text-xs",
                          curriculumPdfUrl ? "text-emerald-500 border-emerald-200 bg-emerald-50" : "text-primary/40"
                        )}
                      >
                        <FileText className="w-4 h-4" />
                        {curriculumPdfUrl ? "PDF 등록 완료" : "커리큘럼 파일 선택"}
                      </Button>
                      <input type="file" ref={pdfInputRef} onChange={handlePdfChange} accept="application/pdf" className="hidden" />
                    </div>
                  </div>

                  <div className="flex-1 space-y-5">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-primary/40 ml-2 uppercase">강사 성함</label>
                        <Input value={name} onChange={e => setName(e.target.value)} required placeholder="성함" className="h-12 bg-primary/5 border-none rounded-xl" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-primary/40 ml-2 uppercase">주요 카테고리</label>
                        <Select onValueChange={setSpecialty} required>
                          <SelectTrigger className="h-12 bg-primary/5 border-none rounded-xl"><SelectValue placeholder="분류 선택" /></SelectTrigger>
                          <SelectContent>
                            {INSTRUCTOR_CATEGORIES.filter(c => c !== "전체보기").map(c => (
                              <SelectItem key={c} value={c}>{c}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-primary/40 ml-2 uppercase">연락처</label>
                        <Input value={phone} onChange={e => setPhone(e.target.value)} required placeholder="010-0000-0000" className="h-12 bg-primary/5 border-none rounded-xl" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-primary/40 ml-2 uppercase">이메일 주소</label>
                        <Input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="email@address.com" className="h-12 bg-primary/5 border-none rounded-xl" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-primary/40 ml-2 uppercase">홈페이지 / SNS 주소</label>
                      <Input value={website} onChange={e => setWebsite(e.target.value)} placeholder="https://..." className="h-12 bg-primary/5 border-none rounded-xl" />
                    </div>
                  </div>
                </div>

                <div className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-primary/40 ml-2 uppercase">상세 분야 및 본인 소개</label>
                    <Textarea value={bio} onChange={e => setBio(e.target.value)} required placeholder="강사님의 전문성과 경력을 상세히 알려주세요." className="bg-primary/5 border-none rounded-2xl min-h-[120px] text-sm" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-primary/40 ml-2 uppercase">주요 강의 레퍼런스</label>
                    <Textarea value={references} onChange={e => setReferences(e.target.value)} placeholder="출강 기업, 기관 또는 주요 성과를 입력하세요." className="bg-primary/5 border-none rounded-2xl min-h-[80px] text-sm" />
                  </div>
                </div>

                <Button type="submit" disabled={isSubmitting} className="w-full h-16 bg-primary text-accent font-black rounded-2xl shadow-xl mt-6 text-lg border border-accent/20">
                  {isSubmitting ? "프로필 등록 중..." : "강사 프로필 게시하기"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="flex flex-wrap gap-2 mb-16">
          {INSTRUCTOR_CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={cn(
                "px-5 py-2.5 rounded-full text-xs font-black transition-all border-2 flex items-center gap-2",
                selectedCategory === cat 
                  ? "bg-primary text-accent border-primary shadow-lg scale-105" 
                  : "bg-white text-primary/30 border-primary/5 hover:border-accent/30 hover:text-primary"
              )}
            >
              {cat === "DX/생성형 AI" && <Sparkles className={cn("w-3.5 h-3.5", selectedCategory === cat ? "text-accent" : "text-accent/40")} />}
              {cat}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-40"><Star className="w-16 h-16 animate-spin text-accent" /></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10">
            {filteredInstructors.map((i) => (
              <Card key={i.id} className="group bg-white border-primary/5 rounded-[3.5rem] overflow-hidden shadow-sm hover:shadow-2xl hover:-translate-y-4 transition-all duration-500 flex flex-col">
                <CardContent className="p-8 flex flex-col items-center text-center flex-1">
                  <div className="relative mb-8">
                    <div className="absolute inset-0 bg-accent blur-3xl opacity-10 group-hover:opacity-30 transition-opacity"></div>
                    <div className="relative w-40 h-40 rounded-[2.5rem] overflow-hidden border-4 border-white shadow-2xl">
                       <img src={i.profilePictureUrl} alt={i.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                    </div>
                    {i.isVerified && (
                      <Badge className="absolute -bottom-2 right-0 bg-primary text-accent font-black border-none px-4 py-1.5 rounded-xl shadow-2xl flex gap-1.5 items-center text-[10px] border border-accent/20">
                        <Check className="w-3.5 h-3.5" /> VERIFIED
                      </Badge>
                    )}
                  </div>
                  
                  <div className="space-y-1.5 mb-6">
                    <h3 className="text-2xl font-black text-primary group-hover:text-accent transition-colors">{i.name} 강사</h3>
                    <Badge variant="outline" className="border-accent/20 text-accent font-black text-[10px] px-3 py-0.5 flex items-center gap-1">
                      {i.specialty === "DX/생성형 AI" && <Sparkles className="w-2.5 h-2.5" />}
                      #{i.specialty}
                    </Badge>
                  </div>
                  
                  <p className="text-xs text-primary/60 line-clamp-3 mb-8 font-medium leading-relaxed italic px-2">
                    "{i.bio}"
                  </p>

                  <div className="grid grid-cols-1 w-full gap-3 mt-auto">
                    <Button 
                      onClick={() => setViewTarget(i)}
                      className="h-12 rounded-xl bg-accent text-primary font-black transition-all gap-2 text-xs shadow-lg hover:scale-105"
                    >
                      <User className="w-4 h-4" /> 상세 프로필 보기
                    </Button>
                    <Button 
                      disabled={!i.curriculumPdfUrl}
                      onClick={() => i.curriculumPdfUrl && window.open(i.curriculumPdfUrl, '_blank')}
                      variant="outline"
                      className="h-12 rounded-xl border-primary/10 text-primary font-black gap-2 hover:bg-primary/5 transition-all text-xs"
                    >
                      <FileText className="w-4 h-4" /> 대표 커리큘럼 보기
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* Instructor Detail Dialog */}
      <Dialog open={!!viewTarget} onOpenChange={() => setViewTarget(null)}>
        <DialogContent className="max-w-2xl bg-white border-none rounded-[3rem] p-0 overflow-hidden shadow-2xl">
          <DialogHeader className="sr-only">
            <DialogTitle>{viewTarget?.name || "강사 상세 프로필"}</DialogTitle>
          </DialogHeader>
          
          {viewTarget && (
            <div className="flex flex-col max-h-[90vh]">
              <div className="premium-gradient p-10 flex items-center gap-8 shrink-0">
                <div className="w-32 h-32 rounded-[2.5rem] overflow-hidden border-4 border-white/20 shadow-2xl shadow-black/20">
                  <img src={viewTarget.profilePictureUrl} alt={viewTarget.name} className="w-full h-full object-cover" />
                </div>
                <div className="space-y-2">
                  {viewTarget.isVerified && <Badge className="bg-accent text-primary font-black border-none px-3 py-1 rounded-lg text-[10px]">VERIFIED INSTRUCTOR</Badge>}
                  <h2 className="text-3xl font-black text-white">{viewTarget.name} 강사</h2>
                  <p className="text-accent/80 font-bold text-sm">#{viewTarget.specialty}</p>
                </div>
                <button onClick={() => setViewTarget(null)} className="absolute top-6 right-6 text-white/40 hover:text-white transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-10 space-y-10 overflow-y-auto">
                <section className="space-y-4">
                  <h4 className="text-xs font-black text-primary/30 uppercase tracking-widest flex items-center gap-2">
                    <Star className="w-3.5 h-3.5 text-accent" /> 상세 프로필 및 강점
                  </h4>
                  <p className="text-[15px] leading-relaxed text-primary/70 whitespace-pre-wrap font-medium">
                    {viewTarget.bio}
                  </p>
                </section>

                {viewTarget.references && (
                  <section className="space-y-4">
                    <h4 className="text-xs font-black text-primary/30 uppercase tracking-widest flex items-center gap-2">
                      <Award className="w-3.5 h-3.5 text-accent" /> 주요 강의 레퍼런스
                    </h4>
                    <div className="bg-primary/5 rounded-2xl p-6 border border-primary/5">
                      <p className="text-sm leading-relaxed text-primary/60 font-bold whitespace-pre-wrap italic">
                        {viewTarget.references}
                      </p>
                    </div>
                  </section>
                )}

                <section className="space-y-4">
                  <h4 className="text-xs font-black text-primary/30 uppercase tracking-widest">직접 연락 및 정보</h4>
                  <div className="grid grid-cols-1 gap-3">
                    {viewTarget.phoneNumber && (
                      <div className="flex items-center justify-between p-4 bg-primary/5 rounded-xl group">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-white rounded-lg shadow-sm"><Phone className="w-4 h-4 text-accent" /></div>
                          <span className="text-sm font-black text-primary/70">{viewTarget.phoneNumber}</span>
                        </div>
                        <Button variant="ghost" size="sm" className="text-[10px] font-black text-primary/30 hover:text-accent" onClick={() => navigator.clipboard.writeText(viewTarget.phoneNumber!)}>번호 복사</Button>
                      </div>
                    )}
                    {viewTarget.email && (
                      <div className="flex items-center justify-between p-4 bg-primary/5 rounded-xl group">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-white rounded-lg shadow-sm"><Mail className="w-4 h-4 text-accent" /></div>
                          <span className="text-sm font-black text-primary/70">{viewTarget.email}</span>
                        </div>
                        <Button variant="ghost" size="sm" className="text-[10px] font-black text-primary/30 hover:text-accent" onClick={() => navigator.clipboard.writeText(viewTarget.email!)}>이메일 복사</Button>
                      </div>
                    )}
                    {viewTarget.website && (
                      <div className="flex items-center justify-between p-4 bg-primary/5 rounded-xl group cursor-pointer hover:bg-primary/10 transition-colors" onClick={() => window.open(viewTarget.website, '_blank')}>
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-white rounded-lg shadow-sm"><Globe className="w-4 h-4 text-accent" /></div>
                          <span className="text-sm font-black text-primary/70 truncate max-w-[250px]">{viewTarget.website.replace('https://', '')}</span>
                        </div>
                        <ExternalLink className="w-4 h-4 text-primary/20 group-hover:text-accent" />
                      </div>
                    )}
                  </div>
                </section>
              </div>

              <div className="p-8 bg-primary/5 border-t border-primary/5 shrink-0 flex gap-4">
                <Button 
                  onClick={() => setViewTarget(null)}
                  variant="outline" 
                  className="flex-1 h-14 rounded-2xl border-primary/10 font-black text-primary"
                >
                  닫기
                </Button>
                {viewTarget.curriculumPdfUrl && (
                  <Button 
                    onClick={() => window.open(viewTarget.curriculumPdfUrl, '_blank')}
                    className="flex-1 h-14 rounded-2xl bg-primary text-accent font-black shadow-xl border border-accent/20"
                  >
                    커리큘럼 PDF 열기
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
