"use client"

import { User } from 'lucide-react'
import { cn } from "@/lib/utils"

interface AvatarIconProps {
  src?: string | null
  avatarUrl?: string | null // 호환성을 위해 유지
  seed?: string
  avatarId?: string
  className?: string
}

export function AvatarIcon({ src, avatarUrl, seed, avatarId, className }: AvatarIconProps) {
  const displaySrc = src || avatarUrl
  
  // 랜덤 배경색 생성을 위한 시드 처리
  const getBgColor = () => {
    const string = seed || avatarId || "default"
    let hash = 0
    for (let i = 0; i < string.length; i++) {
      hash = string.charCodeAt(i) + ((hash << 5) - hash)
    }
    const h = Math.abs(hash) % 360
    return `hsl(${h}, 40%, 90%)`
  }

  return (
    <div 
      className={cn(
        "relative flex shrink-0 items-center justify-center overflow-hidden rounded-full transition-transform duration-500",
        !displaySrc && "border border-black/[0.03]",
        className
      )}
      style={{ backgroundColor: !displaySrc ? getBgColor() : 'transparent' }}
    >
      {displaySrc ? (
        <img 
          src={displaySrc} 
          alt="Avatar" 
          className="h-full w-full object-cover" 
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none'
          }}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-accent/30">
          {seed ? (
            <span className="text-[40%] font-black uppercase">{seed.substring(0, 2)}</span>
          ) : (
            <User className="h-1/2 w-1/2" />
          )}
        </div>
      )}
    </div>
  )
}
