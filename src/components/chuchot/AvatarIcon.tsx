
"use client"

import { 
  Bird, 
  Cat, 
  Dog, 
  Fish, 
  Rabbit, 
  Snail, 
  Squirrel, 
  Turtle, 
  Bug, 
  Antenna,
  Sparkles
} from "lucide-react"
import { cn } from "@/lib/utils"

/**
 * 박학다식한 HR 가이드 '알디'의 시그니처 아이콘
 * 안경, 눈, 코, 입이 포함된 스마트한 에그 캐릭터
 */
const AldiEggIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 100 120" className={cn("w-full h-full p-1", className)} fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* 몸체 - 부드러운 에그 쉐입 (Whisper Primary Color) */}
    <path
      d="M50 110C75 110 90 85 90 55C90 25 72 10 50 10C28 10 10 25 10 55C10 85 25 110 50 110Z"
      fill="currentColor"
    />
    
    {/* 안경 테 - 지적인 전문가의 상징 */}
    <circle cx="35" cy="52" r="13" stroke="white" strokeWidth="2.5" />
    <circle cx="65" cy="52" r="13" stroke="white" strokeWidth="2.5" />
    <path d="M48 52H52" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
    <path d="M22 52H18" stroke="white" strokeWidth="2" strokeLinecap="round" />
    <path d="M78 52H82" stroke="white" strokeWidth="2" strokeLinecap="round" />

    {/* 눈 - 안경 너머의 총명한 눈 */}
    <circle cx="35" cy="52" r="3" fill="white" />
    <circle cx="65" cy="52" r="3" fill="white" />
    
    {/* 코 - 앙증맞은 포인트 */}
    <ellipse cx="50" cy="62" rx="2" ry="1.5" fill="white" fillOpacity="0.8" />
    
    {/* 입 - 친절한 미소 */}
    <path d="M42 75C42 75 50 82 58 75" stroke="white" strokeWidth="3" strokeLinecap="round" />
    
    {/* 볼터치 */}
    <circle cx="28" cy="68" r="4" fill="white" fillOpacity="0.2" />
    <circle cx="72" cy="68" r="4" fill="white" fillOpacity="0.2" />
    
    {/* 머리 위 지능 안테나 */}
    <circle cx="50" cy="18" r="4" fill="white" fillOpacity="0.6" />
    <path d="M50 18V10" stroke="white" strokeWidth="2" strokeLinecap="round" />
  </svg>
)

const icons = [
  { id: "bird", Icon: Bird, color: "text-blue-500" },
  { id: "cat", Icon: Cat, color: "text-orange-500" },
  { id: "dog", Icon: Dog, color: "text-amber-600" },
  { id: "fish", Icon: Fish, color: "text-cyan-500" },
  { id: "rabbit", Icon: Rabbit, color: "text-rose-400" },
  { id: "snail", Icon: Snail, color: "text-lime-600" },
  { id: "squirrel", Icon: Squirrel, color: "text-orange-700" },
  { id: "turtle", Icon: Turtle, color: "text-emerald-600" },
  { id: "bug", Icon: Bug, color: "text-red-500" },
  { id: "ant", Icon: Antenna, color: "text-slate-600" },
  { id: "sparkles", Icon: Sparkles, color: "text-accent" },
]

interface AvatarIconProps {
  src?: string
  seed?: string
  avatarId?: string
  className?: string
}

export function AvatarIcon({ src, seed, avatarId, className }: AvatarIconProps) {
  if (src) {
    return (
      <div className={cn(
        "w-10 h-10 rounded-full bg-white border border-primary/5 flex items-center justify-center shadow-md overflow-hidden",
        className
      )}>
        <img src={src} alt="avatar" className="w-full h-full object-cover" />
      </div>
    )
  }

  // 알디 식별 로직 (avatarId 또는 seed 기반)
  const isAldi = avatarId === "aldi" || 
                 seed?.toLowerCase() === "알디" || 
                 seed?.toLowerCase() === "aldi" ||
                 seed?.includes("알디") || 
                 seed?.includes("ALDI");

  if (isAldi) {
    return (
      <div className={cn(
        "w-10 h-10 rounded-full bg-accent text-primary flex items-center justify-center shadow-lg avatar-animation border-2 border-white",
        className
      )}>
        <AldiEggIcon />
      </div>
    )
  }

  const getIcon = () => {
    if (avatarId) {
      return icons.find(i => i.id === avatarId) || icons[0]
    }
    if (seed) {
      const index = seed.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) % (icons.length - 1)
      return icons[index]
    }
    return icons[0]
  }

  const { Icon, color } = getIcon()

  return (
    <div className={cn(
      "w-10 h-10 rounded-full bg-white border border-primary/5 flex items-center justify-center shadow-inner avatar-animation",
      className
    )}>
      <Icon className={cn("w-6 h-6", color)} />
    </div>
  )
}
