import { MessageSquareText } from "lucide-react"

export function Logo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 group ${className}`}>
      <div className="relative">
        <div className="absolute inset-0 bg-primary/20 blur-lg rounded-full animate-pulse group-hover:bg-primary/40 transition-all duration-500"></div>
        <MessageSquareText className="w-8 h-8 text-primary relative logo-animation" />
      </div>
      <span className="font-headline text-2xl font-bold tracking-tighter text-primary group-hover:translate-x-0.5 transition-transform duration-300">
        CHUCHOT
      </span>
    </div>
  )
}