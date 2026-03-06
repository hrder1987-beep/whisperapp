
"use client"

import { PremiumAd } from "@/lib/types"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ExternalLink } from "lucide-react"
import Link from "next/link"

interface PremiumAdsProps {
  ads: PremiumAd[]
}

export function PremiumAds({ ads }: PremiumAdsProps) {
  if (!ads || ads.length === 0) return null

  return (
    <div className="space-y-3">
      {ads.map((ad) => (
        <Link key={ad.id} href={ad.link} target="_blank" className="block">
          <Card className="naver-card group cursor-pointer">
            <div className="relative aspect-[16/9] w-full overflow-hidden">
              <img 
                src={ad.webImage} 
                alt={ad.title} 
                className="w-full h-full object-cover grayscale-[0.2] group-hover:grayscale-0 transition-all duration-500" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-60"></div>
              
              <div className="absolute top-3 left-3">
                <Badge className="bg-primary text-white border-none px-2 py-0.5 rounded-sm text-[9px] font-bold">
                  {ad.badge}
                </Badge>
              </div>

              <div className="absolute bottom-3 left-3 right-3">
                <h4 className="text-white font-black text-[13px] leading-tight line-clamp-2">
                  {ad.title}
                </h4>
              </div>
            </div>
          </Card>
        </Link>
      ))}
    </div>
  )
}
