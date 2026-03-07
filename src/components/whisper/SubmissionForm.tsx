
"use client"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { ImageIcon, X, Send, Video, Youtube } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { containsProfanity } from "@/lib/utils"
import { useUser, useDoc, useMemoFirebase, useFirestore } from "@/firebase"
import { doc } from "firebase/firestore"
import { useRouter } from "next/navigation"
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
  const router = useRouter()
  
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
      textareaRef.current.style.height = `${Math.max(80, textareaRef.current.scrollHeight)}px`
    }
  }, [text])

  const handleInteraction = (e?: React.MouseEvent) => {
    if (!user) {
      e?.preventDefault();
      e?.stopPropagation();
      toast({ title: "로그인 필요", description: "지식을 나누려면 로그인이 필요합니다.", variant: "destructive" })
      router.push("/auth?mode=login")
      return false
    }
    return true
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!handleInteraction()) return

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
    <Card className="naver-card mb-6 overflow-hidden bg-white shadow-xl border-none">
      <CardContent className="p-0">
        <form onSubmit={handleSubmit} onClick={() => !user && handleInteraction()}>
          <div className="p-5 md:p-6 space-y-4">
            {type === "question" && (
              <div className="space-y-3">
                <div className="flex flex-col md:flex-row md:items-center gap-3">
                  <div className="flex-1 relative">
                    <Input
                      placeholder="주제나 고민의 제목을 입력하세요"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      readOnly={!user}
                      className="border-none shadow-none focus-visible:ring-0 text-base md:text-lg font-black h-auto placeholder:text-[#163300]/10 text-[#163300] bg-transparent outline-none px-0 pl-1"
                    />
                  </div>
                  <div className="w-full md:w-40 shrink-0">
                    <Select value={selectedCategory || ""} onValueChange={(val) => user ? setSelectedCategory(val) : handleInteraction()}>
                      <SelectTrigger className="h-9 bg-primary/15 border-none rounded-lg font-black text-[11px] text-[#163300] px-3 shadow-inner">
                        <SelectValue placeholder="카테고리" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-black/5 rounded-xl shadow-4xl p-1">
                        {HR_CATEGORIES.map((cat) => (
                          <SelectItem key={cat} value={cat} className="text-[11px] font-bold py-2 focus:bg-primary focus:text-[#163300] transition-all cursor-pointer rounded-lg px-3">
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
                placeholder={placeholder || (type === "question" ? "전문가님의 인사이트를 자유롭게 펼쳐주세요." : "도움이 되는 지혜를 보태주세요.")}
                value={text}
                onChange={(e) => setText(e.target.value)}
                readOnly={!user}
                className="min-h-[80px] md:min-h-[100px] border-none shadow-none focus-visible:ring-0 py-1 text-sm md:text-base leading-relaxed resize-none text-[#404040] placeholder:text-[#163300]/10 bg-transparent outline-none font-medium px-0 pl-1"
              />
            </div>

            {showVideoInput && (
              <div className="bg-primary/10 p-3 rounded-xl border border-primary/10">
                <div className="flex items-center gap-3">
                  <Youtube className="w-4 h-4 text-[#FF0000]" />
                  <Input 
                    placeholder="유튜브 주소"
                    value={videoUrl || ""}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    className="flex-1 bg-white border-none h-8 text-[11px] font-bold rounded-lg px-3 shadow-inner"
                  />
                  <Button type="button" variant="ghost" size="icon" onClick={() => { setVideoUrl(undefined); setShowVideoInput(false); }} className="h-8 w-8 text-accent/20 hover:text-red-50 rounded-full">
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}

            {imageUrl && (
              <div className="relative w-fit max-w-full rounded-xl overflow-hidden border-2 border-white shadow-lg group">
                <img src={imageUrl} alt="preview" className="max-h-[200px] w-auto object-cover" />
                <button 
                  type="button" 
                  className="absolute top-2 right-2 bg-black/60 backdrop-blur-md text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-all"
                  onClick={() => setImageUrl(undefined)}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          <div className="bg-[#FBFBFC] px-5 md:px-6 py-3 md:py-4 flex items-center justify-between border-t border-black/[0.03]">
            <div className="flex items-center gap-2">
              <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onloadend = () => setImageUrl(reader.result as string);
                  reader.readAsDataURL(file);
                }
              }} />
              <Button type="button" variant="ghost" size="sm" className="h-9 text-accent/40 gap-1.5 hover:text-[#163300] hover:bg-primary/15 font-black px-3 rounded-lg" onClick={() => user ? fileInputRef.current?.click() : handleInteraction()}>
                <ImageIcon className="w-4 h-4" />
                <span className="text-[11px] hidden sm:inline">사진</span>
              </Button>
              <Button type="button" variant="ghost" size="sm" className="h-9 text-accent/40 gap-1.5 hover:text-[#163300] hover:bg-primary/15 font-black px-3 rounded-lg" onClick={() => user ? setShowVideoInput(!showVideoInput) : handleInteraction()}>
                <Video className="w-4 h-4" />
                <span className="text-[11px] hidden sm:inline">영상</span>
              </Button>
            </div>
            
            <Button 
              type="submit" 
              disabled={isSubmitting || !text.trim()} 
              className="naver-button h-10 md:h-11 px-6 md:px-8 text-xs md:text-sm gap-2 shadow-lg"
            >
              {isSubmitting ? "전송 중..." : type === "question" ? "속삭임 등록" : "지혜 더하기"}
              <Send className="w-3.5 h-3.5 md:w-4 md:h-4" />
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
