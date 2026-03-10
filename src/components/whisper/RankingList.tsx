
"use client"

import { Question } from "@/lib/types"
import { ThumbsUp, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"

interface RankingListProps {
  questions: Question[]
  onSelectQuestion: (id: string) => void
}

export function RankingList({ questions, onSelectQuestion }: RankingListProps) {
  const { toast } = useToast()

  const handleMoreClick = () => {
    toast({
      title: "실시간 지식 랭킹",
      description: "현재 가장 많은 지지를 받는 HR 이슈 리포트입니다.",
    })
  }

  const topQuestions = questions.slice(0, 5)

  return (
    <div className="naver-card rounded-sm bg-white">
      <div className="p-5 border-b border-black/[0.05] flex items-center justify-between bg-[#FBFBFC]">
        <h3 className="text-[15px] font-black text-foreground flex items-center gap-2">
          실시간 인기 속삭임
          <span className="text-[10px] bg-accent text-white px-1.5 py-0.5 rounded-sm uppercase font-black">Hot</span>
        </h3>
        <span className="text-[11px] font-bold text-muted-foreground/50">12:00 기준</span>
      </div>
      
      <div className="divide-y divide-black/[0.05]">
        {topQuestions.map((q, idx) => (
          <div 
            key={q.id}
            onClick={() => onSelectQuestion(q.id)}
            className="group flex items-center p-4 cursor-pointer hover:bg-black/[0.01] transition-colors"
          >
            <span className={cn(
              "ranking-number w-6 text-center text-[17px]",
              idx < 3 ? "text-accent" : "text-muted-foreground/30"
            )}>
              {idx + 1}
            </span>
            
            <div className="flex-1 min-w-0 pr-4">
              <p className="text-[14px] font-bold truncate group-hover:underline decoration-accent/30 underline-offset-4 text-foreground">
                {q.title}
              </p>
            </div>
            
            <div className="flex items-center gap-1.5 text-[11px] font-black text-muted-foreground/30 shrink-0">
              <ThumbsUp className="w-3.5 h-3.5 text-primary" />
              {q.likeCount || 0}
            </div>
          </div>
        ))}
      </div>
      
      <button 
        onClick={handleMoreClick}
        className="w-full py-3.5 text-[12px] font-black text-muted-foreground bg-[#FBFBFC] border-t border-black/[0.05] hover:bg-black/[0.02] flex items-center justify-center gap-1 transition-all"
      >
        인기 지식 전체보기 <ChevronRight className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}
