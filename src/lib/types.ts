export interface Question {
  id: string;
  text: string;
  nickname: string;
  viewCount: number;
  answerCount: number;
  createdAt: number;
  imageUrl?: string;
}

export interface Answer {
  id: string;
  questionId: string;
  text: string;
  nickname: string;
  createdAt: number;
}
