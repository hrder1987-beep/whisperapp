
"use client"

import { useState, useMemo, useEffect } from "react"
import { Header } from "@/components/chuchot/Header"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useUser, useFirestore, useDoc, useMemoFirebase, updateDocumentNonBlocking } from "@/firebase"
import { doc } from "firebase/firestore"
import { useRouter } from "next/navigation"
import { LayoutDashboard, Users, FileText, Sparkles, Settings, ArrowLeft, ShieldAlert, Key } from "lucide-react"
import { AdminCMS } from "@/components/chuchot/AdminCMS"
import { MemberManager } from "@/components/chuchot/admin/MemberManager"
import { ContentManager } from "@/components/chuchot/admin/ContentManager"
import { AldiTrainer } from "@/components/chuchot/admin/AldiTrainer"
import { BannerData } from "@/components/chuchot/MainBanner"
import { PremiumAd, SiteBranding } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"

export default function AdminPage() {
  const { user, isUserLoading } = useUser()
  const db = useFirestore()
  const router = useRouter()
  const { toast } = useToast()

  const [adminKeyInput, setAdminKeyInput] = useState("")
  const [isPromoting, setIsPromoting] = useState(false)

  const userDocRef = useMemoFirebase(() => (user && db) ? doc(db, "users", user.uid) : null, [user, db])
  const { data: profile, isLoading: isProfileLoading } = useDoc<any>(userDocRef)

  useEffect(() => {
    if (user?.email === 'forum@khrd.co.kr' && profile && profile.role !== 'admin') {
      setAdminKeyInput("khrd9933-525")
    }
  }, [user, profile])

  const configDocRef = useMemoFirebase(() => db ? doc(db, "admin_configuration", "site_settings") : null, [db])
  const { data: config, isLoading: isConfigLoading } = useDoc<any>(configDocRef)

  const initialBanners = useMemo(() => {
    if (config?.bannerSettings) {
      try { return JSON.parse(config.bannerSettings) as BannerData[] } catch (e) { return [] }
    }
    return []
  }, [config])

  const initialPremiumAds = useMemo(() => {
    if (config?.premiumAdsSettings) {
      try { return JSON.parse(config.premiumAdsSettings) as PremiumAd[] } catch (e) { return [] }
    }
    return []
  }, [config])

  const initialBranding = useMemo(() => {
    if (config?.brandingSettings) {
      try { return JSON.parse(config.brandingSettings) as SiteBranding } catch (e) { return undefined }
    }
    return undefined
  }, [config])

  const handleAdminPromotion = async () => {
    if (!user || !db) return
    if (adminKeyInput === "khrd9933-525") {
      setIsPromoting(true)
      try {
        updateDocumentNonBlocking(doc(db, "users", user.uid), { role: "admin" })
        toast({ title: "관리자 인증 성공", description: "플랫폼 관리자 권한을 획득했습니다." })
        setAdminKeyInput("")
      } catch (error) {
        toast({ title: "오류 발생", description: "인증 중 문제가 발생했습니다.", variant: "destructive" })
      } finally { setIsPromoting(false) }
    } else {
      toast({ title: "인증 실패", description: "올바른 관리자 키가 아닙니다.", variant: "destructive" })
    }
  }

  if (isUserLoading || isProfileLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-white"><Sparkles className="w-12 h-12 animate-spin text-primary" /></div>
  }

  if (!user || profile?.role !== 'admin') {
    const isMasterEmail = user?.email === 'forum@khrd.co.kr'
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4">
        <div className="bg-primary/5 p-10 rounded-[3rem] flex flex-col items-center max-w-sm w-full text-center">
          <ShieldAlert className="w-16 h-16 text-primary mb-6" />
          <h1 className="text-2xl font-black text-accent mb-2">관리자 전용 구역</h1>
          <p className="text-sm font-bold text-accent/40 mb-8 leading-relaxed">
            {isMasterEmail ? "마스터 관리자 계정입니다.\n권한을 활성화하세요." : "관리자만 접근 가능한 페이지입니다.\n인증 키를 입력해 주세요."}
          </p>
          <div className="w-full space-y-4">
            {!isMasterEmail && (
              <div className="relative">
                <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-accent/20" />
                <Input type="password" placeholder="ADMIN ACCESS KEY" value={adminKeyInput} onChange={(e) => setAdminKeyInput(e.target.value)} className="h-12 pl-11 bg-white border-accent/10 rounded-xl text-center font-bold focus:ring-primary shadow-sm" onKeyDown={(e) => e.key === 'Enter' && handleAdminPromotion()} />
              </div>
            )}
            <Button onClick={handleAdminPromotion} disabled={isPromoting || (!isMasterEmail && !adminKeyInput)} className="w-full h-12 bg-primary text-white font-black rounded-xl shadow-lg">
              {isPromoting ? "인증 중..." : isMasterEmail ? "관리자 권한 활성화" : "권한 획득"}
            </Button>
            <Button variant="ghost" onClick={() => router.push("/")} className="w-full text-accent/30 font-bold text-xs">홈으로 돌아가기</Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FBFBFC] pb-20">
      <Header />
      <main className="max-w-7xl mx-auto px-4 py-10 md:py-16">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div className="space-y-1">
            <div className="flex items-center gap-2 mb-1">
              <Settings className="w-5 h-5 text-primary" />
              <span className="text-[10px] font-black text-accent/30 uppercase tracking-widest">Platform Admin Dashboard</span>
            </div>
            <h1 className="text-3xl font-black text-accent tracking-tighter">통합 관리 센터</h1>
          </div>
          <Button onClick={() => router.push("/")} variant="outline" className="border-accent/10 text-accent font-black rounded-xl gap-2 h-11 px-6">
            <ArrowLeft className="w-4 h-4" /> 서비스 페이지로 이동
          </Button>
        </div>

        <Tabs defaultValue="cms" className="space-y-10">
          <TabsList className="bg-white border border-accent/5 p-1 rounded-2xl h-16 md:h-20 w-full md:w-fit grid grid-cols-2 md:flex md:gap-2 shadow-sm">
            <TabsTrigger value="cms" className="rounded-xl font-black gap-2 data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-md px-8"><LayoutDashboard className="w-4 h-4" /> 사이트 구성</TabsTrigger>
            <TabsTrigger value="members" className="rounded-xl font-black gap-2 data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-md px-8"><Users className="w-4 h-4" /> 회원 관리</TabsTrigger>
            <TabsTrigger value="content" className="rounded-xl font-black gap-2 data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-md px-8"><FileText className="w-4 h-4" /> 콘텐츠 현황</TabsTrigger>
            <TabsTrigger value="aldi" className="rounded-xl font-black gap-2 data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-md px-8"><Sparkles className="w-4 h-4" /> AI 봇 관리</TabsTrigger>
          </TabsList>

          <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
            <TabsContent value="cms">
              <AdminCMS 
                key={isConfigLoading ? 'loading' : 'loaded'} 
                initialBanners={initialBanners} 
                initialPremiumAds={initialPremiumAds} 
                initialBranding={initialBranding}
                onUpdate={() => router.refresh()} 
              />
            </TabsContent>
            <TabsContent value="members"><MemberManager /></TabsContent>
            <TabsContent value="content"><ContentManager /></TabsContent>
            <TabsContent value="aldi"><AldiTrainer /></TabsContent>
          </div>
        </Tabs>
      </main>
    </div>
  )
}
