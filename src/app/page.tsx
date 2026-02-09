
"use client"

import { useState, useMemo } from "react"
import { Header } from "@/components/chuchot/Header"
import { MainBanner, BannerData } from "@/components/chuchot/MainBanner"
import { SubmissionForm } from "@/components/chuchot/SubmissionForm"
import { QuestionFeed } from "@/components/chuchot/QuestionFeed"
import { RankingList } from "@/components/chuchot/RankingList"
import { AldiChat } from "@/components/chuchot/ShuChat"
import { Question, Answer, UserRole } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { generateAiReply } from "@/ai/flows/generate-ai-reply-flow"
import { cn } from "@/lib/utils"
import { useFirestore, useCollection, useDoc, useMemoFirebase, addDocumentNonBlocking, updateDocumentNonBlocking, useUser } from "@/firebase"
import { collection, query, orderBy, doc, increment } from "firebase/firestore"

// --- 실무 샘플 데이터 (Q1-Q30) ---
const MOCK_QUESTIONS: Question[] = [
  { id: "sample-1", title: "휴일에 근무하면 무조건 보상휴가로 처리해야 하나요?", text: "저희 팀원이 이번 주말에 나와서 일하게 됐는데, 이걸 꼭 보상휴가로만 줘야 하는 건지 궁금해요. 혹시 대체휴일로 운영해도 법적으로 문제가 없을까요? 실무자분들은 어떻게 하시나요?", nickname: "초보인사돌이", userId: "mock-1", userRole: "member", jobTitle: "인사담당자", viewCount: 142, answerCount: 1, createdAt: Date.now() - 1000 * 60 * 60 * 1, category: "인사전략/HRM" },
  { id: "sample-2", title: "휴일대체 동의서, 매번 개인별로 다 받아야 할까요?", text: "인원이 꽤 되다 보니 휴일대체 할 때마다 일일이 사인 받는 게 너무 일이네요... 근로자대표랑 합의만 되어 있으면 개별 동의는 안 받아도 되는지, 아니면 그래도 안전하게 다 받아야 하는지 조언 부탁드려요!", nickname: "프로페이롤러", userId: "mock-2", userRole: "member", jobTitle: "HR운영", viewCount: 98, answerCount: 1, createdAt: Date.now() - 1000 * 60 * 60 * 3, category: "현업 고민" },
  { id: "sample-3", title: "휴일근무 대체휴무, 주휴일만 가능한가요?", text: "주말 근무 건으로 대체휴무를 주려고 하는데, 이게 법적으로 주휴일에만 해당되는 건지 헷갈리네요. 평일 공휴일에 일한 건 어떻게 처리하는 게 깔끔할까요?", nickname: "연차계산중", userId: "mock-3", userRole: "member", jobTitle: "인사총무", viewCount: 110, answerCount: 1, createdAt: Date.now() - 1000 * 60 * 60 * 5, category: "인사전략/HRM" },
  { id: "sample-4", title: "노사협의회 설치할 때 선거관리위원회 꼭 있어야 하나요?", text: "이번에 처음으로 노사협의회를 만들려고 하는데 서류가 정말 많네요 ㅜㅜ 선관위 구성을 반드시 해야 한다고 들은 것 같기도 한데, 필수 사항인지 궁금합니다!", nickname: "노사협의초보", userId: "mock-4", userRole: "member", jobTitle: "노무담당", viewCount: 85, answerCount: 1, createdAt: Date.now() - 1000 * 60 * 60 * 8, category: "법정의무" },
  { id: "sample-5", title: "노사협의회 의장이랑 간사 선임도 법적 필수인가요?", text: "협의회 위원은 다 뽑았는데 의장이랑 간사까지 꼭 정해놔야 하는 건지... 그냥 형식적인 건지 실무적인 관행인지 알고 싶어요.", nickname: "김대리HR", userId: "mock-5", userRole: "member", jobTitle: "인사기획", viewCount: 72, answerCount: 1, createdAt: Date.now() - 1000 * 60 * 60 * 12, category: "인사전략/HRM" },
  { id: "sample-6", title: "근로감독 나오면 노사협의회 서류 어디까지 보나요?", text: "갑자기 근로감독 예고를 받아서 떨리네요... 노사협의회 관련 서류도 다 본다고 하던데, 보통 어떤 거 위주로 챙겨둬야 할까요? 팁 좀 주세요!", nickname: "감독대비중", userId: "mock-6", userRole: "member", jobTitle: "HR매니저", viewCount: 230, answerCount: 1, createdAt: Date.now() - 1000 * 60 * 60 * 24, category: "현업 고민" },
  { id: "sample-7", title: "근로감독관이 선거 절차까지 꼼꼼히 확인하나요?", text: "노사협의회 위원 뽑을 때 투표 절차 같은 걸 사진이나 기록으로 다 남겨놔야 하는지... 실제 감독관분들이 이런 사소한 절차까지 다 검증하시는지 궁금합니다.", nickname: "인사팀막내", userId: "mock-7", userRole: "member", jobTitle: "인사운영", viewCount: 156, answerCount: 1, createdAt: Date.now() - 1000 * 60 * 60 * 28, category: "법정의무" },
  { id: "sample-8", title: "위원 재선임만 했는데 노동청 신고해야 하나요?", text: "규정은 그대로고 위원들만 새로 뽑았거든요. 이런 단순 변동 사항도 노동청에 일일이 신고해야 하는 건지 알려주세요!", nickname: "신고왕", userId: "mock-8", userRole: "member", jobTitle: "노무지원", viewCount: 64, answerCount: 1, createdAt: Date.now() - 1000 * 60 * 60 * 32, category: "인사전략/HRM" },
  { id: "sample-9", title: "고충처리위원 선임, 이거 정말 필수인가요?", text: "노사협의회는 있는데 고충처리위원은 따로 안 정해놨거든요. 이거 안 하면 나중에 문제 될까요? 저희는 규모가 크지 않아서 고민이네요.", nickname: "고민많은H", userId: "mock-9", userRole: "member", jobTitle: "인사담당", viewCount: 120, answerCount: 1, createdAt: Date.now() - 1000 * 60 * 60 * 40, category: "법정의무" },
  { id: "sample-10", title: "칠순 경조사 기준, 보통 만 나이로 하시나요?", text: "경조 규정에 칠순 축하금이 있는데, 이게 만 나이 기준인지 아니면 그냥 세는 나이 기준인지 헷갈리네요. 다들 어떻게 운영하시나요?", nickname: "경조사마스터", userId: "mock-10", userRole: "member", jobTitle: "복리후생", viewCount: 180, answerCount: 1, createdAt: Date.now() - 1000 * 60 * 60 * 48, category: "복지/유연근무" },
  { id: "sample-11", title: "경조 규정에 나이 기준 안 적혀있으면 어떻게 되나요?", text: "저희 규정이 좀 애매해서... 나이 기준이 명시 안 되어 있는데 직원분이 세는 나이로 신청하셨거든요. 나중에 감사나 이런 데서 문제 될 소지가 있을까요?", nickname: "규정검토자", userId: "mock-11", userRole: "member", jobTitle: "인사운영", viewCount: 95, answerCount: 1, createdAt: Date.now() - 1000 * 60 * 60 * 52, category: "복지/유연근무" },
  { id: "sample-12", title: "사이버대 졸업생 소재지 입력, 서울로 해도 될까요?", text: "인사기록 카드에 학교 소재지 적는 란이 있는데, 사이버대학교는 본교 주소인 서울로 적는 게 맞을까요? 아니면 그냥 온라인으로 표기하시나요?", nickname: "데이터입력중", userId: "mock-12", userRole: "member", jobTitle: "인사담당", viewCount: 77, answerCount: 1, createdAt: Date.now() - 1000 * 60 * 60 * 60, category: "기타 정보" },
  { id: "sample-13", title: "방통대 소재지 기재 관련 질문입니다.", text: "학력 사항 업데이트 중인데 방통대 나오신 분들 소재지를 서울 본교로 일괄 처리해도 큰 문제 없을까요? 다들 기준이 궁금합니다.", nickname: "인사관리자K", userId: "mock-13", userRole: "member", jobTitle: "HR인턴", viewCount: 62, answerCount: 1, createdAt: Date.now() - 1000 * 60 * 60 * 70, category: "기타 정보" },
  { id: "sample-14", title: "학력 소재지 기재, 실무적으로 왜 중요한가요?", text: "가끔 소재지 때문에 골머리 아플 때가 있는데, 이게 채용이나 인사 관리에서 실무적으로 어떤 큰 의미가 있는지 문득 궁금해지네요.", nickname: "본질탐구", userId: "mock-14", userRole: "member", jobTitle: "채용담당", viewCount: 145, answerCount: 1, createdAt: Date.now() - 1000 * 60 * 60 * 80, category: "기타 정보" },
  { id: "sample-15", title: "급여(페이롤) 업무만 2년째인데 인사 경력 인정되나요?", text: "지금 회사에서 급여, 4대보험, 연말정산만 계속 하고 있어요. 이직할 때 이게 '인사' 경력으로 충분히 경쟁력이 있을지 불안해서 글 남겨봅니다.", nickname: "페이롤요정", userId: "mock-15", userRole: "member", jobTitle: "급여담당", viewCount: 310, answerCount: 1, createdAt: Date.now() - 1000 * 60 * 60 * 90, category: "현업 고민" },
  { id: "sample-16", title: "페이롤만 오래 하면 소위 '물경력' 될까요?", text: "단순 반복 작업처럼 느껴질 때가 많아서 걱정이에요. 연차는 쌓이는데 제가 다른 인사업무(평가, 보상 설계 등)로 넘어갈 수 있을지 조언 부탁드려요.", nickname: "이직고민러", userId: "mock-16", userRole: "member", jobTitle: "인사담당", viewCount: 280, answerCount: 1, createdAt: Date.now() - 1000 * 60 * 60 * 100, category: "현업 고민" },
  { id: "sample-17", title: "인사 초년생인데 급여만 맡아서 불안합니다.", text: "첫 커리어를 페이롤로 시작했는데, 주변 동기들은 채용이나 기획 쪽으로 가서 부럽기도 하고... 제가 뒤처지는 건 아닐까요?", nickname: "신입HR", userId: "mock-17", userRole: "member", jobTitle: "주니어", viewCount: 190, answerCount: 1, createdAt: Date.now() - 1000 * 60 * 60 * 110, category: "현업 고민" },
  { id: "sample-18", title: "100명 규모 회사인데 인사업무가 너무 없어요.", text: "인사팀에 저 혼자인데 평소에 일이 너무 없어서 당황스럽네요. 평가 시즌 아닐 때는 그냥 루팡(?) 느낌인데 이게 정상인가요?", nickname: "한가한인사", userId: "mock-18", userRole: "member", jobTitle: "1인인사", viewCount: 420, answerCount: 1, createdAt: Date.now() - 1000 * 60 * 60 * 120, category: "현업 고민" },
  { id: "sample-19", title: "인사팀이 한가하면 조직에 문제가 있는 걸까요?", text: "저희 팀 분위기가 너무 평화로운데, 이게 시스템이 잘 갖춰진 건지 아니면 회사가 성장을 안 해서 인사가 할 일이 없는 건지 헷갈립니다.", nickname: "평화주의자", userId: "mock-19", userRole: "member", jobTitle: "인사팀장", viewCount: 250, answerCount: 1, createdAt: Date.now() - 1000 * 60 * 60 * 130, category: "현업 고민" },
  { id: "sample-20", title: "급여 올랐을 때 국민연금 보험료 바로 바꿔야 하나요?", text: "연봉 협상 끝나고 급여가 인상됐는데, 국민연금도 그 즉시 변경 신고를 해야 하는 건지... 보통 연말정산이나 정기 결정 때 반영하시나요?", nickname: "연금계산중", userId: "mock-20", userRole: "member", jobTitle: "급여운영", viewCount: 130, answerCount: 1, createdAt: Date.now() - 1000 * 60 * 60 * 140, category: "인사전략/HRM" },
  { id: "sample-21", title: "국민연금, 고지 방식이랑 요율 방식 중 뭐가 맞나요?", text: "실무에서 국민연금 계산할 때 다들 고지된 금액 그대로 떼시는지, 아니면 요율 곱해서 떼시는지 궁금합니다. 차이가 좀 생기더라고요.", nickname: "계산기두드림", userId: "mock-21", userRole: "member", jobTitle: "HR지원", viewCount: 88, answerCount: 1, createdAt: Date.now() - 1000 * 60 * 60 * 150, category: "인사전략/HRM" },
  { id: "sample-22", title: "건강보험 고지 vs 요율, 다들 어떻게 쓰시나요?", text: "사업장마다 다른 것 같은데 저희는 급여 변동이 좀 잦거든요. 어떤 방식이 정산할 때 덜 피곤할까요?", nickname: "건보정산러", userId: "mock-22", userRole: "member", jobTitle: "인사총무", viewCount: 115, answerCount: 1, createdAt: Date.now() - 1000 * 60 * 60 * 160, category: "인사전략/HRM" },
  { id: "sample-23", title: "고용보험은 무조건 요율로 떼는 게 일반적인가요?", text: "고용보험 관리 중인데 요율 방식으로 계산해서 떼고 있거든요. 고지 방식 쓰는 곳도 있는지 궁금해서요.", nickname: "고용보험봇", userId: "mock-23", userRole: "member", jobTitle: "인사담당", viewCount: 74, answerCount: 1, createdAt: Date.now() - 1000 * 60 * 60 * 170, category: "인사전략/HRM" },
  { id: "sample-24", title: "산재보험도 급여 명세서 공제 항목에 넣나요?", text: "신입 직원분이 산재보험은 왜 안 빠졌냐고 물어보시는데... 이거 회사 100% 부담이라 안 넣는 게 맞죠? 갑자기 확신이 안 서네요 ㅎㅎ", nickname: "당황한인사", userId: "mock-24", userRole: "member", jobTitle: "주니어HR", viewCount: 210, answerCount: 1, createdAt: Date.now() - 1000 * 60 * 60 * 180, category: "인사전략/HRM" },
  { id: "sample-25", title: "희망 연봉이랑 800만 원 정도 차이 나면 협의 가능할까요?", text: "정말 뽑고 싶은 후보자가 있는데 예산이랑 차이가 좀 나네요. 이 정도 갭이면 보통 어떻게 협상 테이블을 만드시나요? 노하우 공유 부탁드려요.", nickname: "협상전문가꿈나무", userId: "mock-25", userRole: "member", jobTitle: "리크루터", viewCount: 340, answerCount: 1, createdAt: Date.now() - 1000 * 60 * 60 * 190, category: "채용/헤드헌팅" },
  { id: "sample-26", title: "연봉 낮춰서 이직하는 분들 실제로 보신 적 있나요?", text: "처우 협의 중에 연봉 삭감을 제안해야 하는 상황인데... 이런 경우가 실무에서 흔한지, 이직 사유가 뭐였는지 궁금합니다.", nickname: "현실인사", userId: "mock-26", userRole: "member", jobTitle: "인사팀장", viewCount: 295, answerCount: 1, createdAt: Date.now() - 1000 * 60 * 60 * 200, category: "채용/헤드헌팅" },
  { id: "sample-27", title: "희망 연봉보다 낮게 제시하는 게 무례할까요?", text: "좋은 분인데 회사의 처우 가이드라인이 명확해서 낮게 불러야 할 것 같아요. 후보자가 기분 안 상하게 말하는 법 없을까요?", nickname: "조심스러운HR", userId: "mock-27", userRole: "member", jobTitle: "채용담당", viewCount: 185, answerCount: 1, createdAt: Date.now() - 1000 * 60 * 60 * 210, category: "채용/헤드헌팅" },
  { id: "sample-28", title: "연봉 협의할 때 가장 중요한 기준이 뭐라고 생각하세요?", text: "금액도 중요하지만 결국 '왜 이 금액인가'에 대한 설득이 중요한 것 같아요. 여러분은 어떤 논리를 주로 사용하시나요?", nickname: "논리왕인사", userId: "mock-28", userRole: "member", jobTitle: "보상담당", viewCount: 160, answerCount: 1, createdAt: Date.now() - 1000 * 60 * 60 * 220, category: "채용/헤드헌팅" },
  { id: "sample-29", title: "중기 감면 끝났는데 계속 적용됐네요... 어쩌죠?", text: "소득세 감면 기간 끝난 직원분께 계속 적용이 됐어요. 지금 발견했는데 이거 어떻게 수습해야 할까요? 과태료 세게 나오나요?", nickname: "멘붕담당자", userId: "mock-29", userRole: "member", jobTitle: "인사운영", viewCount: 450, answerCount: 1, createdAt: Date.now() - 1000 * 60 * 60 * 230, category: "현업 고민" },
  { id: "sample-30", title: "소득세 감면 오류, 당사자한테 바로 말해야겠죠?", text: "제 실수로 감면이 더 됐는데, 다음 달 월급에서 추징해야 할 것 같아요. 직원분께 욕먹을까 봐 무서운데 어떻게 좋게 말씀드리면 좋을까요 ㅜㅜ", nickname: "눈물나는HR", userId: "mock-30", userRole: "member", jobTitle: "인사담당", viewCount: 380, answerCount: 1, createdAt: Date.now() - 1000 * 60 * 60 * 240, category: "현업 고민" },
]

