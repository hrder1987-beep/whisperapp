
"use client"

import { Question } from "@/lib/types"
import { Eye, TrendingUp } from "lucide-react"
import { cn } from "@/lib/utils"

interface RankingListProps {
  questions: Question[]
  onSelectQuestion: (id: string) => void
}

export function RankingList({ questions, onSelectQuestion }: RankingListProps) {
  return (
    <div className="glass-morphism rounded-2xl p-6 border-primary/20 shadow-xl overflow-hidden">
      <div className="flex items-center gap-2 mb-6">
        <div className="p-2 bg-primary/20 rounded-lg">
          <TrendingUp className="w-5 h-5 text-primary" />
        </div>
        <h3 className="text-xl font-bold text-foreground">실시간 속삭임 TOP 10</h3>
      </div>
      
      <div className="space-y-1">
        {questions.map((q, idx) => (
          <div 
            key={q.id}
            onClick={() => onSelectQuestion(q.id)}
            className="group flex items-center gap-4 p-3 rounded-xl hover:bg-primary/10 transition-all cursor-pointer border border-transparent hover:border-primary/20"
          >
            <span className={cn(
              "text-lg font-black w-6 text-center transition-colors",
              idx < 3 ? "text-primary italic" : "text-muted-foreground/50"
            )}>
              {idx + 1}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium line-clamp-1 group-hover:text-primary transition-colors">
                {q.text}
              </p>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-[10px] text-muted-foreground/70">@{q.nickname}</span>
                <span className="flex items-center gap-1 text-[10px] text-muted-foreground/70">
                  <Eye className="w-3 h-3" /> {q.viewCount}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-6 pt-4 border-t border-white/5 text-center">
        <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
          Updated Every Minute
        </p>
      </div>
    </div>
  )
}
