
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
  Lightbulb,
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

// 개별 메시지 컴포넌트 메모이제이션으로 최적화
const ChatMessage = memo(({ msg, isLast }: { msg: Message, isLast: boolean }) => (
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
            <p className="text-[11px] text-accent/80 font-black uppercase tracking-widest mt-0.5">HR Intelligence Guide</p>
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
              <h4 className="font-black text-primary">채용/인사 실무 지원</h4>
              <p className="text-xs text-primary/40 font-bold leading-relaxed">직무기술서(JD) 초안 작성 및 면접 질문 리스트 생성을 도와드립니다.</p>
            </div>
            <div className="p-6 bg-primary/5 rounded-[2rem] border border-primary/5 space-y-3">
              <Lightbulb className="w-6 h-6 text-accent" />
              <h4 className="font-black text-primary">조직문화/기획 아이디어</h4>
              <p className="text-xs text-primary/40 font-bold leading-relaxed">임직원 몰입도를 높이는 이벤트와 핵심가치 내재화 프로그램을 제안합니다.</p>
            </div>
          </div>
        )}

        {messages.map((msg, idx) => (
          <ChatMessage key={idx} msg={msg} isLast={idx === messages.length - 1} />
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
            placeholder="알디에게 HR 고민을 속삭여보세요..." 
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
    { role: "bot", text: "반가워요! Whisper의 HR 인텔리전스 가이드 '알디'입니다. 채용 전략, 조직문화, 교육 설계부터 실무 노하우까지 무엇이든 물어보세요." }
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
        knowledge: aldiKnowledge?.content 
      })
      setMessages(prev => [...prev, { role: "bot", text: res.reply }])
    } catch (error) {
      setMessages(prev => [...prev, { role: "bot", text: "미안해요, Whisper의 기운이 잠시 약해졌나 봐요. 다시 한번 말씀해주시겠어요?" }])
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
            <DialogTitle>알디와 대화하기 (확대 모드)</DialogTitle>
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
