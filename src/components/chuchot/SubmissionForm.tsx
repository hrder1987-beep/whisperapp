
"use client"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { ImageIcon, X, Send, Video, Link as LinkIcon } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import Image from "next/image"
import { Separator } from "@/components/ui/separator"
import { AvatarIcon } from "./AvatarIcon"
import { containsProfanity } from "@/lib/utils"
import { cn } from "@/lib/utils"
import { useUser, useDoc, useMemoFirebase } from "@/firebase"
import { doc } from "firebase/firestore"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

interface SubmissionFormProps {
  placeholder: string
  onSubmit: (nickname: string, title: string, text: string, imageUrl?: string, videoUrl?: string, category?: string) => void
  type: "question" | "answer"
}

const HR_CATEGORIES = [
  "L&D/교육설계", "채용/헤드헌팅", "조직문화/EVP", "인사전략/HRM", "복지/유연근무", "강의/컨설팅", "현업 고민", "기타 정보"
]

export function SubmissionForm({ onSubmit, type }: SubmissionFormProps) {
  const { user } = useUser()
  const userDocRef = useMemoFirebase(() => user ? doc(user.firestore, "users", user.uid) : null, [user])
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

  // 자동 높이 조절 로직
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
    <Card className="bg-white border border-primary/10 mb-8 overflow-hidden shadow-xl rounded-[3rem]">
      <div className="h-2 w-full gold-gradient"></div>
      <CardContent className="p-8 md:p-12">
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="flex items-start gap-6">
            <div className="flex-shrink-0">
              <AvatarIcon seed={nickname} className="w-14 h-14 shadow-lg border-2 border-white" />
            </div>
            <div className="flex-1 space-y-6 overflow-hidden">
              <div className="flex items-center gap-2">
                <span className="text-[16px] font-black text-primary">@{nickname}</span>
                <span className="text-[10px] bg-primary/5 text-primary/40 px-3 py-1 rounded-full font-black uppercase tracking-widest">HR SPECIALIST</span>
              </div>

              <div className="space-y-6">
                {type === "question" && (
                  <div className="space-y-5">
                    <Input
                      placeholder="공유하고 싶은 HR 주제 제목을 입력하세요."
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="bg-transparent border-none p-0 h-auto focus-visible:ring-0 text-2xl md:text-3xl font-black text-primary placeholder:text-primary/10 tracking-tight"
                    />
                    <div className="flex flex-wrap gap-2.5">
                      {HR_CATEGORIES.map((cat) => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setSelectedCategory(cat)}
                          className={cn(
                            "px-4 py-2 rounded-full text-[13px] font-black transition-all border",
                            selectedCategory === cat 
                              ? "bg-primary text-accent border-primary shadow-md scale-105" 
                              : "bg-primary/5 text-primary/40 border-transparent hover:bg-primary/10"
                          )}
                        >
                          #{cat}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                <Textarea
                  ref={textareaRef}
                  placeholder={type === "question" ? "채용, 교육, 조직문화 등 현업의 고민과 정보를 자유롭게 속삭여보세요." : "동료 HR 전문가에게 따뜻한 조언이나 노하우를 공유해주세요."}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  className="min-h-[140px] bg-transparent border-none p-0 focus-visible:ring-0 resize-none text-lg md:text-xl leading-relaxed text-primary/80 font-medium placeholder:text-primary/10 overflow-hidden"
                />
              </div>
            </div>
          </div>

          {(imageUrl || videoUrl) && (
            <div className="relative w-full rounded-[2.5rem] overflow-hidden border border-primary/10 mx-auto shadow-2xl bg-primary/5 animate-in fade-in zoom-in duration-500">
              {imageUrl && (
                <div className="p-2">
                  <Image src={imageUrl} alt="미리보기" width={1200} height={675} className="w-full h-auto rounded-[2rem] object-contain max-h-[600px]" />
                </div>
              )}

              {videoUrl && (
                <div className="p-2 bg-black">
                  {isYoutube ? (
                    <div className="aspect-video w-full rounded-[2rem] overflow-hidden">
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
                    <video src={videoUrl} controls className="w-full h-auto rounded-[2rem] max-h-[600px]" />
                  )}
                </div>
              )}
              <button 
                type="button" 
                className="absolute top-6 right-6 bg-black/60 backdrop-blur-md text-white p-3 rounded-full hover:bg-red-500 transition-all shadow-2xl z-20 group"
                onClick={() => { setImageUrl(undefined); setVideoUrl(undefined); }}
              >
                <X className="h-6 w-6 group-hover:rotate-90 transition-transform" />
              </button>
            </div>
          )}

          <Separator className="bg-primary/5" />
          
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0 scrollbar-hide">
              <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleImageChange} />
              <input type="file" accept="video/*" className="hidden" ref={videoInputRef} onChange={handleVideoChange} />
              
              <Button type="button" variant="ghost" size="sm" className="text-primary/40 rounded-2xl px-5 h-12 hover:bg-primary/5 shrink-0" onClick={() => fileInputRef.current?.click()}>
                <ImageIcon className="w-5 h-5 mr-2 text-emerald-500" />
                <span className="font-black text-[14px]">이미지</span>
              </Button>
              
              <Button type="button" variant="ghost" size="sm" className="text-primary/40 rounded-2xl px-5 h-12 hover:bg-primary/5 shrink-0" onClick={() => videoInputRef.current?.click()}>
                <Video className="w-5 h-5 mr-2 text-blue-500" />
                <span className="font-black text-[14px]">영상파일</span>
              </Button>

              <Popover>
                <PopoverTrigger asChild>
                  <Button type="button" variant="ghost" size="sm" className="text-primary/40 rounded-2xl px-5 h-12 hover:bg-primary/5 shrink-0">
                    <LinkIcon className="w-5 h-5 mr-2 text-accent" />
                    <span className="font-black text-[14px]">외부링크</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 bg-white p-6 rounded-[2.5rem] shadow-2xl border-primary/10">
                  <div className="space-y-4">
                    <h4 className="font-black text-primary text-sm flex items-center gap-2">
                      <LinkIcon className="w-4 h-4 text-accent" />
                      유튜브/영상 URL 입력
                    </h4>
                    <div className="flex flex-col gap-3">
                      <Input 
                        placeholder="https://youtube.com/..." 
                        value={videoUrlInput}
                        onChange={(e) => setVideoUrlInput(e.target.value)}
                        className="h-12 bg-primary/5 border-none rounded-xl text-xs font-bold"
                      />
                      <Button onClick={handleVideoUrlSubmit} className="bg-primary text-accent font-black h-12 rounded-xl shadow-lg">연결하기</Button>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
            
            <Button 
              type="submit" 
              disabled={isSubmitting || !text.trim()} 
              className="w-full sm:w-auto bg-primary text-accent font-black h-16 px-12 rounded-2xl shadow-2xl transition-all hover:scale-105 active:scale-95 disabled:opacity-30 flex items-center justify-center text-lg"
            >
              {isSubmitting ? "전송 중..." : "지식 속삭이기"}
              <Send className="w-5 h-5 ml-3" />
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
