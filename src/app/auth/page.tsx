
"use client"

import { useState, Suspense, useRef } from "react"
import { Header } from "@/components/chuchot/Header"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth, useFirestore } from "@/firebase"
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth"
import { doc, setDoc } from "firebase/firestore"
import { useRouter, useSearchParams } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { LogIn, UserPlus, Camera, X, Sparkles, Info } from "lucide-react"
import { sendWelcomeEmail } from "@/ai/flows/send-welcome-email-flow"

function AuthContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const auth = useAuth()
  const db = useFirestore()
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
        jobTitle, // 사용자가 직접 작성하는 직무/직함
        phoneNumber: phone,
        role: "member",
        registrationDate: new Date().toISOString(),
        profilePictureUrl: profilePicture || null
      })

      // 2. 자동 웰컴 메일 발송 플로우 트리거 (Server Action)
      sendWelcomeEmail({ name, email }).catch(err => console.error("Welcome email failed:", err));

      toast({ title: "가입 완료!", description: "Whisper의 일원이 되신 것을 환영합니다. 가입 환영 메일을 확인해주세요!" })
      router.push("/")
    } catch (error: any) {
      toast({ title: "가입 실패", description: error.message, variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
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
                  <Label className="text-xs font-black text-primary/40 ml-1">이메일</Label>
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
                  <Label className="text-xs font-black text-primary/40 ml-1">이메일</Label>
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
                    <Label className="text-xs font-black text-primary/40 ml-1">직무/직함 (예: 채용담당자)</Label>
                    <Input placeholder="인사담당자 등 직접 입력" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} required className="h-11 bg-primary/5 border-none rounded-xl" />
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
