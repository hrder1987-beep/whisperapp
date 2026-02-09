
"use client"

import { useUser, useDoc, useMemoFirebase, useFirestore } from "@/firebase"
import { doc } from "firebase/firestore"
import { Header } from "@/components/chuchot/Header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AvatarIcon } from "@/components/chuchot/AvatarIcon"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Building2, User as UserIcon, Phone, Briefcase, Calendar, Sparkles, Settings, ArrowRight } from "lucide-react"
import Link from "next/link"

export default function ProfilePage() {
  const { user, isUserLoading } = useUser()
  const db = useFirestore()

  const userDocRef = useMemoFirebase(() => (user && db) ? doc(db, "users", user.uid) : null, [user, db])
  const { data: profile, isLoading: isProfileLoading } = useDoc<any>(userDocRef)

  if (isUserLoading || isProfileLoading) {
    return (
      <div className="min-h-screen bg-[#F8F9FA]">
        <Header />
        <div className="flex justify-center py-40">
          <Sparkles className="w-12 h-12 animate-spin text-accent" />
        </div>
      </div>
    )
  }

  if (!user || !profile) {
    return (
      <div className="min-h-screen bg-[#F8F9FA]">
        <Header />
        <div className="max-w-md mx-auto py-20 text-center">
          <p className="text-primary/40 font-black">로그인이 필요하거나 프로필을 찾을 수 없습니다.</p>
        </div>
      </div>
    )
  }

  const isAdmin = user?.email === 'forum@khrd.co.kr' || profile.role === 'admin'

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <Header />
      <main className="max-w-3xl mx-auto px-4 py-12 md:py-20 pb-32">
        <div className="mb-10 flex flex-col items-center text-center">
          <div className="h-1.5 w-16 bg-accent rounded-full mb-4"></div>
          <h1 className="text-3xl font-black text-primary tracking-tighter">마이 프로필</h1>
          <p className="text-sm font-bold text-primary/30 mt-1 uppercase tracking-widest">Expert Intelligence Identity</p>
        </div>

        <Card className="border-none shadow-2xl rounded-[3rem] overflow-hidden bg-white mb-10">
          <div className="h-3 w-full gold-gradient"></div>
          <CardHeader className="flex flex-col items-center pt-12 pb-8">
            <div className="relative mb-6">
              <div className="absolute inset-0 bg-accent blur-2xl opacity-20"></div>
              <AvatarIcon 
                src={profile.profilePictureUrl} 
                seed={profile.username} 
                className="w-32 h-32 md:w-40 md:h-40 relative border-4 border-white shadow-xl" 
              />
              <Badge className="absolute -bottom-2 right-2 bg-primary text-accent font-black border-none px-4 py-1.5 rounded-xl shadow-lg">
                {profile.role?.toUpperCase()}
              </Badge>
            </div>
            <CardTitle className="text-3xl font-black text-primary tracking-tighter">@{profile.username}</CardTitle>
            <p className="text-primary/40 font-bold mt-1">{profile.email}</p>
          </CardHeader>
          
          <CardContent className="px-8 md:px-12 pb-16 space-y-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-primary/5 rounded-2xl">
                    <UserIcon className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-primary/30 uppercase tracking-widest">성함</p>
                    <p className="font-black text-primary">{profile.name}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="p-3 bg-primary/5 rounded-2xl">
                    <Building2 className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-primary/30 uppercase tracking-widest">소속</p>
                    <p className="font-black text-primary">{profile.company} ({profile.department})</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="p-3 bg-primary/5 rounded-2xl">
                    <Briefcase className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-primary/30 uppercase tracking-widest">직함</p>
                    <p className="font-black text-primary">{profile.jobTitle}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-primary/5 rounded-2xl">
                    <Phone className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-primary/30 uppercase tracking-widest">휴대전화</p>
                    <p className="font-black text-primary">{profile.phoneNumber}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="p-3 bg-primary/5 rounded-2xl">
                    <Calendar className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-primary/30 uppercase tracking-widest">가입일</p>
                    <p className="font-black text-primary">
                      {new Date(profile.registrationDate).toLocaleDateString('ko-KR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-8 border-t border-primary/5">
              <div className="bg-primary/5 p-8 rounded-[2.5rem] text-center space-y-4">
                <h4 className="font-black text-primary">전문가 활동 지수</h4>
                <div className="flex flex-wrap justify-center gap-4">
                  <div className="px-6 py-4 bg-white rounded-2xl shadow-sm flex-1 min-w-[140px]">
                    <p className="text-[10px] font-black text-primary/30 uppercase">영향력</p>
                    <p className="text-xl font-black text-accent">TOP 1%</p>
                  </div>
                  <div className="px-6 py-4 bg-white rounded-2xl shadow-sm flex-1 min-w-[140px]">
                    <p className="text-[10px] font-black text-primary/30 uppercase">기여도</p>
                    <p className="text-xl font-black text-accent">LEVEL 5</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {isAdmin && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-1000">
            <Link href="/admin">
              <Button className="w-full h-20 bg-primary text-accent hover:bg-primary/95 rounded-[2rem] shadow-2xl flex items-center justify-between px-10 group transition-all">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-white/10 rounded-2xl group-hover:scale-110 transition-transform">
                    <Settings className="w-6 h-6" />
                  </div>
                  <div className="text-left">
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-50">Authorized Personnel Only</p>
                    <p className="text-lg font-black tracking-tight">플랫폼 통합 관리 센터 접속</p>
                  </div>
                </div>
                <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
              </Button>
            </Link>
            <p className="text-center mt-4 text-[11px] font-bold text-primary/20 uppercase tracking-tighter">
              위 버튼은 관리자 권한 계정(@{profile.username})에게만 노출됩니다.
            </p>
          </div>
        )}
      </main>
    </div>
  )
}
