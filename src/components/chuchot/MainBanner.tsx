
"use client"

import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel"
import { Badge } from "@/components/ui/badge"
import Image from "next/image"
import { Sparkles, ChevronRight } from "lucide-react"

export interface BannerData {
  id: string | number;
  title: string;
  description: string;
  image: string;
  badge: string;
}

interface MainBannerProps {
  banners?: BannerData[]
}

export function MainBanner({ banners: propBanners }: MainBannerProps) {
  const defaultBanners: BannerData[] = [
    {
      id: 1,
      title: "HR실무자들의\n품격 있는 속삭임",
      description: "교육부터 조직문화 인사전략까지\nHR실무자를 위한 지식 허브 Whisper",
      image: "https://images.unsplash.com/photo-1521737711867-e3b97375f902?q=80&w=1080",
      badge: "집단 지성의 힘"
    },
    {
      id: 2,
      title: "고민을 나누고,\n함께 성장하자",
      description: "우리의 작은 속삭임이 모여\n내일을 바꾸는 큰 울림으로 돌아옵니다.",
      image: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=1080",
      badge: "교학상장의 장"
    }
  ]

  const banners = propBanners && propBanners.length > 0 ? propBanners : defaultBanners

  return (
    <div className="w-full mb-6 md:mb-8 relative">
      <Carousel className="w-full overflow-hidden rounded-lg shadow-sm border border-black/5" opts={{ loop: true }}>
        <CarouselContent>
          {banners.map((banner) => (
            <CarouselItem key={banner.id}>
              <div className="relative h-[200px] md:h-[320px] w-full overflow-hidden bg-white">
                <div className="absolute inset-0 flex flex-col justify-center px-6 md:px-16 z-20">
                  <Badge className="naver-badge w-fit mb-2 md:mb-4 bg-primary text-white shadow-sm border-none">
                    {banner.badge}
                  </Badge>
                  
                  <h1 className="text-lg md:text-3xl font-black text-foreground mb-2 md:mb-3 leading-tight tracking-tight whitespace-pre-line drop-shadow-sm">
                    {banner.title}
                  </h1>
                  
                  <p className="text-[10px] md:text-sm text-black/70 font-bold max-w-[200px] md:max-w-md whitespace-pre-line leading-relaxed line-clamp-2 md:line-clamp-none drop-shadow-sm">
                    {banner.description}
                  </p>

                  <button className="mt-4 md:mt-6 flex items-center gap-1 text-[10px] md:text-[11px] font-black text-primary hover:underline drop-shadow-sm">
                    자세히 보기 <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
                
                <div className="absolute top-0 right-0 w-full md:w-1/2 h-full">
                  <div className="absolute inset-0 bg-gradient-to-r from-white via-white/80 md:via-white/95 to-transparent z-10"></div>
                  <Image 
                    src={banner.image} 
                    alt={banner.title} 
                    fill 
                    className="object-cover opacity-50 md:opacity-100"
                    priority
                    data-ai-hint="hr meeting office"
                  />
                </div>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        
        <div className="absolute bottom-4 right-6 md:bottom-6 md:right-8 flex gap-1 z-30">
          <CarouselPrevious className="relative inset-0 bg-black/5 border-none text-muted-foreground hover:bg-black/10 h-7 w-7 md:h-8 md:w-8 rounded-full translate-x-0 translate-y-0" />
          <CarouselNext className="relative inset-0 bg-black/5 border-none text-muted-foreground hover:bg-black/10 h-7 w-7 md:h-8 md:w-8 rounded-full translate-x-0 translate-y-0" />
        </div>
      </Carousel>
    </div>
  )
}
