
import { Suspense } from "react"
import { Header } from "@/components/whisper/Header"
import { HomeContent } from "@/components/whisper/HomeContent"
import { Sparkles } from "lucide-react"

/**
 * @fileOverview 홈페이지 엔트리 포인트 (Server Component)
 * Next.js 15의 비동기 파라미터 규격을 준수하며, 
 * 웹 컨테이너 환경의 안정성을 위해 동적 렌더링을 강제합니다.
 */
export const dynamic = 'force-dynamic';

export default async function HomePage(props: { 
  searchParams: Promise<{ [key: string]: string | string[] | undefined }> 
}) {
  // Next.js 15 필수 사항: 비동기 searchParams를 해제합니다.
  await props.searchParams;

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <Header />
      <div className="max-w-7xl mx-auto px-4 py-6 md:py-10">
        <Suspense 
          fallback={
            <div className="flex justify-center py-40">
              <Sparkles className="w-12 h-12 animate-spin text-accent" />
            </div>
          }
        >
          <HomeContent />
        </Suspense>
      </div>
    </div>
  )
}
