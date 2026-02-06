
"use client"

import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Image from "next/image"

export function MainBanner() {
  const banners = [
    {
      id: 1,
      title: "슈쇼에 오신 것을 환영합니다",
      description: "당신의 깊은 곳 비밀스러운 이야기를 속삭여보세요.",
      image: "https://images.unsplash.com/photo-1477840539360-4a1d23071046?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw0fHxuaWdodCUyMHNreXxlbnwwfHx8fDE3NzAyODE2MTd8MA&ixlib=rb-4.1.0&q=80&w=1080",
      badge: "신규"
    },
    {
      id: 2,
      title: "실시간 익명 소통의 공간",
      description: "누군가의 고민에 따뜻한 위로의 답글을 남겨주세요.",
      image: "https://images.unsplash.com/photo-1758179761324-63b474fe55a0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw4fHxwZWFjZWZ1bCUyMGZvcmVzdHxlbnwwfHx8fDE3NzAzNTQzNzd8MA&ixlib=rb-4.1.0&q=80&w=1080",
      badge: "추천"
    }
  ]

  return (
    <div className="w-full mb-16 relative">
      <Carousel className="w-full overflow-hidden rounded-3xl" opts={{ loop: true }}>
        <CarouselContent>
          {banners.map((banner) => (
            <CarouselItem key={banner.id}>
              <div className="relative h-[300px] md:h-[450px] w-full overflow-hidden">
                <Image 
                  src={banner.image} 
                  alt={banner.title} 
                  fill 
                  className="object-cover opacity-60"
                  data-ai-hint="banner image"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent"></div>
                <div className="absolute inset-0 flex flex-col justify-center px-8 md:px-16 max-w-2xl">
                  <Badge className="w-fit mb-4 bg-primary text-primary-foreground font-bold">
                    {banner.badge}
                  </Badge>
                  <h1 className="text-4xl md:text-6xl font-headline font-bold text-white mb-4 drop-shadow-lg">
                    {banner.title}
                  </h1>
                  <p className="text-lg md:text-xl text-foreground/80 mb-8 max-w-lg drop-shadow">
                    {banner.description}
                  </p>
                  <Button className="w-fit bg-primary text-primary-foreground font-bold h-12 px-8 rounded-full shadow-lg hover:shadow-primary/20 transition-all">
                    지금 시작하기
                  </Button>
                </div>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <div className="hidden md:block">
          <CarouselPrevious className="left-4 bg-background/20 border-none text-white hover:bg-background/40" />
          <CarouselNext className="right-4 bg-background/20 border-none text-white hover:bg-background/40" />
        </div>
      </Carousel>
    </div>
  )
}
