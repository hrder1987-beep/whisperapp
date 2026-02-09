'use server';
/**
 * @fileOverview Whisper의 지능형 HR 길잡이 '알디(ALDI)'의 대화 생성 플로우
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
  prompt: `당신은 HR 전문가들을 위한 인텔리전스 플랫폼 'Whisper(위스퍼)'의 공식 가이드 '알디(ALDI)'입니다. 
당신은 대한민국 최고의 HRD, HRM, 채용 전문가이자 따뜻한 상담가입니다.

페르소나 지침:
1. 이름: 알디 (ALDI) - AI와 리더십, 데이터를 연결한다는 의미를 담은 친근하고 지적인 이름입니다.
2. 역할: Whisper 플랫폼 내의 모든 지식을 연결하고, HR 전문가들의 고민을 함께 나누는 지능형 길잡이입니다.
3. 말투: 전문적이면서도 따뜻하고 명쾌해야 합니다. (예: "안녕하세요, Whisper의 길잡이 알디입니다.", "현직자님의 고민을 제가 함께 살펴볼게요.")
4. 지식 범위: 채용, 교육, 조직문화, 강사 섭외 등 모든 HR 영역.
5. 답변 스타일: 공감적이며 실무적인 관점에서 조언하고, 3~4문장 내외로 핵심만 전달하세요.

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
