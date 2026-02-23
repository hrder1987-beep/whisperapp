
"use client"

import { useState, useMemo, use, useEffect } from "react"
import { Header } from "@/components/chuchot/Header"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { useUser, useFirestore, useDoc, useCollection, useMemoFirebase, addDocumentNonBlocking, updateDocumentNonBlocking } from "@/firebase"
import { doc, collection, query, where, deleteDoc } from "firebase/firestore"
import { Gathering, GatheringApplication } from "@/lib/types"
import { Users, Calendar, MapPin, Globe, Sparkles, FileText, Check, X, ArrowLeft, MessageSquare, ShieldCheck, Download, Trash2, Clock, Info } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { formatDistanceToNow } from "date-fns"
import { ko } from "date-fns/locale"
import { useRouter } from "next/navigation"
import Image from "next/image"

export default function GatheringDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { user } = useUser()
  const db = useFirestore()
  const { toast } = useToast()
  const router = useRouter()

  const [activeTab, setActiveTab] = useState("overview")
  const [isApplying, setIsSubmitting] = useState(false)

  // Data Fetching
  const gatheringRef = useMemoFirebase(() => db ? doc(db, "gatherings", id) : null, [db, id])
  const { data: gathering, isLoading: isGatheringLoading } = useDoc<Gathering>(gatheringRef)

  const appsQuery = useMemoFirebase(() => db ? query(collection(db, "gatherings", id, "applications")) : null, [db, id])
  const { data: applications } = useCollection<GatheringApplication>(appsQuery)

  const isCreator = user && gathering && user.uid === gathering.creatorId
  const myApp = applications?.find(a => a.userId === user?.uid)
  const isApproved = myApp?.status === "approved"

  const handleApply = async () => {
    if (!user || !gathering || !db) {
      toast({ title: "로그인 필요", description: "참여 신청을 하려면 로그인이 필요합니다.", variant: "destructive" })
      return
    }

    if (gathering.participantCount >= gathering.capacity) {
      toast({ title: "정원 초과", description: "이미 모집 정원이 마감되었습니다.", variant: "destructive" })
      return
    }

    setIsSubmitting(true)
    try {
      await addDocumentNonBlocking(collection(db, "gatherings", id, "applications"), {
        gatheringId: id,
        userId: user.uid,
        userName: user.displayName || "익명전문가",
        userEmail: user.email || "",
        status: "pending",
        appliedAt: Date.now()
      })
      toast({ title: "신청 완료", description: "모임 참여 신청이 완료되었습니다. 개설자의 승인을 기다려주세요!" })
    } catch (e) {
      toast({ title: "오류", description: "신청 중 문제가 발생했습니다.", variant: "destructive" })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleApprove = (app: GatheringApplication) => {
    if (!db || !gathering) return
    updateDocumentNonBlocking(doc(db, "gatherings", id, "applications", app.id), { status: "approved" })
    updateDocumentNonBlocking(gatheringRef!, { participantCount: gathering.participantCount + 1 })
    
    addDocumentNonBlocking(collection(db, "notifications"), {
      userId: app.userId,
      type: "gathering_approved",
      questionId: id,
      questionTitle: gathering.title,
      senderNickname: gathering.creatorName,
      createdAt: Date.now(),
      isRead: false
    })
    
    toast({ title: "승인 완료", description: `${app.userName} 전문가님의 참여를 승인했습니다.` })
  }

  const handleReject = (app: GatheringApplication) => {
    if (!db) return
    updateDocumentNonBlocking(doc(db, "gatherings", id, "applications", app.id), { status: "rejected" })
    toast({ title: "거절 완료", description: "신청을 반려했습니다." })
  }

  if (isGatheringLoading) {
    return <div className="min-h-screen flex items-center justify-center"><Sparkles className="w-12 h-12 animate-spin text-accent" /></div>
  }

  if (!gathering) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex flex-col items-center justify-center p-4">
        <Info className="w-20 h-20 text-primary/10 mb-6" />
        <h1 className="text-2xl font-black text-primary">존재하지 않는 모임입니다.</h1>
        <Button onClick={() => router.push("/gatherings")} variant="ghost" className="mt-4 text-primary/40 font-bold">목록으로 돌아가기</Button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-32">
      <Header />
      
      <div className="relative h-[300px] md:h-[450px] w-full">
        <Image src={gathering.imageUrl || "https://images.unsplash.com/photo-1522071820081-009f0129c71c"} alt={gathering.title} fill className="object-cover" priority />
        <div className="absolute inset-0 bg-gradient-to-t from-[#F8F9FA] via-black/20 to-transparent"></div>
        <div className="absolute top-8 left-8">
          <Button onClick={() => router.push("/gatherings")} variant="ghost" className="bg-black/20 backdrop-blur-md text-white hover:bg-white/20 font-black rounded-xl gap-2 h-12 px-6">
            <ArrowLeft className="w-4 h-4" /> 목록으로
          </Button>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 -mt-20 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          <div className="lg:col-span-8 space-y-10">
            <Card className="bg-white border-none shadow-2xl rounded-[3rem] overflow-hidden">
              <CardContent className="p-10 md:p-16">
                <div className="flex flex-wrap gap-2 mb-6">
                  <Badge className="bg-accent text-primary font-black border-none px-4 py-1.5 rounded-full text-[11px]">#{gathering.category}</Badge>
                  <Badge className={cn("font-black border-none px-4 py-1.5 rounded-full text-[11px]", gathering.status === 'recruiting' ? "bg-emerald-500 text-white" : "bg-primary/10 text-primary/40")}>
                    {gathering.status === 'recruiting' ? "모집 중" : "모집 완료"}
                  </Badge>
                </div>
                
                <h1 className="text-4xl md:text-5xl font-black text-primary tracking-tighter mb-8 leading-[1.1]">{gathering.title}</h1>
                
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="bg-primary/5 p-1 rounded-2xl h-16 w-full md:w-fit grid grid-cols-2 md:flex mb-12">
                    <TabsTrigger value="overview" className="rounded-xl font-black text-sm md:px-10 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-lg">상세 소개</TabsTrigger>
                    <TabsTrigger value="lms" className="rounded-xl font-black text-sm md:px-10 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-lg">
                      학습 자료실 {(isApproved || isCreator) ? "" : "🔒"}
                    </TabsTrigger>
                    {isCreator && (
                      <TabsTrigger value="admin" className="rounded-xl font-black text-sm md:px-10 data-[state=active]:bg-primary data-[state=active]:text-accent data-[state=active]:shadow-lg gap-2">
                        <ShieldCheck className="w-4 h-4" /> 관리 도구
                      </TabsTrigger>
                    )}
                  </TabsList>

                  <TabsContent value="overview" className="mt-0">
                    <div className="prose prose-slate max-w-none">
                      <p className="text-lg leading-relaxed text-primary/70 whitespace-pre-wrap font-medium">{gathering.description}</p>
                    </div>
                  </TabsContent>

                  <TabsContent value="lms" className="mt-0">
                    {(isApproved || isCreator) ? (
                      <div className="space-y-6">
                        <div className="bg-accent/5 border border-accent/20 p-8 rounded-3xl flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="p-3 bg-accent text-primary rounded-2xl"><FileText className="w-6 h-6" /></div>
                            <div>
                              <h4 className="font-black text-primary text-lg">참여자 전용 학습 자료실</h4>
                              <p className="text-sm font-bold text-primary/40">모임 진행 시 활용되는 각종 템플릿과 강의안이 공유됩니다.</p>
                            </div>
                          </div>
                        </div>
                        
                        {(!gathering.resources || gathering.resources.length === 0) ? (
                          <div className="py-20 text-center bg-white rounded-3xl border border-dashed border-primary/10">
                            <p className="text-primary/20 font-black">아직 공유된 자료가 없습니다.</p>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {gathering.resources.map((res, i) => (
                              <div key={i} className="p-6 bg-white border border-primary/5 rounded-2xl flex items-center justify-between group hover:border-accent transition-all">
                                <div className="flex items-center gap-3">
                                  <FileText className="w-5 h-5 text-accent" />
                                  <span className="font-bold text-primary">{res.title}</span>
                                </div>
                                <Button variant="ghost" size="icon" className="text-primary/20 hover:text-accent"><Download className="w-5 h-5" /></Button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="py-32 text-center bg-primary/5 rounded-[3rem] space-y-6">
                        <ShieldCheck className="w-20 h-20 text-primary/10 mx-auto" />
                        <div className="space-y-2">
                          <h3 className="text-2xl font-black text-primary">승인된 멤버 전용 공간입니다.</h3>
                          <p className="text-primary/40 font-bold">모임 신청 후 승인이 완료되면 자료를 확인하실 수 있습니다.</p>
                        </div>
                        <Button onClick={handleApply} disabled={!!myApp} className="bg-primary text-accent font-black h-12 px-10 rounded-xl">
                          {myApp ? "승인 대기 중" : "지금 바로 신청하기"}
                        </Button>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="admin" className="mt-0 space-y-10">
                    <section className="space-y-6">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xl font-black text-primary flex items-center gap-2">
                          <Users className="w-6 h-6 text-accent" /> 신청자 명단 ({applications?.filter(a => a.status === 'pending').length})
                        </h3>
                      </div>
                      
                      <div className="bg-primary/5 rounded-[2.5rem] overflow-hidden">
                        {applications?.length === 0 ? (
                          <div className="py-20 text-center text-primary/20 font-black">아직 신청한 전문가가 없습니다.</div>
                        ) : (
                          <div className="divide-y divide-primary/5">
                            {applications?.map(app => (
                              <div key={app.id} className="p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:bg-white transition-all">
                                <div className="flex items-center gap-4">
                                  <div className="w-12 h-12 rounded-2xl bg-primary text-accent flex items-center justify-center font-black text-lg">
                                    {app.userName.substring(0, 1)}
                                  </div>
                                  <div>
                                    <p className="font-black text-primary text-lg">@{app.userName}</p>
                                    <p className="text-sm font-bold text-primary/30 flex items-center gap-2"><Clock className="w-3.5 h-3.5" /> {formatDistanceToNow(app.appliedAt, { addSuffix: true, locale: ko })} 신청</p>
                                  </div>
                                </div>
                                
                                <div className="flex items-center gap-3">
                                  {app.status === 'pending' ? (
                                    <>
                                      <Button onClick={() => handleApprove(app)} className="bg-emerald-500 hover:bg-emerald-600 text-white font-black rounded-xl h-11 px-6 gap-2">
                                        <Check className="w-4 h-4" /> 승인
                                      </Button>
                                      <Button onClick={() => handleReject(app)} variant="outline" className="border-red-100 text-red-500 hover:bg-red-50 font-black rounded-xl h-11 px-6 gap-2">
                                        <X className="w-4 h-4" /> 반려
                                      </Button>
                                    </>
                                  ) : (
                                    <Badge className={cn("font-black px-4 py-1.5 rounded-lg border-none", app.status === 'approved' ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-500")}>
                                      {app.status === 'approved' ? "승인됨" : "반려됨"}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </section>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          <aside className="lg:col-span-4 space-y-8">
            <Card className="bg-white border-none shadow-2xl rounded-[2.5rem] p-10 space-y-8 sticky top-32">
              <h4 className="text-lg font-black text-primary border-b border-primary/5 pb-4">모임 정보 요약</h4>
              
              <div className="space-y-6">
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] font-black text-primary/30 uppercase tracking-widest">모임 일정</span>
                  <div className="flex items-center gap-3 font-bold text-primary/70">
                    <div className="p-2 bg-primary/5 rounded-lg"><Calendar className="w-4 h-4 text-accent" /></div>
                    {gathering.schedule}
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] font-black text-primary/30 uppercase tracking-widest">진행 방식 및 장소</span>
                  <div className="flex items-center gap-3 font-bold text-primary/70">
                    <div className="p-2 bg-primary/5 rounded-lg">
                      {gathering.type === "online" ? <Globe className="w-4 h-4 text-accent" /> : <MapPin className="w-4 h-4 text-accent" />}
                    </div>
                    {gathering.type === "online" ? "온라인(상세 주소 추후 공지)" : gathering.location}
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <span className="text-[10px] font-black text-primary/30 uppercase tracking-widest">모집 현황</span>
                  <div className="space-y-2">
                    <div className="flex justify-between items-end font-black">
                      <span className="text-2xl text-primary">{gathering.participantCount} <span className="text-sm text-primary/20">/ {gathering.capacity}명</span></span>
                      <span className="text-accent text-sm">{Math.round((gathering.participantCount / gathering.capacity) * 100)}%</span>
                    </div>
                    <Progress value={(gathering.participantCount / gathering.capacity) * 100} className="h-2 bg-primary/5" />
                  </div>
                </div>
              </div>

              {!isCreator && (
                <div className="pt-4">
                  {myApp ? (
                    <div className={cn(
                      "w-full h-16 rounded-2xl flex items-center justify-center font-black text-lg gap-3",
                      myApp.status === 'pending' ? "bg-primary/5 text-primary/40" : 
                      myApp.status === 'approved' ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-500"
                    )}>
                      {myApp.status === 'pending' ? <Clock className="w-5 h-5" /> : myApp.status === 'approved' ? <Check className="w-5 h-5" /> : <X className="w-5 h-5" />}
                      {myApp.status === 'pending' ? "승인 대기 중" : myApp.status === 'approved' ? "참여 승인 완료" : "참여가 반려되었습니다"}
                    </div>
                  ) : (
                    <Button 
                      onClick={handleApply} 
                      disabled={isApplying || gathering.status !== 'recruiting'}
                      className="w-full h-16 bg-primary text-accent hover:bg-primary/95 font-black text-xl rounded-2xl shadow-xl gap-3"
                    >
                      {gathering.status !== 'recruiting' ? "모집 마감" : isApplying ? "신청 중..." : "지금 바로 신청하기"}
                    </Button>
                  )}
                  <p className="text-[10px] text-center text-primary/30 mt-4 font-bold">신청 시 개설자가 전문가님의 기본 프로필을 확인하게 됩니다.</p>
                </div>
              )}

              <div className="pt-8 border-t border-primary/5">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-primary text-accent flex items-center justify-center font-black">
                    {gathering.creatorName.substring(0, 1)}
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-primary/30 uppercase">모임 개설자</p>
                    <p className="font-black text-primary">@{gathering.creatorName} 전문가</p>
                  </div>
                </div>
              </div>
            </Card>
          </aside>
        </div>
      </main>
    </div>
  )
}
