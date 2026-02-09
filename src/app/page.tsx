
"use client"

import { useState, useMemo, useEffect } from "react"
import { Header } from "@/components/chuchot/Header"
import { MainBanner, BannerData } from "@/components/chuchot/MainBanner"
import { SubmissionForm } from "@/components/chuchot/SubmissionForm"
import { QuestionFeed } from "@/components/chuchot/QuestionFeed"
import { RankingList } from "@/components/chuchot/RankingList"
import { AldiChat } from "@/components/chuchot/ShuChat"
import { Question, Answer, PremiumAd } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, Sparkles } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { generateAiReply } from "@/ai/flows/generate-ai-reply-flow"
import { cn } from "@/lib/utils"
import { useFirestore, useCollection, useDoc, useMemoFirebase, addDocumentNonBlocking, updateDocumentNonBlocking, useUser } from "@/firebase"
import { collection, query, orderBy, doc, increment } from "firebase/firestore"
import { Badge } from "@/components/ui/badge"
import mockData from "@/lib/mock-data.json"

const ITEMS_PER_PAGE = 7

const MOCK_QUESTIONS: Question[] = (mockData.questions as any[]).map((q, idx) => ({
  ...q,
  // Ensure deterministic values for hydration stability
  viewCount: q.viewCount || (100 + idx * 5),
  answerCount: q.answerCount || 1,
  createdAt: q.createdAt || (1714521600000 - idx * 3600000)
}));

const MOCK_ANSWERS: Answer[] = (mockData.answers as any[]).map((a, idx) => ({
  ...a,
  createdAt: a.createdAt || (1714525200000 - idx * 3600000)
}));

