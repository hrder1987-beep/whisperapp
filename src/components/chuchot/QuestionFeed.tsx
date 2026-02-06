
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
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-4 px-1">
        <div className="flex gap-4">
          <button className="text-sm font-bold text-primary border-b-2 border-primary pb-1">전체</button>
          <button className="text-sm font-medium text-muted-foreground hover:text-foreground pb-1">인기</button>
          <button className="text-sm font-medium text-muted-foreground hover:text-foreground pb-1">최신</button>
        </div>
      </div>
      
      {sortedQuestions.length === 0 ? (
        <Card className="glass-morphism border-dashed border-white/10 p-12 text-center">
          <p className="text-muted-foreground">아직 속삭임이 없습니다. 첫 번째 이야기를 시작해보세요.</p>
        </Card>
      ) : (
        sortedQuestions.map((q) => (
          <Card 
            key={q.id} 
            className="bg-card border-white/5 hover:bg-white/[0.03] transition-colors cursor-pointer rounded-none md:rounded-xl overflow-hidden shadow-sm"
            onClick={() => onSelectQuestion(q.id)}
          >
            <CardContent className="p-5 md:p-6">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold text-primary border border-primary/20">
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
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </div>

              <div className="space-y-4">
                <p className="text-[15px] md:text-base leading-relaxed text-foreground/90 whitespace-pre-wrap break-words line-clamp-4">
                  {q.text}
                </p>
                
                {q.imageUrl && (
                  <div className="relative w-full aspect-video rounded-lg overflow-hidden border border-white/5 bg-black/20">
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
            
            <CardFooter className="px-5 md:px-6 py-3 border-t border-white/5 flex gap-5 bg-white/[0.01]">
              <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-primary transition-colors">
                <MessageCircle className="w-4 h-4" />
                댓글 {q.answerCount}
              </div>
              <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
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
