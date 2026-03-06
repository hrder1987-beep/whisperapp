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
    <Card className="naver-card mb-10 overflow-hidden bg-white shadow-2xl border-none">
      <CardContent className="p-0">
        <form onSubmit={handleSubmit}>
          <div className="p-8 md:p-12 space-y-8">
            {type === "question" && (
              <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-center gap-6">
                  <div className="flex-1 relative">
                    <Input
                      placeholder="주제나 고민의 제목을 입력하세요"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="border-none shadow-none focus-visible:ring-0 text-xl md:text-3xl font-black p-0 h-auto placeholder:text-[#163300]/10 text-[#163300] bg-transparent outline-none !px-6"
                    />
                  </div>
                  <div className="w-full md:w-64 shrink-0 px-6">
                    <Select value={selectedCategory || ""} onValueChange={setSelectedCategory}>
                      <SelectTrigger className="h-14 bg-primary/15 border-none rounded-2xl font-black text-sm text-[#163300] focus:ring-4 focus:ring-primary/5 px-6 shadow-inner">
                        <SelectValue placeholder="카테고리 선택" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-black/5 rounded-3xl shadow-4xl p-2">
                        {HR_CATEGORIES.map((cat) => (
                          <SelectItem key={cat} value={cat} className="text-sm font-bold py-4 focus:bg-primary focus:text-[#163300] transition-all cursor-pointer rounded-2xl px-6">
                            {cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="h-px bg-black/[0.03] mx-6"></div>
              </div>
            )}
            
            <div className="px-6 relative">
              <Textarea
                ref={textareaRef}
                placeholder={placeholder || (type === "question" ? "전문가님의 인사이트를 자유롭게 펼쳐주세요." : "도움이 되는 따뜻한 지혜를 보태주세요.")}
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="min-h-[160px] md:min-h-[220px] border-none shadow-none focus-visible:ring-0 py-2 text-[17px] md:text-[20px] leading-relaxed resize-none text-[#404040] placeholder:text-[#163300]/10 bg-transparent outline-none font-medium !px-0"
              />
            </div>

            {showVideoInput && (
              <div className="mx-6 bg-primary/10 p-6 rounded-3xl border border-primary/10 animate-in fade-in slide-in-from-top-4 duration-500">
                <div className="flex items-center gap-5">
                  <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center shadow-sm">
                    <Youtube className="w-6 h-6 text-[#FF0000]" />
                  </div>
                  <Input 
                    placeholder="유튜브 영상 주소를 복사해서 붙여넣으세요"
                    value={videoUrl || ""}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    className="flex-1 bg-white border-none h-12 text-sm font-bold rounded-xl px-6 shadow-inner !px-6"
                  />
                  <Button type="button" variant="ghost" size="icon" onClick={() => { setVideoUrl(undefined); setShowVideoInput(false); }} className="h-12 w-12 text-accent/20 hover:text-red-500 hover:bg-red-50 rounded-full">
                    <X className="w-6 h-6" />
                  </Button>
                </div>
              </div>
            )}

            {imageUrl && (
              <div className="mx-6 relative w-fit max-w-full rounded-[2rem] overflow-hidden border-4 border-white shadow-2xl group animate-in zoom-in-95 duration-500">
                <img src={imageUrl} alt="preview" className="max-h-[300px] md:max-h-[450px] w-auto object-cover" />
                <button 
                  type="button" 
                  className="absolute top-4 right-4 bg-black/60 backdrop-blur-md text-white p-2.5 rounded-full opacity-0 group-hover:opacity-100 transition-all hover:scale-110"
                  onClick={() => setImageUrl(undefined)}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>

          <div className="bg-[#FBFBFC] px-8 md:px-12 py-6 md:py-10 flex items-center justify-between border-t border-black/[0.03]">
            <div className="flex items-center gap-4">
              <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onloadend = () => setImageUrl(reader.result as string);
                  reader.readAsDataURL(file);
                }
              }} />
              <Button type="button" variant="ghost" size="sm" className="h-12 text-accent/50 gap-2.5 hover:text-[#163300] hover:bg-primary/15 font-black px-6 rounded-2xl transition-all" onClick={() => fileInputRef.current?.click()}>
                <ImageIcon className="w-5.5 h-5.5" />
                <span className="text-[15px] hidden sm:inline">사진 추가</span>
              </Button>
              <Button type="button" variant="ghost" size="sm" className="h-12 text-accent/50 gap-2.5 hover:text-[#163300] hover:bg-primary/15 font-black px-6 rounded-2xl transition-all" onClick={() => setShowVideoInput(!showVideoInput)}>
                <Video className="w-5.5 h-5.5" />
                <span className="text-[15px] hidden sm:inline">동영상</span>
              </Button>
            </div>
            
            <Button 
              type="submit" 
              disabled={isSubmitting || !text.trim()} 
              className="naver-button h-14 md:h-18 px-12 md:px-20 text-lg md:text-xl gap-4 shadow-2xl hover:scale-[1.03] transition-all"
            >
              {isSubmitting ? "전송 중..." : type === "question" ? "속삭임 등록" : "지혜 더하기"}
              <Send className="w-5 h-5 md:w-6 md:h-6" />
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}