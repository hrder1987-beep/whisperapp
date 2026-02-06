"use client"

import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import { Sparkles } from "lucide-react"

export function MainBanner() {
  const banners = [
    {
      id: 1,
      title: "슈쇼: 프리미엄 익명 소통",
      description: "당신의 깊은 곳 비밀스러운 이야기를 가장 우아하게 속삭여보세요.",
      image: "https://images.unsplash.com/photo-1477840539360-4a1d23071046?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw0fHxuaWdodCUyMHNreXxlbnwwfHx8fDE3NzAyODE2MTd8MA&ixlib=rb-4.1.0&q=80&w=1080",
      badge: "EXCLUSIVE"
    },
    {
      id: 2,
      title: "가장 따뜻한 위로의 공간",
      description: "골드 옐로우의 따스함처럼, 누군가의 고민에 진심 어린 답글을 남겨주세요.",
      image: "https://images.unsplash.com/photo-1758179761324-63b474fe55a0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw4fHxwZWFjZWZ1bCUyMGZvcmVzdHxlbnwwfHx8fDE3NzAzNTQzNzd8MA&ixlib=rb-4.1.0&q=80&w=1080",
      badge: "FEATURED"
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
                  data-ai-hint="banner image"
                />
                <div className="absolute inset-0 bg-gradient-to-tr from-primary via-primary/80 to-transparent"></div>
                <div className="absolute inset-0 flex flex-col justify-center px-8 md:px-20 max-w-3xl">
                  <Badge className="w-fit mb-6 bg-accent text-primary font-black tracking-widest px-4 py-1.5 rounded-full border-none">
                    <Sparkles className="w-3 h-3 mr-2" />
                    {banner.badge}
                  </Badge>
                  <h1 className="text-4xl md:text-7xl font-headline font-black text-white mb-6 drop-shadow-2xl leading-tight">
                    {banner.title}
                  </h1>
                  <p className="text-lg md:text-2xl text-accent/80 font-medium mb-10 max-w-xl drop-shadow">
                    {banner.description}
                  </p>
                  <Button className="w-fit bg-accent hover:bg-accent/90 text-primary font-black h-14 px-10 rounded-2xl shadow-2xl transition-all transform hover:scale-105">
                    지금 속삭이기
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
