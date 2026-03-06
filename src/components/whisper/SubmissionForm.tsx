"use client"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { ImageIcon, X, Send, Video, Youtube, Sparkles } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
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
      textareaRef.current.style.height = `${Math.max(100, textareaRef.current.scrollHeight)}px`
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
    <Card className="naver-card mb-8 overflow-hidden bg-white shadow-xl border-none">
      <CardContent className="p-0">
        <form onSubmit={handleSubmit}>
          <div className="p-6 md:p-8 space-y-6">
            {type === "question" && (
              <div className="space-y-4">
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                  <div className="flex-1 relative">
                    <Input
                      placeholder="주제나 고민의 제목을 입력하세요"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="border-none shadow-none focus-visible:ring-0 text-lg md:text-xl font-black p-0 h-auto placeholder:text-[#163300]/10 text-[#163300] bg-transparent outline-none !px-0"
                    />
                  </div>
                  <div className="w-full md:w-48 shrink-0">
                    <Select value={selectedCategory || ""} onValueChange={setSelectedCategory}>
                      <SelectTrigger className="h-11 bg-primary/15 border-none rounded-xl font-black text-xs text-[#163300] focus:ring-4 focus:ring-primary/5 px-4 shadow-inner">
                        <SelectValue placeholder="카테고리" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-black/5 rounded-2xl shadow-4xl p-1">
                        {HR_CATEGORIES.map((cat) => (
                          <SelectItem key={cat} value={cat} className="text-xs font-bold py-3 focus:bg-primary focus:text-[#163300] transition-all cursor-pointer rounded-xl px-4">
                            {cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="h-px bg-black/[0.03]"></div>
              </div>
            )}
            
            <div className="relative">
              <Textarea
                ref={textareaRef}
                placeholder={placeholder || (type === "question" ? "전문가님의 인사이트를 자유롭게 펼쳐주세요." : "도움이 되는 따뜻한 지혜를 보태주세요.")}
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="min-h-[120px] md:min-h-[150px] border-none shadow-none focus-visible:ring-0 py-1 text-base md:text-lg leading-relaxed resize-none text-[#404040] placeholder:text-[#163300]/10 bg-transparent outline-none font-medium !px-0"
              />
            </div>

            {showVideoInput && (
              <div className="bg-primary/10 p-4 rounded-2xl border border-primary/10 animate-in fade-in slide-in-from-top-4 duration-500">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm">
                    <Youtube className="w-5 h-5 text-[#FF0000]" />
                  </div>
                  <Input 
                    placeholder="유튜브 주소 붙여넣기"
                    value={videoUrl || ""}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    className="flex-1 bg-white border-none h-10 text-xs font-bold rounded-lg px-4 shadow-inner"
                  />
                  <Button type="button" variant="ghost" size="icon" onClick={() => { setVideoUrl(undefined); setShowVideoInput(false); }} className="h-10 w-10 text-accent/20 hover:text-red-500 hover:bg-red-50 rounded-full">
                    <X className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            )}

            {imageUrl && (
              <div className="relative w-fit max-w-full rounded-2xl overflow-hidden border-2 border-white shadow-xl group animate-in zoom-in-95 duration-500">
                <img src={imageUrl} alt="preview" className="max-h-[250px] md:max-h-[350px] w-auto object-cover" />
                <button 
                  type="button" 
                  className="absolute top-3 right-3 bg-black/60 backdrop-blur-md text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-all hover:scale-110"
                  onClick={() => setImageUrl(undefined)}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          <div className="bg-[#FBFBFC] px-6 md:px-8 py-4 md:py-6 flex items-center justify-between border-t border-black/[0.03]">
            <div className="flex items-center gap-3">
              <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onloadend = () => setImageUrl(reader.result as string);
                  reader.readAsDataURL(file);
                }
              }} />
              <Button type="button" variant="ghost" size="sm" className="h-10 text-accent/50 gap-2 hover:text-[#163300] hover:bg-primary/15 font-black px-4 rounded-xl transition-all" onClick={() => fileInputRef.current?.click()}>
                <ImageIcon className="w-4.5 h-4.5" />
                <span className="text-[13px] hidden sm:inline">사진 추가</span>
              </Button>
              <Button type="button" variant="ghost" size="sm" className="h-10 text-accent/50 gap-2 hover:text-[#163300] hover:bg-primary/15 font-black px-4 rounded-xl transition-all" onClick={() => setShowVideoInput(!showVideoInput)}>
                <Video className="w-4.5 h-4.5" />
                <span className="text-[13px] hidden sm:inline">동영상</span>
              </Button>
            </div>
            
            <Button 
              type="submit" 
              disabled={isSubmitting || !text.trim()} 
              className="naver-button h-11 md:h-12 px-8 md:px-12 text-sm md:text-base gap-3 shadow-xl hover:scale-[1.03] transition-all"
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
