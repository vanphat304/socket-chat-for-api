export interface Hobby {
  id: number;
  name: string;
  icon: string;
}

export interface University {
  id: number;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  city: string;
}

export interface Subscription {
  tier: string;
  duration: string;
  startDate: string | null;
  endDate: string;
  isActive: boolean;
  autoRenew: boolean;
  dailyMatches: number;
  boostsPerWeek: number;
  pinConversations: number;
  hasAdvancedFilters: boolean;
  hasPrioritySupport: boolean;
  hasPhotoReveals: boolean;
  hasNoPenalty: boolean;
  price: number;
  displayPrice: string;
}

export interface User {
  id: number;
  email: string;
  phoneNumber: string;
  firstName: string;
  lastName: string;
  avatar: string;
  gender: string;
  dob: string;
  height: number;
  language: string;
  address: string;
  latitude: number;
  longitude: number;
  city: string;
  countryCode: string;
  isVerified: boolean;
  userStatus: string;
  providers: string;
  isLogged: boolean;
  agePrefer: string;
  genderPrefer: string;
  activityRegular: string;
  typeRelationship: string;
  appleEmail: string;
  appleId: string;
  googleId: string;
  facebookId: string;
  createdAt: string;
  updatedAt: string;
  referredBy: string;
  university: University;
  hobbies: Hobby[];
  isSubscription: boolean;
  bio: string;
  isInternationalMode: boolean;
  isAutomaticLocation: boolean;
  maxDistance: number;
  subscription: Subscription;
  numberOfMatchesToday: number;
  maxMatchesPerDay: number;
  remainingMatchesToday: number;
}

export interface Message {
  id: number;
  content: string;
  conversationId: number;
  senderId: number;
  isRead: boolean;
  readBy?: number;
  readAt?: string;
  createdAt: string;
  fileUrl?: string;
  filetype?: string;
}

export interface Conversation {
  id: number;
  lastMessageId?: number;
  lastMessage?: Message;
  participants?: Array<{
    userId: number;
    user: User;
  }>;
  unreadCount: number;
  createdAt: string;
  updatedAt: string;
}