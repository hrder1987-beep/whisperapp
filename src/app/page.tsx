
"use client"

import { useState, useMemo, useEffect } from "react"
import { Header } from "@/components/chuchot/Header"
import { MainBanner } from "@/components/chuchot/MainBanner"
import { SubmissionForm } from "@/components/chuchot/SubmissionForm"
import { QuestionFeed } from "@/components/chuchot/QuestionFeed"
import { RankingList } from "@/components/chuchot/RankingList"
import { AldiChat } from "@/components/chuchot/ShuChat"
import { Question, Answer, UserRole } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { generateAiReply } from "@/ai/flows/generate-ai-reply-flow"
import { cn } from "@/lib/utils"
import { useFirestore, useCollection, useDoc, useMemoFirebase, addDocumentNonBlocking, updateDocumentNonBlocking, useUser } from "@/firebase"
import { collection, query, orderBy, doc, increment } from "firebase/firestore"

// --- 실무 샘플 데이터 (Q1-Q130 + 신규 HRD Q31-Q100) ---
const MOCK_QUESTIONS: Question[] = [
  { id: "sample-1", title: "휴일에 근무하면 무조건 보상휴가로 처리해야 하나요?", text: "안녕하세요. 저희 팀원이 이번 주말에 업무가 몰려서 나와서 일하게 됐는데, 이걸 꼭 보상휴가로만 줘야 하는 건지 궁금해서요. 대체휴일로 운영해도 법적으로 문제가 없을까요? 다른 회사 실무자분들은 어떻게 처리하시나요?", nickname: "초보인사돌이", userId: "mock-1", userRole: "member", jobTitle: "인사담당자", viewCount: 142, answerCount: 1, createdAt: Date.now() - 1000 * 60 * 60 * 1, category: "인사전략/HRM" },
  { id: "sample-31", title: "타운홀 미팅을 교육 프로그램으로 봐도 될까요?", text: "최근에 타운홀 미팅을 정기적으로 하고 있는데, 이걸 사내 교육 이수 시간으로 인정해달라는 요청이 있네요. 타운홀을 넓은 의미에서 교육 프로그램으로 봐도 무방할까요? 다른 분들은 어떻게 운영하시는지 궁금합니다!", nickname: "교육기획자K", userId: "mock-31", userRole: "member", jobTitle: "HRD담당", viewCount: 210, answerCount: 1, createdAt: Date.now() - 1000 * 60 * 60 * 2, category: "HRD/교육" },
  { id: "sample-35", title: "조직문화 워크숍과 일반 교육의 차이는 무엇인가요?", text: "이번에 조직문화 워크숍을 기획 중인데 대표님이 일반 직무 교육이랑 뭐가 다르냐고 물으시네요. 설계할 때 어떤 부분에 차별점을 둬야 할까요? 고민이 많습니다.", nickname: "문화리더", userId: "mock-35", userRole: "member", jobTitle: "조직문화", viewCount: 185, answerCount: 1, createdAt: Date.now() - 1000 * 60 * 60 * 5, category: "조직문화/EVP" },
  { id: "sample-45", title: "교육 담당자가 가장 흔히 하는 실수는 무엇인가요?", text: "이제 막 HRD 업무를 시작한 주니어입니다. 선배님들이 보시기에 교육 기획할 때 가장 조심해야 할 부분이나 흔히 저지르는 실수가 있다면 조언 부탁드려요!", nickname: "새내기HRD", userId: "mock-45", userRole: "member", jobTitle: "교육담당", viewCount: 320, answerCount: 1, createdAt: Date.now() - 1000 * 60 * 60 * 10, category: "HRD/교육" },
  { id: "sample-62", title: "리더 대상 교육과 직원 대상 교육은 어떻게 달라야 하나요?", text: "전사 교육을 기획 중인데 직급별로 톤앤매너를 어떻게 다르게 가져가야 할지 감이 잘 안 오네요. 리더와 팀원 교육의 핵심 차별화 포인트를 알려주세요!", nickname: "배움이즐거워", userId: "mock-62", userRole: "member", jobTitle: "HRD매니저", viewCount: 145, answerCount: 1, createdAt: Date.now() - 1000 * 60 * 60 * 15, category: "리더십" },
  { id: "sample-85", title: "교육 담당자가 강의를 직접 해야 하나요?", text: "사내 강사 제도 도입을 검토 중인데, 교육 담당자인 제가 직접 강의를 뛰어야 할지 아니면 기획에만 집중해야 할지 고민입니다. 보통 어떻게들 하시나요?", nickname: "기획이좋아", userId: "mock-85", userRole: "member", jobTitle: "HRD", viewCount: 270, answerCount: 1, createdAt: Date.now() - 1000 * 60 * 60 * 20, category: "HRD/교육" },
  { id: "sample-99", title: "HRD에서도 AI나 디지털 툴 활용이 필요할까요?", text: "요즘 다들 AI 얘기인데 교육 현장에서도 실제 활용도가 높은가요? 단순히 유행인지, 아니면 정말 운영 효율이 좋아지는지 궁금합니다.", nickname: "디지털꿈나무", userId: "mock-99", userRole: "member", jobTitle: "교육기획", viewCount: 410, answerCount: 1, createdAt: Date.now() - 1000 * 60 * 60 * 24, category: "DX/생성형 AI" },
  { id: "sample-100", title: "앞으로 HRD 담당자에게 가장 중요해질 역량은 무엇인가요?", text: "급변하는 환경 속에서 교육 담당자로서 살아남으려면 어떤 역량을 가장 먼저 키워야 할까요? 선배님들의 통찰력이 궁금합니다.", nickname: "미래HRD", userId: "mock-100", userRole: "member", jobTitle: "HRD전문가", viewCount: 550, answerCount: 1, createdAt: Date.now() - 1000 * 60 * 60 * 30, category: "현업 고민" },
]

