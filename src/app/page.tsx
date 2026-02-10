
"use client"

import { useState, useMemo, useEffect, useDeferredValue } from "react"
import { Header } from "@/components/chuchot/Header"
import { MainBanner, BannerData } from "@/components/chuchot/MainBanner"
import { SubmissionForm } from "@/components/chuchot/SubmissionForm"
import { QuestionFeed } from "@/components/chuchot/QuestionFeed"
import { RankingList } from "@/components/chuchot/RankingList"
import { AldiChat } from "@/components/chuchot/ShuChat"
import { Question, Answer } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Sparkles, ChevronsLeft, ChevronsRight } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { generateAiReply } from "@/ai/flows/generate-ai-reply-flow"
import { cn } from "@/lib/utils"
import { useFirestore, useCollection, useDoc, useMemoFirebase, addDocumentNonBlocking, updateDocumentNonBlocking, useUser } from "@/firebase"
import { collection, query, orderBy, doc, increment } from "firebase/firestore"
import mockData from "@/lib/mock-data.json"

const ITEMS_PER_PAGE = 7

const HRM_TOPICS = [
  { title: "포괄임금제 도입 시 필수 항목", text: "연장/야간/휴일수당을 계약서에 어떻게 명시해야 리스크가 없을까요?" },
  { title: "1년 미만 사원 연차 발생 기준", text: "매달 개근 시 1일과 1년 시점 15개가 합산되는 과정이 궁금합니다." },
  { title: "수습기간 당일 해고 통보 리스크", text: "3개월 미만이면 해고예고 예외라는데, 부당해고 신청은 가능한가요?" },
  { title: "휴일 근무 보상휴가제 도입 절차", text: "현금 대신 휴가로 대체 시 근로자대표 합의만으로 충분한가요?" },
  { title: "유연근무제 근태 관리 노하우", text: "시차출퇴근제 도입 시 협업을 위한 코어타임은 다들 어떻게 잡으시나요?" },
  { title: "퇴직금 중간정산 사유 확인", text: "무주택자의 주택 구입 외에 다른 정당한 사유들이 궁금합니다." },
  { title: "취업규칙 변경 신고 절차", text: "근로자에게 불이익한 변경일 경우 동의를 받는 가장 안전한 방법은?" },
  { title: "직장 내 괴롭힘 조사 위원회 구성", text: "외부 위원을 반드시 포함해야 하나요? 공정성 확보 방안이 궁금합니다." },
  { title: "계약직 만료 전 갱신 기대권", text: "반복 갱신된 계약직의 경우 정규직 전환 거절 시 리스크는?" },
  { title: "연장근로 한도 위반 주의사항", text: "주 52시간제 하에서 특별연장근로 인가를 받는 절차와 요건." },
  { title: "급여 명세서 필수 기재 항목", text: "수당 계산 방법 등을 명시하지 않았을 때 과태료 수준은?" },
  { title: "재택근무 시 근태 관리 방안", text: "접속 기록만으로 근태를 인정해도 될까요? 다들 어떻게 관리하시나요?" },
  { title: "연차 유급휴가 대체 공휴일", text: "공휴일 유급휴가 의무화 이후 연차 대체가 불가능해진 부분 확인." },
  { title: "선택적 근로시간제 정산 기간", text: "정산 기간을 3개월로 늘릴 때 근로자대표 서면 합의서 양식 공유 부탁드려요." },
  { title: "출산휴가 및 육아휴직 급여", text: "사후지급금 제도 변경 사항과 기업이 부담해야 하는 비용 정리." }
];

