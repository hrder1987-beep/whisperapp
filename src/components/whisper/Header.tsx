"use client"

import { Logo } from "./Logo"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, User as UserIcon, Menu, Mail, ShieldCheck, FileText, Bell, Sparkles, LogOut } from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useUser, useAuth, useCollection, useMemoFirebase, useFirestore, useDoc } from "@/firebase"
import { signOut } from "firebase/auth"
import { collection, query, where, doc } from "firebase/firestore"
import { cn } from "@/lib/utils"
import { useState, KeyboardEvent, useEffect } from "react"
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

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

  useEffect(() => {
    setIsMounted(true)
  }, [])

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

  const handleLogout = () => { 
    if (auth) {
      signOut(auth).then(() => {
        router.push("/");
      });
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const targetUrl = `/?search=${encodeURIComponent(searchQuery)}`
      if (pathname === '/') {
        onSearch?.(searchQuery)
        router.push(targetUrl, { scroll: false })
      } else {
        router.push(targetUrl)
      }
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

  if (!isMounted) return <header className="h-16 md:h-20 bg-white/80 backdrop-blur-md sticky top-0 z-50" />

  return (
    <header className="bg-white/80 backdrop-blur-md sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16 md:h-20">
          
          <div className="flex items-center gap-4 lg:gap-8">
             <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" className="md:hidden text-gray-600 -ml-2">
                    <Menu className="w-6 h-6" />
                    </Button>
                </SheetTrigger>
                <SheetContent side="left" className="bg-white border-r-0 p-0 w-[80vw] max-w-[320px] shadow-2xl">
                    <div className="flex flex-col h-full pt-8 px-4">
                        <div className="px-4 mb-8"><Logo /></div>
                        <nav className="flex flex-col gap-1">
                        {isAdmin && (
                            <Button asChild className="bg-accent text-primary font-bold rounded-lg h-12 mb-4 shadow-md">
                            <Link href="/admin" onClick={() => setIsMobileMenuOpen(false)}>
                                <ShieldCheck className="w-4 h-4 mr-2" /> 관리자 센터
                            </Link>
                            </Button>
                        )}
                        {navLinks.map((link) => (
                            <Link key={link.href} href={link.href} onClick={() => setIsMobileMenuOpen(false)} className={cn("text-base font-bold py-3 px-4 rounded-lg transition-colors", pathname === link.href ? "bg-primary/10 text-primary" : "text-gray-600 hover:bg-gray-100")}>{link.name}</Link>
                        ))}
                        <div className="h-px bg-gray-200 my-4" />
                        {user ? (
                            <div className="flex flex-col gap-1">
                            <Link href="/my-posts" onClick={() => setIsMobileMenuOpen(false)} className="text-sm font-semibold py-3 text-gray-500 flex items-center gap-3 px-4"><FileText className="w-4 h-4 text-gray-400" /> 내가 쓴 글</Link>
                            <Link href="/profile" onClick={() => setIsMobileMenuOpen(false)} className="text-sm font-semibold py-3 text-gray-500 flex items-center gap-3 px-4"><UserIcon className="w-4 h-4 text-gray-400" /> 내 프로필</Link>
                            <Link href="/notifications" onClick={() => setIsMobileMenuOpen(false)} className="text-sm font-semibold py-3 text-gray-500 flex items-center gap-3 px-4"><Bell className="w-4 h-4 text-gray-400" /> 알림</Link>
                            <button onClick={handleLogout} className="text-left text-sm font-bold py-3 px-4 text-red-500 mt-4 flex items-center gap-3"><LogOut className="w-4 h-4" /> 로그아웃</button>
                            </div>
                        ) : (
                            <Link href="/auth?mode=login" onClick={() => setIsMobileMenuOpen(false)} className="text-base font-bold py-3 px-4 bg-accent text-white rounded-lg text-center shadow-md flex items-center justify-center gap-2 mt-4"><Sparkles className="w-4 h-4" /> 시작하기</Link>
                        )}
                        </nav>
                    </div>
                </SheetContent>
            </Sheet>
            <Link href="/" className="flex-shrink-0"><Logo /></Link>
            <nav className="hidden md:flex items-center gap-2 lg:gap-3">
                {navLinks.map((link) => (
                <Link 
                    key={link.href} 
                    href={link.href} 
                    className={cn(
                    "py-2 px-4 rounded-lg text-sm transition-colors font-bold", 
                    pathname === link.href 
                        ? "bg-accent text-primary shadow-sm" 
                        : "text-gray-500 hover:bg-gray-100 hover:text-gray-800"
                    )}
                >
                    {link.name}
                </Link>
                ))}
            </nav>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="relative w-40 sm:w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 peer-focus:text-gray-700" />
              <Input 
                placeholder="검색"
                className="peer h-10 w-full rounded-lg bg-gray-100 border-transparent pl-9 pr-3 text-sm font-semibold placeholder:text-gray-500 focus:bg-white focus:border-primary/50 shadow-inner"
                value={searchQuery} 
                onChange={(e) => setSearchQuery(e.target.value)} 
                onKeyDown={handleKeyDown} 
              />
            </div>

            {!user ? (
              <div className="hidden md:flex items-center gap-2">
                <Link href="/auth?mode=login"><Button className="bg-primary text-accent h-10 px-5 text-sm font-bold shadow-sm">로그인</Button></Link>
                <Link href="/auth?mode=signup"><Button variant="outline" className="border-gray-200 text-gray-700 h-10 px-5 text-sm font-bold">회원가입</Button></Link>
              </div>
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="relative w-9 h-9 md:w-10 md:h-10 rounded-full bg-gray-100 border-2 border-white shadow-sm overflow-hidden hover:ring-2 hover:ring-primary/50 transition-all">
                    <img src={profile?.profilePictureUrl || `https://api.dicebear.com/8.x/initials/svg?seed=${user.uid}`} className="w-full h-full object-cover" alt="profile" />
                    {(unreadMessages?.length || 0 + unreadNotifs?.length || 0) > 0 && (
                       <span className="absolute top-0 right-0 block h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white" />
                    )}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 mt-2 bg-white border-gray-100 shadow-lg rounded-xl p-1.5">
                  <div className="px-2.5 py-2 mb-1">
                    <p className="text-xs font-bold text-gray-400">@{profile?.username || "전문가"}님</p>
                  </div>
                  <DropdownMenuSeparator className="bg-gray-100 mx-1.5" />
                    <DropdownMenuItem asChild className="rounded-lg py-2 px-2.5 font-semibold text-sm text-gray-700 focus:bg-gray-100 cursor-pointer">
                    <Link href="/profile" className="flex items-center gap-2"><UserIcon className="w-4 h-4" /> 내 프로필</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="rounded-lg py-2 px-2.5 font-semibold text-sm text-gray-700 focus:bg-gray-100 cursor-pointer">
                    <Link href="/my-posts" className="flex items-center gap-2"><FileText className="w-4 h-4" /> 내가 쓴 글</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="rounded-lg py-2 px-2.5 font-semibold text-sm text-gray-700 focus:bg-gray-100 cursor-pointer">
                        <Link href="/notifications" className="flex items-center gap-2 justify-between w-full">
                            <span><Bell className="w-4 h-4 inline-block mr-2"/>알림</span>
                            {unreadNotifs && unreadNotifs.length > 0 && <Badge className="bg-primary text-accent h-5 px-1.5 text-xs font-bold rounded-full">{unreadNotifs.length}</Badge>}
                        </Link>
                    </DropdownMenuItem>
                     <DropdownMenuItem asChild className="rounded-lg py-2 px-2.5 font-semibold text-sm text-gray-700 focus:bg-gray-100 cursor-pointer">
                        <Link href="/messages" className="flex items-center gap-2 justify-between w-full">
                            <span><Mail className="w-4 h-4 inline-block mr-2"/>메시지</span>
                            {unreadMessages && unreadMessages.length > 0 && <Badge className="bg-primary text-accent h-5 px-1.5 text-xs font-bold rounded-full">{unreadMessages.length}</Badge>}
                        </Link>
                    </DropdownMenuItem>
                  {isAdmin && <DropdownMenuSeparator className="bg-gray-100 mx-1.5" />}
                  {isAdmin && <DropdownMenuItem asChild className="rounded-lg py-2 px-2.5 font-semibold text-sm text-gray-700 focus:bg-gray-100 cursor-pointer">
                    <Link href="/admin" className="flex items-center gap-2"><ShieldCheck className="w-4 h-4" /> 관리자 센터</Link>
                    </DropdownMenuItem>}
                  <DropdownMenuSeparator className="bg-gray-100 mx-1.5" />
                  <DropdownMenuItem onClick={handleLogout} className="rounded-lg py-2 px-2.5 font-semibold text-sm text-red-500 focus:bg-red-50 cursor-pointer flex items-center gap-2">
                    <LogOut className="w-4 h-4" /> 로그아웃
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
