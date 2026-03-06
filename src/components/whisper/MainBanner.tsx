
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
      title: "대한민국 HR 전문가를 위한\n품격 있는 지식 허브, 위스퍼",
      description: "실무 사례부터 최신 트렌드 리포트까지\n검증된 인사이트를 한곳에서 확인하세요.",
      image: "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?q=80&w=1080",
      badge: "WHISPER IDENTITY"
    },
    {
      id: 2,
      title: "동료 전문가들과 함께하는\n실시간 고민 상담 커뮤니티",
      description: "안전한 속삭임 공간에서 현업의 어려움을 나누고\n함께 해결책을 찾아가는 집단지성의 힘.",
      image: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=1080",
      badge: "COMMUNITY"
    },
    {
      id: 3,
      title: "나의 커리어 성장을 위한\n최적의 솔루션과 강사 정보",
      description: "위스퍼가 엄선한 프리미엄 교육 과정과\n검증된 전문 강사 라인업을 만나보세요.",
      image: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=1080",
      badge: "CAREER GROWTH"
    }
  ]

  const banners = propBanners && propBanners.length > 0 ? propBanners : defaultBanners

  useEffect(() => {
    if (!api || !autoSlideDuration || autoSlideDuration <= 0) return

    const interval = setInterval(() => {
      api.scrollNext()
    }, autoSlideDuration * 1000)

    return () => clearInterval(interval)
  }, [api, autoSlideDuration])

  return (
    <div className="w-full mb-6 relative group/carousel">
      <Carousel setApi={setApi} className="w-full overflow-hidden rounded-[2.5rem] shadow-2xl border border-black/[0.03]" opts={{ loop: true }}>
        <CarouselContent>
          {banners.map((banner, index) => (
            <CarouselItem key={banner.id}>
              <div className="relative h-[220px] md:h-[340px] w-full overflow-hidden bg-white">
                <div className="absolute inset-0 flex flex-col justify-center px-8 md:px-16 z-20">
                  <Badge className="naver-badge w-fit mb-3 md:mb-5 bg-primary text-accent shadow-lg border-none px-4 py-1 text-[9px] md:text-[10px] font-black tracking-widest">
                    {banner.badge}
                  </Badge>
                  
                  <h1 className="text-xl md:text-3xl font-black text-accent mb-3 md:mb-4 leading-[1.2] tracking-tight whitespace-pre-line drop-shadow-sm">
                    {banner.title}
                  </h1>
                  
                  <p className="text-[12px] md:text-[15px] text-accent/70 font-bold max-w-[240px] md:max-w-md whitespace-pre-line leading-relaxed line-clamp-2 mb-1">
                    {banner.description}
                  </p>

                  <button className="mt-4 md:mt-6 flex items-center gap-1.5 text-[11px] md:text-[13px] font-black text-accent hover:text-primary transition-all group/btn w-fit">
                    <span className="border-b-2 border-accent group-hover/btn:border-primary pb-0.5">상세보기</span>
                    <ChevronRight className="w-3.5 h-3.5 md:w-4 md:h-4 group-hover/btn:translate-x-1 transition-transform" />
                  </button>
                </div>
                
                <div className="absolute top-0 right-0 w-full md:w-[60%] h-full">
                  <div className="absolute inset-0 bg-gradient-to-r from-white via-white/95 md:via-white/80 to-transparent z-10"></div>
                  <Image 
                    src={banner.image || "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?q=80&w=1080"} 
                    alt={banner.title} 
                    fill 
                    className="object-cover opacity-40 md:opacity-100 transition-none"
                    priority={index === 0}
                    data-ai-hint="hr platform"
                  />
                </div>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        
        <div className="absolute bottom-6 right-6 md:bottom-10 md:right-12 flex gap-2 z-30 opacity-0 group-hover/carousel:opacity-100 transition-opacity duration-500">
          <CarouselPrevious className="relative inset-0 bg-white/90 backdrop-blur-md border border-black/5 text-accent hover:bg-primary h-8 w-8 md:h-11 md:w-11 rounded-full translate-x-0 translate-y-0 shadow-xl" />
          <CarouselNext className="relative inset-0 bg-white/90 backdrop-blur-md border border-black/5 text-accent hover:bg-primary h-8 w-8 md:h-11 md:w-11 rounded-full translate-x-0 translate-y-0 shadow-xl" />
        </div>
      </Carousel>
    </div>
  )
}
