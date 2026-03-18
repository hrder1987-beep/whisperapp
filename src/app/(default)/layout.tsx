"use client";

import { Header } from "@/components/whisper/Header";
import { Sparkles, MessageSquare, Compass, GraduationCap, Briefcase, Bot } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const navItems = [
    { href: "/", icon: MessageSquare, label: "피드" },
    { href: "/gatherings", icon: Compass, label: "모임" },
    { href: "/programs", icon: GraduationCap, label: "프로그램" },
    { href: "/instructors", icon: Briefcase, label: "강사" },
    { href: "/chat", icon: Bot, label: "챗봇" },
];

function MobileNav() {
    const pathname = usePathname();

    return (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 h-[72px] bg-white/90 backdrop-blur-md border-t border-black/[0.04] z-50 flex justify-around items-center shadow-top">
            {navItems.map(({ href, icon: Icon, label }) => {
                const isActive = (href === "/" && pathname === "/") || (href !== "/" && pathname.startsWith(href));
                return (
                    <Link key={href} href={href} className="flex flex-col items-center justify-center gap-1 w-16">
                        <Icon className={cn("w-6 h-6 transition-all", isActive ? "text-primary" : "text-accent/40")} strokeWidth={isActive ? 2.5 : 2} />
                        <span className={cn("text-[10px] font-black transition-all", isActive ? "text-primary" : "text-accent/40")}>
                            {label}
                        </span>
                    </Link>
                );
            })}
        </nav>
    );
}

export default function DefaultLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex flex-col min-h-screen bg-gray-50/50">
            <Header />
            <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 md:py-8">
                {children}
            </main>
            <MobileNav />
            <div className="pb-20 md:pb-0"></div>
        </div>
    );
}
