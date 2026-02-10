"use client"

import { useState, useRef, useEffect, useCallback, memo, useMemo } from "react"
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
import { useFirestore, useDoc, useMemoFirebase, useCollection } from "@/firebase"
import { doc, collection, query, orderBy, limit } from "firebase/firestore"
import { Question } from "@/lib/types"

interface Message {
  role: "user" | "bot"
  text: string
}

// 200개 전체 데이터 주제 요약 (알디 학습용)
const GLOBAL_KNOWLEDGE_SUMMARY = `
- 인사/총무(100건): 포괄임금제 도입 리스크, 1년 미만 연차 산정, 수습 해고 절차, 유연근무제 코어타임 설정, 징계위원회 구성, 퇴직금 중간정산 등.
- HRD/조직문화(100건): 타운홀 미팅 익명 툴 활용, 신입사원 온보딩 루틴, 사내강사 보상 체계, 핵심가치 내재화 액티비티, 팀 내 심리적 안전감 질문 리스트, 에듀테크 도입 등.
`;

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
              <h4 className="font-black text-primary">플랫폼 전체 지식 학습</h4>
              <p className="text-xs text-primary/40 font-bold leading-relaxed">200건 이상의 인사/문화/교육 전문 지식을 모두 학습했습니다.</p>
            </div>
            <div className="p-6 bg-primary/5 rounded-[2rem] border border-primary/5 space-y-3">
              <Lightbulb className="w-6 h-6 text-accent" />
              <h4 className="font-black text-primary">실시간 커뮤니티 동향</h4>
              <p className="text-xs text-primary/40 font-bold leading-relaxed">최근 동료 전문가들이 피드에 공유한 인사이트를 즉시 답변에 반영합니다.</p>
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
            placeholder="알디에게 전체 피드 지식을 물어보세요..." 
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

  // 실시간 피드 학습 범위를 대폭 확대 (최신 30개)
  const recentFeedQuery = useMemoFirebase(() => db ? query(collection(db, "questions"), orderBy("createdAt", "desc"), limit(30)) : null, [db])
  const { data: recentFeed } = useCollection<Question>(recentFeedQuery)

  const realtimeFeedContext = useMemo(() => {
    if (!recentFeed || recentFeed.length === 0) return ""
    return recentFeed.map(q => `- ${q.category}: ${q.title}`).join("\n")
  }, [recentFeed])

  const [messages, setMessages] = useState<Message[]>([
    { role: "bot", text: "안녕하세요! Whisper의 모든 전문 지식을 학습한 '알디'입니다. 200여 개의 실무 지식 베이스와 실시간 피드 내용을 바탕으로 최적의 가이드를 드릴게요." }
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
        fullFeedSummary: GLOBAL_KNOWLEDGE_SUMMARY, // 전체 200건 지식 요약 전달
        realtimeFeedContext: realtimeFeedContext // 확장된 실시간 피드 전달
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
            <DialogTitle>알디와 대화하기 (전체 지식 학습 모드)</DialogTitle>
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
