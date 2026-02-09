
"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { BannerData } from "./MainBanner"
import { useFirestore, setDocumentNonBlocking } from "@/firebase"
import { doc } from "firebase/firestore"
import { Trash2, Plus, Save, RefreshCcw, ExternalLink, ImageIcon, Camera } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface SidebarAdData {
  image: string
  link: string
  title: string
}

interface AdminCMSProps {
  initialBanners: BannerData[]
  initialSidebarAd?: SidebarAdData
  onUpdate: () => void
}

export function AdminCMS({ initialBanners, initialSidebarAd, onUpdate }: AdminCMSProps) {
  const [banners, setBanners] = useState<BannerData[]>(initialBanners)
  const [sidebarAd, setSidebarAd] = useState<SidebarAdData>(initialSidebarAd || {
    image: "https://picsum.photos/seed/ad/400/500",
    link: "https://whisper.hr",
    title: "HR 전문가를 위한 프리미엄 솔루션"
  })
  const [isSaving, setIsSaving] = useState(false)
  const db = useFirestore()
  const { toast } = useToast()

  const handleBannerChange = (index: number, field: keyof BannerData, value: string) => {
    const newBanners = [...banners]
    newBanners[index] = { ...newBanners[index], [field]: value }
    setBanners(newBanners)
  }

  const handleBannerImageUpload = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => handleBannerChange(index, "image", reader.result as string)
      reader.readAsDataURL(file)
    }
  }

  const handleSidebarAdImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => setSidebarAd({ ...sidebarAd, image: reader.result as string })
      reader.readAsDataURL(file)
    }
  }

  const addBanner = () => {
    const newBanner: BannerData = {
      id: Date.now(),
      title: "새로운 배너 제목",
      description: "배너 설명을 입력하세요.",
      image: "https://picsum.photos/seed/new/1200/600",
      badge: "NEW"
    }
    setBanners([...banners, newBanner])
  }

  const removeBanner = (index: number) => {
    setBanners(banners.filter((_, i) => i !== index))
  }

  const handleSave = () => {
    if (!db) return
    setIsSaving(true)
    const configRef = doc(db, "admin_configuration", "site_settings")
    
    setDocumentNonBlocking(configRef, {
      id: "site_settings",
      bannerSettings: JSON.stringify(banners),
      sidebarAdSettings: JSON.stringify(sidebarAd),
      uiText: JSON.stringify({ siteName: "WHISPER" }),
      lastUpdated: new Date().toISOString()
    }, { merge: true })

    setTimeout(() => {
      setIsSaving(false)
      toast({ title: "설정 저장 완료", description: "사이트 구성 및 광고 배너가 업데이트되었습니다." })
      onUpdate()
    }, 500)
  }

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      {/* 메인 배너 관리 */}
      <Card className="bg-white border-primary/10 shadow-2xl rounded-[2.5rem] overflow-hidden">
        <CardHeader className="premium-gradient p-8 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-2xl font-black text-white">메인 배너 관리 (CMS)</CardTitle>
            <p className="text-accent/80 text-sm font-bold mt-1">상단 슬라이드 배너를 편집합니다.</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={addBanner} className="bg-white/10 border-white/20 text-white hover:bg-accent hover:text-primary rounded-xl font-black">
              <Plus className="w-4 h-4 mr-2" /> 배너 추가
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-8 space-y-10">
          {banners.map((banner, idx) => (
            <div key={banner.id} className="p-6 bg-primary/5 rounded-[2rem] border border-primary/5 space-y-6 relative group">
              <div className="flex justify-between items-center">
                <Badge className="bg-primary text-accent font-black">BANNER #{idx + 1}</Badge>
                <Button variant="ghost" size="icon" onClick={() => removeBanner(idx)} className="text-red-400 hover:text-red-600 hover:bg-red-50 rounded-full">
                  <Trash2 className="w-5 h-5" />
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-primary/40 ml-1 uppercase">배지 문구</label>
                    <Input 
                      value={banner.badge} 
                      onChange={(e) => handleBannerChange(idx, "badge", e.target.value)}
                      className="bg-white border-none rounded-xl font-bold"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-primary/40 ml-1 uppercase">제목 (줄바꿈 \n 사용)</label>
                    <Textarea 
                      value={banner.title} 
                      onChange={(e) => handleBannerChange(idx, "title", e.target.value)}
                      className="bg-white border-none rounded-xl font-black min-h-[100px]"
                    />
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-primary/40 ml-1 uppercase">배너 이미지 (클릭하여 업로드)</label>
                    <div 
                      onClick={() => document.getElementById(`banner-image-${idx}`)?.click()}
                      className="w-full aspect-video bg-white rounded-xl border-2 border-dashed border-primary/10 flex flex-col items-center justify-center cursor-pointer hover:border-accent transition-all overflow-hidden relative"
                    >
                      {banner.image ? (
                        <img src={banner.image} alt="preview" className="w-full h-full object-cover" />
                      ) : (
                        <Camera className="w-8 h-8 text-primary/20" />
                      )}
                      <div className="absolute inset-0 bg-black/20 opacity-0 hover:opacity-100 flex items-center justify-center transition-opacity">
                         <p className="text-white text-xs font-black">이미지 변경</p>
                      </div>
                    </div>
                    <input 
                      type="file" 
                      id={`banner-image-${idx}`} 
                      className="hidden" 
                      accept="image/*"
                      onChange={(e) => handleBannerImageUpload(idx, e)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-primary/40 ml-1 uppercase">설명 문구</label>
                    <Textarea 
                      value={banner.description} 
                      onChange={(e) => handleBannerChange(idx, "description", e.target.value)}
                      className="bg-white border-none rounded-xl font-medium min-h-[100px]"
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* 사이드바 광고 관리 */}
      <Card className="bg-white border-primary/10 shadow-2xl rounded-[2.5rem] overflow-hidden">
        <CardHeader className="bg-accent p-8">
          <CardTitle className="text-2xl font-black text-primary flex items-center gap-3">
            <ImageIcon className="w-7 h-7" />
            수익형 사이드바 광고 관리
          </CardTitle>
          <p className="text-primary/60 text-sm font-bold mt-1">메인 페이지 우측 하단에 노출될 세로형 광고를 설정합니다.</p>
        </CardHeader>
        <CardContent className="p-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            <div className="lg:col-span-8 space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-black text-primary/40 ml-1 uppercase">광고 제목</label>
                <Input 
                  value={sidebarAd.title}
                  onChange={(e) => setSidebarAd({ ...sidebarAd, title: e.target.value })}
                  placeholder="인사담당자의 눈길을 끄는 문구"
                  className="bg-primary/5 border-none h-12 rounded-xl font-bold"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-primary/40 ml-1 uppercase">광고 이미지 (클릭하여 업로드)</label>
                <div 
                  onClick={() => document.getElementById('sidebar-ad-image')?.click()}
                  className="w-full h-24 bg-primary/5 rounded-xl border-2 border-dashed border-primary/10 flex items-center justify-center cursor-pointer hover:border-accent transition-all overflow-hidden"
                >
                  {sidebarAd.image ? (
                    <img src={sidebarAd.image} alt="preview" className="h-full object-contain" />
                  ) : (
                    <Camera className="w-6 h-6 text-primary/20" />
                  )}
                </div>
                <input 
                  type="file" 
                  id="sidebar-ad-image" 
                  className="hidden" 
                  accept="image/*"
                  onChange={handleSidebarAdImageUpload}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-primary/40 ml-1 uppercase">랜딩 페이지 링크 (URL)</label>
                <div className="relative group">
                  <ExternalLink className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/30" />
                  <Input 
                    value={sidebarAd.link}
                    onChange={(e) => setSidebarAd({ ...sidebarAd, link: e.target.value })}
                    placeholder="https://..."
                    className="pl-12 bg-primary/5 border-none h-12 rounded-xl font-medium"
                  />
                </div>
              </div>
            </div>

            <div className="lg:col-span-4 space-y-4">
               <label className="text-xs font-black text-primary/40 ml-1 uppercase">미리보기</label>
               <div className="relative aspect-[4/5] rounded-[2rem] overflow-hidden shadow-2xl border-4 border-white group">
                  <img src={sidebarAd.image} alt="preview" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                  <div className="absolute bottom-6 left-6 right-6">
                    <Badge className="bg-accent text-primary font-black mb-2">AD</Badge>
                    <p className="text-white font-black text-lg leading-tight line-clamp-2">{sidebarAd.title}</p>
                  </div>
               </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100]">
        <Button 
          onClick={handleSave} 
          disabled={isSaving} 
          className="h-16 px-12 bg-primary text-accent hover:scale-105 transition-all rounded-full font-black text-lg shadow-2xl gap-3"
        >
          {isSaving ? <RefreshCcw className="w-6 h-6 animate-spin" /> : <Save className="w-6 h-6" />}
          전체 설정 저장하기
        </Button>
      </div>
    </div>
  )
}
