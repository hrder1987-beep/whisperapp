
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

// --- 실무 샘플 데이터 (Q1-Q100) ---
const MOCK_QUESTIONS: Question[] = [
  { id: "sample-1", title: "휴일에 근무하면 무조건 보상휴가로 처리해야 하나요?", text: "안녕하세요. 저희 팀원이 이번 주말에 업무가 몰려서 나와서 일하게 됐는데, 이걸 꼭 보상휴가로만 줘야 하는 건지 궁금해서요. 대체휴일로 운영해도 법적으로 문제가 없을까요? 다른 회사 실무자분들은 어떻게 처리하시나요?", nickname: "초보인사돌이", userId: "mock-1", userRole: "member", jobTitle: "인사담당자", viewCount: 142, answerCount: 1, createdAt: Date.now() - 1000 * 60 * 60 * 1, category: "인사전략/HRM" },
  { id: "sample-2", title: "휴일대체 동의서, 매번 개인별로 다 받아야 할까요?", text: "인원이 꽤 되다 보니 휴일대체 할 때마다 일일이 사인 받는 게 정말 큰 일이네요... 근로자대표랑 합의만 되어 있으면 개별 동의는 안 받아도 되는지, 아니면 그래도 안전하게 다 받아야 하는지 조언 부탁드려요!", nickname: "프로페이롤러", userId: "mock-2", userRole: "member", jobTitle: "HR운영", viewCount: 98, answerCount: 1, createdAt: Date.now() - 1000 * 60 * 60 * 3, category: "현업 고민" },
  { id: "sample-3", title: "휴일근무 대체휴무, 주휴일만 가능한가요?", text: "주말 근무 건으로 대체휴무를 주려고 하는데, 이게 법적으로 주휴일에만 해당되는 건지 헷갈리네요. 평일 공휴일에 일한 건 어떻게 처리하는 게 깔끔할까요?", nickname: "연차계산중", userId: "mock-3", userRole: "member", jobTitle: "인사총무", viewCount: 110, answerCount: 1, createdAt: Date.now() - 1000 * 60 * 60 * 5, category: "인사전략/HRM" },
  { id: "sample-4", title: "노사협의회 설치할 때 선거관리위원회 꼭 있어야 하나요?", text: "이번에 처음으로 노사협의회를 만들려고 하는데 서류가 정말 많네요 ㅜㅜ 선관위 구성을 반드시 해야 한다고 들은 것 같기도 한데, 필수 사항인지 궁금합니다!", nickname: "노사협의초보", userId: "mock-4", userRole: "member", jobTitle: "노무담당", viewCount: 85, answerCount: 1, createdAt: Date.now() - 1000 * 60 * 60 * 8, category: "기타 정보" },
  { id: "sample-5", title: "노사협의회 의장이랑 간사 선임도 법적 필수인가요?", text: "협의회 위원은 다 뽑았는데 의장이랑 간사까지 꼭 정해놔야 하는 건지... 그냥 형식적인 건지 실무적인 관행인지 알고 싶어요.", nickname: "김대리HR", userId: "mock-5", userRole: "member", jobTitle: "인사기획", viewCount: 72, answerCount: 1, createdAt: Date.now() - 1000 * 60 * 60 * 12, category: "인사전략/HRM" },
  { id: "sample-6", title: "근로감독 나오면 노사협의회 서류 어디까지 보나요?", text: "갑자기 근로감독 예고를 받아서 떨리네요... 노사협의회 관련 서류도 다 본다고 하던데, 보통 어떤 거 위주로 챙겨둬야 할까요? 팁 좀 주세요!", nickname: "감독대비중", userId: "mock-6", userRole: "member", jobTitle: "HR매니저", viewCount: 230, answerCount: 1, createdAt: Date.now() - 1000 * 60 * 60 * 24, category: "현업 고민" },
  { id: "sample-7", title: "근로감독관이 선거 절차까지 꼼꼼히 확인하나요?", text: "노사협의회 위원 뽑을 때 투표 절차 같은 걸 사진이나 기록으로 다 남겨놔야 하는지... 실제 감독관분들이 이런 사소한 절차까지 다 검증하시는지 궁금합니다.", nickname: "인사팀막내", userId: "mock-7", userRole: "member", jobTitle: "인사운영", viewCount: 156, answerCount: 1, createdAt: Date.now() - 1000 * 60 * 60 * 28, category: "기타 정보" },
  { id: "sample-8", title: "위원 재선임만 했는데 노동청 신고해야 하나요?", text: "규정은 그대로고 위원들만 새로 뽑았거든요. 이런 단순 변동 사항도 노동청에 일일이 신고해야 하는 건지 알려주세요!", nickname: "신고왕", userId: "mock-8", userRole: "member", jobTitle: "노무지원", viewCount: 64, answerCount: 1, createdAt: Date.now() - 1000 * 60 * 60 * 32, category: "인사전략/HRM" },
  { id: "sample-9", title: "고충처리위원 선임, 이거 정말 필수인가요?", text: "노사협의회는 있는데 고충처리위원은 따로 안 정해놨거든요. 이거 안 하면 나중에 문제 될까요? 규모가 크지 않아서 고민이네요.", nickname: "고민많은H", userId: "mock-9", userRole: "member", jobTitle: "인사담당", viewCount: 120, answerCount: 1, createdAt: Date.now() - 1000 * 60 * 60 * 40, category: "현업 고민" },
  { id: "sample-10", title: "칠순 경조사 기준, 보통 만 나이로 하시나요?", text: "경조 규정에 칠순 축하금이 있는데, 이게 만 나이 기준인지 그냥 세는 나이 기준인지 헷갈리네요. 다들 어떻게 운영하시나요?", nickname: "경조사마스터", userId: "mock-10", userRole: "member", jobTitle: "복리후생", viewCount: 180, answerCount: 1, createdAt: Date.now() - 1000 * 60 * 60 * 48, category: "복지/유연근무" },
  { id: "sample-35", title: "1년 미만자에게 연차를 선부여하는 제도, 불법은 아니죠?", text: "신입사원분들 기 살려주려고 입사하자마자 연차를 미리 며칠 주려고 하거든요. 이게 법적으로 문제가 되는 방식인가요? 유리한 거니까 괜찮겠죠?", nickname: "연차계산기", userId: "mock-35", userRole: "member", jobTitle: "인사운영", viewCount: 215, answerCount: 1, createdAt: Date.now() - 1000 * 60 * 60 * 50, category: "복지/유연근무" },
  { id: "sample-36", title: "선부여한 연차 다 쓰고 퇴사하면 급여에서 까도 되나요?", text: "연차 선부여 제도를 운영 중인데, 어떤 분이 1년도 안 돼서 퇴사하시면서 미리 준 연차를 다 쓰셨더라고요. 이거 마지막 달 월급에서 정산해도 법적으로 문제 없을까요?", nickname: "퇴사처리중", userId: "mock-36", userRole: "member", jobTitle: "HR운영", viewCount: 310, answerCount: 1, createdAt: Date.now() - 1000 * 60 * 60 * 55, category: "인사전략/HRM" },
  { id: "sample-39", title: "권고사직인데 사직서에 '개인사정'이라 적으면 실업급여 못 받나요?", text: "회사에서 나가달라고 해서 나가는 건데, 사직서 양식에는 그냥 개인사정이라고 적으라고 하네요... 이거 나중에 고용보험 신고할 때 문제 생겨서 실업급여 못 받을까 봐 걱정돼요.", nickname: "실직예정자", userId: "mock-39", userRole: "member", jobTitle: "일반회원", viewCount: 540, answerCount: 1, createdAt: Date.now() - 1000 * 60 * 60 * 60, category: "현업 고민" },
  { id: "sample-44", title: "채권추심 들어온 직원 월급, 전부 다 안 줘도 되나요?", text: "직원분 중에 빚 때문에 월급 압류 통지서가 온 분이 계세요. 이거 회사가 다 떼서 법원에 내야 하는 건지, 아니면 최소한으로 줘야 하는 금액이 따로 있나요?", nickname: "압류통지서", userId: "mock-44", userRole: "member", jobTitle: "급여담당", viewCount: 185, answerCount: 1, createdAt: Date.now() - 1000 * 60 * 60 * 70, category: "인사전략/HRM" },
  { id: "sample-52", title: "해외영업 10년 차면 연봉 어느 정도가 적당할까요?", text: "이번에 경력직 채용 중인데 해외영업 10년 차 분이 오셨거든요. 중견기업 기준으로 다들 연봉 밴드를 어느 정도로 잡고 계신지 궁금합니다. 가이드라인이 필요해요!", nickname: "채용매니저", userId: "mock-52", userRole: "member", jobTitle: "채용담당", viewCount: 420, answerCount: 1, createdAt: Date.now() - 1000 * 60 * 60 * 80, category: "채용/헤드헌팅" },
  { id: "sample-57", title: "인사팀이 너무 평화로운데... 제가 일을 만들어도 될까요?", text: "루틴 업무가 끝나면 시간이 좀 남는데, 사내 규정집을 새로 만든다거나 교육 프로그램을 기획해 보려고 해요. 신입이 너무 나대는 것처럼 보일까 봐 고민되네요 ㅜㅜ", nickname: "열정인사", userId: "mock-57", userRole: "member", jobTitle: "신입HR", viewCount: 290, answerCount: 1, createdAt: Date.now() - 1000 * 60 * 60 * 90, category: "L&D/교육설계" },
  { id: "sample-65", title: "인사팀인데 자꾸 비품 관리나 총무 일을 시켜요.", text: "인사기획 하러 들어왔는데 매일 복사지 주문하고 공기청정기 필터 교체만 하고 있어요... 원래 중소기업 인사는 총무 업무랑 한 몸인 게 국룰인가요?", nickname: "총무겸직중", userId: "mock-65", userRole: "member", jobTitle: "인사총무", viewCount: 380, answerCount: 1, createdAt: Date.now() - 1000 * 60 * 60 * 100, category: "현업 고민" },
  { id: "sample-73", title: "급여 담당자가 연말정산까지 다 하는 게 일반적인가요?", text: "혼자서 150명분 급여 치고 있는데 연말정산까지 제 업무라고 하네요. 원래 페이롤 담당자가 연말정산까지 세트로 묶이는 건지, 다들 사정은 어떤지 궁금해요.", nickname: "연말정산무서워", userId: "mock-73", userRole: "member", jobTitle: "급여담당", viewCount: 240, answerCount: 1, createdAt: Date.now() - 1000 * 60 * 60 * 110, category: "기타 정보" },
  { id: "sample-80", title: "인사 업무는 왜 이렇게 딱 떨어지는 정답이 없을까요?", text: "법대로만 하면 될 줄 알았는데 사람 마음 다치는 일도 생기고, 회사 사정 봐주다 보면 법이랑 멀어지고... 매번 결정할 때마다 이게 맞나 싶어서 밤잠 설치네요.", nickname: "고민하는H", userId: "mock-80", userRole: "member", jobTitle: "인사팀장", viewCount: 460, answerCount: 1, createdAt: Date.now() - 1000 * 60 * 60 * 120, category: "현업 고민" },
  { id: "sample-92", title: "인사 실무에서 가장 중요한 태도가 뭐라고 생각하세요?", text: "법적 지식도 중요하지만, 제가 볼 땐 '모르는 걸 모른다고 말하고 다시 확인하는 용기'가 제일 중요한 것 같아요. 여러분의 생각은 어떠신가요?", nickname: "실무마스터", userId: "mock-92", userRole: "member", jobTitle: "노무자문", viewCount: 320, answerCount: 1, createdAt: Date.now() - 1000 * 60 * 60 * 130, category: "인사전략/HRM" },
  { id: "sample-100", title: "인사 커리어 롱런하려면 지금 뭘 준비해야 할까요?", text: "지금 회사에서 3년째인데, 이직을 해야 할지 아니면 더 깊게 파고들어야 할지 모르겠어요. 선배님들은 커리어 관리 어떻게 하셨나요?", nickname: "미래걱정", userId: "mock-100", userRole: "member", jobTitle: "3년차HR", viewCount: 510, answerCount: 1, createdAt: Date.now() - 1000 * 60 * 60 * 140, category: "인사전략/HRM" },
]

