
"use client"

import { useState, useMemo, useEffect } from "react"
import { useFirestore, useCollection, useMemoFirebase, deleteDocumentNonBlocking, updateDocumentNonBlocking } from "@/firebase"
import { collection, query, doc } from "firebase/firestore"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Trash2, MessageSquare, Briefcase, GraduationCap, Award, RefreshCcw } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Question, JobListing, TrainingProgram, Instructor } from "@/lib/types"
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

  const handleBulkDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!db || !currentCollection || selectedIds.length === 0) return
    
    const confirmMessage = `선택한 ${selectedIds.length}개의 항목을 일괄 삭제하시겠습니까?\n삭제된 데이터는 복구할 수 없습니다.`;
    if (!window.confirm(confirmMessage)) return

    setIsDeleting(true)
    try {
      selectedIds.forEach(id => {
        deleteDocumentNonBlocking(doc(db, currentCollection, id))
      })
      toast({ 
        title: "일괄 처리 완료", 
        description: `${selectedIds.length}개의 콘텐츠를 성공적으로 삭제했습니다.` 
      })
      setSelectedIds([])
    } catch (e) {
      toast({ title: "오류 발생", description: "삭제 처리 중 문제가 발생했습니다.", variant: "destructive" })
    } finally {
      setIsDeleting(false)
    }
  }

  const handleDeleteSingle = (col: string, id: string) => {
    if (!db || !window.confirm("이 항목을 영구적으로 삭제하시겠습니까?")) return
    deleteDocumentNonBlocking(doc(db, col, id))
    toast({ title: "삭제 완료" })
  }

  const handleApproveMentor = (mentor: Instructor) => {
    if (!db || !window.confirm(`${mentor.name} 전문가님을 공식 위스퍼러로 승인하시겠습니까?`)) return
    updateDocumentNonBlocking(doc(db, "mentors", mentor.id), { isVerified: true })
    updateDocumentNonBlocking(doc(db, "users", mentor.userId), { role: "mentor" })
    toast({ title: "위스퍼러 승인 완료" })
  }

  return (
    <div className="relative">
      {/* 일괄 삭제 바: 탭 외부 최상단 레이어로 배치하여 클릭 간섭 차단 */}
      <div className={cn(
        "fixed bottom-10 left-1/2 -translate-x-1/2 z-[9999] transition-all duration-500",
        selectedIds.length > 0 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10 pointer-events-none"
      )}>
        <div className="bg-accent text-white px-8 py-5 rounded-full shadow-[0_20px_50px_rgba(0,0,0,0.3)] flex items-center gap-8 border border-white/10 backdrop-blur-2xl">
          <div className="flex items-center gap-3">
            <span className="text-xl font-black text-primary">{selectedIds.length}</span>
            <span className="text-sm font-bold opacity-60">항목 선택됨</span>
          </div>
          <div className="w-px h-6 bg-white/10" />
          <Button 
            onClick={handleBulkDelete}
            disabled={isDeleting}
            className="h-12 px-8 rounded-full font-black gap-2 bg-red-500 hover:bg-red-600 text-white shadow-xl transition-all active:scale-95"
          >
            {isDeleting ? <RefreshCcw className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            선택 항목 일괄 삭제
          </Button>
        </div>
      </div>

      <Card className="bg-white border-accent/5 shadow-2xl rounded-[3rem] overflow-hidden">
        <CardContent className="p-0">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <div className="bg-accent/[0.02] border-b border-accent/5 sticky top-0 z-50 backdrop-blur-md">
              <TabsList className="w-full justify-start gap-12 px-10 h-20 bg-transparent rounded-none border-none">
                <TabsTrigger value="q" className="bg-transparent data-[state=active]:bg-transparent data-[state=active]:text-primary font-black text-base border-b-[3px] border-transparent data-[state=active]:border-primary rounded-none h-full px-0">지식 피드</TabsTrigger>
                <TabsTrigger value="j" className="bg-transparent data-[state=active]:bg-transparent data-[state=active]:text-primary font-black text-base border-b-[3px] border-transparent data-[state=active]:border-primary rounded-none h-full px-0">채용 공고</TabsTrigger>
                <TabsTrigger value="p" className="bg-transparent data-[state=active]:bg-transparent data-[state=active]:text-primary font-black text-base border-b-[3px] border-transparent data-[state=active]:border-primary rounded-none h-full px-0">전문 콘텐츠</TabsTrigger>
                <TabsTrigger value="m" className="bg-transparent data-[state=active]:bg-transparent data-[state=active]:text-primary font-black text-base border-b-[3px] border-transparent data-[state=active]:border-primary rounded-none h-full px-0 relative">
                  위스퍼러 신청 
                  {mentors.filter(m => !m.isVerified).length > 0 && (
                    <span className="absolute -top-1 -right-5 bg-red-500 text-white text-[9px] font-black w-5 h-5 rounded-full flex items-center justify-center animate-bounce shadow-lg">
                      {mentors.filter(m => !m.isVerified).length}
                    </span>
                  )}
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="divide-y divide-accent/5 min-h-[400px]">
              <div className="p-6 bg-primary/10 border-b border-accent/5 flex items-center gap-4">
                <Checkbox 
                  checked={selectedIds.length === currentList.length && currentList.length > 0} 
                  onCheckedChange={toggleSelectAll}
                  className="h-5 w-5 border-primary data-[state=checked]:bg-primary"
                />
                <span className="text-xs font-black text-accent/60 uppercase tracking-widest">전체 선택 / 해제</span>
              </div>

              <TabsContent value="q" className="mt-0">
                {questions.length === 0 ? <div className="py-40 text-center text-accent/10 font-black text-xl">등록된 게시물이 없습니다.</div> : questions.map(item => (
                  <div key={item.id} className={cn("flex items-center justify-between p-8 border-b border-accent/5 transition-all hover:bg-accent/[0.01]", selectedIds.includes(item.id) && "bg-primary/5")}>
                    <div className="flex items-center gap-6 flex-1">
                      <Checkbox checked={selectedIds.includes(item.id)} onCheckedChange={() => toggleSelect(item.id)} className="h-6 w-6 border-accent/10" />
                      <div className="w-14 h-14 flex items-center justify-center rounded-2xl bg-accent/5 text-accent/30"><MessageSquare className="w-6 h-6" /></div>
                      <div className="min-w-0 flex-1">
                        <h4 className="font-black text-accent text-lg leading-tight line-clamp-1">{item.title}</h4>
                        <p className="text-xs text-accent/30 font-bold mt-1.5 flex items-center gap-2">@{item.nickname} <span className="w-1 h-1 rounded-full bg-accent/10"></span> {new Date(item.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="text-red-300 hover:text-red-500 transition-colors" onClick={() => handleDeleteSingle("questions", item.id)}><Trash2 className="w-5 h-5" /></Button>
                  </div>
                ))}
              </TabsContent>
              <TabsContent value="j" className="mt-0">
                {jobs.length === 0 ? <div className="py-40 text-center text-accent/10 font-black text-xl">등록된 공고가 없습니다.</div> : jobs.map(item => (
                  <div key={item.id} className={cn("flex items-center justify-between p-8 border-b border-accent/5 transition-all hover:bg-accent/[0.01]", selectedIds.includes(item.id) && "bg-primary/5")}>
                    <div className="flex items-center gap-6 flex-1">
                      <Checkbox checked={selectedIds.includes(item.id)} onCheckedChange={() => toggleSelect(item.id)} className="h-6 w-6 border-accent/10" />
                      <div className="w-14 h-14 flex items-center justify-center rounded-2xl bg-accent/5 text-accent/30"><Briefcase className="w-6 h-6" /></div>
                      <div className="min-w-0 flex-1">
                        <h4 className="font-black text-accent text-lg leading-tight line-clamp-1">{item.title}</h4>
                        <p className="text-xs text-accent/30 font-bold mt-1.5 flex items-center gap-2">{item.companyName} <span className="w-1 h-1 rounded-full bg-accent/10"></span> {new Date(item.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="text-red-300 hover:text-red-500 transition-colors" onClick={() => handleDeleteSingle("jobs", item.id)}><Trash2 className="w-5 h-5" /></Button>
                  </div>
                ))}
              </TabsContent>
              <TabsContent value="p" className="mt-0">
                {programs.length === 0 ? <div className="py-40 text-center text-accent/10 font-black text-xl">등록된 콘텐츠가 없습니다.</div> : programs.map(item => (
                  <div key={item.id} className={cn("flex items-center justify-between p-8 border-b border-accent/5 transition-all hover:bg-accent/[0.01]", selectedIds.includes(item.id) && "bg-primary/5")}>
                    <div className="flex items-center gap-6 flex-1">
                      <Checkbox checked={selectedIds.includes(item.id)} onCheckedChange={() => toggleSelect(item.id)} className="h-6 w-6 border-accent/10" />
                      <div className="w-14 h-14 flex items-center justify-center rounded-2xl bg-accent/5 text-accent/30"><GraduationCap className="w-6 h-6" /></div>
                      <div className="min-w-0 flex-1">
                        <h4 className="font-black text-accent text-lg leading-tight line-clamp-1">{item.title}</h4>
                        <p className="text-xs text-accent/30 font-bold mt-1.5 flex items-center gap-2">{item.instructorName} <span className="w-1 h-1 rounded-full bg-accent/10"></span> {new Date(item.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="text-red-300 hover:text-red-500 transition-colors" onClick={() => handleDeleteSingle("trainingPrograms", item.id)}><Trash2 className="w-5 h-5" /></Button>
                  </div>
                ))}
              </TabsContent>
              <TabsContent value="m" className="mt-0">
                {mentors.length === 0 ? <div className="py-40 text-center text-accent/10 font-black text-xl">신청자가 없습니다.</div> : mentors.map(item => (
                  <div key={item.id} className={cn("flex items-center justify-between p-8 border-b border-accent/5 transition-all hover:bg-accent/[0.01]", selectedIds.includes(item.id) && "bg-primary/5")}>
                    <div className="flex items-center gap-6 flex-1">
                      <Checkbox checked={selectedIds.includes(item.id)} onCheckedChange={() => toggleSelect(item.id)} className="h-6 w-6 border-accent/10" />
                      <div className="w-14 h-14 flex items-center justify-center rounded-2xl bg-accent/5 text-accent/30"><Award className="w-6 h-6" /></div>
                      <div className="min-w-0 flex-1">
                        <h4 className="font-black text-accent text-lg leading-tight line-clamp-1">{item.name} 전문가 신청</h4>
                        <p className="text-xs text-accent/30 font-bold mt-1.5">{item.company} · {item.specialty} · {new Date(item.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {!item.isVerified && (
                        <Button onClick={() => handleApproveMentor(item)} className="bg-primary text-accent font-black h-12 px-8 rounded-xl shadow-lg hover:scale-105 transition-all text-sm">승인하기</Button>
                      )}
                      <Button variant="ghost" size="icon" className="text-red-300 hover:text-red-500 transition-colors" onClick={() => handleDeleteSingle("mentors", item.id)}><Trash2 className="w-5 h-5" /></Button>
                    </div>
                  </div>
                ))}
              </TabsContent>
            </div>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
