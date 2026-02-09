
"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Sparkles, Send, Bot, User, Loader2 } from "lucide-react"
import { chatShu } from "@/ai/flows/chat-shu-flow"
import { cn } from "@/lib/utils"

interface Message {
  role: "user" | "bot"
  text: string
}

export function ShuChat() {
  const [messages, setMessages] = useState<Message[]>([
    { role: "bot", text: "반가워요! 저는 Whisper의 HR 인텔리전스 가이드 '슈'입니다. 채용, 교육, 조직문화 등 무엇이든 물어보세요." }
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
      const res = await chatShu({ message: userMessage })
      setMessages(prev => [...prev, { role: "bot", text: res.reply }])
    } catch (error) {
      setMessages(prev => [...prev, { role: "bot", text: "미안해요, Whisper의 기운이 잠시 약해졌나 봐요. 다시 한번 말씀해주시겠어요?" }])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="bg-white rounded-[2rem] border border-primary/5 shadow-xl overflow-hidden flex flex-col h-[450px]">
      <CardHeader className="premium-gradient p-5 flex flex-row items-center justify-between space-y-0">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-accent/20 rounded-xl">
            <Sparkles className="w-5 h-5 text-accent animate-pulse" />
          </div>
          <div>
            <CardTitle className="text-white text-lg font-black">AI 슈(Shu)</CardTitle>
            <p className="text-[10px] text-accent/80 font-bold">Whisper Intelligence Guide</p>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 overflow-y-auto p-5 space-y-4 scrollbar-hide bg-[#FDFDFD]">
        {messages.map((msg, idx) => (
          <div key={idx} className={cn(
            "flex items-start gap-2",
            msg.role === "user" ? "flex-row-reverse" : "flex-row"
          )}>
            <div className={cn(
              "p-2 rounded-full",
              msg.role === "user" ? "bg-primary/5" : "bg-accent/10"
            )}>
              {msg.role === "user" ? <User className="w-3 h-3 text-primary/40" /> : <Bot className="w-3 h-3 text-accent" />}
            </div>
            <div className={cn(
              "max-w-[80%] p-3 rounded-2xl text-[13px] leading-relaxed",
              msg.role === "user" 
                ? "bg-primary text-white rounded-tr-none" 
                : "bg-white border border-primary/5 text-primary/80 shadow-sm rounded-tl-none font-medium"
            )}>
              {msg.text}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex items-start gap-2">
            <div className="p-2 bg-accent/10 rounded-full">
              <Loader2 className="w-3 h-3 text-accent animate-spin" />
            </div>
            <div className="bg-white border border-primary/5 p-3 rounded-2xl rounded-tl-none shadow-sm">
              <span className="flex gap-1">
                <span className="w-1 h-1 bg-accent/40 rounded-full animate-bounce"></span>
                <span className="w-1 h-1 bg-accent/40 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                <span className="w-1 h-1 bg-accent/40 rounded-full animate-bounce [animation-delay:0.4s]"></span>
              </span>
            </div>
          </div>
        )}
      </CardContent>

      <div className="p-4 bg-white border-t border-primary/5">
        <div className="relative group">
          <Input 
            placeholder="인사 고충이나 채용 트렌드를 물어보세요..." 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            className="pr-12 bg-primary/5 border-none h-11 rounded-xl text-xs font-bold placeholder:text-primary/20 focus-visible:ring-accent/50"
          />
          <Button 
            size="icon" 
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="absolute right-1 top-1 h-9 w-9 bg-primary hover:bg-primary/90 text-accent rounded-lg transition-all active:scale-95"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
        <p className="text-[9px] text-center text-primary/20 mt-2 font-bold tracking-tighter">
          *슈는 Whisper의 HR 전문가 DB를 기반으로 답변합니다.
        </p>
      </div>
    </Card>
  )
}