const HRD_TOPICS = [
  { title: "타운홀 미팅 익명 질문의 효과", text: "익명 툴 사용 시 공격적인 질문에 대한 대처 방안이 있을까요?" },
  { title: "신입사원 온보딩 소속감 강화 활동", text: "조기 퇴사를 막기 위한 우리 회사만의 특별한 루틴을 추천해주세요." },
  { title: "사내 강사 양성 및 보상 체계", text: "실무자를 강사로 세울 때 강의료 외에 어떤 동기부여를 하시나요?" },
  { title: "핵심가치 내재화 워크숍 아이디어", text: "지루하지 않게 가치를 체득할 수 있는 액티비티가 궁금합니다." },
  { title: "팀 내 심리적 안전감 구축 루틴", text: "회의 시작 전 가볍게 던질 수 있는 체크인 질문 리스트가 있을까요?" },
  { title: "에듀테크 기반 학습 플랫폼 도입", text: "LXP 도입 시 가장 고려해야 할 핵심 기능과 실패 사례가 궁금합니다." },
  { title: "MZ세대 리더십 교육 커리큘럼", text: "요즘 팀장들이 가장 힘들어하는 부분과 이를 해결할 교육 주제 추천." },
  { title: "멘토링 프로그램 매칭 알고리즘", text: "강제 매칭보다 자율 매칭이 좋을까요? 성공적인 운영 노하우 공유 바랍니다." },
  { title: "IDP(개인개발계획) 실효성 확보", text: "작성만 하고 끝나는 계획이 아니라 실제 성과로 이어지게 하는 법." },
  { title: "직무 교육 OJT 매뉴얼화", text: "선배마다 가르치는 방식이 다른데, 이를 표준화하는 가장 빠른 방법." },
  { title: "다면평가 피드백 수용도 제고", text: "평가 결과 통보 시 리더들의 거부감을 줄이는 커뮤니케이션 스킬." },
  { title: "조직 진단 설문지 문항 설계", text: "문화 진단 시 꼭 포함되어야 하는 핵심 5가지 영역 추천." },
  { title: "사내 북클럽 운영 및 도서 지원", text: "자발적 참여를 이끌어내는 북클럽 운영 팁과 보상 제도." },
  { title: "디지털 리터러시 전사 교육", text: "비IT 직군 임직원들의 AI 활용 능력을 높이기 위한 교육 단계." },
  { title: "리트릿 프로그램 장소 및 프로그램", text: "서울 근교에서 팀워크를 다지기 좋은 장소와 힐링 프로그램 추천." }
];

const EXPERT_NICKNAMES = ["인사마스터", "노무의신", "컬처디렉터", "HRBP", "교육전문가", "채용빌런", "보상전문가", "인사전략가", "피플팀장", "열정HR"];

