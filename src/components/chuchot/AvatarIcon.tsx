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
  // 프로필 사진이 있는 경우 이미지 노출
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

  // 사진이 없는 경우 동물/곤충 아이콘 할당
  const getIcon = () => {
    if (avatarId) {
      return icons.find(i => i.id === avatarId) || icons[0]
    }
    if (seed) {
      // '알디', '슈쇼' 또는 'AI'라는 이름이 포함되면 반짝이 아이콘 고정 (AI 어시스턴트)
      if (seed.includes("알디") || seed.includes("슈쇼") || seed.includes("AI")) return icons.find(i => i.id === "sparkles") || icons[0]
      
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
