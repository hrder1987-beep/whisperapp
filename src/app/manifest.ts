
import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Whisper - HR Intelligence',
    short_name: 'Whisper',
    description: 'HR 전문가들을 위한 품격 있는 지식 공유 플랫폼',
    start_url: '/',
    display: 'standalone',
    background_color: '#F8F9FA',
    theme_color: '#163300',
    icons: [
      {
        src: 'https://picsum.photos/seed/whisper-icon/192/192',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: 'https://picsum.photos/seed/whisper-icon-512/512/512',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}
