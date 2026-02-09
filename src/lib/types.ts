
export type UserRole = 'member' | 'mentor' | 'admin';

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  name: string;
  company: string;
  department: string;
  jobTitle: string;
  phoneNumber: string;
  role: UserRole;
  registrationDate: string;
  profilePictureUrl?: string;
}

export interface Question {
  id: string;
  title: string;
  text: string;
  nickname: string;
  userId: string;
  userRole?: UserRole;
  viewCount: number;
  answerCount: number;
  createdAt: number;
  imageUrl?: string;
  videoUrl?: string;
  category?: string;
  userProfilePicture?: string;
}

export interface Answer {
  id: string;
  questionId: string;
  text: string;
  nickname: string;
  userId: string;
  userRole?: UserRole;
  createdAt: number;
  userProfilePicture?: string;
}

export interface TrainingProgram {
  id: string;
  title: string;
  description: string;
  companyDescription?: string;
  instructorName: string;
  category: string;
  subCategory?: string;
  startDate: string;
  endDate: string;
  imageUrl?: string;
  videoUrl?: string;
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
  role?: UserRole;
  createdAt: number;
  company?: string;
  department?: string;
  jobTitle?: string;
  phoneNumber?: string;
}

export interface JobListing {
  id: string;
  companyName: string;
  title: string;
  location: string;
  experience: string;
  education: string;
  deadline: string;
  tags: string[];
  logoUrl?: string;
  category?: string;
  createdAt: number;
  userId: string;
}

export interface PrivateMessage {
  id: string;
  senderId: string;
  senderNickname: string;
  receiverId: string;
  receiverNickname: string;
  content: string;
  createdAt: number;
  isRead: boolean;
}
