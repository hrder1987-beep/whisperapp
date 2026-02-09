
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

const AldiEggIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 100 120" className={cn("w-full h-full p-1", className)} fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* 몸체 - 부드러운 에그 쉐입 */}
    <path
      d="M50 110C75 110 90 85 90 55C90 25 72 10 50 10C28 10 10 25 10 55C10 85 25 110 50 110Z"
      fill="currentColor"
    />
    
    {/* 안경 - 지적인 HR 가이드의 상징 */}
    <circle cx="35" cy="52" r="12" stroke="white" strokeWidth="3" />
    <circle cx="65" cy="52" r="12" stroke="white" strokeWidth="3" />
    <path d="M47 52H53" stroke="white" strokeWidth="3" strokeLinecap="round" />
    <path d="M23 52H18" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
    <path d="M77 52H82" stroke="white" strokeWidth="2.5" strokeLinecap="round" />

    {/* 눈 - 안경 너머로 반짝이는 눈 */}
    <circle cx="35" cy="52" r="3.5" fill="white" />
    <circle cx="65" cy="52" r="3.5" fill="white" />
    
    {/* 코 - 앙증맞은 코 */}
    <circle cx="50" cy="65" r="2.5" fill="white" fillOpacity="0.9" />
    
    {/* 입 - 친근한 미소 */}
    <path d="M42 78C42 78 50 85 58 78" stroke="white" strokeWidth="3.5" strokeLinecap="round" />
    
    {/* 볼터치 - 수줍은 전문가의 열정 */}
    <circle cx="25" cy="72" r="5" fill="white" fillOpacity="0.3" />
    <circle cx="75" cy="72" r="5" fill="white" fillOpacity="0.3" />
    
    {/* 머리 위 안테나/빛 - AI 인텔리전스 상징 */}
    <circle cx="50" cy="20" r="5" fill="white" fillOpacity="0.7" />
    <path d="M50 20L50 12" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
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

  // 알디(ALDI) 식별 로직 강화
  const isAldi = avatarId === "aldi" || 
                 seed?.toLowerCase() === "알디" || 
                 seed?.toLowerCase() === "aldi" ||
                 seed?.includes("알디") || 
                 seed?.includes("ALDI");

  if (isAldi) {
    return (
      <div className={cn(
        "w-10 h-10 rounded-full bg-accent text-white flex items-center justify-center shadow-lg avatar-animation border-2 border-white",
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
