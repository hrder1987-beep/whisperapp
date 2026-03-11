
"use client"

import { useState, useEffect, useRef } from "react"
import { AnnouncementData } from "@/lib/types"
import { Megaphone, ChevronRight } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

interface AnnouncementBarProps {
  announcements?: AnnouncementData[]
  duration?: number
}

export function AnnouncementBar({ announcements = [], duration = 4 }: AnnouncementBarProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isVisible, setIsVisible] = useState(true)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (announcements.length <= 1) return

    const interval = setInterval(() => {
      setIsVisible(false)
      // 이전 타임아웃이 있다면 클리어
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      
      timeoutRef.current = setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % announcements.length)
        setIsVisible(true)
      }, 500)
    }, duration * 1000)

    return () => {
      clearInterval(interval)
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [announcements.length, duration])

  if (!announcements || announcements.length === 0) return null

  const current = announcements[currentIndex]
  if (!current) return null

  return (
    <Link href={current.link || "#"} className="block mb-4 md:mb-6">
      <div className="bg-primary/10 border border-primary/20 p-3 md:p-4 rounded-xl md:rounded-2xl flex items-center justify-between group hover:bg-primary/20 transition-all duration-500 overflow-hidden min-h-[50px] md:min-h-[60px]">
        <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
          <Megaphone className="w-4 h-4 md:w-5 md:h-5 text-primary animate-bounce shrink-0" />
          <div className={cn(
            "transition-all duration-500 transform w-full min-w-0",
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"
          )}>
            <span className="text-[12px] md:text-sm font-black text-accent truncate block break-words">
              {current.text}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1 md:gap-2 shrink-0 ml-2 md:ml-4">
          <span className="text-[9px] md:text-[10px] font-black text-accent/30 hidden xs:block">
            {currentIndex + 1}/{announcements.length}
          </span>
          <ChevronRight className="w-3.5 h-3.5 md:w-4 md:h-4 text-accent/30 group-hover:translate-x-1 transition-transform" />
        </div>
      </div>
    </Link>
  )
}
