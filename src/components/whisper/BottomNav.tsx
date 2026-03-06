
"use client"

import { usePathname, useRouter } from "next/navigation"
import { MessageSquareQuote, Award, GraduationCap, Sparkles, Users } from "lucide-react"
import { cn } from "@/lib/utils"
import { useState, useEffect } from "react"
import { WhisperChat } from "./WhisperChat"
import { useIsMobile } from "@/hooks/use-mobile"

export function BottomNav() {
  const pathname = usePathname()
  const router = useRouter()
  const isMobile = useIsMobile()
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => setIsMounted(true), [])

  if (!isMounted || !isMobile) return null

  const navItems = [
    { name: "피드", href: "/", icon: MessageSquareQuote },
    { name: "모임", href: "/gatherings", icon: Users },
    { name: "프로그램", href: "/programs", icon: GraduationCap },
    { name: "강사", href: "/instructors", icon: Award },
  ]

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/98 backdrop-blur-3xl border-t border-black/[0.04] pb-safe shadow-[0_-15px_40px_rgba(0,0,0,0.08)]">
        <div className="flex justify-around items-center h-[85px] px-2 max-w-lg mx-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            const Icon = item.icon
            
            return (
              <button
                key={item.href}
                onClick={() => router.push(item.href)}
                className="flex flex-col items-center justify-center w-full relative h-full pt-1 transition-all active:scale-90"
              >
                <div className="relative mb-1.5 p-1.5">
                  <Icon className={cn(
                    "w-[28px] h-[28px] transition-all duration-500",
                    isActive ? "text-[#163300] scale-110" : "text-[#163300]/25"
                  )} />
                  {isActive && (
                    <div className="absolute -top-0 -right-0 w-2 h-2 bg-primary rounded-full animate-pulse shadow-lg"></div>
                  )}
                </div>
                <span className={cn(
                  "text-[10px] font-black transition-colors uppercase tracking-[0.1em]",
                  isActive ? "text-[#163300]" : "text-[#163300]/30"
                )}>
                  {item.name}
                </span>
              </button>
            )
          })}
          
          <button
            onClick={() => setIsChatOpen(true)}
            className="flex flex-col items-center justify-center w-full h-full pt-1 transition-all active:scale-90"
          >
            <div className="relative mb-1.5 bg-primary/20 p-3 rounded-[1.25rem] shadow-inner border border-primary/10">
              <Sparkles className="w-[24px] h-[24px] text-primary animate-pulse relative z-10" />
            </div>
            <span className="text-[10px] font-black text-primary uppercase tracking-[0.1em]">AI상담</span>
          </button>
        </div>
      </nav>

      <WhisperChat 
        forceOpenTrigger={isChatOpen} 
        onTriggerClose={() => setIsChatOpen(false)} 
        hideCard 
      />
    </>
  )
}
