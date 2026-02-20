
"use client"

import { MessageSquareQuote } from "lucide-react"
import { cn } from "@/lib/utils"

interface LogoProps {
  className?: string
  isLight?: boolean
  onClick?: () => void
}

export function Logo({ className = "", isLight = false, onClick }: LogoProps) {
  return (
    <div 
      className={cn("flex items-center gap-2 group cursor-pointer", className)}
      onClick={onClick}
    >
      <div className="relative">
        <MessageSquareQuote className={cn(
          "w-7 h-7 relative transition-all duration-300",
          isLight ? "text-white" : "text-primary"
        )} />
      </div>
      <div className="flex flex-col -space-y-1">
        <span className={cn(
          "font-headline text-xl font-black tracking-tight transition-colors duration-300",
          isLight ? "text-white" : "text-primary"
        )}>
          WHISPER
        </span>
        <span className={cn(
          "text-[8px] font-black tracking-widest uppercase",
          isLight ? "text-white/60" : "text-accent"
        )}>
          HR HUB
        </span>
      </div>
    </div>
  )
}
