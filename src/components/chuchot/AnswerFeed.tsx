"use client"

import { Answer } from "@/lib/types"
import { Card, CardContent } from "@/components/ui/card"
import { formatDistanceToNow } from "date-fns"
import { Clock } from "lucide-react"

interface AnswerFeedProps {
  answers: Answer[]
}

export function AnswerFeed({ answers }: AnswerFeedProps) {
  const sortedAnswers = [...answers].sort((a, b) => b.createdAt - a.createdAt)

  return (
    <div className="mt-8 space-y-4">
      <h3 className="text-lg font-semibold text-primary mb-4 flex items-center gap-2">
        Replies ({answers.length})
      </h3>
      
      {sortedAnswers.length === 0 ? (
        <p className="text-muted-foreground text-center py-8">Be the first to reply to this whisper.</p>
      ) : (
        sortedAnswers.map((a) => (
          <Card key={a.id} className="glass-morphism border-white/5 bg-white/5">
            <CardContent className="p-4">
              <div className="flex justify-between items-center mb-2 text-xs">
                <span className="text-primary font-medium italic">@{a.nickname}</span>
                <span className="text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatDistanceToNow(a.createdAt)} ago
                </span>
              </div>
              <p className="text-base text-foreground/90 leading-relaxed">
                {a.text}
              </p>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  )
}