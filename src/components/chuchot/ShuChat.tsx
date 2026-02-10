"use client"

import { useState, useRef, useEffect, useCallback, memo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  Send, 
  User, 
  Maximize2, 
  Minimize2,
  BrainCircuit,
  Settings2,
} from "lucide-react"
import { chatAldi } from "@/ai/flows/chat-shu-flow"
import { cn } from "@/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { AvatarIcon } from "./AvatarIcon"
import { useFirestore, useDoc, useMemoFirebase } from "@/firebase"
import { doc } from "firebase/firestore"

interface Message {
  role: "user" | "bot"
  text: string
}

const ChatMessage = memo(({ msg }: { msg: Message }) => (
  <div className={cn(
    "flex items-start gap-3 animate-in fade-in slide-in-from-bottom-1 duration-200",
    msg.role === "user" ? "flex-row-reverse" : "flex-row"
  )}>
    <div className="shrink-0">
      {msg.role === "user" ? (
        <div className="p-2.5 bg-primary/10 rounded-2xl">
          <User className="w-4 h-4 text-primary/60" />
        </div>
      ) : (
        <AvatarIcon avatarId="aldi" className="w-9 h-9" />
      )}
    </div>
    <div className={cn(
      "max-w-[85%] p-4 rounded-[1.5rem] text-[14px] leading-relaxed shadow-sm",
      msg.role === "user" 
        ? "bg-primary text-white rounded-tr-none" 
        : "bg-white border border-primary/5 text-primary/80 rounded-tl-none font-medium"
    )}>
      {msg.text}
    </div>
  </div>
));
ChatMessage.displayName = "ChatMessage";

function ChatInterface({ 
  messages, 
  input, 
  setInput, 
  isLoading, 
  handleSend, 
  isExpanded = false,
  setIsFocused 
}: {
  messages: Message[]
  input: string
  setInput: (val: string) => void
  isLoading: boolean
  handleSend: () => void
  isExpanded?: boolean
  setIsFocused?: (val: boolean) => void
}) {
  const scrollRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, scrollToBottom]);

  return (
    <div className={cn("flex flex-col h-full bg-white", isExpanded ? "rounded-[3rem]" : "")}>
      <CardHeader className={cn(
        "p-6 flex flex-row items-center justify-between space-y-0 premium-gradient shrink-0"
      )}>
        <div className="flex items-center gap-4">
          <AvatarIcon avatarId="aldi" className="w-12 h-12 shadow-2xl scale-110" />
          <div>
            <CardTitle className="text-white text-xl font-black tracking-tight">알디</CardTitle>
            <p className="text-[11px] text-accent/80 font-black uppercase tracking-widest mt-0.5">Expert Knowledge Hub</p>
          </div>
        </div>
        {!isExpanded && setIsFocused && (
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setIsFocused(true)}
            className="text-white/70 hover:text-white hover:bg-white/10 rounded-xl"
          >
            <Maximize2 className="w-5 h-5" />
          </Button>
        )}
      </CardHeader>
      
      <CardContent 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide bg-[#FDFDFD]"
      >
        {isExpanded && messages.length === 1 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <div className="p-6 bg-primary/5 rounded-[2rem] border border-primary/5 space-y-3">
              <BrainCircuit className="w-6 h-6 text-accent" />
              <h4 className="font-black text-primary">전문가 주입 지식 기반</h4>
              <p className="text-xs text-primary/40 font-bold leading-relaxed">전문가님이 직접 학습시킨 정제된 데이터만을 기반으로 답변합니다.</p>
            </div>
            <div className="p-6 bg-primary/5 rounded-[2rem] border border-primary/5 space-y-3">
              <Settings2 className="w-6 h-6 text-accent" />
              <h4 className="font-black text-primary">신뢰할 수 있는 가이드</h4>
              <p className="text-xs text-primary/40 font-bold leading-relaxed">출처가 불분명한 정보 대신, Whisper가 보증하는 전문 가이드를 제공합니다.</p>
            </div>
          </div>
        )}

        {messages.map((msg, idx) => (
          <ChatMessage key={idx} msg={msg} />
        ))}
        
        {isLoading && (
          <div className="flex items-start gap-3">
            <AvatarIcon avatarId="aldi" className="w-9 h-9" />
            <div className="bg-white border border-primary/5 p-4 rounded-[1.5rem] rounded-tl-none shadow-sm">
              <span className="flex gap-1.5">
                <span className="w-1.5 h-1.5 bg-accent/40 rounded-full animate-bounce"></span>
                <span className="w-1.5 h-1.5 bg-accent/40 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                <span className="w-1.5 h-1.5 bg-accent/40 rounded-full animate-bounce [animation-delay:0.4s]"></span>
              </span>
            </div>
          </div>
        )}
      </CardContent>

      <div className="p-6 bg-white border-t border-primary/5 shrink-0">
        <div className="relative group max-w-4xl mx-auto">
          <Input 
            placeholder="전문가 주입 지식을 바탕으로 알디가 답변합니다..." 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            className={cn(
              "pr-14 bg-primary/5 border-none rounded-2xl text-[14px] font-bold placeholder:text-primary/20 focus-visible:ring-accent/50 transition-all",
              isExpanded ? "h-16 text-base" : "h-14"
            )}
          />
          <Button 
            size="icon" 
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className={cn(
              "absolute right-2 top-2 bg-primary hover:bg-primary/90 text-accent rounded-xl transition-all active:scale-90 shadow-lg disabled:opacity-20",
              isExpanded ? "h-12 w-12" : "h-10 w-10"
            )}
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  )
}

