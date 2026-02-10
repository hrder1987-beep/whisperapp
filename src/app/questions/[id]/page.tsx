
import { Metadata, ResolvingMetadata } from 'next'
import { Header } from "@/components/chuchot/Header"
import { QuestionViewClient } from "./client-view"

type Props = {
  params: Promise<{ id: string }>
}

/**
 * [런칭 전 확인!] 실제 구매하신 도메인 주소로 변경해 주세요.
 * 예: "https://www.chuchot.kr"
 */
const SITE_URL = "https://whisper-hr.vercel.app"; 

/**
 * 동적 메타데이터 생성을 위해 Firestore REST API를 사용하여 질문 데이터를 가져옵니다.
 */
async function getQuestionData(id: string) {
  try {
    // 프로젝트 ID는 firebase/config.ts의 projectId와 동일해야 합니다.
    const projectId = "studio-1249189958-2be09";
    const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/questions/${id}`;
    
    const response = await fetch(url, { next: { revalidate: 60 } });
    if (!response.ok) return null;
    
    const data = await response.json();
    const fields = data.fields;
    
    return {
      title: fields.title?.stringValue || "Whisper 지식 속삭임",
      text: fields.text?.stringValue || "HR 전문가들의 집단지성 허브, Whisper에서 지혜를 나눠보세요.",
      imageUrl: fields.imageUrl?.stringValue || null,
      nickname: fields.nickname?.stringValue || "익명전문가"
    };
  } catch (error) {
    return null;
  }
}

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const id = (await params).id
  const question = await getQuestionData(id)

  if (!question) {
    return {
      title: "질문을 찾을 수 없습니다 | Whisper",
    }
  }

  const previousImages = (await parent).openGraph?.images || []
  const ogImage = question.imageUrl || "https://images.unsplash.com/photo-1521737711867-e3b97375f902?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080";

  return {
    title: `${question.title} | Whisper`,
    description: question.text.substring(0, 160),
    openGraph: {
      title: question.title,
      description: question.text.substring(0, 160),
      url: `${SITE_URL}/questions/${id}`,
      siteName: 'Whisper (위스퍼) - HR Intelligence Hub',
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: question.title,
        },
        ...previousImages,
      ],
      locale: 'ko_KR',
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title: question.title,
      description: question.text.substring(0, 160),
      images: [ogImage],
    },
  }
}

export default async function QuestionPage({ params }: Props) {
  const id = (await params).id
  
  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <Header />
      <main className="max-w-4xl mx-auto px-4 py-12">
        <QuestionViewClient id={id} />
      </main>
    </div>
  )
}
