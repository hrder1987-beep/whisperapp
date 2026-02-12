'use server';
/**
 * @fileOverview Whisper의 지능형 챗봇(위스퍼라, 알디, 동산) 대화 생성 플로우
 * 
 * 선택된 봇 타입에 따라 관리자가 설정한 페르소나 및 지식 베이스를 적용합니다.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ChatShuInputSchema = z.object({
  message: z.string(),
  botType: z.enum(['whisperra', 'aldi', 'dongsan']),
  knowledge: z.string().optional(),
  persona: z.string().optional(),
});
export type ChatShuInput = z.infer<typeof ChatShuInputSchema>;

const ChatShuOutputSchema = z.object({
  reply: z.string(),
});
export type ChatShuOutput = z.infer<typeof ChatShuOutputSchema>;

const prompt = ai.definePrompt({
  name: 'chatShuPrompt',
  input: {schema: ChatShuInputSchema},
  output: {schema: ChatShuOutputSchema},
  prompt: `당신은 HR 전문가 플랫폼 'Whisper'의 전담 AI 어시스턴트입니다.
현재 당신은 '{{{botType}}}' 모드로 작동 중입니다.

{{#if persona}}
[핵심 페르소나 및 행동 지침]
{{{persona}}}
{{else}}
기본 지침: 매우 전문적이고 친절하게 답하며, 사용자의 질문에 핵심적인 인사이트를 제공하세요.
{{/if}}

{{#if knowledge}}
[전문 지식 베이스 (최우선 참조)]
{{{knowledge}}}
{{/if}}

{{#if (eq botType "whisperra")}}
특별 지시: 실제 기업의 성공/실패 사례를 중심으로 답변하세요. 학습된 데이터에 없는 내용은 최신 트렌드를 반영하여 추론하되, 신뢰성 있는 톤을 유지하세요.
{{/if}}

{{#if (eq botType "aldi")}}
특별 지시: 프로그램명, 교육기관, 그리고 담당자의 연락처(연결 정보)를 공유하는 데 집중하세요.
{{/if}}

{{#if (eq botType "dongsan")}}
특별 지시: 강의장, 연회장, 미팅룸 등 공간 정보에 특화되어 답변하세요. 장소의 특징과 예약 시 고려사항을 상세히 안내하세요.
{{/if}}

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

export async function chatShu(input: ChatShuInput): Promise<ChatShuOutput> {
  return chatShuFlow(input);
}
