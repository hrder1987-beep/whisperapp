import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster"

export const metadata: Metadata = {
  title: 'Chuchot (슈쇼) - 익명으로 속삭이세요',
  description: '실시간으로 소통하는 익명 질문 및 답변 플랫폼입니다.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased selection:bg-primary selection:text-primary-foreground bg-[#F8F9FA]">
        <div className="relative min-h-screen overflow-x-hidden">
          {/* Subtle background texture for light mode */}
          <div className="fixed inset-0 pointer-events-none opacity-30">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,hsl(var(--primary)/0.05)_0%,transparent_70%)] blur-3xl transform -translate-y-1/2"></div>
          </div>
          <main className="relative z-10">{children}</main>
          <Toaster />
        </div>
      </body>
    </html>
  );
}