"use client"

import { useState, useEffect, useMemo } from "react"
import { Logo } from "@/components/chuchot/Logo"
import { MainBanner } from "@/components/chuchot/MainBanner"
import { SubmissionForm } from "@/components/chuchot/SubmissionForm"
import { QuestionFeed } from "@/components/chuchot/QuestionFeed"
import { AnswerFeed } from "@/components/chuchot/AnswerFeed"
import { RankingList } from "@/components/chuchot/RankingList"
import { Question, Answer } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { ChevronLeft, Bell, Search, User as UserIcon, Settings } from "lucide-react"
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
import Image from "next/image"

export default function HomePage() {
  const [questions, setQuestions] = useState<Question[]>([])
  const [answers, setAnswers] = useState<Answer[]>([])
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(null)
  const [isAdminMode, setIsAdminMode] = useState(false)
  const [showAdminDialog, setShowAdminDialog] = useState(false)
  const [adminPassword, setAdminPassword] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const { toast } = useToast()

  useEffect(() => {
    const initialQuestions: Question[] = [
      {
        id: "1",
        title: "진정한 행복의 비결은 무엇일까요?",
        text: "요즘 부쩍 고민이 많아지네요. 여러분이 생각하는 행복의 조건은 무엇인가요? 돈, 명예, 아니면 사소한 일상일까요?",
        nickname: "행복찾기",
        viewCount: 124,
        answerCount: 2,
        createdAt: Date.now() - 3600000 * 2,
        imageUrl: "https://images.unsplash.com/photo-1477840539360-4a1d23071046?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw0fHxuaWdodCUyMHNreXxlbnwwfHx8fDE3NzAyODE2MTd8MA&ixlib=rb-4.1.0&q=80&w=1080"
      },
      {
        id: "2",
        title: "과거의 나에게 해주고 싶은 말",
        text: "과거의 자신에게 딱 한 마디만 속삭일 수 있다면 무엇을 말해주고 싶나요? 저는 '조금 더 용기 내봐'라고 말해주고 싶어요.",
        nickname: "시간여행자",
        viewCount: 89,
        answerCount: 1,
        createdAt: Date.now() - 3600000 * 5,
      },
      {
        id: "3",
        title: "디자인 컬러 조합 추천 부탁드려요",
        text: "딥 그린과 골드 조합은 왜 이렇게 고급스럽고 매력적일까요? 브랜드 디자인 공부 중인데 이 색조합이 가장 마음에 들어요. 다른 추천 조합도 있을까요?",
        nickname: "디자이너",
        viewCount: 210,
        answerCount: 0,
        createdAt: Date.now() - 3600000 * 0.5,
        imageUrl: "https://images.unsplash.com/photo-1758179761324-63b474fe55a0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw4fHxwZWFjZWZ1bCUyMGZvcmVzdHxlbnwwfHx8fDE3NzAzNTQzNzd8MA&ixlib=rb-4.1.0&q=80&w=1080"
      },
      ...Array.from({ length: 7 }).map((_, i) => ({
        id: `dummy-${i}`,
        title: `제목: 익명의 속삭임 ${i + 4}호`,
        text: `${i + 4}번째로 올라온 익명의 속삭임입니다. 리멤버 스타일로 개편된 UI가 마음에 드셨으면 좋겠네요. 더 많은 이야기를 들려주세요.`,
        nickname: `익명${i + 4}`,
        viewCount: Math.floor(Math.random() * 200),
        answerCount: Math.floor(Math.random() * 10),
        createdAt: Date.now() - 3600000 * (i + 10),
      }))
    ]
    setQuestions(initialQuestions)
  }, [])

  const filteredQuestions = useMemo(() => {
    return questions.filter(q => 
      q.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.text.toLowerCase().includes(searchQuery.toLowerCase()) || 
      q.nickname.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [questions, searchQuery])

  const topQuestions = useMemo(() => {
    // 실시간 인기 속삭임을 5개로 제한하여 박스 크기를 줄임
    return [...questions].sort((a, b) => b.viewCount - a.viewCount).slice(0, 5)
  }, [questions])

  const handleAddQuestion = (nickname: string, title: string, text: string, imageUrl?: string) => {
    const newQuestion: Question = {
      id: Math.random().toString(36).substr(2, 9),
      title,
      text,
      nickname,
      imageUrl,
      viewCount: 0,
      answerCount: 0,
      createdAt: Date.now(),
    }
    setQuestions([newQuestion, ...questions])
  }

  const handleAddAnswer = (nickname: string, text: string) => {
    if (!selectedQuestionId) return
    const newAnswer: Answer = {
      id: Math.random().toString(36).substr(2, 9),
      questionId: selectedQuestionId,
      text,
      nickname,
      createdAt: Date.now(),
    }
    setAnswers([newAnswer, ...answers])
    setQuestions(questions.map(q => 
      q.id === selectedQuestionId ? { ...q, answerCount: q.answerCount + 1 } : q
    ))
  }

  const handleSelectQuestion = (id: string) => {
    setSelectedQuestionId(id)
    setQuestions(questions.map(q => 
      q.id === id ? { ...q, viewCount: q.viewCount + 1 } : q
    ))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleAdminAuth = () => {
    if (adminPassword === "admin123") {
      setIsAdminMode(true)
      setShowAdminDialog(false)
      toast({ title: "관리자 모드 활성화", description: "유지관리 권한을 획득했습니다." })
    } else {
      toast({ title: "접근 거부", description: "비밀번호가 일치하지 않습니다.", variant: "destructive" })
    }
    setAdminPassword("")
  }

  const handleDeleteQuestion = (id: string) => {
    setQuestions(questions.filter(q => q.id !== id))
    setAnswers(answers.filter(a => a.questionId !== id))
    if (selectedQuestionId === id) setSelectedQuestionId(null)
    toast({ title: "속삭임 삭제됨", description: "요청하신 관리 작업이 완료되었습니다." })
  }

  const selectedQuestion = questions.find(q => q.id === selectedQuestionId)
  const questionAnswers = answers.filter(a => a.questionId === selectedQuestionId)

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full border-b border-primary/10 bg-white/95 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <Logo className="flex-shrink-0" />
          
          <div className="hidden md:flex flex-1 max-w-xl relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input 
              placeholder="관심 있는 내용을 검색해보세요..." 
              className="pl-11 bg-primary/5 border-none focus-visible:ring-primary h-10 rounded-full text-sm placeholder:text-primary/50"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-1 md:gap-3">
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary hover:bg-primary/5">
              <Bell className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary hover:bg-primary/5">
              <UserIcon className="w-5 h-5" />
            </Button>
            {isAdminMode ? (
              <Button variant="outline" size="sm" onClick={() => setIsAdminMode(false)} className="h-8 border-primary/30 text-primary text-[10px]">
                관리 종료
              </Button>
            ) : (
              <Button variant="ghost" size="icon" onClick={() => setShowAdminDialog(true)} className="text-muted-foreground hover:bg-primary/5">
                <Settings className="w-5 h-5" />
              </Button>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-6 md:py-8">
        {selectedQuestionId && selectedQuestion ? (
          <div className="max-w-3xl mx-auto animate-in fade-in slide-in-from-right-4 duration-500">
            <Button 
              variant="ghost" 
              className="mb-6 text-muted-foreground hover:text-primary group pl-0 hover:bg-transparent"
              onClick={() => setSelectedQuestionId(null)}
            >
              <ChevronLeft className="w-4 h-4 mr-1 group-hover:-translate-x-1 transition-transform" />
              목록으로
            </Button>

            <article className="bg-white border border-primary/10 rounded-2xl overflow-hidden mb-6 shadow-sm">
              <div className="p-6 md:p-8">
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary border border-primary/10">
                      {selectedQuestion.nickname.substring(0, 1)}
                    </div>
                    <div>
                      <h3 className="font-bold text-foreground">@{selectedQuestion.nickname}</h3>
                      <p className="text-[11px] text-muted-foreground">
                        {new Date(selectedQuestion.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  {isAdminMode && (
                    <Button variant="destructive" size="sm" onClick={() => handleDeleteQuestion(selectedQuestion.id)}>삭제</Button>
                  )}
                </div>
                
                <h1 className="text-2xl md:text-3xl font-bold text-foreground leading-tight mb-6">
                  {selectedQuestion.title}
                </h1>

                <p className="text-base md:text-lg text-foreground/90 leading-relaxed mb-8 break-words whitespace-pre-wrap">
                  {selectedQuestion.text}
                </p>

                {selectedQuestion.imageUrl && (
                  <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-primary/10 bg-primary/5 mb-8">
                    <Image 
                      src={selectedQuestion.imageUrl} 
                      alt="상세 이미지" 
                      fill 
                      className="object-cover"
                      data-ai-hint="post detail"
                    />
                  </div>
                )}
                
                <div className="flex gap-4 pt-6 border-t border-primary/5 text-xs text-muted-foreground">
                  <span>조회 {selectedQuestion.viewCount}</span>
                  <span>댓글 {selectedQuestion.answerCount}</span>
                </div>
              </div>
            </article>

            <SubmissionForm 
              type="answer"
              placeholder="답글을 남겨주세요..."
              onSubmit={(nick, title, text) => handleAddAnswer(nick, text)}
            />

            <AnswerFeed answers={questionAnswers} />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <main className="lg:col-span-8 space-y-6">
              <MainBanner />
              
              <div className="space-y-6">
                <SubmissionForm 
                  type="question"
                  placeholder="고민이나 일상을 자유롭게 속삭여보세요."
                  onSubmit={handleAddQuestion}
                />

                <div className="relative">
                  <QuestionFeed 
                    questions={filteredQuestions} 
                    onSelectQuestion={handleSelectQuestion} 
                  />
                </div>
              </div>
            </main>

            <aside className="lg:col-span-4 space-y-6 hidden lg:block">
              <RankingList questions={topQuestions} onSelectQuestion={handleSelectQuestion} />
              
              <div className="bg-white rounded-2xl p-6 border border-primary/10 shadow-sm">
                <h3 className="text-sm font-bold text-primary mb-4">슈쇼 서비스 가이드</h3>
                <div className="space-y-4">
                   <div className="space-y-1">
                      <p className="text-[13px] font-semibold text-foreground/90">완벽한 익명성</p>
                      <p className="text-[12px] text-muted-foreground leading-snug">모든 활동은 익명으로 처리되며, 작성자의 정보는 안전하게 보호됩니다.</p>
                   </div>
                   <div className="space-y-1">
                      <p className="text-[13px] font-semibold text-foreground/90">이미지 첨부 지원</p>
                      <p className="text-[12px] text-muted-foreground leading-snug">텍스트만으로 부족할 땐 이미지를 함께 올려 공감을 얻어보세요.</p>
                   </div>
                   <div className="space-y-1">
                      <p className="text-[13px] font-semibold text-foreground/90">클린 커뮤니티</p>
                      <p className="text-[12px] text-muted-foreground leading-snug">비방이나 혐오 표현은 지양하고 따뜻한 속삭임을 나누어주세요.</p>
                   </div>
                </div>
              </div>

              <div className="px-2 text-[11px] text-muted-foreground/60 leading-relaxed text-center">
                <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 mb-3">
                  <span className="hover:text-primary cursor-pointer transition-colors">이용약관</span>
                  <span className="hover:text-primary cursor-pointer transition-colors">개인정보처리방침</span>
                  <span className="hover:text-primary cursor-pointer transition-colors">운영정책</span>
                  <span className="hover:text-primary cursor-pointer transition-colors">고객센터</span>
                </div>
                <p>© {new Date().getFullYear()} Chuchot. Powered by Anonymous Whispers.</p>
              </div>
            </aside>
          </div>
        )}
      </div>

      <Dialog open={showAdminDialog} onOpenChange={setShowAdminDialog}>
        <DialogContent className="bg-white border-primary/20 text-foreground">
          <DialogHeader>
            <DialogTitle className="text-primary">관리자 인증</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              유지관리 모드를 활성화하기 위해 관리자 키를 입력하세요.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input 
              type="password" 
              placeholder="키 입력..." 
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              className="bg-primary/5 border-primary/10 placeholder:text-primary/40"
              onKeyDown={(e) => e.key === 'Enter' && handleAdminAuth()}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdminDialog(false)} className="border-primary/10">취소</Button>
            <Button onClick={handleAdminAuth}>인증하기</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
