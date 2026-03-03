
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
import { Building2, User as UserIcon, Phone, Briefcase, Sparkles, Settings, ArrowRight, Edit3, Camera, Save, X, Tag, Info, CheckCircle2, Loader2 } from "lucide-react"
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

  const handleSave = async () => {
    if (!user || !db || !formData) return
    if (usernameStatus === "duplicate") {
      toast({ title: "닉네임 중복", description: "이미 사용 중인 닉네임입니다.", variant: "destructive" })
      return
    }

    setIsSaving(true)
    try {
      updateDocumentNonBlocking(doc(db, "users", user.uid), {
        ...formData,
        username: formData.username.trim()
      })
      toast({ title: "저장 완료", description: "전문가 프로필 정보가 업데이트되었습니다." })
      setIsEditing(false)
    } catch (error) {
      toast({ title: "오류 발생", variant: "destructive" })
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
          <h1 className="text-3xl md:text-4xl font-black text-[#163300] tracking-tighter">
            {isEditing ? "프로필 수정" : "마이 프로필"}
          </h1>
          <p className="text-[10px] md:text-sm font-bold text-accent/40 mt-2 uppercase tracking-[0.2em]">Expert Identity</p>
        </div>

        <Card className="border-none shadow-3xl rounded-[2.5rem] md:rounded-[3.5rem] overflow-hidden bg-white mb-12 relative">
          <div className="h-3 w-full gold-gradient"></div>
          
          <div className="absolute top-10 right-10 z-20 hidden md:block">
            {!isEditing ? (
              <Button onClick={() => setIsEditing(true)} className="naver-button text-[#163300] font-black gap-2 h-14 px-8 shadow-xl">
                <Edit3 className="w-5 h-5" /> 정보 수정하기
              </Button>
            ) : (
              <div className="flex gap-3">
                <Button onClick={() => { setIsEditing(false); setFormData({ ...profile }); }} variant="ghost" className="bg-red-50 text-red-500 font-black h-14 px-6">취소</Button>
                <Button onClick={handleSave} disabled={isSaving || usernameStatus === "duplicate"} className="naver-button text-[#163300] font-black gap-2 h-14 px-10 shadow-2xl">
                  {isSaving ? <Loader2 className="animate-spin w-5 h-5" /> : <Save className="w-5 h-5" />} 수정 완료
                </Button>
              </div>
            )}
          </div>

          <CardHeader className="flex flex-col items-center pt-12 md:pt-16 pb-8">
            <div className="relative mb-4 group cursor-pointer" onClick={() => isEditing && fileInputRef.current?.click()}>
              <AvatarIcon src={isEditing ? formData?.profilePictureUrl : profile.profilePictureUrl} seed={profile.username} className="w-32 h-32 md:w-48 md:h-48 relative border-4 border-white shadow-2xl" />
              {isEditing && (
                <div className="absolute inset-0 bg-black/40 rounded-full flex flex-col items-center justify-center border-4 border-white">
                  <Camera className="w-8 h-8 text-white mb-1" />
                  <span className="text-[9px] text-white font-black">사진 변경</span>
                </div>
              )}
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageChange} />
            </div>
            {isEditing && <p className="text-[10px] font-black text-[#163300]/40 uppercase mb-6 flex items-center gap-1.5"><Info className="w-3 h-3" /> 권장 사이즈: 400x400px</p>}
            
            {isEditing ? (
              <div className="w-full max-w-xs space-y-2">
                <Input value={formData?.username || ""} onChange={(e) => setFormData({ ...formData, username: e.target.value })} className="text-center bg-[#F5F6F7] border-none rounded-2xl font-black text-xl h-14 shadow-inner" />
                {usernameStatus === "duplicate" && <p className="text-xs font-bold text-red-500 text-center">이미 사용 중인 닉네임입니다.</p>}
              </div>
            ) : (
              <div className="text-center">
                <CardTitle className="text-3xl font-black text-[#163300]">@{profile.username}</CardTitle>
                <p className="text-[#163300]/60 font-bold mt-1">{profile.email}</p>
              </div>
            )}
          </CardHeader>
          
          <CardContent className="px-6 md:px-20 pb-12 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {[
                { label: "성함 (실명)", key: "name", icon: UserIcon },
                { label: "소속 회사", key: "company", icon: Building2 },
                { label: "소속 부서", key: "department", icon: Tag },
                { label: "직함 (Title)", key: "jobTitle", icon: Briefcase },
                { label: "직무 (Role)", key: "jobRole", icon: Sparkles },
                { label: "휴대전화", key: "phoneNumber", icon: Phone }
              ].map((item) => (
                <div key={item.key} className="space-y-2">
                  <Label className="text-[10px] font-black text-[#163300]/40 uppercase tracking-widest flex items-center gap-2">
                    <item.icon className="w-3 h-3" /> {item.label}
                  </Label>
                  {isEditing ? (
                    <Input value={formData?.[item.key] || ""} onChange={(e) => setFormData({ ...formData, [item.key]: e.target.value })} className="bg-[#F5F6F7] border-none rounded-xl h-12 px-4 font-bold text-[#163300]" />
                  ) : (
                    <p className="font-black text-[#163300] text-lg px-1">{profile[item.key] || "미설정"}</p>
                  )}
                </div>
              ))}
            </div>

            {isEditing && (
              <div className="pt-6 md:hidden">
                <Button onClick={handleSave} disabled={isSaving || usernameStatus === "duplicate"} className="w-full h-14 naver-button text-[#163300] font-black rounded-2xl">수정 완료</Button>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
