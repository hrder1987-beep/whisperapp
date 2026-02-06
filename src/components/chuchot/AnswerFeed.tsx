
"use client"

import { Answer } from "@/lib/types"
import { Card, CardContent } from "@/components/ui/card"
import { formatDistanceToNow } from "date-fns"
import { ko } from "date-fns/locale"
import { Clock, Trash2 } from "lucide-react"
import { AvatarIcon } from "./AvatarIcon"
import { Button } from "@/components/ui/button"

interface AnswerFeedProps {
  answers: Answer[]
  isAdminMode?: boolean
  onDeleteAnswer?: (id: string) => void
}

export function AnswerFeed({ answers, isAdminMode = false, onDeleteAnswer }: AnswerFeedProps) {
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
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-2">
                  <AvatarIcon seed={a.nickname} className="w-7 h-7" />
                  <span className="text-primary font-bold text-sm">@{a.nickname}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-muted-foreground flex items-center gap-1 text-[10px]">
                    <Clock className="w-3 h-3" />
                    {formatDistanceToNow(a.createdAt, { addSuffix: true, locale: ko })}
                  </span>
                  {isAdminMode && (
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="w-6 h-6 text-red-300 hover:text-red-500 hover:bg-red-50 rounded-full"
                      onClick={() => onDeleteAnswer?.(a.id)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </div>
              </div>
              <p className="text-base text-foreground/90 leading-relaxed pl-9">
                {a.text}
              </p>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  )
}