const MOCK_ANSWERS: Answer[] = [
  { id: "ans-1", questionId: "sample-1", text: "아닙니다! 휴일근무를 보상휴가로 처리할지, 휴일대체로 할지는 노사 합의 사항이에요. 근로자대표와 사전 서면 합의가 있다면 휴일대체가 가능하고요, 모든 휴일근무를 보상휴가로 해야 할 법적 의무는 없으니 안심하세요.", nickname: "노무마스터", userId: "ai-1", userRole: "mentor", jobTitle: "노무사", createdAt: Date.now() - 1000 * 60 * 30 },
  { id: "ans-31", questionId: "sample-31", text: "넓은 의미에서는 충분히 가능합니다. 리더의 메시지를 통해 조직의 방향성을 공유하고 인식을 전환한다는 점에서 '비형식 학습(Informal Learning)'의 훌륭한 사례가 되죠. 다만 공식 이수 시간으로 인정할지는 내부 가이드라인을 먼저 세우는 게 좋습니다.", nickname: "교육전문가", userId: "ai-31", userRole: "mentor", jobTitle: "HRD센터장", createdAt: Date.now() - 1000 * 60 * 40 },
  { id: "ans-35", questionId: "sample-35", text: "교육은 역량과 지식 전달이 핵심이라면, 조직문화 워크숍은 구성원들의 인식과 행동의 변화가 목적입니다. 따라서 강의 위주보다는 상호 토론과 '우리가 지켜야 할 원칙'을 도출하는 퍼실리테이션 중심의 설계가 필요합니다.", nickname: "컬처디렉터", userId: "ai-35", userRole: "mentor", jobTitle: "조직문화전문가", createdAt: Date.now() - 1000 * 60 * 50 },
  { id: "ans-45", questionId: "sample-45", text: "가장 흔한 실수는 교육을 '프로그램' 그 자체로만 보고 '현업의 문제 해결' 관점에서 보지 않는 것입니다. 아무리 좋은 강의라도 실무에 적용되지 않으면 이벤트로 끝나기 쉽죠. 늘 '이게 현업의 어떤 문제를 푸나?'를 자문해 보세요.", nickname: "베테랑HRD", userId: "ai-45", userRole: "mentor", jobTitle: "인사팀장", createdAt: Date.now() - 1000 * 60 * 60 },
  { id: "ans-62", questionId: "sample-62", text: "리더 교육은 '실제적인 행동 변화'에 초점을 맞춰야 하고, 직원 교육은 '변화의 필요성에 대한 이해와 공감'에 우선순위를 둬야 합니다. 리더에게는 솔루션을, 직원에게는 비전을 주는 것이 핵심 차별화 포인트입니다.", nickname: "리더십코치", userId: "ai-62", userRole: "mentor", jobTitle: "전문강사", createdAt: Date.now() - 1000 * 60 * 70 },
  { id: "ans-85", questionId: "sample-85", text: "필수는 아니지만, 내부 맥락을 가장 잘 아는 담당자가 직접 강의를 할 때의 전달력은 매우 높습니다. 다만 모든 강의를 하려 하기보다는 핵심적인 오리엔테이션이나 문화 교육은 직접 하고, 전문 기술은 외부 강사를 쓰는 하이브리드 방식을 추천합니다.", nickname: "교육마스터", userId: "ai-85", userRole: "mentor", jobTitle: "HRD수석", createdAt: Date.now() - 1000 * 60 * 80 },
  { id: "ans-99", questionId: "sample-99", text: "필요성이 아주 빠르게 커지고 있습니다! 단순히 유행이 아니라 교육 설계 시 커리큘럼 생성, 운영 시 자동화 툴 활용 등을 통해 담당자의 공수를 50% 이상 줄여줄 수 있습니다. 결과적으로 담당자는 더 가치 있는 기획에 집중할 수 있게 되죠.", nickname: "알디", userId: "ai-whisper", userRole: "admin", jobTitle: "AI 길잡이", createdAt: Date.now() - 1000 * 60 * 90 },
  { id: "ans-100", questionId: "sample-100", text: "단순 교육 운영을 넘어 조직의 문제를 구조적으로 바라보는 '비즈니스 파트너'로서의 관점입니다. 우리 회사의 사업 전략을 이해하고, 그 전략을 달성하기 위해 필요한 인적 역량이 무엇인지 찾아내 교육으로 연결하는 능력이 가장 중요해질 것입니다.", nickname: "베테랑HRD", userId: "ai-100", userRole: "mentor", jobTitle: "인사팀장", createdAt: Date.now() - 1000 * 60 * 100 },
]

