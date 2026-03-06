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

  if (!isMounted) return <header className="naver-header h-16 md:h-24" />

  return (
    <header className="naver-header shadow-[0_4px_30px_rgba(0,0,0,0.02)] border-none">
      <div className="bg-[#F7FAF2]/50 border-b border-black/[0.01] hidden md:block">
        <div className="max-w-7xl mx-auto px-6 h-10 flex items-center justify-end gap-8 text-[11px] font-black text-accent/30 uppercase tracking-widest">
          {user ? (
            <>
              <Link href="/profile" className="hover:text-accent transition-all flex items-center gap-2"><UserIcon className="w-3 h-3" /> My Profile</Link>
              <Link href="/my-posts" className="hover:text-accent transition-all flex items-center gap-2"><FileText className="w-3 h-3" /> My Activity</Link>
              <button onClick={handleLogout} className="hover:text-red-500 transition-all font-black">Sign Out</button>
            </>
          ) : (
            <>
              <Link href="/auth?mode=login" className="hover:text-accent transition-all">Member Login</Link>
              <Link href="/auth?mode=signup" className="hover:text-accent transition-all">Registration</Link>
            </>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 md:h-[88px] flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 md:gap-10">
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild><Button variant="ghost" size="icon" className="md:hidden text-accent -ml-2 hover:bg-primary/10 rounded-full transition-all active:scale-90"><Menu className="w-7 h-7" /></Button></SheetTrigger>
            <SheetContent side="left" className="bg-white border-none p-0 w-[320px] shadow-4xl">
              <SheetHeader className="sr-only"><SheetTitle>메뉴</SheetTitle></SheetHeader>
              <div className="flex flex-col h-full pt-16 px-8">
                <Logo className="mb-16 scale-110 origin-left" />
                <nav className="flex flex-col gap-3">
                  {navLinks.map((link) => (
                    <Link key={link.href} href={link.href} onClick={() => setIsMobileMenuOpen(false)} className={cn("text-lg font-black py-4 px-6 rounded-2xl transition-all", pathname === link.href ? "bg-primary text-accent shadow-lg" : "text-accent/60 hover:bg-primary/10 hover:text-accent")}>{link.name}</Link>
                  ))}
                  <div className="h-px bg-black/[0.04] my-8" />
                  {user ? (
                    <div className="flex flex-col gap-3">
                      {isAdmin && <Button asChild className="bg-accent text-primary font-black rounded-2xl h-14 mb-4 shadow-xl"><Link href="/admin"><ShieldCheck className="w-5 h-5 mr-2" /> Platform Admin</Link></Button>}
                      <Link href="/profile" onClick={() => setIsMobileMenuOpen(false)} className="text-sm font-bold py-3.5 px-6 text-accent/60 flex items-center gap-3"><UserIcon className="w-4 h-4 opacity-30" /> 내 정보</Link>
                      <Link href="/notifications" onClick={() => setIsMobileMenuOpen(false)} className="text-sm font-bold py-3.5 px-6 text-accent/60 flex items-center gap-3"><Bell className="w-4 h-4 opacity-30" /> 알림 센터</Link>
                      <button onClick={handleLogout} className="text-left text-sm font-black py-3.5 px-6 text-red-400 mt-4">로그아웃</button>
                    </div>
                  ) : (
                    <Link href="/auth?mode=login" onClick={() => setIsMobileMenuOpen(false)} className="text-lg font-black py-5 px-6 bg-accent text-primary rounded-[1.5rem] text-center shadow-2xl flex items-center justify-center gap-3 mt-4"><Sparkles className="w-5 h-5" /> 로그인 / 회원가입</Link>
                  )}
                </nav>
              </div>
            </SheetContent>
          </Sheet>
          <Link href="/"><Logo className="scale-95 md:scale-125" /></Link>
        </div>

        <div className="hidden md:flex flex-1 max-w-2xl px-10">
          <div className="naver-search-bar w-full h-14 shadow-xl group">
            <Input 
              placeholder="궁금한 HR 지식과 사례를 검색하세요" 
              className="border-none shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 text-[16px] font-black h-full placeholder:text-accent/10 bg-transparent px-4 outline-none !px-0" 
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)} 
              onKeyDown={handleKeyDown} 
            />
            <button onClick={() => onSearch?.(searchQuery)} className="text-accent/30 group-focus-within:text-accent hover:scale-110 transition-all pl-4 pr-2"><Search className="w-6 h-6" /></button>
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-6">
          <div className="hidden md:flex items-center gap-4">
            {isAdmin && <Button asChild variant="outline" size="sm" className="border-accent/10 text-accent font-black h-11 px-6 gap-2 rounded-xl hover:bg-primary/10 transition-all shadow-sm"><Link href="/admin"><ShieldCheck className="w-4 h-4" /> 관리</Link></Button>}
            {user && (
              <div className="flex items-center gap-2.5">
                <Link href="/notifications"><Button variant="ghost" size="icon" className="relative text-accent/40 hover:text-accent hover:bg-primary/10 h-11 w-11 rounded-xl transition-all"><Bell className="w-5.5 h-5.5" />{unreadNotifs && unreadNotifs.length > 0 && (<Badge className="absolute -top-1 -right-1 bg-red-500 text-white border-none h-4.5 w-4.5 p-0 flex items-center justify-center text-[8px] rounded-full font-black animate-bounce shadow-lg">{unreadNotifs.length}</Badge>)}</Button></Link>
                <Link href="/messages"><Button variant="ghost" size="icon" className="relative text-accent/40 hover:text-accent hover:bg-primary/10 h-11 w-11 rounded-xl transition-all"><Mail className="w-5.5 h-5.5" />{unreadMessages && unreadMessages.length > 0 && (<Badge className="absolute -top-1 -right-1 bg-red-500 text-white border-none h-4.5 w-4.5 p-0 flex items-center justify-center text-[8px] rounded-full font-black animate-bounce shadow-lg">{unreadMessages.length}</Badge>)}</Button></Link>
              </div>
            )}
          </div>
          {!user ? (
            <Link href="/auth?mode=login"><Button className="naver-button h-11 px-10 hidden md:block shadow-2xl text-sm transition-transform hover:scale-105">로그인</Button></Link>
          ) : (
            <Link href="/profile" className="hidden md:block">
              <div className="w-11 h-11 rounded-xl bg-primary/10 border-2 border-white shadow-xl flex items-center justify-center overflow-hidden hover:scale-110 transition-all">
                <img src={profile?.profilePictureUrl || "https://picsum.photos/seed/user/100/100"} className="w-full h-full object-cover" alt="me" />
              </div>
            </Link>
          )}
        </div>
      </div>

      <nav className="border-t border-black/[0.02] hidden md:block bg-white/30 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center gap-12">
          {navLinks.map((link) => (<Link key={link.href} href={link.href} className={cn("text-[15px] font-black transition-all h-full flex items-center border-b-[3px] border-transparent data-[state=active]:border-primary rounded-none px-1 pt-1 tracking-tight", pathname === link.href ? "text-accent border-primary" : "text-accent/30 hover:text-accent")}>{link.name}</Link>))}
        </div>
      </nav>
    </header>
  )
}