export default function HomePage() {
  const { user } = useUser()
  const db = useFirestore()
  const { toast } = useToast()
  
  const userDocRef = useMemoFirebase(() => (user && db) ? doc(db, "users", user.uid) : null, [user, db])
  const { data: profile } = useDoc<any>(userDocRef)

  const configDocRef = useMemoFirebase(() => db ? doc(db, "admin_configuration", "site_settings") : null, [db])
  const { data: config } = useDoc<any>(configDocRef)

  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState<"all" | "popular" | "waiting" | "hrd" | "culture">("all")
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)

  const banners = useMemo(() => {
    if (config?.bannerSettings) {
      try { return JSON.parse(config.bannerSettings) as BannerData[] } catch (e) { return [] }
    }
    return []
  }, [config])

  const premiumAds = useMemo((): PremiumAd[] => {
    if (config?.premiumAdsSettings) {
      try { return JSON.parse(config.premiumAdsSettings) as PremiumAd[] } catch (e) { return [] }
    }
    return [
      { id: "ad1", title: "HR 전문가를 위한\n커리어 엑셀러레이팅", badge: "SPECIAL EVENT", webImage: "https://picsum.photos/seed/ad1/400/220", mobileImage: "https://picsum.photos/seed/ad1m/400/220", link: "#" },
      { id: "ad2", title: "조직문화 진단 툴킷\n무료 체험 신청하기", badge: "PARTNER", webImage: "https://picsum.photos/seed/ad2/400/220", mobileImage: "https://picsum.photos/seed/ad2m/400/220", link: "#" },
      { id: "ad3", title: "AI 기반 자동 채용\n어시스턴트 도입 가이드", badge: "NEW SOLUTION", webImage: "https://picsum.photos/seed/ad3/400/220", mobileImage: "https://picsum.photos/seed/ad3m/400/220", link: "#" }
    ]
  }, [config])

  const questionsQuery = useMemoFirebase(() => db ? query(collection(db, "questions"), orderBy("createdAt", "desc")) : null, [db])
  const { data: questionsData } = useCollection<Question>(questionsQuery)
  
  const questions = useMemo(() => {
    const fetched = questionsData || []
    // Fallback to MOCK_QUESTIONS if Firestore is empty or loading
    if (fetched.length === 0 && !searchQuery) return MOCK_QUESTIONS
    return fetched
  }, [questionsData, searchQuery])

  const answersQuery = useMemoFirebase(() => {
    if (!db || !selectedQuestionId) return null
    return query(collection(db, "questions", selectedQuestionId, "answers"), orderBy("createdAt", "desc"))
  }, [db, selectedQuestionId])
  const { data: answersData } = useCollection<Answer>(answersQuery)
  
  const answers = useMemo(() => {
    const fetched = answersData || []
    if (fetched.length === 0) {
      return MOCK_ANSWERS.filter(a => a.questionId === selectedQuestionId)
    }
    return fetched
  }, [answersData, selectedQuestionId])

  const filteredQuestions = useMemo(() => {
    let result = [...questions]
    if (searchQuery.trim()) {
      const kw = searchQuery.toLowerCase();
      result = result.filter(q => q.title.toLowerCase().includes(kw) || q.text.toLowerCase().includes(kw));
    }
    if (activeTab === "popular") result.sort((a, b) => b.viewCount - a.viewCount);
    else if (activeTab === "waiting") result = result.filter(q => q.answerCount === 0);
    else if (activeTab === "hrd") result = result.filter(q => q.category?.includes("HRD") || q.category === "HRD/교육");
    else if (activeTab === "culture") result = result.filter(q => q.category?.includes("조직문화") || q.category === "조직문화/EVP");
    return result
  }, [questions, searchQuery, activeTab])

  const paginatedQuestions = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE
    return filteredQuestions.slice(start, start + ITEMS_PER_PAGE)
  }, [filteredQuestions, currentPage])

  const totalPages = Math.ceil(filteredQuestions.length / ITEMS_PER_PAGE)

  useEffect(() => setCurrentPage(1), [searchQuery, activeTab])

  const handleAddQuestion = (nickname: string, title: string, text: string, imageUrl?: string, category?: string) => {
    if (!db || !user) return;
    addDocumentNonBlocking(collection(db, "questions"), {
      title, text, nickname, userId: user.uid, userRole: profile?.role || "member",
      jobTitle: profile?.jobTitle || null, category: category || null, imageUrl: imageUrl || null,
      viewCount: 0, answerCount: 0, createdAt: Date.now()
    }).then(docRef => {
      if (!docRef) return;
      generateAiReply({ title, text }).then(res => {
        addDocumentNonBlocking(collection(db, "questions", docRef.id, "answers"), {
          questionId: docRef.id, text: res.replyText, nickname: "알디", userId: "ai-whisper",
          userRole: "admin", createdAt: Date.now()
        });
        updateDocumentNonBlocking(doc(db, "questions", docRef.id), { answerCount: increment(1) });
      });
    });
  }

  const handleAddAnswer = (nickname: string, title: string, text: string) => {
    if (!db || !selectedQuestionId || !user) return;
    addDocumentNonBlocking(collection(db, "questions", selectedQuestionId, "answers"), {
      questionId: selectedQuestionId, text, nickname, userId: user.uid,
      userRole: profile?.role || "member", createdAt: Date.now()
    });
    updateDocumentNonBlocking(doc(db, "questions", selectedQuestionId), { answerCount: increment(1) });
  }

  const handleSelectQuestion = (id: string) => {
    if (selectedQuestionId === id) setSelectedQuestionId(null);
    else {
      setSelectedQuestionId(id);
      if (db && !id.startsWith("hr-") && !id.startsWith("cul-")) updateDocumentNonBlocking(doc(db, "questions", id), { viewCount: increment(1) });
    }
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <Header onSearch={setSearchQuery} />
      <div className="max-w-7xl mx-auto px-0 md:px-4 py-0 md:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <main className={cn("space-y-0 md:space-y-10 transition-all duration-500", searchQuery ? "lg:col-span-12 max-w-4xl mx-auto w-full" : "lg:col-span-8")}>
            {!searchQuery && <MainBanner banners={banners} />}
            <div className="px-4 md:px-0">
              <SubmissionForm type="question" placeholder="HR 고민을 속삭여보세요." onSubmit={handleAddQuestion} />
              <div className="flex gap-4 md:gap-8 whitespace-nowrap mb-6 overflow-x-auto pb-2 scrollbar-hide border-b border-primary/5">
                {["all", "popular", "waiting", "hrd", "culture"].map(tab => (
                  <button key={tab} onClick={() => setActiveTab(tab as any)} className={cn("text-sm md:text-base pb-3 transition-all border-b-2 -mb-[1px]", activeTab === tab ? "font-black text-primary border-accent" : "font-bold text-primary/20 border-transparent hover:text-primary")}>
                    {tab === "all" ? "전체 피드" : tab === "popular" ? "실시간 인기" : tab === "waiting" ? "답변 대기" : tab === "hrd" ? "HRD/교육" : "조직문화"}
                  </button>
                ))}
              </div>
              <QuestionFeed 
                questions={paginatedQuestions} 
                onSelectQuestion={handleSelectQuestion} 
                selectedId={selectedQuestionId} 
                answers={answers} 
                onAddAnswer={handleAddAnswer} 
                activeTab={activeTab as any} 
                onTabChange={setActiveTab as any} 
              />
              
              {!searchQuery && (
                <div className="lg:hidden space-y-6 mt-12 mb-12">
                  {premiumAds.map((ad) => (
                    <div key={ad.id} onClick={() => window.open(ad.link, '_blank')} className="relative group cursor-pointer overflow-hidden rounded-[2rem] shadow-xl border border-primary/5 transition-all aspect-[16/9]">
                      <img src={ad.mobileImage} alt={ad.title} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent"></div>
                      <div className="absolute bottom-6 left-6 right-6">
                        <Badge className="bg-accent text-primary font-black mb-2 text-[10px]">{ad.badge}</Badge>
                        <p className="text-white font-black text-xl leading-tight whitespace-pre-line">{ad.title}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-12 pb-20">
                  <Button variant="ghost" size="icon" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="rounded-xl"><ChevronLeft className="w-5 h-5" /></Button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).slice(Math.max(0, currentPage - 3), Math.min(totalPages, currentPage + 2)).map(page => (
                    <Button key={page} onClick={() => setCurrentPage(page)} className={cn("w-10 h-10 rounded-xl font-black text-sm transition-all", currentPage === page ? "bg-primary text-accent shadow-lg" : "bg-white text-primary/20 shadow-sm")}>{page}</Button>
                  ))}
                  <Button variant="ghost" size="icon" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} className="rounded-xl"><ChevronRight className="w-5 h-5" /></Button>
                </div>
              )}
            </div>
          </main>
          {!searchQuery && (
            <aside className="lg:col-span-4 space-y-8 hidden lg:block">
              <AldiChat />
              <RankingList questions={questions.slice(0, 3)} onSelectQuestion={handleSelectQuestion} />
              <div className="space-y-6">
                {premiumAds.map((ad) => (
                  <div key={ad.id} onClick={() => window.open(ad.link, '_blank')} className="relative group cursor-pointer overflow-hidden rounded-[2rem] shadow-xl border border-primary/5 transition-all hover:shadow-2xl hover:-translate-y-1 aspect-[16/9]">
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10 opacity-80 group-hover:opacity-100 transition-opacity"></div>
                    <img src={ad.webImage} alt={ad.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                    <div className="absolute bottom-6 left-6 right-6 z-20">
                      <Badge className="bg-accent text-primary font-black mb-2 text-[9px]">{ad.badge}</Badge>
                      <p className="text-white font-black text-lg leading-tight whitespace-pre-line drop-shadow-md">{ad.title}</p>
                    </div>
                  </div>
                ))}
              </div>
            </aside>
          )}
        </div>
      </div>
    </div>
  )
}
