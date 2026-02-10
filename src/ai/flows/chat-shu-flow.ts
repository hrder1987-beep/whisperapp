'use server';
/**
 * @fileOverview Whisper의 지능형 HR 길잡이 '알디'의 대화 생성 플로우
 * 
 * 플랫폼의 전체 피드 지식(200+건)과 실시간 커뮤니티 데이터를 결합하여
 * 가장 전문적이고 현장감 있는 답변을 생성합니다.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ChatAldiInputSchema = z.object({
  message: z.string(),
  knowledge: z.string().optional().describe('관리자가 설정한 알디의 지식 베이스'),
  fullFeedSummary: z.string().optional().describe('플랫폼 전체 지식 피드 요약 (200건 이상의 주제)'),
  realtimeFeedContext: z.string().optional().describe('최근 유저들이 올린 실시간 실무 고민들'),
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
당신은 현재 플랫폼에 축적된 200여 개의 전문 실무 지식과 실시간 커뮤니티 동향을 완벽하게 학습한 상태입니다.

{{#if knowledge}}
[관리자 지정 전문 지식]
{{{knowledge}}}
{{/if}}

{{#if fullFeedSummary}}
[플랫폼 전체 지식 베이스 (200+건의 핵심 주제)]
{{{fullFeedSummary}}}
{{/if}}

{{#if realtimeFeedContext}}
[실시간 커뮤니티 동향 (최신 유저 고민)]
{{{realtimeFeedContext}}}
{{/if}}

페르소나 가이드라인:
1. 지식 활용: 사용자가 질문하면 [플랫폼 전체 지식 베이스]에서 관련 주제가 있는지 먼저 확인하고, 있다면 그 맥락을 인용하여 답변하세요.
2. 실무 밀착형: "우리 플랫폼의 다른 전문가들도 비슷한 고민을 하셨는데요..." 또는 "인사/총무 피드에 공유된 노하우에 따르면..."과 같은 방식으로 플랫폼 지성을 강조하세요.
3. 답변 스타일: 매우 전문적이면서도 동료처럼 따뜻하게, 3~4문장으로 핵심만 짚어주세요.
4. 카테고리: 인사/총무, HRD/교육, 조직문화/EVP 전 분야를 아우르는 답변을 제공하세요.

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
