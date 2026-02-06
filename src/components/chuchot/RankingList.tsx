"use client"

import { Question } from "@/lib/types"
import { TrendingUp, MessageCircle, Crown } from "lucide-react"
import { cn } from "@/lib/utils"

interface RankingListProps {
  questions: Question[]
  onSelectQuestion: (id: string) => void
}

export function RankingList({ questions, onSelectQuestion }: RankingListProps) {
  return (
    <div className="bg-white rounded-2xl p-6 border-2 border-primary/5 shadow-xl overflow-hidden relative">
      <div className="absolute top-0 right-0 p-4 opacity-10">
        <Crown className="w-16 h-16 text-accent" />
      </div>
      
      <div className="flex items-center justify-between mb-6 relative z-10">
        <h3 className="text-lg font-black text-primary flex items-center gap-2.5">
          실시간 인기 속삭임
          <TrendingUp className="w-5 h-5 text-accent" />
        </h3>
      </div>
      
      <div className="space-y-4 relative z-10">
        {questions.map((q, idx) => (
          <div 
            key={q.id}
            onClick={() => onSelectQuestion(q.id)}
            className="group flex gap-4 cursor-pointer items-start"
          >
            <div className="relative">
              <span className={cn(
                "text-2xl font-black w-8 text-center leading-none mt-0.5 inline-block transition-colors",
                idx < 3 ? "text-accent" : "text-primary/30"
              )}>
                {idx + 1}
              </span>
              {idx === 0 && <Crown className="absolute -top-3 -left-2 w-4 h-4 text-accent transform -rotate-12" />}
            </div>
            
            <div className="flex-1 min-w-0 border-b border-primary/5 pb-3 group-last:border-none">
              <p className="text-[15px] font-bold line-clamp-1 leading-snug group-hover:text-accent transition-colors mb-1.5 text-foreground">
                {q.title}
              </p>
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-black text-accent bg-accent/10 px-2 py-0.5 rounded-full uppercase">@{q.nickname}</span>
                <span className="flex items-center gap-1.5 text-[11px] font-bold text-primary/60">
                  <MessageCircle className="w-3.5 h-3.5" /> {q.answerCount}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <button className="w-full mt-4 bg-primary text-accent hover:bg-primary/95 font-black text-sm py-3 rounded-2xl shadow-lg transition-all transform hover:scale-[1.01] active:scale-95">
        인기글 더보기
      </button>
    </div>
  )
}
