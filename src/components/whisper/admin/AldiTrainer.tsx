
"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { useFirestore, useDoc, setDocumentNonBlocking, useMemoFirebase } from "@/firebase"
import { doc } from "firebase/firestore"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { BrainCircuit, Save, RefreshCcw, Sparkles, UserCog, ListOrdered, HardDrive, FileText, Camera, Info, MessageSquareCode } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BotType } from "@/lib/types"
import { cn } from "@/lib/utils"
import * as XLSX from 'xlsx'

export function AldiTrainer() {
  const db = useFirestore()
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [activeBotTab, setActiveBotTab] = useState<BotType>("whisperra")
  
  const botDocRef = useMemoFirebase(() => db ? doc(db, "admin_configuration", `bot_${activeBotTab}`) : null, [db, activeBotTab])
  const { data: botConfig, isLoading } = useDoc<any>(botDocRef)

  const [name, setName] = useState("")
  const [intro, setIntro] = useState("")
  const [iconUrl, setIconUrl] = useState<string | null>(null)
  const [knowledge, setKnowledge] = useState("")
  const [persona, setPersona] = useState("")
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (botConfig) {
      setName(botConfig.name ?? "")
      setIntro(botConfig.intro ?? "")
      setIconUrl(botConfig.iconUrl ?? null)
      setKnowledge(botConfig.content ?? "")
      setPersona(botConfig.persona ?? "")
    } else if (!isLoading) {
      setName(""); setIntro(""); setIconUrl(null); setKnowledge(""); setPersona("");
    }
  }, [botConfig, activeBotTab, isLoading])

  const stats = useMemo(() => {
    const lines = (knowledge ?? "").split('\n').filter(l => l.trim()).length
    const chars = (knowledge ?? "").length
    const sizeKb = (chars / 1024).toFixed(1)
    return { lines, chars, sizeKb }
  }, [knowledge])

  const handleSave = () => {
    if (!db) return
    setIsSaving(true)
    
    setDocumentNonBlocking(doc(db, "admin_configuration", `bot_${activeBotTab}`), {
      name,
      intro,
      iconUrl,
      content: knowledge,
      persona: persona,
      updatedAt: new Date().toISOString()
    }, { merge: true })

    setTimeout(() => {
      setIsSaving(false)
      toast({ title: "학습 및 설정 저장 완료", description: `${name || activeBotTab} 봇의 설정이 실시간으로 업데이트되었습니다.` })
    }, 500)
  }

  const handleIconUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => setIconUrl(reader.result as string)
      reader.readAsDataURL(file)
    }
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
            <CardHeader className="p-10 border-b border-accent/5 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-2xl text-accent shadow-inner"><BrainCircuit className="w-6 h-6" /></div>
                <div>
                  <CardTitle className="text-2xl font-black text-accent">AI 전문 봇 트레이닝 센터</CardTitle>
                  <p className="text-xs font-bold text-accent/30 mt-1">봇의 정체성, 지식, 외형을 실시간으로 관리합니다.</p>
                </div>
              </div>
              <Tabs value={activeBotTab} onValueChange={(v) => setActiveBotTab(v as BotType)}>
                <TabsList className="bg-accent/5 p-1 rounded-xl h-11">
                  <TabsTrigger value="whisperra" className="rounded-lg font-black text-[10px] data-[state=active]:bg-white data-[state=active]:text-accent px-4">위스퍼라</TabsTrigger>
                  <TabsTrigger value="aldi" className="rounded-lg font-black text-[10px] data-[state=active]:bg-white data-[state=active]:text-accent px-4">알디</TabsTrigger>
                  <TabsTrigger value="dongsan" className="rounded-lg font-black text-[10px] data-[state=active]:bg-white data-[state=active]:text-accent px-4">동산</TabsTrigger>
                </TabsList>
              </Tabs>
            </CardHeader>
            <CardContent className="p-10 space-y-12">
              <section className="space-y-6">
                <div className="flex items-center gap-2 px-1">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <span className="text-[11px] font-black text-accent/40 uppercase tracking-widest">봇 브랜딩 및 인터페이스</span>
                </div>
                <div className="flex flex-col md:flex-row gap-8 bg-primary/5 p-8 rounded-3xl border border-primary/10 shadow-inner">
                  <div className="space-y-3 shrink-0 text-center">
                    <label className="text-[10px] font-black text-accent/30 uppercase tracking-widest block">프로필 아이콘</label>
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      className="w-24 h-24 rounded-2xl bg-white border-2 border-dashed border-accent/10 flex items-center justify-center cursor-pointer overflow-hidden group hover:border-primary relative transition-all shadow-sm"
                    >
                      {iconUrl ? (
                        <img src={iconUrl} className="w-full h-full object-cover" alt="bot icon" />
                      ) : (
                        <Camera className="w-8 h-8 text-accent/10 group-hover:text-primary transition-colors" />
                      )}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all text-white text-[8px] font-black">이미지 업로드</div>
                    </div>
                    <p className="text-[8px] font-black text-accent/20 uppercase tracking-tighter">권장: 400x400px (1:1)</p>
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleIconUpload} />
                  </div>
                  <div className="flex-1 space-y-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-accent/30 uppercase tracking-widest ml-1">봇 표시 이름</label>
                      <Input 
                        value={name ?? ""}
                        onChange={e => setName(e.target.value)}
                        placeholder="예: 위스퍼라 리서처"
                        className="bg-white border-none h-11 rounded-xl font-black text-sm shadow-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-accent/30 uppercase tracking-widest ml-1">첫 인사말 (Intro Message)</label>
                      <Input 
                        value={intro ?? ""}
                        onChange={e => setIntro(e.target.value)}
                        placeholder="채팅방 진입 시 가장 먼저 노출될 문구입니다."
                        className="bg-white border-none h-11 rounded-xl font-bold text-xs shadow-sm"
                      />
                    </div>
                  </div>
                </div>
              </section>

              <section className="space-y-4">
                <div className="flex items-center gap-2 px-1">
                  <UserCog className="w-4 h-4 text-primary" />
                  <span className="text-[11px] font-black text-accent/40 uppercase tracking-widest">봇 페르소나 (역할 및 말투 지침)</span>
                </div>
                <Textarea 
                  value={persona ?? ""}
                  onChange={e => setPersona(e.target.value)}
                  placeholder="예: 당신은 채용 전문 AI입니다. 구체적인 면접 질문 예시를 포함하여 정중한 말투로 답변하세요."
                  className="min-h-[120px] bg-accent/[0.02] border-accent/5 rounded-2xl p-6 text-sm font-medium focus-visible:ring-primary/20 resize-none shadow-inner"
                />
              </section>

              <section className="space-y-4">
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <MessageSquareCode className="w-4 h-4 text-primary" />
                    <span className="text-[11px] font-black text-accent/40 uppercase tracking-widest">인텔리전스 지식 베이스 (학습 데이터)</span>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => setKnowledge("")} className="text-red-400 hover:bg-red-50 h-8 rounded-lg text-[10px] font-black">초기화</Button>
                    <Button variant="outline" size="sm" onClick={handleFileImport} className="border-accent/10 h-8 rounded-lg text-[10px] font-black">데이터 파일 추가</Button>
                  </div>
                </div>
                <div className="relative">
                  <Textarea 
                    value={knowledge ?? ""}
                    onChange={e => setKnowledge(e.target.value)}
                    placeholder="학습시킬 텍스트 데이터를 입력하거나 엑셀/TXT 파일을 업로드하세요."
                    className="min-h-[400px] bg-accent/[0.02] border-accent/5 rounded-2xl p-8 text-xs font-medium focus-visible:ring-primary/20 leading-relaxed scrollbar-hide shadow-inner"
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
              </section>

              <Button 
                onClick={handleSave} 
                disabled={isSaving || isLoading} 
                className="w-full h-16 bg-accent text-primary font-black rounded-2xl text-lg shadow-xl hover:scale-[1.01] transition-all"
              >
                {isSaving ? <RefreshCcw className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                {name || activeBotTab.toUpperCase()} 통합 설정 적용하기
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-4 space-y-6">
          <Card className="bg-primary text-accent p-8 rounded-[2.5rem] shadow-xl border border-primary/20">
            <h4 className="font-black text-base mb-6 flex items-center gap-2 text-accent"><Info className="w-5 h-5" /> 관리 및 학습 가이드</h4>
            <div className="space-y-6 text-xs font-black leading-relaxed">
              <div className="bg-white/30 p-5 rounded-2xl border border-white/20">
                <p className="font-black mb-1.5 text-[11px] uppercase tracking-tighter text-accent">🎨 봇 브랜딩</p>
                <p className="text-accent">이름과 프로필 사진을 설정하면 사용자 채팅창과 답변 시 실시간으로 반영되어 신뢰도를 높입니다.</p>
              </div>
              <div className="h-px bg-accent/10" />
              <div>
                <p className="font-black mb-1.5 text-[11px] uppercase tracking-tighter text-accent">📚 데이터 우선순위</p>
                <p className="text-accent opacity-80">전문가가 직접 입력하거나 업로드한 데이터는 AI의 일반적인 지식보다 우선적으로 답변에 인용됩니다.</p>
              </div>
              <div className="h-px bg-accent/10" />
              <div>
                <p className="font-black mb-1.5 text-[11px] uppercase tracking-tighter text-accent">🎭 페르소나의 역할</p>
                <p className="text-accent opacity-80">봇의 말투(존댓말, 반말, 전문용어 사용 등)를 구체적으로 지시할수록 더욱 전문적인 느낌을 줄 수 있습니다.</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
