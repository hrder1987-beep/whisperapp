
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

export function SubmissionForm({ onSubmit, type, placeholder }: SubmissionFormProps) {
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
      textareaRef.current.style.height = `${Math.max(120, textareaRef.current.scrollHeight)}px`
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
    <Card className="naver-card mb-6 md:mb-10 overflow-hidden bg-white border-black/[0.06] shadow-xl">
      <CardContent className="p-0">
        <form onSubmit={handleSubmit}>
          <div className="p-6 md:p-10 space-y-6 md:space-y-8">
            {type === "question" && (
              <div className="space-y-5">
                <div className="flex flex-col md:flex-row md:items-center gap-5 px-4">
                  <Input
                    placeholder="제목을 입력하세요"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="flex-1 border-none shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 text-xl md:text-2xl font-black p-0 h-auto placeholder:text-black/20 text-accent bg-transparent outline-none"
                  />
                  <div className="w-full md:w-52 shrink-0">
                    <Select value={selectedCategory || ""} onValueChange={setSelectedCategory}>
                      <SelectTrigger className="h-11 bg-primary/10 border-none rounded-xl font-black text-[13px] text-accent focus:ring-0 px-5 shadow-inner">
                        <SelectValue placeholder="카테고리 선택" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-black/10 rounded-2xl shadow-3xl">
                        {HR_CATEGORIES.map((cat) => (
                          <SelectItem key={cat} value={cat} className="text-sm font-bold py-3.5 focus:bg-primary focus:text-accent transition-colors cursor-pointer rounded-xl">
                            {cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Separator className="bg-black/[0.04]" />
              </div>
            )}
            
            <div className="px-4">
              <Textarea
                ref={textareaRef}
                placeholder={placeholder || (type === "question" ? "나누고 싶은 HR 인사이트를 자유롭게 적어주세요." : "도움이 되는 따뜻한 답변을 남겨주세요.")}
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="min-h-[120px] md:min-h-[160px] border-none shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 py-2 text-[16px] md:text-[18px] leading-relaxed resize-none text-[#404040] placeholder:text-black/20 bg-transparent outline-none font-medium"
              />
            </div>

            {showVideoInput && (
              <div className="bg-primary/5 p-5 rounded-2xl border border-primary/10 mx-4 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="flex items-center gap-4">
                  <Youtube className="w-6 h-6 text-[#FF0000]" />
                  <Input 
                    placeholder="유튜브 링크를 입력하세요"
                    value={videoUrl || ""}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    className="flex-1 bg-white border-black/10 h-11 text-sm font-bold focus-visible:ring-primary/20 rounded-xl px-4"
                  />
                  <Button type="button" variant="ghost" size="icon" onClick={() => { setVideoUrl(undefined); setShowVideoInput(false); }} className="h-11 w-11 text-black/20 hover:text-red-500 hover:bg-red-50 rounded-full">
                    <X className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            )}

            {imageUrl && (
              <div className="relative w-fit max-w-full rounded-2xl overflow-hidden border border-black/5 mt-4 mx-4 shadow-lg group">
                <img src={imageUrl} alt="preview" className="h-40 md:h-56 w-auto object-cover" />
                <button 
                  type="button" 
                  className="absolute top-3 right-3 bg-black/60 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => setImageUrl(undefined)}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>

          <div className="bg-[#FBFBFC] px-6 md:px-10 py-4 md:py-6 flex items-center justify-between border-t border-black/[0.04]">
            <div className="flex items-center gap-2">
              <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onloadend = () => setImageUrl(reader.result as string);
                  reader.readAsDataURL(file);
                }
              }} />
              <Button type="button" variant="ghost" size="sm" className="h-11 text-accent/40 gap-2 hover:text-primary hover:bg-primary/5 font-black px-4 rounded-xl transition-all" onClick={() => fileInputRef.current?.click()}>
                <ImageIcon className="w-5 h-5" />
                <span className="text-[13px] hidden sm:inline">사진 추가</span>
              </Button>
              <Button type="button" variant="ghost" size="sm" className="h-11 text-accent/40 gap-2 hover:text-primary hover:bg-primary/5 font-black px-4 rounded-xl transition-all" onClick={() => setShowVideoInput(!showVideoInput)}>
                <Video className="w-5 h-5" />
                <span className="text-[13px] hidden sm:inline">동영상</span>
              </Button>
            </div>
            
            <Button 
              type="submit" 
              disabled={isSubmitting || !text.trim()} 
              className="naver-button h-12 md:h-14 px-10 md:px-14 text-base gap-3 shadow-2xl hover:scale-[1.02] transition-transform"
            >
              {isSubmitting ? "전송 중..." : type === "question" ? "속삭임 등록" : "지혜 더하기"}
              <Send className="w-4 h-4 md:w-5 md:h-5" />
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
