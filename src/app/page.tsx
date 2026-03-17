import { Suspense } from "react"
import { Header } from "@/components/whisper/Header"
import { HomeContent } from "@/components/whisper/HomeContent"
import { Sparkles } from "lucide-react"

/**
 * @fileOverview 홈페이지 엔트리 포인트 (Server Component)
 * Next.js 15의 비동기 파라미터 규격을 준수합니다.
 */
export const dynamic = 'force-dynamic';

export default async function HomePage(props: { 
  searchParams: Promise<{ [key: string]: string | string[] | undefined }> 
}) {
  // Next.js 15 규격: 비동기 searchParams를 해제합니다.
  const resolvedSearchParams = await props.searchParams;

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <Header />
      <div className="max-w-7xl mx-auto px-4 py-6 md:py-10">
        <Suspense 
          fallback={
            <div className="flex flex-col items-center justify-center py-40 gap-4">
              <Sparkles className="w-12 h-12 animate-spin text-primary" />
              <p className="text-[11px] font-black text-accent/20 uppercase tracking-[0.3em]">Intelligence Loading</p>
            </div>
          }
        >
          <HomeContent searchParams={resolvedSearchParams} />
        </Suspense>
      </div>
    </div>
  )
}