const generateMocks = () => {
  const list: Question[] = [];
  const mockAnswerIds = new Set((mockData.answers as any[]).map(a => a.questionId));
  
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

export default function HomePage() {
  const { user } = useUser()
  const db = useFirestore()
  const { toast } = useToast()
  
  const [searchQuery, setSearchQuery] = useState("")
  // 입력 지연을 해결하기 위해 useDeferredValue 적용 (대규모 데이터 필터링 시 UI 멈춤 방지)
  const deferredSearchQuery = useDeferredValue(searchQuery)
  
  const [activeTab, setActiveTab] = useState<"all" | "hrm" | "hrd" | "culture" | "popular" | "waiting">("all")
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)

  const configDocRef = useMemoFirebase(() => db ? doc(db, "admin_configuration", "site_settings") : null, [db])
  const { data: config } = useDoc<any>(configDocRef)

  const banners = useMemo(() => {
    if (config?.bannerSettings) {
      try { return JSON.parse(config.bannerSettings) as BannerData[] } catch (e) { return [] }
    }
    return [{
      id: "def-1",
      title: "HR실무자들의\n품격 있는 속삭임",
      description: "교육부터 조직문화 인사전략까지\nHR실무자를 위한 지식 허브 Whisper",
      image: "https://images.unsplash.com/photo-1521737711867-e3b97375f902?q=80&w=1080",
      badge: "집단 지성의 힘"
    }]
  }, [config])

  const questionsQuery = useMemoFirebase(() => db ? query(collection(db, "questions"), orderBy("createdAt", "desc")) : null, [db])
  const { data: dbQuestions } = useCollection<Question>(questionsQuery)
  
  const questions = useMemo(() => {
    const merged = [...(dbQuestions || [])];
    MOCK_QUESTIONS.forEach(mq => { if (!merged.some(dq => dq.id === mq.id)) merged.push(mq); });
    return merged.sort((a, b) => b.createdAt - a.createdAt);
  }, [dbQuestions])

  const answersQuery = useMemoFirebase(() => {
    if (!db || !selectedId) return null
    return query(collection(db, "questions", selectedId, "answers"), orderBy("createdAt", "desc"))
  }, [db, selectedId])
  const { data: dbAnswers } = useCollection<Answer>(answersQuery)
  
  const answers = useMemo(() => {
    return dbAnswers?.length ? dbAnswers : (mockData.answers as any[]).filter(a => a.questionId === selectedId);
  }, [dbAnswers, selectedId])

  const filtered = useMemo(() => {
    let res = [...questions]
    // 지연된 검색어를 사용하여 검색 시 화면 버벅거림 제거
    if (deferredSearchQuery) {
      const lowerQuery = deferredSearchQuery.toLowerCase();
      res = res.filter(q => q.title.toLowerCase().includes(lowerQuery) || q.text.toLowerCase().includes(lowerQuery));
    }
    if (activeTab === "hrm") res = res.filter(q => q.category === "인사전략/HRM");
    if (activeTab === "hrd") res = res.filter(q => q.category === "HRD/교육");
    if (activeTab === "culture") res = res.filter(q => q.category === "조직문화/EVP");
    if (activeTab === "popular") res.sort((a, b) => b.viewCount - a.viewCount);
    if (activeTab === "waiting") res = res.filter(q => q.answerCount === 0);
    return res
  }, [questions, deferredSearchQuery, activeTab])

  const paginated = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE
    return filtered.slice(start, start + ITEMS_PER_PAGE)
  }, [filtered, currentPage])

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE)

  useEffect(() => { setCurrentPage(1); setSelectedId(null); }, [deferredSearchQuery, activeTab])

  const handleAddQuestion = (nickname: string, title: string, text: string, category?: string) => {
    if (!db || !user) return;
    addDocumentNonBlocking(collection(db, "questions"), {
      title, text, nickname, userId: user.uid, category: category || "기타",
      viewCount: 0, answerCount: 0, createdAt: Date.now()
    }).then(ref => {
      if (ref) generateAiReply({ title, text }).then(res => {
        addDocumentNonBlocking(collection(db, "questions", ref.id, "answers"), {
          questionId: ref.id, text: res.replyText, nickname: "알디", userId: "ai", createdAt: Date.now()
        });
        updateDocumentNonBlocking(doc(db, "questions", ref.id), { answerCount: 1 });
      });
    });
  }

  const handleAddAnswer = (nickname: string, title: string, text: string) => {
    if (!db || !selectedId || !user) return;
    addDocumentNonBlocking(collection(db, "questions", selectedId, "answers"), {
      questionId: selectedId, text, nickname, userId: user.uid, createdAt: Date.now()
    });
    updateDocumentNonBlocking(doc(db, "questions", selectedId), { answerCount: increment(1) });
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <Header onSearch={setSearchQuery} />
      <div className="max-w-7xl mx-auto px-4 py-6 md:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <main className={cn("space-y-6 md:space-y-10", searchQuery ? "lg:col-span-12" : "lg:col-span-8")}>
            {!searchQuery && <MainBanner banners={banners} />}
            <SubmissionForm type="question" placeholder="HR 고민을 속삭여보세요." onSubmit={handleAddQuestion} />
            
            <div className="flex gap-6 overflow-x-auto pb-2 border-b border-primary/5">
              {[
                { id: "all", label: "전체 피드" },
                { id: "hrm", label: "인사/총무" },
                { id: "hrd", label: "HRD/교육" },
                { id: "culture", label: "조직문화" },
                { id: "popular", label: "인기" },
                { id: "waiting", label: "대기" }
              ].map(t => (
                <button key={t.id} onClick={() => setActiveTab(t.id as any)} className={cn("pb-3 text-sm transition-all border-b-2", activeTab === t.id ? "font-black text-primary border-accent" : "font-bold text-primary/20 border-transparent")}>
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
          </main>
          {!searchQuery && (
            <aside className="lg:col-span-4 space-y-8 hidden lg:block">
              <AldiChat />
              <RankingList questions={questions.slice(0, 3)} onSelectQuestion={id => setSelectedId(id)} />
            </aside>
          )}
        </div>
      </div>
    </div>
  )
}
