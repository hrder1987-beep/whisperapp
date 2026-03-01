import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster"
import { FirebaseClientProvider } from "@/firebase/client-provider"
import { BottomNav } from "@/components/chuchot/BottomNav"

/**
 * 전문가님의 실제 도메인 whisperapp.kr로 최종 설정되었습니다.
 */
const SITE_URL = "https://whisperapp.kr"; 

export const viewport: Viewport = {
  themeColor: '#163300',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
}

export const metadata: Metadata = {
  title: 'Whisper (위스퍼) - HR Intelligence Hub',
  description: 'HR실무자들의 품격 있는 속삭임. 교육부터 조직문화, 인사전략까지 HR 전문가를 위한 지식 허브 Whisper',
  metadataBase: new URL(SITE_URL),
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Whisper',
  },
  formatDetection: {
    telephone: false,
  },
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Whisper (위스퍼) - HR Intelligence Hub',
    description: 'HR실무자들의 품격 있는 속삭임. 교육부터 조직문화, 인사전략까지 HR 실무자를 위한 지식 허브입니다.',
    url: SITE_URL,
    siteName: 'Whisper',
    images: [
      {
        url: '/og-image.jpg',
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
    images: ['/og-image.jpg'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />
        <link rel="apple-touch-icon" href="https://picsum.photos/seed/whisper-icon/180/180" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-title" content="Whisper" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body 
        className="font-body antialiased selection:bg-primary selection:text-primary-foreground bg-[#F8F9FA] touch-pan-y"
        suppressHydrationWarning
      >
        <FirebaseClientProvider>
          <div className="relative min-h-screen flex flex-col">
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
