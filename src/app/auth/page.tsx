
"use client"

import { useState, Suspense } from "react"
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
import { Mail, Lock, UserPlus, LogIn, Sparkles, Building, Briefcase, Phone, User } from "lucide-react"

function AuthContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const auth = useAuth()
  const db = useFirestore()
  const { toast } = useToast()

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

      await setDoc(doc(db, "users", user.uid), {
        id: user.uid,
        username,
        email,
        name,
        company,
        department,
        jobTitle,
        phoneNumber: phone,
        registrationDate: new Date().toISOString()
      })

      toast({ title: "가입 완료!", description: "Whisper의 일원이 되신 것을 환영합니다." })
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
              <TabsTrigger value="login" className="rounded-xl font-black">로그인</TabsTrigger>
              <TabsTrigger value="signup" className="rounded-xl font-black">회원가입</TabsTrigger>
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
                    <Label className="text-xs font-black text-primary/40 ml-1">직함</Label>
                    <Input placeholder="팀장/매니저 등" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} required className="h-11 bg-primary/5 border-none rounded-xl" />
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
