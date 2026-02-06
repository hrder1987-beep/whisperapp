
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
import { ChevronLeft, ShieldCheck, Settings, Search } from "lucide-react"
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
        text: "진정한 행복의 비결은 무엇이라고 생각하시나요?",
        nickname: "행복찾기",
        viewCount: 124,
        answerCount: 2,
        createdAt: Date.now() - 3600000 * 2,
        imageUrl: "https://images.unsplash.com/photo-1477840539360-4a1d23071046?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw0fHxuaWdodCUyMHNreXxlbnwwfHx8fDE3NzAyODE2MTd8MA&ixlib=rb-4.1.0&q=80&w=1080"
      },
      {
        id: "2",
        text: "과거의 자신에게 딱 한 마디만 속삭일 수 있다면 무엇을 말해주고 싶나요?",
        nickname: "시간여행자",
        viewCount: 89,
        answerCount: 1,
        createdAt: Date.now() - 3600000 * 5,
      },
      {
        id: "3",
        text: "딥 그린과 골드 조합은 왜 이렇게 고급스럽고 매력적일까요?",
        nickname: "디자이너",
        viewCount: 210,
        answerCount: 0,
        createdAt: Date.now() - 3600000 * 0.5,
        imageUrl: "https://images.unsplash.com/photo-1758179761324-63b474fe55a0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw4fHxwZWFjZWZ1bCUyMGZvcmVzdHxlbnwwfHx8fDE3NzAzNTQzNzd8MA&ixlib=rb-4.1.0&q=80&w=1080"
      },
      ...Array.from({ length: 10 }).map((_, i) => ({
        id: `dummy-${i}`,
        text: `${i + 4}번째로 올라온 익명의 속삭임입니다. 더 많은 이야기가 준비되어 있어요.`,
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
      q.text.toLowerCase().includes(searchQuery.toLowerCase()) || 
      q.nickname.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [questions, searchQuery])

  const topQuestions = useMemo(() => {
    return [...questions].sort((a, b) => b.viewCount - a.viewCount).slice(0, 10)
  }, [questions])

  const handleAddQuestion = (nickname: string, text: string, imageUrl?: string) => {
    const newQuestion: Question = {
      id: Math.random().toString(36).substr(2, 9),
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
    <div className="max-w-6xl mx-auto px-4 py-8 md:py-12">
      <header className="flex flex-col md:flex-row items-center justify-between mb-8 gap-6">
        <Logo />
        
        <div className="flex-1 w-full max-w-xl relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input 
            placeholder="관심 있는 내용을 검색해보세요..." 
            className="pl-11 bg-white/5 border-white/10 focus-visible:ring-primary h-12 rounded-full"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex gap-2">
          {isAdminMode ? (
            <div className="flex items-center gap-2 px-3 py-1 bg-primary/20 rounded-full border border-primary/30 text-xs font-bold text-primary animate-pulse">
              <ShieldCheck className="w-3 h-3" /> 관리자 모드
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-6 p-1 text-[10px] hover:text-primary"
                onClick={() => setIsAdminMode(false)}
              >
                종료
              </Button>
            </div>
          ) : (
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-primary/50 hover:text-primary transition-colors"
              onClick={() => setShowAdminDialog(true)}
            >
              <Settings className="w-5 h-5" />
            </Button>
          )}
        </div>
      </header>

      {selectedQuestionId && selectedQuestion ? (
        <div className="max-w-4xl mx-auto animate-in slide-in-from-right-4 duration-500">
          <Button 
            variant="ghost" 
            className="mb-8 text-primary hover:text-primary/80 group pl-0"
            onClick={() => setSelectedQuestionId(null)}
          >
            <ChevronLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
            피드로 돌아가기
          </Button>

          <div className="glass-morphism border-primary p-0 rounded-2xl mb-8 relative overflow-hidden">
            {isAdminMode && (
              <Button 
                variant="destructive" 
                size="sm" 
                className="absolute top-4 right-4 h-7 text-[10px] z-20"
                onClick={() => handleDeleteQuestion(selectedQuestion.id)}
              >
                삭제하기
              </Button>
            )}
            
            <div className="p-8">
              <div className="flex justify-between items-start mb-6">
                <span className="text-primary font-bold text-lg">@{selectedQuestion.nickname}</span>
                <span className="text-muted-foreground text-sm">
                  작성일: {new Date(selectedQuestion.createdAt).toLocaleDateString()}
                </span>
              </div>
              <h1 className="text-3xl font-headline font-bold text-foreground leading-tight mb-6 break-words whitespace-pre-wrap">
                {selectedQuestion.text}
              </h1>
            </div>

            {selectedQuestion.imageUrl && (
              <div className="relative w-full aspect-video border-t border-white/5">
                <Image 
                  src={selectedQuestion.imageUrl} 
                  alt="상세 이미지" 
                  fill 
                  className="object-cover"
                  data-ai-hint="post detail"
                />
              </div>
            )}
          </div>

          <SubmissionForm 
            type="answer"
            placeholder="이 속삭임에 답글을 남겨주세요..."
            onSubmit={handleAddAnswer}
          />

          <AnswerFeed answers={questionAnswers} />
        </div>
      ) : (
        <div className="animate-in fade-in duration-700">
          <MainBanner />
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            <div className="lg:col-span-8">
              <div className="mb-12">
                <h2 className="text-3xl font-headline font-bold mb-4 tracking-tight">
                  지금 무슨 생각을 하고 있나요?
                </h2>
                <p className="text-muted-foreground text-lg mb-8 max-w-xl">
                  글자 수 제한 없이 당신의 깊은 속삭임을 들려주세요.
                </p>
                <SubmissionForm 
                  type="question"
                  placeholder="당신만의 특별한 속삭임을 자유롭게 남겨보세요..."
                  onSubmit={handleAddQuestion}
                />
              </div>

              <div className="relative">
                 {isAdminMode && (
                  <p className="text-[10px] text-primary/40 mb-2 uppercase tracking-widest text-center">
                    유지관리 모드 활성화됨 - 관리하려면 속삭임을 클릭하세요
                  </p>
                )}
                <QuestionFeed 
                  questions={filteredQuestions} 
                  onSelectQuestion={handleSelectQuestion} 
                />
              </div>
            </div>

            <aside className="lg:col-span-4 space-y-8">
              <RankingList questions={topQuestions} onSelectQuestion={handleSelectQuestion} />
              
              <div className="glass-morphism rounded-2xl p-6 border-primary/10">
                <h3 className="text-lg font-bold text-primary mb-4">슈쇼 이용 팁</h3>
                <ul className="text-sm text-muted-foreground space-y-3">
                  <li className="flex gap-2">
                    <span className="text-primary font-bold">1.</span>
                    완전한 익명성이 보장되니 안심하고 속삭이세요.
                  </li>
                  <li className="flex gap-2">
                    <span className="text-primary font-bold">2.</span>
                    사진을 함께 올리면 더 많은 주목을 받을 수 있어요.
                  </li>
                  <li className="flex gap-2">
                    <span className="text-primary font-bold">3.</span>
                    길이에 상관없이 하고 싶은 말을 모두 적어보세요.
                  </li>
                </ul>
              </div>
            </aside>
          </div>
        </div>
      )}

      {/* Admin Auth Dialog */}
      <Dialog open={showAdminDialog} onOpenChange={setShowAdminDialog}>
        <DialogContent className="glass-morphism border-primary/30 text-foreground">
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
              className="bg-white/5 border-white/10"
              onKeyDown={(e) => e.key === 'Enter' && handleAdminAuth()}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdminDialog(false)} className="border-white/10 text-foreground">취소</Button>
            <Button onClick={handleAdminAuth} className="bg-primary text-primary-foreground">인증하기</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <footer className="mt-24 pt-8 border-t border-white/5 text-center text-muted-foreground text-sm">
        <p>© {new Date().getFullYear()} Chuchot (슈쇼). 진심 어린 속삭임을 위해.</p>
        <div className="flex justify-center gap-4 mt-4">
          <span className="hover:text-primary cursor-pointer transition-colors">개인정보 처리방침</span>
          <span className="hover:text-primary cursor-pointer transition-colors">이용약관</span>
          <span className="hover:text-primary cursor-pointer transition-colors">고객지원</span>
        </div>
      </footer>
    </div>
  )
}
