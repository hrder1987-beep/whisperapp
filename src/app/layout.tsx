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

const FAVICON_SVG = `data:image/svg+xml,%3Csvg viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M12 21C16.9706 21 21 16.9706 21 12C21 7.02944 16.9706 3 12 3C7.02944 3 3 7.02944 3 12C3 13.4876 3.36093 14.891 4 16.1272L3 21L7.8728 20C9.10897 20.6391 10.5124 21 12 21Z' fill='%23163300'/%3E%3Ccircle cx='8' cy='12' r='1.8' fill='%23CDECB1'/%3E%3Ccircle cx='12' cy='12' r='1.8' fill='%23CDECB1'/%3E%3Ccircle cx='16' cy='12' r='1.8' fill='%23CDECB1'/%3E%3C/svg%3E`;

export const metadata: Metadata = {
  title: {
    default: 'Whisper (위스퍼) - HR Intelligence',
    template: '%s | Whisper'
  },
  description: '대한민국 최고 HR 실무자들의 품격 있는 지식 공유 플랫폼. 교육, 조직문화, 인사전략의 깊이 있는 속삭임을 만나보세요.',
  keywords: ['HR', '인사', '인사담당자', 'HR실무자', '조직문화', '인사전략', '교육', 'HRM', 'HRD', '위스퍼', 'whisper'],
  metadataBase: new URL(SITE_URL),
  formatDetection: {
    telephone: false,
    date: false,
    address: false,
    email: false,
  },
  icons: {
    icon: FAVICON_SVG,
    apple: FAVICON_SVG,
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