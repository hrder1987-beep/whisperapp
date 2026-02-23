
"use client"

import { useState, useMemo, useRef } from "react"
import { Header } from "@/components/chuchot/Header"
import { Card, CardContent } from "@/components/ui/card"
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
import { Plus, Users, Calendar, Search, Camera, ChevronRight, Sparkles, Clock, MapPin, Globe } from "lucide-react"
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
  const [sessionCount, setSessionCount] = useState("6")
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
      
      toast({ title: "모임 개설 완료", description: "새로운 HR 지식 모임이 개설되었습니다!" })
      setIsDialogOpen(false)
      setTitle(""); setDescription(""); setLocation(""); setSchedule(""); setCapacity("10"); setSessionCount("6"); setImageUrl(null);
    } catch (error) {
      toast({ title: "오류 발생", description: "모임 개설 중 문제가 발생했습니다.", variant: "destructive" })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F5F6F7]">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 py-8 md:py-16">
        {/* Portal Header */}
        <div className="flex flex-col gap-10 mb-16">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
            <div className="space-y-3">
              <h1 className="text-3xl md:text-4xl font-black text-[#1E1E23] tracking-tighter">모임 인텔리전스</h1>
              <p className="text-sm md:text-base font-bold text-[#888]">대한민국 HR 전문가들의 오프라인/온라인 동행</p>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-[#03C75A] text-white hover:brightness-95 font-black h-12 md:h-14 px-8 rounded-none shadow-md transition-all gap-2 text-sm">
                  <Plus className="w-5 h-5" />
                  새로운 모임 만들기
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl bg-white border-none rounded-none p-0 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
                <DialogHeader className="bg-[#1E1E23] p-8 shrink-0">
                  <DialogTitle className="text-2xl font-black text-[#03C75A]">신규 모임 개설</DialogTitle>
                  <p className="text-white/60 text-xs font-bold mt-1 uppercase tracking-widest">Create Your Professional Gathering</p>
                </DialogHeader>
                <div className="flex-1 overflow-y-auto p-8 md:p-12">
                  <form onSubmit={handleCreateGathering} className="space-y-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                      <div className="space-y-6">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-[#1E1E23]/40 uppercase tracking-widest ml-1">대표 이미지 (Banner)</label>
                          <div onClick={() => fileInputRef.current?.click()} className="relative aspect-video bg-[#F5F6F7] border border-black/5 flex flex-col items-center justify-center cursor-pointer overflow-hidden group hover:border-[#03C75A] transition-colors">
                            {imageUrl ? <img src={imageUrl} className="w-full h-full object-cover" alt="preview" /> : <Camera className="w-8 h-8 text-black/10 group-hover:text-[#03C75A]" />}
                          </div>
                          <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageChange} />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-[#1E1E23]/40 uppercase tracking-widest ml-1">모임 카테고리</label>
                          <Select value={category} onValueChange={setCategory}>
                            <SelectTrigger className="h-12 bg-[#F5F6F7] border-none rounded-none font-bold"><SelectValue /></SelectTrigger>
                            <SelectContent>{GATHERING_CATEGORIES.filter(c => c !== "전체").map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="space-y-6">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-[#1E1E23]/40 uppercase tracking-widest ml-1">모임 제목</label>
                          <Input value={title} onChange={e => setTitle(e.target.value)} required placeholder="어떤 주제로 모이나요?" className="h-12 bg-[#F5F6F7] border-none rounded-none font-black text-lg focus-visible:ring-0" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-[10px] font-black text-[#1E1E23]/40 uppercase tracking-widest ml-1">모집 정원(명)</label>
                            <Input type="number" value={capacity} onChange={e => setCapacity(e.target.value)} required className="h-12 bg-[#F5F6F7] border-none rounded-none font-bold" />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-black text-[#1E1E23]/40 uppercase tracking-widest ml-1">전체 회차(회)</label>
                            <Input type="number" value={sessionCount} onChange={e => setSessionCount(e.target.value)} required className="h-12 bg-[#F5F6F7] border-none rounded-none font-bold" />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-[#1E1E23]/40 uppercase tracking-widest ml-1">상세 일정</label>
                          <Input value={schedule} onChange={e => setSchedule(e.target.value)} required placeholder="예: 2024.06.01 시작, 매주 목요일" className="h-12 bg-[#F5F6F7] border-none rounded-none font-bold" />
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-[#1E1E23]/40 uppercase tracking-widest ml-1">커리큘럼 및 모임 소개</label>
                      <Textarea value={description} onChange={e => setDescription(e.target.value)} required placeholder="전문가들과 나눌 지혜의 상세 내용을 적어주세요." className="min-h-[180px] bg-[#F5F6F7] border-none rounded-none p-6 text-sm font-medium focus-visible:ring-0 leading-relaxed" />
                    </div>
                    <Button type="submit" disabled={isSubmitting} className="w-full h-16 bg-[#1E1E23] text-[#03C75A] font-black rounded-none shadow-xl text-xl hover:brightness-110 transition-all">
                      {isSubmitting ? "모임 정보 전송 중..." : "모임 개설 완료하기"}
                    </Button>
                  </form>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="flex flex-col md:flex-row md:items-center gap-6">
            <div className="relative flex-1 group">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-black/20 group-focus-within:text-[#03C75A] transition-colors" />
              <Input 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="모임 제목, 주제, 키워드로 검색해 보세요" 
                className="h-14 pl-14 pr-6 bg-white border-2 border-[#03C75A] rounded-none shadow-sm focus-visible:ring-0 text-base font-black placeholder:text-black/10"
              />
            </div>
            <div className="flex overflow-x-auto gap-2 scrollbar-hide py-1">
              {GATHERING_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={cn(
                    "px-6 py-3 rounded-none text-xs font-black transition-all border-2 whitespace-nowrap",
                    selectedCategory === cat 
                      ? "bg-[#1E1E23] text-[#03C75A] border-[#1E1E23] shadow-md" 
                      : "bg-white text-black/30 border-black/5 hover:border-[#03C75A]/30 hover:text-[#1E1E23]"
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Gathering Grid */}
        {isLoading ? (
          <div className="flex justify-center py-40"><Sparkles className="w-12 h-12 animate-spin text-[#03C75A]" /></div>
        ) : filteredGatherings.length === 0 ? (
          <div className="py-40 text-center bg-white border border-black/5">
            <p className="text-black/20 font-black text-xl">준비된 모임이 없습니다.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-12">
            {filteredGatherings.map((g) => {
              const isClosed = g.status === 'closed' || g.participantCount >= g.capacity;
              return (
                <div 
                  key={g.id} 
                  className="group cursor-pointer flex flex-col h-full bg-white border border-black/[0.06] hover:border-black/[0.12] transition-all duration-500"
                  onClick={() => router.push(`/gatherings/${g.id}`)}
                >
                  <div className="relative aspect-[4/3] w-full overflow-hidden bg-black/5">
                    <Image 
                      src={g.imageUrl || "https://images.unsplash.com/photo-1522071820081-009f0129c71c"} 
                      alt={g.title} 
                      fill 
                      className={cn("object-cover transition-transform duration-1000 group-hover:scale-105", isClosed && "grayscale opacity-60")} 
                    />
                    
                    <div className="absolute top-4 left-4 flex flex-col gap-2">
                      <Badge className={cn("border-none px-3 py-1 rounded-none text-[10px] font-black shadow-lg", isClosed ? "bg-black/60 text-white" : "bg-[#03C75A] text-white")}>
                        {isClosed ? "모집 마감" : "모집 중"}
                      </Badge>
                      <Badge className="bg-white/90 backdrop-blur-sm text-[#1E1E23] font-black border-none px-3 py-1 rounded-none text-[10px] shadow-md">
                        #{g.category}
                      </Badge>
                    </div>

                    <div className="absolute top-4 right-4">
                      <div className="bg-black/40 backdrop-blur-sm px-2 py-1 flex items-center gap-1.5 rounded-none border border-white/10">
                        {g.type === 'online' ? <Globe className="w-3 h-3 text-[#03C75A]" /> : <MapPin className="w-3 h-3 text-[#03C75A]" />}
                        <span className="text-[9px] font-black text-white uppercase tracking-widest">{g.type}</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 flex-1 flex flex-col">
                    <div className="space-y-3 mb-6">
                      <h3 className="text-lg font-black text-[#1E1E23] group-hover:text-[#03C75A] transition-colors line-clamp-2 leading-tight min-h-[3rem]">
                        {g.title}
                      </h3>
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-2 text-[11px] font-bold text-[#888]">
                          <Calendar className="w-3.5 h-3.5 text-[#03C75A]" />
                          <span>{g.schedule}</span>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] font-bold text-[#888]">
                          <Clock className="w-3.5 h-3.5 text-[#03C75A]" />
                          <span>총 {g.sessionCount}회차 프로젝트</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-auto space-y-4 pt-4 border-t border-black/5">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-black text-black/30 flex items-center gap-1.5 uppercase tracking-tighter">
                          Host. <span className="text-[#1E1E23]">@{g.creatorName}</span>
                        </span>
                        <span className="text-[11px] font-black text-[#03C75A]">
                          {g.participantCount} / {g.capacity} 명
                        </span>
                      </div>
                      <div className="space-y-1">
                        <Progress value={(g.participantCount / g.capacity) * 100} className="h-1 bg-black/5" />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  )
}
