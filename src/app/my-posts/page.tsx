
"use client"

import { useState, useMemo, useEffect } from "react"
import { Header } from "@/components/whisper/Header"
import { QuestionFeed } from "@/components/whisper/QuestionFeed"
import { Question, Answer } from "@/lib/types"
import { useUser, useFirestore, useCollection, useMemoFirebase, updateDocumentNonBlocking } from "@/firebase"
import { collection, query, where, orderBy, doc, increment } from "firebase/firestore"
import { FileText, Sparkles, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function MyPostsPage() {
  const { user, isUserLoading } = useUser()
  const db = useFirestore()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const myPostsQuery = useMemoFirebase(() => {
    if (!db || !user?.uid) return null
    return query(collection(db, "questions"), where("userId", "==", user.uid))
  }, [db, user?.uid])

  const { data: postsData, isLoading: isPostsLoading } = useCollection<Question>(myPostsQuery)

  const posts = useMemo(() => {
    if (!postsData) return []
    return [...postsData].sort((a, b) => b.createdAt - a.createdAt)
  }, [postsData])

  const answersQuery = useMemoFirebase(() => {
    if (!db || !selectedId) return null
    return query(collection(db, "questions", selectedId, "answers"), orderBy("createdAt", "desc"))
  }, [db, selectedId])
  
  const { data: answersData } = useCollection<Answer>(answersQuery)
  const answers = answersData || []

  const handleSelectQuestion = (id: string) => {
    if (selectedId === id) setSelectedId(null)
    else {
      setSelectedId(id)
      if (db) {
        updateDocumentNonBlocking(doc(db, "questions", id), { viewCount: increment(1) })
      }
    }
  }

  if (!isMounted) return null

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <Header />
      <main className="max-w-4xl mx-auto px-4 py-12">
        <div className="mb-10">
          <Link href="/" className="flex items-center gap-2 text-primary/30 hover:text-accent font-bold text-xs mb-6 transition-colors group">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            피드로 돌아가기
          </Link>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary text-accent rounded-2xl shadow-xl">
              <FileText className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-primary tracking-tighter">내가 쓴 속삭임</h1>
              <p className="text-sm font-bold text-primary/30">지금까지 동료들과 나눈 소중한 지식들</p>
            </div>
          </div>
        </div>

        {(isUserLoading || isPostsLoading) ? (
          <div className="flex justify-center py-20"><Sparkles className="w-12 h-12 animate-spin text-accent" /></div>
        ) : !user ? (
          <div className="max-w-md mx-auto py-20 text-center">
            <p className="text-primary/40 font-black">로그인이 필요한 페이지입니다.</p>
          </div>
        ) : (
          <QuestionFeed 
            questions={posts} 
            onSelectQuestion={handleSelectQuestion}
            selectedId={selectedId}
            answers={answers}
            onAddAnswer={() => {}}
            activeTab="all"
            onTabChange={() => {}}
          />
        )}
      </main>
    </div>
  )
}
