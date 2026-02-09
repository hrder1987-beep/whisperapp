
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
        <div className={cn(
          "absolute inset-0 blur-lg rounded-full animate-pulse transition-all duration-500",
          isLight ? "bg-accent/30 group-hover:bg-accent/50" : "bg-accent/20 group-hover:bg-accent/40"
        )}></div>
        <MessageSquareQuote className="w-8 h-8 text-accent relative logo-animation" />
      </div>
      <div className="flex flex-col -space-y-1">
        <span className={cn(
          "font-headline text-2xl font-black tracking-tighter transition-colors duration-300",
          isLight ? "text-white group-hover:text-accent" : "text-primary group-hover:text-accent"
        )}>
          WHISPER
        </span>
        <span className={cn(
          "text-[9px] font-bold tracking-[0.2em] uppercase ml-0.5",
          isLight ? "text-accent/90" : "text-accent/80"
        )}>
          HR Intelligence Hub
        </span>
      </div>
    </div>
  )
}
