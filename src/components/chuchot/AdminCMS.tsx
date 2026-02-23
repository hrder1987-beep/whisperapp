
"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { BannerData } from "./MainBanner"
import { PremiumAd } from "@/lib/types"
import { useFirestore, setDocumentNonBlocking } from "@/firebase"
import { doc } from "firebase/firestore"
import { Trash2, Plus, Save, RefreshCcw, ExternalLink, ImageIcon, Camera, Info, Monitor, Smartphone } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface AdminCMSProps {
  initialBanners: BannerData[]
  initialPremiumAds?: PremiumAd[]
  onUpdate: () => void
}

export function AdminCMS({ initialBanners, initialPremiumAds, onUpdate }: AdminCMSProps) {
  const [banners, setBanners] = useState<BannerData[]>(initialBanners)
  const [premiumAds, setPremiumAds] = useState<PremiumAd[]>(initialPremiumAds || [
    { id: "ad1", title: "HR 전문가를 위한\n커리어 엑셀러레이팅", badge: "SPECIAL EVENT", webImage: "https://picsum.photos/seed/ad1/400/220", mobileImage: "https://picsum.photos/seed/ad1m/400/220", link: "#" },
    { id: "ad2", title: "조직문화 진단 툴킷\n무료 체험 신청하기", badge: "PARTNER", webImage: "https://picsum.photos/seed/ad2/400/220", mobileImage: "https://picsum.photos/seed/ad2m/400/220", link: "#" },
    { id: "ad3", title: "AI 기반 자동 채용\n어시스턴트 도입 가이드", badge: "NEW SOLUTION", webImage: "https://picsum.photos/seed/ad3/400/220", mobileImage: "https://picsum.photos/seed/ad3m/400/220", link: "#" }
  ])
  const [isSaving, setIsSaving] = useState(false)
  const db = useFirestore()
  const { toast } = useToast()

  const handleBannerChange = (index: number, field: keyof BannerData, value: string) => {
    const newBanners = [...banners]
    newBanners[index] = { ...newBanners[index], [field]: value }
    setBanners(newBanners)
  }

  const handleAdChange = (index: number, field: keyof PremiumAd, value: string) => {
    const newAds = [...premiumAds]
    newAds[index] = { ...newAds[index], [field]: value }
    setPremiumAds(newAds)
  }

  const handleImageUpload = (type: 'banner' | 'ad-web' | 'ad-mobile', index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        if (type === 'banner') handleBannerChange(index, "image", reader.result as string)
        else if (type === 'ad-web') handleAdChange(index, "webImage", reader.result as string)
        else if (type === 'ad-mobile') handleAdChange(index, "mobileImage", reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSave = () => {
    if (!db) return
    setIsSaving(true)
    const configRef = doc(db, "admin_configuration", "site_settings")
    
    setDocumentNonBlocking(configRef, {
      id: "site_settings",
      bannerSettings: JSON.stringify(banners),
      premiumAdsSettings: JSON.stringify(premiumAds),
      lastUpdated: new Date().toISOString()
    }, { merge: true })

    setTimeout(() => {
      setIsSaving(false)
      toast({ title: "설정 저장 완료", description: "사이트 구성이 성공적으로 업데이트되었습니다." })
      onUpdate()
    }, 500)
  }

  return (
    <div className="space-y-12 pb-32">
      {/* 메인 배너 관리 */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg text-primary"><Monitor className="w-5 h-5" /></div>
            <div>
              <h3 className="text-xl font-black text-accent">메인 히어로 배너</h3>
              <p className="text-xs font-bold text-accent/30">홈페이지 최상단 와이드 배너 세팅</p>
            </div>
          </div>
          <Button variant="outline" onClick={() => setBanners([...banners, { id: Date.now(), title: "새로운 배너 제목", description: "상세 설명을 입력하세요", image: "", badge: "NEW" }])} className="border-accent/10 font-black rounded-xl h-10 px-5 gap-2">
            <Plus className="w-4 h-4" /> 배너 추가
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-6">
          {banners.map((banner, idx) => (
            <Card key={banner.id} className="bg-white border-accent/5 shadow-sm rounded-[2rem] overflow-hidden">
              <CardContent className="p-8">
                <div className="flex flex-col lg:flex-row gap-8">
                  <div className="flex-1 space-y-6">
                    <div className="flex items-center justify-between">
                      <Badge className="bg-accent text-white font-black px-3 py-1 rounded-lg">BANNER #{idx + 1}</Badge>
                      <Button variant="ghost" size="icon" onClick={() => setBanners(banners.filter((_, i) => i !== idx))} className="text-red-400 hover:text-red-600 hover:bg-red-50 rounded-full"><Trash2 className="w-4 h-4" /></Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-accent/30 uppercase tracking-widest ml-1">배지 문구</label>
                        <Input value={banner.badge} onChange={(e) => handleBannerChange(idx, "badge", e.target.value)} className="bg-accent/5 border-none h-11 rounded-xl font-bold" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-accent/30 uppercase tracking-widest ml-1">제목</label>
                        <Input value={banner.title} onChange={(e) => handleBannerChange(idx, "title", e.target.value)} className="bg-accent/5 border-none h-11 rounded-xl font-black" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-accent/30 uppercase tracking-widest ml-1">설명 문구</label>
                      <Textarea value={banner.description} onChange={(e) => handleBannerChange(idx, "description", e.target.value)} className="bg-accent/5 border-none h-24 rounded-xl font-medium resize-none" />
                    </div>
                  </div>
                  <div className="lg:w-80 shrink-0 space-y-3">
                    <label className="text-[10px] font-black text-accent/30 uppercase tracking-widest ml-1">이미지 (1200x600 권장)</label>
                    <div onClick={() => document.getElementById(`banner-img-${idx}`)?.click()} className="w-full aspect-[2/1] bg-accent/5 rounded-2xl border-2 border-dashed border-accent/10 flex flex-col items-center justify-center cursor-pointer overflow-hidden relative group">
                      {banner.image ? <img src={banner.image} className="w-full h-full object-cover" alt="preview" /> : <Camera className="w-8 h-8 text-accent/10" />}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all text-white text-[10px] font-black">이미지 업로드</div>
                    </div>
                    <input type="file" id={`banner-img-${idx}`} className="hidden" accept="image/*" onChange={(e) => handleImageUpload('banner', idx, e)} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* 프리미엄 광고 관리 */}
      <section className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg text-primary"><ImageIcon className="w-5 h-5" /></div>
          <div>
            <h3 className="text-xl font-black text-accent">사이드바 프리미엄 광고</h3>
            <p className="text-xs font-bold text-accent/30">우측 고정 영역 광고 슬롯 관리</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {premiumAds.map((ad, idx) => (
            <Card key={ad.id} className="bg-white border-accent/5 shadow-sm rounded-[2rem] overflow-hidden">
              <CardHeader className="p-6 border-b border-accent/5 bg-accent/[0.02]">
                <Badge className="bg-primary text-white font-black px-3 py-1 rounded-lg">AD SLOT #{idx + 1}</Badge>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-accent/30 uppercase tracking-widest ml-1">배지 및 제목</label>
                    <Input value={ad.badge} onChange={(e) => handleAdChange(idx, "badge", e.target.value)} placeholder="배지" className="bg-accent/5 border-none h-10 rounded-xl font-bold mb-2" />
                    <Input value={ad.title} onChange={(e) => handleAdChange(idx, "title", e.target.value)} placeholder="광고 제목" className="bg-accent/5 border-none h-10 rounded-xl font-black" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-accent/30 uppercase tracking-widest ml-1">이미지 (웹/모바일 공용)</label>
                    <div onClick={() => document.getElementById(`ad-img-${idx}`)?.click()} className="relative aspect-[16/9] bg-accent/5 rounded-xl border-2 border-dashed border-accent/10 flex flex-col items-center justify-center cursor-pointer overflow-hidden group">
                      {ad.webImage ? <img src={ad.webImage} className="w-full h-full object-cover" alt="preview" /> : <Camera className="w-6 h-6 text-accent/10" />}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all text-white text-[10px] font-black">교체</div>
                    </div>
                    <input type="file" id={`ad-img-${idx}`} className="hidden" accept="image/*" onChange={(e) => handleImageUpload('ad-web', idx, e)} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-accent/30 uppercase tracking-widest ml-1">연결 URL</label>
                    <div className="relative">
                      <ExternalLink className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-accent/20" />
                      <Input value={ad.link} onChange={(e) => handleAdChange(idx, "link", e.target.value)} placeholder="https://..." className="pl-9 bg-accent/5 border-none h-10 rounded-xl font-medium text-xs" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100]">
        <Button onClick={handleSave} disabled={isSaving} className="h-14 px-12 bg-primary text-white hover:scale-105 transition-all rounded-full font-black text-lg shadow-2xl gap-3">
          {isSaving ? <RefreshCcw className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
          사이트 구성 변경사항 저장
        </Button>
      </div>
    </div>
  )
}
