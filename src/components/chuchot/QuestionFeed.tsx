"use client"

import { Question } from "@/lib/types"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { MessageCircle, Eye, Clock } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { Button } from "@/components/ui/button"

interface QuestionFeedProps {
  questions: Question[]
  onSelectQuestion: (id: string) => void
}

export function QuestionFeed({ questions, onSelectQuestion }: QuestionFeedProps) {
  const sortedQuestions = [...questions].sort((a, b) => b.createdAt - a.createdAt)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-primary">Live Feed</h3>
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
          Real-time
        </span>
      </div>
      
      {sortedQuestions.length === 0 ? (
        <Card className="glass-morphism border-dashed border-white/10 p-12 text-center">
          <p className="text-muted-foreground">No whispers yet. Be the first to speak.</p>
        </Card>
      ) : (
        sortedQuestions.map((q) => (
          <Card 
            key={q.id} 
            className="glass-morphism border-white/5 hover:border-primary/30 transition-all duration-300 group cursor-pointer"
            onClick={() => onSelectQuestion(q.id)}
          >
            <CardContent className="p-6">
              <div className="flex justify-between items-center mb-4 text-xs">
                <span className="text-primary font-semibold">@{q.nickname}</span>
                <span className="text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatDistanceToNow(q.createdAt)} ago
                </span>
              </div>
              <p className="text-lg leading-relaxed mb-6 group-hover:translate-x-1 transition-transform">
                {q.text}
              </p>
            </CardContent>
            <CardFooter className="px-6 py-4 bg-white/5 border-t border-white/5 flex gap-4">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Eye className="w-4 h-4" />
                {q.viewCount} views
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <MessageCircle className="w-4 h-4" />
                {q.answerCount} answers
              </div>
              <Button 
                variant="link" 
                className="ml-auto text-primary hover:text-primary/80 h-auto p-0 text-xs"
              >
                Whisper back →
              </Button>
            </CardFooter>
          </Card>
        ))
      )}
    </div>
  )
}