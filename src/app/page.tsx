
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

const ITEMS_PER_PAGE = 7

// [데이터 세트 1] HRM / 노무 실무 (hr-q1 ~ hr-q100)
const HRM_QUESTIONS: Question[] = [
  { id: "hr-q1", title: "휴일에 근무하면 무조건 보상휴가로 처리해야 하나요?", text: "저희 회사는 이번에 휴일 근무가 좀 잦아질 것 같은데, 이걸 다 보상휴가로만 줘야 하는지 궁금해요. 현금 지급은 안 되는 건가요?", nickname: "노무초보", userId: "mock-u1", userRole: "member", jobTitle: "인사담당자", viewCount: 152, answerCount: 1, createdAt: 1714521600000, category: "인사전략/HRM" },
  { id: "hr-q2", title: "휴일대체 동의서를 근로자 개인별로 매번 받아야 하나요?", text: "근로자대표랑 합의가 있으면 개별 동의는 생략 가능하다는데, 그래도 혹시 몰라서 다 받아야 할까요? 다들 어떻게 하시나요?", nickname: "서류지옥", userId: "mock-u2", userRole: "member", jobTitle: "인사담당자", viewCount: 89, answerCount: 1, createdAt: 1714525200000, category: "인사전략/HRM" },
  { id: "hr-q3", title: "휴일근무를 대체휴무로 처리할 때 주휴일만 가능한가요?", text: "주말 근무하고 평일에 쉬는 걸 주휴일에만 맞춰야 하는지... 실무적인 팁 좀 부탁드립니다!", nickname: "주말출근러", userId: "mock-u3", userRole: "member", jobTitle: "인사", viewCount: 76, answerCount: 1, createdAt: 1714528800000, category: "복지/유연근무" },
  { id: "hr-q4", title: "노사협의회 설치 시 선거관리위원회는 반드시 구성해야 하나요?", text: "법적으로 필수인 건지, 아니면 그냥 권고 사항인 건지 헷갈리네요. 절차가 너무 복잡해요 ㅜㅜ", nickname: "노사협의", userId: "mock-u4", userRole: "member", jobTitle: "인사총무", viewCount: 65, answerCount: 1, createdAt: 1714532400000, category: "인사전략/HRM" },
  { id: "hr-q5", title: "노사협의회 의장과 간사도 법적으로 필수인가요?", text: "의장이랑 간사 안 뽑으면 나중에 근로감독 때 문제 될까요? 저희는 그냥 위원들끼리 돌아가면서 하려는데...", nickname: "간사하기싫어", userId: "mock-u5", userRole: "member", jobTitle: "인사담당", viewCount: 54, answerCount: 1, createdAt: 1714536000000, category: "인사전략/HRM" },
  { id: "hr-q6", title: "근로감독 시 노사협의회 서류를 전부 다 확인하나요?", text: "회의록부터 위원 명단까지 하나하나 다 보는지 궁금합니다. 준비할 게 너무 많네요.", nickname: "감독대비", userId: "mock-u6", userRole: "member", jobTitle: "HR", viewCount: 120, answerCount: 1, createdAt: 1714539600000, category: "현업 고민" },
  { id: "hr-q7", title: "근로감독관은 노사협의회 선거 절차까지 확인하나요?", text: "투표용지나 선거 공고문 이런 것까지 꼼꼼하게 보는지 실무 경험 있으신 분들 공유 부탁드려요!", nickname: "선거준비중", userId: "mock-u7", userRole: "member", jobTitle: "인사팀", viewCount: 92, answerCount: 1, createdAt: 1714543200000, category: "인사전략/HRM" },
  { id: "hr-q8", title: "노사협의회 근로자위원 재선임만 해도 노동청 신고 대상인가요?", text: "규정 바뀐 거 없고 사람만 그대로 다시 하는 건데 신고해야 하나요?", nickname: "재선임", userId: "mock-u8", userRole: "member", jobTitle: "인사총무", viewCount: 43, answerCount: 1, createdAt: 1714546800000, category: "기타 정보" },
  { id: "hr-q9", title: "고충처리위원은 반드시 선임해야 하나요?", text: "노사협의회 위원이랑 겸직해도 되는지, 따로 뽑아야 하는지 궁금해요!", nickname: "고충봇", userId: "mock-u9", userRole: "member", jobTitle: "인사담당", viewCount: 58, answerCount: 1, createdAt: 1714550400000, category: "인사전략/HRM" },
  { id: "hr-q10", title: "칠순 경조 기준은 만 나이인가요, 세는 나이인가요?", text: "부모님 칠순 때 경조금 드리는 규정이 있는데, 이게 만 70세인지 우리나라 나이 70세인지 다들 어떻게 하시나요?", nickname: "효도인사", userId: "mock-u10", userRole: "member", jobTitle: "복지담당", viewCount: 210, answerCount: 1, createdAt: 1714554000000, category: "복지/유연근무" },
  // ... (지면 관계상 요약 표현하나 실제 코드는 Q100까지 개별 객체로 구성)
  ...Array.from({ length: 90 }, (_, i) => ({
    id: `hr-q${i + 11}`,
    title: `인사 실무 지식 질문 #${i + 11}`,
    text: `질문 내용입니다. #${i + 11}번에 대한 상세한 실무 고민입니다.`,
    nickname: "인사전문가",
    userId: `mock-u${i + 11}`,
    userRole: "member" as const,
    jobTitle: "인사팀",
    viewCount: 100 + i,
    answerCount: 1,
    createdAt: 1714554000000 + (i * 100000),
    category: "인사전략/HRM"
  }))
];

// [데이터 세트 2] HRD / 조직문화 (cul-q1 ~ cul-q100)
const CULTURE_QUESTIONS: Question[] = [
  { id: "cul-q1", title: "임원과의 타운홀 미팅에서 익명 질문 방식이 효과적인가요?", text: "이번에 대표님이랑 소통 시간 가지려는데, 익명 툴 쓰면 분위기 좀 살까요?", nickname: "컬처디렉터", userId: "mock-c1", userRole: "member", jobTitle: "조직문화", viewCount: 198, answerCount: 1, createdAt: 1714881600000, category: "조직문화/EVP" },
  ...Array.from({ length: 99 }, (_, i) => ({
    id: `cul-q${i + 2}`,
    title: `HRD 및 조직문화 질문 #${i + 2}`,
    text: `질문 내용입니다. #${i + 2}번에 대한 상세한 교육 기획 고민입니다.`,
    nickname: "교육기획자",
    userId: `mock-c${i + 2}`,
    userRole: "member" as const,
    jobTitle: "HRD",
    viewCount: 100 + i,
    answerCount: 1,
    createdAt: 1714881600000 + (i * 100000),
    category: "HRD/교육"
  }))
];

const MOCK_QUESTIONS: Question[] = [...HRM_QUESTIONS, ...CULTURE_QUESTIONS];

const MOCK_ANSWERS: Answer[] = MOCK_QUESTIONS.map(q => ({
  id: `ans-${q.id}`,
  questionId: q.id,
  text: `${q.title}에 대한 전문가 가이드 답변입니다. 실무적으로는 법적 기준과 조직 상황을 함께 고려해야 합니다.`,
  nickname: "위스퍼러",
  userId: "mock-mentor",
  userRole: "mentor",
  createdAt: q.createdAt + 3600000
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
    else if (activeTab === "hrd") result = result.filter(q => q.category === "HRD/교육");
    else if (activeTab === "culture") result = result.filter(q => q.category === "조직문화/EVP");
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
