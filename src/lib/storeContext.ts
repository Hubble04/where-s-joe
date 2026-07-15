'use client';

import { createContext, useContext } from 'react';
import type {
  Profile, Cafe, Post, Comment, CafeSave, CustomList, SuggestedCafe,
  SaveType, Visibility,
} from './types';

/**
 * Shared shape implemented by both the demo (localStorage) provider and the
 * Supabase-backed provider. Pages only ever depend on this interface via
 * `useStore()`, so which provider is mounted (decided by `hasSupabase`) is
 * invisible to them.
 */
export interface StoreValue {
  ready: boolean;
  me: Profile | null;
  isAuthed: boolean;
  users: Profile[];
  cafes: Cafe[];
  posts: Post[];
  comments: Comment[];
  saves: CafeSave[];
  lists: CustomList[];
  suggestions: SuggestedCafe[];
  follows: { followerId: string; followingId: string }[];

  getUser: (id: string) => Profile;
  getCafe: (id: string) => Cafe | undefined;
  isLiked: (postId: string) => boolean;
  likeCount: (postId: string) => number;
  commentsFor: (postId: string) => Comment[];
  isFollowing: (userId: string) => boolean;
  savesForCafe: (cafeId: string) => CafeSave[];
  hasSave: (cafeId: string, type: SaveType) => boolean;
  savesByType: (type: SaveType) => CafeSave[];
  listsForMe: () => CustomList[];
  myPosts: () => Post[];
  mySuggestions: () => SuggestedCafe[];
  feedPosts: (mode: string) => Post[];
  postsForCafe: (cafeId: string) => Post[];

  signIn: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  signUp: (i: { name: string; username: string; email: string; password: string; location?: string }) => Promise<{ ok: boolean; error?: string }>;
  signOut: () => void;
  updateProfile: (patch: Partial<Profile>) => void;

  toggleLike: (postId: string) => void;
  addComment: (postId: string, content: string) => void;
  toggleFollow: (userId: string) => void;
  createPost: (i: { caption: string; cafeId: string | null; drinkTag: string | null; visibility: Visibility; photos: string[] }) => void;
  toggleSave: (cafeId: string, type: SaveType) => void;
  sipCafe: (cafeId: string, d: { note?: string; orderedDrink?: string; milkType?: string; recommend?: boolean | null }) => void;
  createList: (name: string, description?: string) => string;
  addToList: (listId: string, cafeId: string) => void;
  removeFromList: (listId: string, cafeId: string) => void;
  suggestCafe: (i: Omit<SuggestedCafe, 'id' | 'submittedBy' | 'moderationStatus' | 'createdAt' | 'submitterName'>) => void;

  approveSuggestion: (id: string) => void;
  rejectSuggestion: (id: string) => void;
  deletePost: (id: string) => void;
}

export const StoreContext = createContext<StoreValue | null>(null);

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
}
