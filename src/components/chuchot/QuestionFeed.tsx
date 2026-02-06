"use client"

import { Question } from "@/lib/types"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { MessageCircle, Eye, Clock, MoreHorizontal } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { ko } from "date-fns/locale"
import { Button } from "@/components/ui/button"
import Image from "next/image"

interface QuestionFeedProps {
  questions: Question[]
  onSelectQuestion: (id: string) => void
}

export function QuestionFeed({ questions, onSelectQuestion }: QuestionFeedProps) {
  const sortedQuestions = [...questions].sort((a, b) => b.createdAt - a.createdAt)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4 px-1">
        <div className="flex gap-4">
          <button className="text-sm font-bold text-primary border-b-2 border-primary pb-1">전체</button>
          <button className="text-sm font-medium text-muted-foreground hover:text-foreground pb-1 transition-colors">인기</button>
          <button className="text-sm font-medium text-muted-foreground hover:text-foreground pb-1 transition-colors">최신</button>
        </div>
      </div>
      
      {sortedQuestions.length === 0 ? (
        <Card className="glass-morphism border-dashed border-primary/20 p-12 text-center">
          <p className="text-muted-foreground">아직 속삭임이 없습니다. 첫 번째 이야기를 시작해보세요.</p>
        </Card>
      ) : (
        sortedQuestions.map((q) => (
          <Card 
            key={q.id} 
            className="bg-white border-primary/10 card-hover cursor-pointer rounded-2xl overflow-hidden shadow-sm"
            onClick={() => onSelectQuestion(q.id)}
          >
            <CardContent className="p-5 md:p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-[11px] font-bold text-primary border border-primary/20">
                    {q.nickname.substring(0, 1)}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-foreground/90">@{q.nickname}</span>
                    <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDistanceToNow(q.createdAt, { addSuffix: true, locale: ko })}
                    </span>
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:bg-primary/5">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </div>

              <div className="space-y-3">
                <h3 className="text-lg md:text-xl font-bold text-foreground group-hover:text-primary transition-colors">
                  {q.title}
                </h3>
                <p className="text-[14px] md:text-[15px] leading-relaxed text-muted-foreground whitespace-pre-wrap break-words line-clamp-2">
                  {q.text}
                </p>
                
                {q.imageUrl && (
                  <div className="relative w-full h-48 md:h-64 rounded-xl overflow-hidden border border-primary/5 bg-primary/5 mt-4">
                    <Image 
                      src={q.imageUrl} 
                      alt="속삭임 이미지" 
                      fill 
                      className="object-cover"
                      data-ai-hint="community post"
                    />
                  </div>
                )}
              </div>
            </CardContent>
            
            <CardFooter className="px-5 md:px-6 py-4 border-t border-primary/5 flex gap-6 bg-primary/[0.02]">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-primary transition-colors">
                <MessageCircle className="w-4 h-4" />
                댓글 {q.answerCount}
              </div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                <Eye className="w-4 h-4" />
                조회 {q.viewCount}
              </div>
            </CardFooter>
          </Card>
        ))
      )}
    </div>
  )
}
