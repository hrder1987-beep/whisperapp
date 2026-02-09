
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
    {/* 몸체 */}
    <path
      d="M50 110C75 110 90 85 90 55C90 25 72 10 50 10C28 10 10 25 10 55C10 85 25 110 50 110Z"
      fill="currentColor"
    />
    
    {/* 안경 */}
    <circle cx="35" cy="52" r="10" stroke="white" strokeWidth="2.5" />
    <circle cx="65" cy="52" r="10" stroke="white" strokeWidth="2.5" />
    <path d="M45 52H55" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
    <path d="M25 52H20" stroke="white" strokeWidth="2" strokeLinecap="round" />
    <path d="M75 52H80" stroke="white" strokeWidth="2" strokeLinecap="round" />

    {/* 눈 */}
    <circle cx="35" cy="52" r="3" fill="white" />
    <circle cx="65" cy="52" r="3" fill="white" />
    
    {/* 코 */}
    <circle cx="50" cy="62" r="2" fill="white" fillOpacity="0.8" />
    
    {/* 입 */}
    <path d="M44 72C44 72 50 78 56 72" stroke="white" strokeWidth="3" strokeLinecap="round" />
    
    {/* 볼터치 */}
    <circle cx="28" cy="68" r="4" fill="white" fillOpacity="0.3" />
    <circle cx="72" cy="68" r="4" fill="white" fillOpacity="0.3" />
    
    {/* 머리 위 안테나/빛 */}
    <circle cx="50" cy="18" r="4" fill="white" fillOpacity="0.6" />
    <path d="M50 18L50 12" stroke="white" strokeWidth="2" strokeLinecap="round" />
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

  const isAldi = seed?.includes("알디") || seed?.includes("ALDI") || avatarId === "aldi";

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
