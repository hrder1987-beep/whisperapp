
"use client"

import { useState, useMemo, use, useEffect } from "react"
import { Header } from "@/components/chuchot/Header"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useUser, useFirestore, useDoc, useCollection, useMemoFirebase, addDocumentNonBlocking, updateDocumentNonBlocking } from "@/firebase"
import { doc, collection, query, where, deleteDoc } from "firebase/firestore"
import { Gathering, GatheringApplication, GatheringAttendance } from "@/lib/types"
import { Users, Calendar, MapPin, Globe, Sparkles, FileText, Check, X, ArrowLeft, ShieldCheck, Download, Trash2, Clock, Info, CheckCircle2, MessageSquare } from "lucide-react"
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
  const [isSurveyOpen, setIsSurveyOpen] = useState(false)
  const [surveyAnswer, setSurveyAnswer] = useState("")

  const gatheringRef = useMemoFirebase(() => db ? doc(db, "gatherings", id) : null, [db, id])
  const { data: gathering, isLoading: isGatheringLoading } = useDoc<Gathering>(gatheringRef)

  const appsQuery = useMemoFirebase(() => db ? query(collection(db, "gatherings", id, "applications")) : null, [db, id])
  const { data: applications } = useCollection<GatheringApplication>(appsQuery)

  const attendanceQuery = useMemoFirebase(() => db ? query(collection(db, "gatherings", id, "attendance")) : null, [db, id])
  const { data: attendanceList } = useCollection<GatheringAttendance>(attendanceQuery)

  const isCreator = user && gathering && user.uid === gathering.creatorId
  const myApp = applications?.find(a => a.userId === user?.uid)
  const isApproved = myApp?.status === "approved"

  const handleApplyClick = () => {
    if (!user || !gathering) {
      toast({ title: "로그인 필요", description: "참여 신청을 하려면 로그인이 필요합니다.", variant: "destructive" })
      router.push("/auth?mode=login")
      return
    }

    if (gathering.registrationQuestion) {
      setIsSurveyOpen(true)
    } else {
      handleApply()
    }
  }

  const handleApply = async () => {
    if (!user || !gathering || !db) return

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
        surveyAnswer: surveyAnswer.trim() || null,
        appliedAt: Date.now()
      })
      toast({ title: "신청 완료", description: "모임 참여 신청이 완료되었습니다. 개설자의 승인을 기다려주세요!" })
      setIsSurveyOpen(false)
      setSurveyAnswer("")
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
    return <div className="min-h-screen flex items-center justify-center bg-[#F5F6F7]"><Sparkles className="w-12 h-12 animate-spin text-[#03C75A]" /></div>
  }

  if (!gathering) {
    return (
      <div className="min-h-screen bg-[#F5F6F7] flex flex-col items-center justify-center p-4">
        <Info className="w-20 h-20 text-black/10 mb-6" />
        <h1 className="text-2xl font-black text-[#1E1E23]">존재하지 않는 모임입니다.</h1>
        <Button onClick={() => router.push("/gatherings")} variant="ghost" className="mt-4 text-black/40 font-bold">목록으로 돌아가기</Button>
      </div>
    )
  }

  const sessionArray = Array.from({ length: gathering.sessionCount || 1 }, (_, i) => i + 1)
  const isClosed = gathering.status === 'closed' || gathering.participantCount >= gathering.capacity;

  return (
    <div className="min-h-screen bg-[#F5F6F7] pb-32">
      <Header />
      
      <div className="relative h-[300px] md:h-[500px] w-full bg-[#1E1E23]">
        <Image src={gathering.imageUrl || "https://images.unsplash.com/photo-1522071820081-009f0129c71c"} alt={gathering.title} fill className="object-cover opacity-60" priority />
        <div className="absolute inset-0 bg-gradient-to-t from-[#1E1E23] via-transparent to-transparent"></div>
        
        <div className="absolute top-8 left-4 md:left-8">
          <Button onClick={() => router.push("/gatherings")} className="bg-white/10 hover:bg-white/20 text-white backdrop-blur-md border border-white/10 font-black rounded-none h-12 px-6 gap-2">
            <ArrowLeft className="w-4 h-4" /> 목록으로 돌아가기
          </Button>
        </div>

        <div className="absolute bottom-12 left-4 md:left-8 right-4 md:right-8 max-w-7xl mx-auto">
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap gap-2">
              <Badge className="bg-[#03C75A] text-white font-black border-none px-4 py-1.5 rounded-none text-xs">#{gathering.category}</Badge>
              <Badge className="bg-white/20 backdrop-blur-md text-white font-black border border-white/20 px-4 py-1.5 rounded-none text-xs">
                {gathering.type === 'online' ? '온라인 모임' : '오프라인 모임'}
              </Badge>
            </div>
            <h1 className="text-3xl md:text-5xl font-black text-white tracking-tighter leading-tight max-w-4xl">{gathering.title}</h1>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          <div className="lg:col-span-8 space-y-10">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="bg-white border-b border-black/5 p-0 h-16 w-full flex justify-start rounded-none mb-10 overflow-x-auto scrollbar-hide sticky top-20 z-20">
                <TabsTrigger value="overview" className="h-full px-8 rounded-none font-black text-sm data-[state=active]:bg-transparent data-[state=active]:text-[#03C75A] data-[state=active]:border-b-4 data-[state=active]:border-[#03C75A]">상세 소개</TabsTrigger>
                <TabsTrigger value="sessions" className="h-full px-8 rounded-none font-black text-sm data-[state=active]:bg-transparent data-[state=active]:text-[#03C75A] data-[state=active]:border-b-4 data-[state=active]:border-[#03C75A]">프로젝트 회차/출석</TabsTrigger>
                <TabsTrigger value="lms" className="h-full px-8 rounded-none font-black text-sm data-[state=active]:bg-transparent data-[state=active]:text-[#03C75A] data-[state=active]:border-b-4 data-[state=active]:border-[#03C75A]">참여자 자료실</TabsTrigger>
                {isCreator && (
                  <TabsTrigger value="admin" className="h-full px-8 rounded-none font-black text-sm data-[state=active]:bg-transparent data-[state=active]:text-[#03C75A] data-[state=active]:border-b-4 data-[state=active]:border-[#03C75A] gap-2">
                    <ShieldCheck className="w-4 h-4" /> 개설자 관리
                  </TabsTrigger>
                )}
              </TabsList>

              <div className="bg-white p-8 md:p-12 border border-black/5 shadow-sm">
                <TabsContent value="overview" className="mt-0">
                  <div className="prose prose-slate max-w-none">
                    <p className="text-lg leading-relaxed text-[#404040] whitespace-pre-wrap font-medium">{gathering.description}</p>
                  </div>
                </TabsContent>

                <TabsContent value="sessions" className="mt-0">
                  {(isApproved || isCreator) ? (
                    <div className="space-y-8">
                      <div className="bg-[#F5F6F7] p-6 border-l-4 border-[#03C75A]">
                        <h4 className="font-black text-[#1E1E23] text-lg mb-1">정기 세션 참석 관리</h4>
                        <p className="text-xs font-bold text-[#888]">각 회차별 전문가님의 참석 여부를 제출해 주세요.</p>
                      </div>

                      <div className="grid grid-cols-1 gap-4">
                        {sessionArray.map(sessionNum => {
                          const myAttendance = attendanceList?.find(a => a.userId === user?.uid && a.sessionId === sessionNum)
                          return (
                            <div key={sessionNum} className="p-6 bg-white border border-black/5 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-[#03C75A] transition-all">
                              <div className="flex items-center gap-6">
                                <div className={cn(
                                  "w-12 h-12 flex items-center justify-center font-black text-lg border-2",
                                  myAttendance?.status === 'attending' ? "bg-[#03C75A] text-white border-[#03C75A]" : "bg-[#F5F6F7] text-black/20 border-transparent"
                                )}>
                                  {sessionNum}
                                </div>
                                <div>
                                  <p className="font-black text-[#1E1E23] text-lg">{sessionNum}회차 정기 프로젝트</p>
                                  <p className="text-xs font-bold text-black/30">일정 및 장소는 공지사항을 참조하세요.</p>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-3">
                                <Button 
                                  onClick={() => handleSubmitAttendance(sessionNum, 'attending')}
                                  className={cn(
                                    "h-11 rounded-none font-black text-xs gap-2 px-6",
                                    myAttendance?.status === 'attending' ? "bg-[#03C75A] text-white" : "bg-[#F5F6F7] text-black/40 hover:bg-black/5"
                                  )}
                                >
                                  <CheckCircle2 className="w-4 h-4" /> 참석 완료
                                </Button>
                                <Button 
                                  onClick={() => handleSubmitAttendance(sessionNum, 'absent')}
                                  variant="ghost"
                                  className={cn(
                                    "h-11 rounded-none font-black text-xs gap-2 px-6",
                                    myAttendance?.status === 'absent' ? "bg-red-50 text-red-500" : "text-black/20 hover:text-red-500"
                                  )}
                                >
                                  불참
                                </Button>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="py-24 text-center bg-[#F5F6F7] space-y-6">
                      <Users className="w-16 h-16 text-black/5 mx-auto" />
                      <div className="space-y-2">
                        <h3 className="text-xl font-black text-[#1E1E23]">승인된 멤버 전용 대시보드입니다.</h3>
                        <p className="text-sm font-bold text-[#888]">모임 참여 승인 후 매 세션의 출석과 자료를 관리하실 수 있습니다.</p>
                      </div>
                      <Button onClick={handleApplyClick} disabled={!!myApp} className="bg-[#1E1E23] text-[#03C75A] font-black h-14 px-10 rounded-none text-sm">
                        {myApp ? "신청 대기 중" : "지금 참여 신청하기"}
                      </Button>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="lms" className="mt-0">
                  {(isApproved || isCreator) ? (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-4">
                          <div className="p-3 bg-[#03C75A]/10 text-[#03C75A]"><FileText className="w-6 h-6" /></div>
                          <div>
                            <h4 className="font-black text-[#1E1E23] text-xl">공유 자료실</h4>
                            <p className="text-xs font-bold text-[#888]">프로젝트 진행에 필요한 서식 및 강의안 모음</p>
                          </div>
                        </div>
                      </div>
                      
                      {(!gathering.resources || gathering.resources.length === 0) ? (
                        <div className="py-24 text-center border-2 border-dashed border-black/5">
                          <p className="text-black/20 font-black">아직 등록된 자료가 없습니다.</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {gathering.resources.map((res, i) => (
                            <div key={i} className="p-6 bg-white border border-black/5 flex items-center justify-between group hover:border-[#03C75A] transition-all">
                              <div className="flex items-center gap-4 min-w-0">
                                <FileText className="w-6 h-6 text-[#03C75A] shrink-0" />
                                <div className="min-w-0">
                                  <span className="font-bold text-[#1E1E23] text-base truncate block">{res.title}</span>
                                  {res.sessionId && <Badge className="bg-[#F5F6F7] text-black/40 font-black text-[9px] border-none px-2 h-5 mt-1">{res.sessionId}회차 자료</Badge>}
                                </div>
                              </div>
                              <Button variant="ghost" size="icon" className="text-black/20 hover:text-[#03C75A] shrink-0"><Download className="w-5 h-5" /></Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="py-24 text-center bg-[#F5F6F7] space-y-6">
                      <ShieldCheck className="w-16 h-16 text-black/5 mx-auto" />
                      <div className="space-y-2">
                        <h3 className="text-xl font-black text-[#1E1E23]">자료실은 참여 멤버 전용입니다.</h3>
                        <p className="text-sm font-bold text-[#888]">모임 신청 후 승인이 완료되면 모든 학습 자료를 이용하실 수 있습니다.</p>
                      </div>
                      <Button onClick={handleApplyClick} disabled={!!myApp} className="bg-[#1E1E23] text-[#03C75A] font-black h-14 px-10 rounded-none text-sm">
                        {myApp ? "승인 대기 중" : "지금 참여 신청하기"}
                      </Button>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="admin" className="mt-0 space-y-10">
                  <section className="space-y-6">
                    <div className="flex items-center justify-between border-b border-black/5 pb-6">
                      <h3 className="text-xl font-black text-[#1E1E23] flex items-center gap-3">
                        <Users className="w-6 h-6 text-[#03C75A]" /> 신청 전문가 명단 ({applications?.filter(a => a.status === 'pending').length})
                      </h3>
                    </div>
                    
                    <div className="divide-y divide-black/5">
                      {(!applications || applications.length === 0) ? (
                        <div className="py-20 text-center text-black/20 font-black">신청자가 아직 없습니다.</div>
                      ) : (
                        applications.map(app => (
                          <div key={app.id} className="py-8 flex flex-col gap-6 hover:bg-[#F5F6F7]/50 transition-all px-4">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                              <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-[#1E1E23] text-[#03C75A] flex items-center justify-center font-black text-lg">
                                  {app.userName.substring(0, 1)}
                                </div>
                                <div>
                                  <p className="font-black text-[#1E1E23] text-lg">@{app.userName}</p>
                                  <p className="text-[10px] font-bold text-black/30 flex items-center gap-1.5 uppercase tracking-widest"><Clock className="w-3 h-3" /> {formatDistanceToNow(app.appliedAt, { addSuffix: true, locale: ko })}</p>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-2">
                                {app.status === 'pending' ? (
                                  <>
                                    <Button onClick={() => handleApprove(app)} className="bg-[#03C75A] text-white font-black rounded-none h-11 px-6 gap-2 text-xs">
                                      <Check className="w-4 h-4" /> 승인
                                    </Button>
                                    <Button onClick={() => handleReject(app)} variant="ghost" className="text-red-500 hover:bg-red-50 font-black rounded-none h-11 px-6 gap-2 text-xs">
                                      <X className="w-4 h-4" /> 반려
                                    </Button>
                                  </>
                                ) : (
                                  <Badge className={cn("px-6 py-2 rounded-none font-black text-[10px] border-none shadow-sm", app.status === 'approved' ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-500")}>
                                    {app.status === 'approved' ? "승인 완료" : "반려 처리됨"}
                                  </Badge>
                                )}
                              </div>
                            </div>

                            {app.surveyAnswer && (
                              <div className="bg-white border border-black/5 p-5 rounded-none space-y-2">
                                <p className="text-[10px] font-black text-[#03C75A] uppercase tracking-widest flex items-center gap-1.5"><MessageSquare className="w-3 h-3" /> 신청자 답변</p>
                                <p className="text-sm font-bold text-[#1E1E23] leading-relaxed italic">"{app.surveyAnswer}"</p>
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </section>
                </TabsContent>
              </div>
            </Tabs>
          </div>

          <aside className="lg:col-span-4 space-y-8">
            <Card className="bg-white border border-black/5 shadow-lg rounded-none p-8 space-y-10 sticky top-32">
              <h4 className="text-xl font-black text-[#1E1E23] border-b border-black/5 pb-6">프로젝트 참여 정보</h4>
              
              <div className="space-y-8">
                <div className="space-y-2">
                  <span className="text-[10px] font-black text-black/30 uppercase tracking-[0.2em] ml-1">전체 모임 일정</span>
                  <div className="flex items-center gap-4 font-bold text-[#1E1E23] text-sm bg-[#F5F6F7] p-4">
                    <Calendar className="w-5 h-5 text-[#03C75A]" />
                    {gathering.schedule}
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-[10px] font-black text-black/30 uppercase tracking-[0.2em] ml-1">장소 안내</span>
                  <div className="flex items-center gap-4 font-bold text-[#1E1E23] text-sm bg-[#F5F6F7] p-4">
                    {gathering.type === "online" ? <Globe className="w-5 h-5 text-[#03C75A]" /> : <MapPin className="w-5 h-5 text-[#03C75A]" />}
                    {gathering.type === "online" ? "온라인(링크 개별 공지)" : gathering.location}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-[10px] font-black text-black/30 uppercase tracking-[0.2em]">모집 현황</span>
                    <span className="text-sm font-black text-[#03C75A]">{gathering.participantCount} / {gathering.capacity} 명</span>
                  </div>
                  <Progress value={(gathering.participantCount / gathering.capacity) * 100} className="h-2 bg-black/5" />
                </div>
              </div>

              {!isCreator && (
                <div className="pt-4">
                  {myApp ? (
                    <div className={cn(
                      "w-full h-16 rounded-none flex items-center justify-center font-black text-base gap-3 border",
                      myApp.status === 'pending' ? "bg-[#F5F6F7] text-black/30 border-transparent" : 
                      myApp.status === 'approved' ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-red-50 text-red-500 border-red-100"
                    )}>
                      {myApp.status === 'pending' ? <Clock className="w-5 h-5" /> : myApp.status === 'approved' ? <CheckCircle2 className="w-5 h-5" /> : <X className="w-5 h-5" />}
                      {myApp.status === 'pending' ? "참여 승인 대기 중" : myApp.status === 'approved' ? "참여 중인 프로젝트" : "신청이 반려되었습니다"}
                    </div>
                  ) : (
                    <Button 
                      onClick={handleApplyClick} 
                      disabled={isApplying || isClosed}
                      className={cn(
                        "w-full h-16 text-lg font-black rounded-none shadow-xl gap-3 transition-all",
                        isClosed ? "bg-black/10 text-black/30 cursor-not-allowed" : "bg-[#1E1E23] text-[#03C75A] hover:brightness-110"
                      )}
                    >
                      {isClosed ? "모집이 마감되었습니다" : isApplying ? "신청서 전송 중..." : "지금 프로젝트 참여하기"}
                    </Button>
                  )}
                </div>
              )}

              <div className="pt-8 border-t border-black/5">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-[#1E1E23] text-[#03C75A] flex items-center justify-center font-black text-lg">
                    {gathering.creatorName.substring(0, 1)}
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-black/30 uppercase tracking-widest">Project Host</p>
                    <p className="font-black text-[#1E1E23] text-base">@{gathering.creatorName} 전문가</p>
                  </div>
                </div>
              </div>
            </Card>
          </aside>
        </div>
      </main>

      <Dialog open={isSurveyOpen} onOpenChange={setIsSurveyOpen}>
        <DialogContent className="max-w-xl bg-white border-none rounded-none p-0 shadow-2xl overflow-hidden">
          <DialogHeader className="bg-white border-b border-black/5 p-6">
            <DialogTitle className="text-xl font-black text-accent">참가 신청 사전 설문</DialogTitle>
            <p className="text-black/40 text-[10px] font-bold mt-0.5 uppercase tracking-widest">Pre-registration Question</p>
          </DialogHeader>
          <div className="p-8 space-y-6">
            <div className="bg-[#F5F6F7] p-6 border-l-4 border-[#03C75A]">
              <p className="text-xs font-black text-black/30 uppercase tracking-widest mb-2">Host's Question</p>
              <p className="text-lg font-black text-[#1E1E23] leading-tight">{gathering.registrationQuestion}</p>
            </div>
            <div className="space-y-3">
              <Label className="text-sm font-black text-[#1E1E23]">답변을 작성해 주세요</Label>
              <Textarea 
                value={surveyAnswer}
                onChange={(e) => setSurveyAnswer(e.target.value)}
                placeholder="전문가님의 생각을 정갈하게 적어주세요."
                className="min-h-[150px] bg-white border-black/10 rounded-none focus-visible:ring-[#03C75A]/30 p-4 font-bold text-sm leading-relaxed"
              />
            </div>
          </div>
          <DialogFooter className="p-6 bg-[#FBFBFC] border-t border-black/5 flex flex-row gap-2">
            <Button variant="ghost" onClick={() => setIsSurveyOpen(false)} className="flex-1 h-12 font-black rounded-none">취소</Button>
            <Button 
              onClick={handleApply} 
              disabled={isApplying || !surveyAnswer.trim()} 
              className="flex-[2] h-12 naver-button text-base rounded-none shadow-xl"
            >
              {isApplying ? "신청 중..." : "답변 제출 및 신청완료"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
