
"use client"

import { usePathname, useRouter } from "next/navigation"
import { MessageSquareQuote, Award, GraduationCap, Users, Bot } from "lucide-react"
import { cn } from "@/lib/utils"
import { useState } from "react"
import { AldiChat } from "./ShuChat"

export function BottomNav() {
  const pathname = usePathname()
  const router = useRouter()
  const [isChatOpen, setIsChatOpen] = useState(false)

  const navItems = [
    { name: "지식 속삭임", href: "/", icon: MessageSquareQuote },
    { name: "위스퍼러", href: "/mentors", icon: Award },
    { name: "프로그램", href: "/programs", icon: GraduationCap },
    { name: "강사 정보", href: "/instructors", icon: Users },
  ]

  return (
    <>
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-primary/5 px-2 pb-safe shadow-[0_-10px_40px_rgba(0,0,0,0.08)] rounded-t-[2.5rem]">
        <div className="flex justify-around items-center h-20">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <button
                key={item.href}
                onClick={() => router.push(item.href)}
                className="flex flex-col items-center justify-center gap-1 w-full transition-all active:scale-90"
              >
                <div className={cn(
                  "p-2 rounded-xl transition-all",
                  isActive ? "bg-accent/10" : ""
                )}>
                  <item.icon className={cn(
                    "w-5 h-5 transition-colors",
                    isActive ? "text-accent" : "text-primary/30"
                  )} />
                </div>
                <span className={cn(
                  "text-[9px] font-black transition-colors whitespace-nowrap",
                  isActive ? "text-primary" : "text-primary/20"
                )}>
                  {item.name}
                </span>
              </button>
            )
          })}
          
          <button
            onClick={() => setIsChatOpen(true)}
            className="flex flex-col items-center justify-center gap-1 w-full transition-all active:scale-90"
          >
            <div className="relative p-2 rounded-xl">
              <div className="absolute inset-0 bg-accent/20 blur-md rounded-full animate-pulse"></div>
              <Bot className="w-5 h-5 text-accent relative" />
            </div>
            <span className="text-[9px] font-black text-primary/20">챗봇</span>
          </button>
        </div>
      </nav>

      {/* 챗봇 트리거용 히든 인스턴스 (다이얼로그 제어) */}
      <div className="hidden">
         <AldiChat forceOpenTrigger={isChatOpen} onTriggerClose={() => setIsChatOpen(false)} />
      </div>
    </>
  )
}
