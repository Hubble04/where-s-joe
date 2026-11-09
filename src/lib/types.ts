/** Where's Joe? — domain types (mirror the Supabase schema). */

export type Role = 'user' | 'admin';
export type CafeStatus = 'approved' | 'pending' | 'rejected';
export type SaveType = 'want_to_go' | 'sipped_there' | 'favorite';
export type Visibility = 'public' | 'followers' | 'private';
export type ModerationStatus = 'pending' | 'approved' | 'rejected';

export interface Profile {
  id: string;
  name: string;
  username: string;
  email?: string;
  bio: string;
  profilePhotoUrl: string;
  location: string;
  role: Role;
  createdAt: string;
  notifyLikesComments?: boolean;
  notifyFollows?: boolean;
  notifyActivityUpdates?: boolean;
  notifyNearbyNudges?: boolean;
  notifyNearbyRadiusMiles?: number;
  notifyMessages?: boolean;
  defaultPostVisibility?: Visibility;
  // derived / joined
  followers?: number;
  following?: number;
  postCount?: number;
}

export interface CafeTag {
  id: string;
  cafeId: string;
  category: string;
  tag: string;
}

export interface Cafe {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  country: string;
  lat: number;
  lng: number;
  description: string;
  website?: string;
  instagram?: string;
  phone?: string;
  coverPhotoUrl: string;
  gallery: string[];
  verifiedByJoe: boolean;
  status: CafeStatus;
  createdAt: string;
  // convenience
  neighborhood?: string;
  tags: string[]; // flattened tag names
  tagsByCategory?: { category: string; tags: string[] }[];
  signatureDrink?: string;
  hours?: string;
  hoursStructured?: WeekHours;
  rating?: number;
  reviewCount?: number;
  priceTier?: 1 | 2 | 3;
}

/** Structured hours so "Open Now" can be computed reliably. */
export type DayHours = { open: string; close: string } | null; // "08:00"
export interface WeekHours {
  mon: DayHours; tue: DayHours; wed: DayHours; thu: DayHours;
  fri: DayHours; sat: DayHours; sun: DayHours;
}

export interface PostPhoto {
  id: string;
  postId: string;
  imageUrl: string;
}

export interface Post {
  id: string;
  userId: string;
  cafeId: string | null;
  caption: string;
  drinkTag: string | null;
  visibility: Visibility;
  createdAt: string;
  photos: string[];
  // joined
  author?: Profile;
  cafeName?: string;
  likeCount: number;
  commentCount: number;
  likedByMe?: boolean;
}

export interface Comment {
  id: string;
  postId: string;
  userId: string;
  content: string;
  createdAt: string;
  author?: Profile;
}

export interface Follow {
  followerId: string;
  followingId: string;
  createdAt: string;
}

export interface CafeSave {
  id: string;
  userId: string;
  cafeId: string;
  saveType: SaveType;
  note?: string | null;
  orderedDrink?: string | null;
  milkType?: string | null;
  recommend?: boolean | null;
  createdAt: string;
}

export interface CustomList {
  id: string;
  userId: string;
  name: string;
  description?: string;
  createdAt: string;
  cafeIds?: string[];
}

export interface SuggestedCafe {
  id: string;
  submittedBy: string;
  name: string;
  address: string;
  city: string;
  state: string;
  country: string;
  description: string;
  website?: string;
  instagram?: string;
  photoUrl?: string;
  tags?: string[];
  moderationStatus: ModerationStatus;
  createdAt: string;
  submitterName?: string;
}

export const EDIT_REASONS = [
  'Not a coffee shop', 'Permanently closed', 'Wrong address', 'Wrong hours',
  'Duplicate listing', 'Incorrect photos', 'Incorrect establishment type', 'Other',
] as const;
export type EditReason = typeof EDIT_REASONS[number];

