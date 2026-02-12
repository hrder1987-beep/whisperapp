"use client"

import { useState, useMemo } from "react"
import { useFirestore, useDoc, setDocumentNonBlocking, useMemoFirebase } from "@/firebase"
import { doc } from "firebase/firestore"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { BrainCircuit, Save, FileSpreadsheet, RefreshCcw, Sparkles, UserCog, MessageSquareText, ShieldAlert } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BotType } from "@/lib/types"

export function AldiTrainer() {
  const db = useFirestore()
  const { toast } = useToast()
  
  const [activeBotTab, setActiveBotTab] = useState<BotType>("whisperra")
  
  // 개별 봇 설정 데이터 로드
  const botDocRef = useMemoFirebase(() => db ? doc(db, "admin_configuration", `bot_${activeBotTab}`) : null, [db, activeBotTab])
  const { data: botConfig, isLoading } = useDoc<any>(botDocRef)

  const [knowledge, setKnowledge] = useState("")
  const [persona, setPersona] = useState("")
  const [autoReplyInstruction, setAutoReplyInstruction] = useState("")
  const [isSaving, setIsSaving] = useState(false)

  useMemo(() => {
    if (botConfig) {
      setKnowledge(botConfig.content || "")
      setPersona(botConfig.persona || "")
      setAutoReplyInstruction(botConfig.autoReplyInstruction || "")
    } else {
      setKnowledge(""); setPersona(""); setAutoReplyInstruction("");
    }
  }, [botConfig, activeBotTab])

  const handleSave = () => {
    if (!db) return
    setIsSaving(true)
    
    setDocumentNonBlocking(doc(db, "admin_configuration", `bot_${activeBotTab}`), {
      content: knowledge,
      persona: persona,
      autoReplyInstruction: autoReplyInstruction,
      updatedAt: new Date().toISOString()
    }, { merge: true })

    setTimeout(() => {
      setIsSaving(false)
      toast({ title: "설정 저장 완료", description: `${activeBotTab} 봇의 지능이 업데이트되었습니다.` })
    }, 500)
  }

  const handleCsvImport = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.csv,.txt'
    input.onchange = (e: any) => {
      const file = e.target.files[0]
      const reader = new FileReader()
      reader.onload = (event) => {
        const text = event.target?.result as string
        setKnowledge(prev => prev + "\n\n[추가 주입 데이터]\n" + text)
        toast({ title: "데이터 업로드 성공", description: "지식 베이스에 파일 내용이 추가되었습니다." })
      }
      reader.readAsText(file)
    }
    input.click()
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-500 pb-32">
      <div className="flex flex-col md:flex-row gap-6">
        <Card className="flex-1 bg-white border-none shadow-2xl rounded-[3rem] overflow-hidden">
          <CardHeader className="premium-gradient p-10">
            <div className="flex items-center gap-4 mb-2">
              <div className="bg-accent text-primary p-3 rounded-2xl shadow-xl"><BrainCircuit className="w-8 h-8" /></div>
              <div>
                <CardTitle className="text-3xl font-black text-white">멀티 챗봇 인텔리전스 센터</CardTitle>
                <p className="text-accent/80 text-sm font-bold">3종의 전문 AI 봇에게 각기 다른 자아와 지식을 부여하세요.</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-10">
            <Tabs value={activeBotTab} onValueChange={(v) => setActiveBotTab(v as BotType)} className="space-y-8">
              <TabsList className="bg-primary/5 p-1 rounded-2xl h-16 w-full grid grid-cols-3 mb-10">
                <TabsTrigger value="whisperra" className="rounded-xl font-black text-xs md:text-sm gap-2 data-[state=active]:bg-primary data-[state=active]:text-accent transition-all">위스퍼라 (사례)</TabsTrigger>
                <TabsTrigger value="aldi" className="rounded-xl font-black text-xs md:text-sm gap-2 data-[state=active]:bg-primary data-[state=active]:text-accent transition-all">알디 (정보)</TabsTrigger>
                <TabsTrigger value="dongsan" className="rounded-xl font-black text-xs md:text-sm gap-2 data-[state=active]:bg-primary data-[state=active]:text-accent transition-all">동산 (공간)</TabsTrigger>
              </TabsList>

              <div className="space-y-10">
                <div className="space-y-4">
                  <div className="flex items-center justify-between px-2">
                    <h4 className="text-sm font-black text-primary/40 uppercase tracking-widest flex items-center gap-2">
                      <UserCog className="w-4 h-4" /> 봇 페르소나 (System Prompt)
                    </h4>
                    <span className="text-[10px] text-accent font-black bg-accent/10 px-2 py-1 rounded-md">현재 선택: {activeBotTab}</span>
                  </div>
                  <Textarea 
                    value={persona}
                    onChange={e => setPersona(e.target.value)}
                    placeholder="예: 당신은 20년 경력의 베테랑 실무자입니다. 논리적이지만 따뜻하게 답변하세요."
                    className="min-h-[200px] bg-primary/5 border-none rounded-[2rem] p-8 text-[15px] font-medium focus-visible:ring-accent/30"
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between px-2">
                    <h4 className="text-sm font-black text-primary/40 uppercase tracking-widest flex items-center gap-2">
                      <FileSpreadsheet className="w-4 h-4" /> 지식 베이스 (Data Source)
                    </h4>
                    <Button variant="outline" size="sm" onClick={handleCsvImport} className="border-primary/10 text-primary/60 font-black gap-2 h-10 rounded-xl hover:bg-primary/5">
                      엑셀/CSV 데이터 주입
                    </Button>
                  </div>
                  <Textarea 
                    value={knowledge}
                    onChange={e => setKnowledge(e.target.value)}
                    placeholder="해당 봇이 학습해야 할 핵심 데이터를 텍스트나 CSV 형식으로 붙여넣으세요."
                    className="min-h-[250px] bg-primary/5 border-none rounded-[2rem] p-8 text-[15px] font-medium focus-visible:ring-accent/30"
                  />
                </div>
              </div>

              <Button 
                onClick={handleSave} 
                disabled={isSaving || isLoading} 
                className="w-full h-16 bg-primary text-accent font-black rounded-2xl text-xl shadow-2xl gap-3 hover:scale-[1.02] transition-all mt-10"
              >
                {isSaving ? <RefreshCcw className="w-6 h-6 animate-spin" /> : <Save className="w-6 h-6" />}
                {activeBotTab.toUpperCase()} 봇 지능 업데이트
              </Button>
            </Tabs>
          </CardContent>
        </Card>

        <aside className="w-full md:w-80 space-y-6">
          <Card className="bg-primary text-accent p-8 rounded-[2.5rem] shadow-xl">
            <h5 className="font-black mb-4 flex items-center gap-2"><ShieldAlert className="w-5 h-5" /> 봇별 특화 가이드</h5>
            <div className="space-y-6 text-xs font-bold leading-relaxed opacity-80">
              <div>
                <p className="text-white mb-1">위스퍼라 (Whisperra)</p>
                <p>기업의 실무 사례와 데이터를 주입하세요. '사례 중심' 프롬프트가 기본 적용됩니다.</p>
              </div>
              <div className="h-px bg-white/10" />
              <div>
                <p className="text-white mb-1">알디 (ALDI)</p>
                <p>교육 프로그램 리스트와 담당자 연락처를 주입하세요. 매칭 기능에 최적화됩니다.</p>
              </div>
              <div className="h-px bg-white/10" />
              <div>
                <p className="text-white mb-1">동산 (Dongsan)</p>
                <p>전국 주요 강의장, 연회장 공간 정보를 주입하세요. 예약 가이드에 특화됩니다.</p>
              </div>
            </div>
          </Card>
        </aside>
      </div>
    </div>
  )
}
