
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
import { useRouter } from "next/navigation"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

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
      toast({ title: "로그인이 필요한 서비스입니다.", description: "전문가들의 지식 나눔에 참여하시려면 로그인해 주세요.", variant: "destructive" })
      router.push("/auth?mode=login")
      return false
    }
    return true
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!handleInteraction()) return

    if (type === "question" && (!title.trim() || !selectedCategory)) {
      toast({ title: "필수 항목 누락", description: "제목과 카테고리를 모두 입력해 주세요.", variant: "destructive" })
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
      toast({ title: "속삭임 등록 완료", description: "전문가님의 소중한 인사이트가 성공적으로 공유되었습니다." })
    }, 400)
  }

  return (
    <Card className={cn(
      "mb-6 md:mb-10 overflow-hidden bg-white border-none transition-all duration-500",
      type === "question" ? "shadow-[0_20px_50px_-10px_rgba(0,43,91,0.15)] ring-1 ring-primary/20" : "shadow-lg"
    )}>
      {type === "question" && <div className="h-1.5 md:h-2 w-full gold-gradient opacity-90"></div>}
      
      <CardContent className="p-0">
        <form onSubmit={handleSubmit} onClick={() => !user && handleInteraction()} className={cn(type === "question" && "bg-[#FBFBFC]")}>
          <div className="p-5 md:p-10 space-y-5 md:space-y-6">
            {type === "question" && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
                  <div className="flex-1 min-w-0">
                    <Input
                      placeholder="주제나 고민의 제목을 입력하세요"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      readOnly={!user}
                      className="border-none shadow-none focus-visible:ring-0 text-base md:text-xl font-black h-auto placeholder:text-[3.5vw] sm:placeholder:text-[18px] placeholder:font-black placeholder:text-accent/50 text-accent bg-transparent outline-none px-0 tracking-tight"
                    />
                  </div>
                  <div className="w-full sm:w-44 shrink-0">
                    <Select value={selectedCategory || ""} onValueChange={(val) => user ? setSelectedCategory(val) : handleInteraction()}>
                      <SelectTrigger className={cn(
                        "h-10 md:h-11 border-none rounded-xl font-black text-[11px] md:text-[12px] px-3 md:px-4 transition-all shadow-sm",
                        selectedCategory ? "bg-primary text-accent" : "bg-accent/10 text-accent/60"
                      )}>
                        <div className="flex items-center gap-2 truncate">
                          <Sparkles className={cn("w-3.5 h-3.5 md:w-4 md:h-4 shrink-0", selectedCategory ? "text-accent" : "text-accent/30")} />
                          <SelectValue placeholder="카테고리 선택" className="truncate" />
                        </div>
                      </SelectTrigger>
                      <SelectContent className="bg-white border-black/5 rounded-2xl shadow-4xl p-1 animate-in fade-in zoom-in-95 duration-200">
                        {HR_CATEGORIES.map((cat) => (
                          <SelectItem key={cat} value={cat} className="text-[11px] md:text-xs font-bold py-2.5 md:py-3 focus:bg-primary focus:text-accent transition-all cursor-pointer rounded-xl px-3 md:px-4">
                            {cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="h-px bg-accent/10"></div>
              </div>
            )}
            
            <div className="relative">
              <Textarea
                ref={textareaRef}
                placeholder={placeholder || (type === "question" ? "전문가님의 깊이 있는 경험과 지식을 자유롭게 들려주세요." : "동료에게 힘이 되는 따뜻한 조언을 남겨주세요.")}
                value={text}
                onChange={(e) => setText(e.target.value)}
                readOnly={!user}
                className="min-h-[80px] md:min-h-[120px] border-none shadow-none focus-visible:ring-0 py-1 text-[14px] md:text-base leading-relaxed resize-none text-[#333] placeholder:text-[3.2vw] sm:placeholder:text-[15px] placeholder:font-bold placeholder:text-accent/50 bg-transparent outline-none font-medium px-0 break-words"
              />
            </div>

            {showVideoInput && (
              <div className="bg-primary/5 p-3 md:p-4 rounded-xl border border-primary/10 animate-in slide-in-from-top-2 duration-300">
                <div className="flex items-center gap-3">
                  <div className="bg-white p-1.5 rounded-lg shadow-sm shrink-0"><Youtube className="w-4 h-4 md:w-5 md:h-5 text-[#FF0000]" /></div>
                  <Input 
                    placeholder="유튜브 주소 입력"
                    value={videoUrl || ""}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    className="flex-1 bg-white border-none h-9 text-[11px] md:text-xs font-bold rounded-lg px-3 shadow-inner"
                  />
                  <Button type="button" variant="ghost" size="icon" onClick={() => { setVideoUrl(undefined); setShowVideoInput(false); }} className="h-8 w-8 text-accent/20 hover:text-red-500 rounded-full transition-colors shrink-0">
                    <X className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            )}

            {imageUrl && (
              <div className="relative w-fit max-w-full rounded-xl overflow-hidden border-2 md:border-4 border-white shadow-xl group animate-in zoom-in-95 duration-300">
                <img src={imageUrl} alt="preview" className="max-h-[200px] md:max-h-[250px] w-auto object-cover" />
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
                  <button 
                    type="button" 
                    className="bg-red-500 text-white p-2.5 rounded-full shadow-2xl hover:scale-110 transition-transform"
                    onClick={() => setImageUrl(undefined)}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="bg-[#FBFBFC] px-5 md:px-10 py-3 md:py-5 flex items-center justify-between border-t border-accent/5">
            <div className="flex items-center gap-1 md:gap-2">
              <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onloadend = () => setImageUrl(reader.result as string);
                  reader.readAsDataURL(file);
                }
              }} />
              <Button type="button" variant="ghost" className="h-9 md:h-10 text-accent/50 gap-1.5 hover:text-accent hover:bg-primary/20 font-black px-2 md:px-3 rounded-lg transition-all" onClick={() => user ? fileInputRef.current?.click() : handleInteraction()}>
                <ImageIcon className="w-3.5 h-3.5 md:w-4 md:h-4" />
                <span className="text-[11px] md:text-[12px] hidden xs:inline">사진</span>
              </Button>
              <Button type="button" variant="ghost" className="h-9 md:h-10 text-accent/50 gap-1.5 hover:text-accent hover:bg-primary/20 font-black px-2 md:px-3 rounded-lg transition-all" onClick={() => user ? setShowVideoInput(!showVideoInput) : handleInteraction()}>
                <Video className="w-3.5 h-3.5 md:w-4 md:h-4" />
                <span className="text-[11px] md:text-[12px] hidden xs:inline">영상</span>
              </Button>
            </div>
            
            <Button 
              type="submit" 
              disabled={isSubmitting || !text.trim()} 
              className="naver-button h-10 md:h-12 px-5 md:px-10 text-[13px] md:text-base gap-2 md:gap-3 shadow-xl hover:scale-[1.02] active:scale-95 text-white"
            >
              <span className="font-black text-white">{isSubmitting ? "전송 중" : type === "question" ? "지식 등록" : "지혜 더하기"}</span>
              <Send className="w-3.5 h-3.5 md:w-5 md:h-5 text-white" />
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
