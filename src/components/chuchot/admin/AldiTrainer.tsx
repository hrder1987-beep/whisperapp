
"use client"

import { useState, useEffect, useMemo } from "react"
import { useFirestore, useDoc, setDocumentNonBlocking, useMemoFirebase } from "@/firebase"
import { doc } from "firebase/firestore"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { BrainCircuit, Save, RefreshCcw, Sparkles, UserCog, ListOrdered, HardDrive, Eraser, FileText } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BotType } from "@/lib/types"
import { cn } from "@/lib/utils"
import * as XLSX from 'xlsx'

export function AldiTrainer() {
  const db = useFirestore()
  const { toast } = useToast()
  
  const [activeBotTab, setActiveBotTab] = useState<BotType>("whisperra")
  
  const botDocRef = useMemoFirebase(() => db ? doc(db, "admin_configuration", `bot_${activeBotTab}`) : null, [db, activeBotTab])
  const { data: botConfig, isLoading } = useDoc<any>(botDocRef)

  const [knowledge, setKnowledge] = useState("")
  const [persona, setPersona] = useState("")
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (botConfig) {
      setKnowledge(botConfig.content || "")
      setPersona(botConfig.persona || "")
    } else {
      setKnowledge(""); setPersona("");
    }
  }, [botConfig, activeBotTab])

  const stats = useMemo(() => {
    const lines = knowledge.split('\n').filter(l => l.trim()).length
    const chars = knowledge.length
    const sizeKb = (chars / 1024).toFixed(1)
    return { lines, chars, sizeKb }
  }, [knowledge])

  const handleSave = () => {
    if (!db) return
    setIsSaving(true)
    
    setDocumentNonBlocking(doc(db, "admin_configuration", `bot_${activeBotTab}`), {
      content: knowledge,
      persona: persona,
      updatedAt: new Date().toISOString()
    }, { merge: true })

    setTimeout(() => {
      setIsSaving(false)
      toast({ title: "학습 완료", description: `${activeBotTab} 봇이 더 똑똑해졌습니다.` })
    }, 500)
  }

  const handleFileImport = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.csv,.xlsx,.xls,.txt'
    input.onchange = (e: any) => {
      const file = e.target.files[0]
      if (!file) return;
      const reader = new FileReader()
      
      if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        reader.onload = (event) => {
          try {
            const data = new Uint8Array(event.target?.result as ArrayBuffer)
            const workbook = XLSX.read(data, { type: 'array' })
            const csv = XLSX.utils.sheet_to_csv(workbook.Sheets[workbook.SheetNames[0]])
            setKnowledge(prev => (prev ? prev + "\n\n" : "") + `[엑셀 데이터: ${file.name}]\n` + csv)
            toast({ title: "엑셀 데이터 추가됨" })
          } catch (e) { toast({ title: "파일 읽기 실패", variant: "destructive" }) }
        }
        reader.readAsArrayBuffer(file)
      } else {
        reader.onload = (event) => {
          setKnowledge(prev => (prev ? prev + "\n\n" : "") + `[텍스트 데이터: ${file.name}]\n` + event.target?.result)
          toast({ title: "데이터 추가됨" })
        }
        reader.readAsText(file, "UTF-8")
      }
    }
    input.click()
  }

  return (
    <div className="space-y-10 pb-32">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-8">
          <Card className="bg-white border-accent/5 shadow-sm rounded-[2.5rem] overflow-hidden">
            <CardHeader className="p-10 border-b border-accent/5 flex flex-row items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-2xl text-primary shadow-inner"><BrainCircuit className="w-6 h-6" /></div>
                <div>
                  <CardTitle className="text-2xl font-black text-accent">AI 전문 봇 트레이닝</CardTitle>
                  <p className="text-xs font-bold text-accent/30 mt-1">각 봇에게 고유한 지식과 성격을 부여합니다.</p>
                </div>
              </div>
              <Tabs value={activeBotTab} onValueChange={(v) => setActiveBotTab(v as BotType)}>
                <TabsList className="bg-accent/5 p-1 rounded-xl h-11">
                  <TabsTrigger value="whisperra" className="rounded-lg font-black text-[10px] data-[state=active]:bg-white data-[state=active]:text-primary px-4">위스퍼라</TabsTrigger>
                  <TabsTrigger value="aldi" className="rounded-lg font-black text-[10px] data-[state=active]:bg-white data-[state=active]:text-primary px-4">알디</TabsTrigger>
                  <TabsTrigger value="dongsan" className="rounded-lg font-black text-[10px] data-[state=active]:bg-white data-[state=active]:text-primary px-4">동산</TabsTrigger>
                </TabsList>
              </Tabs>
            </CardHeader>
            <CardContent className="p-10 space-y-10">
              <div className="space-y-4">
                <div className="flex items-center gap-2 px-1">
                  <UserCog className="w-4 h-4 text-primary" />
                  <span className="text-[11px] font-black text-accent/40 uppercase tracking-widest">봇 페르소나 (역할 및 지침)</span>
                </div>
                <Textarea 
                  value={persona}
                  onChange={e => setPersona(e.target.value)}
                  placeholder="예: 당신은 채용 전문 AI입니다. 구체적인 면접 질문 예시를 포함하여 답변하세요."
                  className="min-h-[120px] bg-accent/[0.02] border-accent/5 rounded-2xl p-6 text-sm font-medium focus-visible:ring-primary/20 resize-none"
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-primary" />
                    <span className="text-[11px] font-black text-accent/40 uppercase tracking-widest">지식 베이스 (학습 데이터)</span>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => setKnowledge("")} className="text-red-400 hover:bg-red-50 h-8 rounded-lg text-[10px] font-black">초기화</Button>
                    <Button variant="outline" size="sm" onClick={handleFileImport} className="border-accent/10 h-8 rounded-lg text-[10px] font-black">데이터 파일 추가</Button>
                  </div>
                </div>
                <div className="relative">
                  <Textarea 
                    value={knowledge}
                    onChange={e => setKnowledge(e.target.value)}
                    placeholder="학습시킬 텍스트 데이터를 입력하거나 파일을 업로드하세요."
                    className="min-h-[400px] bg-accent/[0.02] border-accent/5 rounded-2xl p-8 text-xs font-medium focus-visible:ring-primary/20 leading-relaxed scrollbar-hide"
                  />
                  <div className="absolute bottom-6 right-6 flex items-center gap-4 bg-white/80 backdrop-blur px-4 py-2 rounded-xl border border-accent/5 shadow-sm">
                    <div className="flex items-center gap-1.5 border-r border-accent/10 pr-4">
                      <ListOrdered className="w-3.5 h-3.5 text-primary" />
                      <span className="text-[10px] font-black text-accent/60">{stats.lines.toLocaleString()} Lines</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <HardDrive className="w-3.5 h-3.5 text-primary" />
                      <span className="text-[10px] font-black text-accent/60">{stats.sizeKb} KB</span>
                    </div>
                  </div>
                </div>
              </div>

              <Button 
                onClick={handleSave} 
                disabled={isSaving || isLoading} 
                className="w-full h-14 bg-primary text-white font-black rounded-2xl text-lg shadow-xl hover:scale-[1.01] transition-all"
              >
                {isSaving ? <RefreshCcw className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                {activeBotTab.toUpperCase()} 인텔리전스 업데이트
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-4 space-y-6">
          <Card className="bg-accent text-white p-8 rounded-[2.5rem] shadow-xl">
            <h4 className="font-black text-base mb-6 flex items-center gap-2"><Sparkles className="w-5 h-5 text-primary" /> 학습 가이드</h4>
            <div className="space-y-6 text-xs font-medium leading-relaxed opacity-80">
              <div>
                <p className="font-black text-primary mb-1">정확한 인용</p>
                <p>전문가가 직접 입력한 데이터는 AI 추론보다 우선적으로 답변에 활용됩니다.</p>
              </div>
              <div className="h-px bg-white/10" />
              <div>
                <p className="font-black text-primary mb-1">엑셀 데이터 활용</p>
                <p>회원 명부나 프로그램 일정 등을 엑셀로 업로드하면 훨씬 정교한 매칭이 가능합니다.</p>
              </div>
              <div className="h-px bg-white/10" />
              <div>
                <p className="font-black text-primary mb-1">페르소나 설정</p>
                <p>봇의 말투나 전문 분야를 구체적으로 명시할수록 답변의 품질이 올라갑니다.</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
