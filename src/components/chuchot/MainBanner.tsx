
"use client"

import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel"
import { Badge } from "@/components/ui/badge"
import Image from "next/image"
import { Sparkles } from "lucide-react"

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
      title: "HR 전문가들의\n품격 있는 속삭임",
      description: "채용부터 조직문화, 교육 설계까지.\n모든 HR 실무자를 위한 지식 허브 Whisper.",
      image: "https://images.unsplash.com/photo-1521737711867-e3b97375f902?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw0fHxocm8lMjBtZWV0aW5nfGVufDB8fHx8MTc3MDI4MTYxN3ww&ixlib=rb-4.1.0&q=80&w=1080",
      badge: "Whisper Intelligence"
    },
    {
      id: 2,
      title: "현직자의 고민,\n전문가의 해답",
      description: "인사 전략부터 사내 이슈 해결까지,\n검증된 동료들에게 직접 묻고 답을 찾으세요.",
      image: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw4fHxjb3Jwb3JhdGUlMjBtZWV0aW5nfGVufDB8fHx8MTc3MDM1NDM3N3ww&ixlib=rb-4.1.0&q=80&w=1080",
      badge: "HR Collective Intelligence"
    }
  ]

  const banners = propBanners && propBanners.length > 0 ? propBanners : defaultBanners

  return (
    <div className="w-full mb-8 md:mb-12 relative group/carousel">
      <Carousel className="w-full overflow-hidden rounded-[2rem] md:rounded-[2.5rem] shadow-xl md:shadow-2xl shadow-primary/10" opts={{ loop: true }}>
        <CarouselContent>
          {banners.map((banner) => (
            <CarouselItem key={banner.id}>
              <div className="relative h-[280px] md:h-[480px] w-full overflow-hidden premium-gradient">
                <Image 
                  src={banner.image} 
                  alt={banner.title} 
                  fill 
                  className="object-cover opacity-20 mix-blend-overlay"
                  priority
                  data-ai-hint="hr meeting office"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-primary via-primary/80 to-transparent"></div>
                <div className="absolute inset-0 flex flex-col justify-center px-6 md:px-24 max-w-4xl">
                  <Badge className="w-fit mb-4 md:mb-8 bg-accent text-primary font-black tracking-widest px-3 md:px-5 py-1 md:py-2 rounded-full border-none shadow-lg text-[10px] md:text-xs">
                    <Sparkles className="w-3 md:w-3.5 h-3 md:h-3.5 mr-1.5 md:mr-2" />
                    {banner.badge}
                  </Badge>
                  
                  <h1 className="text-2xl md:text-[64px] font-headline font-black text-white mb-3 md:mb-6 leading-tight tracking-tight whitespace-pre-line text-balance drop-shadow-sm">
                    {banner.title}
                  </h1>
                  
                  <p className="text-xs md:text-xl text-accent/90 font-medium max-w-2xl whitespace-pre-line leading-relaxed text-balance">
                    {banner.description}
                  </p>
                </div>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        
        <div className="absolute bottom-6 md:bottom-10 right-6 md:right-24 flex gap-2 md:gap-3 z-20">
          <CarouselPrevious className="relative inset-0 bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-accent hover:text-primary transition-all h-8 md:h-12 w-8 md:w-12 rounded-xl translate-x-0 translate-y-0" />
          <CarouselNext className="relative inset-0 bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-accent hover:text-primary transition-all h-8 md:h-12 w-8 md:w-12 rounded-xl translate-x-0 translate-y-0" />
        </div>
      </Carousel>
    </div>
  )
}
