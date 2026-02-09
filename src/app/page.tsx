
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

// --- 실무 샘플 데이터 (Q1-Q130) ---
const MOCK_QUESTIONS: Question[] = [
  { id: "sample-1", title: "휴일에 근무하면 무조건 보상휴가로 처리해야 하나요?", text: "안녕하세요. 저희 팀원이 이번 주말에 업무가 몰려서 나와서 일하게 됐는데, 이걸 꼭 보상휴가로만 줘야 하는 건지 궁금해서요. 대체휴일로 운영해도 법적으로 문제가 없을까요? 다른 회사 실무자분들은 어떻게 처리하시나요?", nickname: "초보인사돌이", userId: "mock-1", userRole: "member", jobTitle: "인사담당자", viewCount: 142, answerCount: 1, createdAt: Date.now() - 1000 * 60 * 60 * 1, category: "인사전략/HRM" },
  { id: "sample-2", title: "휴일대체 동의서, 매번 개인별로 다 받아야 할까요?", text: "인원이 꽤 되다 보니 휴일대체 할 때마다 일일이 사인 받는 게 정말 큰 일이네요... 근로자대표랑 합의만 되어 있으면 개별 동의는 안 받아도 되는지, 아니면 그래도 안전하게 다 받아야 하는지 조언 부탁드려요!", nickname: "프로페이롤러", userId: "mock-2", userRole: "member", jobTitle: "HR운영", viewCount: 98, answerCount: 1, createdAt: Date.now() - 1000 * 60 * 60 * 3, category: "현업 고민" },
  { id: "sample-3", title: "휴일근무 대체휴무, 주휴일만 가능한가요?", text: "주말 근무 건으로 대체휴무를 주려고 하는데, 이게 법적으로 주휴일에만 해당되는 건지 헷갈리네요. 평일 공휴일에 일한 건 어떻게 처리하는 게 깔끔할까요?", nickname: "연차계산중", userId: "mock-3", userRole: "member", jobTitle: "인사총무", viewCount: 110, answerCount: 1, createdAt: Date.now() - 1000 * 60 * 60 * 5, category: "인사전략/HRM" },
  { id: "sample-4", title: "노사협의회 설치할 때 선거관리위원회 꼭 있어야 하나요?", text: "이번에 처음으로 노사협의회를 만들려고 하는데 서류가 정말 많네요 ㅜㅜ 선관위 구성을 반드시 해야 한다고 들은 것 같기도 한데, 필수 사항인지 궁금합니다!", nickname: "노사협의초보", userId: "mock-4", userRole: "member", jobTitle: "노무담당", viewCount: 85, answerCount: 1, createdAt: Date.now() - 1000 * 60 * 60 * 8, category: "기타 정보" },
  { id: "sample-101", title: "타운홀 미팅에서 임원분들께 익명으로 질문 받는 거, 진짜 효과 있나요?", text: "안녕하세요! 이번에 사내 타운홀 미팅을 기획 중인데, 소통 활성화를 위해 익명 질문 툴을 써보자고 건의하려고 합니다. 혹시 실제 도입해보신 분들 계신가요? 분위기가 너무 험악해지거나(?) 관리가 안 될까 봐 걱정되는데 실무적인 팁 좀 부탁드려요!", nickname: "소통왕", userId: "mock-101", userRole: "member", jobTitle: "조직문화담당", viewCount: 320, answerCount: 1, createdAt: Date.now() - 1000 * 60 * 60 * 2, category: "조직문화/EVP" },
  { id: "sample-108", title: "조직문화 '활성화'랑 '개선'은 접근 방식이 아예 달라야 할까요?", text: "대표님이 자꾸 우리 회사 문화가 딱딱하다고 조직문화 좀 해보라고 하시는데... 이게 그냥 이벤트성으로 분위기를 띄우는 활성화인지, 아니면 제도나 평가 방식까지 건드리는 개선인지 감이 안 오네요. 여러분은 이 두 가지를 어떻게 구분해서 과제를 짜시나요?", nickname: "문화기획자H", userId: "mock-108", userRole: "member", jobTitle: "HRD", viewCount: 215, answerCount: 1, createdAt: Date.now() - 1000 * 60 * 60 * 10, category: "조직문화/EVP" },
  { id: "sample-114", title: "개인정보 보호 관련 사내 공지, 매달 해도 지나치지 않겠죠?", text: "저희 회사가 워낙 개인정보를 많이 다루는 곳이라 보안에 예민한데요. 법적 필수 교육 말고도 수시로 공지를 올리려고 합니다. 너무 자주 하면 직원들이 피로감을 느낄까 봐 걱정인데, 보통 어떤 톤으로 공지를 올리는 게 가장 효과적일까요?", nickname: "보안꼼꼼이", userId: "mock-114", userRole: "member", jobTitle: "인사운영", viewCount: 145, answerCount: 1, createdAt: Date.now() - 1000 * 60 * 60 * 20, category: "인사전략/HRM" },
  { id: "sample-121", title: "인사팀 공용 엑셀 파일... 자꾸 누가 건드려서 미치겠어요 ㅜㅜ", text: "팀원들이 같이 쓰는 급여나 인사 DB 파일이 있는데, 누군가 수식을 깨뜨리거나 데이터를 임의로 수정해서 난처할 때가 많습니다. 다들 공용 파일 관리 규칙 어떻게 정해두시나요? 아예 파일을 나누는 게 답일까요?", nickname: "엑셀지키미", userId: "mock-121", userRole: "member", jobTitle: "급여담당", viewCount: 410, answerCount: 1, createdAt: Date.now() - 1000 * 60 * 60 * 30, category: "기타 정보" },
  { id: "sample-35", title: "1년 미만자에게 연차를 선부여하는 제도, 불법은 아니죠?", text: "신입사원분들 기 살려주려고 입사하자마자 연차를 미리 며칠 주려고 하거든요. 이게 법적으로 문제가 되는 방식인가요? 유리한 거니까 괜찮겠죠?", nickname: "연차계산기", userId: "mock-35", userRole: "member", jobTitle: "인사운영", viewCount: 215, answerCount: 1, createdAt: Date.now() - 1000 * 60 * 60 * 50, category: "복지/유연근무" },
  { id: "sample-39", title: "권고사직인데 사직서에 '개인사정'이라 적으면 실업급여 못 받나요?", text: "회사에서 나가달라고 해서 나가는 건데, 사직서 양식에는 그냥 개인사정이라고 적으라고 하네요... 이거 나중에 고용보험 신고할 때 문제 생겨서 실업급여 못 받을까 봐 걱정돼요.", nickname: "실직예정자", userId: "mock-39", userRole: "member", jobTitle: "일반회원", viewCount: 540, answerCount: 1, createdAt: Date.now() - 1000 * 60 * 60 * 60, category: "현업 고민" },
  { id: "sample-127", title: "직원이 몰래 외부 면접 보러 다니다 걸렸는데... 징계가 될까요?", text: "업무 시간에 병가 내고 타사 면접 보러 간 사실이 들켰습니다. 회사 분위기를 너무 흐리고 있는데, 이런 경우에도 징계나 감봉 같은 조치가 가능할까요? 실무적으로 어떻게 대응하시는 게 좋을지 조언 부탁드립니다.", nickname: "고민하는인사팀장", userId: "mock-127", userRole: "member", jobTitle: "인사팀장", viewCount: 620, answerCount: 1, createdAt: Date.now() - 1000 * 60 * 60 * 72, category: "인사전략/HRM" },
]

