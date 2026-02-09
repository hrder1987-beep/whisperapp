"use client"

import { useState } from "react"
import { useFirestore, useCollection, useMemoFirebase, deleteDocumentNonBlocking } from "@/firebase"
import { collection, query, orderBy, doc } from "firebase/firestore"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Trash2, MessageSquare, Briefcase, GraduationCap, Award, ExternalLink } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Question, JobListing, TrainingProgram, Instructor } from "@/lib/types"

export function ContentManager() {
  const db = useFirestore()
  const { toast } = useToast()

  const questionsQuery = useMemoFirebase(() => db ? query(collection(db, "questions"), orderBy("createdAt", "desc")) : null, [db])
  const jobsQuery = useMemoFirebase(() => db ? query(collection(db, "jobs"), orderBy("createdAt", "desc")) : null, [db])
  const programsQuery = useMemoFirebase(() => db ? query(collection(db, "trainingPrograms"), orderBy("createdAt", "desc")) : null, [db])
  const mentorsQuery = useMemoFirebase(() => db ? query(collection(db, "mentors"), orderBy("createdAt", "desc")) : null, [db])

  const { data: questions } = useCollection<Question>(questionsQuery)
  const { data: jobs } = useCollection<JobListing>(jobsQuery)
  const { data: programs } = useCollection<TrainingProgram>(programsQuery)
  const { data: mentors } = useCollection<Instructor>(mentorsQuery)

  const handleDelete = (col: string, id: string) => {
    if (!db || !window.confirm("정말로 삭제하시겠습니까?")) return
    deleteDocumentNonBlocking(doc(db, col, id))
    toast({ title: "삭제 완료", description: "데이터가 성공적으로 삭제되었습니다." })
  }

  const ContentItem = ({ id, title, subtitle, col, type }: { id: string, title: string, subtitle: string, col: string, type: string }) => (
    <div className="flex items-center justify-between p-6 border-b border-primary/5 hover:bg-primary/[0.01] transition-all">
      <div className="flex items-center gap-4">
        <div className="p-3 bg-primary/5 rounded-2xl">
          {type === 'q' && <MessageSquare className="w-5 h-5 text-accent" />}
          {type === 'j' && <Briefcase className="w-5 h-5 text-accent" />}
          {type === 'p' && <GraduationCap className="w-5 h-5 text-accent" />}
          {type === 'm' && <Award className="w-5 h-5 text-accent" />}
        </div>
        <div>
          <h4 className="font-black text-primary leading-tight line-clamp-1">{title}</h4>
          <p className="text-xs text-primary/30 font-bold">{subtitle}</p>
        </div>
      </div>
      <div className="flex gap-2">
        <Button variant="ghost" size="icon" className="text-red-400 hover:text-red-600 hover:bg-red-50 rounded-full" onClick={() => handleDelete(col, id)}>
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
            <TabsTrigger value="m" className="bg-transparent data-[state=active]:bg-transparent data-[state=active]:text-accent font-black text-sm border-b-2 border-transparent data-[state=active]:border-accent rounded-none">위스퍼러 신청</TabsTrigger>
          </TabsList>

          <TabsContent value="q" className="mt-0 divide-y divide-primary/5">
            {(questions || []).map(q => <ContentItem key={q.id} id={q.id} title={q.title} subtitle={`작성자: @${q.nickname} | ${new Date(q.createdAt).toLocaleDateString()}`} col="questions" type="q" />)}
          </TabsContent>
          <TabsContent value="j" className="mt-0 divide-y divide-primary/5">
            {(jobs || []).map(j => <ContentItem key={j.id} id={j.id} title={j.title} subtitle={`${j.companyName} | ${j.deadline}`} col="jobs" type="j" />)}
          </TabsContent>
          <TabsContent value="p" className="mt-0 divide-y divide-primary/5">
            {(programs || []).map(p => <ContentItem key={p.id} id={p.id} title={p.title} subtitle={`${p.instructorName} | ${p.category}`} col="trainingPrograms" type="p" />)}
          </TabsContent>
          <TabsContent value="m" className="mt-0 divide-y divide-primary/5">
            {(mentors || []).map(m => <ContentItem key={m.id} id={m.id} title={m.name} subtitle={`${m.company} | ${m.specialty}`} col="mentors" type="m" />)}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
