
"use client"

import { useState, useMemo, useEffect, useDeferredValue, Suspense } from "react"
import { Header } from "@/components/chuchot/Header"
import { MainBanner, BannerData } from "@/components/chuchot/MainBanner"
import { SubmissionForm } from "@/components/chuchot/SubmissionForm"
import { QuestionFeed } from "@/components/chuchot/QuestionFeed"
import { RankingList } from "@/components/chuchot/RankingList"
import { AldiChat } from "@/components/chuchot/ShuChat"
import { PremiumAds } from "@/components/chuchot/PremiumAds"
import { Question, Answer, TrainingProgram, Instructor, JobListing, PremiumAd } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Sparkles, ChevronsLeft, ChevronsRight, Search, FileText, GraduationCap, User, Briefcase, ArrowRight } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { generateAiReply } from "@/ai/flows/generate-ai-reply-flow"
import { cn } from "@/lib/utils"
import { useFirestore, useCollection, useDoc, useMemoFirebase, addDocumentNonBlocking, updateDocumentNonBlocking, useUser } from "@/firebase"
import { collection, query, orderBy, doc, increment } from "firebase/firestore"
import mockData from "@/lib/mock-data.json"
import Link from "next/link"
import { useSearchParams } from "next/navigation"

const ITEMS_PER_PAGE = 7

const generateMocks = () => {
  const list: Question[] = [];
  const mockAnswerIds = new Set((mockData.answers as any[]).map(a => a.questionId));
  
  const HRM_TOPICS = [
    { title: "포괄임금제 도입 시 필수 항목", text: "연장/야간/휴일수당을 계약서에 어떻게 명시해야 리스크가 없을까요?" },
    { title: "1년 미만 사원 연차 발생 기준", text: "매달 개근 시 1일과 1년 시점 15개가 합산되는 과정이 궁금합니다." }
  ];
  const HRD_TOPICS = [
    { title: "타운홀 미팅 익명 질문의 효과", text: "익명 툴 사용 시 공격적인 질문에 대한 대처 방안이 있을까요?" },
    { title: "신입사원 온보딩 소속감 강화 활동", text: "조기 퇴사를 막기 위한 우리 회사만의 특별한 루틴을 추천해주세요." }
  ];
  const EXPERT_NICKNAMES = ["인사마스터", "노무의신", "컬처디렉터", "HRBP"];

  for (let i = 1; i <= 200; i++) {
    const isHrm = i <= 100;
    const topics = isHrm ? HRM_TOPICS : HRD_TOPICS;
    const topic = topics[(i - 1) % topics.length];
    const id = isHrm ? `hr-q${i}` : `cul-q${i - 100}`;
    
    list.push({
      id,
      title: topic.title,
      text: topic.text,
      nickname: EXPERT_NICKNAMES[i % EXPERT_NICKNAMES.length],
      userId: `mock-user-${i}`,
      userRole: "member",
      viewCount: 100 + i,
      answerCount: mockAnswerIds.has(id) ? 1 : 0,
      createdAt: 1714521600000 - (i * 3600000),
      category: isHrm ? "인사전략/HRM" : (i % 2 === 0 ? "조직문화/EVP" : "HRD/교육")
    });
  }
  return list;
};

const MOCK_QUESTIONS = generateMocks();

