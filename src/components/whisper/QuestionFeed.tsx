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
    <div className="space-y-4">
      {questions.length === 0 ? (
        <Card className="rounded-2xl p-10 md:p-20 text-center bg-white/50 border-none">
          <div className="flex flex-col items-center gap-6">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center animate-pulse">
              <AlertCircle className="w-8 h-8 text-primary" />
            </div>
            <div className="space-y-2">
              <p className="text-accent font-black text-lg md:text-2xl tracking-tighter">공유된 속삭임이 없습니다.</p>
              <p className="text-accent/30 font-bold text-xs md:text-sm">전문가님의 소중한 고민과 지식을 먼저 나눠보세요.</p>
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
                "bg-white rounded-2xl shadow-md border-transparent transition-all duration-300 cursor-pointer",
                isExpanded 
                  ? "ring-2 ring-primary/50 shadow-xl"
                  : "hover:shadow-lg hover:-translate-y-1 active:scale-[0.99]"
              )}
              onClick={() => onSelectQuestion(q.id)}
            >
              <CardContent className="p-5 md:p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <AvatarIcon src={q.userProfilePicture} seed={q.nickname} className="w-10 h-10 border-2 border-white shadow-sm shrink-0" />
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-accent truncate">@{q.nickname}</span>
                        {q.jobTitle && <span className="text-[10px] font-medium text-primary bg-primary/10 px-1.5 py-0.5 rounded-md truncate">#{q.jobTitle}</span>}
                        {isMentor && <Badge className="bg-accent text-primary shadow-sm border-none px-2 h-5 text-[8px] font-black uppercase tracking-wider">WHISPERER</Badge>}
                        {user && !isOwner && (
                          <button onClick={(e) => { e.stopPropagation(); setMessageTarget({ id: q.userId, nickname: q.nickname }); }} className="text-accent/20 hover:text-accent transition-all p-1 rounded-full">
                            <Mail className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                      <span className="text-xs text-accent/40 mt-0.5">
                         {isMounted ? formatDistanceToNow(q.createdAt, { addSuffix: true, locale: ko }) : '...'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0 ml-2">
                    {q.category && (
                      <Badge variant="outline" className="hidden sm:inline-flex text-[10px] font-semibold border-gray-200 text-gray-500 rounded-md px-2 h-6 bg-gray-50 tracking-tight">#{q.category}</Badge>
                    )}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <button className="text-gray-400 hover:text-gray-600 transition-all p-1 rounded-full hover:bg-gray-100 outline-none">
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-white border-gray-100 rounded-xl shadow-lg p-1 w-36 animate-in fade-in zoom-in-95 duration-200">
                        {isOwner ? (
                          <>
                            <DropdownMenuItem onSelect={(e) => { e.preventDefault(); setEditingQuestion(q); setEditTitle(q.title); setEditText(q.text); setEditCategory(q.category || ""); }} className="rounded-lg font-semibold text-xs gap-2 py-2 px-3 cursor-pointer text-accent focus:bg-gray-100">
                              <Edit3 className="w-3.5 h-3.5" /> 수정하기
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={(e) => { e.preventDefault(); setTimeout(() => handleDelete(q), 100); }} className="rounded-lg font-semibold text-xs gap-2 py-2 px-3 cursor-pointer text-red-500 focus:bg-red-50">
                              <Trash2 className="w-3.5 h-3.5" /> 삭제하기
                            </DropdownMenuItem>
                          </>
                        ) : (
                          <DropdownMenuItem onSelect={(e) => { e.preventDefault(); handleShare(q); }} className="rounded-lg font-semibold text-xs gap-2 py-2 px-3 cursor-pointer text-accent focus:bg-gray-100">
                            <Share2 className="w-3.5 h-3.5" /> 링크 복사
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                <div className="space-y-2 ml-12 pl-1 border-l-2 border-gray-100/80">
                    <div className="pl-4 space-y-2">
                        <h3 className="text-base md:text-lg font-bold leading-snug text-gray-800 tracking-tight break-words group-hover:text-primary transition-colors">{q.title}</h3>
                        <p className={cn("text-sm leading-relaxed text-gray-600 whitespace-pre-wrap break-words", !isExpanded && "line-clamp-2")}>{q.text}</p>
                    </div>
                  {
                    isExpanded && (
                      <div className="space-y-4 pt-4 animate-in slide-in-from-bottom-2 duration-500">
                        {q.imageUrl && <div className="relative w-full rounded-lg overflow-hidden border border-gray-100 shadow-sm bg-gray-50"><img src={q.imageUrl} alt="attached" className="w-full h-auto block" /></div>}
                        {youtubeId && <div className="relative w-full aspect-video rounded-lg overflow-hidden border border-gray-100 shadow-sm bg-black"><iframe width="100%" height="100%" src={`https://www.youtube.com/embed/${youtubeId}`} title="video" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen></iframe></div>}
                      </div>
                    )
                  }
                </div>

                {isExpanded && (
                  <div className="mt-6 pt-6 border-t border-gray-100" onClick={(e) => e.stopPropagation()}>
                    <SubmissionForm type="answer" placeholder="도움이 되는 지혜를 남겨주세요." onSubmit={onAddAnswer} />
                    <AnswerFeed answers={questionAnswers} isAdminMode={isAdminMode} />
                  </div>
                )}
              </CardContent>
              
              <CardFooter className="px-5 md:px-6 py-3 border-t border-gray-100 flex items-center justify-between bg-gray-50/50">
                <div className="flex gap-4">
                  <button 
                    onClick={(e) => handleLike(e, q)}
                    className={cn(
                      "flex items-center gap-1.5 text-xs font-bold transition-all hover:scale-105",
                      isLiked ? "text-primary" : "text-gray-400 hover:text-primary"
                    )}
                  >
                    <ThumbsUp className={cn("w-4 h-4", isLiked && "fill-primary")} />
                    <span>{q.likeCount?.toLocaleString() || 0}</span>
                  </button>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-gray-400">
                    <MessageCircle className="w-4 h-4" />
                    <span>답변 {q.answerCount.toLocaleString()}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={(e) => { e.stopPropagation(); handleShare(q); }} className="flex items-center gap-1.5 text-xs font-bold text-gray-400 hover:text-gray-800 transition-all">
                    <Share2 className="w-4 h-4" />
                    </button>
                    <Bookmark className="w-4 h-4 text-gray-300 hover:text-yellow-500 cursor-pointer transition-all" />
                </div>
              </CardFooter>
            </Card>
          )
        })
      )}

      <Dialog open={!!editingQuestion} onOpenChange={(open) => { if(!open) setEditingQuestion(null); }}>
        <DialogContent className="max-w-2xl w-[95vw] bg-white border-none rounded-2xl p-0 shadow-xl overflow-hidden">
          <DialogHeader className="bg-gray-50 p-6 border-b border-gray-200">
            <DialogTitle className="text-lg font-bold text-gray-800 flex items-center gap-3"><Sparkles className="w-5 h-5 text-primary" /> 게시글 수정</DialogTitle>
          </DialogHeader>
          <div className="p-6 space-y-4">
              <Input value={editTitle} onChange={e => setEditTitle(e.target.value)} placeholder="제목" className="w-full h-12 bg-gray-100 border-transparent rounded-lg font-bold text-base px-4" />
              <Select value={editCategory} onValueChange={setEditCategory}>
                <SelectTrigger className="w-full h-12 bg-gray-100 border-transparent rounded-lg font-bold text-xs px-4">
                  <SelectValue placeholder="카테고리" />
                </SelectTrigger>
                <SelectContent className="rounded-lg shadow-lg border-gray-100 p-1">{HR_CATEGORIES.map(cat => <SelectItem key={cat} value={cat} className="rounded-md py-2 font-semibold px-3 text-xs">{cat}</SelectItem>)}</SelectContent>
              </Select>
              <Textarea value={editText} onChange={e => setEditText(e.target.value)} placeholder="내용" className="min-h-[250px] bg-gray-100 border-transparent rounded-lg p-4 font-medium text-sm leading-relaxed resize-none" />
          </div>
          <DialogFooter className="bg-gray-50 p-4 border-t border-gray-200 flex flex-row gap-2">
            <Button variant="ghost" onClick={() => setEditingQuestion(null)} className="h-12 rounded-lg font-bold text-gray-500 text-sm">취소</Button>
            <Button onClick={handleUpdate} disabled={isUpdating} className="flex-1 h-12 bg-primary text-accent rounded-lg text-sm font-bold shadow-sm">{isUpdating ? "처리 중" : "수정 완료"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {messageTarget && (
        <MessageDialog isOpen={!!messageTarget} onClose={() => setMessageTarget(null)} receiverId={messageTarget.id} receiverNickname={messageTarget.nickname} />
      )}
    </div>
  )
}