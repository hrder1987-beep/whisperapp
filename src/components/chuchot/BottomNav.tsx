
"use client"

import { usePathname, useRouter } from "next/navigation"
import { MessageSquareQuote, Award, GraduationCap, Briefcase, Mail, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"
import { useState } from "react"
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

  const unreadMessagesQuery = useMemoFirebase(() => {
    if (!db || typeof db !== 'object' || !user || !user.uid) return null
    try {
      return query(
        collection(db, "messages"),
        where("receiverId", "==", user.uid),
        where("isRead", "==", false)
      )
    } catch (e) {
      return null
    }
  }, [db, user])
  
  const { data: unreadMessages } = useCollection(unreadMessagesQuery)

  const navItems = [
    { name: "지식", href: "/", icon: MessageSquareQuote },
    { name: "위스퍼러", href: "/mentors", icon: Award },
    { name: "솔루션", href: "/programs", icon: GraduationCap },
    { name: "쪽지", href: "/messages", icon: Mail, badgeCount: unreadMessages?.length || 0 },
    { name: "채용", href: "/jobs", icon: Briefcase },
  ]

  return (
    <>
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-black/5 pb-safe shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
        <div className="flex justify-around items-center h-16">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            const Icon = (item as any).icon
            
            if (item.name === "쪽지" && !user) return null;

            return (
              <button
                key={item.href}
                onClick={() => router.push(item.href)}
                className="flex flex-col items-center justify-center w-full"
              >
                <div className="relative">
                  <Icon className={cn(
                    "w-5 h-5 mb-1 transition-colors",
                    isActive ? "text-primary" : "text-muted-foreground/40"
                  )} />
                  {(item as any).badgeCount && (item as any).badgeCount > 0 ? (
                    <Badge className="absolute -top-1 -right-2 bg-red-500 text-white border-none text-[8px] h-4 w-4 p-0 flex items-center justify-center rounded-full">
                      {(item as any).badgeCount}
                    </Badge>
                  ) : null}
                </div>
                <span className={cn(
                  "text-[10px] font-bold",
                  isActive ? "text-primary" : "text-muted-foreground/40"
                )}>
                  {item.name}
                </span>
              </button>
            )
          })}
          
          <button
            onClick={() => setIsChatOpen(true)}
            className="flex flex-col items-center justify-center w-full"
          >
            <Sparkles className="w-5 h-5 mb-1 text-primary animate-pulse" />
            <span className="text-[10px] font-black text-primary">AI 상담</span>
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