const MOCK_ANSWERS: Answer[] = [
  { id: "ans-1", questionId: "sample-1", text: "아닙니다! 휴일근무를 보상휴가로 처리할지, 휴일대체로 할지는 노사 합의 사항이에요. 근로자대표와 사전 서면 합의가 있다면 휴일대체가 가능하고요, 모든 휴일근무를 보상휴가로 해야 할 법적 의무는 없으니 안심하세요. 근로감독 시에는 ‘보상 방식’ 자체보다는 합의서가 있는지랑 근로자에게 불이익이 없는지를 중점적으로 본답니다.", nickname: "노무마스터", userId: "ai-1", userRole: "mentor", jobTitle: "노무사", createdAt: Date.now() - 1000 * 60 * 30 },
  { id: "ans-2", questionId: "sample-2", text: "반드시 개인별로 매번 받을 필요는 없어요. 근로자대표와 포괄적 서면 합의가 있다면 개별 동의 없이 운영하는 경우가 일반적입니다. 다만 나중에 딴소리 안 나오게(?) 분쟁 예방 차원에서 내부 규정이나 공지 형태로 명확히 근거를 남겨두시는 걸 추천드려요!", nickname: "베테랑HR", userId: "ai-2", userRole: "mentor", jobTitle: "인사팀장", createdAt: Date.now() - 1000 * 60 * 120 },
  { id: "ans-3", questionId: "sample-3", text: "법적으로 주휴일만 가능하다고 딱 잘라 제한되어 있지는 않아요. 하지만 실무적으로는 혼선을 줄이기 위해 주휴일 중심으로 운영하는 회사가 많죠. 중요한 건 '사전 합의'가 있었는지랑 그 운영이 근로자에게 불리하지 않았는지입니다!", nickname: "인사박사", userId: "ai-3", userRole: "mentor", jobTitle: "HR컨설턴트", createdAt: Date.now() - 1000 * 60 * 200 },
  { id: "ans-4", questionId: "sample-4", text: "아니오, 선거관리위원회는 법적 필수사항이 아닙니다. 법에서는 근로자위원과 사용자위원 구성만 요구하고 있거든요. 선관위는 보통 내부적으로 좀 더 공정하게 위원을 뽑고 싶을 때 선택적으로 운영하는 편이에요.", nickname: "규정전문가", userId: "ai-4", userRole: "mentor", jobTitle: "노무담당", createdAt: Date.now() - 1000 * 60 * 300 },
  { id: "ans-5", questionId: "sample-5", text: "법적으로 필수는 아닙니다! 하지만 회의를 이끌어갈 의장이나 기록을 남길 간사가 없으면 운영이 엉망이 될 수 있어서, 관행적으로는 거의 모든 회사가 선임해서 운영하고 있어요.", nickname: "운영의달인", userId: "ai-5", userRole: "mentor", jobTitle: "인사팀장", createdAt: Date.now() - 1000 * 60 * 400 },
  { id: "ans-6", questionId: "sample-6", text: "실무적으로 모든 서류를 다 뒤지지는 않아요 ㅎㅎ 주로 협의회가 제대로 설치되어 있는지, 노사 위원 수가 같은지, 회의를 주기적으로 열었는지, 그리고 결정적으로 '회의록'이 존재하는지를 중점적으로 봅니다. 회의록 관리만 잘 되어 있어도 반은 먹고 들어가요!", nickname: "감독관출신", userId: "ai-6", userRole: "mentor", jobTitle: "노무자문", createdAt: Date.now() - 1000 * 60 * 500 },
  { id: "ans-7", questionId: "sample-7", text: "대부분의 경우 선거의 세세한 절차까지는 확인하지 않습니다. 형식적인 절차에 목매기보다는 실제로 운영이 되고 있는지, 위원 구성이 적절한지를 더 중요하게 보시더라고요.", nickname: "실무고수", userId: "ai-7", userRole: "mentor", jobTitle: "HR매니저", createdAt: Date.now() - 1000 * 60 * 600 },
  { id: "ans-8", questionId: "sample-8", text: "아닙니다. 규정을 아예 새로 만들거나 내용을 크게 바꾸는 게 아닌 이상, 단순하게 위원이 바뀌어서 재선임한 건 따로 노동청 신고 대상이 아니니 걱정 마세요!", nickname: "신고도우미", userId: "ai-8", userRole: "mentor", jobTitle: "행정사", createdAt: Date.now() - 1000 * 60 * 700 },
  { id: "ans-9", questionId: "sample-9", text: "네, 고충처리위원은 노사협의회의 필수 구성 요소 중 하나예요. 선임 안 해두셨다가 근로감독 때 지적받을 수 있으니, 지금이라도 내부적으로 선임 절차 밟으시는 게 안전합니다.", nickname: "리스크관리", userId: "ai-9", userRole: "mentor", jobTitle: "인사팀장", createdAt: Date.now() - 1000 * 60 * 800 },
  { id: "ans-10", questionId: "sample-10", text: "법적으로 정해진 건 없고 순수하게 회사 내규 따름입니다. 하지만 요즘 트렌드는 거의 다 '만 나이' 기준이죠. 나중에 뒷말 안 나오게 만 나이로 통일하시는 걸 추천해요.", nickname: "트렌드인사", userId: "ai-10", userRole: "mentor", jobTitle: "HRBP", createdAt: Date.now() - 1000 * 60 * 900 },
  { id: "ans-11", questionId: "sample-11", text: "법적 문제는 아니지만, 나중에 다른 직원분이랑 형평성 문제가 생겨서 분쟁 소지가 될 수 있어요. 이번 기회에 규정에 '만 나이 기준'인지 명확하게 박아두시는 게(?) 정신 건강에 이롭습니다.", nickname: "규정파수꾼", userId: "ai-11", userRole: "mentor", jobTitle: "인사운영", createdAt: Date.now() - 1000 * 60 * 1000 },
  { id: "ans-12", questionId: "sample-12", text: "정해진 정답은 없습니다. 그냥 본교 주소를 적기도 하고, 기타/온라인으로 분류하기도 해요. 중요한 건 회사 내부적으로 모든 직원에 대해 동일한 기준을 적용하는 '일관성'입니다.", nickname: "데이터장인", userId: "ai-12", userRole: "mentor", jobTitle: "인사기획", createdAt: Date.now() - 1000 * 60 * 1100 },
  { id: "ans-13", questionId: "sample-13", text: "실무적으로는 서울 본교 주소로 기재하는 회사가 굉장히 많습니다. 그걸로 문제 삼는 경우는 거의 못 봤으니 편하게 서울로 가셔도 될 것 같아요.", nickname: "인사통", userId: "ai-13", userRole: "mentor", jobTitle: "인사팀장", createdAt: Date.now() - 1000 * 60 * 1200 },
  { id: "ans-14", questionId: "sample-14", text: "보통 본교/분교 구분이나 학력 검증, 내부 통계 낼 때 사용해요. 우리 회사에서 어떤 대학 출신이 잘 적응하는지(?) 같은 거 볼 때요. 그 목적에 맞춰서 기준 세우시면 됩니다!", nickname: "전략인사", userId: "ai-14", userRole: "mentor", jobTitle: "HR전략", createdAt: Date.now() - 1000 * 60 * 1300 },
  { id: "ans-15", questionId: "sample-15", text: "당연히 인정되죠! 급여, 원천세, 4대보험 같은 업무는 인사의 가장 핵심적인 기능이에요. 이거 모르면 나중에 인사 제도 설계도 못 합니다. 자부심 가지셔도 돼요!", nickname: "페이롤장인", userId: "ai-15", userRole: "mentor", jobTitle: "C&B매니저", createdAt: Date.now() - 1000 * 60 * 1400 },
  { id: "ans-16", questionId: "sample-16", text: "단순히 숫자만 넣는 작업만 반복하면 그럴 수도 있지만, 급여 데이터를 분석해서 보상 체계를 고민하거나 제도를 개선하는 쪽으로 확장하면 엄청난 경쟁력이 됩니다. 숫자에 강한 인사는 어디서든 환영받아요.", nickname: "성장멘토", userId: "ai-16", userRole: "mentor", jobTitle: "인사팀장", createdAt: Date.now() - 1000 * 60 * 1500 },
  { id: "ans-17", questionId: "sample-17", text: "초년생 때는 흔히 겪는 과정이에요. 지금 하고 계신 업무 범주 안에서도 법이 어떻게 바뀌는지, 우리 회사 제도가 왜 이렇게 설계됐는지 파고들다 보면 금방 전문가가 되실 겁니다. 불안해하지 마세요!", nickname: "선배HR", userId: "ai-17", userRole: "mentor", jobTitle: "HR기획", createdAt: Date.now() - 1000 * 60 * 1600 },
  { id: "ans-18", questionId: "sample-18", text: "중소/중견기업에서는 충분히 그럴 수 있어요. 인사 제도가 안정화되어 있으면 시즌 외엔 업무 밀도가 낮을 수 있거든요. 이럴 때 자기계발하시거나 다른 팀 지원 업무 해보시는 것도 방법입니다.", nickname: "여유인사", userId: "ai-18", userRole: "mentor", jobTitle: "인사총무", createdAt: Date.now() - 1000 * 60 * 1700 },
  { id: "ans-19", questionId: "sample-19", text: "반드시 조직에 문제가 있다고 볼 순 없어요. 시스템이 효율적이라는 반증일 수도 있죠. 다만 개인 커리어 차원에서는 업무를 스스로 찾아서 확장하지 않으면 나중에 정체될 수 있으니 스스로를 점검해보세요!", nickname: "커리어코치", userId: "ai-19", userRole: "mentor", jobTitle: "HRD전문가", createdAt: Date.now() - 1000 * 60 * 1800 },
  { id: "ans-20", questionId: "sample-20", text: "대부분은 바로 변경하지 않아요. 국민연금은 정해진 시기에 정산하는 구조라 중도에 일일이 바꾸는 건 필수가 아니거든요. 너무 번거롭게 매달 안 하셔도 됩니다.", nickname: "급여고수", userId: "ai-20", userRole: "mentor", jobTitle: "인사운영", createdAt: Date.now() - 1000 * 60 * 1900 },
  { id: "ans-21", questionId: "sample-21", text: "국민연금은 공단에서 보내주는 '고지 방식'이 원칙입니다. 금액 차이가 발생해도 일단 고지된 대로 떼는 게 실무상 가장 깔끔해요.", nickname: "연금박사", userId: "ai-21", userRole: "mentor", jobTitle: "인사팀", createdAt: Date.now() - 1000 * 60 * 2000 },
  { id: "ans-22", questionId: "sample-22", text: "사업장 상황마다 다르긴 한데, 급여 변동이 잦으면 요율로 가고 안정적이면 고지를 쓰는 게 보통이에요. 정산의 편의성을 생각하신다면 현재 시스템에 가장 잘 맞는 걸 선택하세요!", nickname: "건보마스터", userId: "ai-22", userRole: "mentor", jobTitle: "급여운영", createdAt: Date.now() - 1000 * 60 * 2100 },
  { id: "ans-23", questionId: "sample-23", text: "네, 고용보험은 요율 방식으로 관리하는 게 일반적이고 가장 정확합니다. 고지 방식은 잘 안 써요.", nickname: "고용보험맨", userId: "ai-23", userRole: "mentor", jobTitle: "HR지원", createdAt: Date.now() - 1000 * 60 * 2200 },
  { id: "ans-24", questionId: "sample-24", text: "맞아요 ㅎㅎ 산재보험은 100% 사업주 부담이라 근로자 월급에서 뗄 일이 전혀 없습니다. 신입분께 잘 설명해주시면 되겠네요!", nickname: "친절한인사", userId: "ai-24", userRole: "mentor", jobTitle: "인사총무", createdAt: Date.now() - 1000 * 60 * 2300 },
  { id: "ans-25", questionId: "sample-25", text: "충분히 협의 가능합니다! 다만 단순히 '안 된다'가 아니라, 이 분이 왜 우리 조직에 필요한지랑 조직 내 형평성을 고려해서 논리를 만드셔야 해요. 대체 불가능한 인재라면 상부 설득도 병행하셔야겠죠.", nickname: "헤드헌터K", userId: "ai-25", userRole: "mentor", jobTitle: "채용팀장", createdAt: Date.now() - 1000 * 60 * 2400 },
  { id: "ans-26", questionId: "sample-26", text: "의외로 꽤 있습니다. 워라밸을 찾거나 기업 문화가 본인이랑 너무 잘 맞을 때, 혹은 커리어 전환을 위해서라면 연봉을 좀 깎고서라도 오시는 분들이 계세요. 사유를 명확히 파악해보세요.", nickname: "채용의달인", userId: "ai-27", userRole: "mentor", jobTitle: "리크루터", createdAt: Date.now() - 1000 * 60 * 2500 },
  { id: "ans-27", questionId: "sample-27", text: "무례하게 느껴질 수도 있지만, 솔직하게 회사의 처우 기준을 설명하고 후보자에게 선택권을 주는 방식으로 접근하면 오해를 줄일 수 있어요. '당신의 가치를 깎는 게 아니라 회사의 기준이다'라는 점을 명확히 하세요.", nickname: "커뮤니케이션HR", userId: "ai-27", userRole: "mentor", jobTitle: "인사팀장", createdAt: Date.now() - 1000 * 60 * 2600 },
  { id: "ans-28", questionId: "sample-28", text: "금액 자체보다는 '왜 이 금액인지'를 설명할 수 있는 객관적인 데이터와 논리가 가장 중요해요. 시장 평균, 사내 기준 등을 복합적으로 제시하는 게 설득력을 높입니다.", nickname: "보상의정석", userId: "ai-28", userRole: "mentor", jobTitle: "C&B전문가", createdAt: Date.now() - 1000 * 60 * 2700 },
  { id: "ans-29", questionId: "sample-29", text: "수정신고나 연말정산 때 정산하시면 됩니다. 보통 과태료보다는 부족하게 낸 세금을 추징하는 정도로 마무리되니 너무 겁먹지 마시고 빠르게 정산 절차 밟으세요!", nickname: "세무조력자", userId: "ai-29", userRole: "mentor", jobTitle: "회계사", createdAt: Date.now() - 1000 * 60 * 2800 },
  { id: "ans-30", questionId: "sample-30", text: "무조건 미리 말씀드리세요! 나중에 월급에서 갑자기 돈 빠져나가면 진짜 큰 싸움(?) 납니다. 솔직하게 실수 인정하고 사과드린 뒤에 정산 계획 공유하는 게 최선입니다.", nickname: "정면돌파", userId: "ai-30", userRole: "mentor", jobTitle: "인사팀장", createdAt: Date.now() - 1000 * 60 * 2900 },
]

