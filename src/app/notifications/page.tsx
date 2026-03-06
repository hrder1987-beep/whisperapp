
"use client"

import { useMemo, useEffect, useState } from "react"
import { useUser, useFirestore, useCollection, useMemoFirebase, updateDocumentNonBlocking } from "@/firebase"
import { collection, query, where, doc } from "firebase/firestore"
import { Header } from "@/components/whisper/Header"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AppNotification } from "@/lib/types"
import { Bell, Sparkles, MessageSquare, Clock, CheckCircle2, UserPlus, ShieldCheck } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { ko } from "date-fns/locale"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

export default function NotificationsPage() {
  const { user, isUserLoading } = useUser()
  const db = useFirestore()
  const router = useRouter()
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const notifQuery = useMemoFirebase(() => {
    if (!db || !user?.uid) return null
    return query(collection(db, "notifications"), where("userId", "==", user.uid))
  }, [db, user?.uid])

  const { data: notificationsData, isLoading: isDataLoading } = useCollection<AppNotification>(notifQuery)

  const notifications = useMemo(() => {
    if (!notificationsData) return []
    return [...notificationsData].sort((a, b) => b.createdAt - a.createdAt)
  }, [notificationsData])

  const handleNotifClick = (notif: AppNotification) => {
    if (db && !notif.isRead) {
      updateDocumentNonBlocking(doc(db, "notifications", notif.id), { isRead: true })
    }
    
    if (notif.type === 'gathering_applied' || notif.type === 'gathering_approved' || notif.type === 'gathering_rejected') {
      router.push(`/gatherings/${notif.questionId}`)
    } else {
      router.push(`/questions/${notif.questionId}`)
    }
  }

  const handleReadAll = () => {
    if (!db || !notifications) return
    notifications.forEach(n => {
      if (!n.isRead) updateDocumentNonBlocking(doc(db, "notifications", n.id), { isRead: true })
    })
  }

  if (!isMounted) return null

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <Header />
      <main className="max-w-3xl mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-4">
            <div className="text-primary">
              <Bell className="w-10 h-10" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-primary tracking-tighter">알림 센터</h1>
              <p className="text-sm font-bold text-primary/30">활동에 대한 실시간 소식</p>
            </div>
          </div>
          {notifications.length > 0 && notifications.some(n => !n.isRead) && (
            <Button onClick={handleReadAll} variant="ghost" className="text-accent font-black text-xs gap-2">
              <CheckCircle2 className="w-4 h-4" /> 모두 읽음 처리
            </Button>
          )}
        </div>

        {(isUserLoading || isDataLoading) ? (
          <div className="flex justify-center py-20"><Sparkles className="w-12 h-12 animate-spin text-accent" /></div>
        ) : !user ? (
          <div className="text-center py-32 bg-white rounded-[3rem] border border-dashed border-primary/5 shadow-sm">
            <p className="text-xl font-black text-primary/20">로그인이 필요한 페이지입니다.</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-32 bg-white rounded-[3rem] border border-dashed border-primary/5 shadow-sm">
            <Bell className="w-16 h-16 mx-auto mb-4 text-primary/10" />
            <p className="text-xl font-black text-primary/20">새로운 소식이 없습니다.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {notifications.map((n) => {
              const Icon = n.type === 'new_answer' ? MessageSquare : n.type === 'gathering_applied' ? UserPlus : ShieldCheck;
              const colorClass = n.type === 'new_answer' ? 'text-accent' : n.type === 'gathering_applied' ? 'text-blue-500' : 'text-emerald-500';

              return (
                <Card 
                  key={n.id} 
                  onClick={() => handleNotifClick(n)}
                  className={cn(
                    "bg-white border-primary/5 rounded-[2rem] overflow-hidden shadow-sm hover:shadow-xl transition-all cursor-pointer",
                    !n.isRead && "ring-2 ring-accent/20"
                  )}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className={cn(
                        "shrink-0 mt-1",
                        n.isRead ? "text-primary/20" : colorClass
                      )}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex justify-between items-start">
                          <p className={cn(
                            "text-sm font-bold leading-relaxed",
                            n.isRead ? "text-primary/40" : "text-primary"
                          )}>
                            <span className="font-black text-accent">@{n.senderNickname}</span>님이 
                            {n.type === 'new_answer' && (
                              <> 전문가님의 질문 <span className="text-primary italic"> "{n.questionTitle}" </span>에 새로운 지혜를 속삭였습니다.</>
                            )}
                            {n.type === 'gathering_applied' && (
                              <> 전문가님의 모임 <span className="text-primary italic"> "{n.questionTitle}" </span>에 참여를 신청했습니다.</>
                            )}
                            {n.type === 'gathering_approved' && (
                              <> 전문가님의 모임 <span className="text-primary italic"> "{n.questionTitle}" </span> 참여를 승인했습니다.</>
                            )}
                            {n.type === 'gathering_rejected' && (
                              <> 전문가님의 모임 <span className="text-primary italic"> "{n.questionTitle}" </span> 참여 신청이 반려되었습니다.</>
                            )}
                          </p>
                          {!n.isRead && <div className="w-2 h-2 rounded-full bg-accent animate-pulse shrink-0 mt-1.5 ml-2"></div>}
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] font-black text-primary/20">
                          <Clock className="w-3 h-3" />
                          {formatDistanceToNow(n.createdAt, { addSuffix: true, locale: ko })}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  )
}
