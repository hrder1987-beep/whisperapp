
"use client"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { ImageIcon, X, Send } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Separator } from "@/components/ui/separator"
import { containsProfanity } from "@/lib/utils"
import { cn } from "@/lib/utils"
import { useUser, useDoc, useMemoFirebase, useFirestore } from "@/firebase"
import { doc } from "firebase/firestore"

interface SubmissionFormProps {
  placeholder: string
  onSubmit: (nickname: string, title: string, text: string, imageUrl?: string, videoUrl?: string, category?: string) => void
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
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const { toast } = useToast()

  const nickname = profile?.username || "익명전문가"

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
      toast({ title: "입력 오류", description: "제목과 카테고리를 입력해 주세요.", variant: "destructive" })
      return
    }
    if (!text.trim()) return

    if (containsProfanity(title) || containsProfanity(text)) {
      toast({ title: "등록 불가", description: "부적절한 표현이 포함되어 있습니다.", variant: "destructive" })
      return
    }

    setIsSubmitting(true)
    setTimeout(() => {
      onSubmit(nickname, title, text, imageUrl, undefined, selectedCategory || undefined)
      setTitle(""); setText(""); setImageUrl(undefined); setSelectedCategory(null);
      setIsSubmitting(false)
      toast({ title: "게시 완료", description: "소중한 지식이 공유되었습니다." })
    }, 400)
  }

  return (
    <Card className="naver-card mb-6 overflow-hidden bg-white border-black/[0.1]">
      <CardContent className="p-0">
        <form onSubmit={handleSubmit}>
          <div className="p-6 md:p-8 space-y-6">
            {type === "question" && (
              <div className="space-y-5">
                <Input
                  placeholder="질문 제목을 입력하세요"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="border-none shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 text-xl font-black p-0 h-auto placeholder:text-black/15 text-[#1E1E23] bg-transparent outline-none"
                />
                <div className="flex flex-wrap gap-2 pt-1">
                  {HR_CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedCategory(cat)}
                      className={cn(
                        "px-3 py-1.5 text-[11px] font-bold transition-all border whitespace-nowrap",
                        selectedCategory === cat 
                          ? "bg-accent text-white border-accent" 
                          : "bg-white text-[#888] border-black/[0.08] hover:border-accent/50"
                      )}
                    >
                      #{cat}
                    </button>
                  ))}
                </div>
                <Separator className="bg-black/[0.06]" />
              </div>
            )}
            
            <Textarea
              ref={textareaRef}
              placeholder={type === "question" ? "나누고 싶은 HR 인사이트를 자유롭게 적어주세요." : "도움이 되는 따뜻한 답변을 남겨주세요."}
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="min-h-[140px] border-none shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 p-0 text-[16px] leading-relaxed resize-none text-[#404040] placeholder:text-black/15 bg-transparent outline-none"
            />

            {imageUrl && (
              <div className="relative w-fit max-w-full rounded-none overflow-hidden border border-black/5 mt-4">
                <img src={imageUrl} alt="preview" className="h-40 w-auto object-cover" />
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

          <div className="bg-[#FBFBFC] px-6 md:px-8 py-4 flex items-center justify-between border-t border-black/[0.06]">
            <div className="flex items-center gap-1">
              <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onloadend = () => setImageUrl(reader.result as string);
                  reader.readAsDataURL(file);
                }
              }} />
              <Button type="button" variant="ghost" size="sm" className="h-9 text-[#888] gap-2 hover:text-accent font-bold" onClick={() => fileInputRef.current?.click()}>
                <ImageIcon className="w-4 h-4" />
                <span className="text-[13px]">사진 첨부</span>
              </Button>
            </div>
            
            <Button 
              type="submit" 
              disabled={isSubmitting || !text.trim()} 
              className="naver-button h-10 px-10 text-[14px] gap-2 shadow-none whitespace-nowrap"
            >
              {isSubmitting ? "게시 중" : type === "question" ? "질문 등록" : "답변 등록"}
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
