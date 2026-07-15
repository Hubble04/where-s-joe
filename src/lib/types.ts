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