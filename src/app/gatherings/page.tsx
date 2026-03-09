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
import { useUser, useFirestore, useCollection, useDoc, useMemoFirebase, addDocumentNonBlocking } from "@/firebase"
import { collection, query, orderBy, doc } from "firebase/firestore"
import { Gathering, SiteBranding } from "@/lib/types"
import { Plus, Search, Sparkles, Image as ImageIcon, Users, MapPin, Calendar, Camera } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { MOCK_GATHERINGS } from "@/lib/mock-gatherings"

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
  const [category, setCategory] = useState("COP/학습")
  const [imageUrl, setImageUrl] = useState<string | null>(null)

  const configDocRef = useMemoFirebase(() => db ? doc(db, "admin_configuration", "site_settings") : null, [db])
  const { data: config } = useDoc<any>(configDocRef)
  const branding = useMemo(() => {
    if (config?.brandingSettings) { try { return JSON.parse(config.brandingSettings) as SiteBranding } catch (e) { return null } }
    return null;
  }, [config]);

  const gatheringsQuery = useMemoFirebase(() => db ? query(collection(db, "gatherings"), orderBy("createdAt", "desc")) : null, [db])
  const { data: gatheringsData, isLoading } = useCollection<Gathering>(gatheringsQuery)

  const gatherings = useMemo(() => {
    const merged = [...(gatheringsData || [])];
    const existingIds = new Set(merged.map(g => g.id));
    MOCK_GATHERINGS.forEach(mg => { if (!existingIds.has(mg.id)) merged.push(mg) });
    return merged.sort((a, b) => b.createdAt - a.createdAt);
  }, [gatheringsData])

  const filteredGatherings = useMemo(() => {
    return gatherings.filter(g => {
      const matchesSearch = g.title.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesCategory = selectedCategory === "전체" || g.category === selectedCategory
      return matchesSearch && matchesCategory
    })
  }, [gatherings, searchQuery, selectedCategory])

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; 
    if (file) { 
      const reader = new FileReader(); 
      reader.onloadend = () => setImageUrl(reader.result as string); 
      reader.readAsDataURL(file); 
    }
  }

  const handleOpenDialog = (open: boolean) => {
    if (open && !user) {
      toast({ title: "로그인 필요", description: "모임을 개설하려면 로그인이 필요합니다.", variant: "destructive" })
      router.push("/auth?mode=login")
      return
    }
    setIsDialogOpen(open)
  }

  const handleCreateGathering = async (e: React.FormEvent) => {
    e.preventDefault(); 
    if (!user || !db) return;
    
    setIsSubmitting(true)
    try {
      const now = Date.now();
      await addDocumentNonBlocking(collection(db, "gatherings"), {
        title, 
        description, 
        summary: description.substring(0, 100),
        tags: [category], 
        creatorId: user.uid, 
        creatorName: user.displayName || "익명전문가", 
        type, 
        location: type === "online" ? "온라인(상세 링크)" : location, 
        schedule,
        startDate: now,
        endDate: now + (30 * 24 * 60 * 60 * 1000), 
        capacity: parseInt(capacity) || 10, 
        participantCount: 0, 
        status: "recruiting", 
        category, 
        imageUrl: imageUrl || `https://picsum.photos/seed/${now}/800/400`, 
        createdAt: now, 
        sessionCount: 1, 
        resources: []
      })
      toast({ title: "모임 개설 완료", description: "새로운 전문가 모임이 생성되었습니다." }); 
      setIsDialogOpen(false);
      setTitle(""); setDescription(""); setLocation(""); setSchedule(""); setImageUrl(null);
    } catch (error) { toast({ title: "오류 발생", description: "모임 생성 중 문제가 발생했습니다.", variant: "destructive" }) }
    finally { setIsSubmitting(false) }
  }

  return (
    <div className="min-h-screen bg-[#F5F6F7]">
      <Header />
      <main className="max-w-7xl mx-auto px-4 py-8 md:py-16 pb-24">
        <div className="flex flex-col gap-8 mb-16">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-1">
              <h1 className="text-3xl md:text-4xl font-black text-[#1E1E23] tracking-tighter">{branding?.gatheringTitle || "모임 인텔리전스"}</h1>
              <p className="text-sm md:text-base font-bold text-[#888]">{branding?.gatheringSubtitle || "대한민국 HR 전문가들의 오프라인/온라인 동행"}</p>
            </div>
            
            <div className="hidden md:block">
              <Dialog open={isDialogOpen} onOpenChange={handleOpenDialog}>
                <DialogTrigger asChild>
                  <Button className="naver-button h-14 px-10 rounded-xl shadow-xl gap-3 text-base text-white"><Plus className="w-5 h-5" /> 신규 모임 만들기</Button>
                </DialogTrigger>
                <DialogContent className="max-w-3xl bg-white border-none rounded-[2rem] p-0 shadow-3xl overflow-hidden max-h-[90vh] flex flex-col">
                  <DialogHeader className="bg-primary/5 p-8 border-b border-primary/10">
                    <DialogTitle className="text-2xl font-black text-accent text-left">새로운 지식 모임 개설</DialogTitle>
                  </DialogHeader>
                  <div className="flex-1 overflow-y-auto p-8 md:p-10">
                    <form onSubmit={handleCreateGathering} className="space-y-8">
                      <div className="space-y-6">
                        <div className="space-y-2">
                          <label className="text-xs font-black text-accent/40 uppercase tracking-widest ml-1">모임 주제 (제목)</label>
                          <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="예: HR 데이터 리터러시 실전 프로젝트 1기" className="h-14 bg-accent/5 border-none rounded-2xl font-black text-lg shadow-inner" required />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <label className="text-xs font-black text-accent/40 uppercase tracking-widest ml-1">모임 성격</label>
                            <Select value={category} onValueChange={setCategory}>
                              <SelectTrigger className="h-14 bg-accent/5 border-none rounded-2xl font-bold">
                                <SelectValue placeholder="카테고리 선택" />
                              </SelectTrigger>
                              <SelectContent className="rounded-2xl shadow-3xl border-none">
                                {GATHERING_CATEGORIES.filter(c => c !== "전체").map(cat => (
                                  <SelectItem key={cat} value={cat} className="rounded-xl py-3 font-bold">{cat}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <label className="text-xs font-black text-accent/40 uppercase tracking-widest ml-1">모집 정원 (명)</label>
                            <Input type="number" value={capacity} onChange={e => setCapacity(e.target.value)} className="h-14 bg-accent/5 border-none rounded-2xl font-bold shadow-inner" required />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className="text-xs font-black text-accent/40 uppercase tracking-widest ml-1">모임 상세 소개</label>
                          <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="모임의 목적, 커리큘럼, 참여 혜택 등을 상세히 적어주세요." className="min-h-[150px] bg-accent/5 border-none rounded-2xl p-6 font-medium shadow-inner resize-none" required />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <label className="text-xs font-black text-accent/40 uppercase tracking-widest ml-1">진행 방식</label>
                            <div className="flex gap-2">
                              <Button type="button" onClick={() => setType('online')} variant={type === 'online' ? 'default' : 'outline'} className={cn("flex-1 h-14 rounded-2xl font-black", type === 'online' ? "bg-accent text-white" : "border-accent/10")}>온라인</Button>
                              <Button type="button" onClick={() => setType('offline')} variant={type === 'offline' ? 'default' : 'outline'} className={cn("flex-1 h-14 rounded-2xl font-black", type === 'offline' ? "bg-accent text-white" : "border-accent/10")}>오프라인</Button>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <label className="text-xs font-black text-accent/40 uppercase tracking-widest ml-1">장소 및 상세 일정</label>
                            <Input value={schedule} onChange={e => setSchedule(e.target.value)} placeholder="예: 매주 목요일 저녁 7시 / 강남역 인근" className="h-14 bg-accent/5 border-none rounded-2xl font-bold shadow-inner" required />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className="text-xs font-black text-accent/40 uppercase tracking-widest ml-1">대표 이미지 (선택)</label>
                          <div onClick={() => fileInputRef.current?.click()} className="relative aspect-[2/1] bg-accent/5 rounded-2xl border-2 border-dashed border-accent/10 flex flex-col items-center justify-center cursor-pointer overflow-hidden group">
                            {imageUrl ? <img src={imageUrl} alt="preview" className="w-full h-full object-cover" /> : <Camera className="w-10 h-10 text-accent/10 group-hover:text-primary transition-colors" />}
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all text-white text-xs font-black">이미지 변경하기</div>
                          </div>
                          <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageChange} />
                        </div>
                      </div>
                      <Button type="submit" disabled={isSubmitting} className="w-full h-16 naver-button text-lg rounded-2xl shadow-2xl mt-4 text-white font-black">{isSubmitting ? "생성 중..." : "모임 개설 완료"}</Button>
                    </form>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <div className="relative group">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-black/20 z-10" />
              <Input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="주제나 키워드를 입력해 보세요" className="h-16 pl-16 pr-8 bg-white border-2 border-primary rounded-2xl shadow-lg text-lg font-black focus-visible:ring-0" />
            </div>
            
            <div className="hidden md:flex flex-nowrap overflow-x-auto scrollbar-hide gap-2 md:gap-3 py-2">
              {GATHERING_CATEGORIES.map((cat) => (
                <button key={cat} onClick={() => setSelectedCategory(cat)} className={cn("px-8 py-3.5 rounded-full text-sm font-black transition-all border-2 whitespace-nowrap shrink-0", selectedCategory === cat ? "bg-primary text-accent border-primary shadow-lg" : "bg-white text-black/60 border-black/5 hover:border-primary/30")}>{cat}</button>
              ))}
            </div>

            <div className="md:hidden">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-full h-14 bg-white border-2 border-black/5 rounded-2xl font-black text-accent px-6">
                  <div className="flex items-center gap-2">
                    <span className="text-primary">분류:</span>
                    <SelectValue />
                  </div>
                </SelectTrigger>
                <SelectContent className="rounded-2xl shadow-3xl border-none p-2">
                  {GATHERING_CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat} className="rounded-xl py-3 font-bold">{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {isLoading ? ( <div className="flex justify-center py-40"><Sparkles className="w-14 h-14 animate-spin text-primary" /></div> ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {filteredGatherings.map((g) => (
              <div key={g.id} className="group cursor-pointer flex flex-col h-full bg-white border border-black/[0.06] hover:border-primary/20 hover:shadow-2xl rounded-[2.5rem] overflow-hidden transition-all duration-500" onClick={() => router.push(`/gatherings/${g.id}`)}>
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-black/5">
                  <Image src={g.imageUrl || "https://images.unsplash.com/photo-1522071820081-009f0129c71c"} alt={g.title} fill className="object-cover transition-transform duration-1000 group-hover:scale-110" />
                </div>
                <div className="p-8 flex-1 flex flex-col">
                  <h3 className="text-xl font-black text-[#1E1E23] group-hover:text-primary transition-colors line-clamp-2 leading-tight mb-4">{g.title}</h3>
                  <div className="mt-auto flex items-center justify-between pt-6 border-t border-black/5">
                    <span className="text-[11px] font-black text-black/30">@{g.creatorName}</span>
                    <span className="text-[12px] font-black text-primary">{g.participantCount || 0} / {g.capacity || 0} 명</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
