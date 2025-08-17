// Common types used throughout the application

export interface FirestoreTimestamp {
  toDate(): Date;
  seconds: number;
  nanoseconds: number;
}

export interface UserData {
  uid: string;
  displayName: string;
  email: string;
  role: 'founder' | 'investor';
  fCoins?: number;
  followers?: string[];
  following?: string[];
  createdAt?: FirestoreTimestamp;
  bio?: string;
  location?: string;
  website?: string;
  linkedin?: string;
  twitter?: string;
  instagram?: string;
  github?: string;
  portfolio?: string;
  youtube?: string;
  company?: string;
  position?: string;
  industry?: string;
  experience?: string;
  education?: string;
  skills?: string[];
  achievements?: string[];
  profilePicture?: string;
  banned?: boolean;
  lastActive?: FirestoreTimestamp;
}

export interface UserPost {
  id: string;
  content: string;
  type: 'text' | 'image' | 'link';
  likes: string[];
  comments: Comment[];
  createdAt: FirestoreTimestamp;
  images?: string[];
  authorId: string;
  authorName: string;
  authorAvatar?: string;
}

export interface Comment {
  id: string;
  content: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  createdAt: FirestoreTimestamp;
  likes?: string[];
}

export interface Notification {
  id: string;
  userId: string;
  type: 'like' | 'comment' | 'follow' | 'message' | 'pod_invite' | 'dna_match' | 'admin_action' | 'system' | 'pod_interest';
  title: string;
  message: string;
  read: boolean;
  createdAt: FirestoreTimestamp;
  data?: Record<string, any>;
  actionUserId?: string;
  actionUserName?: string;
  actionUserAvatar?: string;
  postId?: string;
  podId?: string;
}

export interface Message {
  id: string;
  content: string;
  senderId: string;
  receiverId: string;
  createdAt: FirestoreTimestamp;
  read: boolean;
  senderName?: string;
  senderAvatar?: string;
}

export interface Chat {
  id: string;
  participants: string[];
  lastMessage?: {
    content: string;
    senderId: string;
    createdAt: FirestoreTimestamp;
  };
  lastMessageTime?: FirestoreTimestamp;
  participantDetails?: Record<string, {
    name: string;
    avatar?: string;
  }>;
  unreadCount?: number;
}

export interface Pod {
  id: string;
  title: string;
  description: string;
  creatorId: string;
  creatorName: string;
  members: string[];
  category: string;
  status: 'open' | 'in_progress' | 'completed' | 'closed';
  maxMembers: number;
  requiredSkills?: string[];
  createdAt: FirestoreTimestamp;
  updatedAt?: FirestoreTimestamp;
}

export interface Opportunity {
  id: string;
  title: string;
  description: string;
  company: string;
  type: 'job' | 'internship' | 'partnership' | 'investment';
  location?: string;
  remote: boolean;
  requirements?: string[];
  benefits?: string[];
  salary?: {
    min: number;
    max: number;
    currency: string;
  };
  equity?: {
    min: number;
    max: number;
  };
  createdAt: FirestoreTimestamp;
  expiresAt?: FirestoreTimestamp;
  applicants?: string[];
  postedBy: string;
}

export interface DNAProfile {
  userId: string;
  responses: Record<string, number>;
  personality: {
    openness: number;
    conscientiousness: number;
    extraversion: number;
    agreeableness: number;
    neuroticism: number;
  };
  workStyle: {
    leadership: number;
    collaboration: number;
    innovation: number;
    execution: number;
  };
  createdAt: FirestoreTimestamp;
  updatedAt?: FirestoreTimestamp;
}

export interface Match {
  id: string;
  user1Id: string;
  user2Id: string;
  compatibility: number;
  sharedInterests: string[];
  complementarySkills: string[];
  createdAt: FirestoreTimestamp;
  status: 'pending' | 'accepted' | 'rejected';
}

// Form types
export interface ProfileFormData {
  displayName: string;
  bio: string;
  location: string;
  website: string;
  linkedin: string;
  twitter: string;
  instagram: string;
  github: string;
  portfolio: string;
  youtube: string;
  company: string;
  position: string;
  industry: string;
  experience: string;
  education: string;
  skills: string[];
}

export interface PostFormData {
  content: string;
  images: File[];
  type: 'text' | 'image' | 'link';
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  hasMore: boolean;
  nextCursor?: string;
  total?: number;
}

// Component Props types
export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export interface LoadingProps {
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  text?: string;
}

// Utility types
export type UserRole = 'founder' | 'investor';
export type NotificationType = 'like' | 'comment' | 'follow' | 'message' | 'pod_invite' | 'dna_match' | 'admin_action' | 'system' | 'pod_interest';
export type PostType = 'text' | 'image' | 'link';
export type PodStatus = 'open' | 'in_progress' | 'completed' | 'closed';
export type OpportunityType = 'job' | 'internship' | 'partnership' | 'investment';
export type MatchStatus = 'pending' | 'accepted' | 'rejected';
