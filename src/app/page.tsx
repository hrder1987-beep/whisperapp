"use client"

import { useState, useEffect } from "react"
import { Logo } from "@/components/chuchot/Logo"
import { BestQuestionsBanner } from "@/components/chuchot/BestQuestionsBanner"
import { SubmissionForm } from "@/components/chuchot/SubmissionForm"
import { QuestionFeed } from "@/components/chuchot/QuestionFeed"
import { AnswerFeed } from "@/components/chuchot/AnswerFeed"
import { Question, Answer } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ShieldCheck, Settings } from "lucide-react"
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

export default function HomePage() {
  const [questions, setQuestions] = useState<Question[]>([])
  const [answers, setAnswers] = useState<Answer[]>([])
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(null)
  const [isAdminMode, setIsAdminMode] = useState(false)
  const [showAdminDialog, setShowAdminDialog] = useState(false)
  const [adminPassword, setAdminPassword] = useState("")
  const { toast } = useToast()

  // Initial mock data
  useEffect(() => {
    const initialQuestions: Question[] = [
      {
        id: "1",
        text: "What is the secret to true happiness?",
        nickname: "Seeker",
        viewCount: 124,
        answerCount: 2,
        createdAt: Date.now() - 3600000 * 2,
      },
      {
        id: "2",
        text: "If you could whisper one thing to your younger self, what would it be?",
        nickname: "TimeTraveler",
        viewCount: 89,
        answerCount: 1,
        createdAt: Date.now() - 3600000 * 5,
      },
      {
        id: "3",
        text: "Why is the deep green and gold combination so addictive to look at?",
        nickname: "Designer",
        viewCount: 210,
        answerCount: 0,
        createdAt: Date.now() - 3600000 * 0.5,
      }
    ]
    setQuestions(initialQuestions)
  }, [])

  const handleAddQuestion = (nickname: string, text: string) => {
    const newQuestion: Question = {
      id: Math.random().toString(36).substr(2, 9),
      text,
      nickname,
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
      toast({ title: "Admin Mode Enabled", description: "You now have maintenance privileges." })
    } else {
      toast({ title: "Access Denied", description: "Incorrect maintenance key.", variant: "destructive" })
    }
    setAdminPassword("")
  }

  const handleDeleteQuestion = (id: string) => {
    setQuestions(questions.filter(q => q.id !== id))
    setAnswers(answers.filter(a => a.questionId !== id))
    if (selectedQuestionId === id) setSelectedQuestionId(null)
    toast({ title: "Whisper Deleted", description: "Maintenance action complete." })
  }

  const selectedQuestion = questions.find(q => q.id === selectedQuestionId)
  const questionAnswers = answers.filter(a => a.questionId === selectedQuestionId)

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 md:py-16">
      <header className="flex items-center justify-between mb-12">
        <Logo />
        <div className="flex gap-2">
          {isAdminMode ? (
            <div className="flex items-center gap-2 px-3 py-1 bg-primary/20 rounded-full border border-primary/30 text-xs font-bold text-primary animate-pulse">
              <ShieldCheck className="w-3 h-3" /> ADMIN MODE
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-6 p-1 text-[10px] hover:text-primary"
                onClick={() => setIsAdminMode(false)}
              >
                Exit
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
        <div className="animate-in slide-in-from-right-4 duration-500">
          <Button 
            variant="ghost" 
            className="mb-8 text-primary hover:text-primary/80 group pl-0"
            onClick={() => setSelectedQuestionId(null)}
          >
            <ChevronLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
            Back to Feed
          </Button>

          <div className="glass-morphism border-primary p-8 rounded-2xl mb-8 relative">
            {isAdminMode && (
              <Button 
                variant="destructive" 
                size="sm" 
                className="absolute top-4 right-4 h-7 text-[10px]"
                onClick={() => handleDeleteQuestion(selectedQuestion.id)}
              >
                Delete
              </Button>
            )}
            <div className="flex justify-between items-start mb-6">
              <span className="text-primary font-bold text-lg">@{selectedQuestion.nickname}</span>
              <span className="text-muted-foreground text-sm">
                Asked {new Date(selectedQuestion.createdAt).toLocaleDateString()}
              </span>
            </div>
            <h1 className="text-3xl font-headline font-bold text-foreground leading-tight">
              {selectedQuestion.text}
            </h1>
          </div>

          <SubmissionForm 
            type="answer"
            placeholder="Whisper your answer here..."
            onSubmit={handleAddAnswer}
          />

          <AnswerFeed answers={questionAnswers} />
        </div>
      ) : (
        <div className="animate-in fade-in duration-700">
          <BestQuestionsBanner questions={questions} />
          
          <div className="mb-16">
            <h2 className="text-4xl font-headline font-bold mb-4 tracking-tight">
              What's on your mind?
            </h2>
            <p className="text-muted-foreground text-lg mb-8 max-w-xl">
              Share your thoughts, questions, or secrets with the world—completely anonymously.
            </p>
            <SubmissionForm 
              type="question"
              placeholder="Ask anything anonymously..."
              onSubmit={handleAddQuestion}
            />
          </div>

          <div className="relative">
             {isAdminMode && (
              <p className="text-[10px] text-primary/40 mb-2 uppercase tracking-widest text-center">
                Maintenance Controls Active - Click whispers to manage
              </p>
            )}
            <QuestionFeed 
              questions={questions} 
              onSelectQuestion={handleSelectQuestion} 
            />
          </div>
        </div>
      )}

      {/* Admin Auth Dialog */}
      <Dialog open={showAdminDialog} onOpenChange={setShowAdminDialog}>
        <DialogContent className="glass-morphism border-primary/30 text-foreground">
          <DialogHeader>
            <DialogTitle className="text-primary">Admin Access</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Enter the maintenance key to enable Admin Mode.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input 
              type="password" 
              placeholder="Enter key..." 
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              className="bg-white/5 border-white/10"
              onKeyDown={(e) => e.key === 'Enter' && handleAdminAuth()}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdminDialog(false)} className="border-white/10 text-foreground">Cancel</Button>
            <Button onClick={handleAdminAuth} className="bg-primary text-primary-foreground">Authorize</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <footer className="mt-24 pt-8 border-t border-white/5 text-center text-muted-foreground text-sm">
        <p>© {new Date().getFullYear()} Chuchot. Built for whispers.</p>
        <div className="flex justify-center gap-4 mt-4">
          <span className="hover:text-primary cursor-pointer transition-colors">Privacy</span>
          <span className="hover:text-primary cursor-pointer transition-colors">Terms</span>
          <span className="hover:text-primary cursor-pointer transition-colors">Help</span>
        </div>
      </footer>
    </div>
  )
}