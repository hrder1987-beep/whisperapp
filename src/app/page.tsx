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
import { ChevronLeft, Bell, Search, User as UserIcon, Settings, Info, Eye, MessageCircle } from "lucide-react"
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
        title: "2024년 하반기 IT 기업 연봉 인상률 트렌드",
        text: "다른 기업들은 올해 인상률을 어느 정도로 잡고 계신가요? 3~5% 내외가 대세인지, 아니면 동결 기조인지 궁금합니다.",
        nickname: "인사팀장A",
        viewCount: 1240,
        answerCount: 8,
        createdAt: Date.now() - 3600000 * 2,
        category: "평가/보상",
        imageUrl: "https://images.unsplash.com/photo-1454165833767-1316b0215b3f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw0fHxocmFkbWluJTIwb2ZmaWNlfGVufDB8fHx8MTc3MDI4MTYxN3ww&ixlib=rb-4.1.0&q=80&w=1080"
      },
      {
        id: "2",
        title: "신입 사원 온보딩 프로그램 추천 부탁드려요.",
        text: "단순 교육 말고, 회사에 정말 '스며들 수 있게' 하는 좋은 장치가 있을까요? 웰컴 키트 외에 추천할 만한 프로그램이 있다면 공유 부탁드립니다.",
        nickname: "교육담당자",
        viewCount: 890,
        answerCount: 12,
        category: "교육/L&D",
        createdAt: Date.now() - 3600000 * 5,
      },
      {
        id: "3",
        title: "주 4일제 도입 시 근태 관리 리스크",
        text: "총무 및 근태 관리 측면에서 주 4일제 도입 시 가장 큰 허들이 무엇이었나요? 경험 있으신 담당자분들의 조언이 절실합니다.",
        nickname: "총무관리자",
        viewCount: 2100,
        answerCount: 5,
        category: "총무/GA",
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
      q.nickname.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.category?.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [questions, searchQuery])

  const topQuestions = useMemo(() => {
    return [...questions].sort((a, b) => b.viewCount - a.viewCount).slice(0, 5)
  }, [questions])

  const handleAddQuestion = (nickname: string, title: string, text: string, imageUrl?: string, category?: string) => {
    const newQuestion: Question = {
      id: Math.random().toString(36).substr(2, 9),
      title,
      text,
      nickname,
      imageUrl,
      category,
      viewCount: 0,
      answerCount: 0,
      createdAt: Date.now(),
    }
    setQuestions([newQuestion, ...questions])
  }

  const handleAddAnswer = (nickname: string, title: string, text: string) => {
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
      <header className="sticky top-0 z-50 w-full premium-gradient border-b border-white/10 shadow-xl">
        <div className="max-w-6xl mx-auto px-4 h-20 flex items-center justify-between gap-4">
          <Logo className="flex-shrink-0" isLight />
          
          <div className="hidden md:flex flex-1 max-w-xl relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50 group-focus-within:text-accent transition-colors" />
            <Input 
              placeholder="HR 트렌드, 직무 카테고리 등 검색..." 
              className="pl-11 bg-white/10 border-none focus-visible:ring-accent/50 h-11 rounded-full text-sm text-white placeholder:text-white/40"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-1 md:gap-3">
            <Button variant="ghost" size="icon" className="text-white/70 hover:text-accent hover:bg-white/5 rounded-full">
              <Bell className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" className="text-white/70 hover:text-accent hover:bg-white/5 rounded-full">
              <UserIcon className="w-5 h-5" />
            </Button>
            {isAdminMode ? (
              <Button variant="outline" size="sm" onClick={() => setIsAdminMode(false)} className="h-8 border-accent/30 text-accent text-[10px] font-black hover:bg-accent/10">
                ADMIN EXIT
              </Button>
            ) : (
              <Button variant="ghost" size="icon" onClick={() => setShowAdminDialog(true)} className="text-white/70 hover:text-accent hover:bg-white/5 rounded-full">
                <Settings className="w-5 h-5" />
              </Button>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8 md:py-12">
        {selectedQuestionId && selectedQuestion ? (
          <div className="max-w-3xl mx-auto animate-in fade-in slide-in-from-right-8 duration-700">
            <Button 
              variant="ghost" 
              className="mb-8 text-primary font-bold hover:text-accent group pl-0 hover:bg-transparent"
              onClick={() => setSelectedQuestionId(null)}
            >
              <ChevronLeft className="w-5 h-5 mr-1 group-hover:-translate-x-1 transition-transform" />
              전체 피드로 돌아가기
            </Button>

            <article className="bg-white border border-primary/5 rounded-[2rem] overflow-hidden mb-8 shadow-2xl">
              <div className="p-8 md:p-12">
                <div className="flex justify-between items-start mb-8">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-primary/5 flex items-center justify-center text-sm font-black text-primary border border-primary/10 shadow-inner">
                      {selectedQuestion.nickname.substring(0, 1)}
                    </div>
                    <div>
                      <h3 className="font-black text-primary text-lg">@{selectedQuestion.nickname}</h3>
                      <p className="text-[12px] font-bold text-primary/30">
                        {new Date(selectedQuestion.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  {selectedQuestion.category && (
                    <div className="px-4 py-1.5 rounded-full bg-accent text-primary font-black text-[12px]">
                      #{selectedQuestion.category}
                    </div>
                  )}
                </div>
                
                <h1 className="text-3xl md:text-4xl font-black text-primary leading-tight mb-8 tracking-tighter">
                  {selectedQuestion.title}
                </h1>

                <p className="text-lg md:text-xl text-primary/80 leading-[1.8] mb-10 break-words whitespace-pre-wrap font-medium">
                  {selectedQuestion.text}
                </p>

                {selectedQuestion.imageUrl && (
                  <div className="relative w-full aspect-[16/9] rounded-[2rem] overflow-hidden border border-primary/5 bg-primary/5 mb-10 shadow-lg">
                    <Image 
                      src={selectedQuestion.imageUrl} 
                      alt="HR 관련 이미지" 
                      fill 
                      className="object-cover"
                    />
                  </div>
                )}
                
                <div className="flex gap-6 pt-8 border-t border-primary/5 text-[13px] font-black text-primary/30">
                  <span className="flex items-center gap-2"><Eye className="w-4 h-4"/> 조회 {selectedQuestion.viewCount}</span>
                  <span className="flex items-center gap-2"><MessageCircle className="w-4 h-4"/> 답변 {selectedQuestion.answerCount}</span>
                </div>
              </div>
            </article>

            <SubmissionForm 
              type="answer"
              placeholder="동료 HR 현직자들에게 따뜻한 조언이나 지식을 공유해주세요."
              onSubmit={handleAddAnswer}
            />

            <AnswerFeed answers={questionAnswers} />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            <main className="lg:col-span-8 space-y-10">
              <MainBanner />
              
              <div className="space-y-10">
                <SubmissionForm 
                  type="question"
                  placeholder="인사, 교육, 총무 등 HR 관련 고민이나 정보를 자유롭게 속삭여보세요."
                  onSubmit={handleAddQuestion}
                />

                <QuestionFeed 
                  questions={filteredQuestions} 
                  onSelectQuestion={handleSelectQuestion} 
                />
              </div>
            </main>

            <aside className="lg:col-span-4 space-y-8 hidden lg:block">
              <RankingList questions={topQuestions} onSelectQuestion={handleSelectQuestion} />
              
              <div className="bg-white rounded-[2rem] p-8 border border-primary/5 shadow-xl">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 rounded-xl bg-accent/10">
                    <Info className="w-5 h-5 text-accent" />
                  </div>
                  <h3 className="text-lg font-black text-primary">HR 현직자 플랫폼 가이드</h3>
                </div>
                <div className="space-y-6">
                   <div className="group space-y-2">
                      <p className="text-[15px] font-black text-primary group-hover:text-accent transition-colors flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-accent"></span>
                        철저한 비식별 익명 보장
                      </p>
                      <p className="text-[13px] text-primary/50 leading-relaxed font-medium pl-3.5">모든 활동은 암호화되어 보호되며, 현직 담당자들의 안전한 소통을 최우선으로 합니다.</p>
                   </div>
                   <div className="group space-y-2">
                      <p className="text-[15px] font-black text-primary group-hover:text-accent transition-colors flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-accent"></span>
                        전문 직무 카테고리
                      </p>
                      <p className="text-[13px] text-primary/50 leading-relaxed font-medium pl-3.5">인사, 교육, 평가, 복리후생 등 각 분야 현직자들의 실질적인 인사이트를 제공합니다.</p>
                   </div>
                </div>
              </div>
            </aside>
          </div>
        )}
      </div>

      <Dialog open={showAdminDialog} onOpenChange={setShowAdminDialog}>
        <DialogContent className="bg-white border-primary/20 rounded-[2rem] p-8">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black text-primary">관리자 인증</DialogTitle>
            <DialogDescription className="text-primary/40 font-bold">
              안전한 커뮤니티 운영을 위해 인증 키를 입력해 주세요.
            </DialogDescription>
          </DialogHeader>
          <div className="py-6">
            <Input 
              type="password" 
              placeholder="ADMIN ACCESS KEY" 
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              className="bg-primary/5 border-none h-12 rounded-xl text-center font-black placeholder:text-primary/20 focus-visible:ring-accent/50"
              onKeyDown={(e) => e.key === 'Enter' && handleAdminAuth()}
            />
          </div>
          <DialogFooter className="flex gap-2">
            <Button variant="ghost" onClick={() => setShowAdminDialog(false)} className="font-bold">취소</Button>
            <Button onClick={handleAdminAuth} className="bg-primary text-accent font-black px-8">인증 완료</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
