
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
      <div className="flex items-center justify-between mb-2 px-2">
        <div className="flex gap-6">
          <button 
            onClick={() => onTabChange("all")}
            className={cn(
              "text-[16px] pb-2 transition-all",
              activeTab === "all" ? "font-black text-primary border-b-[3px] border-accent" : "font-bold text-primary/20 hover:text-primary"
            )}
          >
            전체 피드
          </button>
          <button 
            onClick={() => onTabChange("popular")}
            className={cn(
              "text-[16px] pb-2 transition-all",
              activeTab === "popular" ? "font-black text-primary border-b-[3px] border-accent" : "font-bold text-primary/20 hover:text-primary"
            )}
          >
            실시간 인기
          </button>
          <button 
            onClick={() => onTabChange("waiting")}
            className={cn(
              "text-[16px] pb-2 transition-all",
              activeTab === "waiting" ? "font-black text-primary border-b-[3px] border-accent" : "font-bold text-primary/20 hover:text-primary"
            )}
          >
            답변을 기다려요
          </button>
        </div>
      </div>
      
      {questions.length === 0 ? (
        <Card className="bg-white border-dashed border-primary/10 p-24 text-center rounded-[2.5rem]">
          <p className="text-primary/20 font-black text-lg">해당 조건에 맞는 속삭임이 없습니다.</p>
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
                "group bg-white border-primary/5 transition-all duration-500 cursor-pointer rounded-[2rem] overflow-hidden shadow-sm",
                isExpanded ? "ring-4 ring-accent/10 shadow-xl scale-[1.005]" : "hover:shadow-lg hover:-translate-y-1"
              )}
              onClick={() => onSelectQuestion(q.id)}
            >
              <CardContent className="p-6 md:p-8">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <AvatarIcon 
                        src={q.userProfilePicture}
                        seed={q.nickname} 
                        className="w-11 h-11 shadow-md border border-white" 
                      />
                      {isMentor && (
                        <div className="absolute -top-1 -right-1 bg-accent p-1 rounded-full shadow-lg border-2 border-white">
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
                          <Badge className="bg-accent text-primary text-[9px] font-black border-none px-2 py-0.5 rounded-md">WHISPERER</Badge>
                        ) : (
                          <Badge variant="secondary" className="bg-primary/5 text-[9px] text-primary/40 font-black border-none px-2 py-0.5 rounded-md uppercase tracking-tighter">HR PRO</Badge>
                        )}
                      </div>
                      <span className="text-[11px] font-bold text-primary/30 flex items-center gap-1 uppercase tracking-widest">
                        <Clock className="w-3 h-3" />
                        {formatDistanceToNow(q.createdAt, { addSuffix: true, locale: ko })}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {isAdminMode && (
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="w-8 h-8 text-red-300 hover:text-red-500 hover:bg-red-50 rounded-full"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteQuestion?.(q.id);
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                    {q.category && (
                      <Badge className="bg-primary/5 text-primary/60 font-black border-none px-3 py-1 rounded-full text-[10px] uppercase tracking-tighter">
                        #{q.category}
                      </Badge>
                    )}
                    <div className={cn(
                      "p-1.5 rounded-full transition-colors",
                      isExpanded ? "bg-accent text-primary" : "bg-primary/5 text-primary/20 group-hover:bg-accent/10 group-hover:text-accent"
                    )}>
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className={cn(
                    "text-xl md:text-2xl font-black transition-colors leading-[1.3] tracking-tight",
                    isExpanded ? "text-accent" : "text-primary group-hover:text-accent"
                  )}>
                    {q.title}
                  </h3>
                  <p className={cn(
                    "text-sm md:text-[15px] leading-relaxed text-primary/60 whitespace-pre-wrap break-words font-medium transition-all",
                    !isExpanded && "line-clamp-2"
                  )}>
                    {q.text}
                  </p>
                  
                  {isExpanded && q.imageUrl && (
                    <div className="relative w-full h-[300px] md:h-[400px] rounded-[1.5rem] overflow-hidden border border-primary/5 bg-primary/5 mt-6 animate-in fade-in zoom-in duration-500 shadow-inner">
                      <Image 
                        src={q.imageUrl} 
                        alt="속삭임 이미지" 
                        fill 
                        className="object-cover"
                      />
                    </div>
                  )}

                  {isExpanded && q.videoUrl && (
                    <div className="relative w-full rounded-[1.5rem] overflow-hidden border border-primary/5 bg-black mt-6 animate-in fade-in zoom-in duration-500 shadow-xl">
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
                  <div className="mt-8 pt-8 border-t border-primary/5 animate-in slide-in-from-top-4 duration-500" onClick={(e) => e.stopPropagation()}>
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
                <CardFooter className="px-6 md:px-8 py-4 border-t border-primary/5 flex items-center justify-between bg-primary/[0.005] group-hover:bg-primary/[0.015] transition-colors">
                  <div className="flex gap-6">
                    <div className="flex items-center gap-2 text-xs font-black text-primary/30 group-hover:text-accent transition-colors">
                      <div className="p-1.5 rounded-lg bg-primary/5 group-hover:bg-accent/10 transition-colors">
                        <MessageCircle className="w-4 h-4" />
                      </div>
                      <span className="text-primary/60 font-black">답변 {q.answerCount}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-black text-primary/30">
                      <div className="p-1.5 rounded-lg bg-primary/5">
                        <Eye className="w-4 h-4" />
                      </div>
                      <span className="text-primary/60 font-black">조회 {q.viewCount}</span>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl text-primary/20 hover:text-accent hover:bg-accent/10 transition-all" onClick={(e) => {
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
