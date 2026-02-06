export interface Question {
  id: string;
  title: string;
  text: string;
  nickname: string;
  viewCount: number;
  answerCount: number;
  createdAt: number;
  imageUrl?: string;
  avatarId?: string;
  category?: string;
}

export interface Answer {
  id: string;
  questionId: string;
  text: string;
  nickname: string;
  createdAt: number;
  avatarId?: string;
}
