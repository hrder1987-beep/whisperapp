"use client"

import { useState, useMemo, useEffect, useDeferredValue, Suspense } from "react"
import { Header } from "@/components/chuchot/Header"
import { MainBanner, BannerData } from "@/components/chuchot/MainBanner"
import { SubmissionForm } from "@/components/chuchot/SubmissionForm"
import { QuestionFeed } from "@/components/chuchot/QuestionFeed"
import { RankingList } from "@/components/chuchot/RankingList"
import { AldiChat } from "@/components/chuchot/ShuChat"
import { PremiumAds } from "@/components/chuchot/PremiumAds"
import { Question, Answer, TrainingProgram, Instructor, JobListing, PremiumAd, SiteBranding } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Sparkles, ChevronsLeft, ChevronsRight, Search, FileText } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { generateAiReply } from "@/ai/flows/generate-ai-reply-flow"
import { cn } from "@/lib/utils"
import { useFirestore, useCollection, useDoc, useMemoFirebase, addDocumentNonBlocking, updateDocumentNonBlocking, useUser } from "@/firebase"
import { collection, query, orderBy, doc, increment } from "firebase/firestore"
import mockData from "@/lib/mock-data.json"
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
  
  const [activeTab, setActiveTab] = useState<"all" | "hrm" | "hrd" | "culture" | "popular">("all")
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

  const aldiConfigRef = useMemoFirebase(() => db ? doc(db, "admin_configuration", "aldi_knowledge") : null, [db])
  const { data: aldiConfig } = useDoc<any>(aldiConfigRef)

  const questions = useMemo(() => {
    const merged = [...(dbQuestions || [])];
    const existingIds = new Set(merged.map(q => q.id));
    MOCK_QUESTIONS.forEach(mq => { if (!existingIds.has(mq.id)) merged.push(mq); });
    return merged.sort((a, b) => b.createdAt - a.createdAt);
  }, [dbQuestions])

  const branding = useMemo(() => {
    if (config?.brandingSettings) {
      try { return JSON.parse(config.brandingSettings) as SiteBranding } catch (e) { return null }
    }
    return null;
  }, [config]);

  const searchResults = useMemo(() => {
    if (!deferredSearchQuery) return null;
    const q = deferredSearchQuery.toLowerCase();
    return {
      questions: questions.filter(item => (item.title && item.title.toLowerCase().includes(q)) || (item.text && item.text.toLowerCase().includes(q))),
      programs: (dbPrograms || []).filter(item => (item.title && item.title.toLowerCase().includes(q)) || (item.instructorName && item.instructorName.toLowerCase().includes(q))),
      instructors: (dbInstructors || []).filter(item => (item.name && item.name.toLowerCase().includes(q)) || (item.specialty && item.specialty.toLowerCase().includes(q))),
      jobs: (dbJobs || []).filter(item => (item.title && item.title.toLowerCase().includes(q)) || (item.companyName && item.companyName.toLowerCase().includes(q)))
    };
  }, [questions, dbPrograms, dbInstructors, dbJobs, deferredSearchQuery]);

  const banners = useMemo(() => {
    if (config?.bannerSettings) {
      try { 
        const parsed = JSON.parse(config.bannerSettings) as BannerData[];
        if (parsed.length > 0) return parsed;
      } catch (e) { }
    }
    return [
      { 
        id: "def-1", 
        title: "HR 실무자의 밤:\n인사이트 네트워킹", 
        description: "대한민국 HR 리더들이 한자리에 모여\n현업의 고민과 해결책을 나눕니다.", 
        image: "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?q=80&w=1080", 
        badge: "OFFLINE EVENT" 
      },
      { 
        id: "def-2", 
        title: "2025 채용 시장\n핵심 트렌드 리포트 발간", 
        description: "데이터로 분석한 새로운 채용 패러다임.\n지금 위스퍼에서 독점 공개합니다.", 
        image: "https://images.unsplash.com/photo-1454165833762-01049369290d?q=80&w=1080", 
        badge: "KNOWLEDGE" 
      },
      { 
        id: "def-3", 
        title: "전문가와 함께하는\n1:1 실무 커리어 코칭", 
        description: "인사 전문가로서의 다음 단계,\n검증된 위스퍼러가 직접 가이드해 드립니다.", 
        image: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=1080", 
        badge: "WHISPERER CARE" 
      }
    ]
  }, [config])

  const premiumAds = useMemo(() => {
    const defaultAds = [
      { id: "ad1", title: "HR Tech Conference 2025\n사전 예약 안내", badge: "SPECIAL", webImage: "https://images.unsplash.com/photo-1505373877841-8d25f7d46678?q=80&w=400", mobileImage: "", link: "#" },
      { id: "ad2", title: "글로벌 인재 채용을 위한\n올인원 솔루션 '위스퍼'", badge: "SOLUTION", webImage: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=400", mobileImage: "", link: "#" },
      { id: "ad3", title: "차세대 C&B 전문가를 위한\n실무 마스터 클래스", badge: "EDUCATION", webImage: "https://images.unsplash.com/photo-1551288049-bbbda536339a?q=80&w=400", mobileImage: "", link: "#" }
    ]
    if (config?.premiumAdsSettings) {
      try { 
        const parsed = JSON.parse(config.premiumAdsSettings) as PremiumAd[];
        if (parsed && parsed.length > 0) return parsed;
      } catch (e) { }
    }
    return defaultAds;
  }, [config])

  const dbAnswersQuery = useMemoFirebase(() => (!db || !selectedId) ? null : query(collection(db, "questions", selectedId, "answers"), orderBy("createdAt", "desc")), [db, selectedId])
  const { data: dbAnswers } = useCollection<Answer>(dbAnswersQuery)
  const answers = useMemo(() => dbAnswers?.length ? dbAnswers : (mockData.answers as any[]).filter(a => a.questionId === selectedId), [dbAnswers, selectedId])

  const filtered = useMemo(() => {
    if (deferredSearchQuery) return searchResults?.questions || [];
    let res = [...questions]
    if (activeTab === "hrm") res = res.filter(q => q.category === "인사전략/HRM");
    if (activeTab === "hrd") res = res.filter(q => q.category === "HRD/교육");
    if (activeTab === "culture") res = res.filter(q => q.category === "조직문화/EVP");
    if (activeTab === "popular") res.sort((a, b) => b.viewCount - a.viewCount);
    return res
  }, [questions, deferredSearchQuery, activeTab, searchResults])

  const paginated = useMemo(() => filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE), [filtered, currentPage])
  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE)

  useEffect(() => { setCurrentPage(1); setSelectedId(null); }, [deferredSearchQuery, activeTab])
  useEffect(() => { const search = searchParams.get("search"); if (search) setSearchQuery(search) }, [searchParams])

  const handleAddQuestion = (nickname: string, title: string, text: string, imageUrl?: string, videoUrl?: string, category?: string, jobRole?: string) => {
    if (!db || !user) return;
    addDocumentNonBlocking(collection(db, "questions"), {
      title, text, nickname, userId: user.uid, category: category || "기타",
      viewCount: 0, answerCount: 0, createdAt: Date.now(), imageUrl: imageUrl || null, videoUrl: videoUrl || null,
      jobTitle: jobRole || null 
    }).then(ref => {
      if (ref) {
        generateAiReply({ title, text, instruction: aldiConfig?.autoReplyInstruction }).then(res => {
          addDocumentNonBlocking(collection(db, "questions", ref.id, "answers"), { questionId: ref.id, text: res.replyText, nickname: "알디", userId: "ai", createdAt: Date.now(), jobTitle: "공식 AI" });
          updateDocumentNonBlocking(doc(db, "questions", ref.id), { answerCount: 1 });
        });
      }
    });
  }

  const handleAddAnswer = (nickname: string, title: string, text: string, imageUrl?: string, videoUrl?: string, category?: string, jobRole?: string) => {
    if (!db || !selectedId || !user) return;
    const question = questions.find(q => q.id === selectedId);
    addDocumentNonBlocking(collection(db, "questions", selectedId, "answers"), { questionId: selectedId, text, nickname, userId: user.uid, createdAt: Date.now(), jobTitle: jobRole || null }).then(() => {
      if (question && question.userId !== user.uid) {
        addDocumentNonBlocking(collection(db, "notifications"), { userId: question.userId, type: "new_answer", questionId: selectedId, questionTitle: question.title, senderNickname: nickname, createdAt: Date.now(), isRead: false })
      }
    });
    updateDocumentNonBlocking(doc(db, "questions", selectedId), { answerCount: increment(1) });
  }

  return (
    <>
      <div className="space-y-6 md:space-y-10">
        <MainBanner banners={banners} autoSlideDuration={branding?.bannerAutoSlideDuration || 3} />
        <SubmissionForm type="question" placeholder={branding?.homeTitle ? `${branding.homeTitle}에서 고민을 나눠보세요` : "HR 고민을 속삭여보세요."} onSubmit={handleAddQuestion} />
        <div className="flex flex-nowrap overflow-x-auto scrollbar-hide gap-x-6 pb-2 border-b border-black/[0.05]">
          {[{ id: "all", label: "전체 피드" }, { id: "hrm", label: "인사/총무" }, { id: "hrd", label: "HRD/교육" }, { id: "culture", label: "조직문화" }, { id: "popular", label: "인기" }].map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id as any)} className={cn("pb-3 text-[15px] transition-all border-b-2 whitespace-nowrap shrink-0", activeTab === t.id ? "font-black text-primary border-accent" : "font-bold text-black/60 border-transparent hover:text-black/80")}>{t.label}</button>
          ))}
        </div>
        <QuestionFeed questions={paginated} onSelectQuestion={id => setSelectedId(id === selectedId ? null : id)} selectedId={selectedId} answers={answers} onAddAnswer={handleAddAnswer} activeTab={activeTab as any} onTabChange={setActiveTab as any} />
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-10">
            <Button variant="ghost" disabled={currentPage === 1} onClick={() => setCurrentPage(1)} className="text-accent/70 hover:text-accent"><ChevronsLeft className="w-4" /></Button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const p = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
              if (p > totalPages) return null;
              return (
                <Button 
                  key={p} 
                  onClick={() => setCurrentPage(p)} 
                  variant={currentPage === p ? "default" : "outline"}
                  className={cn("w-10 h-10 rounded-xl font-black transition-all border-2", currentPage === p ? "bg-primary text-accent border-primary shadow-md" : "bg-white text-accent/70 border-black/5 hover:border-primary/30 hover:text-primary")}
                >
                  {p}
                </Button>
              );
            })}
            <Button variant="ghost" disabled={currentPage === totalPages} onClick={() => setCurrentPage(totalPages)} className="text-accent/70 hover:text-accent"><ChevronsRight className="w-4" /></Button>
          </div>
        )}
      </div>
    </>
  )
}

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <Header />
      <div className="max-w-7xl mx-auto px-4 py-6 md:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <main className="lg:col-span-8 space-y-6 md:space-y-10">
            <Suspense fallback={<div className="flex flex-col items-center justify-center py-40 gap-4"><Sparkles className="w-12 h-12 animate-spin text-accent" /><p className="text-primary/20 font-black animate-pulse">Whisper 인텔리전스 로딩 중...</p></div>}>
              <HomePageContent />
            </Suspense>
          </main>
          <aside className="lg:col-span-4 hidden lg:block space-y-8 h-fit self-start">
            <AldiChat />
            <PremiumAds ads={[]} />
          </aside>
        </div>
      </div>
    </div>
  )
}
