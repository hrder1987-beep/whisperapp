
"use client"

import { cn } from "@/lib/utils"

interface LogoProps {
  className?: string
  isLight?: boolean
  onClick?: () => void
}

export function Logo({ className = "", isLight = false, onClick }: LogoProps) {
  // 브랜드의 깊이감을 더해주는 가장 찐한 연두색(다크 그린)
  const logoGreen = isLight ? "text-white" : "text-[#2D4A1E]"
  const accentLime = "#CDECB1" // 라이트 라임 포인트 컬러

  return (
    <div 
      className={cn("flex items-center gap-3 group cursor-pointer select-none", className)}
      onClick={onClick}
    >
      <div className="relative flex items-center justify-center">
        {/* 심볼 아이콘 컨테이너 */}
        <div className={cn(
          "w-10 h-10 flex items-center justify-center transition-all duration-500 group-hover:scale-110 group-hover:rotate-6",
          logoGreen
        )}>
          <svg 
            viewBox="0 0 24 24" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg" 
            className="w-8 h-8"
          >
            {/* 말풍선 형태의 로고 심볼 */}
            <path 
              d="M12 21C16.9706 21 21 16.9706 21 12C21 7.02944 16.9706 3 12 3C7.02944 3 3 7.02944 3 12C3 13.4876 3.36093 14.891 4 16.1272L3 21L7.8728 20C9.10897 20.6391 10.5124 21 12 21Z" 
              stroke="currentColor" 
              strokeWidth="2.5" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
            />
            {/* 인텔리전스를 상징하는 포인트 도트 */}
            <circle cx="8" cy="12" r="1.2" fill={accentLime} className="group-hover:animate-pulse" />
            <circle cx="12" cy="12" r="1.2" fill={accentLime} className="group-hover:animate-pulse [animation-delay:200ms]" />
            <circle cx="16" cy="12" r="1.2" fill={accentLime} className="group-hover:animate-pulse [animation-delay:400ms]" />
          </svg>
        </div>
        
        {/* 호버 시 은은한 광채 효과 */}
        {!isLight && (
          <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>
        )}
      </div>

      <div className="flex flex-col -space-y-1.5">
        <span className={cn(
          "font-headline text-[24px] font-black tracking-tighter transition-colors duration-300",
          logoGreen
        )}>
          WHISPER
        </span>
        <div className="flex items-center gap-2">
          <div className={cn("h-[2px] w-4 rounded-full shrink-0", isLight ? "bg-white/40" : "bg-[#CDECB1]")}></div>
          <span className={cn(
            "text-[10px] font-bold tracking-[0.15em] uppercase whitespace-nowrap",
            isLight ? "text-white/60" : "text-[#2D4A1E]/50"
          )}>
            HR Intelligence
          </span>
        </div>
      </div>
    </div>
  )
}
