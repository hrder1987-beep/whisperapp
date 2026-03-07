
"use client"

import { useState, useMemo, useRef } from "react"
import { Header } from "@/components/whisper/Header"
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
import { Plus, Search, Camera, FileText, Sparkles, Phone, Mail, Award, Briefcase, Video, ImageIcon, Type, Bold, Italic, List, Youtube, X } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"
import Image from "next/image"

const INSTRUCTOR_CATEGORIES = [
  "전체", "인사전략", "채용/리크루팅", "HRD/교육", "평가/보상(C&B)", 
  "조직문화/EVP", "DX/AI", "노무/ER", "리더십/코칭", "비즈니스 스킬", 
  "면접관 교육", "기타"
]

const MOCK_INSTRUCTORS: Instructor[] = [
  {
    id: "inst-sample-1",
    name: "김지현",
    specialty: "리더십",
    bio: "국내 10대 기업 대상 15년간 리더십 코칭을 수행해온 전문가입니다. 특히 '심리적 안정감' 기반의 고성과 팀 구축 전략에 특화되어 있습니다.",
    profilePictureUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=400",
    userId: "mock-i1",
    createdAt: 1714521600000,
    isVerified: true,
    company: "리더십인사이트",
    career: "前 삼성전자 HRD 팀장\n현 리더십인사이트 대표 컨설턴트",
    email: "jh.kim@leadership.com"
  },
  {
    id: "inst-sample-2",
    name: "이승우",
    specialty: "DX/AI",
    bio: "HR 테크 및 데이터 분석 전문가입니다. 생성형 AI(ChatGPT 등)를 채용과 교육에 즉각적으로 도입할 수 있는 실무 프로세스를 제안합니다.",
    profilePictureUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=400",
    userId: "mock-i2",
    createdAt: 1714608000000,
    isVerified: true,
    company: "HR테크 연구소",
    career: "구글 코리아 HR 데이터 분석 파트너",
    email: "sw.lee@hrtech.lab"
  }
]

