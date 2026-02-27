
"use client"

import { useState, useEffect } from "react"
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious, type CarouselApi } from "@/components/ui/carousel"
import { Badge } from "@/components/ui/badge"
import Image from "next/image"
import { ChevronRight } from "lucide-react"

export interface BannerData {
  id: string | number;
  title: string;
  description: string;
  image: string;
  badge: string;
}

interface MainBannerProps {
  banners?: BannerData[]
  autoSlideDuration?: number
}

export function MainBanner({ banners: propBanners, autoSlideDuration = 3 }: MainBannerProps) {
  const [api, setApi] = useState<CarouselApi>()

  const defaultBanners: BannerData[] = [
    {
      id: 1,
      title: "HR 실무자의 밤:\n인사이트 네트워킹",
      description: "대한민국 HR 리더들이 한자리에 모여\n현업의 고민과 해결책을 나눕니다.",
      image: "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?q=80&w=1080",
      badge: "OFFLINE EVENT"
    },
    {
      id: 2,
      title: "2025 채용 시장\n핵심 트렌드 리포트 발간",
      description: "데이터로 분석한 새로운 채용 패러다임.\n지금 위스퍼에서 독점 공개합니다.",
      image: "https://images.unsplash.com/photo-1454165833762-01049369290d?q=80&w=1080",
      badge: "KNOWLEDGE"
    },
    {
      id: 3,
      title: "전문가와 함께하는\n1:1 실무 커리어 코칭",
      description: "인사 전문가로서의 다음 단계,\n검증된 위스퍼러가 직접 가이드해 드립니다.",
      image: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=1080",
      badge: "WHISPERER CARE"
    }
  ]

  const banners = propBanners && propBanners.length > 0 ? propBanners : defaultBanners

  // 자동 슬라이드 로직
  useEffect(() => {
    if (!api || !autoSlideDuration || autoSlideDuration <= 0) return

    const interval = setInterval(() => {
      api.scrollNext()
    }, autoSlideDuration * 1000)

    return () => clearInterval(interval)
  }, [api, autoSlideDuration])

  return (
    <div className="w-full mb-6 md:mb-8 relative">
      <Carousel setApi={setApi} className="w-full overflow-hidden rounded-[2rem] shadow-lg border border-black/5" opts={{ loop: true }}>
        <CarouselContent>
          {banners.map((banner, index) => (
            <CarouselItem key={banner.id}>
              <div className="relative h-[220px] md:h-[360px] w-full overflow-hidden bg-white">
                <div className="absolute inset-0 flex flex-col justify-center px-8 md:px-20 z-20">
                  <Badge className="naver-badge w-fit mb-3 md:mb-5 bg-primary text-accent shadow-sm border-none px-4 py-1">
                    {banner.badge}
                  </Badge>
                  
                  <h1 className="text-xl md:text-4xl font-black text-accent mb-3 md:mb-4 leading-tight tracking-tight whitespace-pre-line drop-shadow-sm">
                    {banner.title}
                  </h1>
                  
                  <p className="text-[11px] md:text-base text-accent/60 font-bold max-w-[220px] md:max-w-md whitespace-pre-line leading-relaxed line-clamp-2 md:line-clamp-none drop-shadow-sm">
                    {banner.description}
                  </p>

                  <button className="mt-5 md:mt-8 flex items-center gap-1.5 text-[11px] md:text-[13px] font-black text-accent hover:text-primary transition-colors drop-shadow-sm">
                    상세보기 <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="absolute top-0 right-0 w-full md:w-1/2 h-full">
                  <div className="absolute inset-0 bg-gradient-to-r from-white via-white/90 md:via-white/95 to-transparent z-10"></div>
                  <Image 
                    src={banner.image || "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?q=80&w=1080"} 
                    alt={banner.title} 
                    fill 
                    className="object-cover opacity-40 md:opacity-100"
                    priority={index === 0} // 첫 번째 이미지는 LCP 최적화를 위해 우선순위 부여
                    data-ai-hint="business event office"
                  />
                </div>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        
        <div className="absolute bottom-6 right-8 md:bottom-8 md:right-12 flex gap-2 z-30">
          <CarouselPrevious className="relative inset-0 bg-white/80 backdrop-blur-sm border border-black/5 text-accent hover:bg-primary h-8 w-8 md:h-10 md:w-10 rounded-full translate-x-0 translate-y-0 shadow-md" />
          <CarouselNext className="relative inset-0 bg-white/80 backdrop-blur-sm border border-black/5 text-accent hover:bg-primary h-8 w-8 md:h-10 md:w-10 rounded-full translate-x-0 translate-y-0 shadow-md" />
        </div>
      </Carousel>
    </div>
  )
}
