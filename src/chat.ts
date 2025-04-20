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

export interface ConversationParticipant {
  id: number;
  firstName: string;
  lastName: string | null;
  avatar: string;
}

export interface LastMessage {
  id: number;
  content: string;
  senderId: number;
  isRead: boolean;
  createdAt: string;
}

export interface Conversation {
  id: number;
  chatStatus: 'MATCHED' | 'FIRST_CHAT' | 'UNMATCHED';
  participants: ConversationParticipant[];
  lastMessage: LastMessage | null;
  unreadCount: number;
  updatedAt: string;
}

export interface ConversationResponse {
  data: Conversation[];
  meta: {
    total: number;
    page: number;
    limit: number;
    lastPage: number;
  };
}

export interface QuestionDuration {
  round1: number;
  round2: number;
  round3: number;
}

export interface IcebreakerQuestion {
  id: number;
  name: string;
  description: string;
  isNeedSubscription: boolean;
  duration: QuestionDuration;
}

export interface QuestionsResponse {
  success: boolean;
  data: {
    items: IcebreakerQuestion[];
    durationChooseQuestion: number;
  };
  message: string;
}