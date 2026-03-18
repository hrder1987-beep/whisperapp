"use client"

import { useState, useMemo, useEffect } from "react"
import { Header } from "@/components/whisper/Header"
import { QuestionFeed } from "@/components/whisper/QuestionFeed"
import { Question, Answer } from "@/lib/types"
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection, query, where, orderBy, doc, documentId } from "firebase/firestore"
import { FileText, Bookmark, ArrowLeft, Sparkles } from "lucide-react"
import Link from "next/link"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function MyPostsPage() {
  const { user, isUserLoading } = useUser()
  const db = useFirestore()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>([])
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
    try {
      const savedBookmarks = localStorage.getItem('whisper_bookmarked_posts')
      if (savedBookmarks) {
        setBookmarkedIds(JSON.parse(savedBookmarks))
      }
    } catch (e) {
      console.warn('Failed to load bookmarks from storage')
    }
  }, [])

  const myPostsQuery = useMemoFirebase(() => {
    if (!db || !user?.uid) return null
    return query(collection(db, "questions"), where("userId", "==", user.uid), orderBy("createdAt", "desc"))
  }, [db, user?.uid])

  const { data: postsData, loading: isPostsLoading } = useCollection<Question>(myPostsQuery)
  const myPosts = postsData || []

  const bookmarkedQuery = useMemoFirebase(() => {
    if (!db || bookmarkedIds.length === 0) return null
    return query(collection(db, "questions"), where(documentId(), "in", bookmarkedIds))
  }, [db, bookmarkedIds])

  const { data: bookmarkedData, loading: isBookmarksLoading } = useCollection<Question>(bookmarkedQuery)
  const bookmarkedPosts = useMemo(() => {
    if (!bookmarkedData) return []
    // Firestore `in` query does not guarantee order, so we sort it here.
    const idIndexMap = new Map(bookmarkedIds.map((id, index) => [id, index]))
    return [...bookmarkedData].sort((a, b) => (idIndexMap.get(a.id) ?? -1) - (idIndexMap.get(b.id) ?? -1))
  }, [bookmarkedData, bookmarkedIds])

  const allAnswersQuery = useMemoFirebase(() => {
    if (!db || !selectedId) return null
    return query(collection(db, "questions", selectedId, "answers"), orderBy("createdAt", "desc"))
  }, [db, selectedId])
  
  const { data: answersData } = useCollection<Answer>(allAnswersQuery)
  const answers = answersData || []

  const handleSelectQuestion = (id: string) => {
    setSelectedId(id === selectedId ? null : id)
  }

  if (!isMounted) return null

  const renderFeed = (posts: Question[]) => (
    <QuestionFeed 
      questions={posts} 
      onSelectQuestion={handleSelectQuestion}
      selectedId={selectedId}
      answers={answers}
      onAddAnswer={() => {}}
    />
  )

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
              <h1 className="text-3xl font-black text-primary tracking-tighter">내 활동</h1>
              <p className="text-sm font-bold text-primary/30">내가 기여한 지식과 저장한 지식들</p>
            </div>
          </div>
        </div>

        {(isUserLoading) ? (
          <div className="flex justify-center py-20"><Sparkles className="w-12 h-12 animate-spin text-accent" /></div>
        ) : !user ? (
          <div className="max-w-md mx-auto py-20 text-center">
            <p className="text-primary/40 font-black">로그인이 필요한 페이지입니다.</p>
          </div>
        ) : (
          <Tabs defaultValue="my-posts" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-gray-100 rounded-xl p-1.5 h-auto">
              <TabsTrigger value="my-posts" className="py-3 font-bold text-sm rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-md transition-all">내가 쓴 글</TabsTrigger>
              <TabsTrigger value="bookmarks" className="py-3 font-bold text-sm rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-md transition-all">북마크</TabsTrigger>
            </TabsList>
            <TabsContent value="my-posts" className="pt-8">
              {isPostsLoading ? <div className="flex justify-center py-20"><Sparkles className="w-8 h-8 animate-spin text-accent" /></div> : renderFeed(myPosts)}
            </TabsContent>
            <TabsContent value="bookmarks" className="pt-8">
              {isBookmarksLoading ? <div className="flex justify-center py-20"><Sparkles className="w-8 h-8 animate-spin text-accent" /></div> : renderFeed(bookmarkedPosts)}
            </TabsContent>
          </Tabs>
        )}
      </main>
    </div>
  )
}
