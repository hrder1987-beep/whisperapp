
"use client"

import { useState, useRef, useEffect, useCallback, memo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Send, 
  User, 
  Maximize2, 
  X,
  Sparkles,
  BookOpen,
  MapPin,
  Bot,
  RefreshCw,
  ChevronDown
} from "lucide-react"
import { chatShu } from "@/ai/flows/chat-shu-flow"
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
import { BotType } from "@/lib/types"

interface Message {
  role: "user" | "bot"
  text: string
}

const BOT_INFO: Record<BotType, { name: string, sub: string, intro: string, icon: BotType }> = {
  whisperra: {
    name: "위스퍼라",
    sub: "Case Expert",
    intro: "반갑습니다! 기업 실무 사례와 전문가 인사이트를 전하는 '위스퍼라'입니다. 어떤 사례가 궁금하신가요?",
    icon: "whisperra"
  },
  aldi: {
    name: "알디",
    sub: "HR Guide",
    intro: "안녕하세요! 교육 프로그램과 파트너사 정보를 안내해 드리는 '알디'입니다. 찾으시는 솔루션이 있나요?",
    icon: "aldi"
  },
  dongsan: {
    name: "동산",
    sub: "Space Master",
    intro: "어서오세요! 행사에 딱 맞는 강의장과 연회장을 추천해 드리는 공간 전문가 '동산'입니다.",
    icon: "dongsan"
  }
}

