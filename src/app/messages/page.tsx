
"use client"

import { useState, useMemo } from "react"
import { Header } from "@/components/whisper/Header"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { useUser, useFirestore, useCollection, useMemoFirebase, updateDocumentNonBlocking } from "@/firebase"
import { collection, query, where, doc } from "firebase/firestore"
import { PrivateMessage } from "@/lib/types"
import { Mail, Send, Inbox, Clock, CheckCircle2 } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { ko } from "date-fns/locale"
import { AvatarIcon } from "@/components/whisper/AvatarIcon"
import { MessageDialog } from "@/components/whisper/MessageDialog"
import { cn } from "@/lib/utils"

export default function MessagesPage() {
  const { user } = useUser()
  const db = useFirestore()
  const [activeTab, setActiveTab] = useState("inbox")
  const [replyTarget, setReplyTarget] = useState<{ id: string, nickname: string } | null>(null)

  // 복합 인덱스 오류를 방지하기 위해 orderBy를 제거하고 클라이언트에서 정렬합니다.
  const inboxQuery = useMemoFirebase(() => {
    if (!db || !user) return null
    return query(
      collection(db, "messages"),
      where("receiverId", "==", user.uid)
    )
  }, [db, user])

  const outboxQuery = useMemoFirebase(() => {
    if (!db || !user) return null
    return query(
      collection(db, "messages"),
      where("senderId", "==", user.uid)
    )
  }, [db, user])

  const { data: inboxMessagesData, isLoading: isInboxLoading } = useCollection<PrivateMessage>(inboxQuery)
  const { data: outboxMessagesData, isLoading: isOutboxLoading } = useCollection<PrivateMessage>(outboxQuery)

  // 클라이언트 사이드 정렬
  const inboxMessages = useMemo(() => {
    return (inboxMessagesData || []).sort((a, b) => b.createdAt - a.createdAt)
  }, [inboxMessagesData])

  const outboxMessages = useMemo(() => {
    return (outboxMessagesData || []).sort((a, b) => b.createdAt - a.createdAt)
  }, [outboxMessagesData])

  const handleMarkAsRead = (msg: PrivateMessage) => {
    if (db && !msg.isRead && user?.uid === msg.receiverId) {
      updateDocumentNonBlocking(doc(db, "messages", msg.id), { isRead: true })
    }
  }

  const MessageList = ({ messages, type }: { messages: PrivateMessage[], type: 'inbox' | 'outbox' }) => {
    if (messages.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-24 text-primary/20 bg-white rounded-[2.5rem] border border-dashed border-primary/5">
          <Mail className="w-16 h-16 mb-4 opacity-50" />
          <p className="text-xl font-black">쪽지함이 비어있습니다.</p>
        </div>
      )
    }

    return (
      <div className="space-y-4">
        {messages.map((msg) => (
          <Card 
            key={msg.id} 
            className={cn(
              "bg-white border-primary/5 rounded-[2rem] overflow-hidden shadow-sm hover:shadow-xl transition-all cursor-pointer",
              type === 'inbox' && !msg.isRead && "ring-2 ring-accent/30"
            )}
            onClick={() => handleMarkAsRead(msg)}
          >
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <AvatarIcon seed={type === 'inbox' ? msg.senderNickname : msg.receiverNickname} className="w-10 h-10" />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-black text-primary">
                        {type === 'inbox' ? `From. @${msg.senderNickname}` : `To. @${msg.receiverNickname}`}
                      </span>
                      {type === 'inbox' && !msg.isRead && (
                        <Badge className="bg-accent text-primary text-[9px] font-black border-none px-2 py-0.5 animate-pulse">NEW</Badge>
                      )}
                    </div>
                    <span className="text-[10px] font-bold text-primary/30 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDistanceToNow(msg.createdAt, { addSuffix: true, locale: ko })}
                    </span>
                  </div>
                </div>
                {type === 'inbox' && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-accent hover:bg-accent/10 font-black gap-1.5"
                    onClick={(e) => {
                      e.stopPropagation();
                      setReplyTarget({ id: msg.senderId, nickname: msg.senderNickname });
                    }}
                  >
                    <Send className="w-3.5 h-3.5" />
                    답장하기
                  </Button>
                )}
              </div>
              <p className="text-sm text-primary/70 leading-relaxed pl-13 italic">
                "{msg.content}"
              </p>
              {type === 'outbox' && (
                <div className="mt-4 pt-4 border-t border-primary/5 flex items-center justify-end">
                   <div className="flex items-center gap-1.5 text-[10px] font-black">
                      {msg.isRead ? (
                        <span className="text-emerald-500 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> 읽음
                        </span>
                      ) : (
                        <span className="text-primary/20">읽지 않음</span>
                      )}
                   </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <Header />
      <main className="max-w-4xl mx-auto px-4 py-12">
        <div className="flex items-center gap-4 mb-10">
          <div className="text-primary">
            <Mail className="w-10 h-10" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-primary tracking-tighter">쪽지함</h1>
            <p className="text-sm font-bold text-primary/30">동료 전문가들과 나누는 프라이빗한 대화</p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-primary/5 p-1 rounded-2xl mb-10 h-14">
            <TabsTrigger value="inbox" className="rounded-xl font-black text-base gap-2 data-[state=active]:bg-white data-[state=active]:shadow-lg">
              <Inbox className="w-4 h-4" />
              받은 쪽지
              {inboxMessages.filter(m => !m.isRead).length > 0 && (
                <Badge className="ml-1 bg-accent text-primary border-none text-[10px] h-5 w-5 flex items-center justify-center p-0 rounded-full">
                  {inboxMessages.filter(m => !m.isRead).length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="outbox" className="rounded-xl font-black text-base gap-2 data-[state=active]:bg-white data-[state=active]:shadow-lg">
              <Send className="w-4 h-4" />
              보낸 쪽지
            </TabsTrigger>
          </TabsList>

          <TabsContent value="inbox">
            <MessageList messages={inboxMessages} type="inbox" />
          </TabsContent>
          
          <TabsContent value="outbox">
            <MessageList messages={outboxMessages} type="outbox" />
          </TabsContent>
        </Tabs>
      </main>

      {replyTarget && (
        <MessageDialog 
          isOpen={!!replyTarget}
          onClose={() => setReplyTarget(null)}
          receiverId={replyTarget.id}
          receiverNickname={replyTarget.nickname}
        />
      )}
    </div>
  )
}
