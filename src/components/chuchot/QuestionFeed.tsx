"use client"

import { Question } from "@/lib/types"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { MessageCircle, Eye, Clock, MoreHorizontal, Bookmark } from "lucide-react"
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
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6 px-2">
        <div className="flex gap-8">
          <button className="text-base font-black text-primary border-b-4 border-accent pb-2 transition-all">전체</button>
          <button className="text-base font-bold text-primary/30 hover:text-primary pb-2 transition-all">인기</button>
          <button className="text-base font-bold text-primary/30 hover:text-primary pb-2 transition-all">최신</button>
        </div>
      </div>
      
      {sortedQuestions.length === 0 ? (
        <Card className="glass-morphism border-dashed border-primary/10 p-20 text-center rounded-[2rem]">
          <p className="text-primary/40 font-bold">아직 아무도 속삭이지 않았습니다. 첫 번째 이야기를 시작해보세요.</p>
        </Card>
      ) : (
        sortedQuestions.map((q) => (
          <Card 
            key={q.id} 
            className="bg-white border-primary/5 card-hover cursor-pointer rounded-[1.5rem] overflow-hidden shadow-md"
            onClick={() => onSelectQuestion(q.id)}
          >
            <CardContent className="p-6 md:p-8">
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 rounded-2xl bg-primary/5 flex items-center justify-center text-xs font-black text-accent border border-accent/20">
                    {q.nickname.substring(0, 1).toUpperCase()}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-black text-primary">@{q.nickname}</span>
                    <span className="text-[11px] font-bold text-primary/40 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      {formatDistanceToNow(q.createdAt, { addSuffix: true, locale: ko })}
                    </span>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-9 w-9 text-primary/20 hover:text-accent hover:bg-accent/5">
                    <Bookmark className="w-5 h-5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-9 w-9 text-primary/20 hover:text-primary hover:bg-primary/5">
                    <MoreHorizontal className="w-5 h-5" />
                  </Button>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-xl md:text-2xl font-black text-primary group-hover:text-accent transition-colors leading-tight">
                  {q.title}
                </h3>
                <p className="text-base md:text-[17px] leading-relaxed text-primary/70 whitespace-pre-wrap break-words line-clamp-3 font-medium">
                  {q.text}
                </p>
                
                {q.imageUrl && (
                  <div className="relative w-full h-56 md:h-80 rounded-2xl overflow-hidden border-2 border-primary/5 bg-primary/5 mt-6 group/img">
                    <Image 
                      src={q.imageUrl} 
                      alt="속삭임 이미지" 
                      fill 
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                      data-ai-hint="community post"
                    />
                  </div>
                )}
              </div>
            </CardContent>
            
            <CardFooter className="px-6 md:px-8 py-5 border-t border-primary/5 flex gap-8 bg-primary/[0.01]">
              <div className="flex items-center gap-2 text-xs font-black text-primary/40 hover:text-accent transition-colors">
                <MessageCircle className="w-5 h-5" />
                댓글 {q.answerCount}
              </div>
              <div className="flex items-center gap-2 text-xs font-black text-primary/40">
                <Eye className="w-5 h-5" />
                조회 {q.viewCount}
              </div>
            </CardFooter>
          </Card>
        ))
      )}
    </div>
  )
}
