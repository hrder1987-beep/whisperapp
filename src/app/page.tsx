
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

// 실무 느낌을 주는 다양한 주제 리스트
const HRM_TOPICS = [
  { title: "포괄임금제 도입 시 반드시 포함해야 할 항목이 있나요?", text: "이번에 포괄임금제를 도입하려고 하는데, 계약서에 연장/야간/휴일수당을 각각 몇 시간분인지 명시해야 하는지 궁금합니다." },
  { title: "1년 미만 신입사원의 연차 발생 기준이 헷갈려요.", text: "입사하고 11개월 동안은 매달 개근 시 1일씩 생기는 건 알겠는데, 1년이 되는 시점에는 총 몇 개가 되는 건가요?" },
  { title: "수습기간 중 해고 통보, 당일 통보도 가능한가요?", text: "수습 기간에는 3개월 안됐으면 당일 해고해도 법적으로 문제가 없다는 말이 있던데, 실무적으로 리스크는 없는지 궁금합니다." },
  { title: "휴일에 근무하면 무조건 보상휴가로 처리해야 하나요?", text: "저희 회사는 이번에 휴일 근무가 좀 잦아질 것 같은데, 이걸 다 보상휴가로만 줘야 하는지 현금 지급은 안 되는 건가요?" },
  { title: "유연근무제(시차출퇴근) 도입 시 근태 체크 방법", text: "시차출퇴근제를 전사 도입하려고 합니다. 근태 관리 솔루션 없이 엑셀로만 관리하기엔 한계가 있는데 다들 어떻게 하시나요?" },
  { title: "징계위원회 절차 준수 시 유의사항", text: "중대한 과실을 저지른 직원에 대해 징계위원회를 열려고 합니다. 소명 기회 부여 등 절차상 하자 방지를 위한 팁이 있을까요?" },
  { title: "임금명세서 의무화 이후 소규모 기업 대응", text: "소규모 스타트업인데 임금명세서 교부가 의무화되면서 업무량이 너무 늘었습니다. 효율적인 자동화 툴이 있을까요?" },
  { title: "퇴직금 정산 및 DC형 전환 시기", text: "DB형에서 DC형으로 전환하려는 직원이 많습니다. 퇴직금 중간정산 이슈와 겹치는데 어떤 시점이 가장 유리할까요?" },
  { title: "중대재해처벌법 대비 총무 가이드", text: "인사팀에서 총무 업무를 겸하고 있는데 중대재해처벌법 관련해서 사무직 위주 사업장도 챙겨야 할 서류가 많나요?" },
  { title: "법정의무교육 미이수자 독촉 방법", text: "매년 법정의무교육 이수율 때문에 스트레스네요. 메일로만 독촉하는 것 외에 효과적인 방법이 있을까요?" }
];

