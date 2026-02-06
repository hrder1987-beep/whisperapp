"use client"

import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import { Sparkles, Users } from "lucide-react"

export function MainBanner() {
  const banners = [
    {
      id: 1,
      title: "HR 전문가들의 품격 있는 속삭임",
      description: "채용, 교육, 조직문화까지. 현직 담당자들과 익명으로 인사이트를 공유하세요.",
      image: "https://images.unsplash.com/photo-1454165833767-1316b0215b3f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw0fHxocmFkbWluJTIwb2ZmaWNlfGVufDB8fHx8MTc3MDI4MTYxN3ww&ixlib=rb-4.1.0&q=80&w=1080",
      badge: "EXPERT ONLY"
    },
    {
      id: 2,
      title: "가장 실질적인 인사 솔루션",
      description: "막막했던 평가 제도부터 사내 이벤트 아이디어까지, 동료 HRer들에게 물어보세요.",
      image: "https://images.unsplash.com/photo-1552664730-d307ca884978?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw4fHxtZWV0aW5nfGVufDB8fHx8MTc3MDM1NDM3N3ww&ixlib=rb-4.1.0&q=80&w=1080",
      badge: "NETWORKING"
    }
  ]

  return (
    <div className="w-full mb-12 relative">
      <Carousel className="w-full overflow-hidden rounded-[2.5rem] shadow-2xl shadow-primary/20" opts={{ loop: true }}>
        <CarouselContent>
          {banners.map((banner) => (
            <CarouselItem key={banner.id}>
              <div className="relative h-[350px] md:h-[500px] w-full overflow-hidden premium-gradient">
                <Image 
                  src={banner.image} 
                  alt={banner.title} 
                  fill 
                  className="object-cover opacity-30 mix-blend-overlay"
                  data-ai-hint="hr professional office"
                />
                <div className="absolute inset-0 bg-gradient-to-tr from-primary via-primary/80 to-transparent"></div>
                <div className="absolute inset-0 flex flex-col justify-center px-8 md:px-20 max-w-3xl">
                  <Badge className="w-fit mb-6 bg-accent text-primary font-black tracking-widest px-4 py-1.5 rounded-full border-none">
                    <Sparkles className="w-3 h-3 mr-2" />
                    {banner.badge}
                  </Badge>
                  <h1 className="text-4xl md:text-6xl font-headline font-black text-white mb-6 drop-shadow-2xl leading-tight">
                    {banner.title}
                  </h1>
                  <p className="text-lg md:text-xl text-accent/80 font-medium mb-10 max-w-xl drop-shadow">
                    {banner.description}
                  </p>
                  <Button className="w-fit bg-accent hover:bg-accent/90 text-primary font-black h-14 px-10 rounded-2xl shadow-2xl transition-all transform hover:scale-105">
                    <Users className="w-5 h-5 mr-2" />
                    지금 참여하기
                  </Button>
                </div>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <div className="hidden md:block">
          <CarouselPrevious className="left-8 bg-white/10 backdrop-blur-md border-none text-white hover:bg-accent hover:text-primary transition-all h-12 w-12" />
          <CarouselNext className="right-8 bg-white/10 backdrop-blur-md border-none text-white hover:bg-accent hover:text-primary transition-all h-12 w-12" />
        </div>
      </Carousel>
    </div>
  )
}
