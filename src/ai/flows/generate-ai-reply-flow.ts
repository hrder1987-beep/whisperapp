
'use server';
/**
 * @fileOverview Whisper의 AI 어시스턴트 '알디(ALDI)'의 자동 답변 생성 플로우
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateAiReplyInputSchema = z.object({
  title: z.string(),
  text: z.string(),
});
export type GenerateAiReplyInput = z.infer<typeof GenerateAiReplyInputSchema>;

const GenerateAiReplyOutputSchema = z.object({
  replyText: z.string(),
});
export type GenerateAiReplyOutput = z.infer<typeof GenerateAiReplyOutputSchema>;

const prompt = ai.definePrompt({
  name: 'generateAiReplyPrompt',
  input: {schema: GenerateAiReplyInputSchema},
  output: {schema: GenerateAiReplyOutputSchema},
  prompt: `당신은 HR 전문가 전용 커뮤니티 'Whisper'의 공식 AI 어시스턴트 '알디(ALDI)'입니다.
새로운 질문이 등록되면, 질문자의 고민에 깊이 공감하고 전문적인 HR 인사이트를 담아 첫 번째 답글을 남겨주세요.

답변 가이드라인:
- 채용, 교육, 조직문화, HRM 등 질문의 성격에 맞는 구체적인 방법론이나 팁을 1~2개 포함하세요.
- 단순히 정보를 주는 것을 넘어 현업 담당자의 고충을 이해하는 따뜻한 말투(해요체)를 사용합니다.
- 답변은 3~5문장 내외로 간결하게 작성하세요.
- 마지막 문장에는 항상 전문가의 성장을 응원하는 메시지를 포함하세요.

질문 제목: {{{title}}}
질문 내용: {{{text}}}`,
});

const generateAiReplyFlow = ai.defineFlow(
  {
    name: 'generateAiReplyFlow',
    inputSchema: GenerateAiReplyInputSchema,
    outputSchema: GenerateAiReplyOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

export async function generateAiReply(input: GenerateAiReplyInput): Promise<GenerateAiReplyOutput> {
  return generateAiReplyFlow(input);
}
