
"use client"

import { useState, useMemo } from "react"
import { useFirestore, useCollection, useMemoFirebase, deleteDocumentNonBlocking, updateDocumentNonBlocking } from "@/firebase"
import { collection, query, doc } from "firebase/firestore"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Trash2, MessageSquare, Briefcase, GraduationCap, Award, Check, UserCheck, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Question, JobListing, TrainingProgram, Instructor } from "@/lib/types"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export function ContentManager() {
  const db = useFirestore()
  const { toast } = useToast()

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

  const handleDelete = (col: string, id: string) => {
    if (!db || !window.confirm("데이터를 영구적으로 삭제하시겠습니까?")) return
    deleteDocumentNonBlocking(doc(db, col, id))
    toast({ title: "삭제 완료", description: "성공적으로 처리되었습니다." })
  }

  const handleApproveMentor = (mentor: Instructor) => {
    if (!db || !window.confirm(`${mentor.name} 전문가님을 공식 위스퍼러로 승인하시겠습니까?`)) return
    updateDocumentNonBlocking(doc(db, "mentors", mentor.id), { isVerified: true })
    updateDocumentNonBlocking(doc(db, "users", mentor.userId), { role: "mentor" })
    toast({ title: "위스퍼러 승인 완료", description: "공식 뱃지가 부여되었습니다." })
  }

  const ContentItem = ({ item, col, type }: { item: any, col: string, type: string }) => (
    <div className="flex items-center justify-between p-6 border-b border-accent/5 hover:bg-accent/[0.01] transition-all group">
      <div className="flex items-center gap-5">
        <div className={cn(
          "w-12 h-12 flex items-center justify-center rounded-2xl relative transition-colors",
          type === 'm' && !item.isVerified ? "bg-primary/10 text-primary" : "bg-accent/5 text-accent/30 group-hover:text-accent"
        )}>
          {type === 'q' && <MessageSquare className="w-5 h-5" />}
          {type === 'j' && <Briefcase className="w-5 h-5" />}
          {type === 'p' && <GraduationCap className="w-5 h-5" />}
          {type === 'm' && <Award className="w-5 h-5" />}
          {type === 'm' && !item.isVerified && (
            <div className="absolute -top-1 -right-1 bg-primary rounded-full p-0.5 border-2 border-white animate-pulse">
              <AlertCircle className="w-2.5 h-2.5 text-white" />
            </div>
          )}
        </div>
        <div>
          <h4 className="font-black text-accent leading-tight line-clamp-1">
            {type === 'm' ? `${item.name} 전문가` : item.title}
          </h4>
          <p className="text-[11px] text-accent/30 font-bold mt-1">
            {type === 'm' ? `${item.company} · ${item.specialty}` : `등록일: ${new Date(item.createdAt).toLocaleDateString()}`}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        {type === 'm' && !item.isVerified && (
          <Button 
            onClick={() => handleApproveMentor(item)}
            className="bg-primary text-white font-black gap-1.5 h-10 px-5 rounded-xl shadow-lg hover:scale-105 transition-all text-xs"
          >
            <UserCheck className="w-4 h-4" /> 승인하기
          </Button>
        )}
        <Button 
          variant="ghost" 
          size="icon" 
          className="text-red-300 hover:text-red-500 hover:bg-red-50 rounded-full w-10 h-10" 
          onClick={() => handleDelete(col, item.id)}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )

  return (
    <Card className="bg-white border-accent/5 shadow-sm rounded-[2.5rem] overflow-hidden">
      <CardContent className="p-0">
        <Tabs defaultValue="q">
          <TabsList className="w-full justify-start gap-10 bg-accent/[0.02] px-10 h-16 rounded-none border-b border-accent/5">
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

          <div className="divide-y divide-accent/5">
            <TabsContent value="q" className="mt-0">
              {questions.map(q => <ContentItem key={q.id} item={q} col="questions" type="q" />)}
              {questions.length === 0 && <div className="py-24 text-center text-accent/10 font-black">게시물이 없습니다.</div>}
            </TabsContent>
            <TabsContent value="j" className="mt-0">
              {jobs.map(j => <ContentItem key={j.id} item={j} col="jobs" type="j" />)}
              {jobs.length === 0 && <div className="py-24 text-center text-accent/10 font-black">등록된 공고가 없습니다.</div>}
            </TabsContent>
            <TabsContent value="p" className="mt-0">
              {programs.map(p => <ContentItem key={p.id} item={p} col="trainingPrograms" type="p" />)}
              {programs.length === 0 && <div className="py-24 text-center text-accent/10 font-black">등록된 프로그램이 없습니다.</div>}
            </TabsContent>
            <TabsContent value="m" className="mt-0">
              {mentors.map(m => <ContentItem key={m.id} item={m} col="mentors" type="m" />)}
              {mentors.length === 0 && <div className="py-24 text-center text-accent/10 font-black">신청 내역이 없습니다.</div>}
            </TabsContent>
          </div>
        </Tabs>
      </CardContent>
    </Card>
  )
}
