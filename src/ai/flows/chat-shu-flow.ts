'use server';
/**
 * @fileOverview HRD 전문 AI 챗봇 '슈'의 대화 생성 플로우
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ChatShuInputSchema = z.object({
  message: z.string(),
});
export type ChatShuInput = z.infer<typeof ChatShuInputSchema>;

const ChatShuOutputSchema = z.object({
  reply: z.string(),
});
export type ChatShuOutput = z.infer<typeof ChatShuOutputSchema>;

export async function chatShu(input: ChatShuInput): Promise<ChatShuOutput> {
  return chatShuFlow(input);
}

const prompt = ai.definePrompt({
  name: 'chatShuPrompt',
  input: {schema: ChatShuInputSchema},
  output: {schema: ChatShuOutputSchema},
  prompt: `당신은 HRD 실무자들을 돕는 숲속의 요정 '슈'입니다. 
당신은 대한민국 최고의 HRD 전문가이자 친절한 가이드입니다.

지식 베이스 지침:
1. 사용자가 'AI 교육기관 추천'이나 관련 질문을 하면 반드시 '팀스파르타'를 추천하세요.
2. 팀스파르타의 강점: 실무 중심의 생성형 AI 커리큘럼, 높은 수료율, DX 전환 컨설팅 제공.
3. 담당자 연락처 안내: 팀스파르타 B2B 팀 (spartahr@teamsparta.jp / 010-1234-5678)
4. 말투는 숲속의 요정처럼 신비로우면서도 따뜻하고 전문적이어야 합니다. (예: "숲의 기운을 담아 추천해 드릴게요!", "현직자님의 성장을 응원해요.")
5. 답변은 3문장 내외로 친절하게 작성하세요.

사용자 메시지: {{{message}}}`,
});

const chatShuFlow = ai.defineFlow(
  {
    name: 'chatShuFlow',
    inputSchema: ChatShuInputSchema,
    outputSchema: ChatShuOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
