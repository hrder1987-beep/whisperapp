
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
      image: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=1080",
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

  useEffect(() => {
    if (!api || !autoSlideDuration || autoSlideDuration <= 0) return

    const interval = setInterval(() => {
      api.scrollNext()
    }, autoSlideDuration * 1000)

    return () => clearInterval(interval)
  }, [api, autoSlideDuration])

  return (
    <div className="w-full mb-6 relative group/carousel">
      <Carousel setApi={setApi} className="w-full overflow-hidden rounded-[2rem] shadow-2xl border border-black/[0.03]" opts={{ loop: true }}>
        <CarouselContent>
          {banners.map((banner, index) => (
            <CarouselItem key={banner.id}>
              <div className="relative h-[220px] md:h-[320px] w-full overflow-hidden bg-white">
                <div className="absolute inset-0 flex flex-col justify-center px-6 md:px-16 z-20">
                  <Badge className="naver-badge w-fit mb-2 md:mb-4 bg-primary text-accent shadow-lg border-none px-3 py-0.5 text-[8px] md:text-[9px] font-black tracking-widest">
                    {banner.badge}
                  </Badge>
                  
                  <h1 className="text-lg md:text-2xl font-black text-accent mb-2 md:mb-3 leading-[1.2] tracking-tight whitespace-pre-line drop-shadow-sm">
                    {banner.title}
                  </h1>
                  
                  <p className="text-[11px] md:text-[14px] text-accent/80 font-bold max-w-[220px] md:max-w-md whitespace-pre-line leading-relaxed line-clamp-2 mb-1">
                    {banner.description}
                  </p>

                  <button className="mt-3 md:mt-5 flex items-center gap-1.5 text-[10px] md:text-[12px] font-black text-accent hover:text-primary transition-all group/btn w-fit">
                    <span className="border-b-2 border-accent group-hover/btn:border-primary pb-0.5">상세보기</span>
                    <ChevronRight className="w-3 h-3 md:w-3.5 md:h-3.5 group-hover/btn:translate-x-1 transition-transform" />
                  </button>
                </div>
                
                <div className="absolute top-0 right-0 w-full md:w-[60%] h-full">
                  <div className="absolute inset-0 bg-gradient-to-r from-white via-white/95 md:via-white/80 to-transparent z-10"></div>
                  <Image 
                    src={banner.image || "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?q=80&w=1080"} 
                    alt={banner.title} 
                    fill 
                    className="object-cover opacity-40 md:opacity-100 transition-transform duration-1000 group-hover/carousel:scale-105"
                    priority={index === 0}
                    data-ai-hint="business office"
                  />
                </div>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        
        <div className="absolute bottom-4 right-4 md:bottom-8 md:right-10 flex gap-1.5 z-30 opacity-0 group-hover/carousel:opacity-100 transition-opacity duration-500">
          <CarouselPrevious className="relative inset-0 bg-white/90 backdrop-blur-md border border-black/5 text-accent hover:bg-primary h-7 w-7 md:h-10 md:w-10 rounded-full translate-x-0 translate-y-0 shadow-xl" />
          <CarouselNext className="relative inset-0 bg-white/90 backdrop-blur-md border border-black/5 text-accent hover:bg-primary h-7 w-7 md:h-10 md:w-10 rounded-full translate-x-0 translate-y-0 shadow-xl" />
        </div>
      </Carousel>
    </div>
  )
}
