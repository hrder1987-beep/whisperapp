
"use client"

import { Logo } from "./Logo"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, User as UserIcon, LogOut, Menu, Mail, Bell, FileText, ShieldCheck } from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useUser, useAuth, useCollection, useMemoFirebase, useFirestore, useDoc } from "@/firebase"
import { signOut } from "firebase/auth"
import { collection, query, where, doc } from "firebase/firestore"
import { cn } from "@/lib/utils"
import { useState, KeyboardEvent } from "react"
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"

interface HeaderProps {
  onSearch?: (query: string) => void
}

export function Header({ onSearch }: HeaderProps) {
  const pathname = pathnameFromHook()
  const router = useRouter()
  const { user } = useUser()
  const auth = useAuth()
  const db = useFirestore()
  const [searchQuery, setSearchQuery] = useState("")
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const userDocRef = useMemoFirebase(() => (user && db) ? doc(db, "users", user.uid) : null, [user, db])
  const { data: profile } = useDoc<any>(userDocRef)
  
  // 실시간 읽지 않은 쪽지 및 알림 수 체크
  const unreadMessagesQuery = useMemoFirebase(() => 
    (user && db) ? query(collection(db, "messages"), where("receiverId", "==", user.uid), where("isRead", "==", false)) : null,
    [db, user]
  )
  const unreadNotifQuery = useMemoFirebase(() => 
    (user && db) ? query(collection(db, "notifications"), where("userId", "==", user.uid), where("isRead", "==", false)) : null,
    [db, user]
  )

  const { data: unreadMessages } = useCollection(unreadMessagesQuery)
  const { data: unreadNotifs } = useCollection(unreadNotifQuery)

  const handleLogout = () => { signOut(auth); router.push("/"); }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (pathname !== '/') {
        router.push(`/?search=${encodeURIComponent(searchQuery)}`)
      } else {
        onSearch?.(searchQuery)
      }
    }
  }

  const isAdmin = user?.email === 'forum@khrd.co.kr' || profile?.role === 'admin'

  const navLinks = [
    { name: "지식 속삭임", href: "/" },
    { name: "위스퍼러", href: "/mentors" },
    { name: "프로그램", href: "/programs" },
    { name: "강사 정보", href: "/instructors" },
    { name: "채용 정보", href: "/jobs" },
  ]

  const personalLinks = [
    { name: "알림 센터", href: "/notifications", icon: Bell, count: unreadNotifs?.length },
    { name: "쪽지함", href: "/messages", icon: Mail, count: unreadMessages?.length },
    { name: "내가 쓴 속삭임", href: "/my-posts", icon: FileText },
  ]

  return (
    <header className="sticky top-0 z-50 w-full premium-gradient border-b border-white/10 shadow-xl">
      <div className="max-w-7xl mx-auto px-4 h-16 md:h-20 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 md:gap-8">
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden text-white hover:bg-white/10"><Menu className="w-6 h-6" /></Button>
            </SheetTrigger>
            <SheetContent side="left" className="bg-primary border-none p-0 w-72">
              <SheetHeader className="sr-only"><SheetTitle>메뉴</SheetTitle></SheetHeader>
              <div className="flex flex-col h-full pt-10 px-6">
                <Logo isLight className="mb-12" />
                <nav className="flex flex-col gap-6">
                  {navLinks.map((link) => (
                    <Link key={link.href} href={link.href} onClick={() => setIsMobileMenuOpen(false)} className={cn("text-xl font-black transition-all", pathname === link.href ? "text-accent" : "text-white/70")}>{link.name}</Link>
                  ))}
                  
                  {user && (
                    <>
                      <div className="h-px bg-white/10 my-2"></div>
                      {personalLinks.map((link) => (
                        <Link key={link.href} href={link.href} onClick={() => setIsMobileMenuOpen(false)} className={cn("text-lg font-bold flex items-center gap-3", pathname === link.href ? "text-accent" : "text-white/50")}>
                          <link.icon className="w-5 h-5" />
                          {link.name}
                          {link.count ? <Badge className="bg-accent text-primary border-none ml-auto">{link.count}</Badge> : null}
                        </Link>
                      ))}
                      {isAdmin && (
                        <Link href="/admin" onClick={() => setIsMobileMenuOpen(false)} className={cn("text-lg font-black flex items-center gap-3 text-accent mt-4")}>
                          <ShieldCheck className="w-5 h-5" />
                          플랫폼 관리 센터
                        </Link>
                      )}
                    </>
                  )}
                </nav>
                <div className="mt-auto pb-10 flex flex-col gap-4">
                  {user ? (
                    <Button variant="outline" className="border-white/20 text-white font-black hover:bg-white/10" onClick={handleLogout}>로그아웃</Button>
                  ) : (
                    <div className="flex flex-col gap-3">
                      <Link href="/auth?mode=login" onClick={() => setIsMobileMenuOpen(false)}><Button variant="ghost" className="w-full text-white font-black hover:bg-white/10">로그인</Button></Link>
                      <Link href="/auth?mode=signup" onClick={() => setIsMobileMenuOpen(false)}><Button className="w-full bg-accent text-primary font-black">회원가입</Button></Link>
                    </div>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
          <Link href="/"><Logo isLight /></Link>
          <nav className="hidden lg:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href} className={cn("text-sm font-black transition-all hover:text-accent", pathname === link.href ? "text-accent" : "text-white/70")}>{link.name}</Link>
            ))}
          </nav>
        </div>

        <div className="hidden md:flex flex-1 max-w-md relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50 group-focus-within:text-accent transition-colors" />
          <Input 
            placeholder="검색어를 입력하세요" 
            className="pl-11 bg-white/10 border-none h-10 rounded-full text-white focus-visible:ring-accent/50" 
            value={searchQuery} 
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyDown}
          />
        </div>

        <div className="flex items-center gap-2">
          {user ? (
            <div className="flex items-center gap-1 md:gap-3">
              <div className="hidden sm:flex items-center gap-1">
                {isAdmin && (
                  <Link href="/admin">
                    <Button variant="ghost" size="icon" className="text-accent hover:bg-white/10 transition-colors" title="플랫폼 통합 관리">
                      <ShieldCheck className="w-5 h-5" />
                    </Button>
                  </Link>
                )}
                <Link href="/notifications">
                  <Button variant="ghost" size="icon" className="relative text-white/70 hover:text-accent hover:bg-white/10 transition-colors">
                    <Bell className="w-5 h-5" />
                    {unreadNotifs && unreadNotifs.length > 0 && (
                      <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-primary"></span>
                    )}
                  </Button>
                </Link>
                <Link href="/messages">
                  <Button variant="ghost" size="icon" className="relative text-white/70 hover:text-accent hover:bg-white/10 transition-colors">
                    <Mail className="w-5 h-5" />
                    {unreadMessages && unreadMessages.length > 0 && (
                      <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-primary"></span>
                    )}
                  </Button>
                </Link>
                <Link href="/my-posts">
                  <Button variant="ghost" size="icon" className="text-white/70 hover:text-accent hover:bg-white/10 transition-colors">
                    <FileText className="w-5 h-5" />
                  </Button>
                </Link>
              </div>

              <div className="h-6 w-px bg-white/10 mx-1 hidden sm:block"></div>

              <Link href="/profile">
                <Button variant="ghost" size="sm" className="text-white font-bold gap-2 hover:text-accent hover:bg-white/10 transition-colors">
                  <UserIcon className="w-4 h-4" /> 내 정보
                </Button>
              </Link>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={handleLogout} 
                className="text-white/70 hover:text-red-400 hover:bg-red-500/10 transition-colors"
              >
                <LogOut className="w-5 h-5" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/auth?mode=login" className="hidden sm:block"><Button variant="ghost" size="sm" className="text-white font-black hover:bg-white/10">로그인</Button></Link>
              <Link href="/auth?mode=signup"><Button size="sm" className="bg-accent text-primary font-black rounded-xl px-5 h-10 transition-all hover:scale-105">회원가입</Button></Link>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

function pathnameFromHook() {
  try {
    return usePathname()
  } catch (e) {
    return "/"
  }
}
