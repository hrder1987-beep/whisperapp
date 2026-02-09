
"use client"

import { useState, useMemo, useEffect } from "react"
import { Header } from "@/components/chuchot/Header"
import { MainBanner } from "@/components/chuchot/MainBanner"
import { SubmissionForm } from "@/components/chuchot/SubmissionForm"
import { QuestionFeed } from "@/components/chuchot/QuestionFeed"
import { RankingList } from "@/components/chuchot/RankingList"
import { AldiChat } from "@/components/chuchot/ShuChat"
import { Question, Answer } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { ArrowLeft, ChevronLeft, ChevronRight, ExternalLink } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { generateAiReply } from "@/ai/flows/generate-ai-reply-flow"
import { cn } from "@/lib/utils"
import { useFirestore, useCollection, useDoc, useMemoFirebase, addDocumentNonBlocking, updateDocumentNonBlocking, useUser } from "@/firebase"
import { collection, query, orderBy, doc, increment } from "firebase/firestore"
import { Badge } from "@/components/ui/badge"

const MOCK_REF_TIME = 1739952000000;

const MOCK_DATA_SOURCE = [
  { q: "휴일에 근무하면 무조건 보상휴가로 처리해야 하나요?", a: "아닙니다! 휴일대체 합의가 있다면 가능하며 불법이 아닙니다.", n: "초보인사", c: "인사전략/HRM" },
  { q: "휴일대체 동의서를 개인별로 매번 받아야 하나요?", a: "근로자대표와 포괄 합의가 있다면 매번 받을 필요는 없습니다.", n: "노무꿈나무", c: "인사전략/HRM" },
  { q: "노사협의회 고충처리위원은 반드시 선임해야 하나요?", a: "네, 필수 구성 요소이며 선임하지 않으면 감독 시 지적됩니다.", n: "법규지킴이", c: "현업 고민" },
  { q: "급여(페이롤) 업무만 해도 인사 경력으로 인정되나요?", a: "당연하죠! 급여는 인사의 가장 기본이자 핵심 전문성입니다.", n: "월급날이좋아", c: "인사전략/HRM" },
  { q: "사이버대학 학력 소재지는 어디로 적어야 하나요?", a: "정답은 없지만 본교 소재지를 따르거나 기타로 분류합니다.", n: "공부하는인사", c: "기타 정보" },
  { q: "임원 타운홀 미팅에서 익명 질문이 효과적인가요?", a: "심리적 장벽을 낮추는 데 매우 효과적이며 솔직한 대화가 가능합니다.", n: "컬처디자이너", c: "조직문화/EVP" },
  { q: "타운홀 미팅을 교육 프로그램으로 봐도 될까요?", a: "넓은 의미에서 비형식 학습으로 충분히 인정 가능합니다.", n: "교육기획자K", c: "HRD/교육" },
  { q: "조직문화 워크숍과 일반 교육의 차이는?", a: "교육은 지식 전달, 워크숍은 인식과 행동 변화가 주 목적입니다.", n: "문화리더", c: "조직문화/EVP" },
  { q: "내부 강사 육성, 정말 효과가 있나요?", a: "네, 사내 맥락을 가장 잘 알아서 실무 적용도가 압도적으로 높습니다.", n: "육성마스터", c: "HRD/교육" },
  { q: "앞으로 HRD 담당자에게 가장 중요한 역량은?", a: "조직의 비즈니스 문제를 구조적으로 해결하는 BP의 관점입니다.", n: "미래인사", c: "HRD/교육" }
];

