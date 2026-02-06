import { MessageSquareText } from "lucide-react"

export function Logo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 group ${className} cursor-pointer`}>
      <div className="relative">
        <div className="absolute inset-0 bg-accent/20 blur-lg rounded-full animate-pulse group-hover:bg-accent/40 transition-all duration-500"></div>
        <MessageSquareText className="w-8 h-8 text-accent relative logo-animation" />
      </div>
      <div className="flex flex-col -space-y-1">
        <span className="font-headline text-2xl font-black tracking-tighter text-primary group-hover:text-accent transition-colors duration-300">
          CHUCHOT
        </span>
        <span className="text-[9px] font-bold tracking-[0.2em] text-accent/80 uppercase ml-0.5">
          Premium Anonymous
        </span>
      </div>
    </div>
  )
}
