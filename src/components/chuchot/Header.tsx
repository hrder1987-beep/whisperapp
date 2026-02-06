
"use client"

import { Logo } from "./Logo"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, User as UserIcon, LogOut, Settings, LayoutDashboard, Menu, X, Bell } from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useUser, useAuth } from "@/firebase"
import { signOut } from "firebase/auth"
import { cn } from "@/lib/utils"
import { useState } from "react"

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
  isAdminMode, 
  isCMSActive, 
  onToggleCMS, 
  onExitAdmin,
  onOpenAdminAuth
}: HeaderProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { user } = useUser()
  const auth = useAuth()
  const [searchQuery, setSearchQuery] = useState("")

  const handleLogout = () => {
    signOut(auth)
    router.push("/")
  }

  const navLinks = [
    { name: "지식 속삭임", href: "/" },
    { name: "교육 프로그램", href: "/programs" },
    { name: "강사 정보", href: "/instructors" },
  ]

  return (
    <header className="sticky top-0 z-50 w-full premium-gradient border-b border-white/10 shadow-xl">
      <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between gap-6">
        <div className="flex items-center gap-8">
          <Link href="/">
            <Logo isLight />
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
            placeholder="검색어를 입력하세요..." 
            className="pl-11 pr-10 bg-white/10 border-none focus-visible:ring-accent/50 h-10 rounded-full text-xs text-white placeholder:text-white/40"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              onSearch?.(e.target.value)
            }}
          />
        </div>

        <div className="flex items-center gap-2">
          {isAdminMode && onToggleCMS && (
            <Button 
              variant={isCMSActive ? "default" : "outline"} 
              size="sm" 
              onClick={onToggleCMS}
              className={cn(
                "h-9 rounded-xl font-black text-[11px] gap-2 hidden sm:flex",
                isCMSActive ? "bg-accent text-primary" : "border-white/20 text-white"
              )}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              CMS EDIT
            </Button>
          )}

          {user ? (
            <div className="flex items-center gap-2">
              <Link href="/profile">
                <Button variant="ghost" size="sm" className="text-white hover:text-accent hover:bg-white/5 font-bold gap-2">
                  <UserIcon className="w-4 h-4" />
                  <span className="hidden sm:inline">내 정보</span>
                </Button>
              </Link>
              <Button variant="ghost" size="icon" onClick={handleLogout} className="text-white/70 hover:text-red-400">
                <LogOut className="w-5 h-5" />
              </Button>
            </div>
          ) : (
            <Link href="/auth">
              <Button size="sm" className="bg-accent text-primary font-black hover:bg-accent/90 rounded-xl px-5">
                로그인 / 가입
              </Button>
            </Link>
          )}

          {!isAdminMode && onOpenAdminAuth && (
             <Button variant="ghost" size="icon" onClick={onOpenAdminAuth} className="text-white/30 hover:text-accent">
                <Settings className="w-4 h-4" />
             </Button>
          )}
          
          {isAdminMode && onExitAdmin && (
            <Button variant="outline" size="sm" onClick={onExitAdmin} className="h-8 border-accent/30 text-accent text-[10px] font-black hover:bg-accent/10">
              ADMIN EXIT
            </Button>
          )}
        </div>
      </div>
    </header>
  )
}
