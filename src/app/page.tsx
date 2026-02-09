
"use client"

import { useState, useEffect, useMemo } from "react"
import { Header } from "@/components/chuchot/Header"
import { MainBanner, BannerData } from "@/components/chuchot/MainBanner"
import { SubmissionForm } from "@/components/chuchot/SubmissionForm"
import { QuestionFeed } from "@/components/chuchot/QuestionFeed"
import { RankingList } from "@/components/chuchot/RankingList"
import { ShuChat } from "@/components/chuchot/ShuChat"
import { AdminCMS } from "@/components/chuchot/AdminCMS"
import { Question, Answer } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Info, ArrowLeft } from "lucide-react"
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
import { useFirestore, useCollection, useDoc, useMemoFirebase, addDocumentNonBlocking, updateDocumentNonBlocking } from "@/firebase"
import { collection, query, orderBy, doc, increment } from "firebase/firestore"

export default function HomePage() {
  const [isAdminMode, setIsAdminMode] = useState(false)
  const [isCMSActive, setIsCMSActive] = useState(false)
  const [showAdminDialog, setShowAdminDialog] = useState(false)
  const [adminPassword, setAdminPassword] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState<"all" | "popular" | "waiting">("all")
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(null)
  const { toast } = useToast()
  const db = useFirestore()

  // Real-time questions
  const questionsQuery = useMemoFirebase(() => {
    if (!db) return null
    return query(collection(db, "questions"), orderBy("createdAt", "desc"))
  }, [db])
  const { data: questionsData } = useCollection<Question>(questionsQuery)
  const questions = questionsData || []

  // Real-time answers for selected question
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

    addDocumentNonBlocking(collection(db, "questions"), questionData).then((docRef) => {
      if (docRef) {
        generateAiReply({ title, text }).then((res) => {
          const aiAnswer = {
            questionId: docRef.id,
            text: res.replyText,
            nickname: "슈 (AI)",
            createdAt: Date.now(),
            avatarId: "sparkles",
          }
          addDocumentNonBlocking(collection(db, "questions", docRef.id, "answers"), aiAnswer)
          updateDocumentNonBlocking(doc(db, "questions", docRef.id), { answerCount: increment(1) })
        })
      }
    })
  }

  const handleAddAnswer = (nickname: string, title: string, text: string) => {
    if (!db || !selectedQuestionId) return

    const answerData = {
      questionId: selectedQuestionId,
      text,
      nickname,
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
      toast({ title: "관리자 권한 획득", description: "커뮤니티 가이드라인 및 CMS 관리가 가능합니다." })
    } else {
      toast({ title: "인증 실패", description: "관리자 암호가 올바르지 않습니다.", variant: "destructive" })
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
          <AdminCMS initialBanners={cmsBanners} onUpdate={() => {}} />
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
                        {filteredQuestions.length}개의 지식 속삭임을 찾았습니다.
                      </p>
                    </div>
                    <div className="h-1.5 w-24 gold-gradient rounded-full mt-2"></div>
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
                      placeholder="교육 설계, L&D 전략, 사내 세미나 등 HRD 관련 고민을 속삭여보세요."
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
                <RankingList questions={topQuestions} onSelectQuestion={handleSelectQuestion} />
                <ShuChat />
                <div className="bg-white rounded-[2rem] p-8 border border-primary/5 shadow-xl">
                  <h3 className="text-lg font-black text-primary mb-6 flex items-center gap-3">
                    <Info className="w-5 h-5 text-accent" /> HRD 플랫폼 가이드
                  </h3>
                  <p className="text-[14px] font-bold text-primary/60 leading-relaxed">
                    교육 전문가들을 위한 고품격 익명 소통 공간입니다. 부적절한 언행은 관리자에 의해 제한될 수 있습니다.
                  </p>
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
