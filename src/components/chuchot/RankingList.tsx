"use client"

import { Question } from "@/lib/types"
import { TrendingUp, MessageCircle } from "lucide-react"
import { cn } from "@/lib/utils"

interface RankingListProps {
  questions: Question[]
  onSelectQuestion: (id: string) => void
}

export function RankingList({ questions, onSelectQuestion }: RankingListProps) {
  return (
    <div className="bg-white rounded-xl p-5 border border-primary/20 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-[16px] font-bold text-foreground flex items-center gap-2">
          실시간 인기 속삭임
          <TrendingUp className="w-5 h-5 text-primary" />
        </h3>
      </div>
      
      <div className="space-y-5">
        {questions.map((q, idx) => (
          <div 
            key={q.id}
            onClick={() => onSelectQuestion(q.id)}
            className="group flex gap-4 cursor-pointer items-start"
          >
            <span className={cn(
              "text-lg font-black w-6 text-center leading-none mt-0.5",
              idx < 3 ? "text-primary" : "text-primary/20"
            )}>
              {idx + 1}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-[14px] font-semibold line-clamp-1 leading-snug group-hover:text-primary transition-colors mb-1.5">
                {q.title}
              </p>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-medium text-primary/60 bg-primary/5 px-1.5 py-0.5 rounded">@{q.nickname}</span>
                <span className="flex items-center gap-1 text-[11px] text-muted-foreground/60">
                  <MessageCircle className="w-3 h-3" /> {q.answerCount}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <button className="w-full mt-8 pt-4 border-t border-primary/10 text-[13px] font-bold text-primary hover:bg-primary/5 rounded-lg py-2 transition-all text-center">
        인기글 더보기
      </button>
    </div>
  )
}