export default function HomePage() {
  const { user } = useUser()
  const db = useFirestore()
  const { toast } = useToast()
  
  const userDocRef = useMemoFirebase(() => (user && db) ? doc(db, "users", user.uid) : null, [user, db])
  const { data: profile } = useDoc<any>(userDocRef)

  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState<"all" | "popular" | "waiting" | "hrd" | "culture">("all")
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const ITEMS_PER_PAGE = 7

  const questionsQuery = useMemoFirebase(() => db ? query(collection(db, "questions"), orderBy("createdAt", "desc")) : null, [db])
  const { data: questionsData } = useCollection<Question>(questionsQuery)
  
  const questions = useMemo(() => {
    const fetched = questionsData || []
    if (fetched.length === 0 && !searchQuery) {
      const samples: Question[] = [];
      for (let i = 1; i <= 100; i++) {
        const src = MOCK_DATA_SOURCE[(i - 1) % MOCK_DATA_SOURCE.length];
        samples.push({
          id: `sample-${i}`,
          title: src.q + ` (#${i})`,
          text: `안녕하세요. 실무 중 궁금한 점이 생겨 질문 드립니다. ${src.q} 다들 어떻게 처리하시나요?`,
          nickname: `${src.n}_${i}`,
          userId: `mock-u-${i}`,
          userRole: "member",
          viewCount: (i * 17) % 500,
          answerCount: 1,
          createdAt: MOCK_REF_TIME - 1000 * 60 * 60 * i,
          category: src.c
        });
      }
      return samples;
    }
    return fetched
  }, [questionsData, searchQuery])

  const answersQuery = useMemoFirebase(() => {
    if (!db || !selectedQuestionId) return null
    return query(collection(db, "questions", selectedQuestionId, "answers"), orderBy("createdAt", "desc"))
  }, [db, selectedQuestionId])
  const { data: answersData } = useCollection<Answer>(answersQuery)
  
  const answers = useMemo(() => {
    const fetched = answersData || []
    if (selectedQuestionId?.startsWith("sample-")) {
      const idx = parseInt(selectedQuestionId.split("-")[1]);
      const src = MOCK_DATA_SOURCE[(idx - 1) % MOCK_DATA_SOURCE.length];
      return [...fetched, {
        id: `ans-sample-${idx}`,
        questionId: selectedQuestionId,
        text: src.a,
        nickname: "위스퍼러",
        userId: "ai-mentor",
        userRole: "mentor",
        createdAt: MOCK_REF_TIME - 1000 * 60 * 30
      }];
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
      if (db && !id.startsWith("sample-")) updateDocumentNonBlocking(doc(db, "questions", id), { viewCount: increment(1) });
    }
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <Header onSearch={setSearchQuery} />
      <div className="max-w-7xl mx-auto px-0 md:px-4 py-0 md:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <main className={cn("space-y-0 md:space-y-10 transition-all duration-500", searchQuery ? "lg:col-span-12 max-w-4xl mx-auto w-full" : "lg:col-span-8")}>
            {!searchQuery && <MainBanner />}
            <div className="px-4 md:px-0">
              <SubmissionForm type="question" placeholder="HR 고민을 속삭여보세요." onSubmit={handleAddQuestion} />
              <div className="flex gap-4 md:gap-8 whitespace-nowrap mb-6 overflow-x-auto pb-2 scrollbar-hide">
                {["all", "popular", "waiting", "hrd", "culture"].map(tab => (
                  <button key={tab} onClick={() => setActiveTab(tab as any)} className={cn("text-sm md:text-base pb-2 transition-all border-b-2", activeTab === tab ? "font-black text-primary border-accent" : "font-bold text-primary/20 border-transparent hover:text-primary")}>
                    {tab === "all" ? "전체 피드" : tab === "popular" ? "실시간 인기" : tab === "waiting" ? "답변 대기" : tab === "hrd" ? "HRD/교육" : "조직문화"}
                  </button>
                ))}
              </div>
              <QuestionFeed questions={paginatedQuestions} onSelectQuestion={handleSelectQuestion} selectedId={selectedQuestionId} answers={answers} onAddAnswer={handleAddAnswer} activeTab={activeTab as any} onTabChange={setActiveTab as any} />
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-12 pb-20">
                  <Button variant="ghost" size="icon" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="rounded-xl"><ChevronLeft className="w-5 h-5" /></Button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).slice(Math.max(0, currentPage - 3), Math.min(totalPages, currentPage + 2)).map(page => (
                    <Button key={page} onClick={() => setCurrentPage(page)} className={cn("w-10 h-10 rounded-xl font-black text-sm", currentPage === page ? "bg-primary text-accent" : "bg-white text-primary/20 shadow-sm")}>{page}</Button>
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
              
              {/* 트리플 배너 광고란 */}
              <div className="space-y-6">
                <div className="relative group cursor-pointer overflow-hidden rounded-[2rem] shadow-xl border border-primary/5 transition-all hover:shadow-2xl">
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10"></div>
                  <img src="https://picsum.photos/seed/ad1/400/220" alt="광고 배너 1" className="w-full h-auto object-cover group-hover:scale-110 transition-transform duration-700" />
                  <div className="absolute bottom-6 left-6 right-6 z-20">
                    <Badge className="bg-accent text-primary font-black mb-2 text-[9px]">SPECIAL EVENT</Badge>
                    <p className="text-white font-black text-lg leading-tight">HR 전문가를 위한<br/>커리어 엑셀러레이팅</p>
                  </div>
                </div>

                <div className="relative group cursor-pointer overflow-hidden rounded-[2rem] shadow-xl border border-primary/5 transition-all hover:shadow-2xl">
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10"></div>
                  <img src="https://picsum.photos/seed/ad2/400/220" alt="광고 배너 2" className="w-full h-auto object-cover group-hover:scale-110 transition-transform duration-700" />
                  <div className="absolute bottom-6 left-6 right-6 z-20">
                    <Badge className="bg-emerald-500 text-white font-black mb-2 text-[9px]">PARTNER</Badge>
                    <p className="text-white font-black text-lg leading-tight">조직문화 진단 툴킷<br/>무료 체험 신청하기</p>
                  </div>
                </div>

                <div className="relative group cursor-pointer overflow-hidden rounded-[2rem] shadow-xl border border-primary/5 transition-all hover:shadow-2xl">
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10"></div>
                  <img src="https://picsum.photos/seed/ad3/400/220" alt="광고 배너 3" className="w-full h-auto object-cover group-hover:scale-110 transition-transform duration-700" />
                  <div className="absolute bottom-6 left-6 right-6 z-20">
                    <Badge className="bg-blue-500 text-white font-black mb-2 text-[9px]">NEW SOLUTION</Badge>
                    <p className="text-white font-black text-lg leading-tight">AI 기반 자동 채용<br/>어시스턴트 도입 가이드</p>
                  </div>
                </div>
              </div>
            </aside>
          )}
        </div>
      </div>
    </div>
  )
}
