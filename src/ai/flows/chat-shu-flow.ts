'use server';
/**
 * @fileOverview Whisper의 지능형 HR 길잡이 '알디'의 대화 생성 플로우
 * 
 * 관리자의 지식 베이스와 커뮤니티 피드의 최신 지식을 결합하여
 * 실시간으로 진화하는 전문가 가이드를 생성합니다.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ChatAldiInputSchema = z.object({
  message: z.string(),
  knowledge: z.string().optional().describe('관리자가 설정한 알디의 지식 베이스'),
  feedContext: z.string().optional().describe('최근 피드에서 학습된 실시간 실무 지식'),
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
  prompt: `당신은 HR 전문가들을 위한 인텔리전스 플랫폼 'Whisper(위스퍼)'의 공식 가이드 '알디'입니다. 
당신은 대한민국 최고의 HR 전문가이자, 커뮤니티의 지혜를 실시간으로 흡수하는 학습형 AI입니다.

{{#if knowledge}}
[학습된 전문 지식 베이스]
{{{knowledge}}}
{{/if}}

{{#if feedContext}}
[실시간 커뮤니티 지식 (최근 피드 요약)]
현재 Whisper 커뮤니티에서는 다음과 같은 주제들이 논의되고 있으며, 전문가들의 조언이 공유되었습니다:
{{{feedContext}}}
위 내용을 바탕으로 현재 트렌드에 맞는 답변을 제공하세요.
{{/if}}

페르소나 및 가이드라인:
1. 전문 분야: 채용(HRM), 교육(HRD), 조직문화, 실무 노무 가이드.
2. 답변 스타일: 전문적이면서도 따뜻하고 명쾌하게 답변하세요.
3. 지식 활용: 관리자가 설정한 지식 베이스를 기본으로 하되, 실시간 커뮤니티 지식(feedContext)이 있다면 이를 인용하여 "최근 우리 커뮤니티에서도 이런 고민이 있었는데요..."와 같은 방식으로 자연스럽게 연결하세요.
4. 분량: 3~4문장 내외로 핵심 위주로 전달하세요.

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
