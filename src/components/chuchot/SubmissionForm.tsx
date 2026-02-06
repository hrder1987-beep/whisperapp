"use client"

import { useState, useRef } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { ImageIcon, X, Smile, User, Send, ChevronDown } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import Image from "next/image"
import { Separator } from "@/components/ui/separator"

interface SubmissionFormProps {
  placeholder: string
  onSubmit: (nickname: string, title: string, text: string, imageUrl?: string) => void
  type: "question" | "answer"
}

export function SubmissionForm({ onSubmit, type }: SubmissionFormProps) {
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
    <Card className="bg-white border border-primary/10 mb-8 overflow-hidden shadow-md rounded-2xl">
      <CardContent className="p-4 md:p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 상단: 프로필 및 정보 */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/5 flex items-center justify-center border border-primary/10">
              <User className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <Input
                  placeholder="닉네임 입력..."
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  className="h-8 w-32 md:w-40 bg-muted/50 border-none focus-visible:ring-primary/20 text-sm font-bold placeholder:text-muted-foreground/50 rounded-full"
                  maxLength={20}
                />
                <div className="flex items-center gap-1 bg-muted/50 px-2 py-1 rounded-full text-[10px] text-muted-foreground font-bold border border-black/5">
                  전체 공개 <ChevronDown className="w-3 h-3" />
                </div>
              </div>
            </div>
          </div>

          {/* 중간: 입력 영역 */}
          <div className="space-y-2">
            {type === "question" && (
              <Input
                placeholder="어떤 고민이 있으신가요? (제목)"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="bg-transparent border-none p-0 h-auto focus-visible:ring-0 text-lg md:text-xl font-black text-primary placeholder:text-primary/20"
              />
            )}
            <Textarea
              placeholder={type === "question" ? "내용을 입력하세요..." : "답글을 입력하세요..."}
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="min-h-[120px] bg-transparent border-none p-0 focus-visible:ring-0 resize-none text-base md:text-lg leading-relaxed text-foreground placeholder:text-muted-foreground/30 font-medium"
            />
          </div>

          {/* 이미지 미리보기 */}
          {imageUrl && (
            <div className="relative w-full rounded-xl overflow-hidden border border-primary/5 group/preview">
              <Image 
                src={imageUrl} 
                alt="미리보기" 
                width={800}
                height={450}
                className="w-full object-contain max-h-[400px] bg-black/5"
              />
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2 rounded-full h-8 w-8 shadow-lg opacity-0 group-hover/preview:opacity-100 transition-opacity"
                onClick={handleRemoveImage}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}

          <Separator className="bg-primary/5" />

          {/* 하단: 액션 바 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 md:gap-2">
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
                    className="text-muted-foreground hover:text-primary hover:bg-primary/5 rounded-lg h-9"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <ImageIcon className="w-5 h-5 mr-2 text-green-500" />
                    <span className="hidden sm:inline">사진/동영상</span>
                  </Button>
                </>
              )}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-primary hover:bg-primary/5 rounded-lg h-9"
              >
                <Smile className="w-5 h-5 mr-2 text-yellow-500" />
                <span className="hidden sm:inline">기분/활동</span>
              </Button>
            </div>
            
            <Button 
              type="submit" 
              disabled={isSubmitting || !text.trim()}
              className="bg-primary hover:bg-primary/90 text-accent font-black h-9 px-6 rounded-lg transition-all active:scale-95 disabled:opacity-30"
            >
              {isSubmitting ? "전송 중..." : "게시"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
