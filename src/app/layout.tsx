import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster"
import { FirebaseClientProvider } from "@/firebase/client-provider"

export const metadata: Metadata = {
  title: 'Chuchot (슈쇼) HRD - 대한민국 L&D 실무자들의 성장을 위한 속삭임',
  description: '교육 설계, L&D 전략, 조직문화, 온보딩까지. HRD 현직자들을 위한 실시간 익명 지식 공유 플랫폼입니다.',
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
        <FirebaseClientProvider>
          <div className="relative min-h-screen overflow-x-hidden">
            <div className="fixed inset-0 pointer-events-none opacity-30">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,hsl(var(--primary)/0.05)_0%,transparent_70%)] blur-3xl transform -translate-y-1/2"></div>
            </div>
            <main className="relative z-10">{children}</main>
            <Toaster />
          </div>
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
