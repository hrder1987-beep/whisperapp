"use client"

import { useState, useEffect, useRef } from "react"
import { useUser, useDoc, useMemoFirebase, useFirestore, useCollection, updateDocumentNonBlocking } from "@/firebase"
import { doc, collection, query, where, getDocs } from "firebase/firestore"
import { Header } from "@/components/chuchot/Header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AvatarIcon } from "@/components/chuchot/AvatarIcon"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Building2, User as UserIcon, Phone, Briefcase, Calendar, Sparkles, Settings, ArrowRight, Edit3, Camera, Save, X, Tag, Info, CheckCircle2, Loader2 } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

export default function ProfilePage() {
  const { user, isUserLoading } = useUser()
  const db = useFirestore()
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState<any>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [usernameStatus, setUsernameStatus] = useState<"idle" | "checking" | "available" | "duplicate">("idle")

  const userDocRef = useMemoFirebase(() => (user && db) ? doc(db, "users", user.uid) : null, [user, db])
  const { data: profile, isLoading: isProfileLoading } = useDoc<any>(userDocRef)

  const myQuestionsQuery = useMemoFirebase(() => 
    (user && db) ? query(collection(db, "questions"), where("userId", "==", user.uid)) : null, 
    [user, db]
  )
  const { data: questions } = useCollection(myQuestionsQuery)
  
  const postCount = questions?.length || 0
  const answerCount = questions?.reduce((acc, q) => acc + (q.answerCount || 0), 0) || 0

  useEffect(() => {
    if (profile && !formData) {
      setFormData({ ...profile })
    }
  }, [profile, formData])

  // 닉네임 실시간 중복 체크
  useEffect(() => {
    if (!isEditing || !formData?.username || formData.username === profile?.username) {
      setUsernameStatus("idle")
      return
    }

    const checkTimeout = setTimeout(async () => {
      setUsernameStatus("checking")
      try {
        const q = query(collection(db, "users"), where("username", "==", formData.username.trim()))
        const snapshot = await getDocs(q)
        setUsernameStatus(snapshot.empty ? "available" : "duplicate")
      } catch (e) {
        setUsernameStatus("idle")
      }
    }, 500)

    return () => clearTimeout(checkTimeout)
  }, [formData?.username, isEditing, profile?.username, db])

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
          <p className="text-accent/40 font-black">로그인이 필요하거나 프로필을 찾을 수 없습니다.</p>
        </div>
      </div>
    )
  }

  const isAdmin = user?.email === 'forum@khrd.co.kr' || profile.role === 'admin'
  const points = (postCount * 10) + (answerCount * 5)
  const level = Math.floor(points / 20) + 1
  const influenceRank = Math.max(1, 100 - Math.floor(points / 5))

  const handleSave = async () => {
    if (!user || !db || !formData) return
    if (usernameStatus === "duplicate") {
      toast({ title: "닉네임 중복", description: "이미 사용 중인 닉네임입니다.", variant: "destructive" })
      return
    }
    if (usernameStatus === "checking") return;

    setIsSaving(true)
    try {
      updateDocumentNonBlocking(doc(db, "users", user.uid), {
        ...formData,
        username: formData.username.trim()
      })
      toast({ title: "저장 완료", description: "전문가 프로필 정보가 성공적으로 업데이트되었습니다." })
      setIsEditing(false)
    } catch (error) {
      toast({ title: "오류 발생", description: "수정 중 문제가 발생했습니다.", variant: "destructive" })
    } finally {
      setIsSaving(false)
    }
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setFormData({ ...formData, profilePictureUrl: reader.result as string })
      }
      reader.readAsDataURL(file)
    }
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <Header />
      <main className="max-w-4xl mx-auto px-4 py-8 md:py-20 pb-32">
        <div className="mb-8 md:mb-12 flex flex-col items-center text-center">
          <div className="h-1.5 w-16 md:w-20 bg-primary rounded-full mb-4 md:mb-6"></div>
          <h1 className="text-3xl md:text-4xl font-black text-[#163300] tracking-tighter">
            {isEditing ? "프로필 수정" : "마이 프로필"}
          </h1>
          <p className="text-[10px] md:text-sm font-bold text-accent/40 mt-2 uppercase tracking-[0.2em] md:tracking-[0.3em]">
            {isEditing ? "Update Your Expert Identity" : "Expert Intelligence Identity"}
          </p>
        </div>

        <Card className="border-none shadow-3xl rounded-[2.5rem] md:rounded-[3.5rem] overflow-hidden bg-white mb-12 relative">
          <div className="h-3 w-full gold-gradient"></div>
          
          <div className="absolute top-10 right-10 z-20 hidden md:block">
            {!isEditing ? (
              <Button 
                onClick={() => setIsEditing(true)}
                className="rounded-2xl naver-button text-[#163300] hover:scale-105 transition-all font-black gap-2 h-14 px-8 shadow-xl"
              >
                <Edit3 className="w-5 h-5" /> 정보 수정하기
              </Button>
            ) : (
              <div className="flex gap-3">
                <Button 
                  onClick={() => { setIsEditing(false); setFormData({ ...profile }); }}
                  variant="ghost" 
                  className="rounded-2xl bg-red-50 text-red-500 hover:bg-red-100 font-black h-14 px-6"
                >
                  <X className="w-5 h-5 mr-2" /> 취소
                </Button>
                <Button 
                  onClick={handleSave}
                  disabled={isSaving || usernameStatus === "duplicate" || usernameStatus === "checking"}
                  className="rounded-2xl naver-button text-[#163300] font-black gap-2 h-14 px-10 shadow-2xl hover:brightness-110 transition-all"
                >
                  {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                  수정 완료
                </Button>
              </div>
            )}
          </div>

          <CardHeader className="flex flex-col items-center pt-12 md:pt-16 pb-8 md:pb-10">
            <div className="relative mb-4 group cursor-pointer" onClick={() => isEditing && fileInputRef.current?.click()}>
              <div className="absolute inset-0 bg-primary blur-3xl opacity-20 group-hover:opacity-40 transition-opacity"></div>
              <div className="relative">
                <AvatarIcon 
                  src={isEditing ? formData?.profilePictureUrl : profile.profilePictureUrl} 
                  seed={profile.username} 
                  className="w-32 h-32 md:w-48 md:h-48 relative border-4 md:border-8 border-white shadow-2xl" 
                />
                {isEditing && (
                  <div className="absolute inset-0 bg-black/40 rounded-full flex flex-col items-center justify-center border-4 border-white transition-all hover:bg-black/60">
                    <Camera className="w-8 h-8 md:w-10 md:h-10 text-white mb-1 md:mb-2" />
                    <span className="text-[9px] md:text-xs text-white font-black uppercase tracking-widest">사진 변경</span>
                  </div>
                )}
              </div>
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageChange} />
              
              {!isEditing && (
                <Badge className="absolute -bottom-2 md:-bottom-3 right-2 md:right-4 bg-primary text-[#163300] font-black border-2 md:border-4 border-white px-4 md:px-6 py-1.5 md:py-2 rounded-xl md:rounded-2xl shadow-xl text-[10px] md:text-xs">
                  {profile.role?.toUpperCase()}
                </Badge>
              )}
            </div>

            {isEditing && (
              <p className="text-[10px] font-black text-[#163300]/60 uppercase tracking-tighter mb-6 md:mb-8 flex items-center gap-1.5 bg-primary/10 px-3 py-1.5 rounded-full">
                <Info className="w-3 h-3" /> 권장 사이즈: 정비율 400x400px
              </p>
            )}
            
            {isEditing ? (
              <div className="w-full max-sm:px-4 space-y-3 text-center">
                <Label className="text-[11px] font-black text-[#163300] uppercase tracking-widest">활동 닉네임 (중복불가)</Label>
                <div className="relative">
                  <Input 
                    value={formData?.username || ""} 
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className={cn(
                      "text-center bg-[#F5F6F7] border-none rounded-2xl font-black text-xl md:text-2xl h-14 md:h-16 shadow-inner focus:ring-2 focus:ring-primary",
                      usernameStatus === "duplicate" && "ring-2 ring-red-500",
                      usernameStatus === "available" && "ring-2 ring-emerald-500"
                    )}
                  />
                  {usernameStatus === "checking" && <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary animate-spin" />}
                </div>
                {usernameStatus === "duplicate" && <p className="text-xs font-bold text-red-500">이미 사용 중인 닉네임입니다.</p>}
                {usernameStatus === "available" && <p className="text-xs font-bold text-emerald-600 flex items-center justify-center gap-1"><CheckCircle2 className="w-3 h-3" /> 사용 가능</p>}
              </div>
            ) : (
              <div className="text-center">
                <CardTitle className="text-3xl md:text-4xl font-black text-[#163300] tracking-tighter">@{profile.username}</CardTitle>
                <p className="text-[#163300]/60 font-bold mt-2 text-base md:text-lg">{profile.email}</p>
              </div>
            )}
          </CardHeader>
          
          <CardContent className="px-6 md:px-20 pb-12 md:pb-20 space-y-10 md:space-y-12">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-8 md:gap-y-10">
              <div className="space-y-8 md:space-y-10">
                <div className="flex items-start gap-4 md:gap-5">
                  <div className="mt-1 p-2.5 md:p-3 bg-primary/10 rounded-2xl text-[#163300]"><UserIcon className="w-5 h-5 md:w-6 md:h-6" /></div>
                  <div className="flex-1 space-y-1.5 md:space-y-2">
                    <p className="text-[10px] md:text-[11px] font-black text-[#163300]/60 uppercase tracking-widest">성함 (실명)</p>
                    {isEditing ? (
                      <Input value={formData?.name || ""} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="bg-[#F5F6F7] border-none rounded-xl h-11 md:h-12 px-4 font-bold text-[#163300] shadow-inner" />
                    ) : (
                      <p className="font-black text-[#163300] text-lg md:text-xl">{profile.name}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-start gap-4 md:gap-5">
                  <div className="mt-1 p-2.5 md:p-3 bg-primary/10 rounded-2xl text-[#163300]"><Building2 className="w-5 h-5 md:w-6 md:h-6" /></div>
                  <div className="flex-1 space-y-1.5 md:space-y-2">
                    <p className="text-[10px] md:text-[11px] font-black text-[#163300]/60 uppercase tracking-widest">소속 회사</p>
                    {isEditing ? (
                      <Input value={formData?.company || ""} onChange={(e) => setFormData({ ...formData, company: e.target.value })} className="bg-[#F5F6F7] border-none rounded-xl h-11 md:h-12 px-4 font-bold text-[#163300] shadow-inner" />
                    ) : (
                      <p className="font-black text-[#163300] text-lg md:text-xl">{profile.company}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-start gap-4 md:gap-5">
                  <div className="mt-1 p-2.5 md:p-3 bg-primary/10 rounded-2xl text-[#163300]"><Tag className="w-5 h-5 md:w-6 md:h-6" /></div>
                  <div className="flex-1 space-y-1.5 md:space-y-2">
                    <p className="text-[10px] md:text-[11px] font-black text-[#163300]/60 uppercase tracking-widest">소속 부서</p>
                    {isEditing ? (
                      <Input value={formData?.department || ""} onChange={(e) => setFormData({ ...formData, department: e.target.value })} className="bg-[#F5F6F7] border-none rounded-xl h-11 md:h-12 px-4 font-bold text-[#163300] shadow-inner" />
                    ) : (
                      <p className="font-black text-[#163300] text-lg md:text-xl">{profile.department}</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-8 md:space-y-10">
                <div className="flex items-start gap-4 md:gap-5">
                  <div className="mt-1 p-2.5 md:p-3 bg-primary/10 rounded-2xl text-[#163300]"><Briefcase className="w-5 h-5 md:w-6 md:h-6" /></div>
                  <div className="flex-1 space-y-1.5 md:space-y-2">
                    <p className="text-[10px] md:text-[11px] font-black text-[#163300]/60 uppercase tracking-widest">직함 (Position)</p>
                    {isEditing ? (
                      <Input value={formData?.jobTitle || ""} onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })} className="bg-[#F5F6F7] border-none rounded-xl h-11 md:h-12 px-4 font-bold text-[#163300] shadow-inner" />
                    ) : (
                      <p className="font-black text-[#163300] text-lg md:text-xl">{profile.jobTitle}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-start gap-4 md:gap-5">
                  <div className="mt-1 p-2.5 md:p-3 bg-primary/10 rounded-2xl text-[#163300]"><Sparkles className="w-5 h-5 md:w-6 md:h-6" /></div>
                  <div className="flex-1 space-y-1.5 md:space-y-2">
                    <p className="text-[10px] md:text-[11px] font-black text-[#163300]/60 uppercase tracking-widest">직무 (Role)</p>
                    {isEditing ? (
                      <Input value={formData?.jobRole || ""} onChange={(e) => setFormData({ ...formData, jobRole: e.target.value })} className="bg-[#F5F6F7] border-none rounded-xl h-11 md:h-12 px-4 font-bold text-[#163300] shadow-inner" />
                    ) : (
                      <p className="font-black text-[#163300] text-lg md:text-xl">{profile.jobRole || "미설정"}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-start gap-4 md:gap-5">
                  <div className="mt-1 p-2.5 md:p-3 bg-primary/10 rounded-2xl text-[#163300]"><Phone className="w-5 h-5 md:w-6 md:h-6" /></div>
                  <div className="flex-1 space-y-1.5 md:space-y-2">
                    <p className="text-[10px] md:text-[11px] font-black text-[#163300]/60 uppercase tracking-widest">휴대전화</p>
                    {isEditing ? (
                      <Input value={formData?.phoneNumber || ""} onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })} className="bg-[#F5F6F7] border-none rounded-xl h-11 md:h-12 px-4 font-bold text-[#163300] shadow-inner" />
                    ) : (
                      <p className="font-black text-[#163300] text-lg md:text-xl">{profile.phoneNumber}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {isEditing && (
              <div className="pt-6 md:hidden">
                <Button 
                  onClick={handleSave}
                  disabled={isSaving || usernameStatus === "duplicate" || usernameStatus === "checking"}
                  className="w-full h-14 naver-button text-[#163300] font-black rounded-2xl gap-2 shadow-xl"
                >
                  {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                  수정 완료 및 저장
                </Button>
                <Button 
                  onClick={() => { setIsEditing(false); setFormData({ ...profile }); }}
                  variant="ghost" 
                  className="w-full h-12 mt-3 text-red-500 font-bold"
                >
                  취소하기
                </Button>
              </div>
            )}

            {!isEditing && (
              <div className="pt-10 md:pt-12 border-t border-[#163300]/5">
                <div className="bg-[#163300] p-8 md:p-10 rounded-[2.5rem] md:rounded-[3rem] text-center space-y-6 shadow-2xl relative overflow-hidden">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(205,236,177,0.1),transparent)]"></div>
                  <h4 className="font-black text-primary flex items-center justify-center gap-2 md:gap-3 text-base md:text-lg relative z-10">
                    <Sparkles className="w-5 h-5 md:w-6 md:h-6" />
                    전문가 활동 인텔리전스
                  </h4>
                  <div className="flex flex-col md:flex-row justify-center gap-4 md:gap-6 relative z-10">
                    <div className="px-6 md:px-8 py-5 md:py-6 bg-white/5 backdrop-blur-md rounded-2xl md:rounded-[2rem] flex-1 border border-white/10 shadow-xl">
                      <p className="text-[9px] md:text-[10px] font-black text-primary/30 uppercase mb-1 md:mb-2 tracking-widest">인사이트 영향력</p>
                      <p className="text-2xl md:text-3xl font-black text-primary tracking-tighter">TOP {influenceRank}%</p>
                    </div>
                    <div className="px-6 md:px-8 py-5 md:py-6 bg-white/5 backdrop-blur-md rounded-2xl md:rounded-[2rem] flex-1 border border-white/10 shadow-xl">
                      <p className="text-[9px] md:text-[10px] font-black text-primary/30 uppercase mb-1 md:mb-2 tracking-widest">전문 기여 레벨</p>
                      <p className="text-2xl md:text-3xl font-black text-primary tracking-tighter">LV. {level}</p>
                    </div>
                    <div className="px-6 md:px-8 py-5 md:py-6 bg-white/5 backdrop-blur-md rounded-2xl md:rounded-[2rem] flex-1 border border-white/10 shadow-xl">
                      <p className="text-[9px] md:text-[10px] font-black text-primary/30 uppercase mb-1 md:mb-2 tracking-widest">누적 활동량</p>
                      <p className="text-2xl md:text-3xl font-black text-primary tracking-tighter">{postCount + answerCount}건</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {isAdmin && !isEditing && (
          <div className="animate-in fade-in slide-in-from-bottom-6 duration-1000">
            <Link href="/admin">
              <Button className="w-full h-20 md:h-24 bg-white text-[#163300] hover:bg-primary/5 rounded-[2rem] md:rounded-[2.5rem] shadow-2xl flex items-center justify-between px-8 md:px-12 group transition-all border-4 border-primary/20">
                <div className="flex items-center gap-4 md:gap-6">
                  <div className="p-3 md:p-4 bg-primary/10 rounded-xl md:rounded-2xl text-[#163300] group-hover:scale-110 transition-transform">
                    <Settings className="w-6 h-6 md:w-8 md:h-8" />
                  </div>
                  <div className="text-left">
                    <p className="text-[9px] md:text-[11px] font-black uppercase tracking-[0.2em] md:tracking-[0.3em] opacity-40">System Command Center</p>
                    <p className="text-xl md:text-2xl font-black tracking-tighter">통합 관리 센터 접속</p>
                  </div>
                </div>
                <ArrowRight className="w-6 h-6 md:w-8 md:h-8 group-hover:translate-x-3 transition-transform text-primary" />
              </Button>
            </Link>
          </div>
        )}
      </main>
    </div>
  )
}
