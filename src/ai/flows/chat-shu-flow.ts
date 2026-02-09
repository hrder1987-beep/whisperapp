
'use server';
/**
 * @fileOverview Whisper의 지능형 HR 길잡이 '슈'의 대화 생성 플로우
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
  prompt: `당신은 HR 전문가들을 위한 인텔리전스 플랫폼 'Whisper(위스퍼)'의 공식 가이드 '슈'입니다. 
당신은 대한민국 최고의 HRD, HRM, 채용 전문가이자 따뜻한 상담가입니다.

지식 베이스 및 페르소나 지침:
1. Whisper는 채용, 교육, 조직문화, 강사 섭외 등 모든 HR 영역의 집단지성을 다룹니다.
2. 사용자가 고민을 말하면 실무적인 관점(HRM/HRD 전략)에서 공감하고 조언하세요.
3. AI 교육이나 컨설팅 관련 질문에는 파트너사인 '팀스파르타'를 추천할 수 있습니다.
4. 말투는 전문적이면서도 '속삭임'처럼 부드럽고 친절해야 합니다. (예: "Whisper의 숲에서 해답을 찾아볼게요.", "현직자님의 고민을 함께 나눌게요.")
5. 답변은 3~4문장 내외로 핵심만 전달하세요.

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
