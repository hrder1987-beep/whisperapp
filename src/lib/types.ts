
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
  jobTitle?: string;
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
  jobTitle?: string;
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
  email?: string;
  website?: string;
  references?: string;
  curriculumPdfUrl?: string;
  isVerified?: boolean;
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
  adImageUrl?: string;
  category?: string;
  contactEmail?: string;
  createdAt: number;
  userId: string;
}

export interface Gathering {
  id: string;
  title: string;
  description: string;
  creatorId: string;
  creatorName: string;
  type: 'online' | 'offline';
  location: string;
  schedule: string;
  capacity: number;
  participantCount: number;
  status: 'recruiting' | 'in_progress' | 'closed';
  category: string;
  imageUrl?: string;
  createdAt: number;
  resources?: { title: string; url: string; type: string }[];
}

export interface GatheringApplication {
  id: string;
  gatheringId: string;
  userId: string;
  userName: string;
  userEmail: string;
  status: 'pending' | 'approved' | 'rejected';
  appliedAt: number;
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

export interface AppNotification {
  id: string;
  userId: string;
  type: 'new_answer' | 'gathering_approved' | 'gathering_rejected';
  questionId: string;
  questionTitle: string;
  senderNickname: string;
  createdAt: number;
  isRead: boolean;
}

export interface PremiumAd {
  id: string;
  title: string;
  badge: string;
  webImage: string;
  mobileImage: string;
  link: string;
}

export type BotType = 'whisperra' | 'aldi' | 'dongsan';

export interface BotConfig {
  content: string;
  persona?: string;
  autoReplyInstruction?: string;
  updatedAt: string;
}
