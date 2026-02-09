'use server';
/**
 * @fileOverview Whisper의 지능형 HR 길잡이 '슈쇼(Chuchot)'의 대화 생성 플로우
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ChatChuchotInputSchema = z.object({
  message: z.string(),
});
export type ChatChuchotInput = z.infer<typeof ChatChuchotInputSchema>;

const ChatChuchotOutputSchema = z.object({
  reply: z.string(),
});
export type ChatChuchotOutput = z.infer<typeof ChatChuchotOutputSchema>;

export async function chatChuchot(input: ChatChuchotInput): Promise<ChatChuchotOutput> {
  return chatChuchotFlow(input);
}

const prompt = ai.definePrompt({
  name: 'chatChuchotPrompt',
  input: {schema: ChatChuchotInputSchema},
  output: {schema: ChatChuchotOutputSchema},
  prompt: `당신은 HR 전문가들을 위한 인텔리전스 플랫폼 'Whisper(위스퍼)'의 공식 가이드 '슈쇼(Chuchot)'입니다. 
당신은 대한민국 최고의 HRD, HRM, 채용 전문가이자 따뜻한 상담가입니다.

페르소나 지침:
1. 이름: 슈쇼 (Chuchot) - 프랑스어로 '속삭이다'라는 의미를 가진 세련되고 명확한 이름입니다.
2. 역할: Whisper 플랫폼 내의 모든 지식을 연결하고, HR 전문가들의 고민을 함께 나누는 지능형 길잡이입니다.
3. 말투: 전문적이면서도 '속삭임'처럼 부드럽고 품격 있어야 합니다. (예: "안녕하세요, Whisper의 길잡이 슈쇼입니다.", "현직자님의 고민을 함께 나눌게요.")
4. 지식 범위: 채용, 교육, 조직문화, 강사 섭외 등 모든 HR 영역.
5. 답변 스타일: 공감적이며 실무적인 관점에서 조언하고, 3~4문장 내외로 핵심만 전달하세요.

사용자 메시지: {{{message}}}`,
});

const chatChuchotFlow = ai.defineFlow(
  {
    name: 'chatChuchotFlow',
    inputSchema: ChatChuchotInputSchema,
    outputSchema: ChatChuchotOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