const MOCK_ANSWERS: Answer[] = [
  { id: "ans-1", questionId: "sample-1", text: "아닙니다! 휴일근무를 보상휴가로 처리할지, 휴일대체로 할지는 노사 합의 사항이에요. 근로자대표와 사전 서면 합의가 있다면 휴일대체가 가능하고요, 모든 휴일근무를 보상휴가로 해야 할 법적 의무는 없으니 안심하세요.", nickname: "노무마스터", userId: "ai-1", userRole: "mentor", jobTitle: "노무사", createdAt: Date.now() - 1000 * 60 * 30 },
  { id: "ans-2", questionId: "sample-2", text: "반드시 개인별로 매번 받을 필요는 없습니다. 근로자대표와 포괄적 서면 합의가 있다면 개별 동의 없이 운영하는 경우가 일반적입니다. 다만 분쟁 예방을 위해 내부 규정이나 공지 형태로 명확히 남겨두는 것이 좋습니다.", nickname: "베테랑HR", userId: "ai-2", userRole: "mentor", jobTitle: "인사팀장", createdAt: Date.now() - 1000 * 60 * 45 },
  { id: "ans-35", questionId: "sample-35", text: "불법은 절대 아닙니다! 법정 연차보다 유리한 조건을 부여하는 건 오히려 권장되는 사항이죠. 다만, 나중에 입사 1년이 됐을 때 발생할 연차에서 미리 준 걸 어떻게 차감할지 규정에 명확히 적어두셔야 나중에 딴소리(?)가 안 나옵니다.", nickname: "베테랑HR", userId: "ai-35", userRole: "mentor", jobTitle: "인사팀장", createdAt: Date.now() - 1000 * 60 * 40 },
  { id: "ans-36", questionId: "sample-36", text: "네, 가능합니다. 다만 사전에 취업규칙이나 근로계약서 등에 '선부여 연차 초과 사용 시 퇴사 급여에서 공제한다'는 내용이 명시되어 있어야 분쟁 없이 깔끔하게 처리할 수 있습니다.", nickname: "급여고수", userId: "ai-36", userRole: "mentor", jobTitle: "인사운영", createdAt: Date.now() - 1000 * 60 * 50 },
  { id: "ans-39", questionId: "sample-39", text: "네, 큰 영향이 있습니다. 권고사직인데 사직서에 개인사정이라고 적으면 고용센터에서 자발적 퇴사로 봐서 실업급여를 안 줄 수도 있어요. 회사랑 얘기해서 고용보험 상실 사유를 반드시 '권고사직' 코드로 넣어달라고 확답 받으셔야 합니다!", nickname: "노무꿈나무", userId: "ai-39", userRole: "mentor", jobTitle: "노무지원", createdAt: Date.now() - 1000 * 60 * 50 },
  { id: "ans-44", questionId: "sample-44", text: "전액 공제는 안 됩니다! 법적으로 최저생계비(보통 월 185만원 정도)는 압류 금지 금액이라서 그 이상만 압류가 가능해요. 압류 통지서에 적힌 금액과 계산법을 꼼꼼히 보시고, 애매하면 법원 민원실에 전화 한 통 해보시는 게 제일 정확합니다.", nickname: "급여고수", userId: "ai-44", userRole: "mentor", jobTitle: "인사운영", createdAt: Date.now() - 1000 * 60 * 60 },
]

