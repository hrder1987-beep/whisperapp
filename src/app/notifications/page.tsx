
"use client"

import { useMemo } from "react"
import { useUser, useFirestore, useCollection, useMemoFirebase, updateDocumentNonBlocking } from "@/firebase"
import { collection, query, where, doc } from "firebase/firestore"
import { Header } from "@/components/chuchot/Header"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AppNotification } from "@/lib/types"
import { Bell, Sparkles, MessageSquare, Clock, CheckCircle2 } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { ko } from "date-fns/locale"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

export default function NotificationsPage() {
  const { user } = useUser()
  const db = useFirestore()
  const router = useRouter()

  // 복합 인덱스 에러 방지를 위해 orderBy를 제거하고 클라이언트에서 정렬합니다.
  const notifQuery = useMemoFirebase(() => {
    if (!db || !user) return null
    return query(collection(db, "notifications"), where("userId", "==", user.uid))
  }, [db, user])

  const { data: notificationsData, isLoading } = useCollection<AppNotification>(notifQuery)

  // 클라이언트 사이드 정렬
  const notifications = useMemo(() => {
    return (notificationsData || []).sort((a, b) => b.createdAt - a.createdAt)
  }, [notificationsData])

  const handleNotifClick = (notif: AppNotification) => {
    if (db && !notif.isRead) {
      updateDocumentNonBlocking(doc(db, "notifications", notif.id), { isRead: true })
    }
    router.push(`/?q=${notif.questionId}`)
  }

  const handleReadAll = () => {
    if (!db || !notifications) return
    notifications.forEach(n => {
      if (!n.isRead) updateDocumentNonBlocking(doc(db, "notifications", n.id), { isRead: true })
    })
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <Header />
      <main className="max-w-3xl mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary text-accent rounded-2xl shadow-xl">
              <Bell className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-primary tracking-tighter">알림 센터</h1>
              <p className="text-sm font-bold text-primary/30">활동에 대한 실시간 소식</p>
            </div>
          </div>
          {notifications && notifications.some(n => !n.isRead) && (
            <Button onClick={handleReadAll} variant="ghost" className="text-accent font-black text-xs gap-2">
              <CheckCircle2 className="w-4 h-4" /> 모두 읽음 처리
            </Button>
          )}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20"><Sparkles className="w-12 h-12 animate-spin text-accent" /></div>
        ) : !notifications || notifications.length === 0 ? (
          <div className="text-center py-32 bg-white rounded-[3rem] border border-dashed border-primary/5 shadow-sm">
            <Bell className="w-16 h-16 mx-auto mb-4 text-primary/10" />
            <p className="text-xl font-black text-primary/20">새로운 소식이 없습니다.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {notifications.map((n) => (
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
                      "p-3 rounded-2xl shrink-0",
                      n.isRead ? "bg-primary/5 text-primary/30" : "bg-accent/10 text-accent shadow-sm"
                    )}>
                      <MessageSquare className="w-5 h-5" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex justify-between items-start">
                        <p className={cn(
                          "text-sm font-bold leading-relaxed",
                          n.isRead ? "text-primary/40" : "text-primary"
                        )}>
                          <span className="font-black text-accent">@{n.senderNickname}</span>님이 전문가님의 질문 
                          <span className="text-primary italic"> "{n.questionTitle}" </span>에 새로운 지혜를 속삭였습니다.
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
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
