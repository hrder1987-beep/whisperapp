"use client"

import { usePathname, useRouter } from "next/navigation"
import { MessageSquareQuote, Award, GraduationCap, Sparkles, Users } from "lucide-react"
import { cn } from "@/lib/utils"
import { useState, useEffect } from "react"
import { AldiChat } from "./ShuChat"
import { useIsMobile } from "@/hooks/use-mobile"

export function BottomNav() {
  const pathname = usePathname()
  const router = useRouter()
  const isMobile = useIsMobile()
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => setIsMounted(true), [])

  if (!isMounted || !isMobile) return null

  // 전문가님이 요청하신 피드, 모임, 프로그램, 강사, AI 챗봇 구성
  const navItems = [
    { name: "피드", href: "/", icon: MessageSquareQuote },
    { name: "모임", href: "/gatherings", icon: Users },
    { name: "프로그램", href: "/programs", icon: GraduationCap },
    { name: "강사", href: "/instructors", icon: Award },
  ]

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-xl border-t border-black/[0.05] pb-safe shadow-[0_-8px_30px_rgba(0,0,0,0.1)]">
        <div className="flex justify-around items-center h-16 px-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            const Icon = item.icon
            
            return (
              <button
                key={item.href}
                onClick={() => router.push(item.href)}
                className="flex flex-col items-center justify-center w-full relative h-full pt-1"
              >
                <div className="relative">
                  <Icon className={cn(
                    "w-6 h-6 mb-1 transition-all duration-300",
                    isActive ? "text-[#163300] scale-110" : "text-[#163300]/20"
                  )} />
                </div>
                <span className={cn(
                  "text-[9px] font-black transition-colors uppercase tracking-tighter",
                  isActive ? "text-[#163300]" : "text-[#163300]/20"
                )}>
                  {item.name}
                </span>
                {isActive && <div className="absolute bottom-1 w-1 h-1 bg-primary rounded-full"></div>}
              </button>
            )
          })}
          
          {/* AI 챗봇 버튼 (마지막 5번째 탭) */}
          <button
            onClick={() => setIsChatOpen(true)}
            className="flex flex-col items-center justify-center w-full h-full pt-1"
          >
            <div className="relative">
              <Sparkles className="w-6 h-6 mb-1 text-primary animate-pulse" />
            </div>
            <span className="text-[9px] font-black text-primary uppercase tracking-tighter">AI 챗봇</span>
          </button>
        </div>
      </nav>

      <AldiChat 
        forceOpenTrigger={isChatOpen} 
        onTriggerClose={() => setIsChatOpen(false)} 
        hideCard 
      />
    </>
  )
}
