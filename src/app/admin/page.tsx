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
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => setIsMounted(true), [])

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
        toast({ title: "관리자 인증 성공", description: "플랫폼 통합 관리자 권한을 획득했습니다." })
        setAdminKeyInput("")
      } catch (error) {
        toast({ title: "인증 오류", description: "권한 갱신 중 문제가 발생했습니다.", variant: "destructive" })
      } finally { setIsPromoting(false) }
    } else {
      toast({ title: "인증 실패", description: "올바른 마스터 관리자 키가 아닙니다.", variant: "destructive" })
    }
  }

  if (!isMounted || isUserLoading || isProfileLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-white"><Sparkles className="w-12 h-12 animate-spin text-primary" /></div>
  }

  if (!user || profile?.role !== 'admin') {
    const isMasterEmail = user?.email === 'forum@khrd.co.kr'
    return (
      <div className="min-h-screen bg-[#FBFBFC] flex flex-col items-center justify-center p-4">
        <div className="bg-white p-10 md:p-16 rounded-[3.5rem] flex flex-col items-center max-w-md w-full text-center shadow-2xl border border-black/[0.03]">
          <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center mb-8">
            <ShieldAlert className="w-10 h-10 text-accent" />
          </div>
          <h1 className="text-3xl font-black text-accent mb-3 tracking-tight">관리자 전용 구역</h1>
          <p className="text-sm font-bold text-accent/40 mb-10 leading-relaxed whitespace-pre-line">
            {isMasterEmail ? "마스터 관리자 계정입니다.\n통합 대시보드 권한을 활성화하세요." : "보안을 위해 관리자만 접근 가능합니다.\n인증 키를 정확히 입력해 주세요."}
          </p>
          <div className="w-full space-y-4">
            {!isMasterEmail && (
              <div className="relative">
                <Key className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-accent/20" />
                <Input type="password" placeholder="ADMIN ACCESS KEY" value={adminKeyInput} onChange={(e) => setAdminKeyInput(e.target.value)} className="h-14 pl-14 bg-[#F5F6F7] border-none rounded-2xl text-center font-black focus:ring-2 focus:ring-primary shadow-inner tracking-widest" onKeyDown={(e) => e.key === 'Enter' && handleAdminPromotion()} />
              </div>
            )}
            <Button onClick={handleAdminPromotion} disabled={isPromoting || (!isMasterEmail && !adminKeyInput)} className="w-full h-16 naver-button text-lg shadow-xl hover:scale-[1.02] transition-all">
              {isPromoting ? "권한 갱신 중..." : isMasterEmail ? "관리자 권한 즉시 활성화" : "플랫폼 관리 권한 획득"}
            </Button>
            <Button variant="ghost" onClick={() => router.push("/")} className="w-full text-accent/30 font-black text-xs hover:bg-transparent hover:text-accent mt-4">홈페이지로 돌아가기</Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FBFBFC] pb-32">
      <Header />
      <main className="max-w-7xl mx-auto px-4 py-12 md:py-20">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16 px-2">
          <div className="space-y-2">
            <div className="flex items-center gap-2 mb-2"><Settings className="w-5 h-5 text-primary" /><span className="text-[11px] font-black text-accent/20 uppercase tracking-[0.3em]">Platform Command Center</span></div>
            <h1 className="text-4xl md:text-5xl font-black text-accent tracking-tighter">통합 관리 센터</h1>
            <p className="text-sm font-bold text-accent/30">플랫폼의 모든 경험과 데이터를 실시간으로 제어합니다.</p>
          </div>
          <Button onClick={() => router.push("/")} variant="outline" className="border-accent/10 text-accent font-black rounded-2xl gap-3 h-14 px-8 shadow-sm hover:bg-white hover:border-primary/30 transition-all"><ArrowLeft className="w-5 h-5" /> 서비스 페이지 이동</Button>
        </div>

        <Tabs defaultValue="cms" className="space-y-12">
          <div className="sticky top-24 z-40 bg-[#FBFBFC]/80 backdrop-blur-md py-2 -mx-4 px-4">
            <TabsList className="bg-white border border-accent/[0.03] p-1.5 rounded-[2rem] h-16 md:h-20 w-full md:w-fit grid grid-cols-2 md:flex md:gap-3 shadow-xl">
              <TabsTrigger value="cms" className="rounded-2xl font-black gap-2 data-[state=active]:bg-primary data-[state=active]:text-accent data-[state=active]:shadow-lg px-10 transition-all"><LayoutDashboard className="w-4 h-4" /> 사이트 구성</TabsTrigger>
              <TabsTrigger value="members" className="rounded-2xl font-black gap-2 data-[state=active]:bg-primary data-[state=active]:text-accent data-[state=active]:shadow-lg px-10 transition-all"><Users className="w-4 h-4" /> 회원 관리</TabsTrigger>
              <TabsTrigger value="content" className="rounded-2xl font-black gap-2 data-[state=active]:bg-primary data-[state=active]:text-accent data-[state=active]:shadow-lg px-10 transition-all"><FileText className="w-4 h-4" /> 콘텐츠 현황</TabsTrigger>
              <TabsTrigger value="aldi" className="rounded-2xl font-black gap-2 data-[state=active]:bg-primary data-[state=active]:text-accent data-[state=active]:shadow-lg px-10 transition-all"><Sparkles className="w-4 h-4" /> AI 봇 관리</TabsTrigger>
            </TabsList>
          </div>

          <div className="animate-in fade-in slide-in-from-bottom-6 duration-700">
            <TabsContent value="cms" className="mt-0">
              <AdminCMS key={isConfigLoading ? 'loading' : 'loaded'} initialBanners={initialBanners} initialPremiumAds={initialPremiumAds} initialBranding={initialBranding} onUpdate={() => router.refresh()} />
            </TabsContent>
            <TabsContent value="members" className="mt-0"><MemberManager /></TabsContent>
            <TabsContent value="content" className="mt-0"><ContentManager /></TabsContent>
            <TabsContent value="aldi" className="mt-0"><AldiTrainer /></TabsContent>
          </div>
        </Tabs>
      </main>
    </div>
  )
}