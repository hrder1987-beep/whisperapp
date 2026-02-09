
"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Sparkles, Send, Bot, User, Loader2 } from "lucide-react"
import { chatAldi } from "@/ai/flows/chat-shu-flow"
import { cn } from "@/lib/utils"

interface Message {
  role: "user" | "bot"
  text: string
}

export function AldiChat() {
  const [messages, setMessages] = useState<Message[]>([
    { role: "bot", text: "반가워요! Whisper의 HR 인텔리전스 가이드 '알디'입니다. 어떤 고민을 함께 나눠볼까요?" }
  ])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSend = async () => {
    if (!input.trim() || isLoading) return

    const userMessage = input.trim()
    setMessages(prev => [...prev, { role: "user", text: userMessage }])
    setInput("")
    setIsLoading(true)

    try {
      const res = await chatAldi({ message: userMessage })
      setMessages(prev => [...prev, { role: "bot", text: res.reply }])
    } catch (error) {
      setMessages(prev => [...prev, { role: "bot", text: "미안해요, Whisper의 기운이 잠시 약해졌나 봐요. 다시 한번 말씀해주시겠어요?" }])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="bg-white rounded-[3rem] border border-primary/5 shadow-2xl overflow-hidden flex flex-col h-[500px]">
      <CardHeader className="premium-gradient p-6 flex flex-row items-center justify-between space-y-0">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-accent/20 rounded-2xl backdrop-blur-md">
            <Sparkles className="w-6 h-6 text-accent animate-pulse" />
          </div>
          <div>
            <CardTitle className="text-white text-xl font-black tracking-tight">알디 (ALDI)</CardTitle>
            <p className="text-[11px] text-accent/80 font-black uppercase tracking-widest mt-0.5">HR Intelligence Guide</p>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide bg-[#FDFDFD]">
        {messages.map((msg, idx) => (
          <div key={idx} className={cn(
            "flex items-start gap-3",
            msg.role === "user" ? "flex-row-reverse" : "flex-row"
          )}>
            <div className={cn(
              "p-2.5 rounded-2xl shadow-sm",
              msg.role === "user" ? "bg-primary/10" : "bg-accent/10"
            )}>
              {msg.role === "user" ? <User className="w-4 h-4 text-primary/60" /> : <Bot className="w-4 h-4 text-accent" />}
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
        ))}
        {isLoading && (
          <div className="flex items-start gap-3">
            <div className="p-2.5 bg-accent/10 rounded-2xl">
              <Loader2 className="w-4 h-4 text-accent animate-spin" />
            </div>
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

      <div className="p-6 bg-white border-t border-primary/5">
        <div className="relative group">
          <Input 
            placeholder="알디에게 HR 고민을 속삭여보세요..." 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            className="pr-14 bg-primary/5 border-none h-14 rounded-2xl text-[13px] font-bold placeholder:text-primary/20 focus-visible:ring-accent/50 transition-all"
          />
          <Button 
            size="icon" 
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="absolute right-2 top-2 h-10 w-10 bg-primary hover:bg-primary/90 text-accent rounded-xl transition-all active:scale-90 shadow-lg disabled:opacity-20"
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>
        <p className="text-[10px] text-center text-primary/20 mt-3 font-black tracking-widest uppercase">
          HR 전문 AI 챗봇 알디입니다
        </p>
      </div>
    </Card>
  )
}
