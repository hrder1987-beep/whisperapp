"use client"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { ImageIcon, X, Send, Video, Youtube, Sparkles, ChevronDown } from "lucide-react"
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
  type: "question" | "answer",
  isInline?: boolean
}

const HR_CATEGORIES = [
  "인사전략/HRM", "HRD/교육", "조직문화/EVP", "채용/헤드헌팅", "복지/유연근무", "강의/컨설팅", "교육문의", "연회장문의", "현업 고민", "기타 정보"
]

export function SubmissionForm({ onSubmit, type, placeholder, isInline }: SubmissionFormProps) {
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
      const newHeight = Math.min(Math.max(120, textareaRef.current.scrollHeight), 400);
      textareaRef.current.style.height = `${newHeight}px`
    }
  }, [text])

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

    if (!selectedCategory) {
      toast({ title: "카테고리 선택", description: "질문의 카테고리를 선택해주세요.", variant: "destructive" })
      return
    }
    if (!title.trim() || title.trim().length < 10) {
      toast({ title: "제목 입력 필요", description: "제목을 10자 이상으로 구체적으로 작성해주세요.", variant: "destructive" })
      return
    }
    if (!text.trim()) {
        toast({ title: "내용 입력 필요", description: "내용을 입력해주세요.", variant: "destructive" })
        return
    }
    if (containsProfanity(title) || containsProfanity(text)) {
      toast({ title: "등록 불가", description: "부적절한 표현이 포함되어 있습니다.", variant: "destructive" })
      return
    }

    setIsSubmitting(true)
    onSubmit(nickname, title, text, imageUrl, videoUrl, selectedCategory || undefined, jobRole)
    // Reset logic is now handled in HomeContent after submission
    toast({ title: "✅ 지식 공유 완료!" })
  }
  
  // Refactored and redesigned Question Form
  return (
    <form onSubmit={handleSubmit} onClick={(e) => !user && handleInteraction(e)} className="flex flex-col h-full">
      <div className="flex-1 p-6 space-y-6 overflow-y-auto">
        
        {/* 1. Category Selection */}
        <div className="space-y-2">
            <label className="text-sm font-bold text-gray-500">1. 카테고리 선택</label>
            <Select value={selectedCategory || ""} onValueChange={(val) => user ? setSelectedCategory(val) : handleInteraction()}>
                <SelectTrigger className={cn(
                    "w-full h-14 border-2 border-gray-200 bg-gray-50 rounded-xl font-bold text-base px-4 shadow-inner",
                    selectedCategory ? "text-primary" : "text-gray-500"
                )}>
                    <div className="flex items-center gap-3">
                        <Sparkles className={cn("w-5 h-5 shrink-0", selectedCategory ? "text-primary/80" : "text-gray-400")} />
                        <SelectValue placeholder="어떤 분야의 지식인가요?" />
                    </div>
                </SelectTrigger>
                <SelectContent className="bg-white border-gray-100 rounded-xl shadow-lg p-2 w-[var(--radix-select-trigger-width)]">
                    {HR_CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat} className="text-sm font-semibold py-3 focus:bg-primary/10 focus:text-primary cursor-pointer rounded-lg px-4">
                        {cat}
                    </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>

        {/* 2. Title Input */}
        <div className="space-y-2">
            <label htmlFor="title-input" className="text-sm font-bold text-gray-500">2. 제목</label>
            <Input
                id="title-input"
                placeholder="제목을 입력하세요."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                readOnly={!user}
                className="border-2 border-gray-200 bg-gray-50 shadow-inner rounded-xl h-14 text-base font-bold placeholder:font-semibold text-gray-800 flex-1 px-4"
            />
        </div>

        {/* 3. Content Textarea */}
        <div className="space-y-2">
             <label htmlFor="content-input" className="text-sm font-bold text-gray-500">3. 내용</label>
            <Textarea
                id="content-input"
                ref={textareaRef}
                placeholder={placeholder || "내용을 입력하세요."}
                value={text}
                onChange={(e) => setText(e.target.value)}
                readOnly={!user}
                className="min-h-[150px] border-2 border-gray-200 bg-gray-50 shadow-inner rounded-xl text-base leading-relaxed resize-none p-4"
            />
        </div>

        {/* Attachments Preview */}
        <div className="space-y-3 pl-2">
            {showVideoInput && (
              <div className="bg-gray-100 p-2 rounded-lg border border-gray-200 animate-in slide-in-from-top-1 duration-300">
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
              <div className="relative w-fit max-w-xs rounded-lg overflow-hidden border border-gray-200 shadow-md group animate-in zoom-in-95 duration-300">
                <img src={imageUrl} alt="preview" className="max-h-[120px] w-auto object-cover" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
                  <button type="button" className="bg-red-500 text-white p-2 rounded-full shadow-lg hover:scale-105 transition-transform" onClick={() => setImageUrl(undefined)}>
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
        </div>
      </div>

      {/* Footer Actions */}
      <div className="bg-gray-50/80 px-4 py-3 flex items-center justify-between border-t border-gray-200 rounded-b-2xl mt-auto">
        <div className="flex items-center gap-1">
          <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              const reader = new FileReader();
              reader.onloadend = () => setImageUrl(reader.result as string);
              reader.readAsDataURL(file);
            }
          }} />
          <Button type="button" variant="ghost" className="h-11 text-gray-500 gap-2 hover:text-primary hover:bg-primary/10 font-bold px-4 rounded-lg" onClick={() => user ? fileInputRef.current?.click() : handleInteraction()}>
            <ImageIcon className="w-5 h-5" />
            <span className="text-sm font-semibold hidden sm:inline">사진</span>
          </Button>
          <Button type="button" variant="ghost" className="h-11 text-gray-500 gap-2 hover:text-primary hover:bg-primary/10 font-bold px-4 rounded-lg" onClick={() => user ? setShowVideoInput(!showVideoInput) : handleInteraction()}>
            <Video className="w-5 h-5" />
            <span className="text-sm font-semibold hidden sm:inline">영상</span>
          </Button>
        </div>
        
        <Button 
          type="submit" 
          disabled={isSubmitting || !text.trim() || !title.trim() || !selectedCategory}
          className="bg-primary text-accent h-12 px-10 text-base shadow-lg font-black rounded-lg transition-all hover:scale-105 active:scale-100 disabled:scale-100 disabled:bg-gray-300"
        >
          {isSubmitting ? "공유 중..." : "지식 공유하기"}
        </Button>
      </div>
    </form>
  )
}
