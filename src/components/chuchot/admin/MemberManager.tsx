"use client"

import { useState } from "react"
import { useFirestore, useCollection, useMemoFirebase, updateDocumentNonBlocking } from "@/firebase"
import { collection, query, orderBy, doc } from "firebase/firestore"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AvatarIcon } from "@/components/chuchot/AvatarIcon"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { UserProfile, UserRole } from "@/lib/types"
import { Sparkles, Search, Mail, ShieldCheck } from "lucide-react"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"

export function MemberManager() {
  const db = useFirestore()
  const { toast } = useToast()
  const [search, setSearch] = useState("")

  const usersQuery = useMemoFirebase(() => {
    if (!db) return null
    return query(collection(db, "users"), orderBy("registrationDate", "desc"))
  }, [db])

  const { data: users, isLoading } = useCollection<UserProfile>(usersQuery)

  const filteredUsers = (users || []).filter(u => 
    u.username.toLowerCase().includes(search.toLowerCase()) || 
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  )

  const handleRoleChange = (userId: string, newRole: UserRole) => {
    if (!db) return
    updateDocumentNonBlocking(doc(db, "users", userId), { role: newRole })
    toast({ title: "권한 변경 완료", description: `사용자의 권한이 ${newRole}로 업데이트되었습니다.` })
  }

  return (
    <div className="space-y-6">
      <Card className="bg-white border-none shadow-xl rounded-[2.5rem] overflow-hidden">
        <CardHeader className="p-8 border-b border-primary/5 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-2xl font-black text-primary">회원 리스트 관리</CardTitle>
            <p className="text-primary/30 text-sm font-bold">Whisper 플랫폼의 전체 전문가 회원을 관리합니다.</p>
          </div>
          <div className="relative max-w-xs group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/30" />
            <Input 
              placeholder="회원 검색..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-10 bg-primary/5 border-none h-11 rounded-xl text-sm"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center py-20"><Sparkles className="w-10 h-10 animate-spin text-accent" /></div>
          ) : (
            <Table>
              <TableHeader className="bg-primary/5">
                <TableRow>
                  <TableHead className="font-black text-primary/40 px-8 py-4">회원 정보</TableHead>
                  <TableHead className="font-black text-primary/40">소속 및 직함</TableHead>
                  <TableHead className="font-black text-primary/40">가입일</TableHead>
                  <TableHead className="font-black text-primary/40">권한 관리</TableHead>
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
                      <p className="text-xs text-accent font-black uppercase">{u.jobTitle}</p>
                    </TableCell>
                    <TableCell className="text-primary/30 text-xs font-bold">
                      {new Date(u.registrationDate).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Select defaultValue={u.role} onValueChange={(val) => handleRoleChange(u.id, val as UserRole)}>
                        <SelectTrigger className="w-32 bg-white border-primary/10 rounded-xl h-10 font-black text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="member">일반 회원</SelectItem>
                          <SelectItem value="mentor">위스퍼러 (멘토)</SelectItem>
                          <SelectItem value="admin">관리자</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
