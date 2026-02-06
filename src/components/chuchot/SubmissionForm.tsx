"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { SendHorizontal, User } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface SubmissionFormProps {
  placeholder: string
  onSubmit: (nickname: string, text: string) => void
  type: "question" | "answer"
}

export function SubmissionForm({ placeholder, onSubmit, type }: SubmissionFormProps) {
  const [nickname, setNickname] = useState("")
  const [text, setText] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!nickname.trim() || !text.trim()) {
      toast({
        title: "Missing fields",
        description: "Please provide a nickname and your message.",
        variant: "destructive"
      })
      return
    }

    setIsSubmitting(true)
    // Simulate network delay
    setTimeout(() => {
      onSubmit(nickname, text)
      setNickname("")
      setText("")
      setIsSubmitting(false)
      toast({
        title: "Whisper sent",
        description: `Your ${type} has been published anonymously.`
      })
    }, 600)
  }

  return (
    <Card className="glass-morphism border-primary/20 mb-8 overflow-hidden shadow-2xl">
      <div className="h-1 gold-gradient w-full"></div>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative group">
            <User className="absolute left-3 top-3 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input
              placeholder="Nickname (e.g. SecretGuest)"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              className="pl-10 bg-white/5 border-white/10 focus-visible:ring-primary focus-visible:border-primary placeholder:text-muted-foreground/50"
              maxLength={20}
            />
          </div>
          <Textarea
            placeholder={placeholder}
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="min-h-[100px] bg-white/5 border-white/10 focus-visible:ring-primary focus-visible:border-primary resize-none placeholder:text-muted-foreground/50 text-lg"
            maxLength={300}
          />
          <div className="flex justify-between items-center">
            <span className="text-xs text-muted-foreground">{text.length}/300 characters</span>
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-8"
            >
              {isSubmitting ? (
                "Sending..."
              ) : (
                <span className="flex items-center gap-2">
                  Whisper <SendHorizontal className="w-4 h-4" />
                </span>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}