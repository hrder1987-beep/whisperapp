
"use client"

import { useState, useRef } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { ImageIcon, X, Smile, Send, Hash } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import Image from "next/image"
import { Separator } from "@/components/ui/separator"
import { AvatarIcon } from "./AvatarIcon"
import { containsProfanity } from "@/lib/utils"
import { cn } from "@/lib/utils"

interface SubmissionFormProps {
  placeholder: string
  onSubmit: (nickname: string, title: string, text: string, imageUrl?: string, category?: string) => void
  type: "question" | "answer"
}

const HRD_CATEGORIES = [
  "L&D 전략", "과정 설계", "리더십 개발", "조직문화", "온보딩", "디지털 러닝", "평가/ROI", "역량 모델링"
]

export function SubmissionForm({ onSubmit, type }: SubmissionFormProps) {
  const [nickname, setNickname] = useState("")
  const [title, setTitle] = useState("")
  const [text, setText] = useState("")
  const [imageUrl, setImageUrl] = useState<string | undefined>(undefined)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
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
      toast({ title: "입력 오류", description: "HRD 관련 닉네임을 입력해주세요.", variant: "destructive" })
      return
    }
    
    if (type === "question") {
      if (!title.trim()) {
        toast({ title: "입력 오류", description: "교육 주제 제목을 입력해주세요.", variant: "destructive" })
        return
      }
      if (!selectedCategory) {
        toast({ title: "입력 오류", description: "카테고리(#)를 선택해주세요.", variant: "destructive" })
        return
      }
    }

    if (!text.trim()) {
      toast({ title: "입력 오류", description: "내용을 입력해주세요.", variant: "destructive" })
      return
    }

    if (containsProfanity(title) || containsProfanity(text) || containsProfanity(nickname)) {
      toast({
        title: "등록 불가",
        description: "부적절한 표현이나 욕설이 포함되어 있어 게시할 수 없습니다.",
        variant: "destructive"
      })
      return
    }

    setIsSubmitting(true)
    setTimeout(() => {
      onSubmit(nickname, title, text, imageUrl, selectedCategory || undefined)
      setNickname("")
      setTitle("")
      setText("")
      setImageUrl(undefined)
      setSelectedCategory(null)
      if (fileInputRef.current) fileInputRef.current.value = ""
      setIsSubmitting(false)
      toast({
        title: "속삭임 게시 완료",
        description: "HRD 커뮤니티에 소중한 인사이트가 등록되었습니다."
      })
    }, 400)
  }

  return (
    <Card className="bg-white border border-primary/10 mb-8 overflow-hidden shadow-xl rounded-[2rem] hover:shadow-2xl transition-all duration-500">
      <div className="h-1.5 w-full gold-gradient"></div>
      <CardContent className="p-6 md:p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex items-start gap-4">
            <AvatarIcon seed={nickname || "hrd-practitioner"} className="w-12 h-12 shadow-md border-2 border-primary/5 flex-shrink-0" />
            <div className="flex-1 space-y-4">
              <div className="flex items-center gap-3">
                <Input
                  placeholder="익명 닉네임 (예: 교육담당)"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  className="h-10 w-64 bg-primary/[0.03] border-none focus-visible:ring-accent/50 text-sm font-black placeholder:text-primary/30 rounded-xl px-4"
                  maxLength={20}
                />
              </div>

              <div className="space-y-3">
                {type === "question" && (
                  <div className="space-y-4">
                    <Input
                      placeholder="공유하고 싶은 교육 주제 제목을 입력하세요."
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="bg-transparent border-none p-0 h-auto focus-visible:ring-0 text-xl font-black text-primary placeholder:text-primary/10 tracking-tight"
                    />
                    
                    <div className="space-y-2">
                      <p className="text-[12px] font-black text-accent flex items-center gap-1">
                        <Hash className="w-3 h-3" /> 교육 카테고리 선택
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {HRD_CATEGORIES.map((cat) => (
                          <button
                            key={cat}
                            type="button"
                            onClick={() => setSelectedCategory(cat)}
                            className={cn(
                              "px-3 py-1.5 rounded-full text-[12px] font-bold transition-all border",
                              selectedCategory === cat
                                ? "bg-primary text-accent border-primary shadow-lg scale-105"
                                : "bg-primary/5 text-primary/40 border-transparent hover:bg-primary/10 hover:text-primary"
                            )}
                          >
                            #{cat}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                
                <Textarea
                  placeholder={type === "question" ? "교육 설계, L&D 전략, 온보딩 등 고민을 자유롭게 속삭여보세요." : "동료 담당자에게 따뜻한 조언이나 교육 노하우를 공유해보세요."}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  className="min-h-[120px] bg-transparent border-none p-0 focus-visible:ring-0 resize-none text-base leading-relaxed text-primary/80 placeholder:text-primary/10 font-medium"
                />
              </div>
            </div>
          </div>

          {imageUrl && (
            <div className="relative w-full rounded-2xl overflow-hidden border border-primary/10 group/preview max-w-lg mx-auto">
              <Image 
                src={imageUrl} 
                alt="미리보기" 
                width={600}
                height={337}
                className="w-full object-contain max-h-[300px] bg-primary/5"
              />
              <button
                type="button"
                className="absolute top-2 right-2 bg-black/50 text-white p-1.5 rounded-full opacity-0 group-hover/preview:opacity-100 transition-opacity"
                onClick={handleRemoveImage}
              >
                <X className="h-4 w-4" />
              </button>
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
                    className="text-primary/40 hover:text-primary hover:bg-primary/5 rounded-xl h-10 px-4 group/btn"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <ImageIcon className="w-4 h-4 mr-2 text-emerald-500" />
                    <span className="font-black text-[12px]">이미지</span>
                  </Button>
                </>
              )}
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-accent/10 text-[11px] font-black text-accent border border-accent/10">
                <Smile className="w-3.5 h-3.5" />
                HRD 현직자
              </div>
            </div>
            
            <Button 
              type="submit" 
              disabled={isSubmitting || !text.trim()}
              className="bg-primary hover:bg-primary/90 text-accent font-black h-11 px-8 rounded-xl shadow-lg transition-all active:scale-95 disabled:opacity-30 flex items-center gap-2"
            >
              {isSubmitting ? "전송 중..." : "게시하기"}
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
