
"use client"

import { Question } from "@/lib/types"
import { TrendingUp, MessageCircle, Crown, ChevronRight } from "lucide-react"
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
      title: "실시간 랭킹 분석 중",
      description: "더 많은 통계와 랭킹 리포트는 다음 업데이트에서 제공될 예정입니다.",
    })
  }

  // 상위 3개만 노출
  const topQuestions = questions.slice(0, 3)

  return (
    <div className="bg-white rounded-[2rem] p-8 border border-primary/5 shadow-xl relative overflow-hidden">
      <div className="absolute top-0 right-0 -mr-6 -mt-6 opacity-[0.03]">
        <Crown className="w-48 h-48 text-accent rotate-12" />
      </div>
      
      <div className="flex items-center justify-between mb-8 relative z-10">
        <h3 className="text-xl font-black text-primary flex items-center gap-3">
          실시간 인기 속삭임
          <span className="flex h-2 w-2 rounded-full bg-red-500 animate-pulse"></span>
        </h3>
        <TrendingUp className="w-6 h-6 text-accent" />
      </div>
      
      <div className="space-y-6 relative z-10">
        {topQuestions.map((q, idx) => (
          <div 
            key={q.id}
            onClick={() => onSelectQuestion(q.id)}
            className="group flex gap-5 cursor-pointer items-start"
          >
            <div className="relative flex-shrink-0 mt-1">
              <span className={cn(
                "text-3xl font-black w-10 text-center leading-none inline-block transition-all group-hover:scale-110",
                idx === 0 ? "text-accent" : idx === 1 ? "text-primary/40" : "text-primary/20"
              )}>
                {idx + 1}
              </span>
              {idx === 0 && (
                <Crown className="absolute -top-5 -left-3 w-6 h-6 text-accent transform -rotate-12 drop-shadow-md" />
              )}
            </div>
            
            <div className="flex-1 min-w-0 border-b border-primary/5 pb-4 group-last:border-none">
              <p className="text-[16px] font-bold line-clamp-2 leading-[1.4] group-hover:text-accent transition-colors mb-2 text-primary/90">
                {q.title}
              </p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-[11px] font-black text-primary/40 bg-primary/5 px-2.5 py-0.5 rounded-full uppercase tracking-tighter">@{q.nickname}</span>
                  <span className="flex items-center gap-1.5 text-[12px] font-bold text-primary/30">
                    <MessageCircle className="w-3.5 h-3.5" /> {q.answerCount}
                  </span>
                </div>
                <ChevronRight className="w-4 h-4 text-primary/10 group-hover:text-accent group-hover:translate-x-1 transition-all" />
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <button 
        onClick={handleMoreClick}
        className="w-full mt-6 bg-primary text-accent hover:bg-primary/95 font-black text-[15px] py-4 rounded-2xl shadow-lg transition-all transform hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2 group"
      >
        실시간 랭킹 더보기
        <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
      </button>
    </div>
  )
}
