
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
  
  // 개별 봇 설정 데이터 로드
  const botDocRef = useMemoFirebase(() => db ? doc(db, "admin_configuration", `bot_${activeBotTab}`) : null, [db, activeBotTab])
  const { data: botConfig, isLoading } = useDoc<any>(botDocRef)

  const [knowledge, setKnowledge] = useState("")
  const [persona, setPersona] = useState("")
  const [autoReplyInstruction, setAutoReplyInstruction] = useState("")
  const [isSaving, setIsSaving] = useState(false)

  // 데이터 로딩 로직 안정화 (useEffect 사용)
  useEffect(() => {
    if (botConfig) {
      setKnowledge(botConfig.content || "")
      setPersona(botConfig.persona || "")
      setAutoReplyInstruction(botConfig.autoReplyInstruction || "")
    } else {
      setKnowledge(""); setPersona(""); setAutoReplyInstruction("");
    }
  }, [botConfig, activeBotTab])

  // 데이터 통계 계산
  const stats = useMemo(() => {
    const lines = knowledge.split('\n').filter(l => l.trim()).length
    const chars = knowledge.length
    const sizeKb = (chars / 1024).toFixed(1)
    const isHeavy = parseFloat(sizeKb) > 800 // 1MB(1024KB) 제한 대비 80% 수준 경고
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
            
            // 기존 데이터 유지하며 추가
            setKnowledge(prev => {
              const separator = prev.length > 0 ? "\n\n" : ""
              return prev + separator + `[엑셀 데이터 주입: ${file.name}]\n` + csv
            })
            toast({ title: "엑셀 데이터 변환 성공", description: `${file.name}의 내용을 지식 베이스에 추가했습니다.` })
          } catch (error) {
            toast({ title: "변환 실패", description: "엑셀 파일을 읽는 중 오류가 발생했습니다.", variant: "destructive" })
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
          toast({ title: "데이터 업로드 성공", description: "파일 내용을 지식 베이스에 추가했습니다." })
        }
        reader.readAsText(file, "UTF-8")
      }
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
                    className="min-h-[150px] bg-primary/5 border-none rounded-[2rem] p-8 text-[15px] font-medium focus-visible:ring-accent/30"
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between px-2">
                    <div className="space-y-1">
                      <h4 className="text-sm font-black text-primary/40 uppercase tracking-widest flex items-center gap-2">
                        <FileSpreadsheet className="w-4 h-4" /> 지식 베이스 (Data Source)
                      </h4>
                      <p className="text-[10px] text-primary/20 font-bold ml-6">* 엑셀 데이터는 텍스트(CSV)로 자동 변환되어 하단에 추가됩니다.</p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" onClick={() => setKnowledge("")} className="text-red-400 hover:text-red-600 hover:bg-red-50 font-black gap-2 h-10 rounded-xl">
                        <Eraser className="w-4 h-4" /> 데이터 초기화
                      </Button>
                      <Button variant="outline" size="sm" onClick={handleFileImport} className="border-primary/10 text-primary/60 font-black gap-2 h-10 rounded-xl hover:bg-primary/5">
                        엑셀/CSV 데이터 추가
                      </Button>
                    </div>
                  </div>
                  <div className="relative group">
                    <Textarea 
                      value={knowledge}
                      onChange={e => setKnowledge(e.target.value)}
                      placeholder="해당 봇이 학습해야 할 핵심 데이터를 텍스트나 CSV 형식으로 붙여넣으세요."
                      className="min-h-[350px] bg-primary/5 border-none rounded-[2rem] p-8 text-[14px] font-medium focus-visible:ring-accent/30 leading-relaxed scrollbar-hide"
                    />
                    
                    {/* 데이터 통계 오버레이 */}
                    <div className="absolute bottom-6 right-8 flex items-center gap-4 bg-white/80 backdrop-blur-md px-5 py-2.5 rounded-2xl border border-primary/5 shadow-xl">
                      <div className="flex items-center gap-1.5 border-r border-primary/10 pr-4">
                        <ListOrdered className="w-3.5 h-3.5 text-accent" />
                        <span className="text-[11px] font-black text-primary/60">{stats.lines.toLocaleString()} Lines</span>
                      </div>
                      <div className="flex items-center gap-1.5 border-r border-primary/10 pr-4">
                        <Type className="w-3.5 h-3.5 text-accent" />
                        <span className="text-[11px] font-black text-primary/60">{stats.chars.toLocaleString()} Chars</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <HardDrive className={cn("w-3.5 h-3.5", stats.isHeavy ? "text-red-500" : "text-accent")} />
                        <span className={cn("text-[11px] font-black", stats.isHeavy ? "text-red-500" : "text-primary/60")}>
                          {stats.sizeKb} KB
                        </span>
                      </div>
                    </div>
                  </div>
                  {stats.isHeavy && (
                    <p className="text-[10px] text-red-500 font-bold ml-4 mt-2">
                      * 데이터 용량이 1MB에 근접하고 있습니다. 안정적인 성능을 위해 불필요한 공백을 줄이는 것이 좋습니다.
                    </p>
                  )}
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

          <Card className="bg-white border border-primary/5 p-6 rounded-[2rem] shadow-md">
            <h5 className="text-xs font-black text-primary/40 uppercase mb-4 flex items-center gap-2">
              <Info className="w-4 h-4 text-accent" /> 데이터 관리 팁
            </h5>
            <div className="space-y-4">
              <div className="p-3 bg-primary/5 rounded-xl">
                <p className="text-[11px] font-black text-primary mb-1">1. 실시간 라인 확인</p>
                <p className="text-[10px] text-primary/40 leading-relaxed font-bold">
                  우측 하단의 <b>Lines</b> 수치를 통해 1,400줄이 모두 정상적으로 들어갔는지 즉시 확인하실 수 있습니다.
                </p>
              </div>
              <div className="p-3 bg-primary/5 rounded-xl">
                <p className="text-[11px] font-black text-primary mb-1">2. 중복 업로드 방지</p>
                <p className="text-[10px] text-primary/40 leading-relaxed font-bold">
                  새 엑셀을 올리기 전 '데이터 초기화' 버튼을 눌러 기존 내용을 비우고 올리는 것을 권장합니다.
                </p>
              </div>
            </div>
          </Card>
        </aside>
      </div>
    </div>
  )
}
