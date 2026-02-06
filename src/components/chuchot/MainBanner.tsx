"use client"

import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel"
import { Badge } from "@/components/ui/badge"
import Image from "next/image"
import { Sparkles } from "lucide-react"

export function MainBanner() {
  const banners = [
    {
      id: 1,
      title: "HRD 현직자들의\n성장을 위한 속삭임",
      description: "과정 설계부터 L&D 전략까지.\n대한민국 HRD 담당자들의 익명 지식 공유 플랫폼.",
      image: "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw0fHxocmQlMjB0cmFpbmluZ3xlbnwwfHx8fDE3NzAyODE2MTd8MA&ixlib=rb-4.1.0&q=80&w=1080",
      badge: "L&D 트렌드"
    },
    {
      id: 2,
      title: "더 나은 학습 경험,\n품격 있는 커뮤니티",
      description: "막막했던 교육 효과 측정부터 사내 이벤트 아이디어까지,\n동료 HRD 담당자들에게 직접 물어보세요.",
      image: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw4fHxjb3Jwb3JhdGUlMjBlZHVjYXRpb258ZW58MHx8fHwxNzcwMzU0Mzc3fDA&ixlib=rb-4.1.0&q=80&w=1080",
      badge: "인사이트 공유"
    }
  ]

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
                  data-ai-hint="hrd training office"
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
        
        <div className="absolute bottom-10 right-10 md:right-24 flex gap-3">
          <CarouselPrevious className="relative inset-0 bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-accent hover:text-primary transition-all h-12 w-12 rounded-2xl translate-x-0 translate-y-0" />
          <CarouselNext className="relative inset-0 bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-accent hover:text-primary transition-all h-12 w-12 rounded-2xl translate-x-0 translate-y-0" />
        </div>
      </Carousel>
    </div>
  )
}
