
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
import { Trash2, Plus, Save, RefreshCcw, ExternalLink, ImageIcon, Camera, Info, Monitor, Smartphone, Sparkles } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

interface AdminCMSProps {
  initialBanners: BannerData[]
  initialPremiumAds?: PremiumAd[]
  onUpdate: () => void
}

export function AdminCMS({ initialBanners, initialPremiumAds, onUpdate }: AdminCMSProps) {
  const [banners, setBanners] = useState<BannerData[]>(initialBanners)
  const [premiumAds, setPremiumAds] = useState<PremiumAd[]>(initialPremiumAds || [
    { id: "ad1", title: "HR 전문가를 위한\n커리어 엑셀러레이팅", badge: "SPECIAL EVENT", webImage: "https://picsum.photos/seed/ad1/400/220", mobileImage: "https://picsum.photos/seed/ad1m/400/500", link: "#" },
    { id: "ad2", title: "조직문화 진단 툴킷\n무료 체험 신청하기", badge: "PARTNER", webImage: "https://picsum.photos/seed/ad2/400/220", mobileImage: "https://picsum.photos/seed/ad2m/400/500", link: "#" },
    { id: "ad3", title: "AI 기반 자동 채용\n어시스턴트 도입 가이드", badge: "NEW SOLUTION", webImage: "https://picsum.photos/seed/ad3/400/220", mobileImage: "https://picsum.photos/seed/ad3m/400/500", link: "#" }
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
      toast({ title: "설정 저장 완료", description: "사이트 구성 및 프리미엄 광고가 업데이트되었습니다." })
      onUpdate()
    }, 500)
  }

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-32">
      {/* 메인 배너 관리 */}
      <Card className="bg-white border-primary/10 shadow-2xl rounded-[2.5rem] overflow-hidden">
        <CardHeader className="premium-gradient p-8 flex flex-row items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-accent/20 p-3 rounded-2xl"><Monitor className="w-6 h-6 text-accent" /></div>
            <div>
              <CardTitle className="text-2xl font-black text-white">메인 슬라이드 배너</CardTitle>
              <p className="text-accent/80 text-sm font-bold">홈페이지 최상단 와이드 배너를 편집합니다.</p>
            </div>
          </div>
          <Button variant="outline" onClick={() => setBanners([...banners, { id: Date.now(), title: "새 배너", description: "", image: "", badge: "NEW" }])} className="bg-white/10 border-white/20 text-white hover:bg-accent hover:text-primary rounded-xl font-black">
            <Plus className="w-4 h-4 mr-2" /> 배너 추가
          </Button>
        </CardHeader>
        <CardContent className="p-8 space-y-10">
          {banners.map((banner, idx) => (
            <div key={banner.id} className="p-6 bg-primary/5 rounded-[2rem] border border-primary/5 space-y-6">
              <div className="flex justify-between items-center">
                <Badge className="bg-primary text-accent font-black">MAIN BANNER #{idx + 1}</Badge>
                <Button variant="ghost" size="icon" onClick={() => setBanners(banners.filter((_, i) => i !== idx))} className="text-red-400 hover:text-red-600 hover:bg-red-50 rounded-full"><Trash2 className="w-5 h-5" /></Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <Input value={banner.badge} onChange={(e) => handleBannerChange(idx, "badge", e.target.value)} placeholder="배지 문구" className="bg-white border-none rounded-xl font-bold" />
                  <Textarea value={banner.title} onChange={(e) => handleBannerChange(idx, "title", e.target.value)} placeholder="배너 제목" className="bg-white border-none rounded-xl font-black min-h-[100px]" />
                  <Textarea value={banner.description} onChange={(e) => handleBannerChange(idx, "description", e.target.value)} placeholder="설명 문구" className="bg-white border-none rounded-xl font-medium" />
                </div>
                <div className="space-y-2">
                  <div onClick={() => document.getElementById(`banner-img-${idx}`)?.click()} className="w-full aspect-video bg-white rounded-xl border-2 border-dashed border-primary/10 flex flex-col items-center justify-center cursor-pointer overflow-hidden relative group">
                    {banner.image ? <img src={banner.image} className="w-full h-full object-cover" /> : <Camera className="w-8 h-8 text-primary/20" />}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all text-white text-xs font-black">이미지 교체</div>
                  </div>
                  <input type="file" id={`banner-img-${idx}`} className="hidden" accept="image/*" onChange={(e) => handleImageUpload('banner', idx, e)} />
                  <p className="text-[10px] text-accent font-black text-center"><Info className="w-3 h-3 inline mr-1" /> 권장: 1200x600px (2:1)</p>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* 프리미엄 광고 배너 관리 */}
      <Card className="bg-white border-primary/10 shadow-2xl rounded-[2.5rem] overflow-hidden">
        <CardHeader className="bg-accent p-8">
          <div className="flex items-center gap-4">
            <div className="bg-primary p-3 rounded-2xl shadow-xl"><ImageIcon className="w-6 h-6 text-accent" /></div>
            <div>
              <CardTitle className="text-2xl font-black text-primary">트리플 프리미엄 광고 (웹/모바일)</CardTitle>
              <p className="text-primary/60 text-sm font-bold">사이드바 및 모바일 피드용 광고 3종을 관리합니다.</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-8 space-y-12">
          {premiumAds.map((ad, idx) => (
            <div key={ad.id} className="p-8 bg-primary/[0.02] rounded-[2.5rem] border border-primary/5 space-y-8">
              <div className="flex items-center gap-3">
                <Badge className="bg-primary text-accent px-4 py-1.5 rounded-lg font-black shadow-lg">AD SLOT #{idx + 1}</Badge>
                <div className="h-px flex-1 bg-primary/10"></div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                <div className="lg:col-span-5 space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-primary/40 uppercase tracking-widest ml-1">배지 및 제목</label>
                    <div className="flex gap-2">
                      <Input value={ad.badge} onChange={(e) => handleAdChange(idx, "badge", e.target.value)} placeholder="배지 (예: NEW)" className="w-32 bg-white border-none rounded-xl font-bold" />
                      <Input value={ad.title} onChange={(e) => handleAdChange(idx, "title", e.target.value)} placeholder="광고 제목" className="flex-1 bg-white border-none rounded-xl font-black" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-primary/40 uppercase tracking-widest ml-1">랜딩 페이지 URL</label>
                    <div className="relative">
                      <ExternalLink className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/20" />
                      <Input value={ad.link} onChange={(e) => handleAdChange(idx, "link", e.target.value)} placeholder="https://..." className="pl-12 bg-white border-none rounded-xl font-medium" />
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-7 grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between px-1">
                      <span className="text-[10px] font-black text-primary/40 flex items-center gap-1"><Monitor className="w-3 h-3" /> WEB VERSION</span>
                      <span className="text-[9px] text-accent font-black">400x220px</span>
                    </div>
                    <div onClick={() => document.getElementById(`ad-web-${idx}`)?.click()} className="relative aspect-[16/9] bg-white rounded-2xl border-2 border-dashed border-primary/10 flex flex-col items-center justify-center cursor-pointer overflow-hidden group shadow-inner">
                      {ad.webImage ? <img src={ad.webImage} className="w-full h-full object-cover" /> : <Camera className="w-6 h-6 text-primary/20" />}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all text-white text-[10px] font-black">웹 이미지 교체</div>
                    </div>
                    <input type="file" id={`ad-web-${idx}`} className="hidden" accept="image/*" onChange={(e) => handleImageUpload('ad-web', idx, e)} />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between px-1">
                      <span className="text-[10px] font-black text-primary/40 flex items-center gap-1"><Smartphone className="w-3 h-3" /> MOBILE VERSION</span>
                      <span className="text-[9px] text-accent font-black">400x500px</span>
                    </div>
                    <div onClick={() => document.getElementById(`ad-mobile-${idx}`)?.click()} className="relative aspect-[4/5] bg-white rounded-2xl border-2 border-dashed border-primary/10 flex flex-col items-center justify-center cursor-pointer overflow-hidden group shadow-inner">
                      {ad.mobileImage ? <img src={ad.mobileImage} className="w-full h-full object-cover" /> : <Camera className="w-6 h-6 text-primary/20" />}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all text-white text-[10px] font-black">모바일 이미지 교체</div>
                    </div>
                    <input type="file" id={`ad-mobile-${idx}`} className="hidden" accept="image/*" onChange={(e) => handleImageUpload('ad-mobile', idx, e)} />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100]">
        <Button onClick={handleSave} disabled={isSaving} className="h-16 px-16 bg-primary text-accent hover:scale-105 transition-all rounded-full font-black text-xl shadow-2xl gap-4">
          {isSaving ? <RefreshCcw className="w-6 h-6 animate-spin" /> : <Save className="w-6 h-6" />}
          전체 콘텐츠 구성 저장하기
        </Button>
      </div>
    </div>
  )
}
