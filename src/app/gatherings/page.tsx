
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
import { useUser, useFirestore, useCollection, useDoc, useMemoFirebase, addDocumentNonBlocking } from "@/firebase"
import { collection, query, orderBy, doc } from "firebase/firestore"
import { Gathering, GatheringQuestion, SiteBranding } from "@/lib/types"
import { Plus, Calendar as CalendarIcon, Search, Clock, MapPin, Globe, Image as ImageIcon, Video, FileText, Type, Sparkles, X, ListPlus, Trash2 } from "lucide-react"
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
  const detailImageInputRef = useRef<HTMLInputElement>(null)

  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("전체")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Form States
  const [title, setTitle] = useState("")
  const [summary, setSummary] = useState("")
  const [tagInput, setTagInput] = useState("")
  const [description, setDescription] = useState("")
  const [type, setType] = useState<"online" | "offline">("online")
  const [location, setLocation] = useState("")
  const [startDateStr, setStartDateStr] = useState("")
  const [endDateStr, setEndDateStr] = useState("")
  const [startTime, setStartTime] = useState("14:00")
  const [endTime, setEndTime] = useState("16:00")
  const [capacity, setCapacity] = useState("10")
  const [sessionCount, setSessionCount] = useState("6")
  const [category, setCategory] = useState("COP/학습")
  const [questions, setQuestions] = useState<GatheringQuestion[]>([])
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [detailImages, setDetailImages] = useState<string[]>([])

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
    e.preventDefault(); if (!user) { router.push("/auth?mode=login"); return; }
    if (!startDateStr || !endDateStr) { toast({ title: "일정 선택 필요", variant: "destructive" }); return; }
    setIsSubmitting(true)
    try {
      const tags = tagInput.split(/[, ]+/).filter(t => t.startsWith('#')).map(t => t.replace('#', ''))
      await addDocumentNonBlocking(collection(db, "gatherings"), {
        title, summary, description, tags: tags.length > 0 ? tags : [category],
        creatorId: user.uid, creatorName: user.displayName || "익명전문가", type,
        location: type === "online" ? "온라인(상세 링크)" : location,
        schedule: `${startDateStr} ${startTime} ~ ${endDateStr} ${endTime}`,
        startDate: new Date(startDateStr).getTime(), endDate: new Date(endDateStr).getTime(),
        capacity: parseInt(capacity), sessionCount: parseInt(sessionCount), participantCount: 0,
        status: "recruiting", category, questions, imageUrl: imageUrl || `https://picsum.photos/seed/${Date.now()}/800/400`,
        createdAt: Date.now(), resources: []
      })
      toast({ title: "모임 개설 완료" }); setIsDialogOpen(false);
    } catch (error) { toast({ title: "오류 발생", variant: "destructive" }) }
    finally { setIsSubmitting(false) }
  }

  return (
    <div className="min-h-screen bg-[#F5F6F7]">
      <Header />
      <main className="max-w-7xl mx-auto px-4 py-8 md:py-16">
        <div className="flex flex-col gap-8 mb-16">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-1">
              <h1 className="text-3xl md:text-4xl font-black text-[#1E1E23] tracking-tighter">{branding?.gatheringTitle || "모임 인텔리전스"}</h1>
              <p className="text-sm md:text-base font-bold text-[#888]">{branding?.gatheringSubtitle || "대한민국 HR 전문가들의 오프라인/온라인 동행"}</p>
            </div>
            <div className="hidden md:block">
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild><Button className="naver-button h-14 px-10 rounded-xl shadow-xl gap-3 text-base text-accent"><Plus className="w-5 h-5" /> 신규 모임 만들기</Button></DialogTrigger>
                <DialogContent className="max-w-4xl bg-white border-none rounded-none p-0 shadow-2xl overflow-hidden max-h-[95vh] flex flex-col">
                  <DialogHeader className="bg-white border-b border-black/5 p-8 shrink-0 text-left"><DialogTitle className="text-2xl font-black text-accent">새로운 지식 모임 개설</DialogTitle></DialogHeader>
                  <div className="flex-1 overflow-y-auto"><form onSubmit={handleCreateGathering} className="p-8 md:p-12 space-y-12 pb-32">
                    <div className="space-y-4"><label className="text-sm font-black text-[#1E1E23]">모임 제목</label><Input value={title} onChange={e => setTitle(e.target.value.slice(0, 50))} required className="h-14 bg-white border-black/10 rounded-xl font-black text-lg" /></div>
                    <Button type="submit" disabled={isSubmitting} className="w-full h-14 naver-button text-lg shadow-2xl rounded-xl">모임 개설 완료하기</Button>
                  </form></div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
          <div className="flex flex-col gap-6">
            <div className="relative group">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-black/20" />
              <Input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="관심 있는 모임 주제나 키워드를 입력해 보세요" className="h-16 pl-16 pr-8 bg-white border-2 border-primary rounded-2xl shadow-lg focus-visible:ring-0 text-lg font-black" />
            </div>
            <div className="flex flex-wrap gap-2 md:gap-3 py-2">
              {GATHERING_CATEGORIES.map((cat) => (
                <button key={cat} onClick={() => setSelectedCategory(cat)} className={cn("px-8 py-3.5 rounded-full text-sm font-black transition-all border-2 whitespace-nowrap", selectedCategory === cat ? "bg-primary text-accent border-primary shadow-lg" : "bg-white text-black/60 border-black/5 hover:border-primary/30")}>{cat}</button>
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
