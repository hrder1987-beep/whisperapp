
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
import { LogIn, UserPlus, Camera, X, Sparkles, Search, KeyRound, AlertCircle, CheckCircle2, Loader2 } from "lucide-react"
import { sendWelcomeEmail } from "@/ai/flows/send-welcome-email-flow"
import { cn } from "@/lib/utils"

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

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [username, setUsername] = useState("")
  const [name, setName] = useState("")
  const [company, setCompany] = useState("")
  const [department, setDepartment] = useState("")
  const [jobRole, setJobRole] = useState("") 
  const [jobTitle, setJobTitle] = useState("") 
  const [phone, setPhone] = useState("")
  const [profilePicture, setProfilePicture] = useState<string | null>(null)

  // 닉네임 중복 체크 상태
  const [usernameStatus, setUsernameStatus] = useState<"idle" | "checking" | "available" | "duplicate">("idle")

  const [recoveryMode, setRecoveryMode] = useState<null | "id" | "password">(null)
  const [findName, setFindName] = useState("")
  const [findPhone, setFindPhone] = useState("")
  const [foundEmail, setFoundEmail] = useState<string | null>(null)
  const [resetEmail, setResetEmail] = useState("")

  const [isMounted, setIsMounted] = useState(false)
  useEffect(() => {
    setIsMounted(true)
    if (user && !isUserLoading) router.replace("/")
    if (auth) auth.languageCode = "ko"
  }, [user, isUserLoading, router, auth])

  // 닉네임 중복 실시간 체크 (Debounce 적용)
  useEffect(() => {
    if (activeTab !== "signup" || !username.trim()) {
      setUsernameStatus("idle")
      return
    }

    const checkTimeout = setTimeout(async () => {
      setUsernameStatus("checking")
      try {
        const q = query(collection(db, "users"), where("username", "==", username.trim()))
        const snapshot = await getDocs(q)
        setUsernameStatus(snapshot.empty ? "available" : "duplicate")
      } catch (e) {
        setUsernameStatus("idle")
      }
    }, 500)

    return () => clearTimeout(checkTimeout)
  }, [username, activeTab, db])

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => setProfilePicture(reader.result as string)
      reader.readAsDataURL(file)
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      await signInWithEmailAndPassword(auth, email, password)
      toast({ title: "환영합니다!", description: "Whisper Intelligence에 로그인했습니다." })
      router.push("/")
    } catch (error: any) {
      toast({ title: "로그인 실패", description: getAuthErrorMessage(error.code), variant: "destructive" })
    } finally { setIsLoading(false) }
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (usernameStatus === "duplicate") {
      toast({ title: "닉네임 중복", description: "이미 사용 중인 닉네임입니다.", variant: "destructive" })
      return
    }
    if (usernameStatus === "checking") return;

    setIsLoading(true)
    try {
      // 최종 한 번 더 체크
      const usernameQuery = query(collection(db, "users"), where("username", "==", username.trim()))
      const usernameSnapshot = await getDocs(usernameQuery)
      
      if (!usernameSnapshot.empty) {
        toast({ title: "닉네임 중복", description: "이미 사용 중인 닉네임입니다.", variant: "destructive" })
        setUsernameStatus("duplicate")
        setIsLoading(false)
        return
      }

      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      const newUser = userCredential.user
      await setDoc(doc(db, "users", newUser.uid), {
        id: newUser.uid, 
        username: username.trim(), 
        email, 
        name, 
        company, 
        department, 
        jobRole, 
        jobTitle,
        phoneNumber: phone, 
        role: "member", 
        registrationDate: new Date().toISOString(),
        profilePictureUrl: profilePicture || null
      })
      sendWelcomeEmail({ name, email }).catch(err => {});
      toast({ title: "가입 완료!", description: "Whisper의 일원이 되신 것을 환영합니다." })
      router.push("/")
    } catch (error: any) {
      toast({ title: "가입 실패", description: getAuthErrorMessage(error.code), variant: "destructive" })
    } finally { setIsLoading(false) }
  }

  const handleFindId = async () => {
    if (!findName || !findPhone) return
    setIsLoading(true)
    try {
      const q = query(collection(db, "users"), where("name", "==", findName), where("phoneNumber", "==", findPhone))
      const querySnapshot = await getDocs(q)
      if (querySnapshot.empty) {
        toast({ title: "정보 없음", description: "일치하는 회원 정보를 찾을 수 없습니다.", variant: "destructive" })
        setFoundEmail(null)
      } else {
        const fullEmail = querySnapshot.docs[0].data().email
        const [idPart, domain] = fullEmail.split('@')
        setFoundEmail(`${idPart.substring(0, 2)}***@${domain}`)
      }
    } catch (err) { toast({ title: "오류 발생", variant: "destructive" }) }
    finally { setIsLoading(false) }
  }

  if (!isMounted || isUserLoading) {
    return <div className="flex flex-col items-center justify-center py-48 gap-6"><Sparkles className="w-14 h-14 animate-spin text-accent" /><p className="text-accent/40 font-black text-lg">안전하게 연결 중...</p></div>
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-12 md:py-24">
      <Card className="border-none shadow-3xl rounded-[3.5rem] overflow-hidden bg-white animate-in fade-in zoom-in-95 duration-700">
        <div className="h-3 w-full gold-gradient"></div>
        <CardHeader className="text-center pt-16 pb-12">
          <CardTitle className="text-4xl md:text-6xl font-black text-[#163300] tracking-tighter leading-tight">Whisper Intelligence</CardTitle>
          <CardDescription className="font-bold text-[#163300]/50 mt-4 text-base md:text-lg">대한민국 최고 HR 전문가들의 지식 허브</CardDescription>
        </CardHeader>
        <CardContent className="px-8 md:px-16 pb-16">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-[#F5F6F7] p-1.5 rounded-2xl mb-14 h-16 md:h-18 shadow-inner relative border-none">
              <div className={cn(
                "absolute top-1.5 bottom-1.5 w-[calc(50%-6px)] bg-white rounded-xl shadow-xl transition-all duration-500 ease-in-out",
                activeTab === "signup" ? "translate-x-[calc(100%+6px)]" : "translate-x-0"
              )} />
              <TabsTrigger value="login" className="relative z-10 rounded-xl font-black text-base md:text-lg py-3 transition-all data-[state=active]:text-[#163300] data-[state=inactive]:text-[#163300]/30 hover:text-[#163300]/60 active:scale-95 border-none shadow-none">로그인</TabsTrigger>
              <TabsTrigger value="signup" className="relative z-10 rounded-xl font-black text-base md:text-lg py-3 transition-all data-[state=active]:text-[#163300] data-[state=inactive]:text-[#163300]/30 hover:text-[#163300]/60 active:scale-95 border-none shadow-none">회원가입</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <form onSubmit={handleLogin} className="space-y-8">
                <div className="space-y-3">
                  <Label className="text-[12px] font-black text-[#163300]/80 uppercase tracking-widest ml-1">이메일 계정 (ID)</Label>
                  <Input type="email" placeholder="example@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required className="h-16 bg-[#FBFBFC] border-[#163300]/10 focus:border-primary focus:ring-4 focus:ring-primary/10 rounded-2xl px-6 font-bold text-[#163300] shadow-sm transition-all" />
                </div>
                <div className="space-y-3">
                  <Label className="text-[12px] font-black text-[#163300]/80 uppercase tracking-widest ml-1">비밀번호</Label>
                  <Input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required className="h-16 bg-[#FBFBFC] border-[#163300]/10 focus:border-primary focus:ring-4 focus:ring-primary/10 rounded-2xl px-6 font-bold text-[#163300] shadow-sm transition-all" />
                </div>
                <Button type="submit" disabled={isLoading} className="w-full h-18 bg-[#163300] text-primary font-black rounded-[1.5rem] mt-8 hover:brightness-110 shadow-2xl text-xl transition-all active:scale-[0.97]">
                  {isLoading ? "인증 확인 중..." : "플랫폼 접속하기"}
                  <LogIn className="w-6 h-6 ml-3" />
                </Button>
                <div className="flex items-center justify-center gap-10 mt-12">
                  <button type="button" onClick={() => setRecoveryMode("id")} className="text-[14px] font-black text-[#163300]/60 hover:text-[#163300] transition-colors">아이디 찾기</button>
                  <div className="w-1.5 h-1.5 bg-[#163300]/10 rounded-full"></div>
                  <button type="button" onClick={() => setRecoveryMode("password")} className="text-[14px] font-black text-[#163300]/60 hover:text-[#163300] transition-colors">비밀번호 재설정</button>
                </div>
              </form>
            </TabsContent>

            <TabsContent value="signup" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <form onSubmit={handleSignup} className="space-y-7">
                <div className="flex flex-col items-center mb-12">
                  <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                    <div className="w-36 h-32 rounded-[2.5rem] bg-[#F5F6F7] border-2 border-dashed border-[#163300]/10 flex items-center justify-center overflow-hidden transition-all group-hover:border-primary shadow-inner">
                      {profilePicture ? <img src={profilePicture} alt="preview" className="w-full h-full object-cover" /> : <Camera className="w-14 h-14 text-[#163300]/10 group-hover:text-primary transition-colors" />}
                    </div>
                    {profilePicture && <button type="button" onClick={(e) => { e.stopPropagation(); setProfilePicture(null); }} className="absolute -top-3 -right-3 bg-red-500 text-white p-2.5 rounded-full shadow-2xl hover:scale-110 transition-transform"><X className="w-5 h-5" /></button>}
                  </div>
                  <span className="text-[12px] font-black text-[#163300]/40 mt-5 uppercase tracking-widest">전문가 프로필 사진 (선택)</span>
                  <input type="file" ref={fileInputRef} onChange={handleImageChange} accept="image/*" className="hidden" />
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2.5">
                    <Label className="text-[11px] font-black text-[#163300]/80 uppercase ml-1">닉네임 (중복불가)</Label>
                    <div className="relative">
                      <Input 
                        placeholder="사용자명" 
                        value={username} 
                        onChange={(e) => setUsername(e.target.value)} 
                        required 
                        className={cn(
                          "h-14 bg-[#FBFBFC] border-[#163300]/10 rounded-2xl px-6 font-bold text-[#163300] shadow-sm transition-all",
                          usernameStatus === "duplicate" && "border-red-500 ring-2 ring-red-100",
                          usernameStatus === "available" && "border-emerald-500 ring-2 ring-emerald-100"
                        )} 
                      />
                      {usernameStatus === "checking" && <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary animate-spin" />}
                    </div>
                    {usernameStatus === "duplicate" && <p className="text-[10px] font-bold text-red-500 ml-2 animate-in fade-in slide-in-from-top-1">이미 사용 중인 닉네임입니다.</p>}
                    {usernameStatus === "available" && <p className="text-[10px] font-bold text-emerald-600 ml-2 flex items-center gap-1 animate-in fade-in slide-in-from-top-1"><CheckCircle2 className="w-3 h-3" /> 사용 가능한 닉네임입니다.</p>}
                  </div>
                  <div className="space-y-2.5">
                    <Label className="text-[11px] font-black text-[#163300]/80 uppercase ml-1">성함 (실명)</Label>
                    <Input placeholder="실명" value={name} onChange={(e) => setName(e.target.value)} required className="h-14 bg-[#FBFBFC] border-[#163300]/10 rounded-2xl px-6 font-bold text-[#163300] shadow-sm" />
                  </div>
                </div>
                <div className="space-y-2.5"><Label className="text-[11px] font-black text-[#163300]/80 uppercase ml-1">이메일 (ID)</Label><Input type="email" placeholder="example@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required className="h-14 bg-[#FBFBFC] border-[#163300]/10 rounded-2xl px-6 font-bold text-[#163300] shadow-sm" /></div>
                <div className="space-y-2.5"><Label className="text-[11px] font-black text-[#163300]/80 uppercase ml-1">비밀번호</Label><Input type="password" placeholder="6자리 이상" value={password} onChange={(e) => setPassword(e.target.value)} required className="h-14 bg-[#FBFBFC] border-[#163300]/10 rounded-2xl px-6 font-bold text-[#163300] shadow-sm" /></div>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2.5"><Label className="text-[11px] font-black text-[#163300]/80 uppercase ml-1">소속 회사</Label><Input placeholder="회사명" value={company} onChange={(e) => setCompany(e.target.value)} required className="h-14 bg-[#FBFBFC] border-[#163300]/10 rounded-2xl px-6 font-bold text-[#163300] shadow-sm" /></div>
                  <div className="space-y-2.5"><Label className="text-[11px] font-black text-[#163300]/80 uppercase ml-1">부서</Label><Input placeholder="부서명" value={department} onChange={(e) => setDepartment(e.target.value)} required className="h-14 bg-[#FBFBFC] border-[#163300]/10 rounded-2xl px-6 font-bold text-[#163300] shadow-sm" /></div>
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2.5"><Label className="text-[11px] font-black text-[#163300]/80 uppercase ml-1">직무 (Role)</Label><Input placeholder="예: 채용" value={jobRole} onChange={(e) => setJobRole(e.target.value)} required className="h-14 bg-[#FBFBFC] border-[#163300]/10 rounded-2xl px-6 font-bold text-[#163300] shadow-sm" /></div>
                  <div className="space-y-2.5"><Label className="text-[11px] font-black text-[#163300]/80 uppercase ml-1">직함 (Title)</Label><Input placeholder="예: 팀장" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} required className="h-14 bg-[#FBFBFC] border-[#163300]/10 rounded-2xl px-6 font-bold text-[#163300] shadow-sm" /></div>
                </div>
                <div className="space-y-2.5"><Label className="text-[11px] font-black text-[#163300]/80 uppercase ml-1">휴대전화</Label><Input placeholder="010-0000-0000" value={phone} onChange={(e) => setPhone(e.target.value)} required className="h-14 bg-[#FBFBFC] border-[#163300]/10 rounded-2xl px-6 font-bold text-[#163300] shadow-sm" /></div>
                
                <Button type="submit" disabled={isLoading || usernameStatus !== "available"} className="w-full h-18 gold-gradient text-[#163300] font-black rounded-[1.5rem] mt-10 shadow-3xl text-xl hover:scale-[1.01] transition-all active:scale-[0.97]">
                  {isLoading ? "전문가 등록 처리 중..." : "전문가 등록 완료"}
                  <UserPlus className="w-6 h-6 ml-3" />
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Dialog open={!!recoveryMode} onOpenChange={() => { setRecoveryMode(null); setFoundEmail(null); }}>
        <DialogContent className="max-w-md bg-white border-none rounded-[3.5rem] p-12 shadow-4xl overflow-hidden">
          <DialogHeader className="text-left">
            <DialogTitle className="text-3xl font-black text-[#163300] flex items-center gap-4">{recoveryMode === "id" ? <Search className="w-8 h-8 text-primary" /> : <KeyRound className="w-8 h-8 text-primary" />}{recoveryMode === "id" ? "아이디 찾기" : "비밀번호 재설정"}</DialogTitle>
            <DialogDescription className="font-bold text-[#163300]/60 mt-3">{recoveryMode === "id" ? "가입 시 등록하신 실명과 번호를 확인합니다." : "등록된 이메일로 안전한 재설정 링크를 보내드립니다."}</DialogDescription>
          </DialogHeader>
          <div className="py-10 space-y-8">
            {recoveryMode === "id" ? (
              <>{foundEmail ? <div className="bg-primary/5 p-12 rounded-[3rem] text-center space-y-5 shadow-inner border border-primary/10"><p className="text-[12px] font-black text-[#163300]/40 uppercase tracking-widest">인증된 아이디입니다</p><p className="text-3xl font-black text-[#163300] tracking-tight">{foundEmail}</p><Button onClick={() => setRecoveryMode(null)} className="mt-10 naver-button h-14 px-12 rounded-2xl shadow-xl">로그인하러 가기</Button></div> : <><div className="space-y-3"><Label className="text-[12px] font-black text-[#163300]/60 uppercase ml-1">가입자 실명</Label><Input placeholder="이름 입력" value={findName} onChange={(e) => setFindName(e.target.value)} className="bg-[#FBFBFC] border-none h-16 rounded-2xl font-bold px-6 text-[#163300] shadow-inner" /></div><div className="space-y-3"><Label className="text-[12px] font-black text-[#163300]/60 uppercase ml-1">휴대전화 번호</Label><Input placeholder="010-0000-0000" value={findPhone} onChange={(e) => setFindPhone(e.target.value)} className="bg-[#FBFBFC] border-none h-16 rounded-2xl font-bold px-6 text-[#163300] shadow-inner" /></div></>}</>
            ) : <div className="space-y-3"><Label className="text-[12px] font-black text-[#163300]/60 uppercase ml-1">가입된 이메일 계정</Label><Input placeholder="example@email.com" value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} className="bg-[#FBFBFC] border-none h-16 rounded-2xl font-bold px-6 text-[#163300] shadow-inner" /></div>}
          </div>
          <DialogFooter>{!foundEmail && <Button onClick={recoveryMode === "id" ? handleFindId : () => { sendPasswordResetEmail(auth, resetEmail); setRecoveryMode(null); }} disabled={isLoading} className="w-full h-18 bg-[#163300] text-primary font-black rounded-[1.5rem] shadow-2xl text-xl hover:brightness-110 transition-all active:scale-[0.97]">{isLoading ? "정보 확인 중..." : recoveryMode === "id" ? "정보 확인하기" : "재설정 링크 발송"}</Button>}</DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default function AuthPage() {
  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <Header />
      <Suspense fallback={<div className="flex flex-col items-center justify-center py-48 gap-6"><Sparkles className="w-14 h-14 animate-spin text-accent" /><p className="text-accent/40 font-black animate-pulse">인증 모듈 로딩 중...</p></div>}><AuthContent /></Suspense>
    </div>
  )
}
