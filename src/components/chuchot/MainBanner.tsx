
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
      description: "채용부터 조직문화, 교육 설계까지.\n대한민국 모든 HR 실무자를 위한 집단지성 플랫폼 Whisper.",
      image: "https://images.unsplash.com/photo-1521737711867-e3b97375f902?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw0fHxocm8lMjBtZWV0aW5nfGVufDB8fHx8MTc3MDI4MTYxN3ww&ixlib=rb-4.1.0&q=80&w=1080",
      badge: "Whisper Intelligence"
    },
    {
      id: 2,
      title: "현직자의 고민,\n전문가의 해답",
      description: "막막한 인사 전략부터 사내 이슈 해결까지,\n검증된 HR 동료들에게 직접 묻고 답을 찾으세요.",
      image: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw4fHxjb3Jwb3JhdGUlMjBtZWV0aW5nfGVufDB8fHx8MTc3MDM1NDM3N3ww&ixlib=rb-4.1.0&q=80&w=1080",
      badge: "HR Collective Intelligence"
    }
  ]

  const banners = propBanners && propBanners.length > 0 ? propBanners : defaultBanners

  return (
    <div className="w-full mb-12 relative group/carousel">
      <Carousel className="w-full overflow-hidden rounded-[2.5rem] shadow-2xl shadow-primary/10" opts={{ loop: true }}>
        <CarouselContent>
          {banners.map((banner) => (
            <CarouselItem key={banner.id}>
              <div className="relative h-[400px] md:h-[480px] w-full overflow-hidden premium-gradient">
                <Image 
                  src={banner.image} 
                  alt={banner.title} 
                  fill 
                  className="object-cover opacity-20 mix-blend-overlay transition-transform duration-1000 group-hover/carousel:scale-105"
                  priority
                  data-ai-hint="hr meeting office"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-primary via-primary/80 to-transparent"></div>
                <div className="absolute inset-0 flex flex-col justify-center px-8 md:px-24 max-w-4xl">
                  <Badge className="w-fit mb-8 bg-accent text-primary font-black tracking-widest px-5 py-2 rounded-full border-none shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-500">
                    <Sparkles className="w-3.5 h-3.5 mr-2" />
                    {banner.badge}
                  </Badge>
                  
                  <h1 className="text-4xl md:text-[64px] font-headline font-black text-white mb-6 leading-[1.15] tracking-tight whitespace-pre-line text-balance drop-shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-700">
                    {banner.title}
                  </h1>
                  
                  <p className="text-base md:text-xl text-accent/90 font-medium max-w-2xl whitespace-pre-line leading-relaxed text-balance animate-in fade-in slide-in-from-bottom-6 duration-1000">
                    {banner.description}
                  </p>
                </div>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        
        <div className="absolute bottom-10 right-10 md:right-24 flex gap-3 z-20">
          <CarouselPrevious className="relative inset-0 bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-accent hover:text-primary transition-all h-12 w-12 rounded-2xl translate-x-0 translate-y-0" />
          <CarouselNext className="relative inset-0 bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-accent hover:text-primary transition-all h-12 w-12 rounded-2xl translate-x-0 translate-y-0" />
        </div>
      </Carousel>
    </div>
  )
}
