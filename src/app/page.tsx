
import { Suspense } from "react"
import { Header } from "@/components/whisper/Header"
import { HomeContent } from "@/components/whisper/HomeContent"
import { Sparkles } from "lucide-react"

/**
 * @fileOverview 홈페이지 엔트리 포인트 (Server Component)
 * 라우팅 안정성을 위해 서버 컴포넌트로 구성하며, 
 * useSearchParams가 포함된 클라이언트 로직은 HomeContent로 분리하여 Suspense로 감쌉니다.
 */
export default function HomePage() {
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
