
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
import { Trash2, Plus, Save, RefreshCcw } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface AdminCMSProps {
  initialBanners: BannerData[]
  onUpdate: () => void
}

export function AdminCMS({ initialBanners, onUpdate }: AdminCMSProps) {
  const [banners, setBanners] = useState<BannerData[]>(initialBanners)
  const [isSaving, setIsSaving] = useState(false)
  const db = useFirestore()
  const { toast } = useToast()

  const handleBannerChange = (index: number, field: keyof BannerData, value: string) => {
    const newBanners = [...banners]
    newBanners[index] = { ...newBanners[index], [field]: value }
    setBanners(newBanners)
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
      uiText: JSON.stringify({ siteName: "CHUCHOT" }),
      themeSettings: "{}",
      lastUpdated: new Date().toISOString()
    }, { merge: true })

    setTimeout(() => {
      setIsSaving(false)
      toast({ title: "설정 저장 완료", description: "사이트 구성이 성공적으로 업데이트되었습니다." })
      onUpdate()
    }, 500)
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <Card className="bg-white border-primary/10 shadow-2xl rounded-[2.5rem] overflow-hidden">
        <CardHeader className="premium-gradient p-8 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-2xl font-black text-white">배너 컨텐츠 관리 (CMS)</CardTitle>
            <p className="text-accent/80 text-sm font-bold mt-1">메인 배너의 이미지와 문구를 자유롭게 편집하세요.</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={addBanner} className="bg-white/10 border-white/20 text-white hover:bg-accent hover:text-primary rounded-xl font-black">
              <Plus className="w-4 h-4 mr-2" /> 배너 추가
            </Button>
            <Button onClick={handleSave} disabled={isSaving} className="bg-accent text-primary hover:bg-accent/90 rounded-xl font-black px-8">
              {isSaving ? <RefreshCcw className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              설정 저장하기
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
                    <label className="text-xs font-black text-primary/40 ml-1 uppercase">Badge Text</label>
                    <Input 
                      value={banner.badge} 
                      onChange={(e) => handleBannerChange(idx, "badge", e.target.value)}
                      className="bg-white border-none rounded-xl font-bold"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-primary/40 ml-1 uppercase">Banner Title</label>
                    <Textarea 
                      value={banner.title} 
                      onChange={(e) => handleBannerChange(idx, "title", e.target.value)}
                      className="bg-white border-none rounded-xl font-black min-h-[100px]"
                    />
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-primary/40 ml-1 uppercase">Background Image URL</label>
                    <Input 
                      value={banner.image} 
                      onChange={(e) => handleBannerChange(idx, "image", e.target.value)}
                      className="bg-white border-none rounded-xl font-medium"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-primary/40 ml-1 uppercase">Description</label>
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
          {banners.length === 0 && (
            <div className="py-20 text-center border-2 border-dashed border-primary/10 rounded-[2rem]">
              <p className="text-primary/30 font-black">등록된 배너가 없습니다. 새로운 배너를 추가해 보세요.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
