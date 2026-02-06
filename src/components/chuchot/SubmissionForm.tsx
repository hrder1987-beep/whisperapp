"use client"

import { useState, useRef } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { ImageIcon, X, Smile, User, Send, ShieldCheck } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import Image from "next/image"

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
    <Card className="bg-white border-none mb-8 overflow-hidden shadow-[0_10px_40px_-15px_rgba(0,0,0,0.1)] rounded-[2rem] relative group/card transition-all duration-500 hover:shadow-[0_20px_50px_-12px_rgba(0,0,0,0.15)]">
      {/* 프리미엄 골드 상단 바 */}
      <div className="h-2.5 bg-accent w-full absolute top-0 left-0 shadow-[0_2px_10px_rgba(var(--accent),0.2)]" />
      
      <CardContent className="p-8 md:p-10 pt-12">
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="flex gap-6 md:gap-8 items-start">
             {/* 유저 프로필 영역 */}
             <div className="flex flex-col items-center gap-3">
               <div className="w-14 h-14 rounded-[1.25rem] premium-gradient text-accent flex-shrink-0 flex items-center justify-center shadow-lg border-2 border-accent/20 transition-transform group-hover/card:scale-105 duration-500">
                 <User className="w-7 h-7" />
               </div>
               <div className="hidden md:flex flex-col items-center gap-1 opacity-40">
                 <ShieldCheck className="w-4 h-4 text-primary" />
                 <span className="text-[8px] font-black uppercase tracking-tighter text-primary">Secure</span>
               </div>
             </div>

             <div className="flex-1 space-y-6">
                {/* 닉네임 입력란 */}
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                  <div className="relative">
                    <Input
                      placeholder="익명 닉네임"
                      value={nickname}
                      onChange={(e) => setNickname(e.target.value)}
                      className="bg-primary/[0.03] border-2 border-primary/5 h-12 w-full md:w-56 focus-visible:ring-accent/40 focus-visible:border-accent/40 text-[15px] font-black text-primary placeholder:text-primary/30 rounded-2xl px-5 transition-all"
                      maxLength={20}
                    />
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2 bg-accent/10 rounded-full border border-accent/20">
                    <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                    <span className="text-[10px] text-primary font-black uppercase tracking-[0.2em]">Private Workspace</span>
                  </div>
                </div>
                
                {/* 제목 입력란 */}
                {type === "question" && (
                  <div className="flex items-start gap-4 group/title border-b-2 border-primary/5 pb-2 focus-within:border-accent/30 transition-colors">
                    <span className="text-primary/40 font-black text-[15px] pt-1.5 whitespace-nowrap min-w-[50px]">제목 :</span>
                    <Input
                      placeholder="제목을 입력하세요"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="bg-transparent border-none p-0 h-auto focus-visible:ring-0 text-xl md:text-2xl font-black text-primary placeholder:text-primary/10 transition-all"
                    />
                  </div>
                )}

                {/* 내용 입력란 */}
                <div className="flex items-start gap-4">
                  <span className="text-primary/40 font-black text-[15px] pt-2 whitespace-nowrap min-w-[50px]">내용 :</span>
                  <Textarea
                    placeholder="내용을 입력하세요"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    className="min-h-[180px] bg-transparent border-none p-0 focus-visible:ring-0 resize-y text-lg md:text-xl leading-[1.6] text-foreground placeholder:text-primary/10 font-medium"
                  />
                </div>
             </div>
          </div>

          {/* 이미지 미리보기 */}
          {imageUrl && (
            <div className="relative w-full max-w-2xl aspect-video rounded-3xl overflow-hidden border-4 border-white shadow-2xl mt-4 ml-0 md:ml-20 group/preview transition-transform hover:scale-[1.02] duration-500">
              <Image 
                src={imageUrl} 
                alt="미리보기" 
                fill 
                className="object-cover"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/preview:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                 <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="rounded-full h-12 w-12 shadow-xl transform transition-transform hover:scale-110"
                    onClick={handleRemoveImage}
                  >
                    <X className="h-6 w-6" />
                  </Button>
              </div>
            </div>
          )}

          {/* 하단 액션 바 */}
          <div className="flex justify-between items-center pt-8 border-t border-primary/5">
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
                    size="lg"
                    className="text-primary/60 hover:text-accent hover:bg-accent/5 h-12 px-6 rounded-2xl transition-all font-black text-sm"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <ImageIcon className="w-5 h-5 mr-3 text-accent" />
                    사진 첨부
                  </Button>
                </>
              )}
              <Button
                type="button"
                variant="ghost"
                size="lg"
                className="text-primary/60 hover:text-accent hover:bg-accent/5 h-12 px-6 rounded-2xl transition-all font-black text-sm"
              >
                <Smile className="w-5 h-5 mr-3 text-accent" />
                감정 표현
              </Button>
            </div>
            
            <Button 
              type="submit" 
              disabled={isSubmitting || !text.trim()}
              className="bg-primary hover:bg-primary/95 text-accent font-black h-14 px-10 rounded-[1.25rem] transition-all shadow-xl shadow-primary/20 active:scale-95 disabled:opacity-30 flex items-center gap-3 border-none text-base group/btn"
            >
              {isSubmitting ? "전송 중..." : (
                <>
                  게시하기
                  <Send className="w-5 h-5 group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-transform" />
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
