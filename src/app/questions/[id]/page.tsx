import { Metadata, ResolvingMetadata } from 'next'
import { Header } from "@/components/chuchot/Header"
import { QuestionViewClient } from "./client-view"

type Props = {
  params: Promise<{ id: string }>
}

/**
 * [중요] 전문가님의 실제 도메인 주소입니다.
 */
const SITE_URL = "https://whisper-hr.com"; 

async function getQuestionData(id: string) {
  try {
    const projectId = "studio-1249189958-2be09";
    const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/questions/${id}`;
    const response = await fetch(url, { next: { revalidate: 60 } });
    if (!response.ok) return null;
    const data = await response.json();
    const fields = data.fields;
    if (!fields) return null;
    return {
      title: fields.title?.stringValue || "Whisper 지식 속삭임",
      text: fields.text?.stringValue || "HR실무자들의 품격 있는 속삭임.",
      imageUrl: fields.imageUrl?.stringValue || null,
      nickname: fields.nickname?.stringValue || "익명전문가"
    };
  } catch (error) { return null; }
}

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const id = (await params).id
  const question = await getQuestionData(id)
  if (!question) return { title: "질문을 찾을 수 없습니다 | Whisper" };
  const ogImage = question.imageUrl || "/og-image.jpg";
  return {
    title: `${question.title} | Whisper`,
    description: question.text.substring(0, 160),
    openGraph: {
      title: question.title,
      description: question.text.substring(0, 160),
      url: `${SITE_URL}/questions/${id}`,
      siteName: 'Whisper (위스퍼) - HR Intelligence Hub',
      images: [{ url: ogImage, width: 1200, height: 630, alt: question.title }],
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
