"use client"

import { useState, useMemo, useEffect, useDeferredValue } from "react"
import { MainBanner, BannerData } from "@/components/whisper/MainBanner"
import { SubmissionForm } from "@/components/whisper/SubmissionForm"
import { QuestionFeed } from "@/components/whisper/QuestionFeed"
import { RankingList } from "@/components/whisper/RankingList"
import { WhisperChat } from "@/components/whisper/WhisperChat"
import { PremiumAds } from "@/components/whisper/PremiumAds"
import { AnnouncementBar } from "@/components/whisper/AnnouncementBar"
import { Question, Answer, PremiumAd, SiteBranding } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Sparkles, ChevronsLeft, ChevronsRight, Edit3, X, ChevronDown, ListFilter } from "lucide-react"
import { generateAiReply } from "@/ai/flows/generate-ai-reply-flow"
import { cn } from "@/lib/utils"
import { useFirestore, useCollection, useDoc, useMemoFirebase, addDocumentNonBlocking, updateDocumentNonBlocking, useUser } from "@/firebase"
import { collection, query, orderBy, doc, increment } from "firebase/firestore"
import mockData from "@/lib/mock-data.json"

const ITEMS_PER_PAGE = 10 

const TABS = [
  { id: "all", label: "전체" }, 
  { id: "hrm", label: "인사/총무" }, 
  { id: "hrd", label: "HRD/교육" }, 
  { id: "culture", label: "조직문화" }, 
  { id: "popular", label: "인기글" }
]

