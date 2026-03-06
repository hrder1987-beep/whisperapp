"use client"

import { usePathname, useRouter } from "next/navigation"
import { MessageSquareQuote, Award, GraduationCap, Sparkles, Users } from "lucide-react"
import { cn } from "@/lib/utils"
import { useState, useEffect } from "react"
import { WhisperChat } from "@/components/whisper/WhisperChat"
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
      <nav className="fixed bottom-0 left-0 right-0 z-[100] bg-white/95 backdrop-blur-3xl border-t border-black/[0.04] pb-safe shadow-[0_-15px_50px_rgba(0,0,0,0.12)]">
        <div className="flex justify-around items-center h-[80px] px-2 max-w-lg mx-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            const Icon = item.icon
            
            return (
              <button
                key={item.href}
                onClick={() => router.push(item.href)}
                className="flex flex-col items-center justify-center w-full relative h-full transition-all active:scale-90"
              >
                <div className={cn(
                  "relative mb-1 p-2 rounded-xl transition-all duration-300",
                  isActive ? "bg-primary/20" : ""
                )}>
                  <Icon className={cn(
                    "w-[26px] h-[24px] transition-all duration-300",
                    isActive ? "text-[#163300] scale-110" : "text-[#163300]/30"
                  )} />
                </div>
                <span className={cn(
                  "text-[10px] font-black transition-colors uppercase tracking-widest",
                  isActive ? "text-[#163300]" : "text-[#163300]/40"
                )}>
                  {item.name}
                </span>
              </button>
            )
          })}
          
          <button
            onClick={() => setIsChatOpen(true)}
            className="flex flex-col items-center justify-center w-full h-full transition-all active:scale-90"
          >
            <div className="relative mb-1 bg-[#163300] p-2.5 rounded-xl shadow-xl group">
              <Sparkles className="w-[22px] h-[22px] text-primary animate-pulse" />
            </div>
            <span className="text-[10px] font-black text-[#163300] tracking-widest">AI상담</span>
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