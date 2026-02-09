
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
import { useState } from "react"
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"

interface HeaderProps {
  onSearch?: (query: string) => void
  isAdminMode?: boolean
  isCMSActive?: boolean
  onToggleCMS?: () => void
  onExitAdmin?: () => void
  onOpenAdminAuth?: () => void
}

export function Header({ 
  onSearch,
}: HeaderProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { user } = useUser()
  const auth = useAuth()
  const db = useFirestore()
  const [searchQuery, setSearchQuery] = useState("")
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const userDocRef = useMemoFirebase(() => (user && db) ? doc(db, "users", user.uid) : null, [user, db])
  const { data: profile } = useDoc<any>(userDocRef)

  const isAdmin = user?.email === 'forum@khrd.co.kr' || profile?.role === 'admin'

  const unreadMessagesQuery = useMemoFirebase(() => {
    if (!db || typeof db !== 'object' || !user || !user.uid) return null
    try {
      return query(
        collection(db, "messages"),
        where("receiverId", "==", user.uid),
        where("isRead", "==", false)
      )
    } catch (e) {
      return null
    }
  }, [db, user])
  
  const { data: unreadMessages } = useCollection(unreadMessagesQuery)

  const notificationsQuery = useMemoFirebase(() => {
    if (!db || !user) return null
    return query(
      collection(db, "notifications"),
      where("userId", "==", user.uid),
      where("isRead", "==", false)
    )
  }, [db, user])
  const { data: unreadNotifications } = useCollection(notificationsQuery)

  const handleLogout = () => {
    signOut(auth)
    router.push("/")
  }

  const navLinks = [
    { name: "지식 속삭임", href: "/" },
    { name: "위스퍼러", href: "/mentors" },
    { name: "프로그램", href: "/programs" },
    { name: "강사 정보", href: "/instructors" },
    { name: "채용 정보", href: "/jobs" },
  ]

  return (
    <header className="sticky top-0 z-50 w-full premium-gradient border-b border-white/10 shadow-xl">
      <div className="max-w-7xl mx-auto px-4 h-16 md:h-20 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 md:gap-8">
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden text-white hover:bg-white/10">
                <Menu className="w-6 h-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="bg-primary border-none p-0 w-72">
              <SheetHeader className="sr-only">
                <SheetTitle>메뉴</SheetTitle>
              </SheetHeader>
              <div className="flex flex-col h-full pt-10 px-6">
                <Logo isLight className="mb-12" />
                <nav className="flex flex-col gap-6">
                  {navLinks.map((link) => (
                    <Link 
                      key={link.href} 
                      href={link.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={cn(
                        "text-xl font-black transition-all",
                        pathname === link.href ? "text-accent" : "text-white/70"
                      )}
                    >
                      {link.name}
                    </Link>
                  ))}
                  {isAdmin && (
                    <Link 
                      href="/admin"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="text-xl font-black text-accent flex items-center gap-2"
                    >
                      <ShieldCheck className="w-6 h-6" /> 관리자 센터
                    </Link>
                  )}
                </nav>
                <div className="mt-auto pb-10 flex flex-col gap-4">
                  {user ? (
                    <div className="flex flex-col gap-3">
                      <Link href="/profile" onClick={() => setIsMobileMenuOpen(false)}>
                        <Button variant="outline" className="w-full border-white/20 text-white font-black rounded-xl">내 정보</Button>
                      </Link>
                      <Button variant="outline" className="w-full border-white/20 text-white font-black rounded-xl" onClick={handleLogout}>
                        로그아웃
                      </Button>
                    </div>
                  ) : (
                    <Link href="/auth?mode=login" onClick={() => setIsMobileMenuOpen(false)}>
                      <Button className="w-full bg-accent text-primary font-black rounded-xl">로그인 / 가입</Button>
                    </Link>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>

          <Link href="/">
            <Logo 
              isLight 
              className="scale-90 md:scale-100 origin-left"
            />
          </Link>
          
          <nav className="hidden lg:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link 
                key={link.href} 
                href={link.href}
                className={cn(
                  "text-sm font-black transition-all hover:text-accent",
                  pathname === link.href ? "text-accent" : "text-white/70"
                )}
              >
                {link.name}
              </Link>
            ))}
          </nav>
        </div>

        <div className="hidden md:flex flex-1 max-w-md relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50 group-focus-within:text-accent transition-colors" />
          <Input 
            placeholder="Whisper 지식 검색..." 
            className="pl-11 pr-10 bg-white/10 border-none focus-visible:ring-accent/50 h-10 rounded-full text-xs text-white placeholder:text-white/40"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              onSearch?.(e.target.value)
            }}
          />
        </div>

        <div className="flex items-center gap-2">
          {user && (
            <div className="flex items-center gap-1">
              {isAdmin && (
                <Link href="/admin" className="relative group hidden sm:block">
                  <Button variant="ghost" size="icon" className="text-accent hover:bg-white/5 rounded-full" title="관리자 센터">
                    <ShieldCheck className="w-5 h-5" />
                  </Button>
                </Link>
              )}

              <Link href="/notifications" className="relative group">
                <Button variant="ghost" size="icon" className="text-white hover:text-accent hover:bg-white/5 rounded-full">
                  <Bell className="w-5 h-5" />
                  {unreadNotifications && unreadNotifications.length > 0 && (
                    <Badge className="absolute -top-1 -right-1 bg-accent text-primary border-none text-[8px] h-4 w-4 flex items-center justify-center p-0 rounded-full animate-bounce">
                      {unreadNotifications.length}
                    </Badge>
                  )}
                </Button>
              </Link>

              <Link href="/my-posts" className="relative group">
                <Button variant="ghost" size="icon" className="text-white hover:text-accent hover:bg-white/5 rounded-full">
                  <FileText className="w-5 h-5" />
                </Button>
              </Link>

              <Link href="/messages" className="relative group">
                <Button variant="ghost" size="icon" className="text-white hover:text-accent hover:bg-white/5 rounded-full">
                  <Mail className="w-5 h-5" />
                  {unreadMessages && unreadMessages.length > 0 && (
                    <Badge className="absolute -top-1 -right-1 bg-accent text-primary border-none text-[8px] h-4 w-4 flex items-center justify-center p-0 rounded-full animate-bounce">
                      {unreadMessages.length}
                    </Badge>
                  )}
                </Button>
              </Link>
            </div>
          )}

          {user ? (
            <div className="flex items-center gap-1 md:gap-2">
              <Link href="/profile">
                <Button variant="ghost" size="sm" className="text-white hover:text-accent hover:bg-white/5 font-bold gap-2 p-2 md:px-4">
                  <UserIcon className="w-4 h-4" />
                  <span className="hidden sm:inline text-xs">내 정보</span>
                </Button>
              </Link>
              <Button variant="ghost" size="icon" onClick={handleLogout} className="text-white/70 hover:text-red-400 hidden sm:flex">
                <LogOut className="w-5 h-5" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/auth?mode=login" className="hidden sm:block">
                <Button variant="ghost" size="sm" className="text-white hover:text-accent font-black transition-colors">
                  로그인
                </Button>
              </Link>
              <Link href="/auth?mode=signup">
                <Button size="sm" className="bg-accent text-primary font-black hover:bg-accent/90 rounded-xl px-4 md:px-5 h-8 md:h-10 text-xs transition-all shadow-lg hover:scale-105 active:scale-95">
                  시작하기
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
