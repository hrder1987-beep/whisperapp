"use client"

import { useState, useRef } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { SendHorizontal, User, ImageIcon, X } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import Image from "next/image"

interface SubmissionFormProps {
  placeholder: string
  onSubmit: (nickname: string, text: string, imageUrl?: string) => void
  type: "question" | "answer"
}

export function SubmissionForm({ placeholder, onSubmit, type }: SubmissionFormProps) {
  const [nickname, setNickname] = useState("")
  const [text, setText] = useState("")
  const [imageUrl, setImageUrl] = useState<string | undefined>(undefined)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "파일 크기 제한",
          description: "5MB 이하의 이미지만 업로드 가능합니다.",
          variant: "destructive"
        })
        return
      }

      const reader = new FileReader()
      reader.onloadend = () => {
        setImageUrl(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleRemoveImage = () => {
    setImageUrl(undefined)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!nickname.trim() || !text.trim()) {
      toast({
        title: "입력 오류",
        description: "닉네임과 내용을 모두 입력해주세요.",
        variant: "destructive"
      })
      return
    }

    setIsSubmitting(true)
    setTimeout(() => {
      onSubmit(nickname, text, imageUrl)
      setNickname("")
      setText("")
      setImageUrl(undefined)
      if (fileInputRef.current) fileInputRef.current.value = ""
      setIsSubmitting(false)
      toast({
        title: "속삭임 전송 완료",
        description: `당신의 ${type === 'question' ? '질문이' : '답변이'} 익명으로 게시되었습니다.`
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
              placeholder="닉네임 (예: 비밀손님)"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              className="pl-10 bg-white/5 border-white/10 focus-visible:ring-primary focus-visible:border-primary placeholder:text-muted-foreground/50"
              maxLength={50}
            />
          </div>
          
          <Textarea
            placeholder={placeholder}
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="min-h-[120px] bg-white/5 border-white/10 focus-visible:ring-primary focus-visible:border-primary resize-y placeholder:text-muted-foreground/50 text-lg"
          />

          {imageUrl && (
            <div className="relative w-full aspect-video rounded-lg overflow-hidden border border-white/10 group">
              <Image 
                src={imageUrl} 
                alt="미리보기" 
                fill 
                className="object-cover"
              />
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2 rounded-full h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={handleRemoveImage}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}

          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              {type === "question" && (
                <>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    ref={fileInputRef}
                    onChange={handleImageChange}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="border-white/10 hover:bg-white/5 text-muted-foreground h-9"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <ImageIcon className="w-4 h-4 mr-2" />
                    사진 첨부
                  </Button>
                </>
              )}
            </div>
            
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-8"
            >
              {isSubmitting ? (
                "전송 중..."
              ) : (
                <span className="flex items-center gap-2">
                  속삭이기 <SendHorizontal className="w-4 h-4" />
                </span>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
