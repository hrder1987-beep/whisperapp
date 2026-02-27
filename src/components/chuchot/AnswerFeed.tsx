
"use client"

import { useState, useEffect } from "react"
import { Answer } from "@/lib/types"
import { Card, CardContent } from "@/components/ui/card"
import { formatDistanceToNow } from "date-fns"
import { ko } from "date-fns/locale"
import { Clock, Trash2, Crown, Mail } from "lucide-react"
import { AvatarIcon } from "./AvatarIcon"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MessageDialog } from "./MessageDialog"
import { cn } from "@/lib/utils"
import { useUser, useFirestore, deleteDocumentNonBlocking } from "@/firebase"
import { doc } from "firebase/firestore"
import { useToast } from "@/hooks/use-toast"

interface AnswerFeedProps {
  answers: Answer[]
  isAdminMode?: boolean
}

export function AnswerFeed({ answers, isAdminMode = false }: AnswerFeedProps) {
  const { user } = useUser()
  const db = useFirestore()
  const { toast } = useToast()
  const [messageTarget, setMessageTarget] = useState<{ id: string, nickname: string } | null>(null)
  
  const [isMounted, setIsMounted] = useState(false)
  useEffect(() => setIsMounted(true), [])

  const sortedAnswers = [...answers].sort((a, b) => b.createdAt - a.createdAt)

  const handleDeleteAnswer = (ans: Answer) => {
    if (!db || !ans) return;
    if (window.confirm("이 답글을 삭제하시겠습니까?")) {
      deleteDocumentNonBlocking(doc(db, "questions", ans.questionId, "answers", ans.id));
      toast({ title: "삭제 완료", description: "답글이 삭제되었습니다." });
    }
  }

  return (
    <div className="mt-8 space-y-4">
      <h3 className="text-lg font-semibold text-primary mb-4 flex items-center gap-2">답글 ({answers.length})</h3>
      
      {sortedAnswers.length === 0 ? (
        <p className="text-muted-foreground text-center py-8">이 속삭임에 첫 번째 답글을 남겨보세요.</p>
      ) : (
        sortedAnswers.map((a) => {
          const isMentor = a.userRole === 'mentor';
          const isOwner = user && user.uid === a.userId;
          
          return (
            <Card key={a.id} className={cn("bg-card border-black/5 shadow-sm", isMentor && "border-accent/30 bg-accent/5")}>
              <CardContent className="p-4">
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <AvatarIcon src={a.userProfilePicture} seed={a.nickname} className="w-7 h-7" />
                      {isMentor && (
                        <div className="absolute -top-1 -right-1 bg-accent p-0.5 rounded-full shadow-sm border border-white">
                          <Crown className="w-2 h-2 text-primary" />
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className={cn("font-bold text-sm", isMentor ? "text-accent" : "text-primary")}>@{a.nickname}</span>
                      {a.jobTitle && <span className="text-[10px] font-bold text-primary italic">#{a.jobTitle}</span>}
                      {isMentor && <Badge className="bg-accent text-primary text-[9px] font-black border-none px-1.5 py-0">WHISPERER</Badge>}
                      {user && !isOwner && (
                        <button onClick={() => setMessageTarget({ id: a.userId, nickname: a.nickname })} className="p-1 text-primary/20 hover:text-accent transition-colors bg-primary/5 rounded-full">
                          <Mail className="w-2.5 h-2.5" />
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-muted-foreground flex items-center gap-1 text-[10px]">
                      <Clock className="w-3 h-3" />
                      {isMounted ? formatDistanceToNow(a.createdAt, { addSuffix: true, locale: ko }) : '...'}
                    </span>
                    {(isAdminMode || isOwner) && (
                      <Button variant="ghost" size="icon" className="w-6 h-6 text-red-300 hover:text-red-50 hover:bg-red-50 rounded-full" onClick={() => handleDeleteAnswer(a)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
                <p className="text-base text-foreground/90 leading-relaxed pl-9">{a.text}</p>
              </CardContent>
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
