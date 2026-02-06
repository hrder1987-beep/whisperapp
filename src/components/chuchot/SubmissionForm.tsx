"use client"

import { useState, useRef } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { ImageIcon, X, Smile, Send, ChevronDown, Briefcase } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import Image from "next/image"
import { Separator } from "@/components/ui/separator"
import { AvatarIcon } from "./AvatarIcon"

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
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "파일 크기 초과",
          description: "10MB 이하의 이미지만 업로드 가능합니다.",
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
      toast({ title: "입력 오류", description: "직무 관련 닉네임을 입력해주세요.", variant: "destructive" })
      return
    }
    
    if (type === "question" && !title.trim()) {
      toast({ title: "입력 오류", description: "주제 제목을 입력해주세요.", variant: "destructive" })
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
        title: "속삭임 게시 완료",
        description: "HR 커뮤니티에 소중한 인사이트가 등록되었습니다."
      })
    }, 400)
  }

  return (
    <Card className="bg-white border border-primary/10 mb-8 overflow-hidden shadow-xl rounded-[2rem]">
      <div className="h-1.5 w-full bg-gold"></div>
      <CardContent className="p-5 md:p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex items-start gap-4">
            <AvatarIcon seed={nickname || "hr-expert"} className="flex-shrink-0" />
            <div className="flex-1 space-y-4">
              <div className="flex items-center gap-2">
                <Input
                  placeholder="예: 인사팀장, 교육담당"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  className="h-9 w-44 bg-primary/5 border-none focus-visible:ring-primary/20 text-sm font-black placeholder:text-primary/30 rounded-full px-4"
                  maxLength={20}
                />
                <div className="flex items-center gap-1 bg-primary/5 px-3 py-1.5 rounded-full text-[10px] text-primary/60 font-black border border-primary/5 cursor-pointer hover:bg-primary/10 transition-colors">
                  익명 HR 전문가 <ChevronDown className="w-3 h-3" />
                </div>
              </div>

              <div className="space-y-1">
                {type === "question" && (
                  <Input
                    placeholder="공유하고 싶은 HR 주제 제목"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="bg-transparent border-none p-0 h-auto focus-visible:ring-0 text-xl md:text-2xl font-black text-primary placeholder:text-primary/20"
                  />
                )}
                <Textarea
                  placeholder={type === "question" ? "채용, 교육, 평가 등 고민이나 정보를 공유해보세요." : "동료 담당자에게 답변을 남겨보세요."}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  className="min-h-[120px] bg-transparent border-none p-0 focus-visible:ring-0 resize-none text-base md:text-lg leading-relaxed text-foreground placeholder:text-muted-foreground/30 font-medium"
                />
              </div>
            </div>
          </div>

          {imageUrl && (
            <div className="relative w-full rounded-2xl overflow-hidden border-4 border-white shadow-lg group/preview mx-auto max-w-2xl">
              <Image 
                src={imageUrl} 
                alt="미리보기" 
                width={800}
                height={450}
                className="w-full object-contain max-h-[350px] bg-black/5"
              />
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-3 right-3 rounded-full h-8 w-8 shadow-lg opacity-0 group-hover/preview:opacity-100 transition-opacity"
                onClick={handleRemoveImage}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}

          <Separator className="bg-primary/5" />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 md:gap-4">
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
                    className="text-primary/40 hover:text-primary hover:bg-primary/5 rounded-xl h-10 px-4 transition-all"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <ImageIcon className="w-5 h-5 mr-2 text-emerald-500" />
                    <span className="hidden sm:inline font-bold">인사이트 이미지</span>
                  </Button>
                </>
              )}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-primary/40 hover:text-primary hover:bg-primary/5 rounded-xl h-10 px-4 transition-all"
              >
                <Briefcase className="w-5 h-5 mr-2 text-blue-500" />
                <span className="hidden sm:inline font-bold">분야 태그</span>
              </Button>
            </div>
            
            <Button 
              type="submit" 
              disabled={isSubmitting || !text.trim()}
              className="group bg-primary hover:bg-primary/95 text-accent font-black h-11 px-8 rounded-2xl shadow-lg transition-all active:scale-95 disabled:opacity-30 flex items-center gap-2"
            >
              {isSubmitting ? "전송 중..." : "게시하기"}
              <Send className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
