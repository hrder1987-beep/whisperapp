
"use client"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { ImageIcon, X, Send, Video, Link as LinkIcon, Info, ChevronDown } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Separator } from "@/components/ui/separator"
import { AvatarIcon } from "./AvatarIcon"
import { containsProfanity } from "@/lib/utils"
import { cn } from "@/lib/utils"
import { useUser, useDoc, useMemoFirebase, useFirestore } from "@/firebase"
import { doc } from "firebase/firestore"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

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
  const [videoUrl, setVideoUrl] = useState<string | undefined>(undefined)
  const [videoUrlInput, setVideoUrlInput] = useState("")
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
      onSubmit(nickname, title, text, imageUrl, videoUrl, selectedCategory || undefined)
      setTitle(""); setText(""); setImageUrl(undefined); setVideoUrl(undefined); setSelectedCategory(null); setVideoUrlInput("")
      setIsSubmitting(false)
      toast({ title: "게시 완료", description: "소중한 지식이 공유되었습니다." })
    }, 400)
  }

  return (
    <Card className="bg-white border border-black/5 mb-6 overflow-hidden rounded-lg shadow-sm">
      <CardContent className="p-0">
        <form onSubmit={handleSubmit}>
          <div className="p-4 md:p-6 space-y-4">
            {type === "question" && (
              <div className="space-y-3">
                <Input
                  placeholder="제목을 입력하세요"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="border-none shadow-none focus-visible:ring-0 text-[16px] font-black p-0 h-8"
                />
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {HR_CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedCategory(cat)}
                      className={cn(
                        "px-3 py-1 rounded-full text-[11px] font-bold transition-all border whitespace-nowrap",
                        selectedCategory === cat 
                          ? "bg-primary text-white border-primary" 
                          : "bg-black/[0.02] text-muted-foreground border-transparent hover:border-black/10"
                      )}
                    >
                      #{cat}
                    </button>
                  ))}
                </div>
                <Separator className="bg-black/5" />
              </div>
            )}
            
            <Textarea
              ref={textareaRef}
              placeholder={type === "question" ? "나누고 싶은 HR 인사이트를 자유롭게 적어주세요." : "따뜻한 답변으로 도움을 주세요."}
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="min-h-[100px] border-none shadow-none focus-visible:ring-0 p-0 text-[14px] leading-relaxed resize-none"
            />

            {(imageUrl || videoUrl) && (
              <div className="relative w-fit max-w-full rounded-md overflow-hidden border border-black/5 mt-4">
                {imageUrl && <img src={imageUrl} alt="preview" className="h-32 w-auto object-cover" />}
                <button 
                  type="button" 
                  className="absolute top-1 right-1 bg-black/60 text-white p-1 rounded-full hover:bg-red-500"
                  onClick={() => setImageUrl(undefined)}
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}
          </div>

          <div className="bg-[#F8F9FA] px-4 md:px-6 py-3 flex items-center justify-between border-t border-black/5">
            <div className="flex items-center gap-1">
              <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onloadend = () => setImageUrl(reader.result as string);
                  reader.readAsDataURL(file);
                }
              }} />
              <Button type="button" variant="ghost" size="sm" className="h-8 text-muted-foreground gap-1.5 hover:text-primary" onClick={() => fileInputRef.current?.click()}>
                <ImageIcon className="w-4 h-4" />
                <span className="font-bold text-[12px]">사진</span>
              </Button>
            </div>
            
            <Button 
              type="submit" 
              disabled={isSubmitting || !text.trim()} 
              className="naver-button h-9 px-6 text-[13px] gap-2"
            >
              {isSubmitting ? "게시 중" : "속삭이기"}
              <Send className="w-3.5 h-3.5" />
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
