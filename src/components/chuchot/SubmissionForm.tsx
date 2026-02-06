"use client"

import { useState, useRef } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { ImageIcon, X, Smile, User } from "lucide-react"
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
    <Card className="bg-white border-primary/20 mb-6 overflow-hidden shadow-sm hover:border-primary/40 transition-all rounded-2xl">
      <div className="h-1.5 bg-primary w-full opacity-80" />
      <CardContent className="p-5 md:p-7">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="flex gap-4">
             <div className="w-11 h-11 rounded-full bg-primary text-white flex-shrink-0 flex items-center justify-center shadow-md">
               <User className="w-6 h-6" />
             </div>
             <div className="flex-1 space-y-4">
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="닉네임 (최대 20자)"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    className="bg-primary/5 border-none h-8 w-fit min-w-[130px] focus-visible:ring-primary/20 text-sm font-bold text-primary placeholder:text-primary/40 rounded-full px-4"
                    maxLength={20}
                  />
                  <span className="text-[11px] text-primary/40 font-semibold uppercase tracking-wider">Anonymous</span>
                </div>
                
                {type === "question" && (
                  <Input
                    placeholder="어떤 이야기를 들려주실 건가요?"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="bg-transparent border-none p-0 h-auto focus-visible:ring-0 text-xl md:text-2xl font-bold placeholder:text-muted-foreground/30 border-b border-primary/5 pb-3 rounded-none focus:border-primary transition-all"
                  />
                )}

                <Textarea
                  placeholder={placeholder}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  className="min-h-[140px] bg-transparent border-none p-0 focus-visible:ring-0 resize-y placeholder:text-muted-foreground/30 text-[16px] md:text-[17px] leading-relaxed"
                />
             </div>
          </div>

          {imageUrl && (
            <div className="relative w-full max-w-md aspect-video rounded-xl overflow-hidden border border-primary/10 group mt-2 ml-15">
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
                className="absolute top-3 right-3 rounded-full h-8 w-8 shadow-xl opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={handleRemoveImage}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}

          <div className="flex justify-between items-center pt-5 border-t border-primary/5">
            <div className="flex items-center gap-3">
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
                    className="text-primary/80 hover:text-primary hover:bg-primary/10 h-10 px-4 rounded-full transition-all font-semibold"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <ImageIcon className="w-5 h-5 mr-2" />
                    사진 첨부
                  </Button>
                </>
              )}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-primary/80 hover:text-primary hover:bg-primary/10 h-10 px-4 rounded-full transition-all font-semibold"
              >
                <Smile className="w-5 h-5 mr-2" />
                이모지
              </Button>
            </div>
            
            <Button 
              type="submit" 
              disabled={isSubmitting || !text.trim()}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold h-11 px-10 rounded-full transition-all shadow-lg active:scale-95 disabled:opacity-30"
            >
              {isSubmitting ? "게시 중..." : "게시하기"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
