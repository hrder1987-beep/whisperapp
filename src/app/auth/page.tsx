
"use client"

import { useState, Suspense, useRef, useEffect } from "react"
import { Header } from "@/components/chuchot/Header"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { useAuth, useFirestore, useUser } from "@/firebase"
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth"
import { doc, setDoc, collection, query, where, getDocs } from "firebase/firestore"
import { useRouter, useSearchParams } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { LogIn, UserPlus, Camera, X, Sparkles, Info, Search, KeyRound } from "lucide-react"
import { sendWelcomeEmail } from "@/ai/flows/send-welcome-email-flow"

/**
 * Firebase 인증 에러 코드를 친절한 한국어 메시지로 변환합니다.
 */
const getAuthErrorMessage = (code: string) => {
  switch (code) {
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return '이메일 또는 비밀번호가 일치하지 않습니다.';
    case 'auth/email-already-in-use':
      return '이미 사용 중인 이메일 주소입니다.';
    case 'auth/invalid-email':
      return '유효하지 않은 이메일 형식입니다.';
    case 'auth/weak-password':
      return '비밀번호가 너무 취약합니다. 6자리 이상으로 설정해 주세요.';
    case 'auth/network-request-failed':
      return '네트워크 연결이 원활하지 않습니다. 잠시 후 다시 시도해 주세요.';
    default:
      return '인증 처리 중 알 수 없는 오류가 발생했습니다.';
  }
}

function AuthContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const auth = useAuth()
  const db = useFirestore()
  const { user, isUserLoading } = useUser()
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState(searchParams.get("mode") === "signup" ? "signup" : "login")

  // Form States
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [username, setUsername] = useState("")
  const [name, setName] = useState("")
  const [company, setCompany] = useState("")
  const [department, setDepartment] = useState("")
  const [jobRole, setJobRole] = useState("") // 직무
  const [jobTitle, setJobTitle] = useState("") // 직함
  const [phone, setPhone] = useState("")
  const [profilePicture, setProfilePicture] = useState<string | null>(null)

  // Recovery States
  const [recoveryMode, setRecoveryMode] = useState<null | "id" | "password">(null)
  const [findName, setFindName] = useState("")
  const [findPhone, setFindPhone] = useState("")
  const [foundEmail, setFoundEmail] = useState<string | null>(null)
  const [resetEmail, setResetEmail] = useState("")

  useEffect(() => {
    if (user && !isUserLoading) {
      router.push("/")
    }
    // 시스템 언어를 한국어로 설정하여 발송되는 메일을 한글화합니다.
    if (auth) {
      auth.languageCode = "ko"
    }
  }, [user, isUserLoading, router, auth])

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setProfilePicture(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      await signInWithEmailAndPassword(auth, email, password)
      toast({ title: "환영합니다!", description: "Whisper에 로그인했습니다." })
      router.push("/")
    } catch (error: any) {
      toast({ 
        title: "로그인 실패", 
        description: getAuthErrorMessage(error.code), 
        variant: "destructive" 
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      const newUser = userCredential.user

      await setDoc(doc(db, "users", newUser.uid), {
        id: newUser.uid,
        username,
        email,
        name,
        company,
        department,
        jobRole, // 추가된 직무
        jobTitle, // 분리된 직함
        phoneNumber: phone,
        role: "member",
        registrationDate: new Date().toISOString(),
        profilePictureUrl: profilePicture || null
      })

      sendWelcomeEmail({ name, email }).catch(err => console.error("Welcome email failed:", err));

      toast({ 
        title: "가입 완료!", 
        description: "Whisper의 일원이 되신 것을 환영합니다. 가입 환영 메일이 전송되었습니다!" 
      })
      router.push("/")
    } catch (error: any) {
      toast({ 
        title: "가입 실패", 
        description: getAuthErrorMessage(error.code), 
        variant: "destructive" 
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleFindId = async () => {
    if (!findName || !findPhone) return
    setIsLoading(true)
    try {
      const usersRef = collection(db, "users")
      const q = query(usersRef, where("name", "==", findName), where("phoneNumber", "==", findPhone))
      const querySnapshot = await getDocs(q)
      
      if (querySnapshot.empty) {
        toast({ title: "정보 없음", description: "일치하는 회원 정보를 찾을 수 없습니다.", variant: "destructive" })
        setFoundEmail(null)
      } else {
        const userData = querySnapshot.docs[0].data()
        const fullEmail = userData.email
        const [idPart, domain] = fullEmail.split('@')
        const maskedId = idPart.substring(0, 2) + '*'.repeat(idPart.length - 2)
        setFoundEmail(`${maskedId}@${domain}`)
      }
    } catch (err) {
      toast({ title: "오류 발생", description: "정보 조회 중 문제가 발생했습니다.", variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }

  const handleResetPassword = async () => {
    if (!resetEmail) return
    setIsLoading(true)
    try {
      // 명시적으로 한국어 설정 적용 후 메일 발송
      auth.languageCode = "ko"
      await sendPasswordResetEmail(auth, resetEmail)
      toast({ title: "메일 발송 완료", description: "입력하신 이메일로 비밀번호 재설정 링크를 보냈습니다." })
      setRecoveryMode(null)
    } catch (error: any) {
      toast({ 
        title: "발송 실패", 
        description: error.code === 'auth/user-not-found' ? "가입되지 않은 이메일 주소입니다." : "메일 발송 중 오류가 발생했습니다.", 
        variant: "destructive" 
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (isUserLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-40 gap-4">
        <Sparkles className="w-12 h-12 animate-spin text-accent" />
        <p className="text-accent/40 font-black animate-pulse">인증 상태 확인 중...</p>
      </div>
    )
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-12 md:py-20">
      <Card className="border-accent/5 shadow-2xl rounded-[3rem] overflow-hidden bg-white">
        <div className="h-2 w-full gold-gradient"></div>
        <CardHeader className="text-center pt-12 pb-8">
          <CardTitle className="text-3xl md:text-4xl font-black text-accent tracking-tighter">Whisper Intelligence</CardTitle>
          <CardDescription className="font-bold text-accent/60 mt-2">대한민국 HR 전문가들의 집단지성 허브</CardDescription>
        </CardHeader>
        <CardContent className="px-8 md:px-12 pb-12">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-accent/5 p-1.5 rounded-2xl mb-10">
              <TabsTrigger value="login" className="rounded-xl font-black text-sm py-3 data-[state=active]:bg-white data-[state=active]:text-accent data-[state=active]:shadow-sm data-[state=inactive]:text-accent/40">로그인</TabsTrigger>
              <TabsTrigger value="signup" className="rounded-xl font-black text-sm py-3 data-[state=active]:bg-white data-[state=active]:text-accent data-[state=active]:shadow-sm data-[state=inactive]:text-accent/40">회원가입</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-xs font-black text-accent/60 ml-1">이메일 (ID)</Label>
                  <Input type="email" placeholder="example@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required className="h-14 bg-accent/[0.03] border-accent/10 focus:border-primary rounded-xl px-5 font-bold text-accent" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-black text-accent/60 ml-1">비밀번호</Label>
                  <Input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required className="h-14 bg-accent/[0.03] border-accent/10 focus:border-primary rounded-xl px-5 font-bold text-accent" />
                </div>
                <Button type="submit" disabled={isLoading} className="w-full h-14 bg-primary text-accent font-black rounded-xl mt-4 hover:brightness-105 shadow-xl text-base transition-all active:scale-95">
                  {isLoading ? "처리 중..." : "위스퍼 시작하기"}
                  <LogIn className="w-5 h-5 ml-2" />
                </Button>
                
                <div className="flex items-center justify-center gap-6 mt-8">
                  <button type="button" onClick={() => setRecoveryMode("id")} className="text-[12px] font-bold text-accent/60 hover:text-accent transition-colors">아이디 찾기</button>
                  <div className="w-px h-3 bg-accent/10"></div>
                  <button type="button" onClick={() => setRecoveryMode("password")} className="text-[12px] font-bold text-accent/60 hover:text-accent transition-colors">비밀번호 재설정</button>
                </div>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignup} className="space-y-5">
                <div className="flex flex-col items-center mb-8">
                  <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                    <div className="w-28 h-24 rounded-3xl bg-accent/[0.03] border-2 border-dashed border-accent/10 flex items-center justify-center overflow-hidden transition-all group-hover:border-primary shadow-inner">
                      {profilePicture ? (
                        <img src={profilePicture} alt="preview" className="w-full h-full object-cover" />
                      ) : (
                        <Camera className="w-10 h-10 text-accent/10 group-hover:text-primary transition-colors" />
                      )}
                    </div>
                    {profilePicture && (
                      <button 
                        type="button" 
                        onClick={(e) => { e.stopPropagation(); setProfilePicture(null); }}
                        className="absolute -top-2 -right-2 bg-red-500 text-white p-1.5 rounded-full shadow-lg"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <span className="text-[11px] font-black text-accent/40 mt-3 uppercase tracking-widest">프로필 사진 등록 (선택)</span>
                  <input type="file" ref={fileInputRef} onChange={handleImageChange} accept="image/*" className="hidden" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-black text-accent/60 ml-1">닉네임</Label>
                    <Input placeholder="사용할 닉네임" value={username} onChange={(e) => setUsername(e.target.value)} required className="h-12 bg-accent/[0.03] border-accent/10 rounded-xl px-4 font-bold text-accent" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-black text-accent/60 ml-1">성함</Label>
                    <Input placeholder="실명" value={name} onChange={(e) => setName(e.target.value)} required className="h-12 bg-accent/[0.03] border-accent/10 rounded-xl px-4 font-bold text-accent" />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-xs font-black text-accent/60 ml-1">이메일 (ID로 사용됨)</Label>
                  <Input type="email" placeholder="example@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required className="h-12 bg-accent/[0.03] border-accent/10 rounded-xl px-4 font-bold text-accent" />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-black text-accent/60 ml-1">비밀번호</Label>
                  <Input type="password" placeholder="6자리 이상 입력" value={password} onChange={(e) => setPassword(e.target.value)} required className="h-12 bg-accent/[0.03] border-accent/10 rounded-xl px-4 font-bold text-accent" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-black text-accent/60 ml-1">소속(회사)</Label>
                    <Input placeholder="회사명" value={company} onChange={(e) => setCompany(e.target.value)} required className="h-12 bg-accent/[0.03] border-accent/10 rounded-xl px-4 font-bold text-accent" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-black text-accent/60 ml-1">부서</Label>
                    <Input placeholder="부서명" value={department} onChange={(e) => setDepartment(e.target.value)} required className="h-12 bg-accent/[0.03] border-accent/10 rounded-xl px-4 font-bold text-accent" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-black text-accent/60 ml-1">직무</Label>
                    <Input placeholder="예: 채용" value={jobRole} onChange={(e) => setJobRole(e.target.value)} required className="h-12 bg-accent/[0.03] border-accent/10 rounded-xl px-4 font-bold text-accent" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-black text-accent/60 ml-1">직함</Label>
                    <Input placeholder="예: 팀장" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} required className="h-12 bg-accent/[0.03] border-accent/10 rounded-xl px-4 font-bold text-accent" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-black text-accent/60 ml-1">휴대전화</Label>
                  <Input placeholder="010-0000-0000" value={phone} onChange={(e) => setPhone(e.target.value)} required className="h-12 bg-accent/[0.03] border-accent/10 rounded-xl px-4 font-bold text-accent" />
                </div>

                <Button type="submit" disabled={isLoading} className="w-full h-14 gold-gradient text-accent font-black rounded-xl mt-6 shadow-xl text-base transition-all active:scale-95">
                  {isLoading ? "처리 중..." : "전문가 등록 완료"}
                  <UserPlus className="w-5 h-5 ml-2" />
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Recovery Dialog */}
      <Dialog open={!!recoveryMode} onOpenChange={() => { setRecoveryMode(null); setFoundEmail(null); }}>
        <DialogContent className="max-w-md bg-white border-none rounded-[2.5rem] p-10 shadow-2xl overflow-hidden">
          <DialogHeader className="text-left">
            <DialogTitle className="text-2xl font-black text-accent flex items-center gap-3">
              {recoveryMode === "id" ? <Search className="w-7 h-7 text-primary" /> : <KeyRound className="w-7 h-7 text-primary" />}
              {recoveryMode === "id" ? "아이디 찾기" : "비밀번호 재설정"}
            </DialogTitle>
            <DialogDescription className="font-bold text-accent/60 mt-1">
              {recoveryMode === "id" 
                ? "가입 시 입력한 정보를 확인하여 아이디를 찾아드립니다." 
                : "등록된 이메일로 비밀번호 재설정 링크를 보내드립니다."}
            </DialogDescription>
          </DialogHeader>

          <div className="py-8 space-y-5">
            {recoveryMode === "id" ? (
              <>
                {foundEmail ? (
                  <div className="bg-primary/10 p-8 rounded-3xl text-center space-y-3">
                    <p className="text-[11px] font-black text-accent/40 uppercase tracking-widest">회원님의 아이디(이메일)입니다</p>
                    <p className="text-2xl font-black text-accent tracking-tight">{foundEmail}</p>
                    <Button variant="outline" onClick={() => { setEmail(foundEmail.replace(/\*/g, '')); setRecoveryMode(null); }} className="mt-6 border-accent/10 text-accent font-black rounded-xl h-11 px-8">로그인하러 가기</Button>
                  </div>
                ) : (
                  <>
                    <div className="space-y-2">
                      <Label className="text-[11px] font-black text-accent/60 uppercase tracking-widest ml-1">성함</Label>
                      <Input placeholder="가입 시 입력한 이름" value={findName} onChange={(e) => setFindName(e.target.value)} className="bg-accent/[0.03] border-accent/10 h-14 rounded-xl font-bold px-5 text-accent" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[11px] font-black text-accent/60 uppercase tracking-widest ml-1">휴대전화 번호</Label>
                      <Input placeholder="010-0000-0000" value={findPhone} onChange={(e) => setFindPhone(e.target.value)} className="bg-accent/[0.03] border-accent/10 h-14 rounded-xl font-bold px-5 text-accent" />
                    </div>
                  </>
                )}
              </>
            ) : (
              <div className="space-y-2">
                <Label className="text-[11px] font-black text-accent/60 uppercase tracking-widest ml-1">가입 이메일</Label>
                <Input placeholder="example@email.com" value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} className="bg-accent/[0.03] border-accent/10 h-14 rounded-xl font-bold px-5 text-accent" />
              </div>
            )}
          </div>

          <DialogFooter>
            {!foundEmail && (
              <Button 
                onClick={recoveryMode === "id" ? handleFindId : handleResetPassword}
                disabled={isLoading}
                className="w-full h-14 bg-accent text-primary font-black rounded-xl shadow-xl text-base hover:scale-[1.02] transition-all"
              >
                {isLoading ? "확인 중..." : recoveryMode === "id" ? "아이디 찾기" : "재설정 메일 발송"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default function AuthPage() {
  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <Header />
      <Suspense fallback={<div className="flex justify-center py-40"><Sparkles className="w-12 h-12 animate-spin text-accent" /></div>}>
        <AuthContent />
      </Suspense>
    </div>
  )
}