const ChatMessage = memo(({ msg, activeBot }: { msg: Message, activeBot: BotType }) => (
  <div className={cn(
    "flex items-start gap-2 md:gap-3 animate-in fade-in slide-in-from-bottom-1 duration-200",
    msg.role === "user" ? "flex-row-reverse" : "flex-row"
  )}>
    <div className="shrink-0">
      {msg.role === "user" ? (
        <div className="p-2 bg-primary/10 rounded-xl">
          <User className="w-3.5 h-3.5 text-primary/60" />
        </div>
      ) : (
        <AvatarIcon avatarId={activeBot} className="w-8 h-8 md:w-9 md:h-9 shadow-sm" />
      )}
    </div>
    <div className={cn(
      "max-w-[85%] p-3 md:p-4 rounded-[1.2rem] text-[13px] md:text-[14px] leading-relaxed shadow-sm break-words whitespace-pre-wrap transition-all",
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
  onClose,
  activeBot,
  onBotChange
}: {
  messages: Message[]
  input: string
  setInput: (val: string) => void
  isLoading: boolean
  handleSend: () => void
  isExpanded?: boolean
  onClose?: () => void
  activeBot: BotType
  onBotChange: (bot: BotType) => void
}) {
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages, isLoading]);

  return (
    <div className={cn("flex flex-col h-full bg-[#F8F9FA]", isExpanded ? "rounded-t-[2rem] md:rounded-[3rem]" : "")}>
      <CardHeader className={cn(
        "p-4 md:p-6 flex flex-col space-y-4 premium-gradient shrink-0",
        isExpanded ? "rounded-t-[2rem] md:rounded-t-[3rem]" : ""
      )}>
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-3">
            <AvatarIcon avatarId={activeBot} className="w-10 h-10 md:w-12 md:h-12 shadow-2xl border-2 border-white/20" />
            <div>
              <CardTitle className="text-white text-base md:text-xl font-black tracking-tight">{BOT_INFO[activeBot].name}</CardTitle>
              <p className="text-[8px] md:text-[10px] text-accent/80 font-black uppercase tracking-widest mt-0.5">{BOT_INFO[activeBot].sub}</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={onClose} className="text-white/50 hover:text-white hover:bg-white/10 rounded-full h-8 w-8 md:h-10 md:w-10">
              {isExpanded ? <X className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        <Tabs value={activeBot} onValueChange={(v) => onBotChange(v as BotType)} className="w-full">
          <TabsList className="grid grid-cols-3 bg-white/10 p-1 rounded-xl h-10 border border-white/5">
            <TabsTrigger value="whisperra" className="rounded-lg text-[9px] md:text-[11px] font-black data-[state=active]:bg-white data-[state=active]:text-primary gap-1 md:gap-1.5 transition-all">
              <Sparkles className="w-2.5 h-2.5 md:w-3 h-3" />사례
            </TabsTrigger>
            <TabsTrigger value="aldi" className="rounded-lg text-[9px] md:text-[11px] font-black data-[state=active]:bg-white data-[state=active]:text-primary gap-1 md:gap-1.5 transition-all">
              <BookOpen className="w-2.5 h-2.5 md:w-3 h-3" />정보
            </TabsTrigger>
            <TabsTrigger value="dongsan" className="rounded-lg text-[9px] md:text-[11px] font-black data-[state=active]:bg-white data-[state=active]:text-primary gap-1 md:gap-1.5 transition-all">
              <MapPin className="w-2.5 h-2.5 md:w-3 h-3" />공간
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      
      <CardContent ref={scrollRef} className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5 scrollbar-hide bg-white/50">
        {messages.map((msg, idx) => (
          <ChatMessage key={idx} msg={msg} activeBot={activeBot} />
        ))}
        {isLoading && (
          <div className="flex items-start gap-3 animate-pulse">
            <AvatarIcon avatarId={activeBot} className="w-8 h-8" />
            <div className="bg-white border border-primary/5 p-3 rounded-2xl shadow-sm flex items-center gap-2">
              <RefreshCw className="w-3 h-3 text-accent animate-spin" />
              <span className="text-[10px] font-black text-primary/40 uppercase tracking-tighter">분석 중...</span>
            </div>
          </div>
        )}
      </CardContent>

      <div className="p-4 md:p-6 bg-white border-t border-primary/5 shrink-0 pb-safe">
        <div className="relative group max-w-4xl mx-auto">
          <Input 
            placeholder={`${BOT_INFO[activeBot].name}에게 질문하기...`}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            disabled={isLoading}
            className={cn("pr-12 md:pr-14 bg-primary/5 border-none rounded-xl md:rounded-2xl text-xs md:text-sm font-bold placeholder:text-primary/20 focus-visible:ring-accent/50 h-11 md:h-14")}
          />
          <Button size="icon" onClick={handleSend} disabled={!input.trim() || isLoading} className="absolute right-1 top-1 md:right-2 md:top-2 bg-primary hover:bg-primary/90 text-accent rounded-lg md:rounded-xl h-9 w-9 md:h-10 md:w-10 active:scale-90 shadow-lg">
            <Send className="w-4 h-4 md:w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  )
}

export function AldiChat({ forceOpenTrigger, onTriggerClose, hideCard = false }: { forceOpenTrigger?: boolean, onTriggerClose?: () => void, hideCard?: boolean }) {
  const db = useFirestore()
  const [activeBot, setActiveBot] = useState<BotType>("whisperra")
  
  const [conversations, setConversations] = useState<Record<BotType, Message[]>>({
    whisperra: [{ role: "bot", text: BOT_INFO.whisperra.intro }],
    aldi: [{ role: "bot", text: BOT_INFO.aldi.intro }],
    dongsan: [{ role: "bot", text: BOT_INFO.dongsan.intro }]
  })

  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isFocused, setIsFocused] = useState(false)

  const activeBotConfigRef = useMemoFirebase(() => db ? doc(db, "admin_configuration", `bot_${activeBot}`) : null, [db, activeBot])
  const { data: botConfig } = useDoc<any>(activeBotConfigRef)

  useEffect(() => { 
    if (forceOpenTrigger) { 
      setIsFocused(true); 
      onTriggerClose?.(); 
    } 
  }, [forceOpenTrigger, onTriggerClose])

  const handleSend = async () => {
    if (!input.trim() || isLoading) return
    const userMsg = input.trim()
    const currentBot = activeBot
    
    setConversations(prev => ({ ...prev, [currentBot]: [...prev[currentBot], { role: "user", text: userMsg }] }))
    setInput("")
    setIsLoading(true)

    try {
      const res = await chatShu({ 
        message: userMsg,
        botType: currentBot,
        knowledge: botConfig?.content,
        persona: botConfig?.persona,
      })
      setConversations(prev => ({ ...prev, [currentBot]: [...prev[currentBot], { role: "bot", text: res.reply }] }))
    } catch (error) {
      setConversations(prev => ({ ...prev, [currentBot]: [...prev[currentBot], { role: "bot", text: "잠시 후 다시 시도해 주세요." }] }))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      {!hideCard && (
        <Card className="bg-white rounded-[3rem] border border-primary/5 shadow-2xl overflow-hidden flex flex-col h-[550px] animate-in fade-in slide-in-from-bottom-4">
          <ChatInterface 
            messages={conversations[activeBot]} input={input} setInput={setInput}
            isLoading={isLoading} handleSend={handleSend} activeBot={activeBot}
            onBotChange={setActiveBot} onClose={() => setIsFocused(true)}
          />
        </Card>
      )}

      <Dialog open={isFocused} onOpenChange={setIsFocused}>
        <DialogContent className="max-w-5xl h-[100dvh] md:h-[85vh] p-0 border-none bg-transparent shadow-none bottom-0 top-auto translate-y-0 sm:top-[50%] sm:translate-y-[-50%] flex flex-col">
          <DialogHeader className="sr-only"><DialogTitle>AI 전문가 상담</DialogTitle></DialogHeader>
          <div className="relative w-full h-full md:rounded-[3.5rem] overflow-hidden bg-white border-none md:border-4 md:border-primary/5 flex flex-col">
            <ChatInterface 
              messages={conversations[activeBot]} input={input} setInput={setInput}
              isLoading={isLoading} handleSend={handleSend} isExpanded activeBot={activeBot}
              onBotChange={setActiveBot} onClose={() => setIsFocused(false)}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
