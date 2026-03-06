
"use client"

import { useState, useRef, useEffect, memo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Send, User, Maximize2, X, RotateCcw, Sparkles as SparklesIcon } from "lucide-react"
import { chatWhisper } from "@/ai/flows/chat-whisper-flow"
import { cn } from "@/lib/utils"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
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
  <div className={cn("flex items-start gap-3 md:gap-4", msg.role === "user" ? "flex-row-reverse" : "flex-row")}>
    <div className="shrink-0">
      {msg.role === "user" ? (
        <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-accent/5 flex items-center justify-center border border-accent/10">
          <User className="w-4 h-4 md:w-5 md:h-5 text-accent/40" />
        </div>
      ) : (
        <AvatarIcon src={botIconUrl} avatarId={activeBot} className="w-8 h-8 md:w-10 md:h-10 shadow-md border-2 border-white" />
      )}
    </div>
    <div className={cn(
      "max-w-[85%] md:max-w-[75%] p-3.5 md:p-5 rounded-2xl text-[14px] md:text-[15px] leading-relaxed shadow-sm transition-all",
      msg.role === "user" ? "bg-accent text-primary rounded-tr-none" : "bg-white border border-black/[0.08] text-accent font-medium rounded-tl-none"
    )}>
      {msg.text}
    </div>
  </div>
));
ChatMessage.displayName = "ChatMessage";

function ChatInterface({ messages, input, setInput, isLoading, handleSend, isExpanded = false, onClose, activeBot, onBotChange, botConfig, onReset }: any) {
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
      <CardHeader className="p-0 shrink-0 bg-white border-b border-black/[0.08] shadow-sm z-10">
        <div className="p-4 md:p-6 flex items-center justify-between">
          <div className="flex items-center gap-3 md:gap-4">
            <AvatarIcon src={botIconUrl} avatarId={activeBot} className="w-10 h-10 md:w-12 md:h-12 shadow-md border-2 border-white" />
            <div>
              <CardTitle className="text-base md:text-lg font-black text-accent">{botName}</CardTitle>
              <p className="text-[10px] md:text-[11px] text-primary font-black uppercase tracking-widest">{botSub}</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={onReset} className="text-accent/20 hover:text-accent hover:bg-black/5 rounded-full transition-all" title="대화 초기화">
              <RotateCcw className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose} className="text-accent/20 hover:text-accent hover:bg-black/5 rounded-full transition-all">
              {isExpanded ? <X className="w-6 h-6" /> : <Maximize2 className="w-5 h-5" />}
            </Button>
          </div>
        </div>
        <Tabs value={activeBot} onValueChange={(v) => onBotChange(v as BotType)} className="w-full px-4 md:px-6 pb-4">
          <TabsList className="grid grid-cols-3 bg-accent/[0.03] p-1.5 rounded-2xl h-12 md:h-14">
            <TabsTrigger value="whisperra" className="text-[11px] md:text-xs font-black data-[state=active]:bg-white data-[state=active]:text-accent data-[state=active]:shadow-lg rounded-xl transition-all">사례상담</TabsTrigger>
            <TabsTrigger value="aldi" className="text-[11px] md:text-xs font-black data-[state=active]:bg-white data-[state=active]:text-accent data-[state=active]:shadow-lg rounded-xl transition-all">정보문의</TabsTrigger>
            <TabsTrigger value="dongsan" className="text-[11px] md:text-xs font-black data-[state=active]:bg-white data-[state=active]:text-accent data-[state=active]:shadow-lg rounded-xl transition-all">공간추천</TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent ref={scrollRef} className="flex-1 overflow-y-auto p-5 md:p-8 space-y-6 md:space-y-8 scrollbar-hide">
        {messages.map((msg: any, idx: number) => (
          <ChatMessage key={idx} msg={msg} activeBot={activeBot} botIconUrl={botIconUrl} />
        ))}
        {isLoading && (
          <div className="flex items-start gap-3 md:gap-4 animate-pulse">
            <AvatarIcon src={botIconUrl} avatarId={activeBot} className="w-8 h-8 md:w-10 md:h-10 border-2 border-white shadow-sm" />
            <div className="bg-white border border-black/[0.08] p-4 md:p-5 rounded-2xl rounded-tl-none text-[13px] md:text-[14px] font-black text-accent/20 shadow-sm">
              인텔리전스 답변을 준비하고 있습니다...
            </div>
          </div>
        )}
      </CardContent>
      <div className="p-4 md:p-8 bg-white border-t border-black/[0.08] shadow-[0_-4px_20px_rgba(0,0,0,0.03)]">
        <div className="relative flex items-center gap-3">
          <Input 
            placeholder="궁금한 내용을 자유롭게 질문해 보세요" 
            value={input} 
            onChange={(e) => setInput(e.target.value)} 
            onKeyDown={(e) => e.key === 'Enter' && handleSend()} 
            disabled={isLoading} 
            className="border-none bg-[#F5F6F7] focus-visible:ring-primary/20 h-14 md:h-16 text-[15px] font-black rounded-2xl px-6 placeholder:text-accent/10 shadow-inner" 
          />
          <Button size="icon" onClick={handleSend} disabled={!input.trim() || isLoading} className="naver-button h-14 w-14 md:h-16 md:w-16 shrink-0 shadow-2xl rounded-2xl active:scale-95 transition-all">
            <Send className="w-5 h-5 md:w-6 md:h-6" />
          </Button>
        </div>
      </div>
    </div>
  )
}