export default function InstructorsPage() {
  const { user } = useUser()
  const db = useFirestore()
  const { toast } = useToast()
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const detailImageInputRef = useRef<HTMLInputElement>(null)
  
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("전체")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [viewTarget, setViewTarget] = useState<Instructor | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [name, setName] = useState("")
  const [specialty, setSpecialty] = useState("")
  const [company, setCompany] = useState("")
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")
  const [career, setCareer] = useState("")
  const [certifications, setCertifications] = useState("")
  const [bio, setBio] = useState("")
  const [profilePictureUrl, setProfilePictureUrl] = useState<string | null>(null)
  const [detailImageUrl, setDetailImageUrl] = useState<string | null>(null)
  const [videoUrl, setVideoUrl] = useState("")
  const [showVideoInput, setShowVideoInput] = useState(false)

  const instructorsQuery = useMemoFirebase(() => db ? query(collection(db, "instructors"), orderBy("createdAt", "desc")) : null, [db])
  const { data: instructorsData, isLoading } = useCollection<Instructor>(instructorsQuery)
  
  const instructors = useMemo(() => {
    const fetched = instructorsData || []
    const merged = [...fetched]
    MOCK_INSTRUCTORS.forEach(mi => { if (!merged.some(i => i.id === mi.id)) merged.push(mi) })
    return merged.sort((a, b) => b.createdAt - a.createdAt)
  }, [instructorsData])

  const filteredInstructors = instructors.filter(i => {
    const matchesSearch = i.name.toLowerCase().includes(searchQuery.toLowerCase()) || i.bio.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === "전체" || i.specialty === selectedCategory
    return matchesSearch && matchesCategory
  })

  const handleOpenDialog = (open: boolean) => {
    if (open && !user) {
      toast({ title: "로그인 필요", description: "강사 등록을 위해 로그인이 필요합니다.", variant: "destructive" }); 
      router.push("/auth?mode=login"); 
      return; 
    }
    setIsDialogOpen(open)
  }

  const handleAddInstructor = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) { toast({ title: "로그인 필요", description: "강사 등록을 위해 로그인이 필요합니다.", variant: "destructive" }); router.push("/auth?mode=login"); return; }
    setIsSubmitting(true)
    try {
      await addDoc(collection(db, "instructors"), {
        name, specialty, company, bio, career, certifications,
        phoneNumber: phone, email,
        profilePictureUrl: profilePictureUrl || `https://picsum.photos/seed/${name}/400/400`,
        detailImageUrl: detailImageUrl || null,
        videoUrl: videoUrl || null,
        userId: user.uid, createdAt: Date.now(), isVerified: false 
      })
      toast({ title: "등록 완료", description: "강사 프로필이 생성되었습니다. 검토 후 공식 등록됩니다." })
      setIsDialogOpen(false)
      setName(""); setSpecialty(""); setCompany(""); setPhone(""); setEmail("");
      setCareer(""); setCertifications(""); setBio(""); setProfilePictureUrl(null);
      setDetailImageUrl(null); setVideoUrl(""); setShowVideoInput(false);
    } catch (error) { toast({ title: "오류", description: "문제가 발생했습니다.", variant: "destructive" }) }
    finally { setIsSubmitting(false) }
  }

  const getYoutubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  }

  return (
    <div className="min-h-screen bg-[#F5F6F7]">
      <Header />
      <main className="max-w-7xl mx-auto px-4 py-8 md:py-16 pb-24">
        <div className="flex flex-col gap-8 mb-16">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-1">
              <h1 className="text-3xl md:text-4xl font-black text-[#1E1E23] tracking-tighter">강사 인텔리전스</h1>
              <p className="text-sm md:text-base font-bold text-[#888]">분야별 최고의 전문 강사진 프로필 및 섭외 정보</p>
            </div>

            <div className="hidden md:block">
              <Dialog open={isDialogOpen} onOpenChange={handleOpenDialog}>
                <DialogTrigger asChild>
                  <Button className="naver-button h-14 px-10 rounded-xl shadow-xl transition-all gap-3 text-base">
                    <Plus className="w-5 h-5" />
                    전문 강사 등록
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl bg-white border-none rounded-none p-0 shadow-2xl overflow-hidden max-h-[95vh] flex flex-col">
                  <DialogHeader className="bg-white border-b border-black/5 p-8 shrink-0 text-left">
                    <DialogTitle className="text-2xl font-black text-accent">전문 강사 프로필 게시</DialogTitle>
                    <p className="text-black/40 text-[10px] font-bold mt-1 uppercase tracking-widest">Register Professional Instructor</p>
                  </DialogHeader>
                  
                  <div className="flex-1 overflow-y-auto">
                    <form onSubmit={handleAddInstructor} className="p-10 space-y-12 pb-24">
                      <div className="flex flex-col md:flex-row gap-10">
                        <div className="space-y-4">
                          <label className="text-[11px] font-black text-accent/40 uppercase tracking-widest ml-1 flex items-center gap-2"><Camera className="w-3.5 h-3.5" /> 프로필 사진</label>
                          <div onClick={() => fileInputRef.current?.click()} className="w-40 h-40 rounded-2xl bg-[#F5F6F7] border-2 border-dashed border-black/10 flex items-center justify-center cursor-pointer hover:border-primary overflow-hidden shrink-0 shadow-inner group">
                            {profilePictureUrl ? <img src={profilePictureUrl} className="w-full h-full object-cover" alt="preview" /> : <Camera className="w-10 h-10 text-black/10 group-hover:text-primary transition-colors" />}
                          </div>
                          <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => handleImageChange(e, setProfilePictureUrl)} />
                        </div>
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <label className="text-[11px] font-black text-accent/40 uppercase tracking-widest ml-1">강사 성함</label>
                            <Input value={name} onChange={e => setName(e.target.value)} required placeholder="실명 입력" className="h-12 bg-[#F5F6F7] border-none rounded-xl font-bold shadow-inner" />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[11px] font-black text-accent/40 uppercase tracking-widest ml-1">전문 분야</label>
                            <Select onValueChange={setSpecialty} required>
                              <SelectTrigger className="h-12 bg-[#F5F6F7] border-none rounded-xl font-bold shadow-inner"><SelectValue placeholder="카테고리 선택" /></SelectTrigger>
                              <SelectContent>{INSTRUCTOR_CATEGORIES.filter(c => c !== "전체").map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <label className="text-[11px] font-black text-accent/40 uppercase tracking-widest ml-1">소속 (기업/연구소)</label>
                            <Input value={company} onChange={e => setCompany(e.target.value)} placeholder="예: 위스퍼 컨설팅" className="h-12 bg-[#F5F6F7] border-none rounded-xl font-bold shadow-inner" />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[11px] font-black text-accent/40 uppercase tracking-widest ml-1">연락처</label>
                            <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="010-0000-0000" className="h-12 bg-[#F5F6F7] border-none rounded-xl font-bold shadow-inner" />
                          </div>
                          <div className="md:col-span-2 space-y-2">
                            <label className="text-[11px] font-black text-accent/40 uppercase tracking-widest ml-1">공식 이메일</label>
                            <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="example@email.com" className="h-12 bg-[#F5F6F7] border-none rounded-xl font-bold shadow-inner" />
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-[#F5F6F7] p-8 rounded-3xl border border-black/5 shadow-inner">
                        <div className="space-y-4">
                          <label className="text-[11px] font-black text-accent/40 uppercase tracking-widest ml-1 flex items-center gap-2"><Briefcase className="w-3.5 h-3.5 text-primary" /> 주요 경력 사항</label>
                          <Textarea value={career} onChange={e => setCareer(e.target.value)} placeholder="시기별 주요 이력을 작성해 주세요." className="min-h-[120px] bg-white border-none rounded-xl p-4 font-bold text-sm shadow-sm" />
                        </div>
                        <div className="space-y-4">
                          <label className="text-[11px] font-black text-accent/40 uppercase tracking-widest ml-1 flex items-center gap-2"><Award className="w-3.5 h-3.5 text-primary" /> 보유 자격증 및 수료 사항</label>
                          <Textarea value={certifications} onChange={e => setCertifications(e.target.value)} placeholder="전문 자격증 및 학위 정보를 입력하세요." className="min-h-[120px] bg-white border-none rounded-xl p-4 font-bold text-sm shadow-sm" />
                        </div>
                      </div>

                      <div className="space-y-10">
                        <div className="space-y-4">
                          <label className="text-sm font-black text-[#1E1E23]">강사 상세 소개 및 포트폴리오</label>
                          <div className="border border-black/10 rounded-2xl overflow-hidden shadow-sm">
                            <div className="bg-[#FBFBFC] border-b border-black/10 p-3 flex items-center gap-2">
                              <Button type="button" variant="ghost" size="icon" className="h-9 w-9 text-black/40 hover:text-primary" onClick={(e) => { e.preventDefault(); detailImageInputRef.current?.click(); }}><ImageIcon className="w-5 h-5" /></Button>
                              <input type="file" ref={detailImageInputRef} className="hidden" accept="image/*" onChange={(e) => handleImageChange(e, setDetailImageUrl)} />
                              <Button type="button" variant="ghost" size="icon" className={cn("h-9 w-9", showVideoInput ? "text-primary bg-primary/5" : "text-black/40 hover:text-primary")} onClick={(e) => { e.preventDefault(); setShowVideoInput(!showVideoInput); }}><Video className="w-5 h-5" /></Button>
                              <div className="w-px h-5 bg-black/10 mx-2" />
                              <Button type="button" variant="ghost" size="icon" className="h-9 w-9 text-black/40 hover:text-primary"><Type className="w-5 h-5" /></Button>
                              <Button type="button" variant="ghost" size="icon" className="h-9 w-9 text-black/40 hover:text-primary"><Bold className="w-4 h-4" /></Button>
                              <Button type="button" variant="ghost" size="icon" className="h-9 w-9 text-black/40 hover:text-primary"><List className="w-4 h-4" /></Button>
                            </div>

                            {showVideoInput && (
                              <div className="bg-primary/5 p-4 border-b border-black/5 flex items-center gap-3">
                                <Youtube className="w-5 h-5 text-[#FF0000]" />
                                <Input value={videoUrl} onChange={e => setVideoUrl(e.target.value)} placeholder="유튜브 영상 주소를 입력하세요" className="h-10 bg-white border-black/10 rounded-lg text-sm font-bold" />
                              </div>
                            )}

                            {detailImageUrl && (
                              <div className="p-4 border-b border-black/5 bg-white flex justify-center relative group">
                                <img src={detailImageUrl} alt="detail preview" className="max-h-60 rounded-lg object-contain shadow-md" />
                                <Button type="button" variant="destructive" size="icon" className="absolute top-6 right-6 h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => setDetailImageUrl(null)}><X className="w-4 h-4" /></Button>
                              </div>
                            )}

                            <Textarea value={bio} onChange={e => setBio(e.target.value)} required placeholder="내용을 입력하세요" className="min-h-[400px] border-none shadow-none focus-visible:ring-0 p-8 text-base font-medium leading-relaxed resize-none bg-white" />
                          </div>
                        </div>
                      </div>

                      <Button type="submit" disabled={isSubmitting} className="w-full h-16 naver-button text-lg rounded-xl shadow-2xl hover:scale-[1.01] transition-all">강사 등록 요청 완료</Button>
                    </form>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <div className="relative group">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-black/20 group-focus-within:text-primary transition-colors" />
              <Input 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="강사 성함, 전문 분야, 소속 기업으로 검색해 보세요" 
                className="h-16 pl-16 pr-8 bg-white border-2 border-primary rounded-2xl shadow-lg focus-visible:ring-0 text-lg font-black placeholder:text-black/10"
              />
            </div>
            
            {/* Desktop Categories */}
            <div className="hidden md:flex flex-wrap gap-2 md:gap-3 py-2">
              {INSTRUCTOR_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={cn(
                    "px-8 py-3.5 rounded-full text-xs font-black transition-all border-2 whitespace-nowrap",
                    selectedCategory === cat 
                      ? "bg-primary text-accent border-primary shadow-lg" 
                      : "bg-white text-black/30 border-black/5 hover:border-primary/30"
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Mobile Categories - Dropdown Style */}
            <div className="md:hidden">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-full h-14 bg-white border-2 border-black/5 rounded-2xl font-black text-accent px-6">
                  <div className="flex items-center gap-2">
                    <span className="text-primary">전문분야:</span>
                    <SelectValue />
                  </div>
                </SelectTrigger>
                <SelectContent className="rounded-2xl shadow-3xl border-none p-2">
                  {INSTRUCTOR_CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat} className="rounded-xl py-3 font-bold">{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-40"><Sparkles className="w-14 h-14 animate-spin text-primary" /></div>
        ) : filteredInstructors.length === 0 ? (
          <div className="py-40 text-center bg-white border border-black/5 rounded-[3rem]">
            <p className="text-black/20 font-black text-xl">준비된 강사 정보가 없습니다.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10">
            {filteredInstructors.map((i) => (
              <Card key={i.id} className="group bg-white border border-black/[0.06] hover:border-primary/20 hover:shadow-2xl transition-all duration-500 rounded-[2.5rem] overflow-hidden flex flex-col h-full">
                <CardContent className="p-10 flex flex-col items-center text-center">
                  <div className="relative mb-8">
                    <div className="w-40 h-40 rounded-full overflow-hidden border-4 border-white shadow-xl">
                       <img src={i.profilePictureUrl} alt={i.name} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" />
                    </div>
                    {i.isVerified && <Badge className="absolute -bottom-2 right-2 bg-accent text-primary font-black border-none px-4 py-1.5 rounded-full text-[9px] shadow-lg">VERIFIED</Badge>}
                  </div>
                  <h3 className="text-2xl font-black text-accent mb-1">{i.name} 강사</h3>
                  {i.company && <p className="text-xs font-bold text-black/30 mb-4">{i.company}</p>}
                  <Badge variant="outline" className="mb-8 border-primary/20 text-primary font-black text-xs px-5 py-1 rounded-full">#{i.specialty}</Badge>
                  <p className="text-sm text-black/50 line-clamp-3 mb-10 font-medium leading-relaxed italic px-4">"{i.bio}"</p>
                  <Button onClick={() => setViewTarget(i)} className="w-full h-12 rounded-xl naver-button text-accent text-sm gap-2 shadow-lg group-hover:scale-[1.02] transition-transform">상세 프로필 확인</Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      {viewTarget && (
        <Dialog open={!!viewTarget} onOpenChange={() => setViewTarget(null)}>
          <DialogContent className="max-w-4xl bg-white border-none rounded-[3rem] p-0 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <DialogHeader className="sr-only">
              <DialogTitle>{viewTarget.name} 강사 상세 프로필</DialogTitle>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto">
              <div className="p-12">
                <div className="flex flex-col md:flex-row items-center md:items-start gap-12 mb-16">
                  <div className="w-48 h-48 rounded-full overflow-hidden border-4 border-white shadow-2xl shrink-0">
                    <img src={viewTarget.profilePictureUrl} alt={viewTarget.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 space-y-6 text-center md:text-left">
                    <div>
                      <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
                        <h2 className="text-4xl font-black text-accent">{viewTarget.name} 강사</h2>
                        {viewTarget.isVerified && <Badge className="bg-primary text-accent font-black border-none text-[10px]">공식 인증</Badge>}
                      </div>
                      <p className="text-xl font-bold text-primary">@{viewTarget.company || "전문 강사"}</p>
                    </div>
                    
                    <div className="flex flex-wrap justify-center md:justify-start gap-3">
                      <div className="flex items-center gap-2 bg-[#F5F6F7] px-4 py-2 rounded-xl text-xs font-bold text-accent/60"><Phone className="w-3.5 h-3.5" /> {viewTarget.phoneNumber || "비공개"}</div>
                      <div className="flex items-center gap-2 bg-[#F5F6F7] px-4 py-2 rounded-xl text-xs font-bold text-accent/60"><Mail className="w-3.5 h-3.5" /> {viewTarget.email || "비공개"}</div>
                      <Badge className="bg-accent text-white font-black px-5 py-2 rounded-xl border-none">#{viewTarget.specialty}</Badge>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
                  <div className="bg-[#F5F6F7] p-8 rounded-3xl space-y-4 shadow-inner border border-black/5">
                    <h4 className="text-[11px] font-black text-accent/30 uppercase tracking-widest flex items-center gap-2"><Briefcase className="w-4 h-4 text-primary" /> 주요 경력 사항</h4>
                    <p className="text-sm font-bold text-accent leading-relaxed whitespace-pre-wrap">{viewTarget.career || "등록된 경력 정보가 없습니다."}</p>
                  </div>
                  <div className="bg-[#F5F6F7] p-8 rounded-3xl space-y-4 shadow-inner border border-black/5">
                    <h4 className="text-[11px] font-black text-accent/30 uppercase tracking-widest flex items-center gap-2"><Award className="w-4 h-4 text-primary" /> 전문 자격 및 수료</h4>
                    <p className="text-sm font-bold text-accent leading-relaxed whitespace-pre-wrap">{viewTarget.certifications || "등록된 자격 정보가 없습니다."}</p>
                  </div>
                </div>

                <div className="space-y-12">
                  <h4 className="text-sm font-black text-accent/30 uppercase tracking-[0.2em] flex items-center gap-3">
                    <div className="w-8 h-px bg-accent/10"></div> 상세 소개 및 포트폴리오
                  </h4>

                  {viewTarget.videoUrl && getYoutubeId(viewTarget.videoUrl) && (
                    <div className="relative w-full aspect-video rounded-3xl overflow-hidden border border-black/5 shadow-2xl bg-black">
                      <iframe
                        width="100%" height="100%"
                        src={`https://www.youtube.com/embed/${getYoutubeId(viewTarget.videoUrl)}`}
                        title="Instructor Video" frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen
                      ></iframe>
                    </div>
                  )}

                  {viewTarget.detailImageUrl && (
                    <div className="relative w-full border border-black/5 shadow-xl rounded-3xl overflow-hidden bg-white">
                      <img src={viewTarget.detailImageUrl} alt="instructor detail" className="w-full h-auto block" />
                    </div>
                  )}

                  <div className="bg-[#FBFBFC] p-10 rounded-3xl border border-black/5">
                    <p className="text-lg leading-relaxed text-accent/80 whitespace-pre-wrap font-medium">{viewTarget.bio}</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-8 bg-[#F5F6F7] border-t border-black/5 flex justify-end">
              <Button onClick={() => setViewTarget(null)} className="h-14 px-12 rounded-xl naver-button text-accent font-black text-lg shadow-xl hover:scale-105 transition-all">프로필 창 닫기</Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
