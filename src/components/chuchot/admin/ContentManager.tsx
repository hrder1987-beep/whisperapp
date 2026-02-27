
"use client"

import { useState, useMemo, useEffect } from "react"
import { useFirestore, useCollection, useMemoFirebase, deleteDocumentNonBlocking, updateDocumentNonBlocking } from "@/firebase"
import { collection, query, doc } from "firebase/firestore"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Trash2, MessageSquare, Briefcase, GraduationCap, Award, Check, UserCheck, AlertCircle, CheckSquare, Square, RefreshCcw } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Question, JobListing, TrainingProgram, Instructor } from "@/lib/types"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export function ContentManager() {
  const db = useFirestore()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("q")
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [isDeleting, setIsDeleting] = useState(false)

  const questionsQuery = useMemoFirebase(() => db ? collection(db, "questions") : null, [db])
  const jobsQuery = useMemoFirebase(() => db ? collection(db, "jobs") : null, [db])
  const programsQuery = useMemoFirebase(() => db ? collection(db, "trainingPrograms") : null, [db])
  const mentorsQuery = useMemoFirebase(() => db ? collection(db, "mentors") : null, [db])

  const { data: questionsData } = useCollection<Question>(questionsQuery)
  const { data: jobsData } = useCollection<JobListing>(jobsQuery)
  const { data: programsData } = useCollection<TrainingProgram>(programsQuery)
  const { data: mentorsData } = useCollection<Instructor>(mentorsQuery)

  const questions = useMemo(() => (questionsData || []).sort((a, b) => b.createdAt - a.createdAt), [questionsData])
  const jobs = useMemo(() => (jobsData || []).sort((a, b) => b.createdAt - a.createdAt), [jobsData])
  const programs = useMemo(() => (programsData || []).sort((a, b) => b.createdAt - a.createdAt), [programsData])
  const mentors = useMemo(() => (mentorsData || []).sort((a, b) => b.createdAt - a.createdAt), [mentorsData])

  useEffect(() => {
    setSelectedIds([])
  }, [activeTab])

  const currentList = useMemo(() => {
    if (activeTab === "q") return questions;
    if (activeTab === "j") return jobs;
    if (activeTab === "p") return programs;
    if (activeTab === "m") return mentors;
    return [];
  }, [activeTab, questions, jobs, programs, mentors]);

  const currentCollection = useMemo(() => {
    if (activeTab === "q") return "questions";
    if (activeTab === "j") return "jobs";
    if (activeTab === "p") return "trainingPrograms";
    if (activeTab === "m") return "mentors";
    return "";
  }, [activeTab]);

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }

  const toggleSelectAll = () => {
    if (selectedIds.length === currentList.length && currentList.length > 0) {
      setSelectedIds([])
    } else {
      setSelectedIds(currentList.map(item => item.id))
    }
  }

  const handleDelete = (col: string, id: string) => {
    if (!db || !window.confirm("이 데이터를 영구적으로 삭제하시겠습니까?")) return
    deleteDocumentNonBlocking(doc(db, col, id))
    toast({ title: "삭제 완료", description: "성공적으로 처리되었습니다." })
  }

  const handleBulkDelete = () => {
    if (!db || !currentCollection || selectedIds.length === 0) return
    
    const confirmMessage = `선택한 ${selectedIds.length}개의 항목을 일괄 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`
    if (!window.confirm(confirmMessage)) return

    setIsDeleting(true)
    try {
      selectedIds.forEach(id => {
        deleteDocumentNonBlocking(doc(db, currentCollection, id))
      })
      toast({ 
        title: "일괄 삭제 완료", 
        description: `${selectedIds.length}개의 데이터가 성공적으로 제거되었습니다.` 
      })
      setSelectedIds([])
    } catch (e) {
      toast({ title: "오류 발생", description: "삭제 중 문제가 발생했습니다.", variant: "destructive" })
    } finally {
      setIsDeleting(false)
    }
  }

  const handleApproveMentor = (mentor: Instructor) => {
    if (!db || !window.confirm(`${mentor.name} 전문가님을 공식 위스퍼러로 승인하시겠습니까?`)) return
    updateDocumentNonBlocking(doc(db, "mentors", mentor.id), { isVerified: true })
    updateDocumentNonBlocking(doc(db, "users", mentor.userId), { role: "mentor" })
    toast({ title: "위스퍼러 승인 완료", description: "공식 뱃지가 부여되었습니다." })
  }

  return (
    <Card className="bg-white border-accent/5 shadow-sm rounded-[2.5rem] overflow-hidden">
      <CardContent className="p-0">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="bg-accent/[0.02] border-b border-accent/5">
            <TabsList className="w-full justify-start gap-10 px-10 h-16 bg-transparent rounded-none border-none">
              <TabsTrigger value="q" className="bg-transparent data-[state=active]:bg-transparent data-[state=active]:text-primary font-black text-sm border-b-2 border-transparent data-[state=active]:border-primary rounded-none h-full px-0">지식 게시물</TabsTrigger>
              <TabsTrigger value="j" className="bg-transparent data-[state=active]:bg-transparent data-[state=active]:text-primary font-black text-sm border-b-2 border-transparent data-[state=active]:border-primary rounded-none h-full px-0">채용 공고</TabsTrigger>
              <TabsTrigger value="p" className="bg-transparent data-[state=active]:bg-transparent data-[state=active]:text-primary font-black text-sm border-b-2 border-transparent data-[state=active]:border-primary rounded-none h-full px-0">프로그램</TabsTrigger>
              <TabsTrigger value="m" className="bg-transparent data-[state=active]:bg-transparent data-[state=active]:text-primary font-black text-sm border-b-2 border-transparent data-[state=active]:border-primary rounded-none h-full px-0 relative">
                위스퍼러 신청 
                {mentors.filter(m => !m.isVerified).length > 0 && (
                  <span className="absolute -top-1 -right-4 bg-primary text-white text-[8px] font-black w-4 h-4 rounded-full flex items-center justify-center animate-bounce">
                    {mentors.filter(m => !m.isVerified).length}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Bulk Action Bar - 상단 고정 및 시각적 강조 */}
          {currentList.length > 0 && (
            <div className={cn(
              "sticky top-0 z-10 px-8 py-4 flex items-center justify-between border-b transition-all",
              selectedIds.length > 0 ? "bg-primary/10 border-primary/20" : "bg-white border-accent/5"
            )}>
              <div className="flex items-center gap-4">
                <Button 
                  type="button"
                  variant="ghost" 
                  size="sm" 
                  onClick={toggleSelectAll}
                  className="text-[11px] font-black text-accent/60 gap-2 hover:bg-white/50"
                >
                  {selectedIds.length === currentList.length && currentList.length > 0 ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                  {selectedIds.length === currentList.length && currentList.length > 0 ? "전체 해제" : "전체 선택"}
                </Button>
                {selectedIds.length > 0 && (
                  <>
                    <div className="h-4 w-px bg-accent/10" />
                    <span className="text-[11px] font-black text-primary animate-pulse">
                      {selectedIds.length}개 항목 선택됨
                    </span>
                  </>
                )}
              </div>
              
              {selectedIds.length > 0 && (
                <Button 
                  type="button"
                  onClick={handleBulkDelete}
                  disabled={isDeleting}
                  variant="destructive" 
                  size="sm" 
                  className="h-10 px-6 rounded-xl font-black text-[12px] gap-2 shadow-xl hover:scale-105 transition-all"
                >
                  {isDeleting ? <RefreshCcw className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  선택 항목 일괄 삭제하기
                </Button>
              )}
            </div>
          )}

          <div className="divide-y divide-accent/5">
            <TabsContent value="q" className="mt-0">
              {questions.length === 0 ? (
                <div className="py-24 text-center text-accent/10 font-black">게시물이 없습니다.</div>
              ) : (
                questions.map(item => (
                  <div key={item.id} className={cn("flex items-center justify-between p-6 border-b border-accent/5 transition-all group", selectedIds.includes(item.id) ? "bg-primary/5" : "hover:bg-accent/[0.01]")}>
                    <div className="flex items-center gap-5 flex-1">
                      <Checkbox checked={selectedIds.includes(item.id)} onCheckedChange={() => toggleSelect(item.id)} className="border-accent/20 h-5 w-5" />
                      <div className="w-12 h-12 flex items-center justify-center rounded-2xl bg-accent/5 text-accent/30 group-hover:text-accent"><MessageSquare className="w-5 h-5" /></div>
                      <div className="min-w-0 flex-1">
                        <h4 className="font-black text-accent leading-tight line-clamp-1">{item.title}</h4>
                        <p className="text-[11px] text-accent/30 font-bold mt-1">등록일: {new Date(item.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="text-red-300 hover:text-red-500 rounded-full" onClick={() => handleDelete("questions", item.id)}><Trash2 className="w-4 h-4" /></Button>
                  </div>
                ))
              )}
            </TabsContent>
            <TabsContent value="j" className="mt-0">
              {jobs.length === 0 ? (
                <div className="py-24 text-center text-accent/10 font-black">등록된 공고가 없습니다.</div>
              ) : (
                jobs.map(item => (
                  <div key={item.id} className={cn("flex items-center justify-between p-6 border-b border-accent/5 transition-all group", selectedIds.includes(item.id) ? "bg-primary/5" : "hover:bg-accent/[0.01]")}>
                    <div className="flex items-center gap-5 flex-1">
                      <Checkbox checked={selectedIds.includes(item.id)} onCheckedChange={() => toggleSelect(item.id)} className="border-accent/20 h-5 w-5" />
                      <div className="w-12 h-12 flex items-center justify-center rounded-2xl bg-accent/5 text-accent/30 group-hover:text-accent"><Briefcase className="w-5 h-5" /></div>
                      <div className="min-w-0 flex-1">
                        <h4 className="font-black text-accent leading-tight line-clamp-1">{item.title}</h4>
                        <p className="text-[11px] text-accent/30 font-bold mt-1">등록일: {new Date(item.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="text-red-300 hover:text-red-500 rounded-full" onClick={() => handleDelete("jobs", item.id)}><Trash2 className="w-4 h-4" /></Button>
                  </div>
                ))
              )}
            </TabsContent>
            <TabsContent value="p" className="mt-0">
              {programs.length === 0 ? (
                <div className="py-24 text-center text-accent/10 font-black">등록된 프로그램이 없습니다.</div>
              ) : (
                programs.map(item => (
                  <div key={item.id} className={cn("flex items-center justify-between p-6 border-b border-accent/5 transition-all group", selectedIds.includes(item.id) ? "bg-primary/5" : "hover:bg-accent/[0.01]")}>
                    <div className="flex items-center gap-5 flex-1">
                      <Checkbox checked={selectedIds.includes(item.id)} onCheckedChange={() => toggleSelect(item.id)} className="border-accent/20 h-5 w-5" />
                      <div className="w-12 h-12 flex items-center justify-center rounded-2xl bg-accent/5 text-accent/30 group-hover:text-accent"><GraduationCap className="w-5 h-5" /></div>
                      <div className="min-w-0 flex-1">
                        <h4 className="font-black text-accent leading-tight line-clamp-1">{item.title}</h4>
                        <p className="text-[11px] text-accent/30 font-bold mt-1">등록일: {new Date(item.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="text-red-300 hover:text-red-500 rounded-full" onClick={() => handleDelete("trainingPrograms", item.id)}><Trash2 className="w-4 h-4" /></Button>
                  </div>
                ))
              )}
            </TabsContent>
            <TabsContent value="m" className="mt-0">
              {mentors.length === 0 ? (
                <div className="py-24 text-center text-accent/10 font-black">신청 내역이 없습니다.</div>
              ) : (
                mentors.map(item => (
                  <div key={item.id} className={cn("flex items-center justify-between p-6 border-b border-accent/5 transition-all group", selectedIds.includes(item.id) ? "bg-primary/5" : "hover:bg-accent/[0.01]")}>
                    <div className="flex items-center gap-5 flex-1">
                      <Checkbox checked={selectedIds.includes(item.id)} onCheckedChange={() => toggleSelect(item.id)} className="border-accent/20 h-5 w-5" />
                      <div className={cn("w-12 h-12 flex items-center justify-center rounded-2xl relative transition-colors", !item.isVerified ? "bg-primary/10 text-primary" : "bg-accent/5 text-accent/30 group-hover:text-accent")}>
                        <Award className="w-5 h-5" />
                        {!item.isVerified && (
                          <div className="absolute -top-1 -right-1 bg-primary rounded-full p-0.5 border-2 border-white animate-pulse">
                            <AlertCircle className="w-2.5 h-2.5 text-white" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="font-black text-accent leading-tight line-clamp-1">{item.name} 전문가</h4>
                        <p className="text-[11px] text-accent/30 font-bold mt-1">{item.company} · {item.specialty}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {!item.isVerified && (
                        <Button onClick={() => handleApproveMentor(item)} className="bg-primary text-white font-black gap-1.5 h-10 px-5 rounded-xl shadow-lg hover:scale-105 transition-all text-xs">
                          <UserCheck className="w-4 h-4" /> 승인하기
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" className="text-red-300 hover:text-red-500 rounded-full" onClick={() => handleDelete("mentors", item.id)}><Trash2 className="w-4 h-4" /></Button>
                    </div>
                  </div>
                ))
              )}
            </TabsContent>
          </div>
        </Tabs>
      </CardContent>
    </Card>
  )
}
