"use client"

import { useState, useMemo } from "react"
import { useFirestore, useDoc, setDocumentNonBlocking, useMemoFirebase } from "@/firebase"
import { doc } from "firebase/firestore"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { BrainCircuit, Save, FileSpreadsheet, RefreshCcw, Sparkles } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export function AldiTrainer() {
  const db = useFirestore()
  const { toast } = useToast()
  
  const aldiDocRef = useMemoFirebase(() => db ? doc(db, "admin_configuration", "aldi_knowledge") : null, [db])
  const { data: aldiKnowledge, isLoading } = useDoc<any>(aldiDocRef)

  const [knowledge, setKnowledge] = useState("")
  const [isSaving, setIsSaving] = useState(false)

  // 데이터 로드 시 상태 업데이트
  useMemo(() => {
    if (aldiKnowledge?.content) {
      setKnowledge(aldiKnowledge.content)
    }
  }, [aldiKnowledge])

  const handleSave = () => {
    if (!db) return
    setIsSaving(true)
    
    setDocumentNonBlocking(doc(db, "admin_configuration", "aldi_knowledge"), {
      content: knowledge,
      updatedAt: new Date().toISOString()
    }, { merge: true })

    setTimeout(() => {
      setIsSaving(false)
      toast({ title: "학습 완료", description: "알디가 새로운 지식을 흡수했습니다. 이제 챗봇 대화에 반영됩니다." })
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
        toast({ title: "데이터 가져오기 성공", description: "파일 내용이 텍스트 영역 하단에 추가되었습니다." })
      }
      reader.readAsText(file)
    }
    input.click()
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      <Card className="bg-white border-none shadow-2xl rounded-[2.5rem] overflow-hidden">
        <CardHeader className="premium-gradient p-10">
          <div className="flex items-center gap-4 mb-2">
            <div className="bg-accent text-primary p-3 rounded-2xl shadow-xl"><BrainCircuit className="w-8 h-8" /></div>
            <div>
              <CardTitle className="text-3xl font-black text-white">알디(ALDI) 지식 학습 센터</CardTitle>
              <p className="text-accent/80 text-sm font-bold">엑셀 기반 DB나 텍스트를 통해 챗봇의 전문성을 고도화하세요.</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-10 space-y-8">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-primary/40 uppercase tracking-widest ml-2">지식 베이스 데이터 (Knowledge Base)</label>
              <Button variant="outline" size="sm" onClick={handleCsvImport} className="border-primary/10 text-primary/60 font-black gap-2 h-10 rounded-xl hover:bg-primary/5">
                <FileSpreadsheet className="w-4 h-4 text-emerald-500" /> 외부 데이터 가져오기
              </Button>
            </div>
            
            <div className="relative">
              {isLoading ? (
                <div className="absolute inset-0 flex items-center justify-center bg-white/50 z-10"><Sparkles className="w-8 h-8 animate-spin text-accent" /></div>
              ) : null}
              <Textarea 
                value={knowledge}
                onChange={e => setKnowledge(e.target.value)}
                placeholder="여기에 HR 관련 전문 지식, FAQ, 기업 문화 가이드 등을 입력하세요. 알디가 대화 시 이 내용을 우선적으로 참조합니다."
                className="min-h-[400px] bg-primary/5 border-none rounded-[2rem] p-8 text-[15px] leading-relaxed font-medium focus-visible:ring-accent/30 scrollbar-hide"
              />
            </div>
          </div>

          <div className="bg-accent/10 border border-accent/20 rounded-[2rem] p-8 flex items-start gap-4">
            <div className="bg-accent text-primary p-2 rounded-lg shrink-0 mt-1"><Sparkles className="w-4 h-4" /></div>
            <div className="space-y-1">
              <h5 className="font-black text-primary text-sm">학습 가이드라인</h5>
              <p className="text-primary/60 text-xs leading-relaxed font-bold">
                • 엑셀 데이터를 CSV로 저장하여 업로드하거나, 텍스트를 그대로 복사해서 붙여넣으세요.<br />
                • 질문-답변(Q&A) 형식이나 규정집 전문을 넣으면 더 정확한 상담이 가능합니다.<br />
                • 저장 즉시 알디의 뇌(Prompt)에 해당 데이터가 주입됩니다.
              </p>
            </div>
          </div>

          <Button 
            onClick={handleSave} 
            disabled={isSaving} 
            className="w-full h-16 bg-primary text-accent font-black rounded-2xl text-xl shadow-2xl gap-3 hover:scale-[1.02] transition-all"
          >
            {isSaving ? <RefreshCcw className="w-6 h-6 animate-spin" /> : <Save className="w-6 h-6" />}
            알디 지식 업데이트 및 학습 저장
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
