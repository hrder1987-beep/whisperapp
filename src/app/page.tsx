
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
import { ChevronLeft, ChevronRight } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { generateAiReply } from "@/ai/flows/generate-ai-reply-flow"
import { cn } from "@/lib/utils"
import { useFirestore, useCollection, useDoc, useMemoFirebase, addDocumentNonBlocking, updateDocumentNonBlocking, useUser } from "@/firebase"
import { collection, query, orderBy, doc, increment } from "firebase/firestore"
import { Badge } from "@/components/ui/badge"

const ITEMS_PER_PAGE = 7

// [SET 1] HRM / 노무 실무 지식 (Q1-Q30, Q35-Q100)
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
  { id: "hr-q35", title: "1년 미만자에게 연차를 선부여하는 제도는 불법인가요?", text: "신규 입사자분들이 연차를 미리 쓰고 싶어 하셔서 선부여 제도를 만들려는데, 법적으로 문제 없을까요?", nickname: "연차계산기", userId: "mock-u35", userRole: "member", jobTitle: "HRM", viewCount: 112, answerCount: 1, createdAt: 1714644000000, category: "복지/유연근무" },
  { id: "hr-q39", title: "권고사직인데 개인사정 퇴사로 처리되면 실업급여에 영향 있나요?", text: "회사에서 권고사직이라면서 사직서에는 개인사정으로 쓰라고 하네요... 이거 믿어도 되는 건가요? ㅜㅜ", nickname: "실직예정자", userId: "mock-u39", userRole: "member", jobTitle: "영업", viewCount: 340, answerCount: 1, createdAt: 1714658400000, category: "현업 고민" },
  { id: "hr-q44", title: "채권추심 중인 근로자의 급여를 전액 공제해도 되나요?", text: "압류 들어온 직원이 있는데, 급여 다 줘도 되나요 아니면 0원으로 줘도 되나요? 처음이라 당황스럽네요.", nickname: "급여압류", userId: "mock-u44", userRole: "member", jobTitle: "페이롤", viewCount: 156, answerCount: 1, createdAt: 1714676400000, category: "인사전략/HRM" },
  { id: "hr-q52", title: "해외영업 10년 차의 보편적인 연봉 수준은 어느 정도인가요?", text: "이직 제안이 왔는데 연봉을 어느 정도 불러야 실례가 아닐지... 대략적인 시장가가 궁금합니다.", nickname: "연봉상승꿈나무", userId: "mock-u52", userRole: "member", jobTitle: "해외영업", viewCount: 420, answerCount: 1, createdAt: 1714705200000, category: "기타 정보" },
  { id: "hr-q57", title: "인사팀이 한가한데 개선 과제를 만들어도 될까요?", text: "요즘 업무가 좀 여유로운데, 제가 먼저 일을 찾아서 하면 상사분이 안 좋아하실까요? 열정 넘치는 신입입니다!", nickname: "열정인사", userId: "mock-u57", userRole: "member", jobTitle: "신입", viewCount: 180, answerCount: 1, createdAt: 1714723200000, category: "현업 고민" },
  { id: "hr-q73", title: "급여 담당자가 연말정산까지 맡는 게 일반적인가요?", text: "저는 급여만 하는 줄 알았는데 연말정산 시즌 되니까 저보고 하라네요... 다들 이러시나요?", nickname: "연말정산무서워", userId: "mock-u73", userRole: "member", jobTitle: "인사담당자", viewCount: 220, answerCount: 1, createdAt: 1714780800000, category: "기타 정보" },
  { id: "hr-q100", title: "인사 커리어를 오래 가져가려면 가장 중요한 것은 무엇인가요?", text: "지금 다니는 회사 기준 말고, 밖에서도 통하는 전문가가 되고 싶습니다. 선배님들의 조언 부탁드려요.", nickname: "커리어고민", userId: "mock-u100", userRole: "member", jobTitle: "HR", viewCount: 510, answerCount: 1, createdAt: 1714800000000, category: "현업 고민" }
];

