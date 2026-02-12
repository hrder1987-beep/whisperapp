
"use client"

import { useState, useEffect, useMemo } from "react"
import { useFirestore, useDoc, setDocumentNonBlocking, useMemoFirebase } from "@/firebase"
import { doc } from "firebase/firestore"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { BrainCircuit, Save, FileSpreadsheet, RefreshCcw, Sparkles, UserCog, ShieldAlert, Info, ListOrdered, Type, HardDrive, Eraser } from "lucide-react"
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
  const [autoReplyInstruction, setAutoReplyInstruction] = useState("")
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (botConfig) {
      setKnowledge(botConfig.content || "")
      setPersona(botConfig.persona || "")
      setAutoReplyInstruction(botConfig.autoReplyInstruction || "")
    } else {
      setKnowledge(""); setPersona(""); setAutoReplyInstruction("");
    }
  }, [botConfig, activeBotTab])

  const stats = useMemo(() => {
    const lines = knowledge.split('\n').filter(l => l.trim()).length
    const chars = knowledge.length
    const sizeKb = (chars / 1024).toFixed(1)
    const isHeavy = parseFloat(sizeKb) > 800
    return { lines, chars, sizeKb, isHeavy }
  }, [knowledge])

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
            const sheetName = workbook.SheetNames[0]
            const worksheet = workbook.Sheets[sheetName]
            const csv = XLSX.utils.sheet_to_csv(worksheet)
            
            setKnowledge(prev => {
              const separator = prev.length > 0 ? "\n\n" : ""
              return prev + separator + `[엑셀 데이터 주입: ${file.name}]\n` + csv
            })
            toast({ title: "엑셀 데이터 변환 성공", description: `${file.name} 내용이 추가되었습니다.` })
          } catch (error) {
            toast({ title: "변환 실패", description: "파일을 읽는 중 오류가 발생했습니다.", variant: "destructive" })
          }
        }
        reader.readAsArrayBuffer(file)
      } else {
        reader.onload = (event) => {
          const text = event.target?.result as string
          setKnowledge(prev => {
            const separator = prev.length > 0 ? "\n\n" : ""
            return prev + separator + `[파일 데이터 추가: ${file.name}]\n` + text
          })
          toast({ title: "데이터 업로드 성공", description: "파일 내용이 추가되었습니다." })
        }
        reader.readAsText(file, "UTF-8")
      }
    }
    input.click()
  }

  return (
    <div className="space-y-6 md:space-y-10 animate-in fade-in duration-500 pb-32">
      <div className="flex flex-col lg:flex-row gap-6 md:gap-10">
        <Card className="flex-1 bg-white border-none shadow-2xl rounded-[2.5rem] md:rounded-[3rem] overflow-hidden">
          <CardHeader className="premium-gradient p-6 md:p-10">
            <div className="flex items-center gap-4 mb-2">
              <div className="bg-accent text-primary p-2 md:p-3 rounded-2xl shadow-xl"><BrainCircuit className="w-6 h-6 md:w-8 md:h-8" /></div>
              <div>
                <CardTitle className="text-xl md:text-3xl font-black text-white">멀티 봇 인텔리전스 센터</CardTitle>
                <p className="text-accent/80 text-[10px] md:text-sm font-bold">3종의 전문 AI 봇에게 각기 다른 자아와 지식을 부여하세요.</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6 md:p-10">
            <Tabs value={activeBotTab} onValueChange={(v) => setActiveBotTab(v as BotType)} className="space-y-6 md:space-y-8">
              <TabsList className="bg-primary/5 p-1 rounded-2xl h-14 md:h-16 w-full grid grid-cols-3 mb-6 md:mb-10">
                <TabsTrigger value="whisperra" className="rounded-xl font-black text-[10px] md:text-sm data-[state=active]:bg-primary data-[state=active]:text-accent">위스퍼라</TabsTrigger>
                <TabsTrigger value="aldi" className="rounded-xl font-black text-[10px] md:text-sm data-[state=active]:bg-primary data-[state=active]:text-accent">알디</TabsTrigger>
                <TabsTrigger value="dongsan" className="rounded-xl font-black text-[10px] md:text-sm data-[state=active]:bg-primary data-[state=active]:text-accent">동산</TabsTrigger>
              </TabsList>

              <div className="space-y-8 md:space-y-10">
                <div className="space-y-4">
                  <h4 className="text-xs md:text-sm font-black text-primary/40 uppercase tracking-widest flex items-center gap-2 px-2">
                    <UserCog className="w-4 h-4" /> 봇 페르소나 (지침)
                  </h4>
                  <Textarea 
                    value={persona}
                    onChange={e => setPersona(e.target.value)}
                    placeholder="예: 당신은 기업 사례 전문가입니다. 구체적인 성공/실패 데이터를 근거로 답변하세요."
                    className="min-h-[120px] md:min-h-[150px] bg-primary/5 border-none rounded-[1.5rem] md:rounded-[2rem] p-5 md:p-8 text-sm font-medium focus-visible:ring-accent/30"
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-2">
                    <h4 className="text-xs md:text-sm font-black text-primary/40 uppercase tracking-widest flex items-center gap-2">
                      <FileSpreadsheet className="w-4 h-4" /> 지식 베이스 (학습 데이터)
                    </h4>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" onClick={() => setKnowledge("")} className="text-red-400 hover:text-red-600 hover:bg-red-50 font-black gap-1.5 h-9 rounded-xl text-[10px]">
                        <Eraser className="w-3.5 h-3.5" /> 초기화
                      </Button>
                      <Button variant="outline" size="sm" onClick={handleFileImport} className="border-primary/10 text-primary/60 font-black gap-1.5 h-9 rounded-xl hover:bg-primary/5 text-[10px]">
                        파일 추가
                      </Button>
                    </div>
                  </div>
                  <div className="relative group">
                    <Textarea 
                      value={knowledge}
                      onChange={e => setKnowledge(e.target.value)}
                      placeholder="학습할 텍스트나 데이터를 입력하세요."
                      className="min-h-[300px] md:min-h-[400px] bg-primary/5 border-none rounded-[1.5rem] md:rounded-[2rem] p-5 md:p-8 text-xs md:text-sm font-medium focus-visible:ring-accent/30 leading-relaxed scrollbar-hide"
                    />
                    
                    <div className="absolute bottom-4 right-4 md:bottom-6 md:right-8 flex flex-wrap justify-end gap-2 md:gap-4 bg-white/90 backdrop-blur-md px-3 py-2 md:px-5 md:py-2.5 rounded-xl md:rounded-2xl border border-primary/5 shadow-xl">
                      <div className="flex items-center gap-1 md:gap-1.5 border-r border-primary/10 pr-2 md:pr-4">
                        <ListOrdered className="w-3 h-3 md:w-3.5 md:h-3.5 text-accent" />
                        <span className="text-[9px] md:text-[11px] font-black text-primary/60">{stats.lines.toLocaleString()} 줄</span>
                      </div>
                      <div className="flex items-center gap-1 md:gap-1.5">
                        <HardDrive className={cn("w-3 h-3 md:w-3.5 md:h-3.5", stats.isHeavy ? "text-red-500" : "text-accent")} />
                        <span className={cn("text-[9px] md:text-[11px] font-black", stats.isHeavy ? "text-red-500" : "text-primary/60")}>
                          {stats.sizeKb} KB
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <Button 
                onClick={handleSave} 
                disabled={isSaving || isLoading} 
                className="w-full h-14 md:h-16 bg-primary text-accent font-black rounded-2xl text-base md:text-xl shadow-2xl gap-3 hover:scale-[1.02] transition-all mt-6 md:mt-10"
              >
                {isSaving ? <RefreshCcw className="w-5 h-5 md:w-6 md:h-6 animate-spin" /> : <Save className="w-5 h-5 md:w-6 md:h-6" />}
                {activeBotTab.toUpperCase()} 업데이트 완료
              </Button>
            </Tabs>
          </CardContent>
        </Card>

        <aside className="w-full lg:w-80 space-y-6">
          <Card className="bg-primary text-accent p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] shadow-xl">
            <h5 className="font-black text-sm md:text-base mb-4 flex items-center gap-2"><ShieldAlert className="w-5 h-5" /> 전문 봇 관리 팁</h5>
            <div className="space-y-5 text-[10px] md:text-xs font-bold leading-relaxed opacity-80">
              <div className="space-y-1">
                <p className="text-white">위스퍼라 (사례)</p>
                <p>실제 기업의 프로젝트 데이터와 인터뷰 내용을 주입해 보세요.</p>
              </div>
              <div className="h-px bg-white/10" />
              <div className="space-y-1">
                <p className="text-white">알디 (정보)</p>
                <p>교육 프로그램 일정과 담당자 연락처를 주입하면 매칭률이 올라갑니다.</p>
              </div>
              <div className="h-px bg-white/10" />
              <div className="space-y-1">
                <p className="text-white">동산 (공간)</p>
                <p>강의장 수용 인원, 대관료 정보를 주입하면 전문가급 상담이 가능합니다.</p>
              </div>
            </div>
          </Card>
        </aside>
      </div>
    </div>
  )
}
