
"use client"

import { useState, useEffect, Suspense } from "react"
import { Header } from "@/components/chuchot/Header"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/firebase"
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth"
import { useRouter, useSearchParams } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { Mail, Lock, UserPlus, LogIn, Sparkles } from "lucide-react"

function AuthContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const auth = useAuth()
  const { toast } = useToast()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("login")

  useEffect(() => {
    const mode = searchParams.get("mode")
    if (mode === "signup") {
      setActiveTab("signup")
    } else {
      setActiveTab("login")
    }
  }, [searchParams])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      await signInWithEmailAndPassword(auth, email, password)
      toast({ title: "환영합니다!", description: "로그인에 성공했습니다." })
      router.push("/")
    } catch (error: any) {
      toast({ title: "로그인 실패", description: "이메일 또는 비밀번호를 확인해주세요.", variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      await createUserWithEmailAndPassword(auth, email, password)
      toast({ title: "가입 완료!", description: "슈쇼의 일원이 되신 것을 축하드립니다." })
      router.push("/")
    } catch (error: any) {
      toast({ title: "가입 실패", description: error.message, variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto px-4 py-20">
      <Card className="border-primary/10 shadow-2xl rounded-[2.5rem] overflow-hidden bg-white">
        <div className="h-2 w-full gold-gradient"></div>
        <CardHeader className="text-center pt-10 pb-6">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-accent/10 rounded-2xl">
              <Sparkles className="w-8 h-8 text-accent animate-pulse" />
            </div>
          </div>
          <CardTitle className="text-3xl font-black text-primary tracking-tighter">슈쇼에 오신 것을 환영해요</CardTitle>
          <CardDescription className="font-bold text-primary/40 mt-2">대한민국 HRD 전문가들의 성장을 위한 공간</CardDescription>
        </CardHeader>
        <CardContent className="px-8 pb-10">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-primary/5 p-1 rounded-2xl mb-8">
              <TabsTrigger value="login" className="rounded-xl font-black data-[state=active]:bg-white data-[state=active]:text-primary transition-all">로그인</TabsTrigger>
              <TabsTrigger value="signup" className="rounded-xl font-black data-[state=active]:bg-white data-[state=active]:text-primary transition-all">회원가입</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login" className="animate-in fade-in slide-in-from-left-4 duration-300">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs font-black text-primary/40 ml-1">이메일 주소</Label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/20" />
                    <Input 
                      type="email" 
                      placeholder="example@email.com" 
                      className="pl-11 h-12 bg-primary/5 border-none rounded-xl font-medium"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-black text-primary/40 ml-1">비밀번호</Label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/20" />
                    <Input 
                      type="password" 
                      placeholder="••••••••" 
                      className="pl-11 h-12 bg-primary/5 border-none rounded-xl font-medium"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <Button type="submit" disabled={isLoading} className="w-full h-12 bg-primary text-accent font-black rounded-xl shadow-lg hover:bg-primary/95 transition-all mt-4">
                  {isLoading ? "처리 중..." : "로그인하기"}
                  <LogIn className="w-4 h-4 ml-2" />
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup" className="animate-in fade-in slide-in-from-right-4 duration-300">
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs font-black text-primary/40 ml-1">이메일 주소</Label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/20" />
                    <Input 
                      type="email" 
                      placeholder="example@email.com" 
                      className="pl-11 h-12 bg-primary/5 border-none rounded-xl font-medium"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-black text-primary/40 ml-1">비밀번호</Label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/20" />
                    <Input 
                      type="password" 
                      placeholder="6자리 이상 입력하세요" 
                      className="pl-11 h-12 bg-primary/5 border-none rounded-xl font-medium"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <Button type="submit" disabled={isLoading} className="w-full h-12 gold-gradient text-primary font-black rounded-xl shadow-lg hover:opacity-90 transition-all mt-4">
                  {isLoading ? "처리 중..." : "회원가입 완료"}
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
