
"use client"

import { useState, useMemo, useEffect } from "react"
import { QuestionFeed } from "@/components/chuchot/QuestionFeed"
import { Question, Answer } from "@/lib/types"
import { useFirestore, useCollection, useDoc, useMemoFirebase, addDocumentNonBlocking, updateDocumentNonBlocking, useUser } from "@/firebase"
import { collection, query, orderBy, doc, increment } from "firebase/firestore"
import { Sparkles, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useRouter } from "next/navigation"

export function QuestionViewClient({ id }: { id: string }) {
  const { user } = useUser()
  const db = useFirestore()
  const router = useRouter()
  
  const questionRef = useMemoFirebase(() => (db && id) ? doc(db, "questions", id) : null, [db, id])
  const { data: question, isLoading: isQuestionLoading } = useDoc<Question>(questionRef)

  // 관련 답변들 조회
  const answersQuery = useMemoFirebase(() => {
    if (!db || !id) return null
    return query(collection(db, "questions", id, "answers"), orderBy("createdAt", "desc"))
  }, [db, id])
  const { data: answersData } = useCollection<Answer>(answersQuery)
  const answers = answersData || []

  // 조회수 증가 (한 번만)
  useEffect(() => {
    if (db && id) {
      updateDocumentNonBlocking(doc(db, "questions", id), { viewCount: increment(1) })
    }
  }, [db, id])

  const handleAddAnswer = (nickname: string, title: string, text: string) => {
    if (!db || !id || !user || !question) return

    const answerData = {
      questionId: id,
      text,
      nickname,
      userId: user.uid,
      userRole: question.userRole || "member",
      jobTitle: question.jobTitle || null,
      createdAt: Date.now(),
    }

    addDocumentNonBlocking(collection(db, "questions", id, "answers"), answerData).then(() => {
      // 본인이 아닌 경우에만 알림 발송
      if (question.userId !== user.uid) {
        addDocumentNonBlocking(collection(db, "notifications"), {
          userId: question.userId,
          type: "new_answer",
          questionId: id,
          questionTitle: question.title,
          senderNickname: nickname,
          createdAt: Date.now(),
          isRead: false
        })
      }
    })
    
    updateDocumentNonBlocking(doc(db, "questions", id), { answerCount: increment(1) })
  }

  if (isQuestionLoading) {
    return <div className="flex justify-center py-40"><Sparkles className="w-12 h-12 animate-spin text-accent" /></div>
  }

  if (!question) {
    return (
      <div className="text-center py-40 bg-white rounded-[3rem] border border-dashed border-primary/10">
        <p className="text-primary/20 font-black text-xl">존재하지 않거나 삭제된 게시글입니다.</p>
        <Link href="/">
          <Button className="mt-6 bg-primary text-accent font-black rounded-xl">홈으로 돌아가기</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col gap-6 mb-10">
        <Link href="/" className="flex items-center gap-2 text-primary/40 hover:text-accent font-bold text-sm transition-colors w-fit group">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          전체 피드로 돌아가기
        </Link>
        <div className="space-y-2">
          <h2 className="text-3xl md:text-4xl font-black text-primary tracking-tight">
            공유된 <span className="text-accent">속삭임</span> 확인하기
          </h2>
        </div>
      </div>

      <QuestionFeed 
        questions={[question]} 
        onSelectQuestion={() => {}} 
        selectedId={id} 
        answers={answers}
        onAddAnswer={handleAddAnswer}
        activeTab="all"
        onTabChange={() => {}}
      />
    </div>
  )
}
