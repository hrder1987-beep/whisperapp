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
  const [jobTitle, setJobTitle] = useState("")
  const [phone, setPhone] = useState("")
  const [profilePicture, setProfilePicture] = useState<string | null>(null)

  // Recovery States
  const [recoveryMode, setRecoveryMode] = useState<null | "id" | "password">(null)
  const [findName, setFindName] = useState("")
  const [findPhone, setFindPhone] = useState("")
  const [foundEmail, setFoundEmail] = useState<string | null>(null)
  const [resetEmail, setResetEmail] = useState("")

  // 이미 로그인된 사용자는 홈으로 리다이렉트
  useEffect(() => {
    if (user && !isUserLoading) {
      router.push("/")
    }
  }, [user, isUserLoading, router])

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
      toast({ title: "로그인 실패", description: "정보를 확인해주세요.", variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      const user = userCredential.user

      // 1. Firestore에 사용자 프로필 저장
      await setDoc(doc(db, "users", user.uid), {
        id: user.uid,
        username,
        email,
        name,
        company,
        department,
        jobTitle, 
        phoneNumber: phone,
        role: "member",
        registrationDate: new Date().toISOString(),
        profilePictureUrl: profilePicture || null
      })

      // 2. 자동 웰컴 메일 발송 플로우 트리거 (비동기)
      sendWelcomeEmail({ name, email }).catch(err => console.error("Welcome email failed:", err));

      toast({ 
        title: "가입 완료!", 
        description: "Whisper의 일원이 되신 것을 환영합니다. 가입 환영 메일이 전송되었습니다!" 
      })
      router.push("/")
    } catch (error: any) {
      toast({ title: "가입 실패", description: error.message, variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }

  // 아이디(이메일) 찾기 로직
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
        // 이메일 마스킹 처리 (앞 3글자 제외)
        const [id, domain] = fullEmail.split('@')
        const maskedId = id.substring(0, 2) + '*'.repeat(id.length - 2)
        setFoundEmail(`${maskedId}@${domain}`)
      }
    } catch (err) {
      toast({ title: "오류 발생", description: "정보 조회 중 문제가 발생했습니다.", variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }

  // 비밀번호 재설정 메일 발송 로직
  const handleResetPassword = async () => {
    if (!resetEmail) return
    setIsLoading(true)
    try {
      await sendPasswordResetEmail(auth, resetEmail)
      toast({ title: "메일 발송 완료", description: "입력하신 이메일로 비밀번호 재설정 링크를 보냈습니다." })
      setRecoveryMode(null)
    } catch (error: any) {
      toast({ title: "발송 실패", description: "가입된 이메일인지 확인해 주세요.", variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }

  if (isUserLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-40 gap-4">
        <Sparkles className="w-12 h-12 animate-spin text-accent" />
        <p className="text-primary/40 font-black animate-pulse">인증 상태 확인 중...</p>
      </div>
    )
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-12 md:py-20">
      <Card className="border-primary/10 shadow-2xl rounded-[2.5rem] overflow-hidden bg-white">
        <div className="h-2 w-full gold-gradient"></div>
        <CardHeader className="text-center pt-10 pb-6">
          <CardTitle className="text-3xl font-black text-primary tracking-tighter">Whisper Intelligence</CardTitle>
          <CardDescription className="font-bold text-primary/40 mt-2">대한민국 HR 전문가들의 집단지성 허브</CardDescription>
        </CardHeader>
        <CardContent className="px-8 pb-10">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-primary/5 p-1 rounded-2xl mb-8">
              <TabsTrigger value="login" className="rounded-xl font-black text-xs md:text-sm">로그인</TabsTrigger>
              <TabsTrigger value="signup" className="rounded-xl font-black text-xs md:text-sm">회원가입</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs font-black text-primary/40 ml-1">이메일 (ID)</Label>
                  <Input type="email" placeholder="example@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required className="h-12 bg-primary/5 border-none rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-black text-primary/40 ml-1">비밀번호</Label>
                  <Input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required className="h-12 bg-primary/5 border-none rounded-xl" />
                </div>
                <Button type="submit" disabled={isLoading} className="w-full h-12 bg-primary text-accent font-black rounded-xl mt-4">
                  {isLoading ? "처리 중..." : "위스퍼 시작하기"}
                  <LogIn className="w-4 h-4 ml-2" />
                </Button>
                
                <div className="flex items-center justify-center gap-4 mt-6">
                  <button type="button" onClick={() => setRecoveryMode("id")} className="text-[11px] font-bold text-primary/30 hover:text-accent transition-colors">아이디 찾기</button>
                  <div className="w-px h-2 bg-primary/10"></div>
                  <button type="button" onClick={() => setRecoveryMode("password")} className="text-[11px] font-bold text-primary/30 hover:text-accent transition-colors">비밀번호 재설정</button>
                </div>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="flex flex-col items-center mb-6">
                  <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                    <div className="w-24 h-24 rounded-full bg-primary/5 border-2 border-dashed border-primary/20 flex items-center justify-center overflow-hidden transition-all group-hover:border-accent">
                      {profilePicture ? (
                        <img src={profilePicture} alt="preview" className="w-full h-full object-cover" />
                      ) : (
                        <Camera className="w-8 h-8 text-primary/20 group-hover:text-accent transition-colors" />
                      )}
                    </div>
                    {profilePicture && (
                      <button 
                        type="button" 
                        onClick={(e) => { e.stopPropagation(); setProfilePicture(null); }}
                        className="absolute -top-1 -right-1 bg-red-500 text-white p-1 rounded-full shadow-lg"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                  <span className="text-[10px] font-black text-primary/40 mt-2 uppercase tracking-tighter">프로필 사진 등록 (선택)</span>
                  <span className="text-[8px] font-bold text-accent mt-1 flex items-center gap-1"><Info className="w-3 h-3" /> 권장: 400x400px</span>
                  <input type="file" ref={fileInputRef} onChange={handleImageChange} accept="image/*" className="hidden" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-black text-primary/40 ml-1">아이디(닉네임)</Label>
                    <Input placeholder="nickname" value={username} onChange={(e) => setUsername(e.target.value)} required className="h-11 bg-primary/5 border-none rounded-xl" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-black text-primary/40 ml-1">성함</Label>
                    <Input placeholder="성함" value={name} onChange={(e) => setName(e.target.value)} required className="h-11 bg-primary/5 border-none rounded-xl" />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-xs font-black text-primary/40 ml-1">이메일 (ID로 사용됨)</Label>
                  <Input type="email" placeholder="example@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required className="h-11 bg-primary/5 border-none rounded-xl" />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-black text-primary/40 ml-1">비밀번호</Label>
                  <Input type="password" placeholder="6자리 이상" value={password} onChange={(e) => setPassword(e.target.value)} required className="h-11 bg-primary/5 border-none rounded-xl" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-black text-primary/40 ml-1">소속(회사)</Label>
                    <Input placeholder="회사명" value={company} onChange={(e) => setCompany(e.target.value)} required className="h-11 bg-primary/5 border-none rounded-xl" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-black text-primary/40 ml-1">부서</Label>
                    <Input placeholder="인사팀 등" value={department} onChange={(e) => setDepartment(e.target.value)} required className="h-11 bg-primary/5 border-none rounded-xl" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-black text-primary/40 ml-1">직무/직함</Label>
                    <Input placeholder="채용담당자 등" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} required className="h-11 bg-primary/5 border-none rounded-xl" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-black text-primary/40 ml-1">휴대전화</Label>
                    <Input placeholder="010-0000-0000" value={phone} onChange={(e) => setPhone(e.target.value)} required className="h-11 bg-primary/5 border-none rounded-xl" />
                  </div>
                </div>

                <Button type="submit" disabled={isLoading} className="w-full h-12 gold-gradient text-primary font-black rounded-xl mt-4">
                  {isLoading ? "처리 중..." : "전문가 등록 완료"}
                  <UserPlus className="w-4 h-4 ml-2" />
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Recovery Dialog */}
      <Dialog open={!!recoveryMode} onOpenChange={() => { setRecoveryMode(null); setFoundEmail(null); }}>
        <DialogContent className="max-w-md bg-white border-none rounded-[2.5rem] p-8 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black text-primary flex items-center gap-3">
              {recoveryMode === "id" ? <Search className="w-6 h-6 text-accent" /> : <KeyRound className="w-6 h-6 text-accent" />}
              {recoveryMode === "id" ? "아이디(이메일) 찾기" : "비밀번호 재설정"}
            </DialogTitle>
            <DialogDescription className="font-bold text-primary/40">
              {recoveryMode === "id" 
                ? "가입 시 입력한 정보를 확인하여 아이디를 찾아드립니다." 
                : "등록된 이메일로 비밀번호 재설정 링크를 보내드립니다."}
            </DialogDescription>
          </DialogHeader>

          <div className="py-6 space-y-4">
            {recoveryMode === "id" ? (
              <>
                {foundEmail ? (
                  <div className="bg-primary/5 p-6 rounded-2xl text-center space-y-2">
                    <p className="text-[10px] font-black text-primary/30 uppercase">회원님의 아이디(이메일)입니다</p>
                    <p className="text-xl font-black text-primary">{foundEmail}</p>
                    <Button variant="outline" onClick={() => { setEmail(foundEmail.replace(/\*/g, '')); setRecoveryMode(null); }} className="mt-4 border-primary/10 text-primary font-black rounded-xl">로그인하러 가기</Button>
                  </div>
                ) : (
                  <>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black text-primary/40 uppercase ml-1">성함</Label>
                      <Input placeholder="가입 시 입력한 이름" value={findName} onChange={(e) => setFindName(e.target.value)} className="bg-primary/5 border-none h-12 rounded-xl" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black text-primary/40 uppercase ml-1">휴대전화 번호</Label>
                      <Input placeholder="010-0000-0000" value={findPhone} onChange={(e) => setFindPhone(e.target.value)} className="bg-primary/5 border-none h-12 rounded-xl" />
                    </div>
                  </>
                )}
              </>
            ) : (
              <div className="space-y-2">
                <Label className="text-[10px] font-black text-primary/40 uppercase ml-1">가입 이메일</Label>
                <Input placeholder="example@email.com" value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} className="bg-primary/5 border-none h-12 rounded-xl" />
              </div>
            )}
          </div>

          <DialogFooter>
            {!foundEmail && (
              <Button 
                onClick={recoveryMode === "id" ? handleFindId : handleResetPassword}
                disabled={isLoading}
                className="w-full h-12 bg-primary text-accent font-black rounded-xl"
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
      <Suspense fallback={<div className="flex justify-center py-20"><Sparkles className="w-10 h-10 animate-spin text-accent" /></div>}>
        <AuthContent />
      </Suspense>
    </div>
  )
}
