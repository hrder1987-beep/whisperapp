
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
import { Plus, Search, Sparkles, Image as ImageIcon } from "lucide-react"
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
    const file = e.target.files?.[0]; if (file) { const reader = new FileReader(); reader.onloadend = () => setImageUrl(reader.result as string); reader.readAsDataURL(file); }
  }

  const handleCreateGathering = async (e: React.FormEvent) => {
    e.preventDefault(); 
    if (!user) { router.push("/auth?mode=login"); return; }
    
    setIsSubmitting(true)
    try {
      await addDocumentNonBlocking(collection(db, "gatherings"), {
        title, description, tags: [category], creatorId: user.uid, creatorName: user.displayName || "익명전문가", 
        type, location: type === "online" ? "온라인(상세 링크)" : location, schedule,
        capacity: parseInt(capacity), participantCount: 0, status: "recruiting", category, 
        imageUrl: imageUrl || `https://picsum.photos/seed/${Date.now()}/800/400`, createdAt: Date.now(), 
        sessionCount: 1, resources: []
      })
      toast({ title: "모임 개설 완료" }); setIsDialogOpen(false);
      setTitle(""); setDescription(""); setLocation(""); setSchedule(""); setImageUrl(null);
    } catch (error) { toast({ title: "오류 발생", variant: "destructive" }) }
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
            
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="naver-button h-14 px-10 rounded-xl shadow-xl gap-3 text-base text-[#163300]"><Plus className="w-5 h-5" /> 신규 모임 만들기</Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl bg-white border-none rounded-[2rem] p-0 shadow-3xl overflow-hidden max-h-[90vh] flex flex-col">
                <DialogHeader className="bg-primary/5 p-8 border-b border-primary/10">
                  <DialogTitle className="text-2xl font-black text-[#163300] text-left">새로운 지식 모임 개설</DialogTitle>
                </DialogHeader>
                <div className="flex-1 overflow-y-auto p-8 md:p-10">
                  <form onSubmit={handleCreateGathering} className="space-y-8">
                    <div className="space-y-4">
                      <label className="text-sm font-black text-[#163300]">대표 이미지</label>
                      <div onClick={() => fileInputRef.current?.click()} className="relative aspect-video bg-[#F5F6F7] border-2 border-dashed border-primary/20 rounded-2xl flex items-center justify-center cursor-pointer group hover:border-primary overflow-hidden transition-all shadow-inner">
                        {imageUrl ? <img src={imageUrl} className="w-full h-full object-cover" alt="preview" /> : <div className="text-center"><ImageIcon className="w-10 h-10 text-[#163300]/10 mb-2 mx-auto group-hover:text-primary" /><p className="text-xs font-bold text-[#163300]/20">권장: 16:9 비율 이미지</p></div>}
                      </div>
                      <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageChange} />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-sm font-black text-[#163300]">모임 제목</label>
                        <Input value={title} onChange={e => setTitle(e.target.value)} required placeholder="과정명을 입력하세요" className="h-12 bg-[#F5F6F7] border-none rounded-xl font-bold px-6" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-black text-[#163300]">카테고리</label>
                        <Select onValueChange={setCategory} defaultValue={category}>
                          <SelectTrigger className="h-12 bg-[#F5F6F7] border-none rounded-xl font-bold px-6"><SelectValue /></SelectTrigger>
                          <SelectContent className="rounded-xl">{GATHERING_CATEGORIES.filter(c => c !== "전체").map(c => <SelectItem key={c} value={c} className="font-bold">{c}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-sm font-black text-[#163300]">모임 방식</label>
                        <Select onValueChange={(v:any) => setType(v)} defaultValue={type}>
                          <SelectTrigger className="h-12 bg-[#F5F6F7] border-none rounded-xl font-bold px-6"><SelectValue /></SelectTrigger>
                          <SelectContent className="rounded-xl">
                            <SelectItem value="online" className="font-bold">온라인 모임</SelectItem>
                            <SelectItem value="offline" className="font-bold">오프라인 모임</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-black text-[#163300]">모집 정원 (명)</label>
                        <Input type="number" value={capacity} onChange={e => setCapacity(e.target.value)} required className="h-12 bg-[#F5F6F7] border-none rounded-xl font-bold px-6" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-black text-[#163300]">상세 일정</label>
                      <Input value={schedule} onChange={e => setSchedule(e.target.value)} required placeholder="예: 2025.03.01 매주 토요일 오후 2시" className="h-12 bg-[#F5F6F7] border-none rounded-xl font-bold px-6" />
                    </div>
                    {type === "offline" && (
                      <div className="space-y-2">
                        <label className="text-sm font-black text-[#163300]">모임 장소</label>
                        <Input value={location} onChange={e => setLocation(e.target.value)} required placeholder="상세 주소를 입력하세요" className="h-12 bg-[#F5F6F7] border-none rounded-xl font-bold px-6" />
                      </div>
                    )}
                    <div className="space-y-2">
                      <label className="text-sm font-black text-[#163300]">상세 설명</label>
                      <Textarea value={description} onChange={e => setDescription(e.target.value)} required placeholder="모임의 목적, 커리큘럼 등을 작성해 주세요." className="min-h-[150px] bg-[#F5F6F7] border-none rounded-2xl p-6 font-medium text-sm leading-relaxed resize-none shadow-inner" />
                    </div>
                    <Button type="submit" disabled={isSubmitting} className="w-full h-16 naver-button text-lg rounded-2xl shadow-2xl mt-4 text-[#163300] font-black">{isSubmitting ? "생성 중..." : "모임 개설 완료"}</Button>
                  </form>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="flex flex-col gap-6">
            <div className="relative group">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-black/20" />
              <Input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="주제나 키워드를 입력해 보세요" className="h-16 pl-16 pr-8 bg-white border-2 border-primary rounded-2xl shadow-lg text-lg font-black focus-visible:ring-0" />
            </div>
            <div className="flex flex-nowrap overflow-x-auto scrollbar-hide gap-2 md:gap-3 py-2">
              {GATHERING_CATEGORIES.map((cat) => (
                <button key={cat} onClick={() => setSelectedCategory(cat)} className={cn("px-8 py-3.5 rounded-full text-sm font-black transition-all border-2 whitespace-nowrap shrink-0", selectedCategory === cat ? "bg-primary text-[#163300] border-primary shadow-lg" : "bg-white text-black/60 border-black/5 hover:border-primary/30")}>{cat}</button>
              ))}
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
                    <span className="text-[12px] font-black text-primary">{g.participantCount} / {g.capacity} 명</span>
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
