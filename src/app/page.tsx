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
    // HR 중심의 예시 데이터로 업데이트
    const initialQuestions: Question[] = [
      {
        id: "1",
        title: "2024년 하반기 연봉 인상률 트렌드가 궁금합니다.",
        text: "다른 IT 기업들은 올해 연봉 인상률 어느 정도로 잡고 계신가요? 3~5% 내외가 대세인지, 아니면 동결 기조인지 궁금합니다. 저희는 현재 조직문화 개편과 맞물려 고민이 많네요.",
        nickname: "인사팀장A",
        viewCount: 1240,
        answerCount: 8,
        createdAt: Date.now() - 3600000 * 2,
        imageUrl: "https://images.unsplash.com/photo-1454165833767-1316b0215b3f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw0fHxocmFkbWluJTIwb2ZmaWNlfGVufDB8fHx8MTc3MDI4MTYxN3ww&ixlib=rb-4.1.0&q=80&w=1080"
      },
      {
        id: "2",
        title: "신입 사원 온보딩 프로그램 아이디어 공유해요.",
        text: "단순 교육 말고, 회사에 정말 '스며들 수 있게' 하는 좋은 장치가 있을까요? 웰컴 키트 외에 추천할 만한 프로그램이 있다면 속삭여주세요.",
        nickname: "교육담당자",
        viewCount: 890,
        answerCount: 12,
        createdAt: Date.now() - 3600000 * 5,
      },
      {
        id: "3",
        title: "주 4일제 도입 검토 중인데, 리스크가 무엇일까요?",
        text: "총무 및 근태 관리 측면에서 주 4일제(또는 격주 4일제) 도입 시 가장 큰 허들이 무엇이었나요? 경험 있으신 담당자분들의 조언 부탁드립니다.",
        nickname: "총무관리자",
        viewCount: 2100,
        answerCount: 5,
        createdAt: Date.now() - 3600000 * 0.5,
        imageUrl: "https://images.unsplash.com/photo-1552664730-d307ca884978?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw4fHxtZWV0aW5nfGVufDB8fHx8MTc3MDM1NDM3N3ww&ixlib=rb-4.1.0&q=80&w=1080"
      }
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
      toast({ title: "관리자 권한 획득", description: "커뮤니티 가이드라인 관리가 가능합니다." })
    } else {
      toast({ title: "인증 실패", description: "관리자 암호가 올바르지 않습니다.", variant: "destructive" })
    }
    setAdminPassword("")
  }

  const handleDeleteQuestion = (id: string) => {
    setQuestions(questions.filter(q => q.id !== id))
    setAnswers(answers.filter(a => a.questionId !== id))
    if (selectedQuestionId === id) setSelectedQuestionId(null)
    toast({ title: "속삭임 삭제", description: "운영 정책에 따라 게시물이 삭제되었습니다." })
  }

  const selectedQuestion = questions.find(q => q.id === selectedQuestionId)
  const questionAnswers = answers.filter(a => a.questionId === selectedQuestionId)

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <header className="sticky top-0 z-50 w-full premium-gradient border-b border-white/10 shadow-lg">
        <div className="max-w-6xl mx-auto px-4 h-20 flex items-center justify-between gap-4">
          <Logo className="flex-shrink-0" isLight />
          
          <div className="hidden md:flex flex-1 max-w-xl relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50 group-focus-within:text-accent transition-colors" />
            <Input 
              placeholder="HR 인사이트, 연봉 트렌드, 조직문화를 검색해보세요..." 
              className="pl-11 bg-white/10 border-none focus-visible:ring-accent/50 h-11 rounded-full text-sm text-white placeholder:text-white/40"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-1 md:gap-3">
            <Button variant="ghost" size="icon" className="text-white/70 hover:text-accent hover:bg-white/5">
              <Bell className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" className="text-white/70 hover:text-accent hover:bg-white/5">
              <UserIcon className="w-5 h-5" />
            </Button>
            {isAdminMode ? (
              <Button variant="outline" size="sm" onClick={() => setIsAdminMode(false)} className="h-8 border-accent/30 text-accent text-[10px] hover:bg-accent/10">
                ADMIN EXIT
              </Button>
            ) : (
              <Button variant="ghost" size="icon" onClick={() => setShowAdminDialog(true)} className="text-white/70 hover:text-accent hover:bg-white/5">
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
              피드로 돌아가기
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
                      alt="HR 관련 이미지" 
                      fill 
                      className="object-cover"
                    />
                  </div>
                )}
                
                <div className="flex gap-4 pt-6 border-t border-primary/5 text-xs text-muted-foreground">
                  <span>조회 {selectedQuestion.viewCount}</span>
                  <span>답변 {selectedQuestion.answerCount}</span>
                </div>
              </div>
            </article>

            <SubmissionForm 
              type="answer"
              placeholder="동료 HR 담당자들에게 따뜻한 조언이나 의견을 남겨주세요."
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
                  placeholder="인사, 교육, 총무, 조직문화 고민을 자유롭게 속삭여보세요."
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
                <h3 className="text-sm font-bold text-primary mb-4">HR 전용 서비스 가이드</h3>
                <div className="space-y-4">
                   <div className="space-y-1">
                      <p className="text-[13px] font-semibold text-foreground/90">철저한 익명 보장</p>
                      <p className="text-[12px] text-muted-foreground leading-snug">현직 담당자들의 민감한 고민을 위해 모든 활동은 비식별화되어 보호됩니다.</p>
                   </div>
                   <div className="space-y-1">
                      <p className="text-[13px] font-semibold text-foreground/90">카테고리별 전문 지식</p>
                      <p className="text-[12px] text-muted-foreground leading-snug">채용부터 평가, 복리후생까지 각 분야 전문가의 인사이트를 만나보세요.</p>
                   </div>
                   <div className="space-y-1">
                      <p className="text-[13px] font-semibold text-foreground/90">클린 비즈니스 커뮤니티</p>
                      <p className="text-[12px] text-muted-foreground leading-snug">전문가다운 상호 존중을 바탕으로 실질적인 해결책을 공유합니다.</p>
                   </div>
                </div>
              </div>

              <div className="px-2 text-[11px] text-muted-foreground/60 leading-relaxed text-center">
                <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 mb-3">
                  <span className="hover:text-primary cursor-pointer transition-colors">이용약관</span>
                  <span className="hover:text-primary cursor-pointer transition-colors">개인정보처리방침</span>
                  <span className="hover:text-primary cursor-pointer transition-colors">커뮤니티 가이드라인</span>
                </div>
                <p>© {new Date().getFullYear()} Chuchot HR. Premium Networking.</p>
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
              커뮤니티 운영 모드 활성화를 위해 인증 키를 입력하세요.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input 
              type="password" 
              placeholder="ADMIN ACCESS KEY" 
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              className="bg-primary/5 border-primary/10 placeholder:text-primary/40"
              onKeyDown={(e) => e.key === 'Enter' && handleAdminAuth()}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdminDialog(false)} className="border-primary/10">취소</Button>
            <Button onClick={handleAdminAuth}>인증</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
