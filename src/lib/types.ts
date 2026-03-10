
export type UserRole = 'member' | 'mentor' | 'admin';

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  name: string;
  company: string;
  department: string;
  jobTitle: string; // 직함 (Position)
  jobRole?: string; // 직무 (Function/Role)
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
  jobTitle?: string; // 작성 당시의 직무 표시용
  viewCount: number;
  likeCount: number;
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
  jobTitle?: string; // 작성 당시의 직무 표시용
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
  cost?: string;
  websiteUrl?: string;
  targetAudience?: string;
  type: 'program' | 'solution';
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
  career?: string;
  certifications?: string;
  videoUrl?: string;
  detailImageUrl?: string;
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

export interface GatheringQuestion {
  id: string;
  text: string;
  type: 'text' | 'multiple';
  options?: string[];
}

export interface Gathering {
  id: string;
  title: string;
  summary: string;
  description: string;
  tags: string[];
  creatorId: string;
  creatorName: string;
  type: 'online' | 'offline';
  location: string;
  schedule: string;
  startDate: number;
  endDate: number;
  capacity: number;
  participantCount: number;
  status: 'recruiting' | 'in_progress' | 'closed';
  category: string;
  imageUrl?: string;
  createdAt: number;
  sessionCount: number; 
  questions?: GatheringQuestion[];
  resources?: { title: string; url: string; type: string; sessionId?: number }[];
}

export interface GatheringApplication {
  id: string;
  gatheringId: string;
  userId: string;
  userName: string;
  userEmail: string;
  status: 'pending' | 'approved' | 'rejected';
  appliedAt: number;
  answers?: { questionId: string; answer: string }[];
}

export interface GatheringAttendance {
  id: string;
  gatheringId: string;
  userId: string;
  userName: string;
  sessionId: number;
  status: 'attending' | 'absent';
  submittedAt: number;
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
  type: 'new_answer' | 'gathering_approved' | 'gathering_rejected' | 'gathering_applied';
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

export interface AnnouncementData {
  id: string | number;
  text: string;
  link: string;
}

export interface SiteBranding {
  homeTitle: string;
  homeSubtitle: string;
  gatheringTitle: string;
  gatheringSubtitle: string;
  mentorTitle: string;
  mentorSubtitle: string;
  programTitle: string;
  programSubtitle: string;
  jobTitle: string;
  jobSubtitle: string;
  bannerAutoSlideDuration?: number;
  announcements?: AnnouncementData[];
  announcementAutoSlideDuration?: number;
  announcementText?: string; // 하위 호환용
  announcementLink?: string; // 하위 호환용
  footerCompany?: string;
  footerAddress?: string;
  footerEmail?: string;
  footerPhone?: string;
  footerCopyright?: string;
}

export type BotType = 'whisperra' | 'aldi' | 'dongsan';

export interface BotConfig {
  name?: string;
  intro?: string;
  iconUrl?: string;
  content: string;
  persona?: string;
  autoReplyInstruction?: string;
  updatedAt: string;
}
