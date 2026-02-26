
"use client"

import { useState, useRef, useEffect, memo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Send, 
  User, 
  Maximize2, 
  X,
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

const DEFAULT_BOT_INFO: Record<BotType, { name: string, sub: string, intro: string, icon: BotType }> = {
  whisperra: {
    name: "위스퍼라",
    sub: "실무 사례 AI",
    intro: "안녕하세요. 기업 실무 사례를 분석해 드리는 '위스퍼라'입니다. 궁금하신 사례가 있으신가요?",
    icon: "whisperra"
  },
  aldi: {
    name: "알디",
    sub: "교육 정보 AI",
    intro: "반갑습니다. 교육 프로그램과 전문가 매칭을 도와드리는 '알디'입니다.",
    icon: "aldi"
  },
  dongsan: {
    name: "동산",
    sub: "공간 정보 AI",
    intro: "어서오세요. 최적의 강의장과 연회장을 추천해 드리는 '동산'입니다.",
    icon: "dongsan"
  }
}

const ChatMessage = memo(({ msg, activeBot, botIconUrl }: { msg: Message, activeBot: BotType, botIconUrl?: string }) => (
  <div className={cn(
    "flex items-start gap-3",
    msg.role === "user" ? "flex-row-reverse" : "flex-row"
  )}>
    <div className="shrink-0">
      {msg.role === "user" ? (
        <div className="w-8 h-8 rounded-full bg-black/5 flex items-center justify-center">
          <User className="w-4 h-4 text-muted-foreground" />
        </div>
      ) : (
        <AvatarIcon src={botIconUrl} avatarId={activeBot} className="w-8 h-8 shadow-sm" />
      )}
    </div>
    <div className={cn(
      "max-w-[85%] p-3.5 rounded-[1.2rem] text-[14px] leading-relaxed shadow-sm",
      msg.role === "user" 
        ? "bg-accent text-primary rounded-tr-none" 
        : "bg-white border border-black/[0.08] text-foreground rounded-tl-none"
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
  onBotChange,
  botConfig
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
  botConfig?: any
}) {
  const scrollRef = useRef<HTMLDivElement>(null)

  const botName = botConfig?.name || DEFAULT_BOT_INFO[activeBot].name
  const botSub = DEFAULT_BOT_INFO[activeBot].sub
  const botIconUrl = botConfig?.iconUrl

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages, isLoading]);

  return (
    <div className="flex flex-col h-full bg-[#F5F6F7]">
      <CardHeader className="p-0 shrink-0 bg-white border-b border-black/[0.08]">
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AvatarIcon src={botIconUrl} avatarId={activeBot} className="w-10 h-10 shadow-sm" />
            <div>
              <CardTitle className="text-base font-black text-accent">{botName}</CardTitle>
              <p className="text-[10px] text-accent/40 font-black uppercase tracking-widest">{botSub}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="text-muted-foreground hover:bg-black/5 rounded-full">
            {isExpanded ? <X className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
          </Button>
        </div>

        <Tabs value={activeBot} onValueChange={(v) => onBotChange(v as BotType)} className="w-full px-4 pb-3">
          <TabsList className="grid grid-cols-3 bg-black/[0.03] p-1 rounded-xl h-10">
            <TabsTrigger value="whisperra" className="text-[11px] font-black data-[state=active]:bg-white data-[state=active]:text-accent data-[state=active]:shadow-sm rounded-lg">사례상담</TabsTrigger>
            <TabsTrigger value="aldi" className="text-[11px] font-black data-[state=active]:bg-white data-[state=active]:text-accent data-[state=active]:shadow-sm rounded-lg">정보문의</TabsTrigger>
            <TabsTrigger value="dongsan" className="text-[11px] font-black data-[state=active]:bg-white data-[state=active]:text-accent data-[state=active]:shadow-sm rounded-lg">공간추천</TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      
      <CardContent ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-5">
        {messages.map((msg, idx) => (
          <ChatMessage key={idx} msg={msg} activeBot={activeBot} botIconUrl={botIconUrl} />
        ))}
        {isLoading && (
          <div className="flex items-start gap-3 animate-pulse">
            <AvatarIcon src={botIconUrl} avatarId={activeBot} className="w-8 h-8" />
            <div className="bg-white border border-black/[0.08] p-3.5 rounded-2xl rounded-tl-none text-xs font-bold text-muted-foreground">
              답변을 준비하고 있습니다...
            </div>
          </div>
        )}
      </CardContent>

      <div className="p-4 bg-white border-t border-black/[0.08]">
        <div className="relative flex items-center gap-2">
          <Input 
            placeholder="궁금한 내용을 질문해 보세요"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            disabled={isLoading}
            className="border-black/10 focus-visible:ring-accent h-12 text-sm font-bold rounded-xl placeholder:text-black/10 shadow-sm"
          />
          <Button size="icon" onClick={handleSend} disabled={!input.trim() || isLoading} className="naver-button h-12 w-12 shrink-0 shadow-lg rounded-xl active:scale-95">
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}

export function AldiChat({ forceOpenTrigger, onTriggerClose, hideCard = false }: { forceOpenTrigger?: boolean, onTriggerClose?: () => void, hideCard?: boolean }) {
  const db = useFirestore()
  const [activeBot, setActiveBot] = useState<BotType>("whisperra")
  
  const activeBotConfigRef = useMemoFirebase(() => db ? doc(db, "admin_configuration", `bot_${activeBot}`) : null, [db, activeBot])
  const { data: botConfig } = useDoc<any>(activeBotConfigRef)

  const [conversations, setConversations] = useState<Record<BotType, Message[]>>({
    whisperra: [],
    aldi: [],
    dongsan: []
  })

  // 봇 설정 로딩 시 초기 멘트 주입
  useEffect(() => {
    if (botConfig && conversations[activeBot].length === 0) {
      const initialIntro = botConfig.intro || DEFAULT_BOT_INFO[activeBot].intro
      setConversations(prev => ({
        ...prev,
        [activeBot]: [{ role: "bot", text: initialIntro }]
      }))
    } else if (!botConfig && conversations[activeBot].length === 0) {
      setConversations(prev => ({
        ...prev,
        [activeBot]: [{ role: "bot", text: DEFAULT_BOT_INFO[activeBot].intro }]
      }))
    }
  }, [botConfig, activeBot, conversations])

  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isFocused, setIsFocused] = useState(false)

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
      setConversations(prev => ({ ...prev, [currentBot]: [...prev[currentBot], { role: "bot", text: "일시적인 오류가 발생했습니다. 잠시 후 다시 시도해 주세요." }] }))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      {!hideCard && (
        <Card className="naver-card flex flex-col h-[500px] overflow-hidden shadow-2xl border-primary/20">
          <ChatInterface 
            messages={conversations[activeBot]} input={input} setInput={setInput}
            isLoading={isLoading} handleSend={handleSend} activeBot={activeBot}
            onBotChange={setActiveBot} onClose={() => setIsFocused(true)}
            botConfig={botConfig}
          />
        </Card>
      )}

      <Dialog open={isFocused} onOpenChange={setIsFocused}>
        <DialogContent className="max-w-2xl h-[85vh] p-0 border-none overflow-hidden rounded-[2rem] shadow-3xl">
          <DialogHeader className="sr-only"><DialogTitle>AI 전문가 상담</DialogTitle></DialogHeader>
          <ChatInterface 
            messages={conversations[activeBot]} input={input} setInput={setInput}
            isLoading={isLoading} handleSend={handleSend} isExpanded activeBot={activeBot}
            onBotChange={setActiveBot} onClose={() => setIsFocused(false)}
            botConfig={botConfig}
          />
        </DialogContent>
      </Dialog>
    </>
  )
}
