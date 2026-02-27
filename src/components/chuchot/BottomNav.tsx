
"use client"

import { usePathname, useRouter } from "next/navigation"
import { MessageSquareQuote, Award, GraduationCap, Briefcase, Mail, Sparkles, Users } from "lucide-react"
import { cn } from "@/lib/utils"
import { useState, useEffect } from "react"
import { AldiChat } from "./ShuChat"
import { useUser, useCollection, useMemoFirebase, useFirestore } from "@/firebase"
import { collection, query, where } from "firebase/firestore"
import { Badge } from "@/components/ui/badge"

export function BottomNav() {
  const pathname = usePathname()
  const router = useRouter()
  const { user } = useUser()
  const db = useFirestore()
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => setIsMounted(true), [])

  const unreadMessagesQuery = useMemoFirebase(() => {
    if (!db || !user || !user.uid) return null
    return query(
      collection(db, "messages"),
      where("receiverId", "==", user.uid),
      where("isRead", "==", false)
    )
  }, [db, user])
  
  const { data: unreadMessages } = useCollection(unreadMessagesQuery)

  if (!isMounted) return null

  const navItems = [
    { name: "지식", href: "/", icon: MessageSquareQuote },
    { name: "모임", href: "/gatherings", icon: Users },
    { name: "위스퍼러", href: "/mentors", icon: Award },
    { name: "쪽지", href: "/messages", icon: Mail, badgeCount: unreadMessages?.length || 0 },
    { name: "채용", href: "/jobs", icon: Briefcase },
  ]

  return (
    <>
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-xl border-t border-black/[0.05] pb-safe shadow-[0_-8px_30px_rgba(0,0,0,0.1)]">
        <div className="flex justify-around items-center h-16 px-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            const Icon = item.icon
            
            if (item.name === "쪽지" && !user) return null;

            return (
              <button
                key={item.href}
                onClick={() => router.push(item.href)}
                className="flex flex-col items-center justify-center w-full relative h-full pt-1"
              >
                <div className="relative">
                  <Icon className={cn(
                    "w-6 h-6 mb-1 transition-all duration-300",
                    isActive ? "text-[#163300] scale-110" : "text-[#163300]/20"
                  )} />
                  {item.badgeCount && item.badgeCount > 0 ? (
                    <Badge className="absolute -top-1.5 -right-2.5 bg-red-500 text-white border-2 border-white text-[8px] h-4.5 w-4.5 p-0 flex items-center justify-center rounded-full font-black animate-pulse">
                      {item.badgeCount}
                    </Badge>
                  ) : null}
                </div>
                <span className={cn(
                  "text-[9px] font-black transition-colors uppercase tracking-tighter",
                  isActive ? "text-[#163300]" : "text-[#163300]/20"
                )}>
                  {item.name}
                </span>
                {isActive && <div className="absolute bottom-1 w-1 h-1 bg-primary rounded-full"></div>}
              </button>
            )
          })}
          
          <button
            onClick={() => setIsChatOpen(true)}
            className="flex flex-col items-center justify-center w-full h-full pt-1"
          >
            <div className="relative">
              <Sparkles className="w-6 h-6 mb-1 text-primary animate-pulse" />
            </div>
            <span className="text-[9px] font-black text-primary uppercase tracking-tighter">AI 상담</span>
          </button>
        </div>
      </nav>

      <AldiChat 
        forceOpenTrigger={isChatOpen} 
        onTriggerClose={() => setIsChatOpen(false)} 
        hideCard 
      />
    </>
  )
}
