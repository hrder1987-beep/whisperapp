"use client"

import { Answer } from "@/lib/types"
import { AvatarIcon } from "./AvatarIcon"
import { formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface AnswerFeedProps {
  answers: Answer[]
  isAdminMode?: boolean
}

export function AnswerFeed({ answers, isAdminMode }: AnswerFeedProps) {
  if (answers.length === 0) return null

  return (
    <div className="space-y-8 md:space-y-12 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="flex items-center gap-3 px-1">
        <div className="h-px flex-1 bg-black/[0.05]"></div>
        <span className="text-[11px] font-black text-accent/20 uppercase tracking-[0.2em]">Intellectual whispers ({answers.length})</span>
        <div className="h-px flex-1 bg-black/[0.05]"></div>
      </div>

      <div className="space-y-10">
        {answers.map((answer) => (
          <div key={answer.id} className="flex gap-5 md:gap-6 group">
            <AvatarIcon 
              src={answer.userProfilePicture} 
              seed={answer.nickname} 
              className="w-10 h-10 md:w-12 md:h-12 border-2 border-white shadow-lg group-hover:scale-110" 
            />
            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-black text-accent text-[14px] md:text-[15px]">@{answer.nickname}</span>
                  {answer.jobTitle && (
                    <span className="text-[10px] md:text-[11px] font-black text-primary/60 italic">#{answer.jobTitle}</span>
                  )}
                  {answer.userId === 'ai' && (
                    <Badge className="bg-primary text-accent border-none px-2 h-5 text-[9px] font-black shadow-sm">AI BOT</Badge>
                  )}
                </div>
                <span className="text-[10px] font-bold text-accent/20">
                  {formatDistanceToNow(answer.createdAt, { addSuffix: true, locale: ko })}
                </span>
              </div>
              <div className={cn(
                "p-5 md:p-6 rounded-2xl text-[14px] md:text-[16px] leading-relaxed font-medium shadow-sm border border-black/[0.03]",
                answer.userId === 'ai' ? "bg-primary/5 text-accent border-primary/10" : "bg-white text-[#404040]"
              )}>
                {answer.text}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
