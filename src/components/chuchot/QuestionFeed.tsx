"use client"

import { Question } from "@/lib/types"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { MessageCircle, Eye, Clock, Bookmark, Share2, MoreHorizontal } from "lucide-react"
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
          <button className="text-[17px] font-black text-primary border-b-[3px] border-accent pb-2 transition-all">최신순</button>
          <button className="text-[17px] font-bold text-primary/30 hover:text-primary pb-2 transition-all">인기순</button>
          <button className="text-[17px] font-bold text-primary/30 hover:text-primary pb-2 transition-all">답변대기</button>
        </div>
      </div>
      
      {sortedQuestions.length === 0 ? (
        <Card className="bg-white border-dashed border-primary/10 p-24 text-center rounded-[2.5rem]">
          <p className="text-primary/30 font-bold text-lg">아직 등록된 속삭임이 없습니다.<br/>첫 번째 HR 인사이트를 공유해보세요.</p>
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
                      <Badge variant="secondary" className="bg-primary/5 text-[10px] text-primary/60 font-bold border-none px-2 py-0">HR 전문가</Badge>
                    </div>
                    <span className="text-[12px] font-medium text-primary/40 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      {formatDistanceToNow(q.createdAt, { addSuffix: true, locale: ko })}
                    </span>
                  </div>
                </div>
                <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="icon" className="h-9 w-9 text-primary/20 hover:text-accent hover:bg-accent/5">
                    <Bookmark className="w-5 h-5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-9 w-9 text-primary/20 hover:text-primary hover:bg-primary/5">
                    <Share2 className="w-5 h-5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-9 w-9 text-primary/20 hover:text-primary hover:bg-primary/5">
                    <MoreHorizontal className="w-5 h-5" />
                  </Button>
                </div>
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
                    <div className="absolute inset-0 bg-black/5 group-hover:bg-transparent transition-colors"></div>
                  </div>
                )}
              </div>
            </CardContent>
            
            <CardFooter className="px-7 md:px-9 py-6 border-t border-primary/5 flex items-center justify-between bg-primary/[0.01]">
              <div className="flex gap-8">
                <div className="flex items-center gap-2.5 text-sm font-black text-primary/40 group-hover:text-accent transition-colors">
                  <div className="p-2 rounded-full bg-primary/5 group-hover:bg-accent/10">
                    <MessageCircle className="w-5 h-5" />
                  </div>
                  답변 {q.answerCount}
                </div>
                <div className="flex items-center gap-2.5 text-sm font-black text-primary/40">
                  <div className="p-2 rounded-full bg-primary/5">
                    <Eye className="w-5 h-5" />
                  </div>
                  조회 {q.viewCount}
                </div>
              </div>
              <div className="text-xs font-bold text-accent/60 uppercase tracking-widest hidden sm:block">
                Insider Insight
              </div>
            </CardFooter>
          </Card>
        ))
      )}
    </div>
  )
}
