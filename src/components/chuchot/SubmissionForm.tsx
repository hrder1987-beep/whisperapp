"use client"

import { useState, useRef } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { ImageIcon, X, Smile, User, Send } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import Image from "next/image"

interface SubmissionFormProps {
  placeholder: string
  onSubmit: (nickname: string, title: string, text: string, imageUrl?: string) => void
  type: "question" | "answer"
}

export function SubmissionForm({ placeholder, onSubmit, type }: SubmissionFormProps) {
  const [nickname, setNickname] = useState("")
  const [title, setTitle] = useState("")
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
    
    if (!nickname.trim()) {
      toast({ title: "입력 오류", description: "닉네임을 입력해주세요.", variant: "destructive" })
      return
    }
    
    if (type === "question" && !title.trim()) {
      toast({ title: "입력 오류", description: "제목을 입력해주세요.", variant: "destructive" })
      return
    }

    if (!text.trim()) {
      toast({ title: "입력 오류", description: "내용을 입력해주세요.", variant: "destructive" })
      return
    }

    setIsSubmitting(true)
    setTimeout(() => {
      onSubmit(nickname, title, text, imageUrl)
      setNickname("")
      setTitle("")
      setText("")
      setImageUrl(undefined)
      if (fileInputRef.current) fileInputRef.current.value = ""
      setIsSubmitting(false)
      toast({
        title: "속삭임 전송 완료",
        description: `익명으로 ${type === 'question' ? '질문이' : '답변이'} 등록되었습니다.`
      })
    }, 400)
  }

  return (
    <Card className="bg-white border-primary/10 mb-8 overflow-hidden shadow-md hover:border-accent/20 transition-all rounded-2xl">
      <div className="h-2 bg-accent w-full" />
      <CardContent className="p-6 md:p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex gap-5">
             <div className="w-12 h-12 rounded-2xl bg-primary text-accent flex-shrink-0 flex items-center justify-center shadow-lg transform rotate-3 hover:rotate-0 transition-transform">
               <User className="w-7 h-7" />
             </div>
             <div className="flex-1 space-y-5">
                <div className="flex items-center gap-3">
                  <Input
                    placeholder="익명 닉네임"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    className="bg-primary/5 border-none h-10 w-fit min-w-[150px] focus-visible:ring-accent/30 text-sm font-bold text-primary placeholder:text-primary/50 rounded-xl px-4"
                    maxLength={20}
                  />
                  <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                  <span className="text-[10px] text-accent font-bold uppercase tracking-[0.2em]">Private Space</span>
                </div>
                
                {type === "question" && (
                  <Input
                    placeholder="전하고 싶은 핵심 제목을 적어주세요"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="bg-transparent border-none p-0 h-auto focus-visible:ring-0 text-xl md:text-2xl font-black text-primary placeholder:text-primary/30 border-b-2 border-primary/5 pb-4 rounded-none focus:border-accent transition-all"
                  />
                )}

                <Textarea
                  placeholder={placeholder}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  className="min-h-[160px] bg-transparent border-none p-0 focus-visible:ring-0 resize-y text-base md:text-lg leading-relaxed text-foreground placeholder:text-primary/30"
                />
             </div>
          </div>

          {imageUrl && (
            <div className="relative w-full max-w-lg aspect-video rounded-2xl overflow-hidden border-2 border-accent/20 shadow-xl mt-4 ml-0 md:ml-16 group">
              <Image 
                src={imageUrl} 
                alt="미리보기" 
                fill 
                className="object-cover"
              />
              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                 <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="rounded-full h-10 w-10 shadow-2xl transform scale-90 group-hover:scale-100 transition-transform"
                    onClick={handleRemoveImage}
                  >
                    <X className="h-5 w-5" />
                  </Button>
              </div>
            </div>
          )}

          <div className="flex justify-between items-center pt-6 border-t border-primary/5">
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
                    variant="ghost"
                    size="sm"
                    className="text-primary/60 hover:text-accent hover:bg-accent/10 h-10 px-4 rounded-xl transition-all font-bold"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <ImageIcon className="w-5 h-5 mr-2" />
                    사진
                  </Button>
                </>
              )}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-primary/60 hover:text-accent hover:bg-accent/10 h-10 px-4 rounded-xl transition-all font-bold"
              >
                <Smile className="w-5 h-5 mr-2" />
                감정
              </Button>
            </div>
            
            <Button 
              type="submit" 
              disabled={isSubmitting || !text.trim()}
              className="bg-primary hover:bg-primary/90 text-accent font-black h-12 px-10 rounded-2xl transition-all shadow-xl active:scale-95 disabled:opacity-50 flex items-center gap-2"
            >
              {isSubmitting ? "전송 중..." : (
                <>
                  게시하기
                  <Send className="w-4 h-4" />
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
