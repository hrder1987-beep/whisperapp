
import { Gathering } from "./types";

export const MOCK_GATHERINGS: Gathering[] = [
  {
    id: "sample-g1",
    title: "HR 데이터 리터러시 실무 COP 1기",
    summary: "엑셀을 넘어 파이썬과 태블로로 인사 데이터를 시각화하는 학습 모임입니다.",
    description: "데이터로 말하는 HR 담당자가 되고 싶으신가요? 본 모임은 8주간 인사 데이터를 정제하고 유의미한 지표(KPI)를 도출하는 실전 프로젝트형 학습 모임입니다.\n\n[커리큘럼]\n1주차: HR 데이터 분석의 목적과 KPI 수립\n2주차: 데이터 클렌징 실무 (Excel)\n3주차: 파이썬 기초 및 라이브러리 활용\n4주차: 시각화 도구(Tableau) 활용법",
    tags: ["데이터분석", "인사전략", "COP"],
    creatorId: "sample-u1",
    creatorName: "데이터마스터",
    type: "online",
    location: "줌(Zoom) 링크 제공",
    schedule: "2025년 3월 5일 ~ 4월 23일",
    startDate: 1741132800000,
    endDate: 1745366400000,
    capacity: 12,
    participantCount: 8,
    status: "recruiting",
    category: "COP/학습",
    imageUrl: "https://images.unsplash.com/photo-1551288049-bbbda536339a?q=80&w=800",
    createdAt: 1714521600000,
    sessionCount: 8,
    questions: [
      { id: "q1", text: "현재 회사에서 관리하고 있는 인사 데이터의 종류는 무엇인가요?", type: "text" },
      { id: "q2", text: "파이썬 사용 경험이 있으신가요?", type: "multiple", options: ["전혀 없음", "기초 문법 이해", "실무 활용 가능"] }
    ]
  },
  {
    id: "sample-g2",
    title: "인사팀장님들의 '솔직담백' 프라이빗 네트워킹",
    summary: "강남 인근에서 즐기는 시니어 HRer들의 정보 공유 및 친목의 장",
    description: "실무에서의 고충, 조직문화의 벽, 인재 채용의 어려움... 혼자 고민하지 마세요. 검증된 인사팀장님들만 모여 서로의 인사이트를 나눕니다.\n\n본 모임은 비공개로 진행되며, 참석 확정된 분들께만 상세 장소를 안내드립니다.",
    tags: ["네트워킹", "팀장모임", "오프라인"],
    creatorId: "sample-u2",
    creatorName: "컬처디렉터",
    type: "offline",
    location: "서울 강남구 역삼동 공유오피스",
    schedule: "2024년 12월 28일 18:30",
    startDate: 1735378200000,
    endDate: 1735385400000,
    capacity: 20,
    participantCount: 20,
    status: "closed",
    category: "네트워킹/친목",
    imageUrl: "https://images.unsplash.com/photo-1511632765486-a01980e01a18?q=80&w=800",
    createdAt: 1714521600000,
    sessionCount: 1,
    questions: [
      { id: "q1", text: "참여하고 싶은 이유를 한 줄로 적어주세요.", type: "text" }
    ]
  },
  {
    id: "sample-g3",
    title: "2025 글로벌 HR 트렌드 컨퍼런스",
    summary: "글로벌 빅테크 기업들의 인재 관리 방식과 2025년 전망",
    description: "빠르게 변하는 글로벌 HR 시장의 흐름을 읽습니다. 해외 연사들의 강연과 국내 전문가들의 패널 토의가 준비되어 있습니다.\n\n[주요 세션]\n- AI가 바꾸는 채용의 미래\n- 리모트 워크와 하이브리드 근무의 정착\n- 인재 유지(Retention)를 위한 새로운 보상 체계",
    tags: ["컨퍼런스", "글로벌HR", "2025전망"],
    creatorId: "sample-u3",
    creatorName: "글로벌인사",
    type: "offline",
    location: "코엑스 그랜드볼룸 103호",
    schedule: "2025년 1월 15일 10:00",
    startDate: 1736899200000,
    endDate: 1736924400000,
    capacity: 100,
    participantCount: 45,
    status: "recruiting",
    category: "컨퍼런스",
    imageUrl: "https://images.unsplash.com/photo-1540575861501-7ad05823c95b?q=80&w=800",
    createdAt: 1714521600000,
    sessionCount: 1
  }
];
