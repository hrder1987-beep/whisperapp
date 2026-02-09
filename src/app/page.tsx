"use client"

import { useState, useMemo } from "react"
import { Header } from "@/components/chuchot/Header"
import { MainBanner, BannerData } from "@/components/chuchot/MainBanner"
import { SubmissionForm } from "@/components/chuchot/SubmissionForm"
import { QuestionFeed } from "@/components/chuchot/QuestionFeed"
import { RankingList } from "@/components/chuchot/RankingList"
import { AldiChat } from "@/components/chuchot/ShuChat"
import { AdminCMS } from "@/components/chuchot/AdminCMS"
import { Question, Answer, UserRole } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
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

const MOCK_QUESTIONS: Question[] = [
  {
    id: "sample-1",
    title: "2024년 채용 트렌드: AI 역량 검사 어떻게 대비하시나요?",
    text: "최근 많은 기업들이 AI 역량 검사를 도입하고 있는데, 지원자들의 거부감은 없는지 그리고 실제 변별력이 어느 정도라고 보시는지 궁금합니다.",
    nickname: "채용마스터",
    userId: "mock-1",
    userRole: "member",
    jobTitle: "채용담당자",
    viewCount: 1240,
    answerCount: 8,
    createdAt: Date.now() - 1000 * 60 * 60 * 2,
    category: "채용/헤드헌팅"
  }
]

