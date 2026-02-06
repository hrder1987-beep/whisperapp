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
  Component,
  Ghost
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
]

interface AvatarIconProps {
  seed?: string
  avatarId?: string
  className?: string
}

export function AvatarIcon({ seed, avatarId, className }: AvatarIconProps) {
  // 닉네임(seed)이나 고유 ID가 있으면 해당 값으로 아이콘을 고정
  const getIcon = () => {
    if (avatarId) {
      return icons.find(i => i.id === avatarId) || icons[0]
    }
    if (seed) {
      const index = seed.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) % icons.length
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
