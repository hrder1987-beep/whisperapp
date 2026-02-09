
"use client"

import { Question, Answer } from "@/lib/types"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { MessageCircle, Eye, Clock, Bookmark, ChevronDown, ChevronUp, Trash2, Crown } from "lucide-react"
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
    <div className="space-y-4 md:space-y-6">
      <div className="flex items-center justify-between mb-2 overflow-x-auto pb-2 scrollbar-hide px-1">
        <div className="flex gap-4 md:gap-8 whitespace-nowrap">
          <button 
            onClick={() => onTabChange("all")}
            className={cn(
              "text-sm md:text-base pb-2 transition-all border-b-2",
              activeTab === "all" ? "font-black text-primary border-accent" : "font-bold text-primary/20 border-transparent hover:text-primary"
            )}
          >
            전체 피드
          </button>
          <button 
            onClick={() => onTabChange("popular")}
            className={cn(
              "text-sm md:text-base pb-2 transition-all border-b-2",
              activeTab === "popular" ? "font-black text-primary border-accent" : "font-bold text-primary/20 border-transparent hover:text-primary"
            )}
          >
            실시간 인기
          </button>
          <button 
            onClick={() => onTabChange("waiting")}
            className={cn(
              "text-sm md:text-base pb-2 transition-all border-b-2",
              activeTab === "waiting" ? "font-black text-primary border-accent" : "font-bold text-primary/20 border-transparent hover:text-primary"
            )}
          >
            답변 대기
          </button>
        </div>
      </div>
      
      {questions.length === 0 ? (
        <Card className="bg-white border-dashed border-primary/10 p-12 md:p-24 text-center rounded-[1.5rem] md:rounded-[2.5rem]">
          <p className="text-primary/20 font-black text-sm md:text-lg">해당 조건에 맞는 속삭임이 없습니다.</p>
        </Card>
      ) : (
        questions.map((q) => {
          const isExpanded = selectedId === q.id
          const questionAnswers = answers.filter(a => a.questionId === q.id)
          const isMentor = q.userRole === 'mentor';
          const isYoutube = q.videoUrl?.includes("youtube.com") || q.videoUrl?.includes("youtu.be");

          return (
            <Card 
              key={q.id} 
              className={cn(
                "group bg-white border-primary/5 transition-all duration-300 cursor-pointer rounded-[1.5rem] md:rounded-[2rem] overflow-hidden shadow-sm",
                isExpanded ? "ring-2 md:ring-4 ring-accent/10 shadow-lg" : "hover:shadow-md"
              )}
              onClick={() => onSelectQuestion(q.id)}
            >
              <CardContent className="p-5 md:p-8">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-2 md:gap-3">
                    <div className="relative">
                      <AvatarIcon 
                        src={q.userProfilePicture}
                        seed={q.nickname} 
                        className="w-9 h-9 md:w-11 md:h-11 shadow-md border border-white" 
                      />
                      {isMentor && (
                        <div className="absolute -top-1 -right-1 bg-accent p-0.5 md:p-1 rounded-full shadow-lg border-2 border-white">
                          <Crown className="w-2.5 h-2.5 md:w-3 h-3 text-primary" />
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-1.5 md:gap-2">
                        <span className={cn(
                          "text-xs md:text-[15px] font-black",
                          isMentor ? "text-accent" : "text-primary"
                        )}>
                          @{q.nickname}
                        </span>
                        {isMentor ? (
                          <Badge className="bg-accent text-primary text-[8px] md:text-[9px] font-black border-none px-1.5 py-0 md:px-2 md:py-0.5 rounded-md">WHISPERER</Badge>
                        ) : (
                          <Badge variant="secondary" className="bg-primary/5 text-[8px] md:text-[9px] text-primary/40 font-black border-none px-1.5 py-0 md:px-2 md:py-0.5 rounded-md tracking-tighter">PRO</Badge>
                        )}
                      </div>
                      <span className="text-[10px] md:text-[11px] font-bold text-primary/30 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDistanceToNow(q.createdAt, { addSuffix: true, locale: ko })}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {isAdminMode && (
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="w-7 h-7 text-red-300 hover:text-red-500 hover:bg-red-50 rounded-full"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteQuestion?.(q.id);
                        }}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    )}
                    {q.category && (
                      <Badge className="bg-primary/5 text-primary/60 font-black border-none px-2 py-0.5 md:px-3 md:py-1 rounded-full text-[9px] md:text-[10px] tracking-tighter">
                        #{q.category}
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="space-y-2 md:space-y-3">
                  <h3 className={cn(
                    "text-lg md:text-2xl font-black leading-snug tracking-tight",
                    isExpanded ? "text-accent" : "text-primary"
                  )}>
                    {q.title}
                  </h3>
                  <p className={cn(
                    "text-xs md:text-[15px] leading-relaxed text-primary/60 whitespace-pre-wrap break-words font-medium",
                    !isExpanded && "line-clamp-2"
                  )}>
                    {q.text}
                  </p>
                  
                  {isExpanded && q.imageUrl && (
                    <div className="relative w-full h-[200px] md:h-[400px] rounded-[1rem] md:rounded-[1.5rem] overflow-hidden border border-primary/5 bg-primary/5 mt-4">
                      <Image 
                        src={q.imageUrl} 
                        alt="속삭임 이미지" 
                        fill 
                        className="object-cover"
                      />
                    </div>
                  )}

                  {isExpanded && q.videoUrl && (
                    <div className="relative w-full rounded-[1rem] md:rounded-[1.5rem] overflow-hidden border border-primary/5 bg-black mt-4">
                      {isYoutube ? (
                        <div className="aspect-video w-full">
                          <iframe 
                            className="w-full h-full"
                            src={q.videoUrl.replace("watch?v=", "embed/").replace("youtu.be/", "youtube.com/embed/")} 
                            title="YouTube video player" 
                            frameBorder="0" 
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                            allowFullScreen
                          ></iframe>
                        </div>
                      ) : (
                        <video src={q.videoUrl} controls className="w-full max-h-[500px]" />
                      )}
                    </div>
                  )}
                </div>

                {isExpanded && (
                  <div className="mt-6 md:mt-8 pt-6 md:pt-8 border-t border-primary/5" onClick={(e) => e.stopPropagation()}>
                    <SubmissionForm 
                      type="answer"
                      placeholder="동료 전문가들에게 노하우를 공유해주세요."
                      onSubmit={onAddAnswer}
                    />
                    <AnswerFeed answers={questionAnswers} isAdminMode={isAdminMode} onDeleteAnswer={onDeleteAnswer} />
                  </div>
                )}
              </CardContent>
              
              {!isExpanded && (
                <CardFooter className="px-5 md:px-8 py-3 md:py-4 border-t border-primary/5 flex items-center justify-between bg-primary/[0.005]">
                  <div className="flex gap-4 md:gap-6">
                    <div className="flex items-center gap-1.5 text-[10px] md:text-xs font-black">
                      <MessageCircle className="w-3.5 h-3.5 md:w-4 md:h-4 text-primary/30" />
                      <span className="text-primary/60">답변 {q.answerCount}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] md:text-xs font-black">
                      <Eye className="w-3.5 h-3.5 md:w-4 md:h-4 text-primary/30" />
                      <span className="text-primary/60">조회 {q.viewCount}</span>
                    </div>
                  </div>
                  <Bookmark className="w-4 h-4 md:w-5 md:h-5 text-primary/20" />
                </CardFooter>
              )}
            </Card>
          )
        })
      )}
    </div>
  )
}
