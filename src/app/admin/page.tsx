
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
import { PremiumAd } from "@/lib/types"
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

  // 관리자 계정 이메일 자동 감지 및 키 자동 입력
  useEffect(() => {
    if (user?.email === 'forum@khrd.co.kr' && profile && profile.role !== 'admin') {
      setAdminKeyInput("khrd9933-525")
    }
  }, [user, profile])

  const configDocRef = useMemoFirebase(() => db ? doc(db, "admin_configuration", "site_settings") : null, [db])
  const { data: config } = useDoc<any>(configDocRef)

  const initialBanners = useMemo(() => {
    if (config?.bannerSettings) {
      try { return JSON.parse(config.bannerSettings) as BannerData[] } catch (e) { return [] }
    }
    return []
  }, [config])

  const initialPremiumAds = useMemo(() => {
    if (config?.premiumAdsSettings) {
      try { return JSON.parse(config.premiumAdsSettings) as PremiumAd[] } catch (e) { return undefined }
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
    return <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA]"><Sparkles className="w-12 h-12 animate-spin text-accent" /></div>
  }

  if (!user || profile?.role !== 'admin') {
    const isMasterEmail = user?.email === 'forum@khrd.co.kr'
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex flex-col items-center justify-center p-4">
        <ShieldAlert className="w-20 h-20 text-red-500 mb-6" />
        <h1 className="text-3xl font-black text-primary mb-2">관리자 전용 구역</h1>
        <p className="text-primary/40 font-bold mb-8 text-center max-w-sm">
          {isMasterEmail ? "마스터 관리자님, 아래 버튼을 눌러 관리자 권한을 활성화하세요." : "해당 페이지는 관리자만 접근 가능합니다. 인증 키를 입력하여 권한을 획득하세요."}
        </p>
        <div className="w-full max-w-sm space-y-4">
          {!isMasterEmail && (
            <div className="relative">
              <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary/20" />
              <Input type="password" placeholder="ADMIN ACCESS KEY" value={adminKeyInput} onChange={(e) => setAdminKeyInput(e.target.value)} className="h-14 pl-12 bg-white border-none rounded-2xl text-center font-black text-lg focus:ring-accent shadow-sm" onKeyDown={(e) => e.key === 'Enter' && handleAdminPromotion()} />
            </div>
          )}
          <Button onClick={handleAdminPromotion} disabled={isPromoting || (!isMasterEmail && !adminKeyInput)} className="w-full h-14 bg-primary text-accent font-black rounded-2xl text-lg shadow-lg">
            {isPromoting ? "인증 중..." : isMasterEmail ? "관리자 권한 즉시 획득" : "관리자 권한 획득"}
          </Button>
          <Button variant="ghost" onClick={() => router.push("/")} className="w-full text-primary/30 font-bold">홈으로 돌아가기</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-20">
      <Header />
      <main className="max-w-7xl mx-auto px-4 py-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="text-accent"><Settings className="w-6 h-6" /></div>
              <span className="text-xs font-black text-primary/30 uppercase tracking-[0.2em]">Whisper Admin Control</span>
            </div>
            <h1 className="text-4xl font-black text-primary tracking-tighter">플랫폼 통합 관리</h1>
          </div>
          <Button onClick={() => router.push("/")} variant="outline" className="border-primary/10 text-primary font-black rounded-xl gap-2">
            <ArrowLeft className="w-4 h-4" /> 사용자 모드 전환
          </Button>
        </div>

        <Tabs defaultValue="cms" className="space-y-10">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 bg-primary/5 p-1 rounded-2xl h-16 md:h-20">
            <TabsTrigger value="cms" className="rounded-xl font-black gap-2 data-[state=active]:bg-white data-[state=active]:shadow-lg text-sm md:text-base"><LayoutDashboard className="w-4 h-4" /> 랜딩페이지</TabsTrigger>
            <TabsTrigger value="members" className="rounded-xl font-black gap-2 data-[state=active]:bg-white data-[state=active]:shadow-lg text-sm md:text-base"><Users className="w-4 h-4" /> 회원 관리</TabsTrigger>
            <TabsTrigger value="content" className="rounded-xl font-black gap-2 data-[state=active]:bg-white data-[state=active]:shadow-lg text-sm md:text-base"><FileText className="w-4 h-4" /> 콘텐츠 관리</TabsTrigger>
            <TabsTrigger value="aldi" className="rounded-xl font-black gap-2 data-[state=active]:bg-white data-[state=active]:shadow-lg text-sm md:text-base"><Sparkles className="w-4 h-4" /> 알디 챗 학습</TabsTrigger>
          </TabsList>

          <TabsContent value="cms">
            <AdminCMS initialBanners={initialBanners} initialPremiumAds={initialPremiumAds} onUpdate={() => router.refresh()} />
          </TabsContent>
          <TabsContent value="members"><MemberManager /></TabsContent>
          <TabsContent value="content"><ContentManager /></TabsContent>
          <TabsContent value="aldi"><AldiTrainer /></TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
