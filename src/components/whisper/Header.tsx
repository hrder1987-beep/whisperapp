"use client"

import { Logo } from "./Logo"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, User as UserIcon, Menu, Mail, ShieldCheck, FileText, Bell, Sparkles } from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useUser, useAuth, useCollection, useMemoFirebase, useFirestore, useDoc } from "@/firebase"
import { signOut } from "firebase/auth"
import { collection, query, where, doc } from "firebase/firestore"
import { cn } from "@/lib/utils"
import { useState, KeyboardEvent, useEffect } from "react"
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet"
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
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => setIsMounted(true), [])

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
      if (pathname !== '/') router.push(`/?search=${encodeURIComponent(searchQuery)}`)
      else onSearch?.(searchQuery)
    }
  }

  const isAdmin = user?.email === 'forum@khrd.co.kr' || profile?.role === 'admin'

  const navLinks = [
    { name: "지식 속삭임", href: "/" },
    { name: "모임개설", href: "/gatherings" },
    { name: "위스퍼러", href: "/mentors" },
    { name: "프로그램", href: "/programs" },
    { name: "강사 정보", href: "/instructors" },
    { name: "채용 정보", href: "/jobs" },
  ]

  if (!isMounted) return <header className="naver-header h-16 md:h-[88px]" />

  return (
    <header className="naver-header shadow-sm border-none">
      <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 md:h-[88px] flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 md:gap-10">
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden text-accent -ml-2 hover:bg-primary/10 rounded-full transition-all active:scale-90">
                <Menu className="w-7 h-7" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="bg-white border-none p-0 w-[300px] shadow-4xl">
              <SheetHeader className="sr-only"><SheetTitle>메뉴</SheetTitle></SheetHeader>
              <div className="flex flex-col h-full pt-16 px-6">
                <Logo className="mb-12 scale-110 origin-left" />
                <nav className="flex flex-col gap-2">
                  {navLinks.map((link) => (
                    <Link key={link.href} href={link.href} onClick={() => setIsMobileMenuOpen(false)} className={cn("text-[16px] font-black py-4 px-5 rounded-2xl transition-all", pathname === link.href ? "bg-primary text-accent shadow-md" : "text-accent/60 hover:bg-primary/10")}>{link.name}</Link>
                  ))}
                  <div className="h-px bg-black/[0.04] my-6" />
                  {user ? (
                    <div className="flex flex-col gap-2">
                      {isAdmin && <Button asChild className="bg-accent text-primary font-black rounded-xl h-12 mb-4"><Link href="/admin"><ShieldCheck className="w-4 h-4 mr-2" /> Admin</Link></Button>}
                      <Link href="/my-posts" onClick={() => setIsMobileMenuOpen(false)} className="text-sm font-bold py-3 text-accent/60 flex items-center gap-3 px-5"><FileText className="w-4 h-4 opacity-30" /> 내가 쓴 속삭임</Link>
                      <Link href="/profile" onClick={() => setIsMobileMenuOpen(false)} className="text-sm font-bold py-3 text-accent/60 flex items-center gap-3 px-5"><UserIcon className="w-4 h-4 opacity-30" /> 내 정보</Link>
                      <Link href="/notifications" onClick={() => setIsMobileMenuOpen(false)} className="text-sm font-bold py-3 text-accent/60 flex items-center gap-3 px-5"><Bell className="w-4 h-4 opacity-30" /> 알림 센터</Link>
                      <button onClick={handleLogout} className="text-left text-sm font-black py-3 px-5 text-red-400 mt-4">로그아웃</button>
                    </div>
                  ) : (
                    <Link href="/auth?mode=login" onClick={() => setIsMobileMenuOpen(false)} className="text-[16px] font-black py-4 px-5 bg-accent text-primary rounded-2xl text-center shadow-lg flex items-center justify-center gap-2 mt-4"><Sparkles className="w-4 h-4" /> 시작하기</Link>
                  )}
                </nav>
              </div>
            </SheetContent>
          </Sheet>
          <Link href="/"><Logo className="scale-[0.85] md:scale-110" /></Link>
        </div>

        <div className="hidden md:flex flex-1 max-w-xl px-10">
          <div className="naver-search-bar w-full h-12 shadow-sm group">
            <Input 
              placeholder="궁금한 HR 지식과 사례를 검색하세요" 
              className="border-none shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 text-[15px] font-black h-full placeholder:text-accent/10 bg-transparent px-0 outline-none pl-4" 
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)} 
              onKeyDown={handleKeyDown} 
            />
            <button onClick={() => onSearch?.(searchQuery)} className="text-accent/30 group-focus-within:text-accent hover:scale-110 transition-all px-4"><Search className="w-5 h-5" /></button>
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          <div className="hidden md:flex items-center gap-3">
            {user && (
              <div className="flex items-center gap-1.5 mr-2">
                <Link href="/my-posts"><Button variant="ghost" size="icon" title="내가 쓴 속삭임" className="text-accent/40 hover:text-accent hover:bg-primary/10 h-10 w-10 rounded-xl transition-all"><FileText className="w-5 h-5" /></Button></Link>
                <Link href="/notifications"><Button variant="ghost" size="icon" className="relative text-accent/40 hover:text-accent hover:bg-primary/10 h-10 w-10 rounded-xl transition-all"><Bell className="w-5 h-5" />{unreadNotifs && unreadNotifs.length > 0 && (<Badge className="absolute -top-1 -right-1 bg-red-500 text-white border-none h-4 w-4 p-0 flex items-center justify-center text-[8px] rounded-full font-black shadow-md">{unreadNotifs.length}</Badge>)}</Button></Link>
                <Link href="/messages"><Button variant="ghost" size="icon" className="relative text-accent/40 hover:text-accent hover:bg-primary/10 h-10 w-10 rounded-xl transition-all"><Mail className="w-5 h-5" />{unreadMessages && unreadMessages.length > 0 && (<Badge className="absolute -top-1 -right-1 bg-red-500 text-white border-none h-4 w-4 p-0 flex items-center justify-center text-[8px] rounded-full font-black shadow-md">{unreadMessages.length}</Badge>)}</Button></Link>
              </div>
            )}
          </div>
          {!user ? (
            <div className="flex items-center gap-2">
              <Link href="/auth?mode=login"><Button className="naver-button h-10 px-6 hidden md:block shadow-md text-sm">로그인</Button></Link>
              <Link href="/auth?mode=signup"><Button variant="outline" className="border-accent/10 text-accent font-black h-10 px-6 hidden md:block rounded-xl hover:bg-primary/5 text-sm">회원가입</Button></Link>
            </div>
          ) : (
            <Link href="/profile" className="hidden md:block">
              <div className="w-10 h-10 rounded-xl bg-primary/10 border border-white shadow-md flex items-center justify-center overflow-hidden hover:scale-105 transition-all">
                <img src={profile?.profilePictureUrl || `https://picsum.photos/seed/${user.uid}/100/100`} className="w-full h-full object-cover" alt="me" />
              </div>
            </Link>
          )}
        </div>
      </div>

      <nav className="border-t border-black/[0.02] hidden md:block bg-white/30 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-12 flex items-center gap-10">
          {navLinks.map((link) => (<Link key={link.href} href={link.href} className={cn("text-[14px] font-black transition-all h-full flex items-center border-b-[2px] border-transparent data-[state=active]:border-primary rounded-none px-1 tracking-tight", pathname === link.href ? "text-accent border-primary" : "text-accent/30 hover:text-accent")}>{link.name}</Link>))}
        </div>
      </nav>
    </header>
  )
}