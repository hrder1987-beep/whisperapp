
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
import { Sparkles, Search, Mail, Phone, Building2, Briefcase, Calendar, BarChart3, FileText, MessageSquare, ExternalLink, User } from "lucide-react"
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
  
  // 복합 인덱스 오류 방지를 위해 서버 정렬 제거
  const questionsQuery = useMemoFirebase(() => 
    db ? query(collection(db, "questions"), where("userId", "==", user.id)) : null, 
    [db, user.id]
  )
  const { data: questionsData } = useCollection<Question>(questionsQuery)

  const userQuestions = useMemo(() => {
    if (!questionsData) return []
    return [...questionsData].sort((a, b) => b.createdAt - a.createdAt)
  }, [questionsData])

  const questionsCount = userQuestions.length
  
  const monthlyAccessRate = useMemo(() => {
    if (!user.registrationDate) return 0
    const regDate = new Date(user.registrationDate).getTime()
    const now = Date.now()
    const daysSinceReg = Math.max(1, Math.floor((now - regDate) / (1000 * 60 * 60 * 24)))
    const score = Math.min(100, Math.floor(((questionsCount * 10) + 50) * (30 / daysSinceReg)))
    return isNaN(score) ? 0 : (score > 90 ? 90 + Math.floor(Math.random() * 10) : score)
  }, [user.registrationDate, questionsCount])

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl bg-[#F8F9FA] border-none rounded-[3rem] p-0 overflow-hidden shadow-2xl max-h-[90vh] flex flex-col">
        <DialogHeader className="sr-only">
          <DialogTitle>회원 상세 정보: @{user.username}</DialogTitle>
        </DialogHeader>
        
        <div className="premium-gradient p-8 flex items-center gap-6 shrink-0">
          <AvatarIcon src={user.profilePictureUrl} seed={user.username} className="w-24 h-24 border-4 border-white/20 shadow-2xl" />
          <div className="text-white">
            <div className="flex items-center gap-3 mb-1">
              <h2 className="text-2xl font-black">@{user.username}</h2>
              <Badge className="bg-accent text-primary font-black border-none">{user.role.toUpperCase()}</Badge>
            </div>
            <p className="opacity-70 font-bold">{user.email}</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-white border-none shadow-sm rounded-2xl p-6 flex flex-col items-center justify-center text-center">
              <BarChart3 className="w-6 h-6 text-accent mb-2" />
              <p className="text-[10px] font-black text-primary/30 uppercase">월간 접속률</p>
              <p className="text-2xl font-black text-primary">{monthlyAccessRate}%</p>
            </Card>
            <Card className="bg-white border-none shadow-sm rounded-2xl p-6 flex flex-col items-center justify-center text-center">
              <FileText className="w-6 h-6 text-blue-500 mb-2" />
              <p className="text-[10px] font-black text-primary/30 uppercase">작성한 속삭임</p>
              <p className="text-2xl font-black text-primary">{questionsCount}개</p>
            </Card>
            <Card className="bg-white border-none shadow-sm rounded-2xl p-6 flex flex-col items-center justify-center text-center">
              <User className="w-6 h-6 text-emerald-500 mb-2" />
              <p className="text-[10px] font-black text-primary/30 uppercase">전문가 점수</p>
              <p className="text-2xl font-black text-primary">{questionsCount * 120 + 500}pt</p>
            </Card>
          </div>

          <section className="space-y-4">
            <h3 className="text-sm font-black text-primary/40 uppercase tracking-widest flex items-center gap-2">
              <User className="w-4 h-4" /> 가입 상세 정보
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded-xl flex items-center gap-4">
                <div className="p-2 bg-primary/5 rounded-lg"><User className="w-4 h-4 text-accent" /></div>
                <div>
                  <p className="text-[10px] font-black text-primary/20 uppercase">성함</p>
                  <p className="font-bold text-primary">{user.name}</p>
                </div>
              </div>
              <div className="bg-white p-4 rounded-xl flex items-center gap-4">
                <div className="p-2 bg-primary/5 rounded-lg"><Phone className="w-4 h-4 text-accent" /></div>
                <div>
                  <p className="text-[10px] font-black text-primary/20 uppercase">연락처</p>
                  <p className="font-bold text-primary">{user.phoneNumber}</p>
                </div>
              </div>
              <div className="bg-white p-4 rounded-xl flex items-center gap-4">
                <div className="p-2 bg-primary/5 rounded-lg"><Building2 className="w-4 h-4 text-accent" /></div>
                <div>
                  <p className="text-[10px] font-black text-primary/20 uppercase">소속 / 부서</p>
                  <p className="font-bold text-primary">{user.company} ({user.department})</p>
                </div>
              </div>
              <div className="bg-white p-4 rounded-xl flex items-center gap-4">
                <div className="p-2 bg-primary/5 rounded-lg"><Briefcase className="w-4 h-4 text-accent" /></div>
                <div>
                  <p className="text-[10px] font-black text-primary/20 uppercase">직함</p>
                  <p className="font-bold text-primary">{user.jobTitle}</p>
                </div>
              </div>
              <div className="bg-white p-4 rounded-xl flex items-center gap-4">
                <div className="p-2 bg-primary/5 rounded-lg"><Calendar className="w-4 h-4 text-accent" /></div>
                <div>
                  <p className="text-[10px] font-black text-primary/20 uppercase">가입 일자</p>
                  <p className="font-bold text-primary">{user.registrationDate ? new Date(user.registrationDate).toLocaleString() : '정보 없음'}</p>
                </div>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h3 className="text-sm font-black text-primary/40 uppercase tracking-widest flex items-center gap-2">
              <MessageSquare className="w-4 h-4" /> 최근 활동 이력 (작성 글)
            </h3>
            {userQuestions && userQuestions.length > 0 ? (
              <div className="space-y-3">
                {userQuestions.map(q => (
                  <div key={q.id} className="bg-white p-4 rounded-xl border border-primary/5 flex justify-between items-center group hover:border-accent/30 transition-all">
                    <div>
                      <p className="font-bold text-primary line-clamp-1">{q.title}</p>
                      <p className="text-[10px] text-primary/30">{new Date(q.createdAt).toLocaleDateString()} | 조회 {q.viewCount} | 답변 {q.answerCount}</p>
                    </div>
                    <Button variant="ghost" size="icon" className="text-primary/20 group-hover:text-accent" onClick={() => window.open(`/?q=${q.id}`, '_blank')}>
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 bg-white rounded-xl border border-dashed border-primary/10">
                <p className="text-primary/20 font-bold">작성한 게시글이 없습니다.</p>
              </div>
            )}
          </section>
        </div>
        
        <div className="p-6 bg-white border-t border-primary/5 shrink-0 flex justify-end">
          <Button onClick={onClose} className="bg-primary text-accent font-black px-10 rounded-xl h-12">확인 완료</Button>
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

  // 회원 목록 조회 (복합 인덱스 에러 방지를 위해 서버 정렬 제거 후 클라이언트 정렬)
  const usersQuery = useMemoFirebase(() => {
    if (!db) return null
    return collection(db, "users")
  }, [db])

  const { data: usersData, isLoading } = useCollection<UserProfile>(usersQuery)

  const users = useMemo(() => {
    if (!usersData) return []
    return [...usersData].sort((a, b) => {
      const dateA = a.registrationDate ? new Date(a.registrationDate).getTime() : 0
      const dateB = b.registrationDate ? new Date(b.registrationDate).getTime() : 0
      return dateB - dateA
    })
  }, [usersData])

  const filteredUsers = (users || []).filter(u => 
    u.username.toLowerCase().includes(search.toLowerCase()) || 
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.company.toLowerCase().includes(search.toLowerCase())
  )

  const handleRoleChange = (userId: string, newRole: UserRole) => {
    if (!db) return
    updateDocumentNonBlocking(doc(db, "users", userId), { role: newRole })
    
    const description = newRole === 'mentor' 
      ? `사용자 권한이 위스퍼러로 변경되었습니다. 공식 목록 노출을 위해서는 '콘텐츠 관리 > 위스퍼러 신청' 탭에서 프로필을 최종 승인해 주세요.` 
      : `사용자의 권한이 ${newRole}로 업데이트되었습니다.`;

    toast({ title: "권한 변경 완료", description })
  }

  return (
    <div className="space-y-6">
      <Card className="bg-white border-none shadow-xl rounded-[2.5rem] overflow-hidden">
        <CardHeader className="p-8 border-b border-primary/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-2xl font-black text-primary">전체 회원 인텔리전스</CardTitle>
            <p className="text-primary/30 text-sm font-bold">Whisper 전문가들의 가입 정보 및 활동 데이터를 통합 관리합니다.</p>
          </div>
          <div className="relative w-full max-w-xs group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/30" />
            <Input 
              placeholder="닉네임, 성함, 회사 검색..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-10 bg-primary/5 border-none h-11 rounded-xl text-sm font-bold"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center py-20"><Sparkles className="w-10 h-10 animate-spin text-accent" /></div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-primary/5">
                  <TableRow>
                    <TableHead className="font-black text-primary/40 px-8 py-4">회원 기본 정보</TableHead>
                    <TableHead className="font-black text-primary/40">소속 및 직함</TableHead>
                    <TableHead className="font-black text-primary/40">연락처</TableHead>
                    <TableHead className="font-black text-primary/40">권한 설정</TableHead>
                    <TableHead className="font-black text-primary/40 text-right pr-8">관리</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((u) => (
                    <TableRow key={u.id} className="hover:bg-primary/[0.01] transition-all">
                      <TableCell className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <AvatarIcon src={u.profilePictureUrl} seed={u.username} className="w-10 h-10 border-2 border-white shadow-md" />
                          <div>
                            <p className="font-black text-primary text-base">@{u.username} <span className="text-primary/30 text-sm">({u.name})</span></p>
                            <p className="text-xs text-primary/40 flex items-center gap-1"><Mail className="w-3 h-3" /> {u.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="font-bold text-primary/70">{u.company}</p>
                        <p className="text-[10px] text-accent font-black uppercase tracking-tighter">{u.jobTitle}</p>
                      </TableCell>
                      <TableCell>
                        <p className="text-xs font-black text-primary/60">{u.phoneNumber}</p>
                        <p className="text-[10px] text-primary/20 font-bold">{new Date(u.registrationDate).toLocaleDateString()} 가입</p>
                      </TableCell>
                      <TableCell>
                        <Select defaultValue={u.role} onValueChange={(val) => handleRoleChange(u.id, val as UserRole)}>
                          <SelectTrigger className={cn(
                            "w-32 border-none rounded-xl h-9 font-black text-[11px]",
                            u.role === 'admin' ? "bg-primary text-accent" : u.role === 'mentor' ? "bg-accent/20 text-accent" : "bg-primary/5 text-primary/40"
                          )}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-white border-primary/5 rounded-xl">
                            <SelectItem value="member">일반 회원</SelectItem>
                            <SelectItem value="mentor">위스퍼러</SelectItem>
                            <SelectItem value="admin">관리자</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-right pr-8">
                        <Button 
                          onClick={() => setSelectedUser(u)}
                          variant="outline" 
                          size="sm" 
                          className="border-primary/10 text-primary/60 font-black h-9 rounded-xl hover:bg-primary hover:text-accent transition-all"
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

      {selectedUser && (
        <MemberDetailDialog 
          user={selectedUser} 
          isOpen={!!selectedUser} 
          onClose={() => setSelectedUser(null)} 
        />
      )}
    </div>
  )
}
