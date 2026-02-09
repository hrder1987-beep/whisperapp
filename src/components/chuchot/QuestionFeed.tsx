
"use client"

import { Question, Answer } from "@/lib/types"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { MessageCircle, Eye, Clock, Bookmark, ChevronDown, ChevronUp, Trash2, Award, Crown } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { ko } from "date-fns/locale"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import { AvatarIcon } from "./AvatarIcon"
import { Badge } from "@/components/ui/badge"
import { AnswerFeed } from "./AnswerFeed"
import { SubmissionForm } from "./SubmissionForm"
import { cn } from "@/lib/utils"

interface QuestionFeedProps {
  questions: Question[]
  onSelectQuestion: (id: string) => void
  selectedId: string | null
  answers: Answer[]
  onAddAnswer: (nickname: string, title: string, text: string) => void
  activeTab: "all" | "popular" | "waiting"
  onTabChange: (tab: "all" | "popular" | "waiting") => void
  isAdminMode?: boolean
  onDeleteQuestion?: (id: string) => void
  onDeleteAnswer?: (id: string) => void
}

export function QuestionFeed({ 
  questions, 
  onSelectQuestion, 
  selectedId, 
  answers, 
  onAddAnswer,
  activeTab,
  onTabChange,
  isAdminMode = false,
  onDeleteQuestion,
  onDeleteAnswer
}: QuestionFeedProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4 px-1">
        <div className="flex gap-6">
          <button 
            onClick={() => onTabChange("all")}
            className={cn(
              "text-[17px] pb-2 transition-all",
              activeTab === "all" ? "font-black text-primary border-b-[3px] border-accent" : "font-bold text-primary/30 hover:text-primary"
            )}
          >
            전체
          </button>
          <button 
            onClick={() => onTabChange("popular")}
            className={cn(
              "text-[17px] pb-2 transition-all",
              activeTab === "popular" ? "font-black text-primary border-b-[3px] border-accent" : "font-bold text-primary/30 hover:text-primary"
            )}
          >
            인기
          </button>
          <button 
            onClick={() => onTabChange("waiting")}
            className={cn(
              "text-[17px] pb-2 transition-all",
              activeTab === "waiting" ? "font-black text-primary border-b-[3px] border-accent" : "font-bold text-primary/30 hover:text-primary"
            )}
          >
            답변대기
          </button>
        </div>
      </div>
      
      {questions.length === 0 ? (
        <Card className="bg-white border-dashed border-primary/10 p-24 text-center rounded-[2.5rem]">
          <p className="text-primary/30 font-bold text-lg">해당 조건에 맞는 속삭임이 없습니다.</p>
        </Card>
      ) : (
        questions.map((q) => {
          const isExpanded = selectedId === q.id
          const questionAnswers = answers.filter(a => a.questionId === q.id)
          const isMentor = q.userRole === 'mentor';

          return (
            <Card 
              key={q.id} 
              className={cn(
                "group bg-white border-primary/5 transition-all duration-300 cursor-pointer rounded-[1.5rem] overflow-hidden shadow-sm",
                isExpanded ? "ring-2 ring-accent/30 shadow-2xl scale-[1.01]" : "hover:shadow-xl hover:-translate-y-1"
              )}
              onClick={() => onSelectQuestion(q.id)}
            >
              <CardContent className="p-7 md:p-9">
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <AvatarIcon 
                        src={q.userProfilePicture}
                        seed={q.nickname} 
                        className="w-12 h-12 shadow-md border-2 border-primary/5" 
                      />
                      {isMentor && (
                        <div className="absolute -top-1 -right-1 bg-accent p-1 rounded-full shadow-md border border-white">
                          <Crown className="w-3 h-3 text-primary" />
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "text-[15px] font-black",
                          isMentor ? "text-accent" : "text-primary"
                        )}>
                          @{q.nickname}
                        </span>
                        {isMentor ? (
                          <Badge className="bg-accent text-primary text-[10px] font-black border-none px-2 py-0">WHISPERER</Badge>
                        ) : (
                          <Badge variant="secondary" className="bg-primary/5 text-[10px] text-primary/60 font-bold border-none px-2 py-0">HR Specialist</Badge>
                        )}
                      </div>
                      <span className="text-[12px] font-medium text-primary/40 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        {formatDistanceToNow(q.createdAt, { addSuffix: true, locale: ko })}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {isAdminMode && (
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-red-400 hover:text-red-600 hover:bg-red-50"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteQuestion?.(q.id);
                        }}
                      >
                        <Trash2 className="w-5 h-5" />
                      </Button>
                    )}
                    {q.category && (
                      <Badge className="bg-accent/10 text-accent font-black border-none px-3 py-1 rounded-full text-[11px]">
                        #{q.category}
                      </Badge>
                    )}
                    {isExpanded ? <ChevronUp className="w-5 h-5 text-accent" /> : <ChevronDown className="w-5 h-5 text-primary/20" />}
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className={cn(
                    "text-2xl md:text-[26px] font-black transition-colors leading-[1.3] tracking-tight",
                    isExpanded ? "text-accent" : "text-primary group-hover:text-accent"
                  )}>
                    {q.title}
                  </h3>
                  <p className={cn(
                    "text-base md:text-[18px] leading-relaxed text-primary/70 whitespace-pre-wrap break-words font-medium transition-all",
                    !isExpanded && "line-clamp-2"
                  )}>
                    {q.text}
                  </p>
                  
                  {isExpanded && q.imageUrl && (
                    <div className="relative w-full h-64 md:h-96 rounded-2xl overflow-hidden border border-primary/5 bg-primary/5 mt-8 animate-in fade-in zoom-in duration-500">
                      <Image 
                        src={q.imageUrl} 
                        alt="속삭임 이미지" 
                        fill 
                        className="object-cover"
                      />
                    </div>
                  )}
                </div>

                {isExpanded && (
                  <div className="mt-10 pt-10 border-t border-primary/5 animate-in slide-in-from-top-4 duration-500" onClick={(e) => e.stopPropagation()}>
                    <SubmissionForm 
                      type="answer"
                      placeholder="동료 전문가들에게 따뜻한 조언이나 노하우를 공유해주세요."
                      onSubmit={onAddAnswer}
                    />
                    <AnswerFeed answers={questionAnswers} isAdminMode={isAdminMode} onDeleteAnswer={onDeleteAnswer} />
                  </div>
                )}
              </CardContent>
              
              {!isExpanded && (
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
                  <Button variant="ghost" size="icon" className="text-primary/20 hover:text-accent" onClick={(e) => {
                    e.stopPropagation();
                  }}>
                    <Bookmark className="w-5 h-5" />
                  </Button>
                </CardFooter>
              )}
            </Card>
          )
        })
      )}
    </div>
  )
}
