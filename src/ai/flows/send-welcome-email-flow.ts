
'use server';
/**
 * @fileOverview Whisper 가입 환영 자동 메일 발송 플로우
 * 
 * 신규 가입자에게 Whisper의 가치와 주요 기능을 소개하는 
 * 프리미엄 이메일을 발송합니다.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import nodemailer from 'nodemailer';

const SendWelcomeEmailInputSchema = z.object({
  name: z.string(),
  email: z.string().email(),
});
export type SendWelcomeEmailInput = z.infer<typeof SendWelcomeEmailInputSchema>;

const SendWelcomeEmailOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});
export type SendWelcomeEmailOutput = z.infer<typeof SendWelcomeEmailOutputSchema>;

const emailPrompt = ai.definePrompt({
  name: 'welcomeEmailPrompt',
  input: { schema: SendWelcomeEmailInputSchema },
  output: { schema: z.object({ subject: z.string(), htmlContent: z.string() }) },
  prompt: `당신은 HR 인텔리전스 플랫폼 'Whisper'의 커뮤니케이션 매니저입니다.
신규 가입한 {{name}} 전문가님께 보낼 품격 있는 환영 이메일 본문을 작성해주세요.

이메일 포함 내용:
1. 제목: [Whisper] {{name}} 전문가님, 최고의 HR 인텔리전스 허브에 오신 것을 환영합니다!
2. 서두: 가입에 대한 감사와 전문가로서의 여정을 응원하는 따뜻한 인사.
3. 서비스 소개:
   - 지식 속삭임: 현업의 고민을 나누는 집단지성 피드
   - 위스퍼러: 각 분야 최고의 HR 멘토링
   - 프로그램: 현직자가 검증한 교육 솔루션
   - 채용 정보: HR 전문가만을 위한 커리어 기회
   - 알디 챗: AI 기반 스마트 HR 길잡이
4. 마무리: "전문가님의 성장이 Whisper의 목표입니다."라는 메시지.

형식: HTML 태그를 적절히 사용하여 미려하게 작성하세요. (CSS 인라인 스타일 사용 권장)`,
});

const sendWelcomeEmailFlow = ai.defineFlow(
  {
    name: 'sendWelcomeEmailFlow',
    inputSchema: SendWelcomeEmailInputSchema,
    outputSchema: SendWelcomeEmailOutputSchema,
  },
  async (input) => {
    // 1. AI로 메일 본문 생성
    const { output } = await emailPrompt(input);
    if (!output) throw new Error('이메일 생성 실패');

    // 2. 이메일 발송 설정 (프로토타입 환경이므로 로그로 대체)
    console.log(`[Email Simulation] To: ${input.email}, Subject: ${output.subject}`);
    
    return {
      success: true,
      message: '환영 메일 발송 플로우가 성공적으로 완료되었습니다 (시뮬레이션).',
    };
  }
);

/**
 * 회원가입 환영 메일을 발송하는 서버 액션입니다.
 */
export async function sendWelcomeEmail(input: SendWelcomeEmailInput): Promise<SendWelcomeEmailOutput> {
  return sendWelcomeEmailFlow(input);
}
