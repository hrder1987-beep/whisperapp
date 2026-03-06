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
    <div className="w-full mb-8 md:mb-12 relative group/carousel">
      <Carousel setApi={setApi} className="w-full overflow-hidden rounded-[2.5rem] md:rounded-[3.5rem] shadow-[0_20px_50px_-12px_rgba(0,0,0,0.15)] border border-black/[0.03]" opts={{ loop: true }}>
        <CarouselContent>
          {banners.map((banner, index) => (
            <CarouselItem key={banner.id}>
              <div className="relative h-[300px] md:h-[480px] w-full overflow-hidden bg-white">
                <div className="absolute inset-0 flex flex-col justify-center px-8 md:px-24 z-20">
                  <Badge className="naver-badge w-fit mb-4 md:mb-7 bg-primary text-accent shadow-xl border-none px-5 py-1.5 text-[10px] md:text-[11px] font-black tracking-widest">
                    {banner.badge}
                  </Badge>
                  
                  <h1 className="text-2xl md:text-5xl font-black text-accent mb-4 md:mb-6 leading-[1.2] tracking-tight whitespace-pre-line drop-shadow-[0_2px_2px_rgba(255,255,255,0.8)]">
                    {banner.title}
                  </h1>
                  
                  <p className="text-[14px] md:text-[19px] text-accent/80 font-bold max-w-[280px] md:max-w-xl whitespace-pre-line leading-relaxed line-clamp-2 md:line-clamp-none mb-2">
                    {banner.description}
                  </p>

                  <button className="mt-6 md:mt-10 flex items-center gap-2 text-[12px] md:text-[16px] font-black text-accent hover:text-primary transition-all group/btn w-fit">
                    <span className="border-b-2 border-accent group-hover/btn:border-primary pb-0.5">상세보기</span>
                    <ChevronRight className="w-4 h-4 md:w-5 md:h-5 group-hover/btn:translate-x-1 transition-transform" />
                  </button>
                </div>
                
                <div className="absolute top-0 right-0 w-full md:w-[65%] h-full">
                  <div className="absolute inset-0 bg-gradient-to-r from-white via-white/95 md:via-white/80 to-transparent z-10"></div>
                  <Image 
                    src={banner.image || "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?q=80&w=1080"} 
                    alt={banner.title} 
                    fill 
                    className="object-cover opacity-50 md:opacity-100 transition-transform duration-[10000ms] group-hover/carousel:scale-110"
                    priority={index === 0}
                    data-ai-hint="business office"
                  />
                </div>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        
        <div className="absolute bottom-8 right-8 md:bottom-12 md:right-16 flex gap-3 z-30 opacity-0 group-hover/carousel:opacity-100 transition-opacity duration-500">
          <CarouselPrevious className="relative inset-0 bg-white/90 backdrop-blur-md border border-black/5 text-accent hover:bg-primary h-10 w-10 md:h-14 md:w-14 rounded-full translate-x-0 translate-y-0 shadow-2xl transition-all" />
          <CarouselNext className="relative inset-0 bg-white/90 backdrop-blur-md border border-black/5 text-accent hover:bg-primary h-10 w-10 md:h-14 md:w-14 rounded-full translate-x-0 translate-y-0 shadow-2xl transition-all" />
        </div>
      </Carousel>
    </div>
  )
}
