
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
    <div className="space-y-5">
      {ads.map((ad) => (
        <Link key={ad.id} href={ad.link} target="_blank" className="block">
          <Card className="group overflow-hidden rounded-[2rem] border-primary/5 shadow-md hover:shadow-xl transition-all duration-500 cursor-pointer bg-white relative">
            <div className="relative aspect-[16/9] w-full overflow-hidden">
              <img 
                src={ad.webImage || "https://images.unsplash.com/photo-1552664730-d307ca884978?q=80&w=400"} 
                alt={ad.title} 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-80"></div>
              
              <div className="absolute top-4 left-4">
                <Badge className="bg-accent text-primary font-black border-none px-3 py-1 rounded-lg text-[9px] shadow-lg">
                  {ad.badge}
                </Badge>
              </div>

              <div className="absolute bottom-5 left-5 right-5">
                <h4 className="text-white font-black text-[15px] leading-tight whitespace-pre-line drop-shadow-md">
                  {ad.title}
                </h4>
              </div>
              
              <div className="absolute bottom-5 right-5 opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0">
                <div className="bg-white/20 backdrop-blur-md p-2 rounded-full border border-white/30">
                  <ExternalLink className="w-3.5 h-3.5 text-white" />
                </div>
              </div>
            </div>
          </Card>
        </Link>
      ))}
    </div>
  )
}
