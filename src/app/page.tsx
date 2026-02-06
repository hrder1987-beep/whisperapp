"use client"

import { useState, useEffect, useMemo } from "react"
import { Logo } from "@/components/chuchot/Logo"
import { MainBanner, BannerData } from "@/components/chuchot/MainBanner"
import { SubmissionForm } from "@/components/chuchot/SubmissionForm"
import { QuestionFeed } from "@/components/chuchot/QuestionFeed"
import { RankingList } from "@/components/chuchot/RankingList"
import { ShuChat } from "@/components/chuchot/ShuChat"
import { AdminCMS } from "@/components/chuchot/AdminCMS"
import { Question, Answer } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Bell, Search, User as UserIcon, Settings, Info, X, ArrowLeft, LayoutDashboard } from "lucide-react"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { generateAiReply } from "@/ai/flows/generate-ai-reply-flow"
import { cn } from "@/lib/utils"
import { useFirestore, useCollection, useDoc, useMemoFirebase } from "@/firebase"
import { collection, query, orderBy, doc, addDoc, serverTimestamp } from "firebase/firestore"

export default function HomePage() {
  const [isAdminMode, setIsAdminMode] = useState(false)
  const [isCMSActive, setIsCMSActive] = useState(false)
  const [showAdminDialog, setShowAdminDialog] = useState(false)
  const [adminPassword, setAdminPassword] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState<"all" | "popular" | "waiting">("all")
  const { toast } = useToast()
  const db = useFirestore()

  // Real-time data from Firestore
  const questionsQuery = useMemoFirebase(() => {
    if (!db) return null
    return query(collection(db, "questions"), orderBy("createdAt", "desc"))
  }, [db])
  
  const { data: questionsData } = useCollection<Question>(questionsQuery)
  const questions = useMemo(() => questionsData || [], [questionsData])

  // Answers would typically be fetched per question in the feed, but for global state:
  const [answers, setAnswers] = useState<Answer[]>([])

  const configDocRef = useMemoFirebase(() => {
    if (!db) return null
    return doc(db, "admin_configuration", "site_settings")
  }, [db])
  const { data: config } = useDoc<any>(configDocRef)

  const cmsBanners = useMemo(() => {
    if (config?.bannerSettings) {
      try {
        return JSON.parse(config.bannerSettings) as BannerData[]
      } catch (e) {
        return []
      }
    }
    return []
  }, [config])

  const isSearching = searchQuery.trim().length > 0

  const filteredQuestions = useMemo(() => {
    if (!questions) return []
    let result = [...questions]
    
    if (searchQuery.trim()) {
      const keywords = searchQuery.toLowerCase().split(/\s+/).filter(k => k.length > 0)
      result = result.filter(q => {
        const content = `${q.title} ${q.text} ${q.nickname} ${q.category || ""}`.toLowerCase()
        return keywords.every(kw => content.includes(kw))
      })
    }

    if (activeTab === "popular") result.sort((a, b) => b.viewCount - a.viewCount)
    else if (activeTab === "waiting") result = result.filter(q => q.answerCount === 0)
    // "all" is already sorted by desc createdAt from firestore query

    return result
  }, [questions, searchQuery, activeTab])

  const topQuestions = useMemo(() => {
    if (!questions) return []
    return [...questions].sort((a, b) => b.viewCount - a.viewCount).slice(0, 5)
  }, [questions])

  const handleAddQuestion = (nickname: string, title: string, text: string, imageUrl?: string, category?: string) => {
    if (!db) return

    const questionData = {
      title,
      text,
      nickname,
      imageUrl: imageUrl || null,
      category: category || null,
      viewCount: 0,
      answerCount: 0,
      createdAt: Date.now(),
    }

    addDoc(collection(db, "questions"), questionData).then((docRef) => {
      generateAiReply({ title, text }).then((res) => {
        const aiAnswer: Answer = {
          id: `ai-${Date.now()}`,
          questionId: docRef.id,
          text: res.replyText,
          nickname: "슈 (AI)",
          createdAt: Date.now(),
          avatarId: "sparkles",
        }
        setAnswers(prev => [aiAnswer, ...prev])
      })
    })
  }

  const handleAdminAuth = () => {
    if (adminPassword === "admin123") {
      setIsAdminMode(true)
      setShowAdminDialog(false)
      toast({ title: "관리자 권한 획득", description: "커뮤니티 가이드라인 및 CMS 관리가 가능합니다." })
    } else {
      toast({ title: "인증 실패", description: "관리자 암호가 올바르지 않습니다.", variant: "destructive" })
    }
    setAdminPassword("")
  }

  const handleLogoClick = () => {
    setIsCMSActive(false)
    setSearchQuery("")
    setActiveTab("all")
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <header className="sticky top-0 z-50 w-full premium-gradient border-b border-white/10 shadow-xl">
        <div className="max-w-6xl mx-auto px-4 h-20 flex items-center justify-between gap-4">
          <Logo className="flex-shrink-0" isLight onClick={handleLogoClick} />
          
          <div className="hidden md:flex flex-1 max-w-xl relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50 group-focus-within:text-accent transition-colors" />
            <Input 
              placeholder="HRD 트렌드, 과정 설계 사례, L&D 도구 검색..." 
              className="pl-11 pr-10 bg-white/10 border-none focus-visible:ring-accent/50 h-11 rounded-full text-sm text-white placeholder:text-white/40"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  toast({ title: "검색 결과 필터링", description: `'${searchQuery}' 키워드로 검색된 결과입니다.` })
                }
              }}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-white/5 rounded-full">
                <X className="w-4 h-4 text-white/50" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-1 md:gap-3">
            {isAdminMode && (
              <Button 
                variant={isCMSActive ? "default" : "outline"} 
                size="sm" 
                onClick={() => setIsCMSActive(!isCMSActive)}
                className={cn(
                  "h-9 rounded-xl font-black text-[11px] gap-2",
                  isCMSActive ? "bg-accent text-primary" : "border-white/20 text-white"
                )}
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                CMS EDIT
              </Button>
            )}
            <Button variant="ghost" size="icon" className="text-white/70 hover:text-accent hover:bg-white/5 rounded-full">
              <Bell className="w-5 h-5" />
            </Button>
            {isAdminMode && (
              <Button variant="outline" size="sm" onClick={() => { setIsAdminMode(false); setIsCMSActive(false); }} className="h-8 border-accent/30 text-accent text-[10px] font-black hover:bg-accent/10">
                ADMIN EXIT
              </Button>
            )}
            {!isAdminMode && (
              <Button variant="ghost" size="icon" onClick={() => setShowAdminDialog(true)} className="text-white/70 hover:text-accent hover:bg-white/5 rounded-full">
                <Settings className="w-5 h-5" />
              </Button>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8 md:py-12">
        {isCMSActive && isAdminMode ? (
          <AdminCMS initialBanners={cmsBanners} onUpdate={() => {}} />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            <main className={cn(
              "space-y-10 transition-all duration-500",
              isSearching ? "lg:col-span-12 max-w-4xl mx-auto w-full" : "lg:col-span-8"
            )}>
              {!isSearching && <MainBanner banners={cmsBanners} />}
              
              <div className="space-y-10">
                {!isSearching && (
                  <SubmissionForm 
                    type="question"
                    placeholder="교육 설계, L&D 전략, 사내 세미나 등 HRD 관련 고민을 속삭여보세요."
                    onSubmit={handleAddQuestion}
                  />
                )}

                {isSearching && (
                  <div className="flex items-center justify-between px-2 mb-2">
                    <div className="flex items-center gap-4">
                      <button onClick={() => setSearchQuery("")} className="p-2 hover:bg-primary/5 rounded-full text-primary/40"><ArrowLeft className="w-6 h-6" /></button>
                      <div>
                        <h2 className="text-2xl font-black text-primary">' {searchQuery} ' 검색 결과</h2>
                        <p className="text-sm font-bold text-primary/30">{filteredQuestions.length}개의 속삭임</p>
                      </div>
                    </div>
                  </div>
                )}

                <QuestionFeed 
                  questions={filteredQuestions} 
                  onSelectQuestion={() => {}}
                  selectedId={null}
                  answers={answers}
                  onAddAnswer={() => {}}
                  activeTab={activeTab}
                  onTabChange={setActiveTab}
                  isAdminMode={isAdminMode}
                />
              </div>
            </main>

            {!isSearching && (
              <aside className="lg:col-span-4 space-y-8 hidden lg:block">
                <RankingList questions={topQuestions} onSelectQuestion={() => {}} />
                <ShuChat />
                <div className="bg-white rounded-[2rem] p-8 border border-primary/5 shadow-xl">
                  <h3 className="text-lg font-black text-primary mb-6 flex items-center gap-3">
                    <Info className="w-5 h-5 text-accent" /> HRD 플랫폼 가이드
                  </h3>
                  <div className="space-y-6">
                     <p className="text-[14px] font-bold text-primary/60 leading-relaxed">
                       교육 전문가들을 위한 고품격 익명 소통 공간입니다. 부적절한 언행은 관리자에 의해 제한될 수 있습니다.
                     </p>
                  </div>
                </div>
              </aside>
            )}
          </div>
        )}
      </div>

      <Dialog open={showAdminDialog} onOpenChange={setShowAdminDialog}>
        <DialogContent className="bg-white border-primary/20 rounded-[2rem] p-8">
          <DialogHeader><DialogTitle className="text-2xl font-black text-primary">관리자 인증</DialogTitle></DialogHeader>
          <div className="py-6">
            <input 
              type="password" placeholder="ADMIN ACCESS KEY" value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              className="w-full bg-primary/5 border-none h-12 rounded-xl text-center font-black"
              onKeyDown={(e) => e.key === 'Enter' && handleAdminAuth()}
            />
          </div>
          <DialogFooter><Button onClick={handleAdminAuth} className="bg-primary text-accent font-black px-8">인증 완료</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
