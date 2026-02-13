'use server';
/**
 * @fileOverview Whisper 가입 환영 자동 메일 발송 플로우
 * 
 * 신규 가입한 전문가에게 Whisper의 가치와 주요 기능을 소개하는 
 * 고품격 AI 생성 이메일을 발송(시뮬레이션)합니다.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const SendWelcomeEmailInputSchema = z.object({
  name: z.string().describe('가입한 전문가의 성함'),
  email: z.string().email().describe('가입한 전문가의 이메일 주소'),
});
export type SendWelcomeEmailInput = z.infer<typeof SendWelcomeEmailInputSchema>;

const SendWelcomeEmailOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});
export type SendWelcomeEmailOutput = z.infer<typeof SendWelcomeEmailOutputSchema>;

/**
 * 가입 환영 메일의 내용을 생성하는 AI 프롬프트 정의
 */
const welcomeEmailPrompt = ai.definePrompt({
  name: 'welcomeEmailPrompt',
  input: { schema: SendWelcomeEmailInputSchema },
  output: { schema: z.object({ subject: z.string(), htmlContent: z.string() }) },
  prompt: `당신은 HR 인텔리전스 플랫폼 'Whisper'의 커뮤니케이션 디렉터입니다.
신규 가입한 {{name}} 전문가님께 보낼 최고급 가입 환영 이메일 본문을 HTML로 작성해주세요.

플랫폼 'Whisper'는 대한민국 최고의 HR 전문가들이 모여 지식을 나누는 집단지성 허브입니다.

[이메일 필수 포함 내용]
1. 제목: [Whisper] {{name}} 전문가님, 프리미엄 HR 인텔리전스 커뮤니티에 오신 것을 환영합니다.
2. 서두: 전문가로서의 새로운 시작을 축하하고 Whisper의 가족이 된 것에 대한 진심 어린 환영 인사.
3. 주요 기능 소개 (세련된 아이콘이나 불렛 포인트 느낌으로):
   - 지식 속삭임: 현업의 생생한 고민과 답변이 오가는 피드
   - 위스퍼러: 검증된 시니어 전문가들의 1:1 인사이트 문의
   - 솔루션 & 프로그램: 현직자가 엄선한 교육 커리큘럼 및 파트너사 정보
   - 채용 정보: HR 전문가만을 위한 특별한 커리어 기회
   - AI 알디 챗: 24시간 대기 중인 스마트 HR 가이드
4. 마무리 메시지: "전문가님의 성장이 곧 Whisper의 울림입니다."
5. 하단: Whisper 운영팀 드림

[형식 가이드]
- 인라인 CSS를 사용한 미려한 HTML 구조 (배경색 #F8F9FA, 포인트 컬러 #002B26 사용).
- 모바일 가독성을 고려한 반응형 디자인 레이아웃.
- 전문가(Professional)를 대우하는 정중하고 품격 있는 어조(하십시오체와 해요체 혼용 가능).`,
});

/**
 * 회원가입 환영 메일을 발송하는 Genkit Flow
 */
const sendWelcomeEmailFlow = ai.defineFlow(
  {
    name: 'sendWelcomeEmailFlow',
    inputSchema: SendWelcomeEmailInputSchema,
    outputSchema: SendWelcomeEmailOutputSchema,
  },
  async (input) => {
    try {
      // 1. AI로 메일 콘텐츠 생성
      const { output } = await welcomeEmailPrompt(input);
      if (!output) throw new Error('환영 이메일 콘텐츠 생성에 실패했습니다.');

      // 2. 이메일 발송 시뮬레이션 (프로토타입 환경)
      // 실제 서비스 시에는 nodemailer 등을 사용하여 output.htmlContent를 input.email로 전송합니다.
      console.log("=========================================");
      console.log(`[WELCOME EMAIL SIMULATION]`);
      console.log(`TO: ${input.email} (${input.name} 전문가님)`);
      console.log(`SUBJECT: ${output.subject}`);
      console.log(`HTML CONTENT GENERATED (Length: ${output.htmlContent.length})`);
      console.log("=========================================");
      
      return {
        success: true,
        message: `${input.name} 전문가님께 환영 메일이 성공적으로 발송(로그 기록)되었습니다.`,
      };
    } catch (error: any) {
      console.error("Welcome email flow error:", error);
      return {
        success: false,
        message: '메일 발송 중 오류가 발생했습니다.',
      };
    }
  }
);

/**
 * 서버 액션으로 노출되는 래퍼 함수
 */
export async function sendWelcomeEmail(input: SendWelcomeEmailInput): Promise<SendWelcomeEmailOutput> {
  return sendWelcomeEmailFlow(input);
}
