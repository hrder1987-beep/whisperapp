"use client"

import { useState, useMemo } from "react"
import { useFirestore, useDoc, setDocumentNonBlocking, useMemoFirebase } from "@/firebase"
import { doc } from "firebase/firestore"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { BrainCircuit, Save, FileSpreadsheet, RefreshCcw, Sparkles, UserCog, MessageSquareText } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export function AldiTrainer() {
  const db = useFirestore()
  const { toast } = useToast()
  
  const aldiDocRef = useMemoFirebase(() => db ? doc(db, "admin_configuration", "aldi_knowledge") : null, [db])
  const { data: aldiKnowledge, isLoading } = useDoc<any>(aldiDocRef)

  const [knowledge, setKnowledge] = useState("")
  const [persona, setPersona] = useState("")
  const [autoReplyInstruction, setAutoReplyInstruction] = useState("")
  const [isSaving, setIsSaving] = useState(false)

  // 데이터 로드 시 상태 업데이트
  useMemo(() => {
    if (aldiKnowledge) {
      setKnowledge(aldiKnowledge.content || "")
      setPersona(aldiKnowledge.persona || "")
      setAutoReplyInstruction(aldiKnowledge.autoReplyInstruction || "")
    }
  }, [aldiKnowledge])

  const handleSave = () => {
    if (!db) return
    setIsSaving(true)
    
    setDocumentNonBlocking(doc(db, "admin_configuration", "aldi_knowledge"), {
      content: knowledge,
      persona: persona,
      autoReplyInstruction: autoReplyInstruction,
      updatedAt: new Date().toISOString()
    }, { merge: true })

    setTimeout(() => {
      setIsSaving(false)
      toast({ title: "학습 및 지침 저장 완료", description: "알디가 새로운 페르소나와 지식을 성공적으로 흡수했습니다." })
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
        setKnowledge(prev => prev + "\n\n[추가 데이터]\n" + text)
        toast({ title: "데이터 가져오기 성공", description: "파일 내용이 지식 베이스 하단에 추가되었습니다." })
      }
      reader.readAsText(file)
    }
    input.click()
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-500 pb-20">
      <Card className="bg-white border-none shadow-2xl rounded-[2.5rem] overflow-hidden">
        <CardHeader className="premium-gradient p-10">
          <div className="flex items-center gap-4 mb-2">
            <div className="bg-accent text-primary p-3 rounded-2xl shadow-xl"><BrainCircuit className="w-8 h-8" /></div>
            <div>
              <CardTitle className="text-3xl font-black text-white">알디(ALDI) 인텔리전스 센터</CardTitle>
              <p className="text-accent/80 text-sm font-bold">프롬프트를 통해 챗봇의 자아와 지식을 실시간으로 재설계하세요.</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-10">
          <Tabs defaultValue="persona" className="space-y-8">
            <TabsList className="bg-primary/5 p-1 rounded-2xl h-14 w-full md:w-fit grid grid-cols-3">
              <TabsTrigger value="persona" className="rounded-xl font-black text-xs gap-2 data-[state=active]:bg-white data-[state=active]:shadow-md">
                <UserCog className="w-4 h-4" /> 챗봇 페르소나
              </TabsTrigger>
              <TabsTrigger value="reply" className="rounded-xl font-black text-xs gap-2 data-[state=active]:bg-white data-[state=active]:shadow-md">
                <MessageSquareText className="w-4 h-4" /> 자동 답변 지침
              </TabsTrigger>
              <TabsTrigger value="knowledge" className="rounded-xl font-black text-xs gap-2 data-[state=active]:bg-white data-[state=active]:shadow-md">
                <FileSpreadsheet className="w-4 h-4" /> 지식 베이스
              </TabsTrigger>
            </TabsList>

            <TabsContent value="persona" className="space-y-6">
              <div className="space-y-2">
                <h4 className="text-sm font-black text-primary/40 uppercase ml-2 tracking-widest">알디의 자아 설정 (System Prompt)</h4>
                <p className="text-xs text-primary/30 ml-2 mb-4 font-bold">알디가 유저와 대화할 때 가질 성격, 말투, 금기사항을 지시하세요.</p>
                <Textarea 
                  value={persona}
                  onChange={e => setPersona(e.target.value)}
                  placeholder="예: 당신은 20년 경력의 베테랑 HRD 전문가입니다. 논리적이고 차분하며, 가끔은 위트 있는 비유를 섞어 조언하세요. 존댓말을 사용하되 동료처럼 친근해야 합니다."
                  className="min-h-[300px] bg-primary/5 border-none rounded-[2rem] p-8 text-[15px] leading-relaxed font-medium focus-visible:ring-accent/30"
                />
              </div>
            </TabsContent>

            <TabsContent value="reply" className="space-y-6">
              <div className="space-y-2">
                <h4 className="text-sm font-black text-primary/40 uppercase ml-2 tracking-widest">자동 답변 가이드라인 (Reply Instruction)</h4>
                <p className="text-xs text-primary/30 ml-2 mb-4 font-bold">피드에 새로운 글이 올라왔을 때 AI가 작성할 답글의 규칙을 설정하세요.</p>
                <Textarea 
                  value={autoReplyInstruction}
                  onChange={e => setAutoReplyInstruction(e.target.value)}
                  placeholder="예: 모든 답변에는 반드시 관련 노동법 조항 언급을 포함하세요. 답변 마지막에는 해당 전문가에게 커피 한 잔의 여유를 권하는 따뜻한 멘트를 덧붙여주세요."
                  className="min-h-[300px] bg-primary/5 border-none rounded-[2rem] p-8 text-[15px] leading-relaxed font-medium focus-visible:ring-accent/30"
                />
              </div>
            </TabsContent>

            <TabsContent value="knowledge" className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h4 className="text-sm font-black text-primary/40 uppercase ml-2 tracking-widest">전문 지식 베이스 (Data Source)</h4>
                  <p className="text-xs text-primary/30 ml-2 font-bold">알디가 답변의 근거로 삼을 핵심 텍스트 데이터를 입력하세요.</p>
                </div>
                <Button variant="outline" size="sm" onClick={handleCsvImport} className="border-primary/10 text-primary/60 font-black gap-2 h-10 rounded-xl hover:bg-primary/5">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-500" /> 외부 데이터 가져오기
                </Button>
              </div>
              <Textarea 
                value={knowledge}
                onChange={e => setKnowledge(e.target.value)}
                placeholder="여기에 HR 매뉴얼, FAQ, 기업 문화 가이드 등을 자유롭게 입력하세요."
                className="min-h-[300px] bg-primary/5 border-none rounded-[2rem] p-8 text-[15px] leading-relaxed font-medium focus-visible:ring-accent/30"
              />
            </TabsContent>
          </Tabs>

          <div className="mt-10 bg-accent/10 border border-accent/20 rounded-[2rem] p-8 flex items-start gap-4">
            <div className="bg-accent text-primary p-2 rounded-lg shrink-0 mt-1"><Sparkles className="w-4 h-4" /></div>
            <div className="space-y-1">
              <h5 className="font-black text-primary text-sm">프롬프트 기반 운영 팁</h5>
              <p className="text-primary/60 text-xs leading-relaxed font-bold">
                • 챗봇의 성격이나 답변 방식을 바꾸고 싶을 때마다 이 페이지에서 지침을 수정하세요.<br />
                • '저장' 버튼을 누르는 즉시 Whisper 플랫폼 전체의 AI 로직에 반영됩니다.<br />
                • 구체적이고 명확한 문장으로 지시할수록 AI의 성능이 높아집니다.
              </p>
            </div>
          </div>

          <Button 
            onClick={handleSave} 
            disabled={isSaving} 
            className="w-full h-16 bg-primary text-accent font-black rounded-2xl text-xl shadow-2xl gap-3 hover:scale-[1.02] transition-all mt-10"
          >
            {isSaving ? <RefreshCcw className="w-6 h-6 animate-spin" /> : <Save className="w-6 h-6" />}
            알디(AI) 지능 및 프롬프트 일괄 업데이트
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