export default function HomePage() {
  const { user } = useUser()
  const db = useFirestore()
  
  const userDocRef = useMemoFirebase(() => (user && db) ? doc(db, "users", user.uid) : null, [user, db])
  const { data: profile } = useDoc<any>(userDocRef)

  const [isAdminMode, setIsAdminMode] = useState(false)
  const [isCMSActive, setIsCMSActive] = useState(false)
  const [showAdminDialog, setShowAdminDialog] = useState(false)
  const [adminPassword, setAdminPassword] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState<"all" | "popular" | "waiting">("all")
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(null)
  const { toast } = useToast()

  const questionsQuery = useMemoFirebase(() => {
    if (!db || typeof db !== 'object') return null
    try {
      return query(collection(db, "questions"), orderBy("createdAt", "desc"))
    } catch (e) {
      return null
    }
  }, [db])
  const { data: questionsData } = useCollection<Question>(questionsQuery)
  
  const questions = useMemo(() => {
    const fetched = questionsData || []
    if (fetched.length === 0 && !searchQuery) return MOCK_QUESTIONS
    return fetched
  }, [questionsData, searchQuery])

  const answersQuery = useMemoFirebase(() => {
    if (!db || typeof db !== 'object' || !selectedQuestionId) return null
    try {
      return query(collection(db, "questions", selectedQuestionId, "answers"), orderBy("createdAt", "desc"))
    } catch (e) {
      return null
    }
  }, [db, selectedQuestionId])
  const { data: answersData } = useCollection<Answer>(answersQuery)
  
  // 샘플 데이터와 DB 데이터를 합쳐서 노출
  const answers = useMemo(() => {
    const fetched = answersData || []
    if (selectedQuestionId?.startsWith("sample-")) {
      const samples = MOCK_ANSWERS.filter(a => a.questionId === selectedQuestionId)
      return [...fetched, ...samples]
    }
    return fetched
  }, [answersData, selectedQuestionId])

  const configDocRef = useMemoFirebase(() => {
    if (!db || typeof db !== 'object') return null
    return doc(db, "admin_configuration", "site_settings")
  }, [db])
  const { data: config } = useDoc<any>(configDocRef)

  const cmsBanners = useMemo(() => {
    if (config?.bannerSettings) {
      try {
        return JSON.parse(config.bannerSettings) as BannerData[]
      } catch (e) {
        return []
      }
    }
    return []
  }, [config])

  const sidebarAd = useMemo(() => {
    if (config?.sidebarAdSettings) {
      try {
        return JSON.parse(config.sidebarAdSettings)
      } catch (e) {
        return null
      }
    }
    return {
      image: "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHhzfHxocm98ZW58MHx8fHwxNzcwMjgxNjE3fDA&ixlib=rb-4.1.0&q=80&w=1080",
      link: "https://whisper.hr",
      title: "HR 전문가를 위한\n프리미엄 채용 솔루션"
    }
  }, [config])

  const isSearching = searchQuery.trim().length > 0

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

  const topQuestions = useMemo(() => {
    return [...questions].sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0)).slice(0, 5)
  }, [questions])

  const handleAddQuestion = (nickname: string, title: string, text: string, imageUrl?: string, videoUrl?: string, category?: string) => {
    if (!db || !user) {
      toast({ title: "로그인 필요", description: "질문을 등록하려면 로그인이 필요합니다.", variant: "destructive" })
      return
    }

    const questionData = {
      title,
      text,
      nickname,
      userId: user.uid,
      userRole: (profile?.role as UserRole) || "member",
      jobTitle: profile?.jobTitle || null,
      userProfilePicture: profile?.profilePictureUrl || null,
      imageUrl: imageUrl || null,
      videoUrl: videoUrl || null,
      category: category || null,
      viewCount: 0,
      answerCount: 0,
      createdAt: Date.now(),
    }

    addDocumentNonBlocking(collection(db, "questions"), questionData).then((docRef) => {
      if (docRef) {
        generateAiReply({ title, text }).then((res) => {
          const aiAnswer = {
            questionId: docRef.id,
            text: res.replyText,
            nickname: "알디",
            userId: "ai-whisper",
            userRole: "admin",
            jobTitle: "AI 길잡이",
            createdAt: Date.now(),
            userProfilePicture: null,
          }
          addDocumentNonBlocking(collection(db, "questions", docRef.id, "answers"), aiAnswer)
          updateDocumentNonBlocking(doc(db, "questions", docRef.id), { answerCount: increment(1) })
        })
      }
    })
  }

  const handleAddAnswer = (nickname: string, title: string, text: string) => {
    if (!db || !selectedQuestionId || !user) return

    const selectedQuestion = questions.find(q => q.id === selectedQuestionId)
    if (!selectedQuestion) return

    const answerData = {
      questionId: selectedQuestionId,
      text,
      nickname,
      userId: user.uid,
      userRole: (profile?.role as UserRole) || "member",
      jobTitle: profile?.jobTitle || null,
      userProfilePicture: profile?.profilePictureUrl || null,
      createdAt: Date.now(),
    }

    addDocumentNonBlocking(collection(db, "questions", selectedQuestionId, "answers"), answerData).then(() => {
      if (selectedQuestion.userId !== user.uid) {
        addDocumentNonBlocking(collection(db, "notifications"), {
          userId: selectedQuestion.userId,
          type: "new_answer",
          questionId: selectedQuestionId,
          questionTitle: selectedQuestion.title,
          senderNickname: nickname,
          createdAt: Date.now(),
          isRead: false
        })
      }
    })
    
    updateDocumentNonBlocking(doc(db, "questions", selectedQuestionId), { answerCount: increment(1) })
  }

  const handleSelectQuestion = (id: string) => {
    if (selectedQuestionId === id) {
      setSelectedQuestionId(null)
    } else {
      setSelectedQuestionId(id)
      if (db && !id.startsWith("sample-")) {
        updateDocumentNonBlocking(doc(db, "questions", id), { viewCount: increment(1) })
      }
    }
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <Header 
        onSearch={setSearchQuery} 
        isAdminMode={isAdminMode} 
        isCMSActive={isCMSActive}
        onToggleCMS={() => setIsCMSActive(!isCMSActive)}
        onExitAdmin={() => { setIsAdminMode(false); setIsCMSActive(false); }}
        onOpenAdminAuth={() => setShowAdminDialog(true)}
      />

      <div className="max-w-7xl mx-auto px-0 md:px-4 py-0 md:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <main className={cn(
            "space-y-0 md:space-y-10 transition-all duration-500",
            isSearching ? "lg:col-span-12 max-w-4xl mx-auto w-full" : "lg:col-span-8"
          )}>
            {isSearching ? (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 px-4 md:px-0 mt-8">
                <div className="flex flex-col gap-6 mb-12">
                  <button 
                    onClick={() => setSearchQuery("")} 
                    className="flex items-center gap-2 text-primary/40 hover:text-accent font-bold text-sm transition-colors w-fit group"
                  >
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    홈으로 돌아가기
                  </button>
                  <div className="space-y-2">
                    <h2 className="text-4xl md:text-5xl font-black text-primary tracking-tight">
                      "<span className="text-accent">{searchQuery}</span>" 검색 결과
                    </h2>
                    <p className="text-lg font-bold text-primary/30">
                      {filteredQuestions.length}개의 HR 집단지성을 찾았습니다.
                    </p>
                  </div>
                </div>

                <QuestionFeed 
                  questions={filteredQuestions} 
                  onSelectQuestion={handleSelectQuestion}
                  selectedId={selectedQuestionId}
                  answers={answers}
                  onAddAnswer={handleAddAnswer}
                  activeTab={activeTab}
                  onTabChange={setActiveTab}
                  isAdminMode={isAdminMode}
                />
              </div>
            ) : (
              <div className="flex flex-col gap-0 md:gap-10">
                <div className="w-full order-1">
                  <MainBanner banners={cmsBanners} />
                </div>
                <div className="px-4 md:px-0 -mt-6 md:mt-0 relative z-20 order-2">
                  <SubmissionForm 
                    type="question"
                    placeholder="채용, 교육, 조직문화 등 HR 현업의 고민을 속삭여보세요."
                    onSubmit={handleAddQuestion}
                  />
                </div>
                <div className="px-4 md:px-0 order-3">
                  <QuestionFeed 
                    questions={filteredQuestions} 
                    onSelectQuestion={handleSelectQuestion}
                    selectedId={selectedQuestionId}
                    answers={answers}
                    onAddAnswer={handleAddAnswer}
                    activeTab={activeTab}
                    onTabChange={setActiveTab}
                    isAdminMode={isAdminMode}
                  />
                </div>
              </div>
            )}
          </main>

          {!isSearching && (
            <aside className="lg:col-span-4 space-y-8 hidden lg:block">
              <AldiChat />
              <RankingList questions={topQuestions} onSelectQuestion={handleSelectQuestion} />
            </aside>
          )}
        </div>
      </div>
    </div>
  )
}
