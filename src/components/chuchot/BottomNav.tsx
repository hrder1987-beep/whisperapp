
"use client"

import { usePathname, useRouter } from "next/navigation"
import { MessageSquareQuote, Award, GraduationCap, Briefcase, Bot, Star, Mail } from "lucide-react"
import { cn } from "@/lib/utils"
import { useState } from "react"
import { AldiChat } from "./ShuChat"
import { useUser, useCollection, useMemoFirebase } from "@/firebase"
import { collection, query, where } from "firebase/firestore"
import { Badge } from "@/components/ui/badge"

export function BottomNav() {
  const pathname = usePathname()
  const router = useRouter()
  const { user } = useUser()
  const [isChatOpen, setIsChatOpen] = useState(false)

  const unreadMessagesQuery = useMemoFirebase(() => {
    if (!user) return null
    return query(
      collection(user.firestore, "messages"),
      where("receiverId", "==", user.uid),
      where("isRead", "==", false)
    )
  }, [user])
  const { data: unreadMessages } = useCollection(unreadMessagesQuery)

  const navItems = [
    { name: "지식 속삭임", href: "/", icon: MessageSquareQuote },
    { name: "위스퍼러", href: "/mentors", icon: Award },
    { name: "프로그램", href: "/programs", icon: GraduationCap },
    { name: "강사 정보", href: "/instructors", icon: Star },
    { name: "쪽지함", href: "/messages", icon: Mail, badgeCount: unreadMessages?.length || 0 },
    { name: "채용 정보", href: "/jobs", icon: Briefcase },
  ]

  return (
    <>
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-lg border-t border-primary/5 px-1 pb-safe shadow-[0_-10px_40px_rgba(0,0,0,0.08)] rounded-t-[2.5rem]">
        <div className="flex justify-around items-center h-18 md:h-20 py-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            const Icon = item.icon
            
            // 쪽지함은 로그인한 사용자에게만 특별한 배지와 함께 노출 (비로그인시에는 그냥 아이콘만 노출되거나 홈으로 유도 가능)
            if (item.name === "쪽지함" && !user) return null;

            return (
              <button
                key={item.href}
                onClick={() => router.push(item.href)}
                className="flex flex-col items-center justify-center gap-1.5 w-full transition-all active:scale-90"
              >
                <div className={cn(
                  "relative p-2 rounded-2xl transition-all duration-300",
                  isActive ? "bg-accent/15 shadow-inner" : ""
                )}>
                  <Icon className={cn(
                    "w-4 h-4 md:w-5 md:h-5 transition-colors",
                    isActive ? "text-accent stroke-[3]" : "text-primary/30"
                  )} />
                  {item.badgeCount && item.badgeCount > 0 ? (
                    <Badge className="absolute -top-1 -right-1 bg-accent text-primary border-none text-[8px] h-4 w-4 flex items-center justify-center p-0 rounded-full animate-bounce">
                      {item.badgeCount}
                    </Badge>
                  ) : null}
                </div>
                <span className={cn(
                  "text-[8px] font-black transition-colors whitespace-nowrap tracking-tighter",
                  isActive ? "text-primary" : "text-primary/25"
                )}>
                  {item.name}
                </span>
              </button>
            )
          })}
          
          <button
            onClick={() => setIsChatOpen(true)}
            className="flex flex-col items-center justify-center gap-1.5 w-full transition-all active:scale-90 group"
          >
            <div className="relative p-2 rounded-2xl">
              <div className="absolute inset-0 bg-accent/20 blur-md rounded-full animate-pulse group-hover:bg-accent/40 transition-all"></div>
              <Bot className="w-4 h-4 md:w-5 md:h-5 text-accent relative stroke-[3]" />
            </div>
            <span className="text-[8px] font-black text-accent tracking-tighter">알디 챗</span>
          </button>
        </div>
      </nav>

      <div className="hidden">
         <AldiChat forceOpenTrigger={isChatOpen} onTriggerClose={() => setIsChatOpen(false)} />
      </div>
    </>
  )
}