export default function HomePage() {
  const { user } = useUser()
  const db = useFirestore()
  
  const userDocRef = useMemoFirebase(() => (user && db) ? doc(db, "users", user.uid) : null, [user, db])
  const { data: profile } = useDoc<any>(userDocRef)

  const [isAdminMode, setIsAdminMode] = useState(false)
  const [isCMSActive, setIsCMSActive] = useState(false)
  const [showAdminDialog, setShowAdminDialog] = useState(false)
  const [adminPassword, setAdminPassword] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState<"all" | "popular" | "waiting">("all")
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(null)
  const { toast } = useToast()

  const questionsQuery = useMemoFirebase(() => {
    if (!db || typeof db !== 'object') return null
    try {
      return query(collection(db, "questions"), orderBy("createdAt", "desc"))
    } catch (e) {
      return null
    }
  }, [db])
  const { data: questionsData } = useCollection<Question>(questionsQuery)
  
  const questions = useMemo(() => {
    const fetched = questionsData || []
    if (fetched.length === 0 && !searchQuery) return MOCK_QUESTIONS
    return fetched
  }, [questionsData, searchQuery])

  const answersQuery = useMemoFirebase(() => {
    if (!db || typeof db !== 'object' || !selectedQuestionId) return null
    try {
      return query(collection(db, "questions", selectedQuestionId, "answers"), orderBy("createdAt", "desc"))
    } catch (e) {
      return null
    }
  }, [db, selectedQuestionId])
  const { data: answersData } = useCollection<Answer>(answersQuery)
  const answers = answersData || []

  const configDocRef = useMemoFirebase(() => {
    if (!db || typeof db !== 'object') return null
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
    return {
      image: "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHhzfHxocm98ZW58MHx8fHwxNzcwMjgxNjE3fDA&ixlib=rb-4.1.0&q=80&w=1080",
      link: "https://whisper.hr",
      title: "HR 전문가를 위한\n프리미엄 채용 솔루션"
    }
  }, [config])

  const isSearching = searchQuery.trim().length > 0

  const filteredQuestions = useMemo(() => {
    let result = [...questions]
    if (searchQuery.trim()) {
      const keywords = searchQuery.toLowerCase().split(/\s+/).filter(k => k.length > 0)
      result = result.filter(q => {
        const content = `${q.title} ${q.text} ${q.nickname} ${q.category || ""} ${q.jobTitle || ""}`.toLowerCase()
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

  const handleAddQuestion = (nickname: string, title: string, text: string, imageUrl?: string, videoUrl?: string, category?: string) => {
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
      jobTitle: profile?.jobTitle || null,
      userProfilePicture: profile?.profilePictureUrl || null,
      imageUrl: imageUrl || null,
      videoUrl: videoUrl || null,
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
            nickname: "알디",
            userId: "ai-whisper",
            userRole: "admin",
            jobTitle: "AI 길잡이",
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

    const selectedQuestion = questions.find(q => q.id === selectedQuestionId)
    if (!selectedQuestion) return

    const answerData = {
      questionId: selectedQuestionId,
      text,
      nickname,
      userId: user.uid,
      userRole: (profile?.role as UserRole) || "member",
      jobTitle: profile?.jobTitle || null,
      userProfilePicture: profile?.profilePictureUrl || null,
      createdAt: Date.now(),
    }

    addDocumentNonBlocking(collection(db, "questions", selectedQuestionId, "answers"), answerData).then(() => {
      // 본인이 본인 글에 답글 달 때는 알림 생성 안 함
      if (selectedQuestion.userId !== user.uid) {
        addDocumentNonBlocking(collection(db, "notifications"), {
          userId: selectedQuestion.userId,
          type: "new_answer",
          questionId: selectedQuestionId,
          questionTitle: selectedQuestion.title,
          senderNickname: nickname,
          createdAt: Date.now(),
          isRead: false
        })
      }
    })
    
    updateDocumentNonBlocking(doc(db, "questions", selectedQuestionId), { answerCount: increment(1) })
  }

  const handleSelectQuestion = (id: string) => {
    if (selectedQuestionId === id) {
      setSelectedQuestionId(null)
    } else {
      setSelectedQuestionId(id)
      if (db && !id.startsWith("sample-")) {
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

      <div className="max-w-7xl mx-auto px-0 md:px-4 py-0 md:py-12">
        {isCMSActive && isAdminMode ? (
          <AdminCMS 
            initialBanners={cmsBanners} 
            initialSidebarAd={sidebarAd}
            onUpdate={() => {}} 
          />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            <main className={cn(
              "space-y-0 md:space-y-10 transition-all duration-500",
              isSearching ? "lg:col-span-12 max-w-4xl mx-auto w-full" : "lg:col-span-8"
            )}>
              {isSearching ? (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 px-4 md:px-0 mt-8">
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
                <div className="flex flex-col gap-0 md:gap-10">
                  <div className="w-full order-1">
                    <MainBanner banners={cmsBanners} />
                  </div>
                  <div className="px-4 md:px-0 -mt-6 md:mt-0 relative z-20 order-2">
                    <SubmissionForm 
                      type="question"
                      placeholder="채용, 교육, 조직문화 등 HR 현업의 고민을 속삭여보세요."
                      onSubmit={handleAddQuestion}
                    />
                  </div>
                  <div className="px-4 md:px-0 order-3">
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
                </div>
              )}
            </main>

            {!isSearching && (
              <aside className="lg:col-span-4 space-y-8 hidden lg:block">
                <AldiChat />
                <RankingList questions={topQuestions} onSelectQuestion={handleSelectQuestion} />
              </aside>
            )}
          </div>
        )}
      </div>

      <Dialog open={showAdminDialog} onOpenChange={setShowAdminDialog}>
        <DialogContent className="bg-white border-primary/20 rounded-[3rem] p-10">
          <DialogHeader><DialogTitle className="text-2xl font-black text-primary">Whisper 관리자 인증</DialogTitle></DialogHeader>
          <div className="py-8">
            <input 
              type="password" placeholder="ADMIN ACCESS KEY" value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              className="w-full bg-primary/5 border-none h-14 rounded-2xl text-center font-black text-lg focus:ring-accent"
              onKeyDown={(e) => e.key === 'Enter' && handleAdminAuth()}
            />
          </div>
          <DialogFooter><Button onClick={handleAdminAuth} className="w-full h-14 bg-primary text-accent font-black text-lg rounded-2xl">인증 완료</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
