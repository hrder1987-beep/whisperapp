
"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useUser, useFirestore, addDocumentNonBlocking } from "@/firebase"
import { collection, doc } from "firebase/firestore"
import { useToast } from "@/hooks/use-toast"
import { Mail, Send } from "lucide-react"

interface MessageDialogProps {
  isOpen: boolean
  onClose: () => void
  receiverId: string
  receiverNickname: string
}

export function MessageDialog({ isOpen, onClose, receiverId, receiverNickname }: MessageDialogProps) {
  const { user } = useUser()
  const db = useFirestore()
  const { toast } = useToast()
  const [content, setContent] = useState("")
  const [isSending, setIsSending] = useState(false)

  const handleSend = async () => {
    if (!user || !content.trim() || !db) return

    setIsSending(true)
    try {
      const messageData = {
        senderId: user.uid,
        senderNickname: user.displayName || "익명전문가",
        receiverId,
        receiverNickname,
        content: content.trim(),
        createdAt: Date.now(),
        isRead: false
      }

      await addDocumentNonBlocking(collection(db, "messages"), messageData)
      
      toast({
        title: "쪽지 전송 완료",
        description: `${receiverNickname}님에게 쪽지를 보냈습니다.`
      })
      setContent("")
      onClose()
    } catch (error) {
      toast({
        title: "전송 실패",
        description: "쪽지를 보내는 중 오류가 발생했습니다.",
        variant: "destructive"
      })
    } finally {
      setIsSending(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-white rounded-[2rem] p-8 border-none shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-black text-primary flex items-center gap-3">
            <Mail className="w-6 h-6 text-accent" />
            {receiverNickname}님에게 쪽지 보내기
          </DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <Textarea 
            placeholder="동료 전문가에게 궁금한 점이나 가벼운 인사를 남겨보세요."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[150px] bg-primary/5 border-none rounded-xl p-4 focus-visible:ring-accent/30 text-sm font-medium"
          />
          <p className="text-[10px] text-primary/30 mt-2 ml-1">
            * 상대방이 확인하면 쪽지함에서 읽음 표시를 확인할 수 있습니다.
          </p>
        </div>
        <DialogFooter>
          <Button 
            onClick={handleSend}
            disabled={!content.trim() || isSending}
            className="w-full h-12 bg-primary text-accent font-black rounded-xl gap-2 shadow-lg"
          >
            {isSending ? "전송 중..." : "쪽지 보내기"}
            <Send className="w-4 h-4" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
