
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
import { ChevronLeft, ChevronRight, Sparkles, ChevronsLeft, ChevronsRight } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { generateAiReply } from "@/ai/flows/generate-ai-reply-flow"
import { cn } from "@/lib/utils"
import { useFirestore, useCollection, useDoc, useMemoFirebase, addDocumentNonBlocking, updateDocumentNonBlocking, useUser } from "@/firebase"
import { collection, query, orderBy, doc, increment } from "firebase/firestore"
import { Badge } from "@/components/ui/badge"
import mockData from "@/lib/mock-data.json"

const ITEMS_PER_PAGE = 7

// 200개의 데이터를 확실하게 보장하기 위한 복구 엔진
const generateFullMockQuestions = () => {
  const fullList: Question[] = [];
  const mockAnswerIds = new Set((mockData.answers as any[]).map(a => a.questionId));
  
  // 1. 인사/총무 (HRM) 100건 생성 (hr-q1 ~ hr-q100)
  for (let i = 1; i <= 100; i++) {
    const id = `hr-q${i}`;
    fullList.push({
      id,
      title: i === 1 ? "휴일에 근무하면 무조건 보상휴가로 처리해야 하나요?" : 
             i === 2 ? "휴일대체 동의서를 근로자 개인별로 매번 받아야 하나요?" :
             i === 3 ? "1년 미만 신입사원의 연차 발생 기준이 헷갈려요." :
             i === 4 ? "수습기간 중 해고 통보, 당일 통보도 가능한가요?" :
             i === 5 ? "포괄임금제 도입 시 반드시 포함해야 할 항목이 있나요?" :
             `인사/총무 실무 지식 속삭임 #${i}`,
      text: `인사 및 노무 실무에서 발생하는 전문가들의 고민 #${i}에 대한 조언을 구합니다. 법적 리스크 관리와 효율적인 인사 행정 프로세스에 대한 인사이트를 공유해 주세요.`,
      nickname: `인사전문가_${i}`,
      userId: `mock-u${i}`,
      userRole: "member",
      viewCount: Math.floor(Math.random() * 500) + 100,
      answerCount: mockAnswerIds.has(id) ? 1 : 0,
      createdAt: 1714521600000 - i * 3600000,
      category: "인사전략/HRM"
    });
  }

  // 2. HRD/조직문화 100건 생성 (cul-q1 ~ cul-q100)
  for (let i = 1; i <= 100; i++) {
    const id = `cul-q${i}`;
    fullList.push({
      id,
      title: i === 1 ? "임원과의 타운홀 미팅에서 익명 질문 방식이 효과적인가요?" :
             i === 100 ? "앞으로 HRD 담당자에게 가장 중요해질 역량은 무엇인가요?" :
             i % 2 === 0 ? `조직문화 및 EVP 강화 전략 #${i}` : `HRD 커리큘럼 설계 및 교육 평가 #${i}`,
      text: `구성원 몰입도 향상과 핵심가치 내재화 #${i}에 대한 실무 노하우를 공유해 주세요. 최신 트렌드를 반영한 교육 솔루션 제안도 환영합니다.`,
      nickname: `문화리더_${i}`,
      userId: `mock-c${i}`,
      userRole: "member",
      viewCount: Math.floor(Math.random() * 400) + 200,
      answerCount: mockAnswerIds.has(id) ? 1 : 0,
      createdAt: 1714881600000 - i * 3600000,
      category: i % 2 === 0 ? "조직문화/EVP" : "HRD/교육"
    });
  }

  return fullList.sort((a, b) => b.createdAt - a.createdAt);
};

