"use client"

import { useState, useEffect, useMemo } from "react"
import { Logo } from "@/components/chuchot/Logo"
import { MainBanner } from "@/components/chuchot/MainBanner"
import { SubmissionForm } from "@/components/chuchot/SubmissionForm"
import { QuestionFeed } from "@/components/chuchot/QuestionFeed"
import { RankingList } from "@/components/chuchot/RankingList"
import { ShuChat } from "@/components/chuchot/ShuChat"
import { Question, Answer } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Bell, Search, User as UserIcon, Settings, Info } from "lucide-react"
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

export default function HomePage() {
  const [questions, setQuestions] = useState<Question[]>([])
  const [answers, setAnswers] = useState<Answer[]>([])
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(null)
  const [isAdminMode, setIsAdminMode] = useState(false)
  const [showAdminDialog, setShowAdminDialog] = useState(false)
  const [adminPassword, setAdminPassword] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState<"all" | "popular" | "waiting">("all")
  const { toast } = useToast()

  useEffect(() => {
    const initialQuestions: Question[] = [
      {
        id: "1",
        title: "2025년 HRD 트렌드: AI 리터러시 교육 설계",
        text: "내년도 교육 계획 수립 중인데, 전사 AI 리터러시 교육을 어떻게 설계하고 계신가요? 기술 교육 위주인지, 실제 업무 활용 사례 중심인지 궁금합니다.",
        nickname: "교육기획자K",
        viewCount: 1540,
        answerCount: 1,
        createdAt: Date.now() - 3600000 * 2,
        category: "L&D 전략",
        imageUrl: "https://images.unsplash.com/photo-1552664730-d307ca884978?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw4fHxtZWV0aW5nfGVufDB8fHx8MTc3MDM1NDM3N3ww&ixlib=rb-4.1.0&q=80&w=1080"
      },
      {
        id: "2",
        title: "팀장급 리더십 교육 효과 측정(ROI) 사례",
        text: "리더십 교육은 만족도 조사 외에 실제 행동 변화를 측정하기가 너무 어렵네요. 다면 평가나 현업 적용도 체크리스트 외에 좋은 방법이 있을까요?",
        nickname: "성과개발담당",
        viewCount: 920,
        answerCount: 0,
        category: "평가/ROI",
        createdAt: Date.now() - 3600000 * 5,
      },
      {
        id: "3",
        title: "MZ세대 타겟 온보딩 프로그램 아이디어 공유",
        text: "신규 입사자 이탈을 막기 위한 '임팩트 있는' 온보딩 프로그램을 기획 중입니다. 게이미피케이션 요소를 도입해보신 분 계신가요?",
        nickname: "조직문화L",
        viewCount: 2100,
        answerCount: 0,
        category: "온보딩",
        createdAt: Date.now() - 3600000 * 0.5,
        imageUrl: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwxNXx8ZWR1Y2F0aW9ufGVufDB8fHx8MTc3MDI4MTYxN3ww&ixlib=rb-4.1.0&q=80&w=1080"
      }
    ]
    setQuestions(initialQuestions)

    setAnswers([
      {
        id: "ai-initial",
        questionId: "1",
        text: "안녕하세요! 슈입니다. AI 리터러시 교육은 이제 선택이 아닌 필수죠. 최근에는 생성형 AI 도구를 활용한 '직무별 워크플로우 자동화' 실습 위주로 설계하는 추세입니다. 기술적인 이해도 중요하지만, 실제 업무 시간을 얼마나 단축할 수 있는지 체감하게 하는 것이 핵심이에요!",
        nickname: "슈 (AI)",
        createdAt: Date.now() - 3600000 * 1,
        avatarId: "sparkles"
      }
    ])
  }, [])

  const filteredQuestions = useMemo(() => {
    let result = questions.filter(q => 
      q.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.text.toLowerCase().includes(searchQuery.toLowerCase()) || 
      q.nickname.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.category?.toLowerCase().includes(searchQuery.toLowerCase())
    )

    if (activeTab === "popular") {
      result = result.sort((a, b) => b.viewCount - a.viewCount)
    } else if (activeTab === "waiting") {
      result = result.filter(q => q.answerCount === 0)
    } else {
      result = result.sort((a, b) => b.createdAt - a.createdAt)
    }

    return result
  }, [questions, searchQuery, activeTab])

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

    generateAiReply({ title, text }).then((res) => {
      const aiAnswer: Answer = {
        id: `ai-${Date.now()}`,
        questionId: newQuestion.id,
        text: res.replyText,
        nickname: "슈 (AI)",
        createdAt: Date.now(),
        avatarId: "sparkles",
      }
      setAnswers(prev => [aiAnswer, ...prev])
      setQuestions(prev => prev.map(q => 
        q.id === newQuestion.id ? { ...q, answerCount: q.answerCount + 1 } : q
      ))
    }).catch(err => {
      console.error("AI 답변 생성 실패:", err)
    })
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
    setAnswers(prev => [newAnswer, ...prev])
    setQuestions(prev => prev.map(q => 
      q.id === selectedQuestionId ? { ...q, answerCount: q.answerCount + 1 } : q
    ))
  }

  const handleSelectQuestion = (id: string) => {
    if (selectedQuestionId === id) {
      setSelectedQuestionId(null)
    } else {
      setSelectedQuestionId(id)
      setQuestions(prev => prev.map(q => 
        q.id === id ? { ...q, viewCount: q.viewCount + 1 } : q
      ))
    }
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

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <header className="sticky top-0 z-50 w-full premium-gradient border-b border-white/10 shadow-xl">
        <div className="max-w-6xl mx-auto px-4 h-20 flex items-center justify-between gap-4">
          <Logo className="flex-shrink-0" isLight />
          
          <div className="hidden md:flex flex-1 max-w-xl relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50 group-focus-within:text-accent transition-colors" />
            <Input 
              placeholder="HRD 트렌드, 과정 설계 사례, L&D 도구 검색..." 
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
            {isAdminMode && (
              <Button variant="outline" size="sm" onClick={() => setIsAdminMode(false)} className="h-8 border-accent/30 text-accent text-[10px] font-black hover:bg-accent/10">
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
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <main className="lg:col-span-8 space-y-10">
            <MainBanner />
            
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
              />
            </div>
          </main>

          <aside className="lg:col-span-4 space-y-8 hidden lg:block">
            <RankingList questions={topQuestions} onSelectQuestion={handleSelectQuestion} />
            
            <ShuChat />

            <div className="bg-white rounded-[2rem] p-8 border border-primary/5 shadow-xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-xl bg-accent/10">
                  <Info className="w-5 h-5 text-accent" />
                </div>
                <h3 className="text-lg font-black text-primary">HRD 현직자 플랫폼 가이드</h3>
              </div>
              <div className="space-y-6">
                 <div className="group space-y-2">
                    <p className="text-[15px] font-black text-primary group-hover:text-accent transition-colors flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-accent"></span>
                      철저한 비식별 익명 보장
                    </p>
                    <p className="text-[13px] text-primary/50 leading-relaxed font-medium pl-3.5">모든 활동은 암호화되어 보호되며, 교육 담당자들의 솔직한 소통을 지원합니다.</p>
                 </div>
                 <div className="group space-y-2">
                    <p className="text-[15px] font-black text-primary group-hover:text-accent transition-colors flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-accent"></span>
                      전문 L&D 카테고리
                    </p>
                    <p className="text-[13px] text-primary/50 leading-relaxed font-medium pl-3.5">교육 설계, 성과 평가, 리더십 육성 등 HRD 핵심 직무 인사이트를 제공합니다.</p>
                 </div>
              </div>
            </div>
          </aside>
        </div>
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
            <input 
              type="password" 
              placeholder="ADMIN ACCESS KEY" 
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              className="w-full bg-primary/5 border-none h-12 rounded-xl text-center font-black placeholder:text-primary/20 focus-visible:ring-accent/50 focus:outline-none focus:ring-2 focus:ring-accent/50"
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
