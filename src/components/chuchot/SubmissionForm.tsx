
"use client"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { ImageIcon, X, Send, Video, Link as LinkIcon, Info, ChevronDown } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import Image from "next/image"
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
  const videoInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const { toast } = useToast()

  const nickname = profile?.username || "익명전문가"

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }, [text])

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast({ title: "파일 크기 초과", description: "10MB 이하만 가능합니다.", variant: "destructive" })
        return
      }
      const reader = new FileReader()
      reader.onloadend = () => {
        setImageUrl(reader.result as string)
        setVideoUrl(undefined)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 50 * 1024 * 1024) {
        toast({ title: "파일 크기 초과", description: "영상은 50MB 이하만 가능합니다.", variant: "destructive" })
        return
      }
      const reader = new FileReader()
      reader.onloadend = () => {
        setVideoUrl(reader.result as string)
        setImageUrl(undefined)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleVideoUrlSubmit = () => {
    if (videoUrlInput.trim()) {
      setVideoUrl(videoUrlInput.trim())
      setImageUrl(undefined)
      setVideoUrlInput("")
      toast({ title: "URL 등록 완료", description: "영상 링크가 성공적으로 연결되었습니다." })
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) {
      toast({ title: "로그인 필요", description: "Whisper에 참여하려면 로그인이 필요합니다.", variant: "destructive" })
      return
    }
    if (type === "question" && (!title.trim() || !selectedCategory)) {
      toast({ title: "입력 오류", description: "제목과 카테고리를 확인해주세요.", variant: "destructive" })
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
      toast({ title: "게시 완료", description: "HR 지성이 한 층 더 쌓였습니다." })
    }, 400)
  }

  const isYoutube = videoUrl?.includes("youtube.com") || videoUrl?.includes("youtu.be")

  return (
    <Card className="bg-white border border-primary/10 mb-8 overflow-hidden shadow-lg rounded-[2.5rem]">
      <div className="h-1.5 w-full gold-gradient"></div>
      <CardContent className="p-6 md:p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 mt-1">
              <AvatarIcon seed={nickname} className="w-11 h-11 shadow-md border border-white" />
            </div>
            <div className="flex-1 space-y-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-black text-primary">@{nickname}</span>
                <span className="text-[9px] bg-primary/5 text-primary/40 px-2 py-0.5 rounded-full font-black uppercase tracking-widest">HR PRO</span>
              </div>

              <div className="space-y-5">
                {type === "question" && (
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label className="text-[11px] font-black text-primary/40 ml-1 uppercase">제목</Label>
                      <Input
                        placeholder="주제를 간단히 입력해주세요"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="bg-primary/5 border-none h-11 rounded-xl text-[15px] font-black text-primary placeholder:text-primary/20 focus-visible:ring-accent/30"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[11px] font-black text-primary/40 ml-1 uppercase">카테고리</Label>
                      
                      {/* 웹 버전: 기존 버튼 리스트 (768px 이상에서 노출) */}
                      <div className="hidden md:flex flex-wrap gap-1.5 pt-1">
                        {HR_CATEGORIES.map((cat) => (
                          <button
                            key={cat}
                            type="button"
                            onClick={() => setSelectedCategory(cat)}
                            className={cn(
                              "px-3 py-1.5 rounded-full text-[11px] font-black transition-all border",
                              selectedCategory === cat 
                                ? "bg-primary text-accent border-primary shadow-sm scale-105" 
                                : "bg-primary/5 text-primary/40 border-transparent hover:bg-primary/10"
                            )}
                          >
                            #{cat}
                          </button>
                        ))}
                      </div>

                      {/* 모바일 버전: 드롭다운 선택창 (768px 미만에서 노출) */}
                      <div className="md:hidden pt-1">
                        <Select 
                          value={selectedCategory || ""} 
                          onValueChange={(val) => setSelectedCategory(val)}
                        >
                          <SelectTrigger className="w-full bg-primary/5 border-none h-11 rounded-xl text-xs font-black text-primary/60 focus:ring-accent/30">
                            <SelectValue placeholder="카테고리를 선택해 주세요" />
                          </SelectTrigger>
                          <SelectContent className="bg-white border-primary/5 rounded-xl">
                            {HR_CATEGORIES.map((cat) => (
                              <SelectItem key={cat} value={cat} className="text-xs font-bold text-primary/70">
                                #{cat}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="space-y-2">
                  <Label className="text-[11px] font-black text-primary/40 ml-1 uppercase">
                    {type === "question" ? "피드 내용" : "답글 내용"}
                  </Label>
                  <Textarea
                    ref={textareaRef}
                    placeholder={type === "question" ? "HR 인사이트를 속삭여보세요" : "따뜻한 조언을 남겨주세요"}
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    className="min-h-[80px] bg-primary/5 border-none rounded-xl p-4 focus-visible:ring-accent/30 text-[14px] leading-relaxed text-primary/80 font-medium placeholder:text-primary/20"
                  />
                </div>
              </div>
            </div>
          </div>

          {(imageUrl || videoUrl) && (
            <div className="relative w-full rounded-2xl overflow-hidden border border-primary/10 shadow-md bg-primary/5 animate-in fade-in zoom-in duration-300">
              {imageUrl && (
                <div className="p-1">
                  <img src={imageUrl} alt="미리보기" className="w-full h-auto rounded-xl object-contain max-h-[500px]" />
                </div>
              )}

              {videoUrl && (
                <div className="p-1 bg-black">
                  {isYoutube ? (
                    <div className="aspect-video w-full rounded-xl overflow-hidden">
                      <iframe 
                        className="w-full h-full"
                        src={videoUrl.replace("watch?v=", "embed/").replace("youtu.be/", "youtube.com/embed/")} 
                        title="YouTube video player" 
                        frameBorder="0" 
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                        allowFullScreen
                      ></iframe>
                    </div>
                  ) : (
                    <video src={videoUrl} controls className="w-full h-auto rounded-xl max-h-[400px]" />
                  )}
                </div>
              )}
              <button 
                type="button" 
                className="absolute top-4 right-4 bg-black/60 backdrop-blur-md text-white p-2 rounded-full hover:bg-red-500 transition-all shadow-lg z-20 group"
                onClick={() => { setImageUrl(undefined); setVideoUrl(undefined); }}
              >
                <X className="h-4 w-4 group-hover:rotate-90 transition-transform" />
              </button>
            </div>
          )}

          <Separator className="bg-primary/5" />
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleImageChange} />
              <input type="file" accept="video/*" className="hidden" ref={videoInputRef} onChange={handleVideoChange} />
              
              <Button type="button" variant="ghost" size="sm" className="h-9 rounded-xl px-3 text-primary/50 hover:bg-primary/5" onClick={() => fileInputRef.current?.click()}>
                <ImageIcon className="w-4 h-4 mr-1.5 text-emerald-500" />
                <div className="flex flex-col items-start leading-none">
                  <span className="font-black text-[11px]">이미지</span>
                </div>
              </Button>
              
              <Button type="button" variant="ghost" size="sm" className="h-9 rounded-xl px-3 text-primary/50 hover:bg-primary/5" onClick={() => videoInputRef.current?.click()}>
                <Video className="w-4 h-4 mr-1.5 text-blue-500" />
                <span className="font-black text-[11px]">영상</span>
              </Button>

              <Popover>
                <PopoverTrigger asChild>
                  <Button type="button" variant="ghost" size="sm" className="h-9 rounded-xl px-3 text-primary/50 hover:bg-primary/5">
                    <LinkIcon className="w-4 h-4 mr-1.5 text-accent" />
                    <span className="font-black text-[11px]">링크</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64 bg-white p-4 rounded-2xl shadow-xl border-primary/10">
                  <div className="space-y-3">
                    <h4 className="font-black text-primary text-[11px] flex items-center gap-1.5">
                      <LinkIcon className="w-3 h-3 text-accent" />
                      영상 URL 입력
                    </h4>
                    <Input 
                      placeholder="https://youtube.com/..." 
                      value={videoUrlInput}
                      onChange={(e) => setVideoUrlInput(e.target.value)}
                      className="h-9 bg-primary/5 border-none rounded-lg text-[10px] font-bold"
                    />
                    <Button onClick={handleVideoUrlSubmit} size="sm" className="w-full bg-primary text-accent font-black h-9 rounded-lg">연결</Button>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
            
            <Button 
              type="submit" 
              disabled={isSubmitting || !text.trim()} 
              className="bg-primary text-accent font-black h-11 px-8 rounded-xl shadow-md transition-all hover:scale-105 active:scale-95 text-xs gap-2"
            >
              {isSubmitting ? "전송 중" : "속삭이기"}
              <Send className="w-3.5 h-3.5" />
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