export function WhisperChat({ forceOpenTrigger, onTriggerClose, hideCard = false }: any) {
  const db = useFirestore()
  const [activeBot, setActiveBot] = useState<BotType>("whisperra")
  const activeBotConfigRef = useMemoFirebase(() => db ? doc(db, "admin_configuration", `bot_${activeBot}`) : null, [db, activeBot])
  const { data: botConfig } = useDoc<any>(activeBotConfigRef)
  const [conversations, setConversations] = useState<Record<BotType, Message[]>>({ whisperra: [], aldi: [], dongsan: [] })
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isFocused, setIsFocused] = useState(false)

  useEffect(() => {
    const currentIntro = botConfig?.intro || DEFAULT_BOT_INFO[activeBot].intro
    setConversations(prev => ({
      ...prev,
      [activeBot]: prev[activeBot].length > 0 ? prev[activeBot] : [{ role: "bot", text: currentIntro }]
    }))
  }, [botConfig, activeBot])

  useEffect(() => {
    if (forceOpenTrigger) {
      setIsFocused(true)
      onTriggerClose?.()
    }
  }, [forceOpenTrigger, onTriggerClose])

  const handleSend = async () => {
    if (!input.trim() || isLoading) return
    const userMsg = input.trim()
    const currentBot = activeBot
    setConversations(prev => ({
      ...prev,
      [currentBot]: [...prev[currentBot], { role: "user", text: userMsg }]
    }))
    setInput("")
    setIsLoading(true)
    try {
      const res = await chatWhisper({ message: userMsg, botType: currentBot, knowledge: botConfig?.content, persona: botConfig?.persona })
      setConversations(prev => ({
        ...prev,
        [currentBot]: [...prev[currentBot], { role: "bot", text: res.reply }]
      }))
    } catch (error) {
      setConversations(prev => ({
        ...prev,
        [currentBot]: [...prev[currentBot], { role: "bot", text: "지능형 답변 처리 중 일시적인 오류가 발생했습니다. 잠시 후 다시 시도해 주세요." }]
      }))
    } finally {
      setIsLoading(false)
    }
  }

  const handleReset = () => {
    const currentIntro = botConfig?.intro || DEFAULT_BOT_INFO[activeBot].intro
    setConversations(prev => ({
      ...prev,
      [activeBot]: [{ role: "bot", text: currentIntro }]
    }))
  }

  return (
    <>
      {!hideCard && (
        <Card className="naver-card flex flex-col h-[550px] overflow-hidden shadow-2xl border-primary/20 animate-in fade-in slide-in-from-bottom-4 duration-1000">
          <ChatInterface 
            messages={conversations[activeBot]} 
            input={input} 
            setInput={setInput} 
            isLoading={isLoading} 
            handleSend={handleSend} 
            activeBot={activeBot} 
            onBotChange={setActiveBot} 
            onClose={() => setIsFocused(true)} 
            botConfig={botConfig} 
            onReset={handleReset}
          />
        </Card>
      )}
      <Dialog open={isFocused} onOpenChange={setIsFocused}>
        <DialogContent className="max-w-3xl h-[90vh] md:h-[85vh] p-0 border-none overflow-hidden rounded-[2.5rem] md:rounded-[3rem] shadow-3xl">
          <DialogHeader className="sr-only">
            <DialogTitle>AI 전문가 실시간 상담</DialogTitle>
          </DialogHeader>
          <ChatInterface 
            messages={conversations[activeBot]} 
            input={input} 
            setInput={setInput} 
            isLoading={isLoading} 
            handleSend={handleSend} 
            isExpanded 
            activeBot={activeBot} 
            onBotChange={setActiveBot} 
            onClose={() => setIsFocused(false)} 
            botConfig={botConfig} 
            onReset={handleReset}
          />
        </DialogContent>
      </Dialog>
    </>
  )
}
