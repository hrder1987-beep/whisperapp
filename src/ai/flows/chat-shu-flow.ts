'use server';
/**
 * @fileOverview Whisper의 지능형 HR 길잡이 '알디'의 대화 생성 플로우
 * 
 * 관리자가 직접 주입한 전문 지식 베이스 및 페르소나 지침을 바탕으로 
 * 동적으로 변화하는 가이드를 제공합니다.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ChatAldiInputSchema = z.object({
  message: z.string(),
  knowledge: z.string().optional().describe('관리자가 설정한 알디의 핵심 전문 지식 베이스'),
  persona: z.string().optional().describe('관리자가 설정한 알디의 대화 스타일 및 페르소나 지침'),
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

{{#if persona}}
[핵심 페르소나 및 행동 지침]
{{{persona}}}
{{else}}
기본 페르소나: 매우 전문적이면서도 동료처럼 따뜻하게, 3~4문장으로 핵심만 짚어주는 스타일입니다.
{{/if}}

당신의 모든 답변은 아래 [전문 지식 베이스]를 최우선 근거로 작성되어야 합니다.

{{#if knowledge}}
[전문 지식 베이스 (관리자 지정)]
{{{knowledge}}}
{{/if}}

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
