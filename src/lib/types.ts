export interface UserProfile {
  id: string;
  username: string;
  email: string;
  name: string;
  company: string;
  department: string;
  jobTitle: string;
  phoneNumber: string;
  registrationDate: string;
  profilePictureUrl?: string;
}

export interface Question {
  id: string;
  title: string;
  text: string;
  nickname: string;
  userId: string;
  viewCount: number;
  answerCount: number;
  createdAt: number;
  imageUrl?: string;
  category?: string;
  userProfilePicture?: string;
}

export interface Answer {
  id: string;
  questionId: string;
  text: string;
  nickname: string;
  userId: string;
  createdAt: number;
  userProfilePicture?: string;
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
