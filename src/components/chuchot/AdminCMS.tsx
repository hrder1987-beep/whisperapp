
"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { BannerData } from "./MainBanner"
import { PremiumAd, SiteBranding } from "@/lib/types"
import { useFirestore, setDocumentNonBlocking } from "@/firebase"
import { doc } from "firebase/firestore"
import { Trash2, Plus, Save, RefreshCcw, ExternalLink, ImageIcon, Camera, FileText, Monitor, Globe } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface AdminCMSProps {
  initialBanners: BannerData[]
  initialPremiumAds?: PremiumAd[]
  initialBranding?: SiteBranding
  onUpdate: () => void
}

export function AdminCMS({ initialBanners, initialPremiumAds, initialBranding, onUpdate }: AdminCMSProps) {
  const [banners, setBanners] = useState<BannerData[]>(initialBanners)
  const [premiumAds, setPremiumAds] = useState<PremiumAd[]>(initialPremiumAds || [])
  const [branding, setBranding] = useState<SiteBranding>(initialBranding || {
    homeTitle: "HR실무자들의 품격 있는 속삭임",
    homeSubtitle: "교육부터 조직문화 인사전략까지 HR실무자를 위한 지식 허브 Whisper",
    gatheringTitle: "모임 인텔리전스",
    gatheringSubtitle: "대한민국 HR 전문가들의 오프라인/온라인 동행",
    mentorTitle: "위스퍼러 (Whisperer)",
    mentorSubtitle: "대한민국 최고의 실무 전문가들과의 1:1 인사이트 연결",
    programTitle: "솔루션 및 프로그램",
    programSubtitle: "전문가가 엄선한 프리미엄 교육 프로그램과 HR IT 솔루션",
    jobTitle: "채용 인텔리전스",
    jobSubtitle: "전문성이 검증된 HR 담당자를 위한 커리어 큐레이션"
  })
  
  const [isSaving, setIsSaving] = useState(false)
  const db = useFirestore()
  const { toast } = useToast()

  // 데이터 로드 지연 시 상태를 명시적으로 동기화하기 위한 훅
  useEffect(() => {
    if (initialBanners.length > 0) setBanners(initialBanners)
    if (initialPremiumAds && initialPremiumAds.length > 0) setPremiumAds(initialPremiumAds)
    if (initialBranding) setBranding(initialBranding)
  }, [initialBanners, initialPremiumAds, initialBranding])

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

  const handleBrandingChange = (field: keyof SiteBranding, value: string) => {
    setBranding(prev => ({ ...prev, [field]: value }))
  }

  const handleImageUpload = (type: 'banner' | 'ad-web', index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        if (type === 'banner') handleBannerChange(index, "image", reader.result as string)
        else if (type === 'ad-web') handleAdChange(index, "webImage", reader.result as string)
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
      brandingSettings: JSON.stringify(branding),
      lastUpdated: new Date().toISOString()
    }, { merge: true })

    setTimeout(() => {
      setIsSaving(false)
      toast({ title: "전체 설정 저장 완료", description: "사이트 구성이 실시간으로 업데이트되었습니다." })
      onUpdate()
    }, 500)
  }

  return (
    <div className="space-y-12 pb-32">
      {/* 사이트 텍스트 정보 관리 */}
      <section className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg text-primary"><FileText className="w-5 h-5" /></div>
          <div>
            <h3 className="text-xl font-black text-accent">전역 사이트 문구 설정</h3>
            <p className="text-xs font-bold text-accent/30">각 페이지의 제목과 설명을 실시간으로 제어합니다.</p>
          </div>
        </div>

        <Card className="bg-white border-accent/5 shadow-sm rounded-[2.5rem] overflow-hidden">
          <CardContent className="p-8 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <label className="text-[10px] font-black text-accent/30 uppercase tracking-widest ml-1">홈페이지 (HOME)</label>
                <div className="space-y-2">
                  <Input value={branding.homeTitle} onChange={(e) => handleBrandingChange("homeTitle", e.target.value)} placeholder="메인 타이틀" className="bg-accent/5 border-none font-black h-11 rounded-xl" />
                  <Input value={branding.homeSubtitle} onChange={(e) => handleBrandingChange("homeSubtitle", e.target.value)} placeholder="서브 타이틀" className="bg-accent/5 border-none font-bold text-xs h-11 rounded-xl" />
                </div>
              </div>
              <div className="space-y-4">
                <label className="text-[10px] font-black text-accent/30 uppercase tracking-widest ml-1">모임 인텔리전스</label>
                <div className="space-y-2">
                  <Input value={branding.gatheringTitle} onChange={(e) => handleBrandingChange("gatheringTitle", e.target.value)} placeholder="페이지 제목" className="bg-accent/5 border-none font-black h-11 rounded-xl" />
                  <Input value={branding.gatheringSubtitle} onChange={(e) => handleBrandingChange("gatheringSubtitle", e.target.value)} placeholder="페이지 설명" className="bg-accent/5 border-none font-bold text-xs h-11 rounded-xl" />
                </div>
              </div>
              <div className="space-y-4">
                <label className="text-[10px] font-black text-accent/30 uppercase tracking-widest ml-1">위스퍼러 (멘토)</label>
                <div className="space-y-2">
                  <Input value={branding.mentorTitle} onChange={(e) => handleBrandingChange("mentorTitle", e.target.value)} placeholder="페이지 제목" className="bg-accent/5 border-none font-black h-11 rounded-xl" />
                  <Input value={branding.mentorSubtitle} onChange={(e) => handleBrandingChange("mentorSubtitle", e.target.value)} placeholder="페이지 설명" className="bg-accent/5 border-none font-bold text-xs h-11 rounded-xl" />
                </div>
              </div>
              <div className="space-y-4">
                <label className="text-[10px] font-black text-accent/30 uppercase tracking-widest ml-1">프로그램/솔루션</label>
                <div className="space-y-2">
                  <Input value={branding.programTitle} onChange={(e) => handleBrandingChange("programTitle", e.target.value)} placeholder="페이지 제목" className="bg-accent/5 border-none font-black h-11 rounded-xl" />
                  <Input value={branding.programSubtitle} onChange={(e) => handleBrandingChange("programSubtitle", e.target.value)} placeholder="페이지 설명" className="bg-accent/5 border-none font-bold text-xs h-11 rounded-xl" />
                </div>
              </div>
              <div className="space-y-4 md:col-span-2">
                <label className="text-[10px] font-black text-accent/30 uppercase tracking-widest ml-1">채용 인텔리전스</label>
                <div className="space-y-2">
                  <Input value={branding.jobTitle} onChange={(e) => handleBrandingChange("jobTitle", e.target.value)} placeholder="페이지 제목" className="bg-accent/5 border-none font-black h-11 rounded-xl" />
                  <Input value={branding.jobSubtitle} onChange={(e) => handleBrandingChange("jobSubtitle", e.target.value)} placeholder="페이지 설명" className="bg-accent/5 border-none font-bold text-xs h-11 rounded-xl" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* 메인 배너 관리 */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg text-primary"><Monitor className="w-5 h-5" /></div>
            <div>
              <h3 className="text-xl font-black text-accent">메인 히어로 배너</h3>
              <p className="text-xs font-bold text-accent/30">홈페이지 상단 롤링 배너 설정</p>
            </div>
          </div>
          <Button variant="outline" onClick={() => setBanners([...banners, { id: Date.now(), title: "새로운 배너", description: "상세 내용", image: "", badge: "NEW" }])} className="border-accent/10 font-black rounded-xl h-10 px-5 gap-2">
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
                      <Badge className="bg-primary text-accent font-black px-3 py-1 rounded-lg">BANNER #{idx + 1}</Badge>
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
                      <Textarea value={banner.description} onChange={(e) => handleBannerChange(idx, "description", e.target.value)} className="bg-accent/5 border-none h-20 rounded-xl font-medium resize-none" />
                    </div>
                  </div>
                  <div className="lg:w-80 shrink-0 space-y-3">
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
            <p className="text-xs font-bold text-accent/30">우측 고정 영역 광고 관리</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {premiumAds.map((ad, idx) => (
            <Card key={ad.id} className="bg-white border-accent/5 shadow-sm rounded-[2rem] overflow-hidden">
              <CardHeader className="p-6 border-b border-accent/5 bg-accent/[0.02] flex flex-row items-center justify-between">
                <Badge className="bg-accent text-primary font-black px-3 py-1 rounded-lg">AD #{idx + 1}</Badge>
                <Button variant="ghost" size="icon" onClick={() => setPremiumAds(premiumAds.filter((_, i) => i !== idx))} className="text-red-400 h-8 w-8"><Trash2 className="w-3.5 h-3.5" /></Button>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="space-y-2">
                  <Input value={ad.badge} onChange={(e) => handleAdChange(idx, "badge", e.target.value)} placeholder="배지" className="bg-accent/5 border-none h-10 rounded-xl font-bold" />
                  <Input value={ad.title} onChange={(e) => handleAdChange(idx, "title", e.target.value)} placeholder="광고 제목" className="bg-accent/5 border-none h-10 rounded-xl font-black" />
                </div>
                <div onClick={() => document.getElementById(`ad-img-${idx}`)?.click()} className="relative aspect-[16/9] bg-accent/5 rounded-xl border-2 border-dashed border-accent/10 flex flex-col items-center justify-center cursor-pointer overflow-hidden group">
                  {ad.webImage ? <img src={ad.webImage} className="w-full h-full object-cover" alt="preview" /> : <Camera className="w-6 h-6 text-accent/10" />}
                </div>
                <input type="file" id={`ad-img-${idx}`} className="hidden" accept="image/*" onChange={(e) => handleImageUpload('ad-web', idx, e)} />
                <div className="relative">
                  <ExternalLink className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-accent/20" />
                  <Input value={ad.link} onChange={(e) => handleAdChange(idx, "link", e.target.value)} placeholder="연결 URL" className="pl-9 bg-accent/5 border-none h-10 rounded-xl font-medium text-xs" />
                </div>
              </CardContent>
            </Card>
          ))}
          <Button variant="outline" onClick={() => setPremiumAds([...premiumAds, { id: Date.now().toString(), title: "신규 광고", badge: "NEW", webImage: "", mobileImage: "", link: "#" }])} className="h-full min-h-[300px] border-dashed border-accent/10 rounded-[2rem] flex flex-col gap-3 font-black text-accent/30 hover:bg-primary/5 hover:text-primary transition-all">
            <Plus className="w-10 h-10" /> 광고 슬롯 추가
          </Button>
        </div>
      </section>

      <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100]">
        <Button onClick={handleSave} disabled={isSaving} className="h-14 px-12 bg-accent text-primary hover:scale-105 transition-all rounded-full font-black text-lg shadow-2xl gap-3">
          {isSaving ? <RefreshCcw className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
          플랫폼 전체 변경사항 적용하기
        </Button>
      </div>
    </div>
  )
}
