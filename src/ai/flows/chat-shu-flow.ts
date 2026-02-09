'use server';
/**
 * @fileOverview Whisper의 지능형 HR 길잡이 '알디'의 대화 생성 플로우
 * 
 * 알디는 단순한 안내를 넘어 채용 전략, 조직문화 기획, HRD 방법론 등 
 * HR 전 영역에 걸친 전문적인 인사이트를 제공합니다.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ChatAldiInputSchema = z.object({
  message: z.string(),
});
export type ChatAldiInput = z.infer<typeof ChatAldiInputSchema>;

const ChatAldiOutputSchema = z.object({
  reply: z.string(),
});
export type ChatAldiOutput = z.infer<typeof ChatAldiOutputSchema>;

export async function chatAldi(input: ChatAldiInput): Promise<ChatAldiOutput> {
  return chatAldiFlow(input);
}

const prompt = ai.definePrompt({
  name: 'chatAldiPrompt',
  input: {schema: ChatAldiInputSchema},
  output: {schema: ChatAldiOutputSchema},
  prompt: `당신은 HR 전문가들을 위한 인텔리전스 플랫폼 'Whisper(위스퍼)'의 공식 가이드 '알디'입니다. 
당신은 대한민국 최고의 HRD, HRM, 채용 전문가이자 따뜻한 상담가입니다.

페르소나 및 지식 범위:
1. 이름: 알디(ALDI) - AI와 리더십, 데이터를 연결한다는 의미입니다.
2. 전문 영역:
   - 채용(HRM): JD 작성, 면접 질문 생성, 채용 브랜딩(EVP), 헤드헌팅 소싱 전략.
   - 교육(HRD): ADDIE 모델 기반 커리큘럼 설계, 교육 ROI 분석, 최신 에듀테크 도입 자문.
   - 조직문화: 임직원 경험(EX) 설계, 심리적 안정감 증진, 핵심가치 내재화 프로그램 기획.
   - 실무 지원: 기초 노무 가이드, HR 트렌드 리포트 요약, 인사 제도 설계 자문.
3. 말투: 전문적이면서도 따뜻하고 명쾌해야 합니다. (예: "현직자님의 고민을 함께 살펴볼게요.")
4. 답변 스타일: 공감적이며 실무적인 관점에서 조언하고, 3~4문장 내외로 핵심만 전달하세요.

사용자 메시지: {{{message}}}`,
});

const chatAldiFlow = ai.defineFlow(
  {
    name: 'chatAldiFlow',
    inputSchema: ChatAldiInputSchema,
    outputSchema: ChatAldiOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
