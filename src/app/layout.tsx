
import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster"
import { FirebaseClientProvider } from "@/firebase/client-provider"
import { BottomNav } from "@/components/chuchot/BottomNav"

export const metadata: Metadata = {
  title: 'Whisper (위스퍼) - HR Intelligence Hub',
  description: 'HR실무자들의 품격 있는 속삭임. 교육부터 조직문화, 인사전략까지 HR 전문가를 위한 지식 허브 Whisper',
  openGraph: {
    title: 'Whisper (위스퍼) - HR Intelligence Hub',
    description: 'HR실무자들의 품격 있는 속삭임. 교육부터 조직문화, 인사전략까지 HR 실무자를 위한 지식 허브입니다.',
    url: 'https://whisper-hr.vercel.app',
    siteName: 'Whisper',
    images: [
      {
        url: 'https://images.unsplash.com/photo-1521737711867-e3b97375f902?q=80&w=1200&h=630&auto=format&fit=crop',
        width: 1200,
        height: 630,
        alt: 'Whisper - HR실무자들의 품격 있는 속삭임',
      },
    ],
    locale: 'ko_KR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Whisper (위스퍼) - HR Intelligence Hub',
    description: 'HR실무자들의 품격 있는 속삭임. 교육부터 조직문화, 인사전략까지 HR 전문가를 위한 지식 허브 Whisper',
    images: ['https://images.unsplash.com/photo-1521737711867-e3b97375f902?q=80&w=1200&h=630&auto=format&fit=crop'],
  },
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
          <div className="relative min-h-screen overflow-x-hidden flex flex-col">
            <div className="fixed inset-0 pointer-events-none opacity-30">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,hsl(var(--primary)/0.05)_0%,transparent_70%)] blur-3xl transform -translate-y-1/2"></div>
            </div>
            <main className="relative z-10 flex-1 pb-24 lg:pb-0">{children}</main>
            <BottomNav />
            <Toaster />
          </div>
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