export interface CafeEditSuggestion {
  id: string;
  cafeId: string;
  submittedBy: string | null;
  reason: EditReason;
  details: string;
  status: 'pending' | 'resolved';
  createdAt: string;
  // joined
  cafeName?: string;
  submitterName?: string;
}

export const CLAIM_ROLES = ['Owner', 'Manager', 'Employee', 'Other'] as const;
export type ClaimRole = typeof CLAIM_ROLES[number];

export interface CafeClaim {
  id: string;
  cafeId: string;
  submittedBy: string | null;
  role: ClaimRole;
  contactEmail: string;
  phone: string;
  notes: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  // joined
  cafeName?: string;
  submitterName?: string;
}

export const NOTIFICATION_TYPES = [
  'like', 'comment', 'follow', 'suggestion_approved', 'suggestion_rejected',
  'edit_resolved', 'claim_approved', 'claim_rejected', 'tag_approved', 'tag_rejected',
  'message_request', 'message_accepted',
] as const;
export type NotificationType = typeof NOTIFICATION_TYPES[number];

export interface AppNotification {
  id: string;
  userId: string;
  actorId: string | null;
  type: NotificationType;
  message: string;
  link: string | null;
  read: boolean;
  createdAt: string;
  // joined
  actorName?: string;
}

export interface CafeNote {
  id: string;
  userId: string;
  cafeId: string;
  note: string;
  updatedAt: string;
}

export interface CafeTagSuggestion {
  id: string;
  cafeId: string;
  submittedBy: string | null;
  category: string;
  tag: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  // joined
  cafeName?: string;
  submitterName?: string;
}
/** A null participant/sender means that person deleted their account (shown as "Deleted user"). */
export interface Conversation {
  id: string;
  requesterId: string | null;
  recipientId: string | null;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: string;
  updatedAt: string;
  requesterLastReadAt: string;
  recipientLastReadAt: string;
}

export interface DirectMessage {
  id: string;
  conversationId: string;
  senderId: string | null;
  body: string;
  createdAt: string;
}

export const REPORT_REASONS = ['Spam', 'Harassment', 'Inappropriate content', 'Other'] as const;
export type ReportReason = typeof REPORT_REASONS[number];

export interface MessageReport {
  id: string;
  reporterId: string | null;
  reportedUserId: string | null;
  conversationId: string | null;
  reason: string;
  details: string;
  evidence: string;
  status: 'pending' | 'resolved';
  createdAt: string;
  // joined
  reporterName?: string;
  reportedName?: string;
}

export const POST_REPORT_REASONS = ['Spam', 'Offensive', 'Wrong info', 'Other'] as const;
export type PostReportReason = typeof POST_REPORT_REASONS[number];

export interface PostReport {
  id: string;
  postId: string;
  reporterId: string | null;
  reason: string;
  status: 'pending' | 'dismissed';
  createdAt: string;
  // joined
  postCaption?: string;
  postAuthorId?: string;
  reporterName?: string;
}

export const CAFE_REPORT_REASONS = POST_REPORT_REASONS;
export type CafeReportReason = PostReportReason;
export const PROFILE_REPORT_REASONS = ['Spam', 'Offensive', 'Impersonation', 'Other'] as const;
export type ProfileReportReason = typeof PROFILE_REPORT_REASONS[number];

export interface CafeReport {
  id: string;
  cafeId: string;
  reporterId: string | null;
  reason: string;
  status: 'pending' | 'dismissed';
  createdAt: string;
  // joined
  cafeName?: string;
  reporterName?: string;
}

export interface ProfileReport {
  id: string;
  reportedUserId: string;
  reporterId: string | null;
  reason: string;
  status: 'pending' | 'dismissed';
  createdAt: string;
  // joined
  reportedName?: string;
  reporterName?: string;
}

/** Stand-in profile shown wherever a deleted person appears (chat history). */
export const DELETED_USER: Profile = {
  id: '', name: 'Deleted user', username: 'deleted', bio: '', profilePhotoUrl: '', location: '',
  role: 'user', createdAt: '',
};
