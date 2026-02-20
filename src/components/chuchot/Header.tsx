
"use client"

import { Logo } from "./Logo"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, User as UserIcon, LogOut, Menu, Mail, Bell, ShieldCheck } from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useUser, useAuth, useCollection, useMemoFirebase, useFirestore, useDoc } from "@/firebase"
import { signOut } from "firebase/auth"
import { collection, query, where, doc } from "firebase/firestore"
import { cn } from "@/lib/utils"
import { useState, KeyboardEvent } from "react"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"

interface HeaderProps {
  onSearch?: (query: string) => void
}

export function Header({ onSearch }: HeaderProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { user } = useUser()
  const auth = useAuth()
  const db = useFirestore()
  const [searchQuery, setSearchQuery] = useState("")
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const userDocRef = useMemoFirebase(() => (user && db) ? doc(db, "users", user.uid) : null, [user, db])
  const { data: profile } = useDoc<any>(userDocRef)
  
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

  return (
    <header className="naver-header">
      {/* Top Utility Nav */}
      <div className="bg-[#F8F9FA] border-b border-black/[0.05] hidden md:block">
        <div className="max-w-7xl mx-auto px-4 h-10 flex items-center justify-end gap-6 text-[11px] font-bold text-muted-foreground">
          {user ? (
            <>
              <Link href="/profile" className="hover:text-foreground transition-colors flex items-center gap-1.5">
                <UserIcon className="w-3.5 h-3.5" /> 내 정보
              </Link>
              <button onClick={handleLogout} className="hover:text-red-500 transition-colors">로그아웃</button>
            </>
          ) : (
            <>
              <Link href="/auth?mode=login" className="hover:text-foreground">로그인</Link>
              <Link href="/auth?mode=signup" className="hover:text-foreground">회원가입</Link>
            </>
          )}
          <Link href="/notifications" className="relative hover:text-foreground">
            알림
            {unreadNotifs && unreadNotifs.length > 0 && <span className="absolute -top-1 -right-2 w-1 h-1 bg-red-500 rounded-full"></span>}
          </Link>
        </div>
      </div>

      {/* Main Header Content */}
      <div className="max-w-7xl mx-auto px-4 h-16 md:h-20 flex items-center justify-between gap-8">
        <div className="flex items-center gap-6">
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden text-primary"><Menu className="w-6 h-6" /></Button>
            </SheetTrigger>
            <SheetContent side="left" className="bg-white border-none p-0 w-72">
              <div className="flex flex-col h-full pt-10 px-6">
                <Logo className="mb-12" />
                <nav className="flex flex-col gap-4">
                  {navLinks.map((link) => (
                    <Link key={link.href} href={link.href} onClick={() => setIsMobileMenuOpen(false)} className={cn("text-lg font-bold transition-all", pathname === link.href ? "text-accent" : "text-foreground")}>{link.name}</Link>
                  ))}
                </nav>
              </div>
            </SheetContent>
          </Sheet>
          <Link href="/"><Logo /></Link>
        </div>

        {/* Naver Style Search Bar */}
        <div className="hidden md:flex flex-1 max-w-xl">
          <div className="naver-search-bar w-full h-11">
            <Input 
              placeholder="궁금한 HR 지식을 검색해보세요" 
              className="border-none shadow-none focus-visible:ring-0 text-[15px] font-bold h-full placeholder:text-black/20"
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <button onClick={() => onSearch?.(searchQuery)} className="text-accent hover:scale-110 transition-transform">
              <Search className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-2">
            {isAdmin && (
              <Link href="/admin">
                <Button variant="outline" size="sm" className="border-black/10 text-foreground font-bold h-10 px-4 gap-2 rounded-sm">
                  <ShieldCheck className="w-4 h-4 text-accent" /> 관리 센터
                </Button>
              </Link>
            )}
            {user && (
              <Link href="/messages">
                <Button variant="ghost" size="icon" className="relative text-foreground/60 hover:text-foreground h-10 w-10">
                  <Mail className="w-5 h-5" />
                  {unreadMessages && unreadMessages.length > 0 && (
                    <Badge className="absolute -top-1 -right-1 bg-red-500 text-white border-none h-4 w-4 p-0 flex items-center justify-center text-[8px] rounded-full font-black">{unreadMessages.length}</Badge>
                  )}
                </Button>
              </Link>
            )}
          </div>
          {!user && (
            <Link href="/auth?mode=login">
              <Button className="naver-button h-10 px-6 hidden md:block">로그인</Button>
            </Link>
          )}
        </div>
      </div>

      {/* Sub Nav Menu */}
      <nav className="border-t border-black/[0.05] hidden md:block bg-white">
        <div className="max-w-7xl mx-auto px-4 h-12 flex items-center gap-8">
          {navLinks.map((link) => (
            <Link 
              key={link.href} 
              href={link.href} 
              className={cn(
                "text-[14px] font-bold transition-all h-full flex items-center border-b-[3px] px-1", 
                pathname === link.href ? "text-accent border-accent" : "text-foreground border-transparent hover:text-accent"
              )}
            >
              {link.name}
            </Link>
          ))}
        </div>
      </nav>
    </header>
  )
}
