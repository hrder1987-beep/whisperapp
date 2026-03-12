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
  title: {
    default: 'Whisper (위스퍼) - HR Intelligence',
    template: '%s | Whisper'
  },
  description: '대한민국 최고 HR 실무자들의 품격 있는 지식 공유 플랫폼. 교육, 조직문화, 인사전략의 깊이 있는 속삭임을 만나보세요.',
  keywords: ['HR', '인사', '인사담당자', 'HR실무자', '조직문화', '인사전략', '교육', 'HRM', 'HRD', '위스퍼', 'whisper'],
  verification: {
    google: 'vseC0Ud11g8jPYx',
    other: {
      'naver-site-verification': 'f78eb21d47cdde19ccba5dc39fec6a1de13a3414',
    },
  },
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
    description: '대한민국 최고 HR 전문가들의 지식 허브. 현업의 고민부터 전문 솔루션까지 한곳에서.',
    url: SITE_URL,
    siteName: 'Whisper',
    images: [{ 
      url: 'https://picsum.photos/seed/whisper-og/1200/630', // 여기에 실제 썸네일 이미지 URL을 넣으시면 됩니다.
      width: 1200, 
      height: 630, 
      alt: 'Whisper - HR Intelligence' 
    }],
    locale: 'ko_KR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Whisper (위스퍼) - HR Intelligence',
    description: '대한민국 최고 HR 전문가들의 품격 있는 지식 속삭임.',
    images: ['https://picsum.photos/seed/whisper-og/1200/630'],
  },
  icons: {
    icon: [
      { url: 'https://picsum.photos/seed/whisper-logo/32/32', sizes: '32x32', type: 'image/png' },
      { url: 'https://picsum.photos/seed/whisper-logo/16/16', sizes: '16x16', type: 'image/png' }
    ],
    apple: [
      { url: 'https://picsum.photos/seed/whisper-logo/180/180', sizes: '180x180', type: 'image/png' }
    ],
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
            <main className="relative z-10 flex-1 pb-24 lg:pb-0">
              {children}
            </main>
            <BottomNav />
            <Toaster />
          </div>
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
