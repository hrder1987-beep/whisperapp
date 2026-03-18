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
import { AvatarIcon } from "./AvatarIcon"

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
      const newHeight = Math.min(Math.max(type === 'answer' ? 44 : 80, textareaRef.current.scrollHeight), 300);
      textareaRef.current.style.height = `${newHeight}px`
    }
  }, [text, type])

  const handleInteraction = (e?: React.MouseEvent | React.FormEvent) => {
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
    if (!handleInteraction(e)) return

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
      toast({ title: "등록 완료", description: `소중한 ${type === 'question' ? '지식' : '지혜'}가 성공적으로 공유되었습니다.` })
    }, 400)
  }
  
  // 답변 폼 UI
  if (type === "answer") {
    return (
      <form onSubmit={handleSubmit} onClick={(e) => !user && handleInteraction(e)} className="flex items-start gap-3 p-1">
        <AvatarIcon src={profile?.profilePictureUrl} seed={nickname} className="w-9 h-9 mt-1 border-2 border-white shadow-sm shrink-0" />
        <div className="flex-1 relative">
          <Textarea
            ref={textareaRef}
            placeholder={placeholder || "도움이 되는 지혜를 남겨주세요."}
            value={text}
            onChange={(e) => setText(e.target.value)}
            readOnly={!user}
            className="w-full min-h-[44px] h-11 border bg-gray-100 border-gray-200 rounded-xl shadow-inner focus-visible:ring-primary/50 text-sm leading-relaxed resize-none px-4 py-2.5 transition-all duration-200"
            rows={1}
          />
           <div className="absolute right-2 bottom-2 flex items-center gap-1">
              <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-lg" onClick={() => user ? fileInputRef.current?.click() : handleInteraction()}>
                <ImageIcon className="w-4 h-4" />
              </Button>
              <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-lg" onClick={() => user ? setShowVideoInput(!showVideoInput) : handleInteraction()}>
                <Video className="w-4 h-4" />
              </Button>
            </div>
        </div>
        <Button 
          type="submit" 
          disabled={isSubmitting || !text.trim()} 
          className="h-11 bg-primary text-accent rounded-lg font-bold shadow-sm px-5 text-sm gap-2"
        >
          <Send className="w-3.5 h-3.5" />
        </Button>
         <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
                const reader = new FileReader();
                reader.onloadend = () => setImageUrl(reader.result as string);
                reader.readAsDataURL(file);
            }
        }} />
      </form>
    )
  }

  // 질문 폼 UI
  return (
    <Card className="bg-white rounded-2xl shadow-lg border-gray-100">
      <CardContent className="p-0">
        <form onSubmit={handleSubmit} onClick={(e) => !user && handleInteraction(e)}>
          <div className="p-4 space-y-3">
            <div className="flex items-start gap-3">
                <AvatarIcon src={profile?.profilePictureUrl} seed={nickname} className="w-10 h-10 mt-1 border-2 border-white shadow-sm shrink-0" />
                <div className="flex-1 space-y-2">
                    <div className="flex flex-col sm:flex-row gap-2">
                        <Input
                        placeholder="무엇이 궁금하세요?"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        readOnly={!user}
                        className="border-gray-200 bg-gray-50 shadow-inner rounded-lg h-11 text-base font-bold placeholder:font-semibold text-gray-800 flex-1"
                        />
                        <div className="w-full sm:w-40 shrink-0">
                            <Select value={selectedCategory || ""} onValueChange={(val) => user ? setSelectedCategory(val) : handleInteraction()}>
                            <SelectTrigger className={cn(
                                "h-11 border-gray-200 rounded-lg font-bold text-xs px-3 shadow-sm w-full",
                                selectedCategory ? "bg-primary text-accent" : "bg-gray-100 text-gray-500"
                            )}>
                                <div className="flex items-center gap-2 truncate">
                                <Sparkles className={cn("w-4 h-4 shrink-0", selectedCategory ? "text-accent/80" : "text-gray-400")} />
                                <SelectValue placeholder="카테고리" className="truncate" />
                                </div>
                            </SelectTrigger>
                            <SelectContent className="bg-white border-gray-100 rounded-xl shadow-lg p-1 animate-in fade-in zoom-in-95 duration-200">
                                {HR_CATEGORIES.map((cat) => (
                                <SelectItem key={cat} value={cat} className="text-xs font-semibold py-2 focus:bg-primary/10 focus:text-accent cursor-pointer rounded-lg px-3">
                                    {cat}
                                </SelectItem>
                                ))}
                            </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <Textarea
                        ref={textareaRef}
                        placeholder={placeholder || "궁금한 점을 더 자세히 알려주세요."}
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        readOnly={!user}
                        className="min-h-[80px] border-gray-200 bg-gray-50 shadow-inner rounded-lg text-sm leading-relaxed resize-none p-3"
                    />
                </div>
            </div>

            {showVideoInput && (
              <div className="bg-gray-100 p-2 rounded-lg border border-gray-200 animate-in slide-in-from-top-1 duration-300 ml-12">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-md shrink-0"><Youtube className="w-4 h-4 text-red-600" /></div>
                  <Input placeholder="유튜브 영상 주소를 여기에 붙여넣으세요." value={videoUrl || ""} onChange={(e) => setVideoUrl(e.target.value)} className="flex-1 bg-white border-gray-200 h-9 text-xs font-semibold rounded-md px-3 shadow-inner" />
                  <Button type="button" variant="ghost" size="icon" onClick={() => { setVideoUrl(undefined); setShowVideoInput(false); }} className="h-7 w-7 text-gray-400 hover:text-red-500 rounded-full shrink-0">
                    <X className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            )}

            {imageUrl && (
              <div className="relative w-fit max-w-full rounded-lg overflow-hidden border border-gray-200 shadow-md group animate-in zoom-in-95 duration-300 ml-12">
                <img src={imageUrl} alt="preview" className="max-h-[150px] w-auto object-cover" />
                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
                  <button type="button" className="bg-red-500 text-white p-2 rounded-full shadow-lg hover:scale-105 transition-transform" onClick={() => setImageUrl(undefined)}>
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="bg-gray-50/70 px-4 py-2 flex items-center justify-between border-t border-gray-100">
            <div className="flex items-center gap-1">
              <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onloadend = () => setImageUrl(reader.result as string);
                  reader.readAsDataURL(file);
                }
              }} />
              <Button type="button" variant="ghost" className="h-9 text-gray-500 gap-1.5 hover:text-primary hover:bg-primary/10 font-bold px-3 rounded-lg" onClick={() => user ? fileInputRef.current?.click() : handleInteraction()}>
                <ImageIcon className="w-4 h-4" />
                <span className="text-xs hidden xs:inline">사진</span>
              </Button>
              <Button type="button" variant="ghost" className="h-9 text-gray-500 gap-1.5 hover:text-primary hover:bg-primary/10 font-bold px-3 rounded-lg" onClick={() => user ? setShowVideoInput(!showVideoInput) : handleInteraction()}>
                <Video className="w-4 h-4" />
                <span className="text-xs hidden xs:inline">영상</span>
              </Button>
            </div>
            
            <Button 
              type="submit" 
              disabled={isSubmitting || !text.trim() || !title.trim() || !selectedCategory}
              className="bg-accent text-primary h-10 px-6 text-sm gap-2 shadow-sm font-bold"
            >
              <span>{isSubmitting ? "등록 중..." : "지식 공유하기"}</span>
              {!isSubmitting && <Send className="w-4 h-4" />}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