function HomePageContent() {
  const { user } = useUser()
  const db = useFirestore()
  const { toast } = useToast()
  const searchParams = useSearchParams()
  
  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "")
  const deferredSearchQuery = useDeferredValue(searchQuery)
  
  const [activeTab, setActiveTab] = useState<"all" | "hrm" | "hrd" | "culture" | "popular" | "waiting">("all")
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)

  const questionsQuery = useMemoFirebase(() => db ? query(collection(db, "questions"), orderBy("createdAt", "desc")) : null, [db])
  const programsQuery = useMemoFirebase(() => db ? query(collection(db, "trainingPrograms"), orderBy("createdAt", "desc")) : null, [db])
  const instructorsQuery = useMemoFirebase(() => db ? query(collection(db, "instructors"), orderBy("createdAt", "desc")) : null, [db])
  const jobsQuery = useMemoFirebase(() => db ? query(collection(db, "jobs"), orderBy("createdAt", "desc")) : null, [db])

  const { data: dbQuestions } = useCollection<Question>(questionsQuery)
  const { data: dbPrograms } = useCollection<TrainingProgram>(programsQuery)
  const { data: dbInstructors } = useCollection<Instructor>(instructorsQuery)
  const { data: dbJobs } = useCollection<JobListing>(jobsQuery)

  const configDocRef = useMemoFirebase(() => db ? doc(db, "admin_configuration", "site_settings") : null, [db])
  const { data: config } = useDoc<any>(configDocRef)

  const aldiDocRef = useMemoFirebase(() => db ? doc(db, "admin_configuration", "aldi_knowledge") : null, [db])
  const { data: aldiConfig } = useDoc<any>(aldiDocRef)

  const questions = useMemo(() => {
    const merged = [...(dbQuestions || [])];
    const existingIds = new Set(merged.map(q => q.id));
    
    MOCK_QUESTIONS.forEach(mq => {
      if (!existingIds.has(mq.id)) {
        merged.push(mq);
      }
    });
    
    return merged.sort((a, b) => b.createdAt - a.createdAt);
  }, [dbQuestions])

  const searchResults = useMemo(() => {
    if (!deferredSearchQuery) return null;
    const q = deferredSearchQuery.toLowerCase();

    return {
      questions: questions.filter(item => 
        (item.title && item.title.toLowerCase().includes(q)) || 
        (item.text && item.text.toLowerCase().includes(q))
      ),
      programs: (dbPrograms || []).filter(item => 
        (item.title && item.title.toLowerCase().includes(q)) || 
        (item.instructorName && item.instructorName.toLowerCase().includes(q))
      ),
      instructors: (dbInstructors || []).filter(item => 
        (item.name && item.name.toLowerCase().includes(q)) || 
        (item.specialty && item.specialty.toLowerCase().includes(q))
      ),
      jobs: (dbJobs || []).filter(item => 
        (item.title && item.title.toLowerCase().includes(q)) || 
        (item.companyName && item.companyName.toLowerCase().includes(q))
      )
    };
  }, [questions, dbPrograms, dbInstructors, dbJobs, deferredSearchQuery]);

  const banners = useMemo(() => {
    if (config?.bannerSettings) {
      try { return JSON.parse(config.bannerSettings) as BannerData[] } catch (e) { return [] }
    }
    return [
      {
        id: "def-1",
        title: "HR실무자들의\n품격 있는 속삭임",
        description: "교육부터 조직문화 인사전략까지\nHR실무자를 위한 지식 허브 Whisper",
        image: "https://images.unsplash.com/photo-1521737711867-e3b97375f902?q=80&w=1080",
        badge: "집단 지성의 힘"
      },
      {
        id: "def-2",
        title: "고민을 나누고,\n함께 성장하자",
        description: "우리의 작은 속삭임이 모여\n내일을 바꾸는 큰 울림으로 돌아옵니다.",
        image: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=1080",
        badge: "교학상장의 장"
      }
    ]
  }, [config])

  const premiumAds = useMemo(() => {
    if (config?.premiumAdsSettings) {
      try { return JSON.parse(config.premiumAdsSettings) as PremiumAd[] } catch (e) { return [] }
    }
    return [
      { id: "ad1", title: "HR 전문가를 위한\n커리어 엑셀러레이팅", badge: "SPECIAL EVENT", webImage: "https://images.unsplash.com/photo-1552664730-d307ca884978?q=80&w=400", mobileImage: "https://images.unsplash.com/photo-1552664730-d307ca884978?q=80&w=400", link: "#" },
      { id: "ad2", title: "조직문화 진단 툴킷\n무료 체험 신청하기", badge: "PARTNER", webImage: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=400", mobileImage: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=400", link: "#" },
      { id: "ad3", title: "AI 기반 자동 채용\n어시스턴트 도입 가이드", badge: "NEW SOLUTION", webImage: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?q=80&w=400", mobileImage: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?q=80&w=400", link: "#" }
    ]
  }, [config])

  const answersQuery = useMemoFirebase(() => {
    if (!db || !selectedId) return null
    return query(collection(db, "questions", selectedId, "answers"), orderBy("createdAt", "desc"))
  }, [db, selectedId])
  const { data: dbAnswers } = useCollection<Answer>(answersQuery)
  
  const answers = useMemo(() => {
    return dbAnswers?.length ? dbAnswers : (mockData.answers as any[]).filter(a => a.questionId === selectedId);
  }, [dbAnswers, selectedId])

  const filtered = useMemo(() => {
    if (deferredSearchQuery) return searchResults?.questions || [];
    
    let res = [...questions]
    if (activeTab === "hrm") res = res.filter(q => q.category === "인사전략/HRM");
    if (activeTab === "hrd") res = res.filter(q => q.category === "HRD/교육");
    if (activeTab === "culture") res = res.filter(q => q.category === "조직문화/EVP");
    if (activeTab === "popular") res.sort((a, b) => b.viewCount - a.viewCount);
    if (activeTab === "waiting") res = res.filter(q => q.answerCount === 0);
    return res
  }, [questions, deferredSearchQuery, activeTab, searchResults])

  const paginated = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE
    return filtered.slice(start, start + ITEMS_PER_PAGE)
  }, [filtered, currentPage])

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE)

  useEffect(() => { setCurrentPage(1); setSelectedId(null); }, [deferredSearchQuery, activeTab])

  useEffect(() => {
    const search = searchParams.get("search")
    if (search) setSearchQuery(search)
  }, [searchParams])

  const handleAddQuestion = (nickname: string, title: string, text: string, imageUrl?: string, videoUrl?: string, category?: string) => {
    if (!db || !user) return;
    addDocumentNonBlocking(collection(db, "questions"), {
      title, text, nickname, userId: user.uid, category: category || "기타",
      viewCount: 0, answerCount: 0, createdAt: Date.now(), imageUrl: imageUrl || null, videoUrl: videoUrl || null
    }).then(ref => {
      if (ref) {
        generateAiReply({ 
          title, 
          text, 
          instruction: aldiConfig?.autoReplyInstruction 
        }).then(res => {
          addDocumentNonBlocking(collection(db, "questions", ref.id, "answers"), {
            questionId: ref.id, text: res.replyText, nickname: "알디", userId: "ai", createdAt: Date.now()
          });
          updateDocumentNonBlocking(doc(db, "questions", ref.id), { answerCount: 1 });
        });
      }
    });
  }

  const handleAddAnswer = (nickname: string, title: string, text: string) => {
    if (!db || !selectedId || !user) return;
    const question = questions.find(q => q.id === selectedId);
    
    addDocumentNonBlocking(collection(db, "questions", selectedId, "answers"), {
      questionId: selectedId, text, nickname, userId: user.uid, createdAt: Date.now()
    }).then(() => {
      // 본인이 아닌 경우에만 알림 발송
      if (question && question.userId !== user.uid) {
        addDocumentNonBlocking(collection(db, "notifications"), {
          userId: question.userId,
          type: "new_answer",
          questionId: selectedId,
          questionTitle: question.title,
          senderNickname: nickname,
          createdAt: Date.now(),
          isRead: false
        })
      }
    });
    updateDocumentNonBlocking(doc(db, "questions", selectedId), { answerCount: increment(1) });
  }

  return (
    <>
      <Header onSearch={(q) => setSearchQuery(q)} />
      <div className="max-w-7xl mx-auto px-4 py-6 md:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <main className={cn("space-y-6 md:space-y-10", deferredSearchQuery ? "lg:col-span-12" : "lg:col-span-8")}>
            
            {deferredSearchQuery ? (
              <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center gap-4 border-b border-primary/10 pb-6">
                  <div className="text-accent">
                    <Search className="w-10 h-10" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-black text-primary text-balance">'<span className="text-accent">{deferredSearchQuery}</span>' 통합 검색 결과</h2>
                    <p className="text-primary/40 font-bold text-balance">Whisper 플랫폼 전체 영역에서 지식을 찾았습니다.</p>
                  </div>
                </div>

                <section className="space-y-6">
                  <h3 className="text-xl font-black text-primary flex items-center gap-2">
                    <FileText className="w-5 h-5 text-accent" /> 지식 속삭임 ({searchResults?.questions.length})
                  </h3>
                  <QuestionFeed 
                    questions={searchResults?.questions.slice(0, 5) || []} 
                    onSelectQuestion={id => setSelectedId(id === selectedId ? null : id)} 
                    selectedId={selectedId} 
                    answers={answers} 
                    onAddAnswer={handleAddAnswer} 
                    activeTab="all" 
                    onTabChange={() => {}} 
                  />
                  {searchResults?.questions.length === 0 && <p className="text-primary/20 font-bold py-10 text-center">검색된 지식이 없습니다.</p>}
                </section>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  <section className="space-y-4">
                    <h3 className="text-lg font-black text-primary flex items-center gap-2">
                      <GraduationCap className="w-5 h-5 text-accent" /> 프로그램 ({searchResults?.programs.length})
                    </h3>
                    <div className="space-y-3">
                      {searchResults?.programs.map(p => (
                        <Link key={p.id} href="/programs">
                          <Card className="hover:shadow-lg transition-all cursor-pointer border-none bg-white">
                            <CardContent className="p-4 flex items-center justify-between">
                              <div className="min-w-0">
                                <p className="text-sm font-black text-primary truncate">{p.title}</p>
                                <p className="text-[10px] text-primary/40 font-bold">{p.instructorName}</p>
                              </div>
                              <ArrowRight className="w-4 h-4 text-primary/10" />
                            </CardContent>
                          </Card>
                        </Link>
                      ))}
                      {searchResults?.programs.length === 0 && <p className="text-xs text-primary/20 py-4">검색 결과 없음</p>}
                    </div>
                  </section>

                  <section className="space-y-4">
                    <h3 className="text-lg font-black text-primary flex items-center gap-2">
                      <User className="w-5 h-5 text-accent" /> 강사 정보 ({searchResults?.instructors.length})
                    </h3>
                    <div className="space-y-3">
                      {searchResults?.instructors.map(i => (
                        <Link key={i.id} href="/instructors">
                          <Card className="hover:shadow-lg transition-all cursor-pointer border-none bg-white">
                            <CardContent className="p-4 flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full overflow-hidden bg-primary/5">
                                  <img src={i.profilePictureUrl} className="w-full h-full object-cover" alt={i.name} />
                                </div>
                                <div className="min-w-0">
                                  <p className="text-sm font-black text-primary">{i.name} 강사</p>
                                  <p className="text-[10px] text-accent font-black">#{i.specialty}</p>
                                </div>
                              </div>
                              <ArrowRight className="w-4 h-4 text-primary/10" />
                            </CardContent>
                          </Card>
                        </Link>
                      ))}
                      {searchResults?.instructors.length === 0 && <p className="text-xs text-primary/20 py-4">검색 결과 없음</p>}
                    </div>
                  </section>

                  <section className="space-y-4">
                    <h3 className="text-lg font-black text-primary flex items-center gap-2">
                      <Briefcase className="w-5 h-5 text-accent" /> 채용 공고 ({searchResults?.jobs.length})
                    </h3>
                    <div className="space-y-3">
                      {searchResults?.jobs.map(j => (
                        <Link key={j.id} href="/jobs">
                          <Card className="hover:shadow-lg transition-all cursor-pointer border-none bg-white">
                            <CardContent className="p-4 flex items-center justify-between">
                              <div className="min-w-0">
                                <p className="text-sm font-black text-primary truncate">{j.title}</p>
                                <p className="text-[10px] text-primary/40 font-bold">{j.companyName} | {j.location}</p>
                              </div>
                              <ArrowRight className="w-4 h-4 text-primary/10" />
                            </CardContent>
                          </Card>
                        </Link>
                      ))}
                      {searchResults?.jobs.length === 0 && <p className="text-xs text-primary/20 py-4">검색 결과 없음</p>}
                    </div>
                  </section>
                </div>
                
                <div className="flex justify-center pt-10">
                  <Button onClick={() => setSearchQuery("")} variant="outline" className="rounded-full px-10 h-14 font-black border-primary/10 text-primary">
                    통합 검색 닫고 전체 피드로 돌아가기
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <MainBanner banners={banners} />
                <SubmissionForm type="question" placeholder="HR 고민을 속삭여보세요." onSubmit={handleAddQuestion} />
                
                <div className="flex flex-wrap gap-x-6 gap-y-2 pb-2 border-b border-black/[0.05]">
                  {[
                    { id: "all", label: "전체 피드" },
                    { id: "hrm", label: "인사/총무" },
                    { id: "hrd", label: "HRD/교육" },
                    { id: "culture", label: "조직문화" },
                    { id: "popular", label: "인기" },
                    { id: "waiting", label: "대기" }
                  ].map(t => (
                    <button 
                      key={t.id} 
                      onClick={() => setActiveTab(t.id as any)} 
                      className={cn(
                        "pb-3 text-[15px] transition-all border-b-2 whitespace-nowrap shrink-0", 
                        activeTab === t.id 
                          ? "font-black text-primary border-accent" 
                          : "font-bold text-black/60 border-transparent hover:text-black/80"
                      )}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>

                <QuestionFeed questions={paginated} onSelectQuestion={id => setSelectedId(id === selectedId ? null : id)} selectedId={selectedId} answers={answers} onAddAnswer={handleAddAnswer} activeTab={activeTab as any} onTabChange={setActiveTab as any} />
                
                {totalPages > 1 && (
                  <div className="flex justify-center items-center gap-2 mt-10">
                    <Button variant="ghost" disabled={currentPage === 1} onClick={() => setCurrentPage(1)}><ChevronsLeft className="w-4" /></Button>
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const p = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                      if (p > totalPages) return null;
                      return (
                        <Button key={p} onClick={() => setCurrentPage(p)} className={cn("w-10", currentPage === p ? "bg-primary text-accent" : "bg-white text-primary/20")}>{p}</Button>
                      );
                    })}
                    <Button variant="ghost" disabled={currentPage === totalPages} onClick={() => setCurrentPage(totalPages)}><ChevronsRight className="w-4" /></Button>
                  </div>
                )}
              </>
            )}
          </main>
          {!deferredSearchQuery && (
            <aside className="lg:col-span-4 hidden lg:block sticky top-32 h-fit self-start space-y-8">
              <AldiChat />
              <PremiumAds ads={premiumAds} />
              <RankingList questions={questions.slice(0, 5)} onSelectQuestion={id => setSelectedId(id)} />
            </aside>
          )}
        </div>
      </div>
    </>
  )
}

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <Suspense fallback={
        <div className="flex flex-col items-center justify-center py-40 gap-4">
          <Sparkles className="w-12 h-12 animate-spin text-accent" />
          <p className="text-primary/20 font-black animate-pulse">Whisper 인텔리전스 로딩 중...</p>
        </div>
      }>
        <HomePageContent />
      </Suspense>
    </div>
  )
}
