
"use client"

import { useState, useEffect, useRef } from "react"
import { useUser, useDoc, useMemoFirebase, useFirestore, useCollection, updateDocumentNonBlocking } from "@/firebase"
import { doc, collection, query, where } from "firebase/firestore"
import { Header } from "@/components/chuchot/Header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AvatarIcon } from "@/components/chuchot/AvatarIcon"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Building2, User as UserIcon, Phone, Briefcase, Calendar, Sparkles, Settings, ArrowRight, Edit3, Camera, Save, X, Trash2 } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"

export default function ProfilePage() {
  const { user, isUserLoading } = useUser()
  const db = useFirestore()
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormState] = useState<any>(null)
  const [isSaving, setIsSaving] = useState(false)

  const userDocRef = useMemoFirebase(() => (user && db) ? doc(db, "users", user.uid) : null, [user, db])
  const { data: profile, isLoading: isProfileLoading } = useDoc<any>(userDocRef)

  // 활동 지수 계산을 위한 데이터 조회
  const myQuestionsQuery = useMemoFirebase(() => 
    (user && db) ? query(collection(db, "questions"), where("userId", "==", user.uid)) : null, 
    [user, db]
  )
  const myAnswersQuery = useMemoFirebase(() => 
    (user && db) ? query(collection(db, "messages"), where("senderId", "==", user.uid)) : null, // 실제로는 answers 컬렉션 조회가 필요하나 현재 구조상 messages/answers 혼용 확인 필요. 여기선 통계용으로 questions의 answers 서브컬렉션 대신 전역 검색 가능하도록 설계 가정
    [user, db]
  )
  
  const { data: questions } = useCollection(myQuestionsQuery)
  // 답변 수 조회를 위해 간단히 questions 내의 answerCount 합산 또는 별도 조회 로직 (MVP이므로 질문 수 + 추정치로 우선 표시)
  const postCount = questions?.length || 0
  const answerCount = questions?.reduce((acc, q) => acc + (q.answerCount || 0), 0) || 0

  useEffect(() => {
    if (profile && !formData) {
      setFormState({ ...profile })
    }
  }, [profile, formData])

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

  // 활동 지수 산출 로직
  const points = (postCount * 10) + (answerCount * 5)
  const level = Math.floor(points / 20) + 1
  const influenceRank = Math.max(1, 100 - Math.floor(points / 5))

  const handleSave = async () => {
    if (!user || !db) return
    setIsSaving(true)
    try {
      updateDocumentNonBlocking(doc(db, "users", user.uid), formData)
      toast({ title: "저장 완료", description: "프로필 정보가 성공적으로 수정되었습니다." })
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
        setFormState({ ...formData, profilePictureUrl: reader.result as string })
      }
      reader.readAsDataURL(file)
    }
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <Header />
      <main className="max-w-3xl mx-auto px-4 py-12 md:py-20 pb-32">
        <div className="mb-10 flex flex-col items-center text-center">
          <div className="h-1.5 w-16 bg-accent rounded-full mb-4"></div>
          <h1 className="text-3xl font-black text-primary tracking-tighter">
            {isEditing ? "프로필 수정" : "마이 프로필"}
          </h1>
          <p className="text-sm font-bold text-primary/30 mt-1 uppercase tracking-widest">
            {isEditing ? "Update Your Expert Identity" : "Expert Intelligence Identity"}
          </p>
        </div>

        <Card className="border-none shadow-2xl rounded-[3rem] overflow-hidden bg-white mb-10">
          <div className="h-3 w-full gold-gradient"></div>
          
          <div className="absolute top-8 right-8 z-20">
            {!isEditing ? (
              <Button 
                onClick={() => setIsEditing(true)}
                variant="ghost" 
                className="rounded-full bg-primary/5 hover:bg-accent hover:text-primary text-primary/40 font-black gap-2 h-12 px-6"
              >
                <Edit3 className="w-4 h-4" /> 프로필 수정
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button 
                  onClick={() => { setIsEditing(false); setFormState({ ...profile }); }}
                  variant="ghost" 
                  className="rounded-full bg-red-50 text-red-500 hover:bg-red-100 font-black h-12 w-12 p-0"
                >
                  <X className="w-5 h-5" />
                </Button>
                <Button 
                  onClick={handleSave}
                  disabled={isSaving}
                  className="rounded-full bg-primary text-accent font-black gap-2 h-12 px-8 shadow-lg"
                >
                  <Save className="w-4 h-4" /> 저장하기
                </Button>
              </div>
            )}
          </div>

          <CardHeader className="flex flex-col items-center pt-12 pb-8">
            <div className="relative mb-6 group">
              <div className="absolute inset-0 bg-accent blur-2xl opacity-20 group-hover:opacity-40 transition-opacity"></div>
              <div className="relative">
                <AvatarIcon 
                  src={isEditing ? formData?.profilePictureUrl : profile.profilePictureUrl} 
                  seed={profile.username} 
                  className="w-32 h-32 md:w-40 md:h-40 relative border-4 border-white shadow-xl" 
                />
                {isEditing && (
                  <div className="absolute inset-0 bg-black/40 rounded-full flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                    <Camera className="w-8 h-8 text-white mb-1" />
                    <span className="text-[10px] text-white font-black">변경하기</span>
                  </div>
                )}
              </div>
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageChange} />
              
              {!isEditing && (
                <Badge className="absolute -bottom-2 right-2 bg-primary text-accent font-black border-none px-4 py-1.5 rounded-xl shadow-lg">
                  {profile.role?.toUpperCase()}
                </Badge>
              )}
            </div>
            
            {isEditing ? (
              <div className="w-full max-w-xs space-y-2 text-center">
                <Label className="text-[10px] font-black text-primary/30 uppercase">닉네임</Label>
                <Input 
                  value={formData?.username || ""} 
                  onChange={(e) => setFormState({ ...formData, username: e.target.value })}
                  className="text-center bg-primary/5 border-none rounded-xl font-black text-xl h-12" 
                />
              </div>
            ) : (
              <>
                <CardTitle className="text-3xl font-black text-primary tracking-tighter">@{profile.username}</CardTitle>
                <p className="text-primary/40 font-bold mt-1">{profile.email}</p>
              </>
            )}
          </CardHeader>
          
          <CardContent className="px-8 md:px-12 pb-16 space-y-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-primary/5 rounded-2xl">
                    <UserIcon className="w-5 h-5 text-accent" />
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] font-black text-primary/30 uppercase tracking-widest">성함</p>
                    {isEditing ? (
                      <Input 
                        value={formData?.name || ""} 
                        onChange={(e) => setFormState({ ...formData, name: e.target.value })}
                        className="bg-transparent border-b border-primary/10 rounded-none h-8 px-0 focus-visible:ring-0" 
                      />
                    ) : (
                      <p className="font-black text-primary">{profile.name}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="p-3 bg-primary/5 rounded-2xl">
                    <Building2 className="w-5 h-5 text-accent" />
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] font-black text-primary/30 uppercase tracking-widest">소속 및 부서</p>
                    {isEditing ? (
                      <div className="flex gap-2">
                        <Input 
                          placeholder="회사"
                          value={formData?.company || ""} 
                          onChange={(e) => setFormState({ ...formData, company: e.target.value })}
                          className="bg-transparent border-b border-primary/10 rounded-none h-8 px-0 focus-visible:ring-0" 
                        />
                        <Input 
                          placeholder="부서"
                          value={formData?.department || ""} 
                          onChange={(e) => setFormState({ ...formData, department: e.target.value })}
                          className="bg-transparent border-b border-primary/10 rounded-none h-8 px-0 focus-visible:ring-0" 
                        />
                      </div>
                    ) : (
                      <p className="font-black text-primary">{profile.company} ({profile.department})</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="p-3 bg-primary/5 rounded-2xl">
                    <Briefcase className="w-5 h-5 text-accent" />
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] font-black text-primary/30 uppercase tracking-widest">직함</p>
                    {isEditing ? (
                      <Input 
                        value={formData?.jobTitle || ""} 
                        onChange={(e) => setFormState({ ...formData, jobTitle: e.target.value })}
                        className="bg-transparent border-b border-primary/10 rounded-none h-8 px-0 focus-visible:ring-0" 
                      />
                    ) : (
                      <p className="font-black text-primary">{profile.jobTitle}</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-primary/5 rounded-2xl">
                    <Phone className="w-5 h-5 text-accent" />
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] font-black text-primary/30 uppercase tracking-widest">휴대전화</p>
                    {isEditing ? (
                      <Input 
                        value={formData?.phoneNumber || ""} 
                        onChange={(e) => setFormState({ ...formData, phoneNumber: e.target.value })}
                        className="bg-transparent border-b border-primary/10 rounded-none h-8 px-0 focus-visible:ring-0" 
                      />
                    ) : (
                      <p className="font-black text-primary">{profile.phoneNumber}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="p-3 bg-primary/5 rounded-2xl">
                    <Edit3 className="w-5 h-5 text-accent" />
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] font-black text-primary/30 uppercase tracking-widest">이메일</p>
                    {isEditing ? (
                      <Input 
                        type="email"
                        value={formData?.email || ""} 
                        onChange={(e) => setFormState({ ...formData, email: e.target.value })}
                        className="bg-transparent border-b border-primary/10 rounded-none h-8 px-0 focus-visible:ring-0" 
                      />
                    ) : (
                      <p className="font-black text-primary">{profile.email}</p>
                    )}
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

            {!isEditing && (
              <div className="pt-8 border-t border-primary/5">
                <div className="bg-primary/5 p-8 rounded-[2.5rem] text-center space-y-4">
                  <h4 className="font-black text-primary flex items-center justify-center gap-2">
                    <Sparkles className="w-4 h-4 text-accent" />
                    전문가 활동 지수
                  </h4>
                  <p className="text-[10px] text-primary/30 font-bold mb-4">속삭임(게시글) 및 답변 활동을 기반으로 산출됩니다.</p>
                  <div className="flex flex-wrap justify-center gap-4">
                    <div className="px-6 py-4 bg-white rounded-2xl shadow-sm flex-1 min-w-[140px] border border-primary/5">
                      <p className="text-[10px] font-black text-primary/30 uppercase">영향력</p>
                      <p className="text-xl font-black text-accent">TOP {influenceRank}%</p>
                    </div>
                    <div className="px-6 py-4 bg-white rounded-2xl shadow-sm flex-1 min-w-[140px] border border-primary/5">
                      <p className="text-[10px] font-black text-primary/30 uppercase">기여도</p>
                      <p className="text-xl font-black text-primary">LEVEL {level}</p>
                    </div>
                    <div className="px-6 py-4 bg-white rounded-2xl shadow-sm flex-1 min-w-[140px] border border-primary/5">
                      <p className="text-[10px] font-black text-primary/30 uppercase">활동량</p>
                      <p className="text-xl font-black text-primary">{postCount + answerCount}건</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {isAdmin && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-1000">
            <Link href="/admin">
              <Button className="w-full h-20 bg-primary text-accent hover:bg-primary/95 rounded-[2rem] shadow-2xl flex items-center justify-between px-10 group transition-all border border-accent/20">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-white/10 rounded-2xl group-hover:scale-110 transition-transform shadow-inner">
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
