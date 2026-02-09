"use client"

import { useState, useMemo } from "react"
import { Header } from "@/components/chuchot/Header"
import { MainBanner, BannerData } from "@/components/chuchot/MainBanner"
import { SubmissionForm } from "@/components/chuchot/SubmissionForm"
import { QuestionFeed } from "@/components/chuchot/QuestionFeed"
import { RankingList } from "@/components/chuchot/RankingList"
import { ChuchotChat } from "@/components/chuchot/ShuChat"
import { AdminCMS } from "@/components/chuchot/AdminCMS"
import { Question, Answer, UserRole } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { ArrowLeft, ExternalLink } from "lucide-react"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { generateAiReply } from "@/ai/flows/generate-ai-reply-flow"
import { cn } from "@/lib/utils"
import { useFirestore, useCollection, useDoc, useMemoFirebase, addDocumentNonBlocking, updateDocumentNonBlocking, useUser } from "@/firebase"
import { collection, query, orderBy, doc, increment } from "firebase/firestore"
import Image from "next/image"
import { Badge } from "@/components/ui/badge"

export default function HomePage() {
  const { user } = useUser()
  const userDocRef = useMemoFirebase(() => user ? doc(user.firestore, "users", user.uid) : null, [user])
  const { data: profile } = useDoc<any>(userDocRef)

  const [isAdminMode, setIsAdminMode] = useState(false)
  const [isCMSActive, setIsCMSActive] = useState(false)
  const [showAdminDialog, setShowAdminDialog] = useState(false)
  const [adminPassword, setAdminPassword] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState<"all" | "popular" | "waiting">("all")
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(null)
  const { toast } = useToast()
  const db = useFirestore()

  const questionsQuery = useMemoFirebase(() => {
    if (!db) return null
    return query(collection(db, "questions"), orderBy("createdAt", "desc"))
  }, [db])
  const { data: questionsData } = useCollection<Question>(questionsQuery)
  const questions = questionsData || []

  const answersQuery = useMemoFirebase(() => {
    if (!db || !selectedQuestionId) return null
    return query(collection(db, "questions", selectedQuestionId, "answers"), orderBy("createdAt", "desc"))
  }, [db, selectedQuestionId])
  const { data: answersData } = useCollection<Answer>(answersQuery)
  const answers = answersData || []

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

  const sidebarAd = useMemo(() => {
    if (config?.sidebarAdSettings) {
      try {
        return JSON.parse(config.sidebarAdSettings)
      } catch (e) {
        return null
      }
    }
    return null
  }, [config])

  const isSearching = searchQuery.trim().length > 0

  const filteredQuestions = useMemo(() => {
    let result = [...questions]
    if (searchQuery.trim()) {
      const keywords = searchQuery.toLowerCase().split(/\s+/).filter(k => k.length > 0)
      result = result.filter(q => {
        const content = `${q.title} ${q.text} ${q.nickname} ${q.category || ""}`.toLowerCase()
        return keywords.every(kw => content.includes(kw))
      })
    }
    if (activeTab === "popular") result.sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0))
    else if (activeTab === "waiting") result = result.filter(q => (q.answerCount || 0) === 0)
    return result
  }, [questions, searchQuery, activeTab])

  const topQuestions = useMemo(() => {
    return [...questions].sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0)).slice(0, 5)
  }, [questions])

  const handleAddQuestion = (nickname: string, title: string, text: string, imageUrl?: string, category?: string) => {
    if (!db || !user) {
      toast({ title: "로그인 필요", description: "질문을 등록하려면 로그인이 필요합니다.", variant: "destructive" })
      return
    }

    const questionData = {
      title,
      text,
      nickname,
      userId: user.uid,
      userRole: (profile?.role as UserRole) || "member",
      userProfilePicture: profile?.profilePictureUrl || null,
      imageUrl: imageUrl || null,
      category: category || null,
      viewCount: 0,
      answerCount: 0,
      createdAt: Date.now(),
    }

    addDocumentNonBlocking(collection(db, "questions"), questionData).then((docRef) => {
      if (docRef) {
        generateAiReply({ title, text }).then((res) => {
          const aiAnswer = {
            questionId: docRef.id,
            text: res.replyText,
            nickname: "슈쇼 (AI Whisper)",
            userId: "ai-whisper",
            userRole: "admin",
            createdAt: Date.now(),
            userProfilePicture: null,
          }
          addDocumentNonBlocking(collection(db, "questions", docRef.id, "answers"), aiAnswer)
          updateDocumentNonBlocking(doc(db, "questions", docRef.id), { answerCount: increment(1) })
        })
      }
    })
  }

  const handleAddAnswer = (nickname: string, title: string, text: string) => {
    if (!db || !selectedQuestionId || !user) return

    const answerData = {
      questionId: selectedQuestionId,
      text,
      nickname,
      userId: user.uid,
      userRole: (profile?.role as UserRole) || "member",
      userProfilePicture: profile?.profilePictureUrl || null,
      createdAt: Date.now(),
    }

    addDocumentNonBlocking(collection(db, "questions", selectedQuestionId, "answers"), answerData)
    updateDocumentNonBlocking(doc(db, "questions", selectedQuestionId), { answerCount: increment(1) })
  }

  const handleSelectQuestion = (id: string) => {
    if (selectedQuestionId === id) {
      setSelectedQuestionId(null)
    } else {
      setSelectedQuestionId(id)
      if (db) {
        updateDocumentNonBlocking(doc(db, "questions", id), { viewCount: increment(1) })
      }
    }
  }

  const handleAdminAuth = () => {
    if (adminPassword === "admin123") {
      setIsAdminMode(true)
      setShowAdminDialog(false)
      toast({ title: "관리자 권한 획득", description: "Whisper 플랫폼 관리가 가능합니다." })
    } else {
      toast({ title: "인증 실패", description: "암호가 올바르지 않습니다.", variant: "destructive" })
    }
    setAdminPassword("")
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <Header 
        onSearch={setSearchQuery} 
        isAdminMode={isAdminMode} 
        isCMSActive={isCMSActive}
        onToggleCMS={() => setIsCMSActive(!isCMSActive)}
        onExitAdmin={() => { setIsAdminMode(false); setIsCMSActive(false); }}
        onOpenAdminAuth={() => setShowAdminDialog(true)}
      />

      <div className="max-w-7xl mx-auto px-4 py-8 md:py-12">
        {isCMSActive && isAdminMode ? (
          <AdminCMS 
            initialBanners={cmsBanners} 
            initialSidebarAd={sidebarAd}
            onUpdate={() => {}} 
          />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            <main className={cn(
              "space-y-10 transition-all duration-500",
              isSearching ? "lg:col-span-12 max-w-4xl mx-auto w-full" : "lg:col-span-8"
            )}>
              {isSearching ? (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                  <div className="flex flex-col gap-6 mb-12">
                    <button 
                      onClick={() => setSearchQuery("")} 
                      className="flex items-center gap-2 text-primary/40 hover:text-accent font-bold text-sm transition-colors w-fit group"
                    >
                      <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                      홈으로 돌아가기
                    </button>
                    <div className="space-y-2">
                      <h2 className="text-4xl md:text-5xl font-black text-primary tracking-tight">
                        "<span className="text-accent">{searchQuery}</span>" 검색 결과
                      </h2>
                      <p className="text-lg font-bold text-primary/30">
                        {filteredQuestions.length}개의 HR 집단지성을 찾았습니다.
                      </p>
                    </div>
                  </div>

                  <QuestionFeed 
                    questions={filteredQuestions} 
                    onSelectQuestion={handleSelectQuestion}
                    selectedId={selectedQuestionId}
                    answers={answers}
                    onAddAnswer={handleAddAnswer}
                    activeTab={activeTab}
                    onTabChange={setActiveTab}
                    isAdminMode={isAdminMode}
                  />
                </div>
              ) : (
                <>
                  <MainBanner banners={cmsBanners} />
                  <div className="space-y-10">
                    <SubmissionForm 
                      type="question"
                      placeholder="채용, 교육, 조직문화 등 HR 현업의 고민을 속삭여보세요."
                      onSubmit={handleAddQuestion}
                    />
                    <QuestionFeed 
                      questions={filteredQuestions} 
                      onSelectQuestion={handleSelectQuestion}
                      selectedId={selectedQuestionId}
                      answers={answers}
                      onAddAnswer={handleAddAnswer}
                      activeTab={activeTab}
                      onTabChange={setActiveTab}
                      isAdminMode={isAdminMode}
                    />
                  </div>
                </>
              )}
            </main>

            {!isSearching && (
              <aside className="lg:col-span-4 space-y-8 hidden lg:block">
                <ChuchotChat />
                <RankingList questions={topQuestions} onSelectQuestion={handleSelectQuestion} />

                {/* 수익형 광고 배너 */}
                {sidebarAd ? (
                  <a href={sidebarAd.link} target="_blank" rel="noopener noreferrer" className="block group">
                    <div className="relative w-full aspect-[4/5] rounded-[2.5rem] overflow-hidden shadow-2xl transition-all duration-500 hover:shadow-primary/20 hover:-translate-y-2">
                      <Image 
                        src={sidebarAd.image} 
                        alt={sidebarAd.title} 
                        fill 
                        className="object-cover transition-transform duration-1000 group-hover:scale-110"
                        data-ai-hint="vertical banner ad"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                      <div className="absolute bottom-8 left-8 right-8">
                        <Badge className="bg-accent text-primary font-black mb-3 px-3 py-1 text-[10px]">ADVERTISEMENT</Badge>
                        <h3 className="text-white text-2xl font-black leading-tight drop-shadow-lg group-hover:text-accent transition-colors">
                          {sidebarAd.title}
                        </h3>
                        <div className="mt-4 flex items-center gap-2 text-white/50 text-xs font-bold uppercase tracking-widest">
                          자세히 보기 <ExternalLink className="w-3 h-3" />
                        </div>
                      </div>
                    </div>
                  </a>
                ) : (
                  <div className="bg-primary/5 border-2 border-dashed border-primary/10 p-12 rounded-[2.5rem] flex flex-col items-center justify-center text-center">
                    <p className="text-primary/20 font-black text-sm uppercase tracking-widest">Ad Space</p>
                    <p className="text-primary/10 text-xs mt-2 font-bold">광고 문의: admin@whisper.hr</p>
                  </div>
                )}
              </aside>
            )}
          </div>
        )}
      </div>

      <Dialog open={showAdminDialog} onOpenChange={setShowAdminDialog}>
        <DialogContent className="bg-white border-primary/20 rounded-[2rem] p-8">
          <DialogHeader><DialogTitle className="text-2xl font-black text-primary">Whisper 관리자 인증</DialogTitle></DialogHeader>
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