export default function HomePage() {
  const { user } = useUser()
  const db = useFirestore()
  
  const userDocRef = useMemoFirebase(() => (user && db) ? doc(db, "users", user.uid) : null, [user, db])
  const { data: profile } = useDoc<any>(userDocRef)

  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState<"all" | "popular" | "waiting">("all")
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(null)
  
  // 페이지네이션 상태
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
    // 샘플 데이터 100개를 채우기 위해 루프를 돌려 Q35-Q100 생성 (데모용)
    const extraSamples: Question[] = []
    if (fetched.length === 0 && !searchQuery) {
      // Q11 ~ Q100 자동 생성 시뮬레이션
      for (let i = 11; i <= 100; i++) {
        if (i === 35 || i === 36 || i === 39 || i === 44 || i === 52 || i === 57 || i === 65 || i === 73 || i === 80 || i === 92 || i === 100) continue;
        extraSamples.push({
          id: `sample-${i}`,
          title: `[Q${i}] 인사 실무 관련 질문입니다.`,
          text: `인사팀에서 근무하면서 마주하게 되는 Q${i}번에 대한 실무적인 고민입니다. 다들 어떻게 처리하시나요?`,
          nickname: `전문가_${i}`,
          userId: `mock-${i}`,
          userRole: "member",
          jobTitle: "인사팀",
          viewCount: Math.floor(Math.random() * 200),
          answerCount: 0,
          createdAt: Date.now() - 1000 * 60 * 60 * i,
          category: "인사전략/HRM"
        })
      }
      return [...MOCK_QUESTIONS, ...extraSamples]
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

  // 페이지네이션 적용 데이터
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
                  
                  {/* 페이지네이션 UI */}
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
