"use client"

import { useState, useEffect } from "react"
import { Question, Answer } from "@/lib/types"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { MessageCircle, Eye, Clock, Bookmark, Trash2, Crown, Mail, Share2, MoreHorizontal, Edit3, AlertCircle, Sparkles } from "lucide-react"
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
import { doc } from "firebase/firestore"
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

  const [isMounted, setIsMounted] = useState(false)
  useEffect(() => setIsMounted(true), [])

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
    <div className="space-y-6 md:space-y-8">
      {questions.length === 0 ? (
        <Card className="naver-card p-12 md:p-24 text-center bg-white border-none shadow-xl">
          <div className="flex flex-col items-center gap-6">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-primary" />
            </div>
            <div className="space-y-2">
              <p className="text-accent font-black text-xl tracking-tighter">공유된 속삭임이 없습니다.</p>
              <p className="text-accent/30 font-bold text-xs">전문가님의 소중한 고민과 지식을 먼저 나눠보세요.</p>
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

          return (
            <Card 
              key={q.id} 
              id={`q-${q.id}`}
              className={cn(
                "naver-card group transition-all duration-500 border-none",
                isExpanded ? "ring-4 ring-primary/20 shadow-3xl translate-y-[-4px]" : "hover:shadow-2xl active:scale-[0.99]"
              )}
              onClick={() => onSelectQuestion(q.id)}
            >
              <CardContent className={cn("p-6 md:p-10", isExpanded && "md:p-12")}>
                <div className="flex justify-between items-start mb-8 md:mb-10">
                  <div className="flex items-center gap-4 md:gap-6">
                    <AvatarIcon src={q.userProfilePicture} seed={q.nickname} className="w-12 h-12 md:w-16 md:h-16 border-4 border-white shadow-xl" />
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2 md:gap-3">
                        <span className="text-base md:text-lg font-black text-accent tracking-tight">@{q.nickname}</span>
                        {q.jobTitle && <span className="text-[10px] md:text-[12px] font-black text-primary italic bg-primary/10 px-2.5 py-1 rounded-xl">#{q.jobTitle}</span>}
                        {isMentor && <Badge className="bg-accent text-primary shadow-lg border-none px-3 h-6 text-[9px] font-black">WHISPERER</Badge>}
                        {user && !isOwner && (
                          <button onClick={(e) => { e.stopPropagation(); setMessageTarget({ id: q.userId, nickname: q.nickname }); }} className="text-accent/15 hover:text-accent hover:bg-accent/5 transition-all p-2 rounded-full">
                            <Mail className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      <span className="text-[11px] md:text-[13px] font-bold text-accent/30 flex items-center gap-2 mt-1.5">
                        {isMounted ? formatDistanceToNow(q.createdAt, { addSuffix: true, locale: ko }) : '...'}
                        <span className="w-1 h-1 rounded-full bg-accent/10"></span>
                        <Eye className="w-3.5 h-3.5 opacity-50" /> {q.viewCount.toLocaleString()} Views
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {q.category && (
                      <Badge variant="outline" className="hidden sm:inline-flex text-[10px] font-black border-accent/5 text-accent/30 rounded-xl px-4 py-1.5 h-8 bg-accent/2 tracking-tighter">#{q.category}</Badge>
                    )}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <button className="text-accent/15 hover:text-accent/50 transition-all p-2 rounded-full hover:bg-accent/5 outline-none">
                          <MoreHorizontal className="w-6 h-6" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-white border-black/5 rounded-2xl shadow-3xl p-2 w-48">
                        {isOwner ? (
                          <>
                            <DropdownMenuItem onSelect={(e) => { e.preventDefault(); setEditingQuestion(q); setEditTitle(q.title); setEditText(q.text); setEditCategory(q.category || ""); }} className="rounded-xl font-black text-sm gap-3 py-3 cursor-pointer text-accent focus:bg-primary/10">
                              <Edit3 className="w-4 h-4" /> 수정하기
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={(e) => { e.preventDefault(); setTimeout(() => handleDelete(q), 100); }} className="rounded-xl font-black text-sm gap-3 py-3 cursor-pointer text-red-500 focus:bg-red-50">
                              <Trash2 className="w-4 h-4" /> 삭제하기
                            </DropdownMenuItem>
                          </>
                        ) : (
                          <DropdownMenuItem onSelect={(e) => { e.preventDefault(); handleShare(q); }} className="rounded-xl font-black text-sm gap-3 py-3 cursor-pointer text-accent focus:bg-primary/10">
                            <Share2 className="w-4 h-4" /> 링크 복사
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                <div className="space-y-4 md:space-y-6">
                  <h3 className="text-lg md:text-2xl font-black leading-[1.3] text-accent tracking-tight line-clamp-2 md:line-clamp-none group-hover:text-primary transition-colors">{q.title}</h3>
                  <p className={cn("text-sm md:text-base leading-relaxed text-[#404040] font-medium whitespace-pre-wrap break-words", !isExpanded && "line-clamp-3")}>{q.text}</p>
                  {isExpanded && (
                    <div className="space-y-8 mt-8 md:mt-12 animate-in slide-in-from-bottom-4 duration-700">
                      {q.imageUrl && <div className="relative w-full rounded-2xl overflow-hidden border-4 border-white shadow-2xl bg-[#FBFBFC]"><img src={q.imageUrl} alt="attached" className="w-full h-auto block" /></div>}
                      {youtubeId && <div className="relative w-full aspect-video rounded-2xl overflow-hidden border-4 border-white shadow-2xl bg-black"><iframe width="100%" height="100%" src={`https://www.youtube.com/embed/${youtubeId}`} title="video" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen></iframe></div>}
                    </div>
                  )}
                </div>

                {isExpanded && (
                  <div className="mt-12 md:mt-20 pt-12 md:pt-20 border-t border-black/[0.05]" onClick={(e) => e.stopPropagation()}>
                    <SubmissionForm type="answer" placeholder="도움이 되는 지혜를 남겨주세요." onSubmit={onAddAnswer} />
                    <AnswerFeed answers={questionAnswers} isAdminMode={isAdminMode} />
                  </div>
                )}
              </CardContent>
              {!isExpanded && (
                <CardFooter className="px-6 md:px-10 py-4 md:py-6 border-t border-primary/5 flex items-center justify-between bg-primary/[0.02]">
                  <div className="flex gap-8 md:gap-12">
                    <div className="flex items-center gap-2 text-xs md:text-sm font-black text-accent/60">
                      <MessageCircle className="w-5 h-5 text-primary" />
                      <span>답변 {q.answerCount.toLocaleString()}</span>
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); handleShare(q); }} className="flex items-center gap-2 text-xs md:text-sm font-black text-accent/60 hover:text-accent transition-all group/share">
                      <Share2 className="w-5 h-5 group-hover/share:scale-110 transition-transform" />
                      공유하기
                    </button>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2 text-[10px] font-black text-accent/10 uppercase tracking-widest sm:hidden">
                      #{q.category}
                    </div>
                    <Bookmark className="w-5 h-5 md:w-6 md:h-6 text-accent/15 hover:text-primary cursor-pointer transition-all hover:scale-110" />
                  </div>
                </CardFooter>
              )}
            </Card>
          )
        })
      )}

      <Dialog open={!!editingQuestion} onOpenChange={(open) => { if(!open) setEditingQuestion(null); }}>
        <DialogContent className="max-w-2xl bg-white border-none rounded-[2.5rem] p-0 shadow-4xl overflow-hidden">
          <DialogHeader className="bg-primary/5 p-8 border-b border-primary/10">
            <DialogTitle className="text-2xl font-black text-accent flex items-center gap-4"><Sparkles className="w-8 h-8 text-primary" /> 게시글 수정</DialogTitle>
          </DialogHeader>
          <div className="p-8 space-y-8">
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row gap-4">
                <Input value={editTitle} onChange={e => setEditTitle(e.target.value)} placeholder="제목" className="flex-1 h-14 bg-[#F5F6F7] border-none rounded-xl font-black text-xl px-6 shadow-inner !px-6" />
                <div className="w-full md:w-48">
                  <Select value={editCategory} onValueChange={setEditCategory}>
                    <SelectTrigger className="h-14 bg-accent text-white border-none rounded-xl font-black text-sm px-6">
                      <SelectValue placeholder="카테고리" />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl shadow-4xl border-none p-2">{HR_CATEGORIES.map(cat => <SelectItem key={cat} value={cat} className="rounded-xl py-3 font-bold px-6">{cat}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <Textarea value={editText} onChange={e => setEditText(e.target.value)} placeholder="내용" className="min-h-[300px] bg-[#F5F6F7] border-none rounded-2xl p-8 font-medium text-lg leading-relaxed resize-none shadow-inner" />
            </div>
          </div>
          <DialogFooter className="bg-[#FBFBFC] p-8 border-t border-black/5 flex flex-row gap-4">
            <Button variant="ghost" onClick={() => setEditingQuestion(null)} className="flex-1 h-14 rounded-2xl font-black text-accent/40 hover:bg-transparent">취소</Button>
            <Button onClick={handleUpdate} disabled={isUpdating} className="flex-[2] h-14 naver-button rounded-2xl text-xl shadow-2xl">{isUpdating ? "처리 중..." : "수정 완료"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {messageTarget && (
        <MessageDialog isOpen={!!messageTarget} onClose={() => setMessageTarget(null)} receiverId={messageTarget.id} receiverNickname={messageTarget.nickname} />
      )}
    </div>
  )
}
