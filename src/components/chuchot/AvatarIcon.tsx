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
  Sparkles,
  Search,
  MapPin,
  Building2,
  Megaphone,
  BookOpen
} from "lucide-react"
import { cn } from "@/lib/utils"

/**
 * 박학다식한 HR 가이드 '알디'의 시그니처 아이콘
 */
const AldiEggIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 100 120" className={cn("w-full h-full p-1", className)} fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M50 110C75 110 90 85 90 55C90 25 72 10 50 10C28 10 10 25 10 55C10 85 25 110 50 110Z"
      fill="currentColor"
    />
    <circle cx="35" cy="52" r="13" stroke="white" strokeWidth="2.5" />
    <circle cx="65" cy="52" r="13" stroke="white" strokeWidth="2.5" />
    <path d="M48 52H52" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
    <circle cx="35" cy="52" r="3" fill="white" />
    <circle cx="65" cy="52" r="3" fill="white" />
    <path d="M42 75C42 75 50 82 58 75" stroke="white" strokeWidth="3" strokeLinecap="round" />
  </svg>
)

/**
 * 사례 중심 전문가 '위스퍼라' 아이콘
 */
const WhisperraIcon = ({ className }: { className?: string }) => (
  <div className={cn("flex items-center justify-center bg-primary text-accent rounded-full p-2 shadow-lg", className)}>
    <div className="relative">
      <Megaphone className="w-6 h-6" />
      <Sparkles className="w-3 h-3 absolute -top-1 -right-1 text-white animate-pulse" />
    </div>
  </div>
)

/**
 * 공간 전문가 '동산' 아이콘
 */
const DongsanIcon = ({ className }: { className?: string }) => (
  <div className={cn("flex items-center justify-center bg-emerald-600 text-white rounded-full p-2 shadow-lg", className)}>
    <div className="relative">
      <Building2 className="w-6 h-6" />
      <MapPin className="w-3 h-3 absolute -bottom-1 -right-1 text-accent" />
    </div>
  </div>
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

  // 봇 전용 아이콘 식별
  if (avatarId === "aldi" || seed?.toLowerCase() === "aldi" || seed === "알디") {
    return (
      <div className={cn(
        "w-10 h-10 rounded-full bg-accent text-primary flex items-center justify-center shadow-lg border-2 border-white",
        className
      )}>
        <AldiEggIcon />
      </div>
    )
  }

  if (avatarId === "whisperra" || seed === "위스퍼라") {
    return <WhisperraIcon className={className} />
  }

  if (avatarId === "dongsan" || seed === "동산") {
    return <DongsanIcon className={className} />
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
      "w-10 h-10 rounded-full bg-white border border-primary/5 flex items-center justify-center shadow-inner",
      className
    )}>
      <Icon className={cn("w-6 h-6", color)} />
    </div>
  )
}
