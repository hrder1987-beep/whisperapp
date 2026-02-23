
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
import { Plus, Users, Calendar, MapPin, Search, Camera, Globe, ChevronRight, Clock, Sparkles } from "lucide-react"
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
    <div className="min-h-screen bg-[#F8F9FA]">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 py-8 md:py-12">
        <div className="flex flex-col gap-8 mb-12">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-1">
              <h1 className="text-3xl font-black text-primary tracking-tight">모임 개설</h1>
              <p className="text-sm font-medium text-primary/40">함께 공부하고 성장할 HR 전문가들을 모집하세요.</p>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-primary text-accent hover:bg-primary/95 font-black h-11 px-6 rounded-xl shadow-lg transition-all gap-2 text-xs border border-accent/20">
                  <Plus className="w-4 h-4" />
                  새 모임 만들기
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl bg-white border-none rounded-[2rem] p-0 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
                <DialogHeader className="bg-primary p-8 shrink-0">
                  <DialogTitle className="text-2xl font-black text-accent">신규 모임 개설</DialogTitle>
                  <p className="text-accent/60 text-xs font-bold mt-1">전문가들과 나눌 지혜의 회차와 일정을 설정해 보세요.</p>
                </DialogHeader>
                <div className="flex-1 overflow-y-auto p-10">
                  <form onSubmit={handleCreateGathering} className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-6">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-primary/40 uppercase ml-1">대표 이미지</label>
                          <div onClick={() => fileInputRef.current?.click()} className="relative aspect-video bg-primary/5 rounded-xl border-2 border-dashed border-primary/10 flex flex-col items-center justify-center cursor-pointer overflow-hidden group hover:border-accent">
                            {imageUrl ? <img src={imageUrl} className="w-full h-full object-cover" alt="preview" /> : <Camera className="w-8 h-8 text-primary/20" />}
                          </div>
                          <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageChange} />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-primary/40 uppercase ml-1">카테고리</label>
                          <Select value={category} onValueChange={setCategory}>
                            <SelectTrigger className="h-11 bg-primary/5 border-none rounded-xl"><SelectValue /></SelectTrigger>
                            <SelectContent>{GATHERING_CATEGORIES.filter(c => c !== "전체").map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="space-y-6">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-primary/40 uppercase ml-1">모임 제목</label>
                          <Input value={title} onChange={e => setTitle(e.target.value)} required placeholder="모임 제목" className="h-11 bg-primary/5 border-none rounded-xl font-bold" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-[10px] font-black text-primary/40 uppercase ml-1">정원(명)</label>
                            <Input type="number" value={capacity} onChange={e => setCapacity(e.target.value)} required className="h-11 bg-primary/5 border-none rounded-xl" />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-black text-primary/40 uppercase ml-1">회차(회)</label>
                            <Input type="number" value={sessionCount} onChange={e => setSessionCount(e.target.value)} required className="h-11 bg-primary/5 border-none rounded-xl" />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-primary/40 uppercase ml-1">상세 일정</label>
                          <Input value={schedule} onChange={e => setSchedule(e.target.value)} required placeholder="예: 매주 목요일 오후 7시" className="h-11 bg-primary/5 border-none rounded-xl" />
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-primary/40 uppercase ml-1">모임 상세 소개</label>
                      <Textarea value={description} onChange={e => setDescription(e.target.value)} required placeholder="커리큘럼 및 진행 방식을 적어주세요." className="min-h-[120px] bg-primary/5 border-none rounded-xl p-5 text-sm" />
                    </div>
                    <Button type="submit" disabled={isSubmitting} className="w-full h-14 bg-primary text-accent font-black rounded-xl shadow-xl text-lg">
                      {isSubmitting ? "생성 중..." : "모임 개설 완료"}
                    </Button>
                  </form>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="relative max-w-2xl group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary/20 group-focus-within:text-accent transition-colors" />
            <Input 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="관심 있는 주제의 모임을 검색해 보세요" 
              className="h-12 pl-12 pr-6 bg-white border-none rounded-xl shadow-sm focus-visible:ring-accent/50 text-sm font-bold placeholder:text-primary/20"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-12">
          {GATHERING_CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={cn(
                "px-5 py-2.5 rounded-xl text-xs font-black transition-all border-2",
                selectedCategory === cat 
                  ? "bg-primary text-accent border-primary shadow-md" 
                  : "bg-white text-primary/30 border-primary/5 hover:border-accent/30 hover:text-primary"
              )}
            >
              {cat}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-40"><Sparkles className="w-12 h-12 animate-spin text-accent" /></div>
        ) : filteredGatherings.length === 0 ? (
          <div className="py-40 text-center bg-white rounded-2xl border border-dashed border-primary/5">
            <p className="text-primary/20 font-black">아직 개설된 모임이 없습니다.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredGatherings.map((g) => (
              <Card key={g.id} className="group bg-white border-primary/5 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 flex flex-col">
                <div className="relative h-48 w-full overflow-hidden">
                  <Image src={g.imageUrl || "https://images.unsplash.com/photo-1522071820081-009f0129c71c"} alt={g.title} fill className="object-cover transition-transform duration-1000 group-hover:scale-110" />
                  <div className="absolute top-4 left-4 flex gap-2">
                    <Badge className="bg-accent text-primary font-black border-none px-2 py-0.5 rounded-sm text-[9px]">#{g.category}</Badge>
                  </div>
                </div>
                <CardContent className="p-6 flex-1 flex flex-col">
                  <div className="space-y-3 mb-6">
                    <h3 className="text-lg font-black text-primary group-hover:text-accent transition-colors line-clamp-1">{g.title}</h3>
                    <p className="text-xs font-medium text-primary/40 line-clamp-2 leading-relaxed">{g.description}</p>
                  </div>
                  <div className="space-y-3 py-4 border-y border-primary/5 mb-6">
                    <div className="flex items-center justify-between text-[10px] font-black">
                      <span className="text-primary/30 flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> 일정</span>
                      <span className="text-primary/70">{g.schedule}</span>
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[10px] font-black">
                        <span className="text-primary/30 flex items-center gap-1.5"><Users className="w-3.5 h-3.5" /> 모집 현황</span>
                        <span className="text-accent">{g.participantCount} / {g.capacity} 명</span>
                      </div>
                      <Progress value={(g.participantCount / g.capacity) * 100} className="h-1 bg-primary/5" />
                    </div>
                  </div>
                  <div className="mt-auto flex items-center justify-between">
                    <span className="text-[10px] font-black text-primary/30">@{g.creatorName}</span>
                    <Button onClick={() => router.push(`/gatherings/${g.id}`)} className="h-9 px-4 rounded-lg bg-primary text-accent hover:bg-primary/90 font-black transition-all gap-1.5 text-[11px] border border-accent/20">
                      상세 정보 <ChevronRight className="w-3.5 h-3.5" />
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
