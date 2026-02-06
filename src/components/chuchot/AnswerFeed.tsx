"use client"

import { Answer } from "@/lib/types"
import { Card, CardContent } from "@/components/ui/card"
import { formatDistanceToNow } from "date-fns"
import { ko } from "date-fns/locale"
import { Clock } from "lucide-react"

interface AnswerFeedProps {
  answers: Answer[]
}

export function AnswerFeed({ answers }: AnswerFeedProps) {
  const sortedAnswers = [...answers].sort((a, b) => b.createdAt - a.createdAt)

  return (
    <div className="mt-8 space-y-4">
      <h3 className="text-lg font-semibold text-primary mb-4 flex items-center gap-2">
        답글 ({answers.length})
      </h3>
      
      {sortedAnswers.length === 0 ? (
        <p className="text-muted-foreground text-center py-8">이 속삭임에 첫 번째 답글을 남겨보세요.</p>
      ) : (
        sortedAnswers.map((a) => (
          <Card key={a.id} className="bg-card border-black/5 shadow-sm">
            <CardContent className="p-4">
              <div className="flex justify-between items-center mb-2 text-xs">
                <span className="text-primary font-medium italic">@{a.nickname}</span>
                <span className="text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatDistanceToNow(a.createdAt, { addSuffix: true, locale: ko })}
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