const MOCK_ANSWERS: Answer[] = [
  { id: "ans-1", questionId: "sample-1", text: "아닙니다! 휴일근무를 보상휴가로 처리할지, 휴일대체로 할지는 노사 합의 사항이에요. 근로자대표와 사전 서면 합의가 있다면 휴일대체가 가능하고요, 모든 휴일근무를 보상휴가로 해야 할 법적 의무는 없으니 안심하세요.", nickname: "노무마스터", userId: "ai-1", userRole: "mentor", jobTitle: "노무사", createdAt: Date.now() - 1000 * 60 * 30 },
  { id: "ans-101", questionId: "sample-101", text: "익명 질문 방식은 구성원들의 심리적 장벽을 낮추는 데 정말 효과적입니다. Slido나 스마트폰 실시간 질문 툴을 활용해 보세요. 질문을 선별해서 답변하는 과정 자체가 경영진에 대한 신뢰도를 높여줄 거예요.", nickname: "컬처디렉터", userId: "ai-101", userRole: "mentor", jobTitle: "조직문화전문가", createdAt: Date.now() - 1000 * 60 * 40 },
  { id: "ans-108", questionId: "sample-108", text: "활성화는 에너지를 끌어올리는 단기 활동이고, 개선은 일하는 구조를 바꾸는 장기 과제입니다. 대표님이 원하시는 게 '웃는 얼굴'인지 '빠른 실행력'인지 먼저 파악하시고, 작은 소통 워크숍부터 시작해 보시는 걸 추천드려요.", nickname: "베테랑HR", userId: "ai-108", userRole: "mentor", jobTitle: "인사팀장", createdAt: Date.now() - 1000 * 60 * 50 },
  { id: "ans-114", questionId: "sample-114", text: "네, 공지는 필수입니다! 딱딱한 법조문보다는 '우리 동료의 소중한 정보를 지키는 법' 같은 따뜻하고 이해하기 쉬운 톤으로 자주 리마인드해주시면 리스크 관리에 큰 도움이 됩니다.", nickname: "노무마스터", userId: "ai-114", userRole: "mentor", jobTitle: "노무사", createdAt: Date.now() - 1000 * 60 * 60 },
  { id: "ans-121", questionId: "sample-121", text: "중요한 공용 파일은 반드시 '읽기 전용' 권한을 걸거나, 관리 책임자를 명확히 지정해야 합니다. 사전 공유 없는 임의 수정은 시스템 에러를 유발하므로 팀 내 '공용 파일 관리 원칙'을 문서화해서 공지하는 것이 최선입니다.", nickname: "급여고수", userId: "ai-121", userRole: "mentor", jobTitle: "인사운영", createdAt: Date.now() - 1000 * 60 * 70 },
  { id: "ans-35", questionId: "sample-35", text: "불법은 절대 아닙니다! 법정 연차보다 유리한 조건을 부여하는 건 오히려 권장되는 사항이죠. 다만, 나중에 입사 1년이 됐을 때 발생할 연차에서 미리 준 걸 어떻게 차감할지 규정에 명확히 적어두셔야 나중에 딴소리(?)가 안 나옵니다.", nickname: "베테랑HR", userId: "ai-35", userRole: "mentor", jobTitle: "인사팀장", createdAt: Date.now() - 1000 * 60 * 40 },
  { id: "ans-39", questionId: "sample-39", text: "네, 큰 영향이 있습니다. 권고사직인데 사직서에 개인사정이라고 적으면 고용센터에서 자발적 퇴사로 봐서 실업급여를 안 줄 수도 있어요. 회사랑 얘기해서 고용보험 상실 사유를 반드시 '권고사직' 코드로 넣어달라고 확답 받으셔야 합니다!", nickname: "노무꿈나무", userId: "ai-39", userRole: "mentor", jobTitle: "노무지원", createdAt: Date.now() - 1000 * 60 * 50 },
  { id: "ans-127", questionId: "sample-127", text: "단순히 면접을 보러 간 사실만으로는 징계가 어렵습니다. 다만 병가 사유를 허위로 보고한 '근태 부정'이나 회사 기밀 유출 정황이 있다면 인사위원회를 통해 소명 절차를 밟을 수는 있습니다. 감정적 대응보다는 규정에 근거한 조사가 먼저입니다.", nickname: "노무마스터", userId: "ai-127", userRole: "mentor", jobTitle: "노무사", createdAt: Date.now() - 1000 * 60 * 80 },
]

