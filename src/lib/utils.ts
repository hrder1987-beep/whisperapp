import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// 기본적인 욕설 및 비하 표현 필터 리스트 (예시)
const BANNED_WORDS = [
  "시발", "씨발", "개새끼", "미친놈", "미친년", "병신", "호로", "쌍놈", 
  "존나", "졸라", "닥쳐", "쓰레기", "일베", "메갈", "한남", "김치녀"
];

/**
 * 텍스트에 부적절한 단어가 포함되어 있는지 확인합니다.
 */
export function containsProfanity(text: string): boolean {
  const normalizedText = text.replace(/\s/g, ""); // 공백 제거 후 검사
  return BANNED_WORDS.some(word => normalizedText.includes(word));
}
