
"use client"

import { Question } from "@/lib/types"
import { TrendingUp, MessageCircle, ChevronRight, BarChart2 } from "lucide-react"
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
      description: "현재 가장 주목받는 HR 이슈 리포트입니다.",
    })
  }

  // 상위 10개까지 노출 가능하도록 변경 (디자인만)
  const topQuestions = questions.slice(0, 5)

  return (
    <div className="naver-card">
      <div className="p-5 border-b border-black/5 flex items-center justify-between bg-[#F8F9FA]">
        <h3 className="text-[15px] font-black text-foreground flex items-center gap-2">
          실시간 인기 속삭임
          <span className="text-[10px] bg-primary text-white px-1 rounded uppercase">Hot</span>
        </h3>
        <span className="text-[11px] font-bold text-muted-foreground">12:00 기준</span>
      </div>
      
      <div className="divide-y divide-black/5">
        {topQuestions.map((q, idx) => (
          <div 
            key={q.id}
            onClick={() => onSelectQuestion(q.id)}
            className="group flex items-center p-4 cursor-pointer hover:bg-black/[0.01]"
          >
            <span className={cn(
              "ranking-number w-6 text-center",
              idx < 3 ? "text-primary" : "text-muted-foreground/40"
            )}>
              {idx + 1}
            </span>
            
            <div className="flex-1 min-w-0 pr-4">
              <p className="text-[14px] font-bold truncate group-hover:text-primary transition-colors">
                {q.title}
              </p>
            </div>
            
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-muted-foreground/40 shrink-0">
              <MessageCircle className="w-3.5 h-3.5" />
              {q.answerCount}
            </div>
          </div>
        ))}
      </div>
      
      <button 
        onClick={handleMoreClick}
        className="w-full py-3 text-[12px] font-bold text-muted-foreground bg-[#F8F9FA] border-t border-black/5 hover:bg-black/[0.02] flex items-center justify-center gap-1"
      >
        인기 지식 전체보기 <ChevronRight className="w-3 h-3" />
      </button>
    </div>
  )
}