const HRD_TOPICS = [
  { title: "임원과의 타운홀 미팅에서 익명 질문 방식이 효과적인가요?", text: "이번에 대표님이랑 소통 시간 가지려는데, 익명 툴 쓰면 분위기 좀 살까요? 다들 어떤 툴 쓰시는지 궁금해요." },
  { title: "신입사원 온보딩 프로그램 구성 제언", text: "MZ세대 신입사원들이 조기 퇴사하는 경우가 잦아 온보딩을 전면 개편하려고 합니다. '소속감'을 높이는 핵심 활동은 뭐가 있을까요?" },
  { title: "사내 강사 양성 과정, 어떻게 운영하시나요?", text: "외부 강사료 부담이 커서 사내 전문가를 양성하려 합니다. 강의 스킬 외에 어떤 보상을 주는 것이 가장 효과적일까요?" },
  { title: "핵심가치 내재화 워크숍 아이디어 공유", text: "기존의 주입식 교육에서 벗어나 재미있게 핵심가치를 공유할 수 있는 게임이나 워크숍 프로그램 추천 부탁드립니다." },
  { title: "심리적 안전감(Psychological Safety) 구축 사례", text: "팀 내에서 자유로운 의견 공유가 안 되는 것 같습니다. 리더들이 실천할 수 있는 가벼운 루틴이 있을까요?" },
  { title: "교육 ROI(투자 대비 효과) 측정의 한계", text: "교육을 해도 현업 적용도가 낮은 것 같아 고민입니다. 단순 설문 외에 실무 성과를 측정할 수 있는 지표가 있을까요?" },
  { title: "리더십 역량 모델링 최신 트렌드", text: "기존의 리더십 역량이 너무 고루해서 새로 정의하려 합니다. 최근에는 '코칭'과 '데이터' 중 어디에 더 비중을 두시나요?" },
  { title: "사내 독서 모임이나 학습 동아리 지원 제도", text: "자발적 학습 문화를 만들고 싶은데, 지원금 외에 동기부여가 될 만한 장치가 뭐가 있을까요?" },
  { title: "직무 기술서(JD) 기반 역량 평가 도입", text: "직무별로 평가 항목을 세분화하려고 합니다. JD 업데이트 주기를 어떻게 가져가야 실효성이 있을까요?" },
  { title: "에듀테크 도입 시 유의할 점", text: "LMS 고도화나 AI 튜터 도입을 검토 중입니다. 기술적인 부분 외에 실제 구성원들의 사용률을 높이는 전략이 궁금합니다." }
];

const generateFullMockQuestions = () => {
  const fullList: Question[] = [];
  const mockAnswerIds = new Set((mockData.answers as any[]).map(a => a.questionId));
  
  // 1. 인사/총무 (HRM) 100건 생성
  for (let i = 1; i <= 100; i++) {
    const id = `hr-q${i}`;
    const topic = HRM_TOPICS[(i - 1) % HRM_TOPICS.length];
    fullList.push({
      id,
      title: topic.title,
      text: topic.text,
      nickname: `인사전문가`,
      userId: `mock-u${i}`,
      userRole: "member",
      viewCount: Math.floor(Math.random() * 500) + 100,
      answerCount: mockAnswerIds.has(id) ? 1 : 0,
      createdAt: 1714521600000 - i * 3600000,
      category: "인사전략/HRM"
    });
  }

  // 2. HRD/조직문화 100건 생성
  for (let i = 1; i <= 100; i++) {
    const id = `cul-q${i}`;
    const topic = HRD_TOPICS[(i - 1) % HRD_TOPICS.length];
    fullList.push({
      id,
      title: topic.title,
      text: topic.text,
      nickname: `문화리더`,
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
    return [
      {
        id: "default-1",
        title: "HR실무자들의\n품격 있는 속삭임",
        description: "교육부터 조직문화 인사전략까지\nHR실무자를 위한 지식 허브 Whisper",
        image: "https://images.unsplash.com/photo-1521737711867-e3b97375f902?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
        badge: "집단 지성의 힘"
      }
    ]
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
                      .filter(page => {
                        // 페이지네이션 숫자 노출 로직 개선 (1 2 3 ... 29)
                        if (page === 1 || page === totalPages) return true;
                        return page >= currentPage - 2 && page <= currentPage + 2;
                      })
                      .map((page, idx, arr) => {
                        const showEllipsis = idx > 0 && page !== arr[idx - 1] + 1;
                        return (
                          <div key={page} className="flex items-center">
                            {showEllipsis && <span className="px-2 text-primary/20">...</span>}
                            <Button 
                              onClick={() => setCurrentPage(page)} 
                              className={cn(
                                "w-10 h-10 rounded-xl font-black text-sm transition-all", 
                                currentPage === page ? "bg-primary text-accent shadow-lg scale-110" : "bg-white text-primary/20 shadow-sm hover:bg-primary/5"
                              )}
                            >
                              {page}
                            </Button>
                          </div>
                        );
                      })}
                    
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
