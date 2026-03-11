
"use client"

import { useState, useMemo, useEffect, useDeferredValue, Suspense } from "react"
import { Header } from "@/components/whisper/Header"
import { MainBanner, BannerData } from "@/components/whisper/MainBanner"
import { SubmissionForm } from "@/components/whisper/SubmissionForm"
import { QuestionFeed } from "@/components/whisper/QuestionFeed"
import { RankingList } from "@/components/whisper/RankingList"
import { WhisperChat } from "@/components/whisper/WhisperChat"
import { PremiumAds } from "@/components/whisper/PremiumAds"
import { AnnouncementBar } from "@/components/whisper/AnnouncementBar"
import { Question, Answer, PremiumAd, SiteBranding } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Sparkles, ChevronsLeft, ChevronsRight } from "lucide-react"
import { generateAiReply } from "@/ai/flows/generate-ai-reply-flow"
import { cn } from "@/lib/utils"
import { useFirestore, useCollection, useDoc, useMemoFirebase, addDocumentNonBlocking, updateDocumentNonBlocking, useUser } from "@/firebase"
import { collection, query, orderBy, doc, increment } from "firebase/firestore"
import mockData from "@/lib/mock-data.json"
import { useSearchParams } from "next/navigation"

const ITEMS_PER_PAGE = 5 

function HomePageContent() {
  const { user } = useUser()
  const db = useFirestore()
  const searchParams = useSearchParams()
  
  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "")
  const deferredSearchQuery = useDeferredValue(searchQuery)
  
  const [activeTab, setActiveTab] = useState<"all" | "hrm" | "hrd" | "culture" | "popular">("all")
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)

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

  // 멀티 공지사항 지원을 위한 데이터 가공 (방어 코드 추가)
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
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
      <main className="lg:col-span-8 space-y-6 md:space-y-8">
        <AnnouncementBar 
          announcements={announcements} 
          duration={branding?.announcementAutoSlideDuration || 4} 
        />
        
        <MainBanner banners={banners} autoSlideDuration={branding?.bannerAutoSlideDuration || 3} />
        <SubmissionForm type="question" placeholder={branding?.homeTitle ? `${branding.homeTitle}에서 고민을 나눠보세요` : "HR 고민을 속삭여보세요."} onSubmit={handleAddQuestion} />
        
        <div className="flex flex-nowrap overflow-x-auto scrollbar-hide gap-x-6 pb-2 border-b border-black/[0.05]">
          {[{ id: "all", label: "전체 피드" }, { id: "hrm", label: "인사/총무" }, { id: "hrd", label: "HRD/교육" }, { id: "culture", label: "조직문화" }, { id: "popular", label: "인기" }].map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id as any)} className={cn("pb-3 text-[15px] transition-all border-b-2 whitespace-nowrap shrink-0", activeTab === t.id ? "font-black text-primary border-accent" : "font-bold text-accent/40 border-transparent hover:text-accent/60")}>{t.label}</button>
          ))}
        </div>

        <QuestionFeed 
          questions={paginated} 
          onSelectQuestion={handleSelectQuestion} 
          selectedId={selectedId} 
          answers={answers} 
          onAddAnswer={handleAddAnswer} 
          activeTab={activeTab as any} 
          onTabChange={setActiveTab as any} 
        />
        
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-10">
            <Button variant="ghost" disabled={currentPage === 1} onClick={() => setCurrentPage(1)}><ChevronsLeft className="w-4" /></Button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let p = currentPage - 2 + i;
              if (currentPage <= 2) p = 1 + i;
              if (currentPage >= totalPages - 1) p = totalPages - 4 + i;
              if (p <= 0 || p > totalPages) return null;
              return (
                <Button key={p} onClick={() => setCurrentPage(p)} variant={currentPage === p ? "default" : "outline"} className={cn("w-9 h-9 rounded-xl font-black text-xs", currentPage === p ? "bg-primary text-accent" : "bg-white")}>{p}</Button>
              );
            })}
            <Button variant="ghost" disabled={currentPage === totalPages} onClick={() => setCurrentPage(totalPages)}><ChevronsRight className="w-4" /></Button>
          </div>
        )}

        <footer className="mt-20 pt-12 border-t border-black/5 pb-12">
          <div className="space-y-6">
            <h2 className="text-xl font-black text-accent">{branding?.footerCompany || "(주)위스퍼 인텔리전스"}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-bold text-accent/40">
              <div className="space-y-1">
                <p>주소: {branding?.footerAddress || "정보가 없습니다."}</p>
                <p>이메일: {branding?.footerEmail || "contact@whisperapp.kr"}</p>
              </div>
              <div className="space-y-1">
                <p>대표번호: {branding?.footerPhone || "02-1234-5678"}</p>
                <p>{branding?.footerCopyright || "© 2024 Whisper Intelligence. All rights reserved."}</p>
              </div>
            </div>
          </div>
        </footer>
      </main>

      <aside className="lg:col-span-4 hidden lg:block space-y-8 h-fit relative">
        <WhisperChat />
        <RankingList questions={[...questions].sort((a,b) => (b.likeCount || 0) - (a.likeCount || 0))} onSelectQuestion={handleSelectQuestion} />
        <PremiumAds ads={premiumAds} />
      </aside>
    </div>
  )
}

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <Header />
      <div className="max-w-7xl mx-auto px-4 py-6 md:py-10">
        <Suspense fallback={<div className="flex justify-center py-40"><Sparkles className="w-12 h-12 animate-spin text-accent" /></div>}>
          <HomePageContent />
        </Suspense>
      </div>
    </div>
  )
}
