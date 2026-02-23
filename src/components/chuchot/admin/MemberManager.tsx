
"use client"

import { useState, useMemo } from "react"
import { useFirestore, useCollection, useMemoFirebase, updateDocumentNonBlocking } from "@/firebase"
import { collection, query, doc, where } from "firebase/firestore"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AvatarIcon } from "@/components/chuchot/AvatarIcon"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { UserProfile, UserRole, Question } from "@/lib/types"
import { Sparkles, Search, Mail, Phone, Building2, Briefcase, Calendar, BarChart3, FileText, User, ExternalLink } from "lucide-react"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

interface UserDetailProps {
  user: UserProfile
  isOpen: boolean
  onClose: () => void
}

function MemberDetailDialog({ user, isOpen, onClose }: UserDetailProps) {
  const db = useFirestore()
  const questionsQuery = useMemoFirebase(() => 
    db ? query(collection(db, "questions"), where("userId", "==", user.id)) : null, 
    [db, user.id]
  )
  const { data: questionsData } = useCollection<Question>(questionsQuery)

  const userQuestions = useMemo(() => {
    if (!questionsData) return []
    return [...questionsData].sort((a, b) => b.createdAt - a.createdAt)
  }, [questionsData])

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl bg-white border-none rounded-[2.5rem] p-0 overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        <DialogHeader className="sr-only"><DialogTitle>회원 정보</DialogTitle></DialogHeader>
        
        <div className="bg-primary/5 p-10 flex items-center gap-6 shrink-0 border-b border-primary/5">
          <AvatarIcon src={user.profilePictureUrl} seed={user.username} className="w-20 h-20 border-2 border-white shadow-xl" />
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h2 className="text-2xl font-black text-accent">@{user.username}</h2>
              <Badge className="bg-accent text-white font-black border-none px-3 py-1 rounded-lg text-[10px]">{user.role.toUpperCase()}</Badge>
            </div>
            <p className="text-sm font-bold text-accent/40">{user.email}</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-10 space-y-10">
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-primary/5 p-6 rounded-2xl text-center">
              <p className="text-[10px] font-black text-accent/30 uppercase mb-1">활동 게시글</p>
              <p className="text-2xl font-black text-primary">{userQuestions.length}개</p>
            </div>
            <div className="bg-primary/5 p-6 rounded-2xl text-center">
              <p className="text-[10px] font-black text-accent/30 uppercase mb-1">가입 경과</p>
              <p className="text-2xl font-black text-primary">D+{Math.floor((Date.now() - new Date(user.registrationDate).getTime()) / (1000*60*60*24))}일</p>
            </div>
            <div className="bg-primary/5 p-6 rounded-2xl text-center">
              <p className="text-[10px] font-black text-accent/30 uppercase mb-1">전문가 점수</p>
              <p className="text-2xl font-black text-primary">{userQuestions.length * 100 + 500}pt</p>
            </div>
          </div>

          <section className="space-y-4">
            <h3 className="text-xs font-black text-accent/20 uppercase tracking-widest flex items-center gap-2"> 가입 프로필 상세</h3>
            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: User, label: "실명", value: user.name },
                { icon: Phone, label: "연락처", value: user.phoneNumber },
                { icon: Building2, label: "소속/부서", value: `${user.company} / ${user.department}` },
                { icon: Briefcase, label: "직함", value: user.jobTitle },
                { icon: Calendar, label: "가입일", value: new Date(user.registrationDate).toLocaleDateString() }
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-4 p-4 border border-accent/5 rounded-xl">
                  <div className="p-2 bg-accent/5 rounded-lg text-accent/30"><item.icon className="w-4 h-4" /></div>
                  <div>
                    <p className="text-[9px] font-black text-accent/20 uppercase">{item.label}</p>
                    <p className="text-sm font-bold text-accent">{item.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
        
        <div className="p-6 bg-accent/[0.02] border-t border-accent/5 flex justify-end">
          <Button onClick={onClose} className="bg-accent text-white font-black px-10 rounded-xl h-11">확인 완료</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function MemberManager() {
  const db = useFirestore()
  const { toast } = useToast()
  const [search, setSearch] = useState("")
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null)

  const usersQuery = useMemoFirebase(() => db ? collection(db, "users") : null, [db])
  const { data: usersData, isLoading } = useCollection<UserProfile>(usersQuery)

  const users = useMemo(() => {
    if (!usersData) return []
    return [...usersData].sort((a, b) => new Date(b.registrationDate).getTime() - new Date(a.registrationDate).getTime())
  }, [usersData])

  const filteredUsers = users.filter(u => 
    u.username.toLowerCase().includes(search.toLowerCase()) || 
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.company.toLowerCase().includes(search.toLowerCase())
  )

  const handleRoleChange = (userId: string, newRole: UserRole) => {
    if (!db) return
    updateDocumentNonBlocking(doc(db, "users", userId), { role: newRole })
    toast({ title: "권한 변경 완료", description: `사용자의 권한이 ${newRole}로 수정되었습니다.` })
  }

  return (
    <div className="space-y-6">
      <Card className="bg-white border-accent/5 shadow-sm rounded-[2.5rem] overflow-hidden">
        <CardHeader className="p-10 border-b border-accent/5 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <CardTitle className="text-2xl font-black text-accent">전문가 회원 명부</CardTitle>
            <p className="text-xs font-bold text-accent/30 mt-1">플랫폼 가입 전문가들의 활동 및 프로필 데이터</p>
          </div>
          <div className="relative w-full max-w-xs">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-accent/20" />
            <Input 
              placeholder="닉네임, 성함, 회사 검색..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-11 bg-accent/5 border-none h-12 rounded-xl text-sm font-bold placeholder:text-accent/20"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center py-32"><Sparkles className="w-10 h-10 animate-spin text-primary" /></div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-accent/[0.02]">
                  <TableRow className="border-accent/5">
                    <TableHead className="font-black text-accent/30 px-10 py-5">회원 식별</TableHead>
                    <TableHead className="font-black text-accent/30">소속 / 직함</TableHead>
                    <TableHead className="font-black text-accent/30">권한 관리</TableHead>
                    <TableHead className="font-black text-accent/30 text-right pr-10">액션</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((u) => (
                    <TableRow key={u.id} className="hover:bg-accent/[0.01] border-accent/5 transition-all">
                      <TableCell className="px-10 py-6">
                        <div className="flex items-center gap-4">
                          <AvatarIcon src={u.profilePictureUrl} seed={u.username} className="w-10 h-10 border-2 border-white shadow-md" />
                          <div>
                            <p className="font-black text-accent text-base">@{u.username}</p>
                            <p className="text-xs font-bold text-accent/30">{u.name} · {u.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="font-bold text-accent/70 text-sm">{u.company}</p>
                        <p className="text-[10px] text-primary font-black uppercase tracking-tighter">{u.jobTitle}</p>
                      </TableCell>
                      <TableCell>
                        <Select defaultValue={u.role} onValueChange={(val) => handleRoleChange(u.id, val as UserRole)}>
                          <SelectTrigger className={cn(
                            "w-28 border-none rounded-xl h-9 font-black text-[10px]",
                            u.role === 'admin' ? "bg-primary text-white" : u.role === 'mentor' ? "bg-accent text-white" : "bg-accent/5 text-accent/40"
                          )}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-white border-accent/10 rounded-xl">
                            <SelectItem value="member">일반 회원</SelectItem>
                            <SelectItem value="mentor">위스퍼러</SelectItem>
                            <SelectItem value="admin">관리자</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-right pr-10">
                        <Button 
                          onClick={() => setSelectedUser(u)}
                          variant="ghost" 
                          className="text-accent/40 font-black h-9 px-4 rounded-xl hover:bg-accent/5 hover:text-accent transition-all text-xs"
                        >
                          상세보기
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {selectedUser && <MemberDetailDialog user={selectedUser} isOpen={!!selectedUser} onClose={() => setSelectedUser(null)} />}
    </div>
  )
}
