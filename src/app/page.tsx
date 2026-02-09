
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
import { ArrowLeft, ExternalLink, Sparkles } from "lucide-react"
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

const MOCK_QUESTIONS: Question[] = [
  {
    id: "sample-1",
    title: "2024년 채용 트렌드: AI 역량 검사 어떻게 대비하시나요?",
    text: "최근 많은 기업들이 AI 역량 검사를 도입하고 있는데, 지원자들의 거부감은 없는지 그리고 실제 변별력이 어느 정도라고 보시는지 궁금합니다. 도입을 검토 중인 담당자로서 실무진의 솔직한 의견이 필요합니다.",
    nickname: "채용마스터",
    userId: "mock-1",
    userRole: "member",
    viewCount: 1240,
    answerCount: 8,
    createdAt: Date.now() - 1000 * 60 * 60 * 2,
    category: "채용/헤드헌팅"
  },
  {
    id: "sample-2",
    title: "MZ세대 온보딩 과정에서 가장 효과적이었던 활동 공유합니다.",
    text: "저희 회사는 '버디 프로그램'과 '웰컴 키트' 외에도 '100일 미션'이라는 제도를 운영하고 있는데 반응이 매우 좋습니다. 다른 회사 담당자님들은 어떤 독특한 온보딩 경험을 설계하고 계신가요?",
    nickname: "문화기획자",
    userId: "mock-2",
    userRole: "mentor",
    viewCount: 850,
    answerCount: 12,
    createdAt: Date.now() - 1000 * 60 * 60 * 5,
    category: "조직문화/EVP",
    userProfilePicture: "https://picsum.photos/seed/culture/200/200"
  },
  {
    id: "sample-3",
    title: "인사평가 시즌... 피드백 스킬에 대한 고민이 많습니다.",
    text: "팀장님들이 하부 조직원들에게 피드백할 때 너무 공격적이거나 혹은 너무 방어적이어서 평가의 본래 취지가 퇴색되는 경우가 많네요. 사내 피드백 교육을 기획 중인데 추천해주실 만한 사례가 있을까요?",
    nickname: "HR러버",
    userId: "mock-3",
    userRole: "member",
    viewCount: 320,
    answerCount: 4,
    createdAt: Date.now() - 1000 * 60 * 60 * 24,
    category: "인사전략/HRM"
  }
]

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
  
  const questions = useMemo(() => {
    const fetched = questionsData || []
    if (fetched.length === 0 && !searchQuery) return MOCK_QUESTIONS
    return fetched
  }, [questionsData, searchQuery])

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
    return {
      image: "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwzfHxocm98ZW58MHx8fHwxNzcwMjgxNjE3fDA&ixlib=rb-4.1.0&q=80&w=1080",
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

      <div className="max-w-7xl mx-auto px-4 py-4 md:py-12">
        {isCMSActive && isAdminMode ? (
          <AdminCMS 
            initialBanners={cmsBanners} 
            initialSidebarAd={sidebarAd}
            onUpdate={() => {}} 
          />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            <main className={cn(
              "space-y-6 md:space-y-10 transition-all duration-500",
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
                  {/* 모바일 최적화 레이아웃: 배너 -> 작성란 -> 피드 */}
                  <div className="flex flex-col gap-6 md:gap-10">
                    <MainBanner banners={cmsBanners} />
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
                <AldiChat />
                <RankingList questions={topQuestions} onSelectQuestion={handleSelectQuestion} />

                {sidebarAd && (
                  <a href={sidebarAd.link} target="_blank" rel="noopener noreferrer" className="block group">
                    <div className="relative w-full aspect-[4/5] rounded-[3rem] overflow-hidden shadow-2xl transition-all duration-500 hover:shadow-primary/20 hover:-translate-y-2">
                      <Image 
                        src={sidebarAd.image} 
                        alt={sidebarAd.title} 
                        fill 
                        className="object-cover transition-transform duration-1000 group-hover:scale-110"
                        data-ai-hint="business office"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                      <div className="absolute bottom-10 left-8 right-8">
                        <Badge className="bg-accent text-primary font-black mb-3 px-3 py-1 text-[10px]">ADVERTISEMENT</Badge>
                        <h3 className="text-white text-2xl font-black leading-tight drop-shadow-lg group-hover:text-accent transition-colors whitespace-pre-line">
                          {sidebarAd.title}
                        </h3>
                        <div className="mt-6 flex items-center gap-2 text-white/50 text-xs font-bold uppercase tracking-widest">
                          자세히 보기 <ExternalLink className="w-3 h-3" />
                        </div>
                      </div>
                    </div>
                  </a>
                )}
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