export default function HomePage() {
  const { user } = useUser()
  const db = useFirestore()
  
  const userDocRef = useMemoFirebase(() => (user && db) ? doc(db, "users", user.uid) : null, [user, db])
  const { data: profile } = useDoc<any>(userDocRef)

  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState<"all" | "popular" | "waiting" | "hrd" | "culture">("all")
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(null)
  
  const [currentPage, setCurrentPage] = useState(1)
  const ITEMS_PER_PAGE = 7

  const { toast } = useToast()

  const questionsQuery = useMemoFirebase(() => {
    if (!db) return null
    return query(collection(db, "questions"), orderBy("createdAt", "desc"))
  }, [db])
  const { data: questionsData } = useCollection<Question>(questionsQuery)
  
  const questions = useMemo(() => {
    const fetched = questionsData || []
    
    // 추가 샘플 데이터 대량 자동 생성 (사용자 요청 기반 고품질 데이터)
    const extraSamples: Question[] = []
    if (fetched.length === 0 && !searchQuery) {
      const hrdContents = [
        { q: "타운홀을 단발성 이벤트로 끝내지 않으려면?", a: "사전 질문, 현장 대화, 사후 요약 공유의 3단계 구조를 설계해야 학습 효과가 지속됩니다.", n: "운영고수", c: "HRD/교육" },
        { q: "조직 활성화 교육의 성과 측정은 어떻게?", a: "참여도, 만족도뿐만 아니라 참여 중 발생한 발언 수나 정성적 피드백을 지표화해보세요.", n: "데이터인사", c: "HRD/교육" },
        { q: "내부 강사 육성, 정말 효과가 있나요?", a: "네, 조직 내부의 맥락을 가장 잘 이해하고 있어 실무 적용도가 압도적으로 높습니다.", n: "육성마스터", c: "HRD/교육" },
        { q: "임원 교육 기획 시 가장 중요한 점은?", a: "내용의 화려함보다는 '왜 이 시점에 이 교육이 필요한가'에 대한 임원분들의 공감을 얻는 것입니다.", n: "임원코치", c: "리더십" },
        { q: "조직문화 교육 주제, 어떻게 정하시나요?", a: "경영진의 지시보다는 구성원들이 실제 현장에서 겪는 페인포인트(Pain point)에서 시작하세요.", n: "문화기획", c: "조직문화/EVP" },
        { q: "교육 참여율이 낮을 때 해결책은?", a: "주제의 적합성뿐만 아니라 일정이 현업의 피크 타임과 겹치지는 않는지 먼저 점검해보세요.", n: "배움지기", c: "HRD/교육" },
        { q: "교육 성과가 바로 안 보이면 실패인가요?", a: "아닙니다. 교육 성과는 씨앗을 뿌리는 것과 같아 누적된 후 큰 변화로 나타납니다.", n: "인내의HRD", c: "현업 고민" },
      ]

      // Q31 ~ Q100 구간 생성
      for (let i = 1; i <= 100; i++) {
        const isExplicit = MOCK_QUESTIONS.some(mq => mq.id === `sample-${i}`);
        if (isExplicit) continue;

        const contentIndex = i % hrdContents.length;
        extraSamples.push({
          id: `sample-hrd-${i}`,
          title: hrdContents[contentIndex].q + ` (No.${i})`,
          text: `안녕하세요. 인사 업무를 하다보니 궁금한 점이 생겼어요. ${hrdContents[contentIndex].q} 다른 회사 담당자님들은 어떻게 해결하고 계신가요? 조언 부탁드립니다!`,
          nickname: hrdContents[contentIndex].n + "_" + i,
          userId: `mock-hrd-${i}`,
          userRole: "member",
          jobTitle: "HRD담당",
          viewCount: Math.floor(Math.random() * 400),
          answerCount: 1,
          createdAt: Date.now() - 1000 * 60 * 60 * i,
          category: hrdContents[contentIndex].c
        })
      }
      return [...MOCK_QUESTIONS, ...extraSamples].sort((a, b) => b.createdAt - a.createdAt)
    }
    return fetched
  }, [questionsData, searchQuery])

  // 정답 매핑 (샘플 데이터용)
  const getMockAnswer = (questionId: string) => {
    if (questionId.startsWith("sample-hrd-")) {
      const idNum = parseInt(questionId.split("-")[2]);
      const hrdAnswers = [
        "사후 관리가 핵심입니다! 요약본을 사내 게시판에 올리거나 관련 숏폼 영상을 제작해 배포해 보세요.",
        "정량적 수치도 중요하지만 실제 현업의 변화 사례(Success Story)를 발굴해 공유하는 것이 훨씬 설득력 있습니다.",
        "내부 강사에게는 충분한 보상과 강의 역량 강화 교육을 별도로 제공해야 지속 가능한 제도가 됩니다.",
        "일방적인 강의보다는 토론이나 라운드테이블 형식을 취해 임원분들의 목소리가 더 많이 나오게 유도하세요.",
        "익명 설문이나 소규모 인터뷰를 통해 '우리 조직의 진짜 문제'가 무엇인지 파악하는 것이 우선입니다.",
        "참여가 현업의 성과에 어떻게 기여하는지 팀장님들을 먼저 설득해 지원 사격을 받으세요.",
        "교육 후 3개월 뒤의 변화를 추적하는 '팔로업 세션'을 운영해 보시면 성과 증명이 훨씬 수월해집니다."
      ];
      return [{
        id: `ans-hrd-${idNum}`,
        questionId,
        text: hrdAnswers[idNum % hrdAnswers.length],
        nickname: "위스퍼러",
        userId: "ai-mentor",
        userRole: "mentor",
        jobTitle: "전문가",
        createdAt: Date.now() - 1000 * 60 * 60
      }];
    }
    return [];
  }

  const answersQuery = useMemoFirebase(() => {
    if (!db || !selectedQuestionId) return null
    return query(collection(db, "questions", selectedQuestionId, "answers"), orderBy("createdAt", "desc"))
  }, [db, selectedQuestionId])
  const { data: answersData } = useCollection<Answer>(answersQuery)
  
  const answers = useMemo(() => {
    const fetched = answersData || []
    if (selectedQuestionId?.startsWith("sample-")) {
      const explicit = MOCK_ANSWERS.filter(a => a.questionId === selectedQuestionId)
      const dynamic = getMockAnswer(selectedQuestionId)
      return [...fetched, ...explicit, ...dynamic]
    }
    return fetched
  }, [answersData, selectedQuestionId])

  const filteredQuestions = useMemo(() => {
    let result = [...questions]
    if (searchQuery.trim()) {
      const keywords = searchQuery.toLowerCase().split(/\s+/).filter(k => k.length > 0)
      result = result.filter(q => {
        const content = `${q.title} ${q.text} ${q.nickname} ${q.category || ""} ${q.jobTitle || ""}`.toLowerCase()
        return keywords.every(kw => content.includes(kw))
      })
    }
    if (activeTab === "popular") result.sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0))
    else if (activeTab === "waiting") result = result.filter(q => (q.answerCount || 0) === 0)
    else if (activeTab === "hrd") result = result.filter(q => q.category === "HRD/교육")
    else if (activeTab === "culture") result = result.filter(q => q.category === "조직문화/EVP")
    
    return result
  }, [questions, searchQuery, activeTab])

  const paginatedQuestions = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE
    return filteredQuestions.slice(start, start + ITEMS_PER_PAGE)
  }, [filteredQuestions, currentPage])

  const totalPages = Math.ceil(filteredQuestions.length / ITEMS_PER_PAGE)

  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, activeTab])

  const handleAddQuestion = (nickname: string, title: string, text: string, imageUrl?: string, videoUrl?: string, category?: string) => {
    if (!db || !user) return
    const questionData = {
      title, text, nickname, userId: user.uid, userRole: profile?.role || "member",
      jobTitle: profile?.jobTitle || null, userProfilePicture: profile?.profilePictureUrl || null,
      imageUrl: imageUrl || null, videoUrl: videoUrl || null, category: category || null,
      viewCount: 0, answerCount: 0, createdAt: Date.now(),
    }
    addDocumentNonBlocking(collection(db, "questions"), questionData).then((docRef) => {
      if (docRef) {
        generateAiReply({ title, text }).then((res) => {
          const aiAnswer = {
            questionId: docRef.id, text: res.replyText, nickname: "알디", userId: "ai-whisper",
            userRole: "admin", jobTitle: "AI 길잡이", createdAt: Date.now(),
          }
          addDocumentNonBlocking(collection(db, "questions", docRef.id, "answers"), aiAnswer)
          updateDocumentNonBlocking(doc(db, "questions", docRef.id), { answerCount: increment(1) })
        })
      }
    })
  }

  const handleAddAnswer = (nickname: string, title: string, text: string) => {
    if (!db || !selectedQuestionId || !user) return
    const q = questions.find(q => q.id === selectedQuestionId)
    if (!q) return
    const answerData = {
      questionId: selectedQuestionId, text, nickname, userId: user.uid,
      userRole: profile?.role || "member", jobTitle: profile?.jobTitle || null,
      userProfilePicture: profile?.profilePictureUrl || null, createdAt: Date.now(),
    }
    addDocumentNonBlocking(collection(db, "questions", selectedQuestionId, "answers"), answerData).then(() => {
      if (q.userId !== user.uid) {
        addDocumentNonBlocking(collection(db, "notifications"), {
          userId: q.userId, type: "new_answer", questionId: selectedQuestionId,
          questionTitle: q.title, senderNickname: nickname, createdAt: Date.now(), isRead: false
        })
      }
    })
    updateDocumentNonBlocking(doc(db, "questions", selectedQuestionId), { answerCount: increment(1) })
  }

  const handleSelectQuestion = (id: string) => {
    if (selectedQuestionId === id) setSelectedQuestionId(null)
    else {
      setSelectedQuestionId(id)
      if (db && !id.startsWith("sample-")) updateDocumentNonBlocking(doc(db, "questions", id), { viewCount: increment(1) })
    }
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <Header onSearch={setSearchQuery} />
      <div className="max-w-7xl mx-auto px-0 md:px-4 py-0 md:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <main className={cn("space-y-0 md:space-y-10 transition-all duration-500", searchQuery.trim().length > 0 ? "lg:col-span-12 max-w-4xl mx-auto w-full" : "lg:col-span-8")}>
            {searchQuery.trim().length > 0 ? (
              <div className="px-4 md:px-0 mt-8">
                <button onClick={() => setSearchQuery("")} className="flex items-center gap-2 text-primary/40 hover:text-accent font-bold text-sm mb-6 transition-colors w-fit">
                  <ArrowLeft className="w-4 h-4" /> 홈으로 돌아가기
                </button>
                <h2 className="text-3xl font-black text-primary mb-8">"<span className="text-accent">{searchQuery}</span>" 검색 결과</h2>
                <QuestionFeed questions={paginatedQuestions} onSelectQuestion={handleSelectQuestion} selectedId={selectedQuestionId} answers={answers} onAddAnswer={handleAddAnswer} activeTab={activeTab as any} onTabChange={setActiveTab as any} />
              </div>
            ) : (
              <div className="flex flex-col gap-0 md:gap-10">
                <MainBanner />
                <div className="px-4 md:px-0 -mt-6 md:mt-0 relative z-20"><SubmissionForm type="question" placeholder="HR 고민을 속삭여보세요." onSubmit={handleAddQuestion} /></div>
                <div className="px-4 md:px-0">
                  <div className="flex gap-4 md:gap-8 whitespace-nowrap mb-6 overflow-x-auto pb-2 scrollbar-hide">
                    {["all", "popular", "waiting", "hrd", "culture"].map((tab) => (
                      <button 
                        key={tab}
                        onClick={() => setActiveTab(tab as any)}
                        className={cn(
                          "text-sm md:text-base pb-2 transition-all border-b-2",
                          activeTab === tab ? "font-black text-primary border-accent" : "font-bold text-primary/20 border-transparent hover:text-primary"
                        )}
                      >
                        {tab === "all" ? "전체 피드" : tab === "popular" ? "실시간 인기" : tab === "waiting" ? "답변 대기" : tab === "hrd" ? "HRD/교육" : "조직문화"}
                      </button>
                    ))}
                  </div>
                  
                  <QuestionFeed questions={paginatedQuestions} onSelectQuestion={handleSelectQuestion} selectedId={selectedQuestionId} answers={answers} onAddAnswer={handleAddAnswer} activeTab={activeTab as any} onTabChange={setActiveTab as any} />
                  
                  {totalPages > 1 && (
                    <div className="flex justify-center items-center gap-2 mt-12 pb-20">
                      <Button variant="ghost" size="icon" disabled={currentPage === 1} onClick={() => setCurrentPage(p => Math.max(1, p - 1))} className="rounded-xl text-primary/40"><ChevronLeft className="w-5 h-5" /></Button>
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                        <Button key={page} onClick={() => setCurrentPage(page)} className={cn("w-10 h-10 rounded-xl font-black text-sm transition-all", currentPage === page ? "bg-primary text-accent shadow-lg" : "bg-white text-primary/20 hover:bg-primary/5 shadow-sm")}>{page}</Button>
                      ))}
                      <Button variant="ghost" size="icon" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} className="rounded-xl text-primary/40"><ChevronRight className="w-5 h-5" /></Button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </main>
          {searchQuery.trim().length === 0 && (
            <aside className="lg:col-span-4 space-y-8 hidden lg:block">
              <AldiChat />
              <RankingList questions={questions.slice(0, 5)} onSelectQuestion={handleSelectQuestion} />
            </aside>
          )}
        </div>
      </div>
    </div>
  )
}
