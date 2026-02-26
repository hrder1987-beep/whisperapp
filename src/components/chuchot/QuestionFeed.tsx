
"use client"

import { useState, useEffect } from "react"
import { Question, Answer } from "@/lib/types"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { MessageCircle, Eye, Clock, Bookmark, Trash2, Crown, Mail, Share2, MoreHorizontal, Edit3, AlertCircle } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { ko } from "date-fns/locale"
import { Button } from "@/components/ui/button"
import { AvatarIcon } from "./AvatarIcon"
import { Badge } from "@/components/ui/badge"
import { AnswerFeed } from "./AnswerFeed"
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
  onAddAnswer: (nickname: string, title: string, text: string) => void
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
  activeTab,
  onTabChange,
  isAdminMode = false
}: QuestionFeedProps) {
  const { user } = useUser()
  const db = useFirestore()
  const { toast } = useToast()
  const [messageTarget, setMessageTarget] = useState<{ id: string, nickname: string } | null>(null)
  
  // 수정 기능 관련 상태
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
      // 만약 현재 삭제하려는 글이 펼쳐져 있다면 선택 해제
      if (selectedId === q.id) {
        onSelectQuestion(q.id);
      }
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
      toast({ title: "수정 완료", description: "게시글 내용이 업데이트되었습니다." });
    }, 500);
  }

  const getYoutubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  }

  return (
    <div className="space-y-3 md:space-y-4">
      {questions.length === 0 ? (
        <Card className="naver-card p-12 md:p-24 text-center bg-white">
          <p className="text-muted-foreground font-bold text-sm md:text-base">공유된 정보가 아직 없습니다.</p>
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
                "naver-card cursor-pointer group transition-all",
                isExpanded ? "ring-1 ring-accent/30 shadow-md" : "active:bg-black/5"
              )}
              onClick={() => onSelectQuestion(q.id)}
            >
              <CardContent className="p-5 md:p-8">
                <div className="flex justify-between items-start mb-4 md:mb-5">
                  <div className="flex items-center gap-3 md:gap-4">
                    <AvatarIcon src={q.userProfilePicture} seed={q.nickname} className="w-9 h-9 md:w-11 md:h-11 border border-black/5" />
                    <div className="flex flex-col">
                      <div className="flex items-center gap-1.5 md:gap-2">
                        <span className="text-[13px] md:text-[15px] font-black text-foreground truncate max-w-[100px] md:max-w-none">@{q.nickname}</span>
                        {isMentor && <Badge className="naver-badge scale-90 md:scale-100">Whisperer</Badge>}
                        {user && !isOwner && (
                          <button onClick={(e) => { e.stopPropagation(); setMessageTarget({ id: q.userId, nickname: q.nickname }); }} className="text-muted-foreground hover:text-accent transition-colors p-1">
                            <Mail className="w-3.5 h-3.5 md:w-4 md:h-4" />
                          </button>
                        )}
                      </div>
                      <span className="text-[10px] md:text-[12px] font-bold text-muted-foreground flex items-center gap-1.5 md:gap-2">
                        {isMounted ? formatDistanceToNow(q.createdAt, { addSuffix: true, locale: ko }) : '...'}
                        <span className="w-0.5 h-0.5 rounded-full bg-black/10"></span>
                        조회 {q.viewCount}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 md:gap-2">
                    {q.category && (
                      <Badge variant="outline" className="text-[9px] md:text-[11px] font-bold border-black/[0.08] text-muted-foreground rounded-sm px-1.5 py-0 md:px-2 md:py-0.5 max-w-[80px] md:max-w-none truncate">#{q.category}</Badge>
                    )}
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <button className="text-black/10 hover:text-black/30 transition-colors p-1 outline-none">
                          <MoreHorizontal className="w-4 h-4 md:w-5 md:h-5" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-white border-black/5 rounded-xl shadow-xl p-1 w-32">
                        {isOwner ? (
                          <>
                            <DropdownMenuItem 
                              onSelect={(e) => {
                                e.preventDefault();
                                setEditingQuestion(q);
                                setEditTitle(q.title);
                                setEditText(q.text);
                                setEditCategory(q.category || "");
                              }} 
                              className="rounded-lg font-black text-xs gap-2 py-2.5 cursor-pointer text-accent"
                            >
                              <Edit3 className="w-3.5 h-3.5" /> 수정하기
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onSelect={(e) => {
                                e.preventDefault();
                                // 드롭다운이 닫힌 후 confirm 창을 띄우기 위해 setTimeout 사용
                                setTimeout(() => handleDelete(q), 100);
                              }} 
                              className="rounded-lg font-black text-xs gap-2 py-2.5 cursor-pointer text-red-500 hover:text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="w-3.5 h-3.5" /> 삭제하기
                            </DropdownMenuItem>
                          </>
                        ) : (
                          <DropdownMenuItem 
                            onSelect={(e) => {
                              e.preventDefault();
                              handleShare(q);
                            }} 
                            className="rounded-lg font-black text-xs gap-2 py-2.5 cursor-pointer"
                          >
                            <Share2 className="w-3.5 h-3.5" /> 공유하기
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                <div className="space-y-2 md:space-y-3">
                  <h3 className="text-base md:text-[19px] font-black leading-tight text-foreground group-hover:underline decoration-accent/30 underline-offset-4 line-clamp-2 md:line-clamp-none">{q.title}</h3>
                  <p className={cn("text-[14px] md:text-[15px] leading-relaxed text-muted-foreground whitespace-pre-wrap break-words", !isExpanded && "line-clamp-2")}>{q.text}</p>
                  
                  {isExpanded && (
                    <div className="space-y-4 mt-4 md:mt-6">
                      {q.imageUrl && (
                        <div className="relative w-full rounded-sm overflow-hidden border border-black/5 bg-black/[0.02]">
                          <img src={q.imageUrl} alt="이미지" className="w-full h-auto block" />
                        </div>
                      )}
                      
                      {youtubeId && (
                        <div className="relative w-full aspect-video rounded-sm overflow-hidden border border-black/5 bg-black">
                          <iframe
                            width="100%"
                            height="100%"
                            src={`https://www.youtube.com/embed/${youtubeId}`}
                            title="YouTube video player"
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          ></iframe>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {isExpanded && (
                  <div className="mt-8 md:mt-10 pt-8 md:pt-10 border-t border-black/[0.05]" onClick={(e) => e.stopPropagation()}>
                    <SubmissionForm type="answer" placeholder="도움이 될만한 의견을 남겨주세요." onSubmit={onAddAnswer} />
                    <AnswerFeed answers={questionAnswers} isAdminMode={isAdminMode} />
                  </div>
                )}
              </CardContent>
              
              {!isExpanded && (
                <CardFooter className="px-5 md:px-8 py-3 md:py-4 border-t border-primary/10 flex items-center justify-between bg-primary/5">
                  <div className="flex gap-4 md:gap-6">
                    <div className="flex items-center gap-1.5 md:gap-2 text-[12px] md:text-[13px] font-black text-accent/60">
                      <MessageCircle className="w-3.5 h-3.5 md:w-4 md:h-4 text-accent" />
                      <span>댓글 {q.answerCount}</span>
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); handleShare(q); }} className="flex items-center gap-1.5 md:gap-2 text-[12px] md:text-[13px] font-black text-accent/60 hover:text-accent transition-colors">
                      <Share2 className="w-3.5 h-3.5 md:w-4 md:h-4" />
                      공유
                    </button>
                  </div>
                  <Bookmark className="w-3.5 h-3.5 md:w-4 md:h-4 text-accent/20 hover:text-accent cursor-pointer transition-colors" />
                </CardFooter>
              )}
            </Card>
          )
        })
      )}

      {/* 수정 다이얼로그 */}
      <Dialog open={!!editingQuestion} onOpenChange={(open) => { if(!open) setEditingQuestion(null); }}>
        <DialogContent className="max-w-2xl bg-white border-none rounded-[2rem] p-0 shadow-2xl overflow-hidden">
          <DialogHeader className="bg-primary/5 p-8 border-b border-primary/5">
            <DialogTitle className="text-xl font-black text-primary flex items-center gap-3">
              <Edit3 className="w-6 h-6 text-accent" /> 게시글 수정하기
            </DialogTitle>
          </DialogHeader>
          <div className="p-8 space-y-6">
            <div className="space-y-4">
              <div className="flex flex-col md:flex-row gap-4">
                <Input 
                  value={editTitle} 
                  onChange={e => setEditTitle(e.target.value)} 
                  placeholder="제목을 입력하세요"
                  className="flex-1 h-12 bg-[#F5F6F7] border-none rounded-xl font-black text-base"
                />
                <div className="w-full md:w-48">
                  <Select value={editCategory} onValueChange={setEditCategory}>
                    <SelectTrigger className="h-12 bg-accent text-white border-none rounded-xl font-black text-xs">
                      <SelectValue placeholder="카테고리" />
                    </SelectTrigger>
                    <SelectContent>
                      {HR_CATEGORIES.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Textarea 
                value={editText} 
                onChange={e => setEditText(e.target.value)} 
                placeholder="내용을 입력하세요"
                className="min-h-[250px] bg-[#F5F6F7] border-none rounded-2xl p-6 font-medium text-sm leading-relaxed resize-none"
              />
            </div>
          </div>
          <DialogFooter className="bg-[#FBFBFC] p-6 border-t border-black/5 flex flex-row gap-3">
            <Button variant="ghost" onClick={() => setEditingQuestion(null)} className="flex-1 h-12 rounded-xl font-black">취소</Button>
            <Button onClick={handleUpdate} disabled={isUpdating} className="flex-[2] h-12 naver-button rounded-xl text-base shadow-lg">
              {isUpdating ? "저장 중..." : "수정 내용 저장하기"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {messageTarget && (
        <MessageDialog isOpen={!!messageTarget} onClose={() => setMessageTarget(null)} receiverId={messageTarget.id} receiverNickname={messageTarget.nickname} />
      )}
    </div>
  )
}