const MOCK_QUESTIONS = generateFullMockQuestions();
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
  const [activeTab, setActiveTab] = useState<"all" | "hrm" | "hrd" | "culture" | "popular" | "waiting">("all")
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
    const dbData = questionsData || [];
    const merged = [...dbData];
    
    MOCK_QUESTIONS.forEach(mq => {
      if (!merged.some(dq => dq.id === mq.id)) {
        merged.push(mq);
      }
    });

    return merged.sort((a, b) => b.createdAt - a.createdAt);
  }, [questionsData])

  const answersQuery = useMemoFirebase(() => {
    if (!db || !selectedQuestionId) return null
    return query(collection(db, "questions", selectedQuestionId, "answers"), orderBy("createdAt", "desc"))
  }, [db, selectedQuestionId])
  const { data: answersData } = useCollection<Answer>(answersQuery)
  
  const answers = useMemo(() => {
    const fetched = answersData || []
    if (fetched.length === 0) {
      return MOCK_ANSWERS.filter(a => a.questionId === selectedQuestionId) || []
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
    else if (activeTab === "hrm") result = result.filter(q => q.category === "인사전략/HRM");
    else if (activeTab === "hrd") result = result.filter(q => q.category === "HRD/교육");
    else if (activeTab === "culture") result = result.filter(q => q.category === "조직문화/EVP");
    
    return result
  }, [questions, searchQuery, activeTab])

  const paginatedQuestions = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE
    return filteredQuestions.slice(start, start + ITEMS_PER_PAGE)
  }, [filteredQuestions, currentPage])

  const totalPages = Math.ceil(filteredQuestions.length / ITEMS_PER_PAGE)

  useEffect(() => {
    setCurrentPage(1)
    setSelectedQuestionId(null)
  }, [searchQuery, activeTab])

  const handleAddQuestion = (nickname: string, title: string, text: string, imageUrl?: string, videoUrl?: string, category?: string) => {
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
      if (db && !id.startsWith("hr-") && !id.startsWith("cul-")) {
        updateDocumentNonBlocking(doc(db, "questions", id), { viewCount: increment(1) });
      }
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
                {[
                  { id: "all", label: "전체 피드" },
                  { id: "hrm", label: "인사/총무" },
                  { id: "hrd", label: "HRD/교육" },
                  { id: "culture", label: "조직문화" },
                  { id: "popular", label: "실시간 인기" },
                  { id: "waiting", label: "답변 대기" }
                ].map(tab => (
                  <button 
                    key={tab.id} 
                    onClick={() => setActiveTab(tab.id as any)} 
                    className={cn(
                      "text-sm md:text-base pb-3 transition-all border-b-2 -mb-[1px]", 
                      activeTab === tab.id ? "font-black text-primary border-accent" : "font-bold text-primary/20 border-transparent hover:text-primary"
                    )}
                  >
                    {tab.label}
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
                <div className="flex flex-col items-center gap-6 mt-12 pb-20">
                  <div className="flex justify-center items-center gap-1">
                    <Button variant="ghost" size="icon" disabled={currentPage === 1} onClick={() => setCurrentPage(1)} className="rounded-xl text-primary/40"><ChevronsLeft className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="icon" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="rounded-xl text-primary/40"><ChevronLeft className="w-5 h-5" /></Button>
                    
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter(page => page >= currentPage - 2 && page <= currentPage + 2)
                      .map(page => (
                        <Button 
                          key={page} 
                          onClick={() => setCurrentPage(page)} 
                          className={cn(
                            "w-10 h-10 rounded-xl font-black text-sm transition-all", 
                            currentPage === page ? "bg-primary text-accent shadow-lg scale-110" : "bg-white text-primary/20 shadow-sm hover:bg-primary/5"
                          )}
                        >
                          {page}
                        </Button>
                      ))}
                    
                    <Button variant="ghost" size="icon" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} className="rounded-xl text-primary/40"><ChevronRight className="w-5 h-5" /></Button>
                    <Button variant="ghost" size="icon" disabled={currentPage === totalPages} onClick={() => setCurrentPage(totalPages)} className="rounded-xl text-primary/40"><ChevronsRight className="w-4 h-4" /></Button>
                  </div>
                  <p className="text-[10px] font-black text-primary/20 uppercase tracking-widest">
                    Page {currentPage} of {totalPages} — Total {filteredQuestions.length} Insights
                  </p>
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
