
import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster"
import { FirebaseClientProvider } from "@/firebase/client-provider"
import { BottomNav } from "@/components/whisper/BottomNav"

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
    images: [{ url: '/og-image.jpg', width: 1200, height: 630, alt: 'Whisper' }],
    locale: 'ko_KR',
    type: 'website',
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
      </head>
      <body className="font-body antialiased selection:bg-primary selection:text-primary-foreground bg-[#F8F9FA] touch-pan-y" suppressHydrationWarning>
        <FirebaseClientProvider>
          <div className="relative min-h-screen flex flex-col">
            <main className="relative z-10 flex-1 pb-24 lg:pb-0">{children}</main>
            <BottomNav />
            <Toaster />
          </div>
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
