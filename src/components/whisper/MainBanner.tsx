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
      title: "HR 전문가들의 품격 있는 지식 허브\n위스퍼(Whisper)에 오신 것을 환영합니다",
      description: "실무 사례부터 최신 트렌드 리포트까지\n검증된 전문가들의 지능형 인사이트를 만나보세요.",
      image: "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?q=80&w=1080",
      badge: "WHISPER PLATFORM"
    },
    {
      id: 2,
      title: "동료 전문가들과 나누는\n가장 안전하고 전문적인 속삭임",
      description: "현업의 고민을 익명으로 나누고 함께 해결책을 찾는\n대한민국 최고 HR 담당자들의 집단지성 커뮤니티.",
      image: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=1080",
      badge: "COMMUNITY"
    },
    {
      id: 3,
      title: "나의 성장을 위한 최적의 파트너\n위스퍼러와 1:1로 연결되세요",
      description: "검증된 시니어 전문가 '위스퍼러'가 제안하는\n최적의 교육 솔루션과 리더십 인사이트를 경험하세요.",
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
      <Carousel setApi={setApi} className="w-full overflow-hidden rounded-[2.5rem] shadow-xl border border-black/[0.03]" opts={{ loop: true }}>
        <CarouselContent>
          {banners.map((banner, index) => (
            <CarouselItem key={banner.id}>
              <div className="relative h-[200px] md:h-[320px] w-full overflow-hidden bg-white">
                <div className="absolute inset-0 flex flex-col justify-center px-8 md:px-16 z-20">
                  <Badge className="w-fit mb-3 md:mb-4 bg-primary text-accent shadow-sm border-none px-3 py-0.5 text-[9px] font-black tracking-widest">
                    {banner.badge}
                  </Badge>
                  
                  <h1 className="text-xl md:text-3xl font-black text-accent mb-2 md:mb-4 leading-[1.2] tracking-tight whitespace-pre-line drop-shadow-sm">
                    {banner.title}
                  </h1>
                  
                  <p className="text-[11px] md:text-[14px] text-accent/60 font-bold max-w-[220px] md:max-w-md whitespace-pre-line leading-relaxed line-clamp-2">
                    {banner.description}
                  </p>

                  <button className="mt-4 md:mt-6 flex items-center gap-1 text-[11px] font-black text-accent hover:text-primary transition-all group/btn w-fit">
                    <span className="border-b-2 border-accent/20 group-hover/btn:border-primary pb-0.5">자세히 보기</span>
                    <ChevronRight className="w-3.5 h-3.5 group-hover/btn:translate-x-1 transition-transform" />
                  </button>
                </div>
                
                <div className="absolute top-0 right-0 w-full md:w-[60%] h-full">
                  <div className="absolute inset-0 bg-gradient-to-r from-white via-white/90 md:via-white/70 to-transparent z-10"></div>
                  <Image 
                    src={banner.image || "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?q=80&w=1080"} 
                    alt={banner.title} 
                    fill 
                    className="object-cover opacity-30 md:opacity-100 transition-none"
                    priority={index === 0}
                  />
                </div>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        
        <div className="absolute bottom-6 right-6 md:bottom-10 md:right-12 flex gap-2 z-30 opacity-0 group-hover/carousel:opacity-100 transition-opacity duration-500">
          <CarouselPrevious className="relative inset-0 bg-white/80 backdrop-blur-md border border-black/5 text-accent hover:bg-primary h-8 w-8 md:h-10 md:w-10 rounded-full translate-x-0 translate-y-0 shadow-lg" />
          <CarouselNext className="relative inset-0 bg-white/80 backdrop-blur-md border border-black/5 text-accent hover:bg-primary h-8 w-8 md:h-10 md:w-10 rounded-full translate-x-0 translate-y-0 shadow-lg" />
        </div>
      </Carousel>
    </div>
  )
}
