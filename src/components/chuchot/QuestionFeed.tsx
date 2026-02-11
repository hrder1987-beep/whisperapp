
"use client"

import { useState, useEffect } from "react"
import { Question, Answer } from "@/lib/types"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { MessageCircle, Eye, Clock, Bookmark, Trash2, Crown, Mail, Share2 } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { ko } from "date-fns/locale"
import { Button } from "@/components/ui/button"
import { AvatarIcon } from "./AvatarIcon"
import { Badge } from "@/components/ui/badge"
import { AnswerFeed } from "./AnswerFeed"
import { SubmissionForm } from "./SubmissionForm"
import { MessageDialog } from "./MessageDialog"
import { cn } from "@/lib/utils"
import { useUser } from "@/firebase"
import { useToast } from "@/hooks/use-toast"

interface QuestionFeedProps {
  questions: Question[]
  onSelectQuestion: (id: string) => void
  selectedId: string | null
  answers: Answer[]
  onAddAnswer: (nickname: string, title: string, text: string) => void
  activeTab: "all" | "popular" | "waiting" | "hrd" | "culture" | "hrm"
  onTabChange: (tab: "all" | "popular" | "waiting" | "hrd" | "culture" | "hrm") => void
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
  const { user } = useUser()
  const { toast } = useToast()
  const [messageTarget, setMessageTarget] = useState<{ id: string, nickname: string } | null>(null)
  
  const [isMounted, setIsMounted] = useState(false)
  useEffect(() => setIsMounted(true), [])

  const handleShare = async (e: React.MouseEvent, q: Question) => {
    e.stopPropagation();
    const shareUrl = `${window.location.origin}/questions/${q.id}`;
    
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: `[Whisper] ${q.title}`,
          text: q.text.substring(0, 100),
          url: shareUrl,
        });
        return;
      } catch (err) {
        if ((err as Error).name === 'AbortError') return;
      }
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      toast({ title: "링크 복사 완료!", description: "게시글 주소가 복사되었습니다." });
    } catch (err) {
      toast({ title: "복사 실패", description: "주소를 직접 복사해 주세요.", variant: "destructive" });
    }
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {questions.length === 0 ? (
        <Card className="bg-white border-dashed border-primary/10 p-12 md:p-24 text-center rounded-[1.5rem] md:rounded-[2.5rem]">
          <p className="text-primary/20 font-black text-sm md:text-lg">해당 조건에 맞는 속삭임이 없습니다.</p>
        </Card>
      ) : (
        questions.map((q) => {
          const isExpanded = selectedId === q.id
          const questionAnswers = answers.filter(a => a.questionId === q.id)
          const isMentor = q.userRole === 'mentor'

          return (
            <Card 
              key={q.id} 
              id={`q-${q.id}`}
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
                      <AvatarIcon src={q.userProfilePicture} seed={q.nickname} className="w-9 h-9 md:w-11 md:h-11 shadow-md border border-white" />
                      {isMentor && (
                        <div className="absolute -top-1 -right-1 bg-accent p-0.5 md:p-1 rounded-full shadow-lg border-2 border-white">
                          <Crown className="w-2.5 h-2.5 md:w-3 h-3 text-primary" />
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-1.5 md:gap-2">
                        <span className={cn("text-xs md:text-[15px] font-black whitespace-nowrap", isMentor ? "text-accent" : "text-primary")}>@{q.nickname}</span>
                        {q.jobTitle && <span className="text-[10px] md:text-[12px] font-bold text-accent bg-accent/5 px-2 py-0.5 rounded-lg border border-accent/10 whitespace-nowrap">#{q.jobTitle}</span>}
                        {isMentor ? (
                          <Badge className="bg-accent text-primary text-[8px] md:text-[9px] font-black border-none px-1.5 py-0 md:px-2 md:py-0.5 rounded-md whitespace-nowrap">WHISPERER</Badge>
                        ) : (
                          <Badge variant="secondary" className="bg-primary/5 text-[8px] md:text-[9px] text-primary/40 font-black border-none px-1.5 py-0 md:px-2 md:py-0.5 rounded-md tracking-tighter whitespace-nowrap">PRO</Badge>
                        )}
                        {user && user.uid !== q.userId && (
                          <button onClick={(e) => { e.stopPropagation(); setMessageTarget({ id: q.userId, nickname: q.nickname }); }} className="p-1.5 text-primary/20 hover:text-accent transition-colors bg-primary/5 rounded-full shrink-0" title="쪽지 보내기">
                            <Mail className="w-3 h-3 md:w-3.5 md:h-3.5" />
                          </button>
                        )}
                      </div>
                      <span className="text-[10px] md:text-[11px] font-bold text-primary/30 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {isMounted ? formatDistanceToNow(q.createdAt, { addSuffix: true, locale: ko }) : '...'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button onClick={(e) => handleShare(e, q)} className="p-2 text-primary/20 hover:text-accent transition-all rounded-full hover:bg-accent/10" title="공유하기">
                      <Share2 className="w-4 h-4 md:w-5 md:h-5" />
                    </button>
                    {isAdminMode && (
                      <Button variant="ghost" size="icon" className="w-7 h-7 text-red-300 hover:text-red-500 hover:bg-red-50 rounded-full" onClick={(e) => { e.stopPropagation(); onDeleteQuestion?.(q.id); }}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    )}
                    {q.category && (
                      <Badge className="bg-primary/5 text-primary/60 font-black border-none px-2 py-0.5 md:px-3 md:py-1 rounded-full text-[9px] md:text-[10px] tracking-tighter whitespace-nowrap">#{q.category}</Badge>
                    )}
                  </div>
                </div>

                <div className="space-y-2 md:space-y-3">
                  <h3 className={cn("text-lg md:text-2xl font-black leading-snug tracking-tight", isExpanded ? "text-accent" : "text-primary")}>{q.title}</h3>
                  <p className={cn("text-xs md:text-[15px] leading-relaxed text-primary/60 whitespace-pre-wrap break-words font-medium", !isExpanded && "line-clamp-2")}>{q.text}</p>
                  
                  {isExpanded && q.imageUrl && (
                    <div className="relative w-full rounded-[1rem] md:rounded-[1.5rem] overflow-hidden border border-primary/5 bg-primary/5 mt-4">
                      <img src={q.imageUrl} alt="이미지" className="w-full h-auto block" />
                    </div>
                  )}
                </div>

                {isExpanded && (
                  <div className="mt-6 md:mt-8 pt-6 md:pt-8 border-t border-primary/5" onClick={(e) => e.stopPropagation()}>
                    <SubmissionForm type="answer" placeholder="동료 전문가들에게 노하우를 공유해주세요." onSubmit={onAddAnswer} />
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
                      {isMounted && <span className="text-primary/60">조회 {q.viewCount}</span>}
                    </div>
                  </div>
                  <Bookmark className="w-4 h-4 md:w-5 md:h-5 text-primary/20" />
                </CardFooter>
              )}
            </Card>
          )
        })
      )}

      {messageTarget && (
        <MessageDialog isOpen={!!messageTarget} onClose={() => setMessageTarget(null)} receiverId={messageTarget.id} receiverNickname={messageTarget.nickname} />
      )}
    </div>
  )
}
