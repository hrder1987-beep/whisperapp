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
      "mb-10 overflow-hidden bg-white border-none transition-all duration-500",
      type === "question" ? "shadow-[0_30px_70px_-10px_rgba(0,43,91,0.25)] ring-1 ring-primary/40 scale-[1.01]" : "shadow-xl"
    )}>
      {type === "question" && <div className="h-2 w-full gold-gradient opacity-90"></div>}
      
      <CardContent className="p-0">
        <form onSubmit={handleSubmit} onClick={() => !user && handleInteraction()} className={cn(type === "question" && "bg-[#FBFBFC]")}>
          <div className="p-6 md:p-10 space-y-6">
            {type === "question" && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <div className="flex-1 w-full">
                    <Input
                      placeholder="이곳에 주제나 고민의 제목을 입력하세요"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      readOnly={!user}
                      className="border-none shadow-none focus-visible:ring-0 text-base md:text-xl font-black h-auto placeholder:text-accent/50 text-accent bg-transparent outline-none px-0 tracking-tight"
                    />
                  </div>
                  <div className="w-full sm:w-44 shrink-0">
                    <Select value={selectedCategory || ""} onValueChange={(val) => user ? setSelectedCategory(val) : handleInteraction()}>
                      <SelectTrigger className={cn(
                        "h-11 border-none rounded-xl font-black text-[11px] px-4 transition-all shadow-md",
                        selectedCategory ? "bg-primary text-accent" : "bg-accent/10 text-accent/60"
                      )}>
                        <div className="flex items-center gap-2">
                          <Sparkles className={cn("w-3.5 h-3.5", selectedCategory ? "text-accent" : "text-accent/30")} />
                          <SelectValue placeholder="카테고리 필수 선택" />
                        </div>
                      </SelectTrigger>
                      <SelectContent className="bg-white border-black/5 rounded-2xl shadow-4xl p-2 animate-in fade-in zoom-in-95 duration-200">
                        {HR_CATEGORIES.map((cat) => (
                          <SelectItem key={cat} value={cat} className="text-xs font-bold py-3 focus:bg-primary focus:text-accent transition-all cursor-pointer rounded-xl px-4">
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
                className="min-h-[100px] md:min-h-[120px] border-none shadow-none focus-visible:ring-0 py-2 text-sm md:text-base leading-relaxed resize-none text-[#333] placeholder:text-accent/50 bg-transparent outline-none font-medium px-0"
              />
            </div>

            {showVideoInput && (
              <div className="bg-primary/10 p-4 rounded-2xl border border-primary/20 animate-in slide-in-from-top-2 duration-300">
                <div className="flex items-center gap-4">
                  <div className="bg-white p-2 rounded-lg shadow-sm"><Youtube className="w-5 h-5 text-[#FF0000]" /></div>
                  <Input 
                    placeholder="공유하고 싶은 유튜브 영상 주소를 입력하세요"
                    value={videoUrl || ""}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    className="flex-1 bg-white border-none h-10 text-xs font-bold rounded-xl px-4 shadow-inner"
                  />
                  <Button type="button" variant="ghost" size="icon" onClick={() => { setVideoUrl(undefined); setShowVideoInput(false); }} className="h-9 w-9 text-accent/20 hover:text-red-500 rounded-full transition-colors">
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}

            {imageUrl && (
              <div className="relative w-fit max-w-full rounded-2xl overflow-hidden border-4 border-white shadow-2xl group animate-in zoom-in-95 duration-300">
                <img src={imageUrl} alt="preview" className="max-h-[250px] w-auto object-cover" />
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
                  <button 
                    type="button" 
                    className="bg-red-500 text-white p-3 rounded-full shadow-2xl hover:scale-110 transition-transform"
                    onClick={() => setImageUrl(undefined)}
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="bg-[#FBFBFC] px-6 md:px-10 py-4 md:py-5 flex items-center justify-between border-t border-accent/5">
            <div className="flex items-center gap-1 md:gap-2">
              <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onloadend = () => setImageUrl(reader.result as string);
                  reader.readAsDataURL(file);
                }
              }} />
              <Button type="button" variant="ghost" className="h-10 text-accent/60 gap-2 hover:text-accent hover:bg-primary/30 font-black px-3 rounded-xl transition-all" onClick={() => user ? fileInputRef.current?.click() : handleInteraction()}>
                <ImageIcon className="w-4 h-4" />
                <span className="text-[12px] hidden sm:inline">사진</span>
              </Button>
              <Button type="button" variant="ghost" className="h-10 text-accent/60 gap-2 hover:text-accent hover:bg-primary/30 font-black px-3 rounded-xl transition-all" onClick={() => user ? setShowVideoInput(!showVideoInput) : handleInteraction()}>
                <Video className="w-4 h-4" />
                <span className="text-[12px] hidden sm:inline">영상</span>
              </Button>
            </div>
            
            <Button 
              type="submit" 
              disabled={isSubmitting || !text.trim()} 
              className="naver-button h-11 md:h-12 px-6 md:px-10 text-sm md:text-base gap-3 shadow-2xl hover:scale-[1.03] active:scale-95 text-white"
            >
              <span className="font-black text-white">{isSubmitting ? "전송 중..." : type === "question" ? "지식 속삭임 등록" : "지혜 더하기"}</span>
              <Send className="w-4 h-4 md:w-5 md:h-5 text-white" />
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
