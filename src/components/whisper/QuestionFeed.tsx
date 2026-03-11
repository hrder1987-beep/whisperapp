
"use client"

import { useState, useEffect } from "react"
import { Question, Answer } from "@/lib/types"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { MessageCircle, ThumbsUp, Bookmark, Trash2, Mail, Share2, MoreHorizontal, Edit3, AlertCircle, Sparkles } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { ko } from "date-fns/locale"
import { Button } from "@/components/ui/button"
import { AvatarIcon } from "@/components/whisper/AvatarIcon"
import { Badge } from "@/components/ui/badge"
import { AnswerFeed } from "@/components/whisper/AnswerFeed"
import { SubmissionForm } from "./SubmissionForm"
import { MessageDialog } from "./MessageDialog"
import { cn } from "@/lib/utils"
import { useUser, useFirestore, updateDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase"
import { doc, increment } from "firebase/firestore"
import { useToast } from "@/hooks/use-toast"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface QuestionFeedProps {
  questions: Question[]
  onSelectQuestion: (id: string) => void
  selectedId: string | null
  answers: Answer[]
  onAddAnswer: (nickname: string, title: string, text: string, imageUrl?: string, videoUrl?: string, category?: string, jobRole?: string) => void
  activeTab: "all" | "popular" | "waiting" | "hrd" | "culture" | "hrm"
  onTabChange: (tab: "all" | "popular" | "waiting" | "hrd" | "culture" | "hrm") => void
  isAdminMode?: boolean
}

const HR_CATEGORIES = [
  "인사전략/HRM", "HRD/교육", "조직문화/EVP", "채용/헤드헌팅", "복지/유연근무", "강의/컨설팅", "교육문의", "연회장문의", "현업 고민", "기타 정보"
]

export function QuestionFeed({ 
  questions, 
  onSelectQuestion, 
  selectedId, 
  answers, 
  onAddAnswer,
  isAdminMode = false
}: QuestionFeedProps) {
  const { user } = useUser()
  const db = useFirestore()
  const { toast } = useToast()
  const [messageTarget, setMessageTarget] = useState<{ id: string, nickname: string } | null>(null)
  
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null)
  const [editTitle, setEditTitle] = useState("")
  const [editText, setEditText] = useState("")
  const [editCategory, setEditCategory] = useState("")
  const [isUpdating, setIsUpdating] = useState(false)
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set())

  const [isMounted, setIsMounted] = useState(false)
  useEffect(() => {
    setIsMounted(true)
    try {
      const savedLikes = localStorage.getItem('whisper_liked_posts')
      if (savedLikes) {
        setLikedPosts(new Set(JSON.parse(savedLikes)))
      }
    } catch (e) {
      console.warn('Failed to load likes from storage')
    }
  }, [])

  const handleShare = async (q: Question) => {
    if (typeof window !== 'undefined') {
      const shareUrl = `${window.location.origin}/questions/${q.id}`;
      await navigator.clipboard.writeText(shareUrl);
      toast({ title: "링크 복사 완료", description: "게시글 주소가 복사되었습니다." });
    }
  }

  const handleDelete = (q: Question) => {
    if (!db) return;
    if (window.confirm("이 게시글을 영구적으로 삭제하시겠습니까?")) {
      if (selectedId === q.id) onSelectQuestion(q.id);
      deleteDocumentNonBlocking(doc(db, "questions", q.id));
      toast({ title: "삭제 완료", description: "게시글이 삭제되었습니다." });
    }
  }

  const handleLike = (e: React.MouseEvent, q: Question) => {
    e.stopPropagation();
    if (!db) return;
    
    if (likedPosts.has(q.id)) {
      toast({ title: "이미 지지함", description: "이미 이 속삭임에 힘을 보태주셨습니다." });
      return;
    }

    updateDocumentNonBlocking(doc(db, "questions", q.id), { likeCount: increment(1) });
    
    const newLikes = new Set(likedPosts);
    newLikes.add(q.id);
    setLikedPosts(newLikes);
    try {
      localStorage.setItem('whisper_liked_posts', JSON.stringify(Array.from(newLikes)));
    } catch (e) {}
    
    toast({ title: "지지 완료!", description: "전문가님의 소중한 따봉이 전달되었습니다." });
  }

  const handleUpdate = () => {
    if (!db || !editingQuestion) return;
    setIsUpdating(true);
    updateDocumentNonBlocking(doc(db, "questions", editingQuestion.id), {
      title: editTitle,
      text: editText,
      category: editCategory
    });
    setTimeout(() => {
      setIsUpdating(false);
      setEditingQuestion(null);
      toast({ title: "수정 완료" });
    }, 500);
  }

  const getYoutubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {questions.length === 0 ? (
        <Card className="naver-card p-10 md:p-16 text-center bg-white border-none shadow-xl">
          <div className="flex flex-col items-center gap-4">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-primary/10 rounded-full flex items-center justify-center">
              <AlertCircle className="w-5 h-5 md:w-6 md:h-6 text-primary" />
            </div>
            <div className="space-y-1">
              <p className="text-accent font-black text-base md:text-lg tracking-tighter">공유된 속삭임이 없습니다.</p>
              <p className="text-accent/30 font-bold text-[10px] md:text-[11px]">전문가님의 소중한 고민과 지식을 먼저 나눠보세요.</p>
            </div>
          </div>
        </Card>
      ) : (
        questions.map((q) => {
          const isExpanded = selectedId === q.id
          const questionAnswers = answers.filter(a => a.questionId === q.id)
          const isMentor = q.userRole === 'mentor'
          const youtubeId = q.videoUrl ? getYoutubeId(q.videoUrl) : null
          const isOwner = user && user.uid === q.userId;
          const isLiked = likedPosts.has(q.id);

          return (
            <Card 
              key={q.id} 
              id={`q-${q.id}`}
              className={cn(
                "naver-card group transition-all duration-500 border-none",
                isExpanded ? "ring-4 ring-primary/10 shadow-2xl translate-y-[-1px] md:translate-y-[-2px]" : "hover:shadow-2xl active:scale-[0.995]"
              )}
              onClick={() => onSelectQuestion(q.id)}
            >
              <CardContent className={cn("p-5 md:p-10", isExpanded && "md:p-12")}>
                <div className="flex justify-between items-start mb-5 md:mb-8">
                  <div className="flex items-center gap-3 md:gap-4 min-w-0 flex-1">
                    <AvatarIcon src={q.userProfilePicture} seed={q.nickname} className="w-9 h-9 md:w-12 md:h-12 border-2 border-white shadow-md shrink-0" />
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-1.5 md:gap-2 flex-wrap">
                        <span className="text-[13px] md:text-base font-black text-accent tracking-tight truncate max-w-[120px] md:max-w-none">@{q.nickname}</span>
                        {q.jobTitle && <span className="text-[8px] md:text-[10px] font-black text-primary italic bg-primary/10 px-1.5 py-0.5 rounded-md truncate max-w-[80px] md:max-w-none">#{q.jobTitle}</span>}
                        {isMentor && <Badge className="bg-accent text-primary shadow-lg border-none px-1.5 h-4.5 text-[7px] md:text-[8px] font-black">WHISPERER</Badge>}
                        {user && !isOwner && (
                          <button onClick={(e) => { e.stopPropagation(); setMessageTarget({ id: q.userId, nickname: q.nickname }); }} className="text-accent/10 hover:text-accent hover:bg-accent/5 transition-all p-1 rounded-full">
                            <Mail className="w-3 h-3 md:w-3.5 md:h-3.5" />
                          </button>
                        )}
                      </div>
                      <span className="text-[9px] md:text-[11px] font-bold text-accent/30 flex items-center gap-1 mt-0.5">
                        {isMounted ? formatDistanceToNow(q.createdAt, { addSuffix: true, locale: ko }) : '...'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0 ml-2">
                    {q.category && (
                      <Badge variant="outline" className="hidden sm:inline-flex text-[8px] md:text-[9px] font-black border-accent/5 text-accent/30 rounded-lg px-2 h-5 md:h-6 bg-accent/2 tracking-tighter">#{q.category}</Badge>
                    )}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <button className="text-accent/10 hover:text-accent/50 transition-all p-1 rounded-full hover:bg-accent/5 outline-none">
                          <MoreHorizontal className="w-4 h-4 md:w-5 md:h-5" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-white border-black/5 rounded-xl shadow-3xl p-1 w-36 md:w-40">
                        {isOwner ? (
                          <>
                            <DropdownMenuItem onSelect={(e) => { e.preventDefault(); setEditingQuestion(q); setEditTitle(q.title); setEditText(q.text); setEditCategory(q.category || ""); }} className="rounded-lg font-black text-[11px] md:text-xs gap-2 py-2 cursor-pointer text-accent">
                              <Edit3 className="w-3 h-3 md:w-3.5 md:h-3.5" /> 수정하기
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={(e) => { e.preventDefault(); setTimeout(() => handleDelete(q), 100); }} className="rounded-lg font-black text-[11px] md:text-xs gap-2 py-2 cursor-pointer text-red-500">
                              <Trash2 className="w-3 h-3 md:w-3.5 md:h-3.5" /> 삭제하기
                            </DropdownMenuItem>
                          </>
                        ) : (
                          <DropdownMenuItem onSelect={(e) => { e.preventDefault(); handleShare(q); }} className="rounded-lg font-black text-[11px] md:text-xs gap-2 py-2 cursor-pointer text-accent">
                            <Share2 className="w-3 h-3 md:w-3.5 md:h-3.5" /> 링크 복사
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                <div className="space-y-3 md:space-y-4">
                  <h3 className="text-[15px] md:text-xl font-black leading-[1.4] text-accent tracking-tight break-words group-hover:text-primary transition-colors">{q.title}</h3>
                  <p className={cn("text-[13px] md:text-[15px] leading-relaxed text-[#404040] font-medium whitespace-pre-wrap break-words", !isExpanded && "line-clamp-3")}>{q.text}</p>
                  {isExpanded && (
                    <div className="space-y-5 md:space-y-6 mt-6 md:mt-8 animate-in slide-in-from-bottom-2 duration-500">
                      {q.imageUrl && <div className="relative w-full rounded-xl overflow-hidden border-2 md:border-4 border-white shadow-xl bg-[#FBFBFC]"><img src={q.imageUrl} alt="attached" className="w-full h-auto block" /></div>}
                      {youtubeId && <div className="relative w-full aspect-video rounded-xl overflow-hidden border-2 md:border-4 border-white shadow-xl bg-black"><iframe width="100%" height="100%" src={`https://www.youtube.com/embed/${youtubeId}`} title="video" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen></iframe></div>}
                    </div>
                  )}
                </div>

                {isExpanded && (
                  <div className="mt-8 md:mt-12 pt-8 md:mt-12 border-t border-black/[0.05]" onClick={(e) => e.stopPropagation()}>
                    <SubmissionForm type="answer" placeholder="도움이 되는 지혜를 남겨주세요." onSubmit={onAddAnswer} />
                    <AnswerFeed answers={questionAnswers} isAdminMode={isAdminMode} />
                  </div>
                )}
              </CardContent>
              
              <CardFooter className="px-5 md:px-10 py-3 md:py-4 border-t border-primary/5 flex items-center justify-between bg-primary/[0.01]">
                <div className="flex gap-5 md:gap-8">
                  <button 
                    onClick={(e) => handleLike(e, q)}
                    className={cn(
                      "flex items-center gap-1.5 text-[10px] md:text-xs font-black transition-all hover:scale-110",
                      isLiked ? "text-primary" : "text-accent/40 hover:text-primary"
                    )}
                  >
                    <ThumbsUp className={cn("w-3.5 h-3.5 md:w-4 md:h-4", isLiked && "fill-primary")} />
                    <span>{q.likeCount?.toLocaleString() || 0}</span>
                  </button>
                  <div className="flex items-center gap-1.5 text-[10px] md:text-xs font-black text-accent/40">
                    <MessageCircle className="w-3.5 h-3.5 md:w-4 md:h-4 text-primary" />
                    <span>답변 {q.answerCount.toLocaleString()}</span>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); handleShare(q); }} className="flex items-center gap-1.5 text-[10px] md:text-xs font-black text-accent/40 hover:text-accent transition-all">
                    <Share2 className="w-3.5 h-3.5 md:w-4 md:h-4" />
                    공유
                  </button>
                </div>
                <Bookmark className="w-4 h-4 md:w-4.5 md:h-4.5 text-accent/5 hover:text-primary cursor-pointer transition-all" />
              </CardFooter>
            </Card>
          )
        })
      )}

      <Dialog open={!!editingQuestion} onOpenChange={(open) => { if(!open) setEditingQuestion(null); }}>
        <DialogContent className="max-w-xl w-[95vw] bg-white border-none rounded-[2rem] p-0 shadow-4xl overflow-hidden">
          <DialogHeader className="bg-primary/5 p-5 md:p-6 border-b border-primary/10">
            <DialogTitle className="text-lg md:text-xl font-black text-accent flex items-center gap-3"><Sparkles className="w-5 h-5 md:w-6 md:h-6 text-primary" /> 게시글 수정</DialogTitle>
          </DialogHeader>
          <div className="p-5 md:p-6 space-y-5">
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <Input value={editTitle} onChange={e => setEditTitle(e.target.value)} placeholder="제목" className="flex-1 h-11 md:h-12 bg-[#F5F6F7] border-none rounded-lg font-black text-base md:text-lg px-4 shadow-inner" />
                <div className="w-full sm:w-40">
                  <Select value={editCategory} onValueChange={setEditCategory}>
                    <SelectTrigger className="h-11 md:h-12 bg-accent text-white border-none rounded-lg font-black text-xs px-4">
                      <SelectValue placeholder="카테고리" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl shadow-4xl border-none p-1">{HR_CATEGORIES.map(cat => <SelectItem key={cat} value={cat} className="rounded-lg py-2 font-bold px-4 text-xs">{cat}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <Textarea value={editText} onChange={e => setEditText(e.target.value)} placeholder="내용" className="min-h-[200px] md:min-h-[250px] bg-[#F5F6F7] border-none rounded-xl p-5 md:p-6 font-medium text-sm md:text-base leading-relaxed resize-none shadow-inner" />
            </div>
          </div>
          <DialogFooter className="bg-[#FBFBFC] p-5 md:p-6 border-t border-black/5 flex flex-row gap-3">
            <Button variant="ghost" onClick={() => setEditingQuestion(null)} className="flex-1 h-11 md:h-12 rounded-xl font-black text-accent/40 text-sm">취소</Button>
            <Button onClick={handleUpdate} disabled={isUpdating} className="flex-[2] h-11 md:h-12 naver-button rounded-xl text-base md:text-lg shadow-2xl">{isUpdating ? "처리 중" : "수정 완료"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {messageTarget && (
        <MessageDialog isOpen={!!messageTarget} onClose={() => setMessageTarget(null)} receiverId={messageTarget.id} receiverNickname={messageTarget.nickname} />
      )}
    </div>
  )
}
