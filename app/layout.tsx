import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  // 1. 브라우저 탭 제목 변경: "Whisper (위스퍼)"로 단순화
  title: "Whisper (위스퍼)",
  description: "HR 전문가들의 집단지성 플랫폼. 조직문화, 기업교육, 인사전략 등의 전문성을 높여보세요.",

  // 2. 소셜 공유(카카오톡 등) 썸네일 및 정보 설정
  openGraph: {
    title: "Whisper (위스퍼)",
    description: "대한민국 HR 전문가들의 집단지성 플랫폼",
    images: "https://whisperapp.kr/logo.svg", // 로고 파일을 썸네일로 지정 (절대경로 사용)
  },

  // 3. 브라우저 탭 아이콘(파비콘) 설정
  icons: {
    icon: "/logo.svg", // 로고 파일을 파비콘으로 지정
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
