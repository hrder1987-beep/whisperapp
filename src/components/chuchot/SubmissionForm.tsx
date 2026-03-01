"use client"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { ImageIcon, X, Send, Video, Youtube } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Separator } from "@/components/ui/separator"
import { containsProfanity } from "@/lib/utils"
import { useUser, useDoc, useMemoFirebase, useFirestore } from "@/firebase"
import { doc } from "firebase/firestore"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface SubmissionFormProps {
  placeholder: string
  onSubmit: (nickname: string, title: string, text: string, imageUrl?: string, videoUrl?: string, category?: string, jobRole?: string) => void
  type: "question" | "answer"
}

const HR_CATEGORIES = [
  "인사전략/HRM", "HRD/교육", "조직문화/EVP", "채용/헤드헌팅", "복지/유연근무", "강의/컨설팅", "교육문의", "연회장문의", "현업 고민", "기타 정보"
]

export function SubmissionForm({ onSubmit, type }: SubmissionFormProps) {
  const { user } = useUser()
  const db = useFirestore()
  
  const userDocRef = useMemoFirebase(() => (user && db) ? doc(db, "users", user.uid) : null, [user, db])
  const { data: profile } = useDoc<any>(userDocRef)

  const [title, setTitle] = useState("")
  const [text, setText] = useState("")
  const [imageUrl, setImageUrl] = useState<string | undefined>(undefined)
  const [videoUrl, setVideoUrl] = useState<string | undefined>(undefined)
  const [showVideoInput, setShowVideoInput] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const { toast } = useToast()

  const nickname = profile?.username || "익명전문가"
  const jobRole = profile?.jobRole || ""

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }, [text])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) {
      toast({ title: "로그인 필요", description: "지식을 나누려면 로그인이 필요합니다.", variant: "destructive" })
      return
    }
    if (type === "question" && (!title.trim() || !selectedCategory)) {
      toast({ title: "입력 오류", description: "제목과 카테고리를 선택해 주세요.", variant: "destructive" })
      return
    }
    if (!text.trim()) return

    if (containsProfanity(title) || containsProfanity(text)) {
      toast({ title: "등록 불가", description: "부적절한 표현이 포함되어 있습니다.", variant: "destructive" })
      return
    }

    setIsSubmitting(true)
    setTimeout(() => {
      onSubmit(nickname, title, text, imageUrl, videoUrl, selectedCategory || undefined, jobRole)
      setTitle(""); setText(""); setImageUrl(undefined); setVideoUrl(undefined); setShowVideoInput(false); setSelectedCategory(null);
      setIsSubmitting(false)
      toast({ title: "게시 완료", description: "소중한 지식이 공유되었습니다." })
    }, 400)
  }

  return (
    <Card className="naver-card mb-4 md:mb-6 overflow-hidden bg-white border-black/[0.1]">
      <CardContent className="p-0">
        <form onSubmit={handleSubmit}>
          <div className="p-6 md:p-8 space-y-4 md:space-y-6">
            {type === "question" && (
              <div className="space-y-4">
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                  <Input
                    placeholder="제목을 입력하세요"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="flex-1 border-none shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 text-lg md:text-xl font-black p-0 h-auto placeholder:text-black/30 text-[#1E1E23] bg-transparent outline-none"
                  />
                  <div className="w-full md:w-48">
                    <Select value={selectedCategory || ""} onValueChange={setSelectedCategory}>
                      <SelectTrigger className="h-10 bg-primary/5 border-none rounded-sm font-bold text-xs text-primary focus:ring-0">
                        <SelectValue placeholder="카테고리 선택" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-black/10 rounded-sm">
                        {HR_CATEGORIES.map((cat) => (
                          <SelectItem key={cat} value={cat} className="text-xs font-bold py-2.5 focus:bg-primary focus:text-white transition-colors cursor-pointer">
                            {cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Separator className="bg-black/[0.06]" />
              </div>
            )}
            
            <Textarea
              ref={textareaRef}
              placeholder={type === "question" ? "나누고 싶은 HR 인사이트를 자유롭게 적어주세요." : "도움이 되는 따뜻한 답변을 남겨주세요."}
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="min-h-[100px] md:min-h-[140px] border-none shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 px-6 py-2 text-[15px] md:text-[16px] leading-relaxed resize-none text-[#404040] placeholder:text-black/30 bg-transparent outline-none"
            />

            {showVideoInput && (
              <div className="bg-primary/5 p-4 rounded-sm border border-primary/10 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="flex items-center gap-3">
                  <Youtube className="w-5 h-5 text-[#FF0000]" />
                  <Input 
                    placeholder="유튜브 링크를 입력하세요 (예: https://youtu.be/...)"
                    value={videoUrl || ""}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    className="flex-1 bg-white border-black/10 h-10 text-sm font-bold focus-visible:ring-primary/20"
                  />
                  <Button type="button" variant="ghost" size="icon" onClick={() => { setVideoUrl(undefined); setShowVideoInput(false); }} className="h-10 w-10 text-black/20 hover:text-red-500">
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-[10px] font-bold text-primary/40 mt-2 ml-8">* 유튜브 링크를 입력하면 게시글 상세 보기에서 영상을 확인하실 수 있습니다.</p>
              </div>
            )}

            {imageUrl && (
              <div className="relative w-fit max-w-full rounded-none overflow-hidden border border-black/5 mt-4">
                <img src={imageUrl} alt="preview" className="h-32 md:h-40 w-auto object-cover" />
                <button 
                  type="button" 
                  className="absolute top-2 right-2 bg-black/60 text-white p-1.5 rounded-full hover:bg-red-500 transition-colors"
                  onClick={() => setImageUrl(undefined)}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>

          <div className="bg-[#FBFBFC] px-5 md:px-8 py-3 md:py-4 flex items-center justify-between border-t border-black/[0.06]">
            <div className="flex items-center gap-1">
              <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onloadend = () => setImageUrl(reader.result as string);
                  reader.readAsDataURL(file);
                }
              }} />
              <Button type="button" variant="ghost" size="sm" className="h-9 text-[#888] gap-1.5 md:gap-2 hover:text-primary font-bold px-2" onClick={() => fileInputRef.current?.click()}>
                <ImageIcon className="w-4 h-4" />
                <span className="text-[12px] md:text-[13px]">사진</span>
              </Button>
              <Button type="button" variant="ghost" size="sm" className="h-9 text-[#888] gap-1.5 md:gap-2 hover:text-primary font-bold px-2" onClick={() => setShowVideoInput(!showVideoInput)}>
                <Video className="w-4 h-4" />
                <span className="text-[12px] md:text-[13px]">동영상</span>
              </Button>
            </div>
            
            <Button 
              type="submit" 
              disabled={isSubmitting || !text.trim()} 
              className="naver-button h-9 md:h-10 px-6 md:px-10 text-[13px] md:text-[14px] gap-2 shadow-none whitespace-nowrap"
            >
              {isSubmitting ? "전송" : type === "question" ? "등록" : "답변"}
              <Send className="w-3.5 h-3.5 md:w-4 md:h-4" />
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
