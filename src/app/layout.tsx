import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster"

export const metadata: Metadata = {
  title: 'Chuchot (슈쇼) HR - 현직 인사 담당자들의 비밀스러운 속삭임',
  description: '채용, 평가, 조직문화, 교육까지. HR 현직자들을 위한 실시간 익명 소통 플랫폼입니다.',
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
          {/* Subtle background texture */}
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
