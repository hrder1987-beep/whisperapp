"use client"

import { cn } from "@/lib/utils"

interface LogoProps {
  className?: string
  isLight?: boolean
  onClick?: () => void
}

export function Logo({ className = "", isLight = false, onClick }: LogoProps) {
  return (
    <div 
      className={cn("flex items-center gap-3 group cursor-pointer select-none", className)}
      onClick={onClick}
    >
      <div className="relative flex items-center justify-center">
        {/* Transparent Icon Container */}
        <div className={cn(
          "w-10 h-10 flex items-center justify-center transition-all duration-500 group-hover:scale-110 group-hover:rotate-6",
          isLight ? "text-white" : "text-accent"
        )}>
          <svg 
            viewBox="0 0 24 24" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg" 
            className="w-8 h-8"
          >
            {/* Minimalist Speech Bubble with a sharp trendy tail */}
            <path 
              d="M12 21C16.9706 21 21 16.9706 21 12C21 7.02944 16.9706 3 12 3C7.02944 3 3 7.02944 3 12C3 13.4876 3.36093 14.891 4 16.1272L3 21L7.8728 20C9.10897 20.6391 10.5124 21 12 21Z" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
            />
            {/* Intelligence Pulse Dots */}
            <circle cx="8" cy="12" r="1" fill="#CDECB1" className="animate-pulse" />
            <circle cx="12" cy="12" r="1" fill="#CDECB1" className="animate-pulse [animation-delay:200ms]" />
            <circle cx="16" cy="12" r="1" fill="#CDECB1" className="animate-pulse [animation-delay:400ms]" />
          </svg>
        </div>
        
        {/* Subtle Background Glow on Hover */}
        {!isLight && (
          <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>
        )}
      </div>

      <div className="flex flex-col -space-y-1.5">
        <span className={cn(
          "font-headline text-[22px] font-black tracking-tighter transition-colors duration-300",
          isLight ? "text-white" : "text-accent"
        )}>
          WHISPER
        </span>
        <div className="flex items-center gap-1.5">
          <div className={cn("h-0.5 w-3 rounded-full shrink-0", isLight ? "bg-white/40" : "bg-primary")}></div>
          <span className={cn(
            "text-[9px] font-black tracking-[0.25em] uppercase whitespace-nowrap",
            isLight ? "text-white/60" : "text-accent/40"
          )}>
            HR Intelligence
          </span>
        </div>
      </div>
    </div>
  )