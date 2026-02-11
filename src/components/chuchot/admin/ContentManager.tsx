
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
import { cn } from "@/lib/utils"

export function ContentManager() {
  const db = useFirestore()
  const { toast } = useToast()

  // 서버 부하 및 인덱스 에러 방지를 위해 orderBy 제거 후 클라이언트 정렬
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
    if (!db || !window.confirm("정말로 삭제하시겠습니까?")) return
    deleteDocumentNonBlocking(doc(db, col, id))
    toast({ title: "삭제 완료", description: "데이터가 성공적으로 삭제되었습니다." })
  }

  const handleApproveMentor = (mentor: Instructor) => {
    if (!db || !window.confirm(`${mentor.name} 전문가님을 공식 위스퍼러로 승인하시겠습니까?\n승인 시 위스퍼러 목록에 즉시 노출됩니다.`)) return
    
    // 1. 위스퍼러 프로필 인증 상태 변경
    updateDocumentNonBlocking(doc(db, "mentors", mentor.id), { isVerified: true })
    
    // 2. 사용자 계정 권한을 'mentor'로 승격
    updateDocumentNonBlocking(doc(db, "users", mentor.userId), { role: "mentor" })
    
    toast({ 
      title: "위스퍼러 승인 완료", 
      description: `${mentor.name} 전문가님께 공식 위스퍼러 자격이 부여되었습니다.` 
    })
  }

  const ContentItem = ({ item, col, type }: { item: any, col: string, type: string }) => (
    <div className="flex items-center justify-between p-6 border-b border-primary/5 hover:bg-primary/[0.01] transition-all">
      <div className="flex items-center gap-4">
        <div className={cn(
          "p-3 rounded-2xl relative",
          type === 'm' && !item.isVerified ? "bg-accent/10" : "bg-primary/5"
        )}>
          {type === 'q' && <MessageSquare className="w-5 h-5 text-accent" />}
          {type === 'j' && <Briefcase className="w-5 h-5 text-accent" />}
          {type === 'p' && <GraduationCap className="w-5 h-5 text-accent" />}
          {type === 'm' && <Award className={cn("w-5 h-5", item.isVerified ? "text-accent" : "text-primary/40")} />}
          {type === 'm' && item.isVerified && (
            <div className="absolute -top-1 -right-1 bg-emerald-500 rounded-full p-0.5 border border-white">
              <Check className="w-2 h-2 text-white" />
            </div>
          )}
          {type === 'm' && !item.isVerified && (
            <div className="absolute -top-1 -right-1 bg-red-500 rounded-full p-0.5 border border-white animate-pulse">
              <AlertCircle className="w-2 h-2 text-white" />
            </div>
          )}
        </div>
        <div>
          <h4 className="font-black text-primary leading-tight line-clamp-1">
            {type === 'm' ? `${item.name} 전문가` : item.title}
          </h4>
          <p className="text-xs text-primary/30 font-bold">
            {type === 'm' ? `${item.company} | ${item.specialty}` : `작성일: ${new Date(item.createdAt).toLocaleDateString()}`}
          </p>
        </div>
      </div>
      <div className="flex gap-2">
        {type === 'm' && !item.isVerified && (
          <Button 
            variant="outline" 
            size="sm" 
            className="border-emerald-100 text-emerald-600 hover:bg-emerald-50 font-black gap-1.5 rounded-xl h-9 px-4"
            onClick={() => handleApproveMentor(item)}
          >
            <UserCheck className="w-4 h-4" /> 승인하기
          </Button>
        )}
        <Button 
          variant="ghost" 
          size="icon" 
          className="text-red-400 hover:text-red-600 hover:bg-red-50 rounded-full" 
          onClick={() => handleDelete(col, item.id)}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )

  return (
    <Card className="bg-white border-none shadow-xl rounded-[2.5rem] overflow-hidden">
      <CardContent className="p-0">
        <Tabs defaultValue="q">
          <TabsList className="w-full justify-start gap-8 bg-primary/5 px-8 h-16 rounded-none">
            <TabsTrigger value="q" className="bg-transparent data-[state=active]:bg-transparent data-[state=active]:text-accent font-black text-sm border-b-2 border-transparent data-[state=active]:border-accent rounded-none">지식 피드</TabsTrigger>
            <TabsTrigger value="j" className="bg-transparent data-[state=active]:bg-transparent data-[state=active]:text-accent font-black text-sm border-b-2 border-transparent data-[state=active]:border-accent rounded-none">채용 공고</TabsTrigger>
            <TabsTrigger value="p" className="bg-transparent data-[state=active]:bg-transparent data-[state=active]:text-accent font-black text-sm border-b-2 border-transparent data-[state=active]:border-accent rounded-none">프로그램</TabsTrigger>
            <TabsTrigger value="m" className="bg-transparent data-[state=active]:bg-transparent data-[state=active]:text-accent font-black text-sm border-b-2 border-transparent data-[state=active]:border-accent rounded-none">
              위스퍼러 신청 
              {mentors.filter(m => !m.isVerified).length > 0 && (
                <Badge className="ml-2 bg-red-500 text-white border-none h-5 w-5 p-0 flex items-center justify-center rounded-full text-[10px] animate-pulse">
                  {mentors.filter(m => !m.isVerified).length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="q" className="mt-0 divide-y divide-primary/5">
            {(questions || []).map(q => <ContentItem key={q.id} item={q} col="questions" type="q" />)}
          </TabsContent>
          <TabsContent value="j" className="mt-0 divide-y divide-primary/5">
            {(jobs || []).map(j => <ContentItem key={j.id} item={j} col="jobs" type="j" />)}
          </TabsContent>
          <TabsContent value="p" className="mt-0 divide-y divide-primary/5">
            {(programs || []).map(p => <ContentItem key={p.id} item={p} col="trainingPrograms" type="p" />)}
          </TabsContent>
          <TabsContent value="m" className="mt-0 divide-y divide-primary/5">
            {(mentors || []).map(m => <ContentItem key={m.id} item={m} col="mentors" type="m" />)}
            {(!mentors || mentors.length === 0) && (
              <div className="py-20 text-center text-primary/20 font-black">신청 내역이 없습니다.</div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