// [SET 2] 조직문화 / 타운홀 (cul-q1~cul-q30)
const CULTURE_QUESTIONS: Question[] = [
  { id: "cul-q1", title: "임원과의 타운홀 미팅에서 익명 질문 방식이 효과적인가요?", text: "이번에 대표님이랑 소통 시간 가지려는데, 손 들고 질문하라면 아무도 안 할 것 같아서요... 익명 툴 쓰면 분위기 좀 살까요?", nickname: "컬처디렉터", userId: "mock-c1", userRole: "member", jobTitle: "조직문화", viewCount: 198, answerCount: 1, createdAt: 1714881600000, category: "조직문화/EVP" },
  { id: "cul-q2", title: "타운홀 미팅은 보통 어느 정도 시간이 적당한가요?", text: "너무 길면 지루할 것 같고 짧으면 알맹이가 없을 것 같네요. 보통 몇 분 정도로 기획하시나요?", nickname: "시간관리자", userId: "mock-c2", userRole: "member", jobTitle: "인사팀", viewCount: 85, answerCount: 1, createdAt: 1714885200000, category: "조직문화/EVP" },
  { id: "cul-q8", title: "조직문화 활성화와 조직문화 개선은 같은 개념인가요?", text: "사내 공지 올릴 때 용어 선택이 고민되네요. 활성화라고 할까요 개선이라고 할까요?", nickname: "단어선택중", userId: "mock-c8", userRole: "member", jobTitle: "컬처팀", viewCount: 110, answerCount: 1, createdAt: 1714906800000, category: "조직문화/EVP" },
  { id: "cul-q14", title: "개인정보 보호 관련 사내 공지는 반드시 해야 하나요?", text: "인사팀에서 이런 것까지 다 챙겨야 하는지... 매년 하는 게 맞는지 궁금합니다.", nickname: "보안꼼꼼이", userId: "mock-c14", userRole: "member", jobTitle: "HR매니저", viewCount: 145, answerCount: 1, createdAt: 1714928400000, category: "인사전략/HRM" },
  { id: "cul-q21", title: "인사팀 공용 엑셀 파일을 팀원이 임의로 수정하면 누구 책임인가요?", text: "공유 파일 히스토리가 안 남아서 누가 고쳤는지 모르겠네요. 다들 관리 어떻게 하세요?", nickname: "엑셀지키미", userId: "mock-c21", userRole: "member", jobTitle: "페이롤", viewCount: 167, answerCount: 1, createdAt: 1714953600000, category: "인사전략/HRM" },
  { id: "cul-q30", title: "무급휴가는 결근과 같은 개념인가요?", text: "근태 관리 시스템에 무급휴가를 넣으려는데, 결근이랑 어떻게 다르게 처리하시는지 궁금합니다.", nickname: "근태관리", userId: "mock-c30", userRole: "member", jobTitle: "HRM", viewCount: 92, answerCount: 1, createdAt: 1714986000000, category: "복지/유연근무" }
];

// [SET 3] HRD / 교육 실무 (cul-q31~cul-q100)
const HRD_QUESTIONS: Question[] = [
  { id: "cul-q31", title: "타운홀 미팅을 교육 프로그램으로 봐도 될까요?", text: "HRD 예산으로 타운홀 운영비를 써도 될지 고민입니다. 리더십 교육의 일환으로 볼 수 있을까요?", nickname: "교육기획자K", userId: "mock-c31", userRole: "member", jobTitle: "HRD", viewCount: 87, answerCount: 1, createdAt: 1714989600000, category: "HRD/교육" },
  { id: "cul-q35", title: "조직문화 워크숍과 교육의 차이는 무엇인가요?", text: "강사 섭외할 때 주제를 뭐라고 명확히 해야 할까요? 워크숍이랑 교육은 준비부터 다른 것 같아요.", nickname: "워크숍빌런", userId: "mock-c35", userRole: "member", jobTitle: "HRD담당", viewCount: 124, answerCount: 1, createdAt: 1715004000000, category: "HRD/교육" },
  { id: "cul-q41", title: "교육 만족도가 높으면 교육 효과도 높은 건가요?", text: "매번 설문 점수는 잘 나오는데 실제 현업이 바뀌는지는 모르겠네요. 점수만 믿어도 될까요?", nickname: "설문봇", userId: "mock-c41", userRole: "member", jobTitle: "교육팀", viewCount: 156, answerCount: 1, createdAt: 1715025600000, category: "HRD/교육" },
  { id: "cul-q67", title: "교육 프로그램 이름이 중요한가요?", text: "그냥 '2024 신입사원 교육' 이렇게 하는 것보다 좀 힙한 이름이 나을까요? 다들 센스 좀 공유해 주세요!", nickname: "네이밍장인", userId: "mock-c67", userRole: "member", jobTitle: "HRD", viewCount: 145, answerCount: 1, createdAt: 1715115600000, category: "HRD/교육" },
  { id: "cul-q75", title: "교육 담당자의 성과는 어떻게 설명하면 좋을까요?", text: "매번 만족도만 보고하는데, 경영진분들이 실질적인 효과가 뭐냐고 물어보시면 참 답답하네요 ㅜㅜ", nickname: "성과증명", userId: "mock-c75", userRole: "member", jobTitle: "교육담당", viewCount: 230, answerCount: 1, createdAt: 1715148000000, category: "HRD/교육" },
  { id: "cul-q100", title: "앞으로 HRD 담당자에게 가장 중요해질 역량은 무엇인가요?", text: "AI니 디지털이니 변화가 너무 빠르네요. 우리는 무엇을 준비해야 할까요?", nickname: "미래인사", userId: "mock-c100", userRole: "member", jobTitle: "HRD", viewCount: 420, answerCount: 1, createdAt: 1715238000000, category: "HRD/교육" }
];

