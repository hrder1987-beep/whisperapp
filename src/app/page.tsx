
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

const HRM_TOPICS = [
  { title: "포괄임금제 도입 시 반드시 포함해야 할 항목", text: "계약서에 연장/야간/휴일수당을 각각 몇 시간분인지 명시해야 실무적으로 안전한가요?" },
  { title: "1년 미만 신입사원의 연차 발생 기준", text: "매달 개근 시 발생하는 1일의 휴가와 1년 시점의 15개 발생 시점이 헷갈리네요." },
  { title: "수습기간 당일 해고 통보 리스크", text: "3개월 미만이면 해고예고 예외라는데, 부당해고 구제신청 가능성은 어떤가요?" },
  { title: "휴일 근무 보상휴가제 도입 절차", text: "현금 지급 대신 휴가로 대체하고 싶은데 근로자대표 합의만으로 충분한지 궁금합니다." },
  { title: "유연근무제 도입 시 근태 관리 팁", text: "시차출퇴근제를 도입하려니 협업 시간 확보가 고민입니다. 다들 코어타임 어떻게 설정하시나요?" },
  { title: "징계위원회 소명 기회 부여 시 주의사항", text: "중대한 과실이라도 절차상 하자 방지를 위해 서면 통보 기간은 엄수해야겠죠?" },
  { title: "소규모 기업 임금명세서 교부 자동화", text: "교부 의무화 이후 업무량이 너무 늘었습니다. 효율적인 자동화 툴 추천 부탁드립니다." },
  { title: "퇴직금 DC형 전환 시 유의할 점", text: "DB에서 DC로 전환하려는 인원이 많은데 정산 시점의 기준 임금을 어떻게 잡으시나요?" },
  { title: "중대재해처벌법 대비 사무직 사업장", text: "사무직만 있는 지사에서도 챙겨야 할 필수 서류와 점검 리스트가 있을까요?" },
  { title: "법정의무교육 미이수자 효과적 독촉", text: "메일 공지만으로는 한계가 있네요. 이수율 높이는 기발한 방법 공유 부탁드립니다." },
  { title: "취업규칙 변경 시 불이익 변경 판단", text: "복지 제도를 일부 축소하고 다른 쪽을 보강하려는데 전체적인 불이익 여부 판단 기준은?" },
  { title: "육아휴직 복직자 인사고과 기준", text: "복직 후 평가 기간이 짧을 때 평균 등급을 부여하는 게 일반적인가요?" },
  { title: "비정규직 무기계약직 전환 프로세스", text: "2년 도래 시점에서 직무 역량 평가를 통해 선별 전환하는 사례가 있는지 궁금합니다." },
  { title: "사내 카페테리아 포인트 운영 묘수", text: "포인트 소진율을 높이고 만족도를 끌어올릴 만한 제휴처나 운영 팁이 있을까요?" },
  { title: "경조사비 지급 규정의 최신 트렌드", text: "최근 물가 상승을 반영해 결혼/조의금 액수를 상향하는 추세인지 알고 싶습니다." }
];

const HRD_TOPICS = [
  { title: "임원 타운홀 미팅 익명 질문의 효과", text: "익명 툴을 쓰면 분위기는 좋아지는데 간혹 공격적인 질문이 나와 고민입니다." },
  { title: "신입사원 온보딩 '소속감' 강화 활동", text: "조기 퇴사를 막기 위한 우리 회사만의 특별한 웰컴 키트나 루틴이 있나요?" },
  { title: "사내 강사 양성 및 보상 체계", text: "전문성을 갖춘 실무자를 강사로 세울 때 강의료 외에 어떤 동기부여를 하시나요?" },
  { title: "핵심가치 내재화 워크숍 게임 아이디어", text: "지루한 주입식 교육 말고 즐겁게 가치를 체득할 수 있는 액티비티 추천 바랍니다." },
  { title: "팀 내 심리적 안전감 구축 루틴", text: "리더가 회의 시작 전 가볍게 던질 수 있는 체크인 질문 리스트가 있을까요?" },
  { title: "교육 ROI 측정의 현실적인 지표", text: "단순 설문 만족도 말고 실제 실무 성과로 연결되는 정량적 지표는 무엇이 있을까요?" },
  { title: "최신 리더십 역량 모델링 트렌드", text: "전통적 리더십에서 '코칭'과 '데이터 리터러시'로 비중이 옮겨가는 것 같습니다." },
  { title: "사내 독서 동아리 활성화 장치", text: "지원금만 주면 흐지부지되는데, 지속 가능한 학습 문화를 만드는 팁이 있나요?" },
  { title: "JD 기반 역량 평가 도입의 한계", text: "직무별 평가 항목을 세밀하게 짜도 실제 운영 시 점수가 쏠리는 현상은 어떻게 막나요?" },
  { title: "에듀테크 AI 튜터 도입 검토", text: "LMS에 AI 기능을 입혔을 때 실제 구성원들이 유용하다고 느끼는지 궁금합니다." },
  { title: "직무 순환(Job Rotation) 성공 사례", text: "강제로 옮기기보다 본인 희망을 반영한 직무 전환의 성공적인 운영 모델이 있을까요?" },
  { title: "멘토링 프로그램 매칭 실패 대응", text: "멘토-멘티 성향이 너무 안 맞을 때 중간에 조정해주는 프로세스가 필요한가요?" },
  { title: "팀장급 다면평가 피드백 방식", text: "결과지를 그냥 전달하는 것보다 1:1 코칭 세션을 병행하는 게 훨씬 효과적일까요?" },
  { title: "조직문화 진단 툴 선택 기준", text: "외부 업체를 쓸지 자체 설문을 돌릴지 고민입니다. 진단의 목적에 따른 차이는?" },
  { title: "퇴사자 면담(Exit Interview) 활용", text: "퇴사 이유를 솔직하게 듣고 조직 개선에 반영한 실제 사례가 있는지 궁금합니다." }
];

const EXPERT_NICKNAMES = ["인사마스터", "노무의신", "컬처디렉터", "HRBP", "교육전문가", "채용빌런", "보상전문가", "조직심리사", "인사전략가", "피플팀장"];

const generateFullMockQuestions = () => {
  const fullList: Question[] = [];
  const mockAnswerIds = new Set((mockData.answers as any[]).map(a => a.questionId));
  
  for (let i = 1; i <= 100; i++) {
    const id = `hr-q${i}`;
    const topic = HRM_TOPICS[(i - 1) % HRM_TOPICS.length];
    const nickname = EXPERT_NICKNAMES[i % EXPERT_NICKNAMES.length];
    fullList.push({
      id,
      title: topic.title,
      text: topic.text,
      nickname,
      userId: `mock-u${i}`,
      userRole: "member",
      viewCount: 100 + (i * 3),
      answerCount: mockAnswerIds.has(id) ? 1 : 0,
      createdAt: 1714521600000 - i * 3600000,
      category: "인사전략/HRM"
    });
  }

  for (let i = 1; i <= 100; i++) {
    const id = `cul-q${i}`;
    const topic = HRD_TOPICS[(i - 1) % HRD_TOPICS.length];
    const nickname = EXPERT_NICKNAMES[(i + 5) % EXPERT_NICKNAMES.length];
    fullList.push({
      id,
      title: topic.title,
      text: topic.text,
      nickname,
      userId: `mock-c${i}`,
      userRole: "member",
      viewCount: 200 + (i * 2),
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
