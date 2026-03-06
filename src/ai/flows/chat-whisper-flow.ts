'use server';
/**
 * @fileOverview Whisper의 지능형 멀티 챗봇 엔진 (위스퍼라, 알디, 동산)
 * 
 * 방대한 데이터(Big Context)를 소화하기 위해 최적화된 프롬프트 구조를 채택했습니다.
 * 1. 데이터 소스(Knowledge) 정밀 스캔
 * 2. 부재 시 전문 추론(Broad Expert Reasoning) 적용
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ChatWhisperInputSchema = z.object({
  message: z.string(),
  botType: z.enum(['whisperra', 'aldi', 'dongsan']),
  knowledge: z.string().optional().describe('주입된 방대한 지식 베이스 데이터'),
  persona: z.string().optional().describe('관리자가 설정한 봇의 성격과 지침'),
});
export type ChatWhisperInput = z.infer<typeof ChatWhisperInputSchema>;

const ChatWhisperOutputSchema = z.object({
  reply: z.string(),
});
export type ChatWhisperOutput = z.infer<typeof ChatWhisperOutputSchema>;

const prompt = ai.definePrompt({
  name: 'chatWhisperPrompt',
  input: {schema: ChatWhisperInputSchema},
  output: {schema: ChatWhisperOutputSchema},
  prompt: `당신은 HR 전문가 플랫폼 'Whisper'의 전용 AI 인텔리전스 엔진입니다. 
현재 모드: [{{{botType}}}]

[핵심 행동 지침]
{{#if persona}}
{{{persona}}}
{{else}}
- 매우 전문적이고 품격 있는 말투를 사용하십시오.
- 사용자의 질문에 핵심적인 인사이트를 즉각적으로 제공하십시오.
{{/if}}

[지식 검색 엔진 가이드라인 - 최우선 순위]
아래 제공된 [데이터 소스]는 전문가님이 직접 주입한 실시간 정보입니다. 
1. 사용자의 질문과 관련된 키워드가 [데이터 소스]에 있는지 가장 먼저 확인하십시오.
2. 정확한 정보(연락처, 프로그램명, 장소 등)가 있다면 토씨 하나 틀리지 않고 정확히 인용하십시오.
3. 만약 [데이터 소스]에 정보가 없다면, 당신의 방대한 전문가적 식견(온라인 서칭 기반의 추론)을 활용하여 가장 신뢰할 수 있는 답변을 생성하십시오.

[데이터 소스 (전문가 주입 지식)]
{{#if knowledge}}
{{{knowledge}}}
{{else}}
(주입된 특정 데이터가 없습니다. 일반적인 HR 전문가 지식을 기반으로 답변하십시오.)
{{/if}}

-----------------------------------------
사용자 질문: {{{message}}}
답변:`,
});

const chatWhisperFlow = ai.defineFlow(
  {
    name: 'chatWhisperFlow',
    inputSchema: ChatWhisperInputSchema,
    outputSchema: ChatWhisperOutputSchema,
  },
  async input => {
    // Flash 모델은 수만 라인의 컨텍스트도 수초 내에 처리 가능합니다.
    const {output} = await prompt(input);
    return output!;
  }
);

export async function chatWhisper(input: ChatWhisperInput): Promise<ChatWhisperOutput> {
  return chatWhisperFlow(input);
}
