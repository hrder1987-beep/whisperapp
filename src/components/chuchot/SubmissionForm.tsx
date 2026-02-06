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
import { containsProfanity } from "@/lib/utils"

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

    // 욕설 필터링 검사
    if (containsProfanity(title) || containsProfanity(text) || containsProfanity(nickname)) {
      toast({
        title: "등록 불가",
        description: "부적절한 표현이나 욕설이 포함되어 있어 게시할 수 없습니다. 커뮤니티 가이드라인을 준수해주세요.",
        variant: "destructive"
      })
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
    <Card className="bg-white border border-primary/10 mb-8 overflow-hidden shadow-xl rounded-[2rem] hover:shadow-2xl transition-all duration-500">
      <div className="h-2 w-full gold-gradient"></div>
      <CardContent className="p-6 md:p-10">
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="flex items-start gap-6">
            <div className="hidden sm:block">
              <AvatarIcon seed={nickname || "hr-expert"} className="w-14 h-14 border-2 border-primary/5 shadow-lg" />
            </div>
            <div className="flex-1 space-y-6">
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative group">
                  <Input
                    placeholder="익명 닉네임 (예: 인사팀장)"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    className="h-10 w-48 bg-primary/[0.03] border-none focus-visible:ring-accent/50 text-sm font-black placeholder:text-primary/20 rounded-xl px-4 transition-all"
                    maxLength={20}
                  />
                </div>
                <div className="flex items-center gap-2 bg-primary/5 px-4 py-2 rounded-xl text-[11px] text-primary/60 font-black border border-primary/5 cursor-default">
                  <Smile className="w-3.5 h-3.5 text-accent" />
                  HR 전문가 인증 완료
                </div>
              </div>

              <div className="space-y-4">
                {type === "question" && (
                  <div className="relative">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-[13px] font-black text-accent uppercase tracking-wider">Title</span>
                      <div className="flex-1 h-px bg-primary/5"></div>
                    </div>
                    <Input
                      placeholder="공유하고 싶은 HR 주제 제목을 입력하세요."
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="bg-transparent border-none p-0 h-auto focus-visible:ring-0 text-xl md:text-2xl font-black text-primary placeholder:text-primary/10 tracking-tight"
                    />
                  </div>
                )}
                
                <div className="relative">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-[13px] font-black text-accent uppercase tracking-wider">Content</span>
                    <div className="flex-1 h-px bg-primary/5"></div>
                  </div>
                  <Textarea
                    placeholder={type === "question" ? "채용, 교육, 평가 등 고민이나 정보를 자유롭게 속삭여보세요." : "동료 담당자에게 따뜻한 조언이나 지식을 공유해보세요."}
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    className="min-h-[160px] bg-transparent border-none p-0 focus-visible:ring-0 resize-none text-base md:text-lg leading-relaxed text-primary/80 placeholder:text-primary/10 font-medium"
                  />
                </div>
              </div>
            </div>
          </div>

          {imageUrl && (
            <div className="relative w-full rounded-[2rem] overflow-hidden border-8 border-white shadow-2xl group/preview mx-auto max-w-2xl animate-in zoom-in-95 duration-300">
              <Image 
                src={imageUrl} 
                alt="미리보기" 
                width={800}
                height={450}
                className="w-full object-contain max-h-[400px] bg-primary/5"
              />
              <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover/preview:opacity-100 transition-opacity flex items-center justify-center">
                <Button
                  type="button"
                  variant="destructive"
                  size="lg"
                  className="rounded-full shadow-2xl font-black scale-90 group-hover/preview:scale-100 transition-transform"
                  onClick={handleRemoveImage}
                >
                  <X className="h-5 w-5 mr-2" />
                  이미지 삭제
                </Button>
              </div>
            </div>
          )}

          <Separator className="bg-primary/5" />

          <div className="flex items-center justify-between">
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
                    className="text-primary/40 hover:text-primary hover:bg-primary/5 rounded-2xl h-12 px-5 transition-all group/btn"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <ImageIcon className="w-5 h-5 mr-3 text-emerald-500 group-hover:scale-110 transition-transform" />
                    <span className="font-black text-[13px]">인사이트 이미지 첨부</span>
                  </Button>
                </>
              )}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-primary/40 hover:text-primary hover:bg-primary/5 rounded-2xl h-12 px-5 transition-all group/btn"
              >
                <Briefcase className="w-5 h-5 mr-3 text-blue-500 group-hover:scale-110 transition-transform" />
                <span className="font-black text-[13px]">직무 카테고리</span>
              </Button>
            </div>
            
            <Button 
              type="submit" 
              disabled={isSubmitting || !text.trim()}
              className="group bg-primary hover:bg-primary/90 text-accent font-black h-14 px-10 rounded-[1.25rem] shadow-2xl transition-all active:scale-95 disabled:opacity-30 flex items-center gap-3 overflow-hidden relative"
            >
              <span className="relative z-10">{isSubmitting ? "전송 중..." : "속삭임 등록"}</span>
              <Send className="w-5 h-5 relative z-10 group-hover:translate-x-12 group-hover:-translate-y-12 transition-all duration-500" />
              <Send className="w-5 h-5 absolute -left-10 bottom-0 group-hover:left-1/2 group-hover:bottom-1/2 translate-x-12 -translate-y-12 transition-all duration-500 opacity-0 group-hover:opacity-100" />
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