export default function HomePage() {
  const { user } = useUser()
  const db = useFirestore()
  
  const userDocRef = useMemoFirebase(() => (user && db) ? doc(db, "users", user.uid) : null, [user, db])
  const { data: profile } = useDoc<any>(userDocRef)

  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState<"all" | "popular" | "waiting">("all")
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
    
    // 추가 샘플 데이터 자동 생성 (기존 요청 Q1-Q130 시뮬레이션)
    const extraSamples: Question[] = []
    if (fetched.length === 0 && !searchQuery) {
      // Q1 ~ Q130 데이터 생성
      const sampleContents = [
        { q: "타운홀 미팅은 보통 어느 정도 시간이 적당한가요?", a: "시간보다는 밀도가 중요하지만 보통 1시간 내외가 집중도가 가장 높습니다.", n: "기획자H", c: "조직문화/EVP" },
        { q: "조직문화실패 요인 중 가장 큰 게 뭘까요?", a: "목적이 불분명한 상태에서 반짝 이벤트만 하는 것이 가장 큰 실패 요인입니다.", n: "고민중", c: "조직문화/EVP" },
        { q: "인사 서류 전산화하면 종이 서류 버려도 되나요?", a: "법적 보존 의무가 있는 서류는 따로 챙기셔야 하지만, 그 외에는 전산화가 훨씬 효율적입니다.", n: "디지털H", c: "기타 정보" },
        { q: "육아지원 제도는 매년 바뀌나요?", a: "네, 법 개정이 잦으니 고용노동부 가이드를 매년 체크하셔야 합니다.", n: "워킹맘대리", c: "복지/유연근무" },
        { q: "무급휴가는 결근이랑 똑같은 건가요?", a: "아닙니다. 합의된 휴가와 무단 결근은 법적 성격이 완전히 다릅니다.", n: "휴가가고파", c: "인사전략/HRM" },
      ]

      for (let i = 1; i <= 130; i++) {
        const isExplicit = MOCK_QUESTIONS.some(mq => mq.id === `sample-${i}` || mq.id === `sample-10${i % 10}`);
        if (isExplicit) continue;

        const contentIndex = i % sampleContents.length;
        extraSamples.push({
          id: `sample-gen-${i}`,
          title: sampleContents[contentIndex].q,
          text: `인사 실무를 하다 보니 궁금한 점이 생겼습니다. ${sampleContents[contentIndex].q} 다들 어떻게 생각하시나요? 현직자 선배님들의 조언 부탁드려요!`,
          nickname: sampleContents[contentIndex].n + "_" + i,
          userId: `mock-gen-${i}`,
          userRole: "member",
          jobTitle: "인사팀",
          viewCount: Math.floor(Math.random() * 300),
          answerCount: 1,
          createdAt: Date.now() - 1000 * 60 * 60 * i,
          category: sampleContents[contentIndex].c
        })
      }
      return [...MOCK_QUESTIONS, ...extraSamples].sort((a, b) => b.createdAt - a.createdAt)
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
      const samples = MOCK_ANSWERS.filter(a => a.questionId === selectedQuestionId)
      return [...fetched, ...samples]
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
                <QuestionFeed questions={paginatedQuestions} onSelectQuestion={handleSelectQuestion} selectedId={selectedQuestionId} answers={answers} onAddAnswer={handleAddAnswer} activeTab={activeTab} onTabChange={setActiveTab} />
              </div>
            ) : (
              <div className="flex flex-col gap-0 md:gap-10">
                <MainBanner />
                <div className="px-4 md:px-0 -mt-6 md:mt-0 relative z-20"><SubmissionForm type="question" placeholder="HR 고민을 속삭여보세요." onSubmit={handleAddQuestion} /></div>
                <div className="px-4 md:px-0">
                  <QuestionFeed questions={paginatedQuestions} onSelectQuestion={handleSelectQuestion} selectedId={selectedQuestionId} answers={answers} onAddAnswer={handleAddAnswer} activeTab={activeTab} onTabChange={setActiveTab} />
                  
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
