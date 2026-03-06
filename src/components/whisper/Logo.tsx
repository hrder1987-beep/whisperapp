
"use client"

import { cn } from "@/lib/utils"

interface LogoProps {
  className?: string
  isLight?: boolean
  onClick?: () => void
}

export function Logo({ className = "", isLight = false, onClick }: LogoProps) {
  // 가장 찐한 딥 포레스트 그린 컬러 확정
  const logoGreen = isLight ? "text-white" : "text-[#163300]"
  const accentLime = "#CDECB1" 

  return (
    <div 
      className={cn("flex items-center gap-2 group cursor-pointer select-none", className)}
      onClick={onClick}
    >
      <div className="relative flex items-center justify-center">
        <div className={cn(
          "w-11 h-11 flex items-center justify-center transition-all duration-500 group-hover:scale-110",
          logoGreen
        )}>
          <svg 
            viewBox="0 0 24 24" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg" 
            className="w-10 h-10"
          >
            <path 
              d="M12 21C16.9706 21 21 16.9706 21 12C21 7.02944 16.9706 3 12 3C7.02944 3 3 7.02944 3 12C3 13.4876 3.36093 14.891 4 16.1272L3 21L7.8728 20C9.10897 20.6391 10.5124 21 12 21Z" 
              fill="currentColor"
            />
            <circle cx="8" cy="12" r="1.8" fill={accentLime} className="group-hover:animate-pulse" />
            <circle cx="12" cy="12" r="1.8" fill={accentLime} className="group-hover:animate-pulse [animation-delay:200ms]" />
            <circle cx="16" cy="12" r="1.8" fill={accentLime} className="group-hover:animate-pulse [animation-delay:400ms]" />
          </svg>
        </div>
        {!isLight && (
          <div className="absolute inset-0 bg-primary/30 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>
        )}
      </div>

      <div className="flex flex-col -space-y-2">
        <span className={cn(
          "font-headline text-[28px] font-[900] tracking-tighter transition-colors duration-300",
          logoGreen
        )}>
          WHISPER
        </span>
        <div className="flex items-center gap-2">
          <div className={cn("h-[3px] w-5 rounded-full shrink-0", isLight ? "bg-white/40" : "bg-[#CDECB1]")}></div>
          <span className={cn(
            "text-[11px] font-black tracking-[0.2em] uppercase whitespace-nowrap",
            isLight ? "text-white/60" : "text-[#163300]/60"
          )}>
            HR Intelligence
          </span>
        </div>
      </div>
    </div>
  )
}
