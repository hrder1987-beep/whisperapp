
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

export interface TrainingProgram {
  id: string;
  title: string;
  description: string;
  instructorName: string;
  category: string;
  startDate: string;
  endDate: string;
  imageUrl?: string;
  userId: string;
  createdAt: number;
}

export interface Instructor {
  id: string;
  name: string;
  specialty: string;
  bio: string;
  profilePictureUrl: string;
  userId: string;
  createdAt: number;
}
