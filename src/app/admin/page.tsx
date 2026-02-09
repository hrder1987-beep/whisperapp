"use client"

import { useState, useMemo } from "react"
import { Header } from "@/components/chuchot/Header"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase"
import { doc } from "firebase/firestore"
import { useRouter } from "next/navigation"
import { LayoutDashboard, Users, FileText, Sparkles, Settings, ArrowLeft, ShieldAlert } from "lucide-react"
import { AdminCMS } from "@/components/chuchot/AdminCMS"
import { MemberManager } from "@/components/chuchot/admin/MemberManager"
import { ContentManager } from "@/components/chuchot/admin/ContentManager"
import { AldiTrainer } from "@/components/chuchot/admin/AldiTrainer"
import { BannerData } from "@/components/chuchot/MainBanner"

export default function AdminPage() {
  const { user, isUserLoading } = useUser()
  const db = useFirestore()
  const router = useRouter()

  const userDocRef = useMemoFirebase(() => (user && db) ? doc(db, "users", user.uid) : null, [user, db])
  const { data: profile, isLoading: isProfileLoading } = useDoc<any>(userDocRef)

  const configDocRef = useMemoFirebase(() => {
    if (!db) return null
    return doc(db, "admin_configuration", "site_settings")
  }, [db])
  const { data: config } = useDoc<any>(configDocRef)

  const initialBanners = useMemo(() => {
    if (config?.bannerSettings) {
      try {
        return JSON.parse(config.bannerSettings) as BannerData[]
      } catch (e) {
        return []
      }
    }
    return []
  }, [config])

  const initialSidebarAd = useMemo(() => {
    if (config?.sidebarAdSettings) {
      try {
        return JSON.parse(config.sidebarAdSettings)
      } catch (e) {
        return undefined
      }
    }
    return undefined
  }, [config])

  if (isUserLoading || isProfileLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA]"><Sparkles className="w-12 h-12 animate-spin text-accent" /></div>
  }

  // 관리자 권한 체크 (보안 강화)
  if (!user || profile?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex flex-col items-center justify-center p-4">
        <ShieldAlert className="w-20 h-20 text-red-500 mb-6" />
        <h1 className="text-3xl font-black text-primary mb-2">접근 권한이 없습니다</h1>
        <p className="text-primary/40 font-bold mb-8 text-center">관리자 계정으로 로그인 후 다시 시도해 주세요.</p>
        <Button onClick={() => router.push("/")} className="bg-primary text-accent font-black rounded-xl h-14 px-10">홈으로 돌아가기</Button>
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
              <div className="bg-primary text-accent p-2 rounded-lg"><Settings className="w-5 h-5" /></div>
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
            <TabsTrigger value="cms" className="rounded-xl font-black gap-2 data-[state=active]:bg-white data-[state=active]:shadow-lg text-sm md:text-base">
              <LayoutDashboard className="w-4 h-4" /> 랜딩페이지
            </TabsTrigger>
            <TabsTrigger value="members" className="rounded-xl font-black gap-2 data-[state=active]:bg-white data-[state=active]:shadow-lg text-sm md:text-base">
              <Users className="w-4 h-4" /> 회원 관리
            </TabsTrigger>
            <TabsTrigger value="content" className="rounded-xl font-black gap-2 data-[state=active]:bg-white data-[state=active]:shadow-lg text-sm md:text-base">
              <FileText className="w-4 h-4" /> 콘텐츠 관리
            </TabsTrigger>
            <TabsTrigger value="aldi" className="rounded-xl font-black gap-2 data-[state=active]:bg-white data-[state=active]:shadow-lg text-sm md:text-base">
              <Sparkles className="w-4 h-4" /> 알디 챗 학습
            </TabsTrigger>
          </TabsList>

          <TabsContent value="cms">
            <AdminCMS initialBanners={initialBanners} initialSidebarAd={initialSidebarAd} onUpdate={() => router.refresh()} />
          </TabsContent>

          <TabsContent value="members">
            <MemberManager />
          </TabsContent>

          <TabsContent value="content">
            <ContentManager />
          </TabsContent>

          <TabsContent value="aldi">
            <AldiTrainer />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
