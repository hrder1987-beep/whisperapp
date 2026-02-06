"use client"

import { Question } from "@/lib/types"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { MessageCircle, Eye, Clock, Bookmark, Hash } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { ko } from "date-fns/locale"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import { AvatarIcon } from "./AvatarIcon"
import { Badge } from "@/components/ui/badge"

interface QuestionFeedProps {
  questions: Question[]
  onSelectQuestion: (id: string) => void
}

export function QuestionFeed({ questions, onSelectQuestion }: QuestionFeedProps) {
  const sortedQuestions = [...questions].sort((a, b) => b.createdAt - a.createdAt)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4 px-1">
        <div className="flex gap-6">
          <button className="text-[17px] font-black text-primary border-b-[3px] border-accent pb-2 transition-all">전체</button>
          <button className="text-[17px] font-bold text-primary/30 hover:text-primary pb-2 transition-all">인기</button>
          <button className="text-[17px] font-bold text-primary/30 hover:text-primary pb-2 transition-all">답변대기</button>
        </div>
      </div>
      
      {sortedQuestions.length === 0 ? (
        <Card className="bg-white border-dashed border-primary/10 p-24 text-center rounded-[2.5rem]">
          <p className="text-primary/30 font-bold text-lg">아직 등록된 속삭임이 없습니다.</p>
        </Card>
      ) : (
        sortedQuestions.map((q) => (
          <Card 
            key={q.id} 
            className="group bg-white border-primary/5 hover:border-accent/20 transition-all duration-300 cursor-pointer rounded-[1.5rem] overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1"
            onClick={() => onSelectQuestion(q.id)}
          >
            <CardContent className="p-7 md:p-9">
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-4">
                  <AvatarIcon seed={q.nickname} className="w-12 h-12 shadow-md border-2 border-primary/5" />
                  <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-[15px] font-black text-primary">@{q.nickname}</span>
                      <Badge variant="secondary" className="bg-primary/5 text-[10px] text-primary/60 font-bold border-none px-2 py-0">HR 현직자</Badge>
                    </div>
                    <span className="text-[12px] font-medium text-primary/40 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      {formatDistanceToNow(q.createdAt, { addSuffix: true, locale: ko })}
                    </span>
                  </div>
                </div>
                {q.category && (
                  <Badge className="bg-accent/10 text-accent font-black border-none px-3 py-1 rounded-full text-[11px]">
                    #{q.category}
                  </Badge>
                )}
              </div>

              <div className="space-y-4">
                <h3 className="text-2xl md:text-[26px] font-black text-primary group-hover:text-accent transition-colors leading-[1.3] tracking-tight">
                  {q.title}
                </h3>
                <p className="text-base md:text-[18px] leading-relaxed text-primary/70 whitespace-pre-wrap break-words line-clamp-3 font-medium">
                  {q.text}
                </p>
                
                {q.imageUrl && (
                  <div className="relative w-full h-64 md:h-96 rounded-2xl overflow-hidden border border-primary/5 bg-primary/5 mt-8 group/img">
                    <Image 
                      src={q.imageUrl} 
                      alt="속삭임 이미지" 
                      fill 
                      className="object-cover transition-transform duration-1000 group-hover:scale-110"
                    />
                  </div>
                )}
              </div>
            </CardContent>
            
            <CardFooter className="px-7 md:px-9 py-6 border-t border-primary/5 flex items-center justify-between bg-primary/[0.01]">
              <div className="flex gap-8">
                <div className="flex items-center gap-2.5 text-sm font-black text-primary/40 group-hover:text-accent transition-colors">
                  <MessageCircle className="w-5 h-5" />
                  답변 {q.answerCount}
                </div>
                <div className="flex items-center gap-2.5 text-sm font-black text-primary/40">
                  <Eye className="w-5 h-5" />
                  조회 {q.viewCount}
                </div>
              </div>
              <Button variant="ghost" size="icon" className="text-primary/20 hover:text-accent">
                <Bookmark className="w-5 h-5" />
              </Button>
            </CardFooter>
          </Card>
        ))
      )}
    </div>
  )
}
