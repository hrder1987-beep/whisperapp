"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Eye, TrendingUp } from "lucide-react"
import { Question } from "@/lib/types"

interface BestQuestionsBannerProps {
  questions: Question[]
}

export function BestQuestionsBanner({ questions }: BestQuestionsBannerProps) {
  const topQuestions = [...questions]
    .sort((a, b) => b.viewCount - a.viewCount)
    .slice(0, 3)

  if (topQuestions.length === 0) return null

  return (
    <div className="w-full mb-12">
      <div className="flex items-center gap-2 mb-4 text-primary font-semibold text-lg">
        <TrendingUp className="w-5 h-5" />
        <h2>오늘의 인기 속삭임</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {topQuestions.map((q, idx) => (
          <Card key={q.id} className="glass-morphism border-primary/20 hover:border-primary/50 transition-all duration-500 cursor-pointer overflow-hidden group">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <Badge variant="outline" className="text-primary border-primary/30">
                  TOP {idx + 1}
                </Badge>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Eye className="w-3 h-3" />
                  {q.viewCount}
                </div>
              </div>
              <p className="text-lg font-medium line-clamp-2 mb-2 group-hover:text-primary transition-colors">
                "{q.text}"
              </p>
              <p className="text-xs text-primary/70 italic">— {q.nickname}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
