
"use client"

import { useState, useMemo, useRef } from "react"
import { Header } from "@/components/chuchot/Header"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useUser, useFirestore, useCollection, useMemoFirebase, addDocumentNonBlocking } from "@/firebase"
import { collection, query, orderBy } from "firebase/firestore"
import { Gathering } from "@/lib/types"
import { Plus, Users, Calendar, MapPin, Search, Camera, Info, X, Sparkles, Globe, Building2, ChevronRight, Clock } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"
import Image from "next/image"

const GATHERING_CATEGORIES = ["전체", "COP/학습", "네트워킹/친목", "컨퍼런스", "북클럽", "프로젝트"]

export default function GatheringsPage() {
  const { user } = useUser()
  const db = useFirestore()
  const { toast } = useToast()
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("전체")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Form States
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [type, setType] = useState<"online" | "offline">("online")
  const [location, setLocation] = useState("")
  const [schedule, setSchedule] = useState("")
  const [capacity, setCapacity] = useState("10")
  const [sessionCount, setSessionCount] = useState("6") // 기본 6회차
  const [category, setCategory] = useState("COP/학습")
  const [imageUrl, setImageUrl] = useState<string | null>(null)

  const gatheringsQuery = useMemoFirebase(() => {
    if (!db) return null
    return query(collection(db, "gatherings"), orderBy("createdAt", "desc"))
  }, [db])

  const { data: gatheringsData, isLoading } = useCollection<Gathering>(gatheringsQuery)

  const filteredGatherings = useMemo(() => {
    if (!gatheringsData) return []
    return gatheringsData.filter(g => {
      const matchesSearch = g.title.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesCategory = selectedCategory === "전체" || g.category === selectedCategory
      return matchesSearch && matchesCategory
    })
  }, [gatheringsData, searchQuery, selectedCategory])

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => setImageUrl(reader.result as string)
      reader.readAsDataURL(file)
    }
  }

  const handleCreateGathering = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) {
      toast({ title: "로그인 필요", description: "모임을 개설하려면 로그인이 필요합니다.", variant: "destructive" })
      router.push("/auth?mode=login")
      return
    }

    setIsSubmitting(true)
    try {
      await addDocumentNonBlocking(collection(db, "gatherings"), {
        title,
        description,
        creatorId: user.uid,
        creatorName: user.displayName || "익명전문가",
        type,
        location: type === "online" ? "온라인(상세 링크)" : location,
        schedule,
        capacity: parseInt(capacity),
        sessionCount: parseInt(sessionCount),
        participantCount: 0,
        status: "recruiting",
        category,
        imageUrl: imageUrl || `https://picsum.photos/seed/${Date.now()}/800/400`,
        createdAt: Date.now(),
        resources: []
      })
      
      toast({ title: "모임 개설 완료", description: "새로운 HR 지식 모임이 성공적으로 개설되었습니다!" })
      setIsDialogOpen(false)
      setTitle(""); setDescription(""); setLocation(""); setSchedule(""); setCapacity("10"); setSessionCount("6"); setImageUrl(null);
    } catch (error) {
      toast({ title: "오류 발생", description: "모임 개설 중 문제가 발생했습니다.", variant: "destructive" })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 py-12 md:py-20">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-12 mb-16">
          <div className="space-y-8 flex-1">
            <div className="inline-flex items-center gap-2 bg-accent/10 px-4 py-2 rounded-full border border-accent/20">
              <Users className="w-4 h-4 text-accent" />
              <span className="text-[10px] font-black text-accent uppercase tracking-[0.2em]">Collective Wisdom Gatherings</span>
            </div>
            
            <div className="space-y-4">
              <h1 className="text-5xl md:text-7xl font-black text-primary tracking-tighter leading-[0.9]">
                모임 개설 <span className="text-accent font-light tracking-widest block md:inline md:ml-2 text-3xl md:text-5xl">COP Studio</span>
              </h1>
              <p className="text-xl md:text-2xl font-medium text-primary/50 max-w-4xl leading-relaxed">
                장기 프로젝트부터 1회성 네트워킹까지. <br className="hidden md:block" />
                함께 공부하고 성장할 <span className="text-primary font-black underline decoration-accent/30 underline-offset-4">HR 전문가</span>들을 모집하세요.
              </p>
            </div>
            
            <div className="relative max-w-2xl group">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-primary/20 group-focus-within:text-accent transition-colors" />
              <Input 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="관심 있는 주제의 모임을 검색해 보세요" 
                className="h-16 pl-16 pr-8 bg-white border-none rounded-2xl shadow-xl focus-visible:ring-accent/50 text-base font-bold placeholder:text-primary/20"
              />
            </div>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="hidden md:flex bg-primary text-accent hover:bg-primary/95 font-black h-20 px-12 rounded-2xl shadow-2xl hover:scale-105 transition-all gap-3 text-lg shrink-0 border border-accent/20">
                <Plus className="w-6 h-6" />
                새 모임 개설하기
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl bg-white border-none rounded-[2.5rem] p-0 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
              <DialogHeader className="bg-primary p-10 shrink-0">
                <DialogTitle className="text-3xl font-black text-accent flex items-center gap-3">
                  <Sparkles className="w-8 h-8" />
                  신규 모임 개설 신청
                </DialogTitle>
                <p className="text-accent/60 text-sm font-bold mt-2">전문가들과 나눌 지혜의 회차와 일정을 설정해 보세요.</p>
              </DialogHeader>
              
              <div className="flex-1 overflow-y-auto p-10">
                <form onSubmit={handleCreateGathering} className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-primary/40 uppercase ml-1">대표 이미지</label>
                        <div 
                          onClick={() => fileInputRef.current?.click()}
                          className="relative aspect-video bg-primary/5 rounded-2xl border-2 border-dashed border-primary/10 flex flex-col items-center justify-center cursor-pointer overflow-hidden group hover:border-accent"
                        >
                          {imageUrl ? (
                            <img src={imageUrl} className="w-full h-full object-cover" alt="gathering preview" />
                          ) : (
                            <>
                              <Camera className="w-10 h-10 text-primary/20 mb-2" />
                              <p className="text-[10px] text-primary/30 font-black">사진 등록</p>
                            </>
                          )}
                        </div>
                        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageChange} />
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-primary/40 uppercase ml-1">카테고리</label>
                        <Select value={category} onValueChange={setCategory}>
                          <SelectTrigger className="h-12 bg-primary/5 border-none rounded-xl font-bold"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {GATHERING_CATEGORIES.filter(c => c !== "전체").map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-primary/40 uppercase ml-1">모임 제목</label>
                        <Input value={title} onChange={e => setTitle(e.target.value)} required placeholder="예: [COP] 인사 데이터 분석 6주 완성" className="h-12 bg-primary/5 border-none rounded-xl font-bold" />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-primary/40 uppercase ml-1">모집 정원 (명)</label>
                          <Input type="number" value={capacity} onChange={e => setCapacity(e.target.value)} required className="h-12 bg-primary/5 border-none rounded-xl font-bold" />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-primary/40 uppercase ml-1">총 진행 회차 (회)</label>
                          <Input type="number" value={sessionCount} onChange={e => setSessionCount(e.target.value)} required placeholder="예: 6" className="h-12 bg-primary/5 border-none rounded-xl font-bold" />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-primary/40 uppercase ml-1">진행 일정 및 상세 시간</label>
                        <Input value={schedule} onChange={e => setSchedule(e.target.value)} required placeholder="예: 매월 셋째주 수요일 오후 7시" className="h-12 bg-primary/5 border-none rounded-xl font-bold" />
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-primary/40 uppercase ml-1">진행 방식 및 장소</label>
                        <div className="flex gap-2">
                          <Select value={type} onValueChange={(v: any) => setType(v)}>
                            <SelectTrigger className="h-12 bg-primary/5 border-none rounded-xl font-bold w-32"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="online">온라인</SelectItem>
                              <SelectItem value="offline">오프라인</SelectItem>
                            </SelectContent>
                          </Select>
                          <Input value={location} onChange={e => setLocation(e.target.value)} required={type === "offline"} disabled={type === "online"} placeholder={type === "online" ? "온라인 모임입니다." : "예: 강남역 인근 카페"} className="h-12 bg-primary/5 border-none rounded-xl font-bold flex-1" />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-primary/40 uppercase ml-1">모임 소개 및 회차별 커리큘럼</label>
                    <Textarea value={description} onChange={e => setDescription(e.target.value)} required placeholder="모임의 목적, 각 회차별 주제, 진행 방식 등을 상세히 작성해 주세요." className="min-h-[150px] bg-primary/5 border-none rounded-2xl p-6 text-sm font-medium" />
                  </div>

                  <Button type="submit" disabled={isSubmitting} className="w-full h-16 bg-primary text-accent font-black rounded-2xl shadow-xl text-lg hover:scale-[1.02] transition-all">
                    {isSubmitting ? "모임 생성 중..." : "전문가 모임 개설 완료"}
                  </Button>
                </form>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="flex flex-wrap gap-2 mb-12">
          {GATHERING_CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={cn(
                "px-6 py-3 rounded-full text-xs font-black transition-all border-2",
                selectedCategory === cat 
                  ? "bg-primary text-accent border-primary shadow-lg" 
                  : "bg-white text-primary/30 border-primary/5 hover:border-accent/30 hover:text-primary"
              )}
            >
              {cat}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-40"><Sparkles className="w-16 h-16 animate-spin text-accent" /></div>
        ) : filteredGatherings.length === 0 ? (
          <div className="py-40 text-center bg-white rounded-[2.5rem] border border-dashed border-primary/5">
            <Users className="w-16 h-16 text-primary/10 mx-auto mb-4" />
            <p className="text-xl font-black text-primary/20">아직 개설된 모임이 없습니다.</p>
            <p className="text-sm font-bold text-primary/10 mt-2">첫 번째 집단지성 모임의 호스트가 되어보세요!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {filteredGatherings.map((g) => (
              <Card key={g.id} className="group bg-white border-primary/5 rounded-[2.5rem] overflow-hidden shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 flex flex-col h-full">
                <div className="relative h-56 w-full overflow-hidden">
                  <Image src={g.imageUrl || "https://images.unsplash.com/photo-1522071820081-009f0129c71c"} alt={g.title} fill className="object-cover transition-transform duration-1000 group-hover:scale-110" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                  <div className="absolute top-5 left-5 flex gap-2">
                    <Badge className="bg-accent text-primary font-black border-none px-3 py-1 rounded-full text-[10px]">#{g.category}</Badge>
                    <Badge className="bg-white/20 backdrop-blur-md text-white font-black border-none px-3 py-1 rounded-full text-[10px]">
                      {g.type === "online" ? <Globe className="w-3 h-3 mr-1 inline" /> : <MapPin className="w-3 h-3 mr-1 inline" />}
                      {g.type === "online" ? "온라인" : "오프라인"}
                    </Badge>
                  </div>
                  <div className="absolute bottom-5 left-5">
                    <span className="text-[10px] font-black text-white/80 uppercase tracking-widest bg-primary/40 px-2 py-1 rounded">Total {g.sessionCount} Sessions</span>
                  </div>
                </div>

                <CardContent className="p-8 flex-1 flex flex-col">
                  <div className="space-y-4 mb-8">
                    <h3 className="text-xl font-black text-primary group-hover:text-accent transition-colors line-clamp-2 min-h-[3.5rem] leading-tight">
                      {g.title}
                    </h3>
                    <p className="text-sm font-medium text-primary/40 line-clamp-3 leading-relaxed">
                      {g.description}
                    </p>
                  </div>

                  <div className="space-y-4 py-6 border-y border-primary/5 mb-8">
                    <div className="flex items-center justify-between text-xs font-black">
                      <span className="text-primary/30 flex items-center gap-2"><Calendar className="w-4 h-4" /> 일정</span>
                      <span className="text-primary/70">{g.schedule}</span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs font-black">
                        <span className="text-primary/30 flex items-center gap-2"><Users className="w-4 h-4" /> 모집 현황</span>
                        <span className="text-accent">{g.participantCount} / {g.capacity} 명</span>
                      </div>
                      <Progress value={(g.participantCount / g.capacity) * 100} className="h-1.5 bg-primary/5" />
                    </div>
                  </div>

                  <div className="mt-auto pt-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-primary/5 flex items-center justify-center text-[10px] font-black text-primary/40">
                        {g.creatorName.substring(0, 1)}
                      </div>
                      <span className="text-[11px] font-black text-primary/40">@{g.creatorName}</span>
                    </div>
                    <Button 
                      onClick={() => router.push(`/gatherings/${g.id}`)}
                      className="h-11 px-6 rounded-xl bg-primary text-accent hover:bg-primary/90 font-black transition-all gap-2 text-xs border border-accent/20"
                    >
                      상세 정보 및 신청 <ChevronRight className="w-4 h-4" />
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
