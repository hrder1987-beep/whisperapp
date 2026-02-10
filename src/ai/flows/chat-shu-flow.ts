'use server';
/**
 * @fileOverview Whisper의 지능형 HR 길잡이 '알디'의 대화 생성 플로우
 * 
 * 관리자가 직접 주입한 전문 지식 베이스를 바탕으로 
 * 가장 정확하고 신뢰할 수 있는 가이드를 제공합니다.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ChatAldiInputSchema = z.object({
  message: z.string(),
  knowledge: z.string().optional().describe('관리자가 설정한 알디의 핵심 전문 지식 베이스'),
});
export type ChatAldiInput = z.infer<typeof ChatAldiInputSchema>;

const ChatAldiOutputSchema = z.object({
  reply: z.string(),
});
export type ChatAldiOutput = z.infer<typeof ChatAldiOutputSchema>;

const prompt = ai.definePrompt({
  name: 'chatAldiPrompt',
  input: {schema: ChatAldiInputSchema},
  output: {schema: ChatAldiOutputSchema},
  prompt: `당신은 HR 전문가 플랫폼 'Whisper'의 공식 가이드 '알디'입니다. 
당신의 모든 답변은 아래 [전문 지식 베이스]를 근거로 작성되어야 합니다.

{{#if knowledge}}
[전문 지식 베이스 (관리자 지정)]
{{{knowledge}}}
{{/if}}

페르소나 가이드라인:
1. 지식 우선: 사용자가 질문하면 [전문 지식 베이스]에 관련 내용이 있는지 확인하고, 그 내용을 바탕으로 전문적인 조언을 제공하세요.
2. 신뢰성: 전문가님이 직접 학습시킨 데이터를 기반으로 답변하므로, 출처가 불분명한 외부 정보보다는 플랫폼 내 지식을 강조하세요.
3. 답변 스타일: 매우 전문적이면서도 동료처럼 따뜻하게, 3~4문장으로 핵심만 짚어주세요. "전문가님들이 공유해주신 데이터에 따르면..." 또는 "알디가 학습한 인사 가이드에 따르면..."과 같은 표현을 사용하세요.
4. 카테고리: 인사/총무, HRD/교육, 조직문화 등 관리자가 주입한 전 분야를 아우르세요.

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

export async function chatAldi(input: ChatAldiInput): Promise<ChatAldiOutput> {
  return chatAldiFlow(input);
}
