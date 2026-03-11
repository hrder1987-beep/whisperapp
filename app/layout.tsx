import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Whisper: 조직문화, 기업교육, 인사전략 HR 플랫폼",
  description: "조직문화, 기업교육, 인사전략, 인사총무 등 HR 전문가들의 지식과 경험을 나누는 플랫폼, 위스퍼에서 당신의 경쟁력을 높여보세요.",
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