export function AldiChat({ forceOpenTrigger, onTriggerClose }: { forceOpenTrigger?: boolean, onTriggerClose?: () => void }) {
  const db = useFirestore()
  const aldiDocRef = useMemoFirebase(() => db ? doc(db, "admin_configuration", "aldi_knowledge") : null, [db])
  const { data: aldiKnowledge } = useDoc<any>(aldiDocRef)

  const [messages, setMessages] = useState<Message[]>([
    { role: "bot", text: "안녕하세요! 전문가님께서 주입해주신 전문 지식을 완벽하게 학습한 '알디'입니다. 궁금한 실무 내용을 물어보시면 정제된 데이터를 바탕으로 답변 드릴게요." }
  ])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isFocused, setIsFocused] = useState(false)

  useEffect(() => {
    if (forceOpenTrigger) {
      setIsFocused(true)
      onTriggerClose?.()
    }
  }, [forceOpenTrigger, onTriggerClose])

  const handleSend = async () => {
    if (!input.trim() || isLoading) return

    const userMessage = input.trim()
    setMessages(prev => [...prev, { role: "user", text: userMessage }])
    setInput("")
    setIsLoading(true)

    try {
      const res = await chatAldi({ 
        message: userMessage,
        knowledge: aldiKnowledge?.content,
        persona: aldiKnowledge?.persona, // 관리자가 설정한 동적 페르소나 주입
      })
      setMessages(prev => [...prev, { role: "bot", text: res.reply }])
    } catch (error) {
      setMessages(prev => [...prev, { role: "bot", text: "죄송해요, Whisper 지식 엔진에 잠시 과부하가 걸린 것 같아요. 잠시 후 다시 질문해 주시겠어요?" }])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <Card className="bg-white rounded-[3rem] border border-primary/5 shadow-2xl overflow-hidden flex flex-col h-[500px]">
        <ChatInterface 
          messages={messages}
          input={input}
          setInput={setInput}
          isLoading={isLoading}
          handleSend={handleSend}
          setIsFocused={setIsFocused}
        />
      </Card>

      <Dialog open={isFocused} onOpenChange={setIsFocused}>
        <DialogContent className="max-w-5xl h-[90vh] md:h-[85vh] p-0 border-none bg-transparent shadow-none overflow-hidden outline-none">
          <DialogHeader className="sr-only">
            <DialogTitle>알디와 대화하기 (전문가 학습 데이터 모드)</DialogTitle>
          </DialogHeader>
          <div className="relative w-full h-full flex flex-col">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setIsFocused(false)}
              className="absolute top-4 right-4 z-[60] text-white/50 hover:text-white hover:bg-white/10 rounded-full"
            >
              <Minimize2 className="w-6 h-6" />
            </Button>
            <div className="flex-1 rounded-[2.5rem] md:rounded-[3.5rem] overflow-hidden shadow-2xl bg-white border-4 md:border-8 border-primary/5">
              <ChatInterface 
                messages={messages}
                input={input}
                setInput={setInput}
                isLoading={isLoading}
                handleSend={handleSend}
                isExpanded
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
