"use client"

import { useState, useEffect } from "react"
import { Question, Answer } from "@/lib/types"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { MessageCircle, Eye, Clock, Bookmark, Trash2, Crown, Mail, Share2, MoreHorizontal } from "lucide-react"
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
    if (typeof window !== 'undefined') {
      const shareUrl = `${window.location.origin}/questions/${q.id}`;
      await navigator.clipboard.writeText(shareUrl);
      toast({ title: "링크 복사 완료", description: "게시글 주소가 복사되었습니다." });
    }
  }

  return (
    <div className="space-y-3 md:space-y-4">
      {questions.length === 0 ? (
        <Card className="naver-card p-12 md:p-24 text-center bg-white">
          <p className="text-muted-foreground font-bold text-sm md:text-base">공유된 정보가 아직 없습니다.</p>
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
                "naver-card cursor-pointer group transition-all",
                isExpanded ? "ring-1 ring-accent/30 shadow-md" : "active:bg-black/5"
              )}
              onClick={() => onSelectQuestion(q.id)}
            >
              <CardContent className="p-5 md:p-8">
                <div className="flex justify-between items-start mb-4 md:mb-5">
                  <div className="flex items-center gap-3 md:gap-4">
                    <AvatarIcon src={q.userProfilePicture} seed={q.nickname} className="w-9 h-9 md:w-11 md:h-11 border border-black/5" />
                    <div className="flex flex-col">
                      <div className="flex items-center gap-1.5 md:gap-2">
                        <span className="text-[13px] md:text-[15px] font-black text-foreground truncate max-w-[100px] md:max-w-none">@{q.nickname}</span>
                        {isMentor && <Badge className="naver-badge scale-90 md:scale-100">Whisperer</Badge>}
                        {user && user.uid !== q.userId && (
                          <button onClick={(e) => { e.stopPropagation(); setMessageTarget({ id: q.userId, nickname: q.nickname }); }} className="text-muted-foreground hover:text-accent transition-colors p-1">
                            <Mail className="w-3.5 h-3.5 md:w-4 md:h-4" />
                          </button>
                        )}
                      </div>
                      <span className="text-[10px] md:text-[12px] font-bold text-muted-foreground flex items-center gap-1.5 md:gap-2">
                        {isMounted ? formatDistanceToNow(q.createdAt, { addSuffix: true, locale: ko }) : '...'}
                        <span className="w-0.5 h-0.5 rounded-full bg-black/10"></span>
                        조회 {q.viewCount}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 md:gap-2">
                    {q.category && (
                      <Badge variant="outline" className="text-[9px] md:text-[11px] font-bold border-black/[0.08] text-muted-foreground rounded-sm px-1.5 py-0 md:px-2 md:py-0.5 max-w-[80px] md:max-w-none truncate">#{q.category}</Badge>
                    )}
                    <button onClick={(e) => { e.stopPropagation(); }} className="text-black/10 hover:text-black/30 transition-colors p-1">
                      <MoreHorizontal className="w-4 h-4 md:w-5 md:h-5" />
                    </button>
                  </div>
                </div>

                <div className="space-y-2 md:space-y-3">
                  <h3 className="text-base md:text-[19px] font-black leading-tight text-foreground group-hover:underline decoration-accent/30 underline-offset-4 line-clamp-2 md:line-clamp-none">{q.title}</h3>
                  <p className={cn("text-[14px] md:text-[15px] leading-relaxed text-muted-foreground whitespace-pre-wrap break-words", !isExpanded && "line-clamp-2")}>{q.text}</p>
                  
                  {isExpanded && q.imageUrl && (
                    <div className="relative w-full rounded-sm overflow-hidden border border-black/5 bg-black/[0.02] mt-4 md:mt-6">
                      <img src={q.imageUrl} alt="이미지" className="w-full h-auto block" />
                    </div>
                  )}
                </div>

                {isExpanded && (
                  <div className="mt-8 md:mt-10 pt-8 md:pt-10 border-t border-black/[0.05]" onClick={(e) => e.stopPropagation()}>
                    <SubmissionForm type="answer" placeholder="도움이 될만한 의견을 남겨주세요." onSubmit={onAddAnswer} />
                    <AnswerFeed answers={questionAnswers} isAdminMode={isAdminMode} onDeleteAnswer={onDeleteAnswer} />
                  </div>
                )}
              </CardContent>
              
              {!isExpanded && (
                <CardFooter className="px-5 md:px-8 py-3 md:py-4 border-t border-black/[0.03] flex items-center justify-between bg-[#FBFBFC]">
                  <div className="flex gap-4 md:gap-6">
                    <div className="flex items-center gap-1.5 md:gap-2 text-[12px] md:text-[13px] font-bold text-muted-foreground">
                      <MessageCircle className="w-3.5 h-3.5 md:w-4 md:h-4 text-accent" />
                      <span>댓글 {q.answerCount}</span>
                    </div>
                    <button onClick={(e) => handleShare(e, q)} className="flex items-center gap-1.5 md:gap-2 text-[12px] md:text-[13px] font-bold text-muted-foreground hover:text-accent transition-colors">
                      <Share2 className="w-3.5 h-3.5 md:w-4 md:h-4" />
                      공유
                    </button>
                  </div>
                  <Bookmark className="w-3.5 h-3.5 md:w-4 md:h-4 text-black/10 hover:text-accent cursor-pointer transition-colors" />
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
