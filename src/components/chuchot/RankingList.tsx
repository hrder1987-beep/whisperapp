
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
    <div className="bg-card rounded-xl p-5 border border-white/5 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-[15px] font-bold text-foreground flex items-center gap-2">
          실시간 인기 속삭임
          <TrendingUp className="w-4 h-4 text-primary" />
        </h3>
      </div>
      
      <div className="space-y-4">
        {questions.map((q, idx) => (
          <div 
            key={q.id}
            onClick={() => onSelectQuestion(q.id)}
            className="group flex gap-3 cursor-pointer"
          >
            <span className={cn(
              "text-sm font-bold w-4 pt-0.5",
              idx < 3 ? "text-primary" : "text-muted-foreground/40"
            )}>
              {idx + 1}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium line-clamp-2 leading-snug group-hover:text-primary transition-colors mb-1.5">
                {q.text}
              </p>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-muted-foreground/60">@{q.nickname}</span>
                <span className="w-0.5 h-0.5 rounded-full bg-muted-foreground/40"></span>
                <span className="flex items-center gap-1 text-[11px] text-muted-foreground/60">
                  <MessageCircle className="w-3 h-3" /> {q.answerCount}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <button className="w-full mt-6 pt-4 border-t border-white/5 text-[12px] font-bold text-muted-foreground hover:text-primary transition-colors text-center">
        인기글 더보기
      </button>
    </div>
  )
}
