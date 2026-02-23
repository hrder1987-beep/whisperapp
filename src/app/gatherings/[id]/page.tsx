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
import { Gathering, GatheringApplication, GatheringAttendance } from "@/lib/types"
import { Users, Calendar, MapPin, Globe, Sparkles, FileText, Check, X, ArrowLeft, ShieldCheck, Download, Trash2, Clock, Info, CheckCircle2, Circle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { formatDistanceToNow } from "date-fns"
import { ko } from "date-fns/locale"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { cn } from "@/lib/utils"

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

  const attendanceQuery = useMemoFirebase(() => db ? query(collection(db, "gatherings", id, "attendance")) : null, [db, id])
  const { data: attendanceList } = useCollection<GatheringAttendance>(attendanceQuery)

  const isCreator = user && gathering && user.uid === gathering.creatorId
  const myApp = applications?.find(a => a.userId === user?.uid)
  const isApproved = myApp?.status === "approved"

  const handleApply = async () => {
    if (!user || !gathering || !db) {
      toast({ title: "로그인 필요", description: "참여 신청을 하려면 로그인이 필요합니다.", variant: "destructive" })
      if (!user) router.push("/auth?mode=login")
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

  const handleSubmitAttendance = (sessionId: number, status: 'attending' | 'absent') => {
    if (!db || !user || !isApproved) return
    
    const existing = attendanceList?.find(a => a.userId === user.uid && a.sessionId === sessionId)
    
    if (existing) {
      updateDocumentNonBlocking(doc(db, "gatherings", id, "attendance", existing.id), {
        status,
        submittedAt: Date.now()
      })
    } else {
      addDocumentNonBlocking(collection(db, "gatherings", id, "attendance"), {
        gatheringId: id,
        userId: user.uid,
        userName: user.displayName || "익명전문가",
        sessionId,
        status,
        submittedAt: Date.now()
      })
    }
    
    toast({ 
      title: status === 'attending' ? "참석 확인" : "불참 확인", 
      description: `${sessionId}회차 참석 여부가 제출되었습니다.` 
    })
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

  const sessionArray = Array.from({ length: gathering.sessionCount || 1 }, (_, i) => i + 1)

  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-32">
      <Header />
      
      <div className="relative h-[240px] md:h-[400px] w-full">
        <Image src={gathering.imageUrl || "https://images.unsplash.com/photo-1522071820081-009f0129c71c"} alt={gathering.title} fill className="object-cover" priority />
        <div className="absolute inset-0 bg-gradient-to-t from-[#F8F9FA] via-black/20 to-transparent"></div>
        <div className="absolute top-4 left-4 md:top-8 md:left-8">
          <Button onClick={() => router.push("/gatherings")} variant="ghost" className="bg-black/40 backdrop-blur-md text-white hover:bg-white/20 font-black rounded-xl gap-2 h-10 md:h-12 px-4 md:px-6 text-xs md:text-sm">
            <ArrowLeft className="w-4 h-4" /> 목록으로
          </Button>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 -mt-12 md:-mt-20 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-10">
          
          <div className="lg:col-span-8 space-y-6 md:space-y-10">
            <Card className="bg-white border-none shadow-xl md:shadow-2xl rounded-[1.5rem] md:rounded-[2.5rem] overflow-hidden">
              <CardContent className="p-6 md:p-12">
                <div className="flex flex-wrap gap-2 mb-4 md:mb-6">
                  <Badge className="bg-accent text-primary font-black border-none px-3 md:px-4 py-1 rounded-full text-[9px] md:text-[10px]">#{gathering.category}</Badge>
                  <Badge className={cn("font-black border-none px-3 md:px-4 py-1 rounded-full text-[9px] md:text-[10px]", gathering.status === 'recruiting' ? "bg-emerald-500 text-white" : "bg-primary/10 text-primary/40")}>
                    {gathering.status === 'recruiting' ? "모집 중" : "모집 완료"}
                  </Badge>
                  <Badge className="bg-primary text-accent font-black border-none px-3 md:px-4 py-1 rounded-full text-[9px] md:text-[10px]">{gathering.sessionCount}회차 정기 모임</Badge>
                </div>
                
                <h1 className="text-2xl md:text-4xl font-black text-primary tracking-tighter mb-6 md:mb-8 leading-tight">{gathering.title}</h1>
                
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="bg-primary/5 p-1 rounded-2xl h-12 md:h-14 w-full md:w-fit flex mb-6 md:mb-10 overflow-x-auto scrollbar-hide">
                    <TabsTrigger value="overview" className="flex-1 md:flex-none rounded-xl font-black text-[11px] md:text-xs md:px-8 data-[state=active]:bg-white data-[state=active]:shadow-lg">상세 소개</TabsTrigger>
                    <TabsTrigger value="sessions" className="flex-1 md:flex-none rounded-xl font-black text-[11px] md:text-xs md:px-8 data-[state=active]:bg-white data-[state=active]:shadow-lg">세션/출석</TabsTrigger>
                    <TabsTrigger value="lms" className="flex-1 md:flex-none rounded-xl font-black text-[11px] md:text-xs md:px-8 data-[state=active]:bg-white data-[state=active]:shadow-lg">자료실</TabsTrigger>
                    {isCreator && (
                      <TabsTrigger value="admin" className="flex-1 md:flex-none rounded-xl font-black text-[11px] md:text-xs md:px-8 data-[state=active]:bg-primary data-[state=active]:text-accent data-[state=active]:shadow-lg gap-1">
                        <ShieldCheck className="w-3 h-3" /> 관리
                      </TabsTrigger>
                    )}
                  </TabsList>

                  <TabsContent value="overview" className="mt-0">
                    <div className="prose prose-slate max-w-none">
                      <p className="text-[14px] md:text-[16px] leading-relaxed text-primary/70 whitespace-pre-wrap font-medium">{gathering.description}</p>
                    </div>
                  </TabsContent>

                  <TabsContent value="sessions" className="mt-0">
                    {(isApproved || isCreator) ? (
                      <div className="space-y-6 md:space-y-8">
                        <div className="bg-accent/5 border border-accent/20 p-4 md:p-6 rounded-2xl">
                          <h4 className="font-black text-primary text-base md:text-lg mb-1">회차별 출석 체크</h4>
                          <p className="text-[10px] md:text-xs font-bold text-primary/40">각 회차별 모임 참석 여부를 제출해 주세요.</p>
                        </div>

                        <div className="grid grid-cols-1 gap-3 md:gap-4">
                          {sessionArray.map(sessionNum => {
                            const myAttendance = attendanceList?.find(a => a.userId === user?.uid && a.sessionId === sessionNum)
                            return (
                              <div key={sessionNum} className="p-4 md:p-6 bg-white border border-primary/5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 group hover:border-accent transition-all">
                                <div className="flex items-center gap-3 md:gap-4">
                                  <div className={cn(
                                    "w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center font-black text-xs md:text-sm",
                                    myAttendance?.status === 'attending' ? "bg-accent text-primary" : "bg-primary/5 text-primary/30"
                                  )}>
                                    {sessionNum}
                                  </div>
                                  <div>
                                    <p className="font-black text-primary text-sm md:text-base">{sessionNum}회차 정기 세션</p>
                                    <p className="text-[10px] md:text-xs font-bold text-primary/30">일정은 개설자 안내를 참조하세요.</p>
                                  </div>
                                </div>
                                
                                <div className="flex items-center gap-2 w-full md:w-auto">
                                  <Button 
                                    onClick={() => handleSubmitAttendance(sessionNum, 'attending')}
                                    variant={myAttendance?.status === 'attending' ? "default" : "outline"}
                                    className={cn(
                                      "flex-1 md:flex-none h-9 md:h-10 rounded-xl font-black text-[11px] md:text-xs gap-1.5 px-4",
                                      myAttendance?.status === 'attending' ? "bg-accent text-primary" : "border-primary/10 text-primary/40"
                                    )}
                                  >
                                    <CheckCircle2 className="w-3.5 h-3.5" /> 참석
                                  </Button>
                                  <Button 
                                    onClick={() => handleSubmitAttendance(sessionNum, 'absent')}
                                    variant={myAttendance?.status === 'absent' ? "destructive" : "outline"}
                                    className={cn(
                                      "flex-1 md:flex-none h-9 md:h-10 rounded-xl font-black text-[11px] md:text-xs gap-1.5 px-4",
                                      myAttendance?.status === 'absent' ? "bg-red-500 text-white" : "border-primary/10 text-primary/40"
                                    )}
                                  >
                                    <X className="w-3.5 h-3.5" /> 불참
                                  </Button>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    ) : (
                      <div className="py-16 md:py-24 text-center bg-primary/5 rounded-[1.5rem] md:rounded-[2.5rem] space-y-4 md:space-y-6">
                        <Users className="w-12 h-12 md:w-16 md:h-16 text-primary/10 mx-auto" />
                        <div className="space-y-1 md:space-y-2 px-6">
                          <h3 className="text-lg md:text-xl font-black text-primary">승인된 멤버 전용 공간입니다.</h3>
                          <p className="text-[11px] md:text-sm font-bold text-primary/40">모임 참여 승인 후 매월 출석 체크를 하실 수 있습니다.</p>
                        </div>
                        <Button onClick={handleApply} disabled={!!myApp} className="bg-primary text-accent font-black h-11 md:h-12 px-8 md:px-10 rounded-xl text-xs md:text-sm">
                          {myApp ? "승인 대기 중" : "지금 바로 신청하기"}
                        </Button>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="lms" className="mt-0">
                    {(isApproved || isCreator) ? (
                      <div className="space-y-4 md:space-y-6">
                        <div className="bg-accent/5 border border-accent/20 p-4 md:p-6 rounded-2xl flex items-center justify-between">
                          <div className="flex items-center gap-3 md:gap-4">
                            <div className="p-2 bg-accent text-primary rounded-xl"><FileText className="w-4 h-4 md:w-5 md:h-5" /></div>
                            <div>
                              <h4 className="font-black text-primary text-sm md:text-lg">회차별 학습 자료실</h4>
                              <p className="text-[10px] md:text-xs font-bold text-primary/40">각종 템플릿과 강의안이 공유됩니다.</p>
                            </div>
                          </div>
                        </div>
                        
                        {(!gathering.resources || gathering.resources.length === 0) ? (
                          <div className="py-16 md:py-20 text-center bg-white rounded-3xl border border-dashed border-primary/10">
                            <p className="text-primary/20 font-black text-sm">아직 공유된 자료가 없습니다.</p>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                            {gathering.resources.map((res, i) => (
                              <div key={i} className="p-4 md:p-6 bg-white border border-primary/5 rounded-2xl flex items-center justify-between group hover:border-accent transition-all">
                                <div className="flex items-center gap-3 min-w-0">
                                  <FileText className="w-4 h-4 md:w-5 md:h-5 text-accent shrink-0" />
                                  <div className="min-w-0">
                                    <span className="font-bold text-primary text-sm md:text-base truncate block">{res.title}</span>
                                    {res.sessionId && <Badge className="bg-primary/5 text-primary/40 font-black text-[8px] md:text-[9px] border-none px-1.5 h-4 mt-1">{res.sessionId}회차 자료</Badge>}
                                  </div>
                                </div>
                                <Button variant="ghost" size="icon" className="text-primary/20 hover:text-accent shrink-0"><Download className="w-4 h-4 md:w-5 md:h-5" /></Button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="py-16 md:py-24 text-center bg-primary/5 rounded-[1.5rem] md:rounded-[2.5rem] space-y-4 md:space-y-6">
                        <ShieldCheck className="w-12 h-12 md:w-16 md:h-16 text-primary/10 mx-auto" />
                        <div className="space-y-1 md:space-y-2 px-6">
                          <h3 className="text-lg md:text-xl font-black text-primary">참여자 전용 자료실입니다.</h3>
                          <p className="text-[11px] md:text-sm font-bold text-primary/40">모임 신청 후 승인이 완료되면 자료를 보실 수 있습니다.</p>
                        </div>
                        <Button onClick={handleApply} disabled={!!myApp} className="bg-primary text-accent font-black h-11 md:h-12 px-8 md:px-10 rounded-xl text-xs md:text-sm">
                          {myApp ? "승인 대기 중" : "지금 바로 신청하기"}
                        </Button>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="admin" className="mt-0 space-y-6 md:space-y-10">
                    <section className="space-y-4 md:space-y-6">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg md:text-xl font-black text-primary flex items-center gap-2">
                          <Users className="w-5 h-5 md:w-6 md:h-6 text-accent" /> 신청자 명단 ({applications?.filter(a => a.status === 'pending').length})
                        </h3>
                      </div>
                      
                      <div className="bg-primary/5 rounded-2xl md:rounded-3xl overflow-hidden">
                        {(!applications || applications.length === 0) ? (
                          <div className="py-16 md:py-20 text-center text-primary/20 font-black text-sm">아직 신청한 전문가가 없습니다.</div>
                        ) : (
                          <div className="divide-y divide-primary/5">
                            {applications.map(app => (
                              <div key={app.id} className="p-4 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6 hover:bg-white transition-all">
                                <div className="flex items-center gap-3 md:gap-4">
                                  <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-primary text-accent flex items-center justify-center font-black text-sm">
                                    {app.userName.substring(0, 1)}
                                  </div>
                                  <div>
                                    <p className="font-black text-primary text-sm md:text-base">@{app.userName}</p>
                                    <p className="text-[9px] md:text-[10px] font-bold text-primary/30 flex items-center gap-1"><Clock className="w-3 h-3" /> {formatDistanceToNow(app.appliedAt, { addSuffix: true, locale: ko })} 신청</p>
                                  </div>
                                </div>
                                
                                <div className="flex items-center gap-2 md:gap-3 w-full md:w-auto">
                                  {app.status === 'pending' ? (
                                    <>
                                      <Button onClick={() => handleApprove(app)} className="flex-1 md:flex-none bg-emerald-500 hover:bg-emerald-600 text-white font-black rounded-xl h-9 md:h-10 px-4 md:px-5 gap-1.5 text-[11px] md:text-xs">
                                        <Check className="w-3.5 h-3.5" /> 승인
                                      </Button>
                                      <Button onClick={() => handleReject(app)} variant="outline" className="flex-1 md:flex-none border-red-100 text-red-500 hover:bg-red-50 font-black rounded-xl h-9 md:h-10 px-4 md:px-5 gap-1.5 text-[11px] md:text-xs">
                                        <X className="w-3.5 h-3.5" /> 반려
                                      </Button>
                                    </>
                                  ) : (
                                    <Badge className={cn("w-full md:w-auto justify-center font-black px-4 py-1.5 rounded-lg border-none text-[10px]", app.status === 'approved' ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-500")}>
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

          <aside className="lg:col-span-4 space-y-6 md:space-y-8">
            <Card className="bg-white border-none shadow-xl md:shadow-2xl rounded-[1.5rem] md:rounded-[2.5rem] p-6 md:p-8 space-y-6 md:space-y-8 sticky top-32">
              <h4 className="text-base md:text-lg font-black text-primary border-b border-primary/5 pb-4">모임 요약 정보</h4>
              
              <div className="space-y-5 md:space-y-6">
                <div className="flex flex-col gap-1.5">
                  <span className="text-[9px] md:text-[10px] font-black text-primary/30 uppercase tracking-widest">전체 모임 일정</span>
                  <div className="flex items-center gap-3 font-bold text-primary/70 text-xs md:text-sm">
                    <div className="p-1.5 md:p-2 bg-primary/5 rounded-lg"><Calendar className="w-3.5 h-3.5 md:w-4 md:h-4 text-accent" /></div>
                    {gathering.schedule}
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <span className="text-[9px] md:text-[10px] font-black text-primary/30 uppercase tracking-widest">회차 정보</span>
                  <div className="flex items-center gap-3 font-bold text-primary/70 text-xs md:text-sm">
                    <div className="p-1.5 md:p-2 bg-primary/5 rounded-lg"><Clock className="w-3.5 h-3.5 md:w-4 md:h-4 text-accent" /></div>
                    총 {gathering.sessionCount}회차 정기 세션
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <span className="text-[9px] md:text-[10px] font-black text-primary/30 uppercase tracking-widest">장소</span>
                  <div className="flex items-center gap-3 font-bold text-primary/70 text-xs md:text-sm">
                    <div className="p-1.5 md:p-2 bg-primary/5 rounded-lg">
                      {gathering.type === "online" ? <Globe className="w-3.5 h-3.5 md:w-4 md:h-4 text-accent" /> : <MapPin className="w-3.5 h-3.5 md:w-4 md:h-4 text-accent" />}
                    </div>
                    {gathering.type === "online" ? "온라인(상세 링크 별도 공지)" : gathering.location}
                  </div>
                </div>

                <div className="flex flex-col gap-2 md:gap-3">
                  <span className="text-[9px] md:text-[10px] font-black text-primary/30 uppercase tracking-widest">모집 인원 ({gathering.participantCount}/{gathering.capacity})</span>
                  <div className="space-y-1.5 md:space-y-2">
                    <Progress value={(gathering.participantCount / gathering.capacity) * 100} className="h-1.5 md:h-2 bg-primary/5" />
                  </div>
                </div>
              </div>

              {!isCreator && (
                <div className="pt-2 md:pt-4">
                  {myApp ? (
                    <div className={cn(
                      "w-full h-12 md:h-14 rounded-2xl flex items-center justify-center font-black text-sm md:text-base gap-2 md:gap-3",
                      myApp.status === 'pending' ? "bg-primary/5 text-primary/40" : 
                      myApp.status === 'approved' ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-500"
                    )}>
                      {myApp.status === 'pending' ? <Clock className="w-4 h-4 md:w-5 md:h-5" /> : myApp.status === 'approved' ? <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5" /> : <X className="w-4 h-4 md:w-5 md:h-5" />}
                      {myApp.status === 'pending' ? "참여 승인 대기 중" : myApp.status === 'approved' ? "모임 참여 중" : "신청이 반려되었습니다"}
                    </div>
                  ) : (
                    <Button 
                      onClick={handleApply} 
                      disabled={isApplying || gathering.status !== 'recruiting'}
                      className="w-full h-14 md:h-16 bg-primary text-accent hover:bg-primary/95 font-black text-base md:text-lg rounded-xl md:rounded-2xl shadow-xl gap-2 md:gap-3"
                    >
                      {gathering.status !== 'recruiting' ? "모집 마감" : isApplying ? "신청 중..." : "지금 바로 참여하기"}
                    </Button>
                  )}
                </div>
              )}

              <div className="pt-6 md:pt-8 border-t border-primary/5">
                <div className="flex items-center gap-3 md:gap-4">
                  <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-primary text-accent flex items-center justify-center font-black text-sm">
                    {gathering.creatorName.substring(0, 1)}
                  </div>
                  <div>
                    <p className="text-[9px] md:text-[10px] font-black text-primary/30 uppercase">모임 호스트</p>
                    <p className="font-black text-primary text-sm">@{gathering.creatorName} 전문가</p>
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