export function HomeContent({ searchParams }: { searchParams: any }) {
  const { user } = useUser()
  const db = useFirestore()
  
  const [searchQuery, setSearchQuery] = useState(searchParams?.search || "")
  const deferredSearchQuery = useDeferredValue(searchQuery)
  
  const [activeTab, setActiveTab] = useState<"all" | "hrm" | "hrd" | "culture" | "popular">("all")
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isFilterOpen, setIsFilterOpen] = useState(false)

  const questionsQuery = useMemoFirebase(() => db ? query(collection(db, "questions"), orderBy("createdAt", "desc")) : null, [db])
  const { data: dbQuestions } = useCollection<Question>(questionsQuery)

  const configDocRef = useMemoFirebase(() => db ? doc(db, "admin_configuration", "site_settings") : null, [db])
  const { data: config } = useDoc<any>(configDocRef)

  const whisperConfigRef = useMemoFirebase(() => db ? doc(db, "admin_configuration", "aldi_knowledge") : null, [db])
  const { data: whisperConfig } = useDoc<any>(whisperConfigRef)

  const questions = useMemo(() => {
    const merged = [...(dbQuestions || [])];
    const existingIds = new Set(merged.map(q => q.id));
    
    if (mockData.questions) {
      (mockData.questions as Question[]).forEach(mq => { 
        if (!existingIds.has(mq.id)) merged.push(mq); 
      });
    }
    return merged.sort((a, b) => b.createdAt - a.createdAt);
  }, [dbQuestions])

  const branding = useMemo(() => {
    if (config?.brandingSettings) {
      try { return JSON.parse(config.brandingSettings) as SiteBranding } catch (e) { return null }
    }
    return null;
  }, [config]);

  const banners = useMemo(() => {
    if (config?.bannerSettings) {
      try { 
        const parsed = JSON.parse(config.bannerSettings) as BannerData[];
        if (parsed.length > 0) return parsed;
      } catch (e) { }
    }
    return []
  }, [config])

  const premiumAds = useMemo(() => {
    const defaultAds = [
      { id: "ad1", title: "HR Tech Conference 2025\n사전 예약 안내", badge: "SPECIAL", webImage: "https://images.unsplash.com/photo-1540575861501-7ad05823c95b?q=80&w=800", mobileImage: "", link: "#" },
      { id: "ad2", title: "글로벌 인재 채용을 위한\n올인원 솔루션 '위스퍼'", badge: "SOLUTION", webImage: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=800", mobileImage: "", link: "#" },
      { id: "ad3", title: "차세대 C&B 전문가를 위한\n실무 마스터 클래스", badge: "EDUCATION", webImage: "https://images.unsplash.com/photo-1454165833762-01049369290d?q=80&w=800", mobileImage: "", link: "#" }
    ]
    if (config?.premiumAdsSettings) {
      try { 
        const parsed = JSON.parse(config.premiumAdsSettings) as PremiumAd[];
        if (parsed && parsed.length > 0) return parsed;
      } catch (e) { }
    }
    return defaultAds;
  }, [config])

  const dbAnswersQuery = useMemoFirebase(() => (!db || !selectedId) ? null : query(collection(db, "questions", selectedId, "answers"), orderBy("createdAt", "desc")), [db, selectedId])
  const { data: dbAnswers } = useCollection<Answer>(dbAnswersQuery)
  const answers = useMemo(() => dbAnswers?.length ? dbAnswers : (mockData.answers as any[]).filter(a => a.questionId === selectedId), [dbAnswers, selectedId])

  const filtered = useMemo(() => {
    let res = [...questions]
    if (deferredSearchQuery) {
      const q = deferredSearchQuery.toLowerCase();
      res = res.filter(item => (item.title && item.title.toLowerCase().includes(q)) || (item.text && item.text.toLowerCase().includes(q)));
    }
    if (activeTab === "hrm") res = res.filter(q => q.category === "인사전략/HRM");
    if (activeTab === "hrd") res = res.filter(q => q.category === "HRD/교육");
    if (activeTab === "culture") res = res.filter(q => q.category === "조직문화/EVP");
    if (activeTab === "popular") res.sort((a, b) => (b.likeCount || 0) - (a.likeCount || 0));
    return res
  }, [questions, deferredSearchQuery, activeTab])

  const paginated = useMemo(() => filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE), [filtered, currentPage])
  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE)

  useEffect(() => { 
    setCurrentPage(1); 
    setSelectedId(null); 
  }, [deferredSearchQuery, activeTab])

  const handleAddQuestion = (nickname: string, title: string, text: string, imageUrl?: string, videoUrl?: string, category?: string, jobRole?: string) => {
    if (!db || !user) return;
    addDocumentNonBlocking(collection(db, "questions"), {
      title, text, nickname, userId: user.uid, category: category || "기타",
      viewCount: 0, likeCount: 0, answerCount: 0, createdAt: Date.now(), imageUrl: imageUrl || null, videoUrl: videoUrl || null,
      jobTitle: jobRole || null 
    }).then(ref => {
      if (ref) {
        generateAiReply({ title, text, instruction: whisperConfig?.autoReplyInstruction }).then(res => {
          addDocumentNonBlocking(collection(db, "questions", ref.id, "answers"), { questionId: ref.id, text: res.replyText, nickname: "알디", userId: "ai", createdAt: Date.now(), jobTitle: "공식 AI" });
          updateDocumentNonBlocking(doc(db, "questions", ref.id), { answerCount: 1 });
        });
      }
    });
    setIsFormOpen(false);
  }

  const handleAddAnswer = (nickname: string, title: string, text: string, imageUrl?: string, videoUrl?: string, category?: string, jobRole?: string) => {
    if (!db || !selectedId || !user) return;
    const question = questions.find(q => q.id === selectedId);
    addDocumentNonBlocking(collection(db, "questions", selectedId, "answers"), { 
      questionId: selectedId, 
      text, 
      nickname, 
      userId: user.uid, 
      createdAt: Date.now(), 
      jobTitle: jobRole || null 
    }).then(() => {
      if (question && question.userId !== user.uid) {
        addDocumentNonBlocking(collection(db, "notifications"), { 
          userId: question.userId, 
          type: "new_answer", 
          questionId: selectedId, 
          questionTitle: question.title, 
          senderNickname: nickname, 
          createdAt: Date.now(), 
          isRead: false 
        })
      }
    });
    updateDocumentNonBlocking(doc(db, "questions", selectedId), { answerCount: increment(1) });
  }

  const handleSelectQuestion = (id: string) => {
    setSelectedId(id === selectedId ? null : id);
  }

  const handleTabClick = (tabId: any) => {
    setActiveTab(tabId);
    setIsFilterOpen(false);
  }

  const announcements = useMemo(() => {
    if (branding?.announcements && Array.isArray(branding.announcements) && branding.announcements.length > 0) {
      return branding.announcements;
    }
    if (branding?.announcementText) {
      return [{ id: 'legacy', text: branding.announcementText, link: branding.announcementLink || "#" }];
    }
    return [];
  }, [branding]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-x-10">
      <div className="lg:col-span-8 space-y-6">
        <AnnouncementBar 
          announcements={announcements} 
          duration={branding?.announcementAutoSlideDuration || 4} 
        />
        
        <MainBanner banners={banners} autoSlideDuration={branding?.bannerAutoSlideDuration || 3} />
        
        <div className="sticky top-[70px] md:top-[88px] z-30 space-y-1.5">
           {/* --- Mobile Filter --- */}
          <div className="md:hidden bg-white/80 backdrop-blur-md rounded-xl p-2 shadow-sm border border-black/5">
              <Button onClick={() => setIsFilterOpen(!isFilterOpen)} variant="ghost" className="w-full flex items-center justify-between font-bold text-gray-700 h-10 px-3 text-base">
                <div className="flex items-center gap-2">
                  <ListFilter className="w-5 h-5 text-gray-500" />
                  <span>{TABS.find(t => t.id === activeTab)?.label}</span>
                </div>
                <ChevronDown className={cn("w-5 h-5 transition-transform", isFilterOpen && "rotate-180")} />
              </Button>
          </div>

          {/* --- Desktop Filter --- */}
          <div className="hidden md:flex items-center justify-between bg-white/80 backdrop-blur-md rounded-xl p-1.5 shadow-sm border border-black/5">
            <div className="flex items-center gap-x-1 overflow-x-auto scrollbar-hide">
              {TABS.map(t => (
                <button 
                  key={t.id} 
                  onClick={() => handleTabClick(t.id)} 
                  className={cn(
                    "py-2 px-4 rounded-lg text-sm transition-all whitespace-nowrap shrink-0", 
                    activeTab === t.id 
                      ? "font-bold bg-accent text-primary shadow" 
                      : "font-semibold text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {isFilterOpen && (
              <div className="md:hidden absolute top-full left-0 w-full bg-white/95 backdrop-blur-md rounded-xl shadow-lg border border-black/5 mt-1 p-2 animate-in fade-in zoom-in-95">
                  {TABS.map(t => (
                      <button 
                          key={t.id} 
                          onClick={() => handleTabClick(t.id)} 
                          className={cn(
                              "w-full text-left py-3 px-4 rounded-lg text-base transition-colors", 
                              activeTab === t.id 
                                ? "font-bold bg-primary/10 text-primary" 
                                : "font-semibold text-gray-600 hover:bg-gray-100"
                          )}
                      >
                          {t.label}
                      </button>
                  ))}
              </div>
          )}
        </div>

        {isFormOpen && (
          <div className="fixed inset-0 bg-black/50 z-60 animate-in fade-in-25" onClick={() => setIsFormOpen(false)}></div>
        )}
        {isFormOpen && (
          <div className="fixed bottom-0 left-0 right-0 z-60 p-4 animate-in slide-in-from-bottom-10 duration-300">
             <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
                 <div className="p-4 flex items-center justify-between border-b">
                    <h3 className="font-bold text-lg">새로운 지식 공유하기</h3>
                    <Button variant="ghost" size="icon" onClick={() => setIsFormOpen(false)}><X className="w-5 h-5"/></Button>
                 </div>
                <SubmissionForm 
                  type="question" 
                  placeholder={branding?.homeTitle ? `${branding.homeTitle}에서 고민을 나눠보세요` : "HR 고민을 속삭여보세요."} 
                  onSubmit={handleAddQuestion} 
                />
             </div>
          </div>
        )}

        <div className="px-1 md:px-0">
          <QuestionFeed 
            questions={paginated} 
            onSelectQuestion={handleSelectQuestion} 
            selectedId={selectedId} 
            answers={answers} 
            onAddAnswer={handleAddAnswer} 
            activeTab={activeTab as any} 
            onTabChange={setActiveTab as any} 
          />
        </div>
        
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-10">
            <Button variant="ghost" disabled={currentPage === 1} onClick={() => setCurrentPage(1)}><ChevronsLeft className="w-4" /></Button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let p = currentPage - 2 + i;
              if (currentPage <= 2) p = 1 + i;
              if (currentPage >= totalPages - 1) p = totalPages - 4 + i;
              if (p <= 0 || p > totalPages) return null;
              return (
                <Button key={p} onClick={() => setCurrentPage(p)} variant={currentPage === p ? "default" : "outline"} className={cn("w-10 h-10 rounded-xl font-bold text-xs", currentPage === p ? "bg-primary text-accent border-none shadow-lg" : "bg-white border-gray-200")}>{p}</Button>
              );
            })}
            <Button variant="ghost" disabled={currentPage === totalPages} onClick={() => setCurrentPage(totalPages)}><ChevronsRight className="w-4" /></Button>
          </div>
        )}

        <footer className="mt-20 pt-12 border-t border-gray-100 pb-12 px-4 md:px-0 opacity-80">
          <div className="space-y-4 text-center md:text-left">
            <h2 className="text-sm font-bold text-gray-500">{branding?.footerCompany || "(주)위스퍼 인텔리전스"}</h2>
            <div className="text-xs text-gray-400 space-y-1">
                <p>주소: {branding?.footerAddress || "정보가 없습니다."}</p>
                <p>이메일: {branding?.footerEmail || "contact@whisperapp.kr"} | 대표번호: {branding?.footerPhone || "02-1234-5678"}</p>
                <p className="pt-2">{branding?.footerCopyright || "© 2024 Whisper Intelligence. All rights reserved."}</p>
            </div>
          </div>
        </footer>
      </div>

      <aside className="lg:col-span-4 hidden lg:block space-y-8 h-fit sticky top-[88px]">
        <WhisperChat />
        <RankingList questions={[...questions].sort((a,b) => (b.likeCount || 0) - (a.likeCount || 0))} onSelectQuestion={handleSelectQuestion} />
        <PremiumAds ads={premiumAds} />
      </aside>
      
      {/* --- Mobile FAB for writing --- */}
      <div className="fixed bottom-24 right-6 z-50 md:hidden">
          <Button 
            onClick={() => setIsFormOpen(!isFormOpen)}
            className={cn(
              "h-14 w-14 rounded-2xl font-black text-lg gap-2 transition-all shadow-xl",
              isFormOpen 
                ? "bg-gray-300 text-gray-800 scale-95"
                : "bg-primary text-accent hover:bg-primary/90"
            )}
          >
            {isFormOpen ? <X className="w-6 h-6" /> : <Edit3 className="w-6 h-6" />}
          </Button>
      </div>
    </div>
  )
}