const MOCK_QUESTIONS: Question[] = [...HRM_QUESTIONS, ...CULTURE_QUESTIONS, ...HRD_QUESTIONS];

const MOCK_ANSWERS: Answer[] = [
  { id: "a1", questionId: "hr-q1", text: "아닙니다. 휴일근무를 보상휴가로 처리할지, 휴일대체로 할지는 노사 합의 사항입니다. 근로자대표와 사전 서면 합의가 있다면 휴일대체가 가능하며, 모든 휴일근무를 보상휴가로 해야 할 법적 의무는 없습니다.", nickname: "위스퍼러", userId: "mock-m1", userRole: "mentor", createdAt: 1714522000000 },
  { id: "a2", questionId: "hr-q2", text: "반드시 개인별로 매번 받을 필요는 없습니다. 근로자대표와 포괄적 서면 합의가 있다면 개별 동의 없이 운영하는 경우가 일반적입니다. 다만 분쟁 예방을 위해 내부 규정이나 공지 형태로 명확히 남겨두는 것이 좋겠죠?", nickname: "전략인사", userId: "mock-m2", userRole: "mentor", createdAt: 1714526000000 },
  { id: "a10", questionId: "hr-q10", text: "법적 기준은 없으며 회사 내규에 따릅니다. 다만 최근 대부분의 기업은 '만 나이'를 기준으로 운영하여 일관성을 유지하고 있습니다. 규정에 명시해두시는 걸 추천드려요.", nickname: "복지마스터", userId: "mock-m10", userRole: "mentor", createdAt: 1714555000000 },
  { id: "ca1", questionId: "cul-q1", text: "익명 질문 방식은 임원과 구성원 간 심리적 장벽을 낮추는 데 매우 효과적입니다. 특히 슬라이도나 오픈채팅을 활용해 실시간으로 질문을 받고 답변하는 구조는 신뢰도를 높이는 데 큰 도움이 됩니다.", nickname: "문화리더", userId: "mock-m101", userRole: "mentor", createdAt: 1714882000000 },
  { id: "ha31", questionId: "cul-q31", text: "넓은 의미에서는 가능합니다. 리더의 메시지를 통해 조직 방향을 공유하고 인식을 전환한다는 점에서 비형식 학습(Informal Learning)의 한 형태로 볼 수 있습니다. 충분히 HRD 예산 활용 근거가 됩니다.", nickname: "HRD전문가", userId: "mock-m131", userRole: "mentor", createdAt: 1714990000000 }
];

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
    if (fetched.length === 0 && (selectedQuestionId?.startsWith("hr-q") || selectedQuestionId?.startsWith("cul-q"))) {
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
                    <Button key={page} onClick={() => setCurrentPage(page)} className={cn("w-10 h-10 rounded-xl font-black text-sm", currentPage === page ? "bg-primary text-accent shadow-lg" : "bg-white text-primary/20 shadow-sm")}>{page}</Button>
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
