-- =========================================================================
-- Where's Joe? — database schema
-- Run in the Supabase SQL editor. Safe to re-run.
-- Column names are snake_case and match the app's data layer.
-- =========================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- profiles  (the "Users" table; 1:1 with auth.users)
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id                uuid primary key references auth.users (id) on delete cascade,
  name              text not null default 'Explorer',
  username          text unique not null,
  email             text,
  bio               text not null default '',
  profile_photo_url text not null default '',
  location          text not null default '',
  role              text not null default 'user' check (role in ('user','admin')),
  created_at        timestamptz not null default now()
);

-- Per-category notification preferences (default everything on).
alter table public.profiles add column if not exists notify_likes_comments boolean not null default true;
alter table public.profiles add column if not exists notify_follows boolean not null default true;
alter table public.profiles add column if not exists notify_activity_updates boolean not null default true;
alter table public.profiles add column if not exists notify_nearby_nudges boolean not null default true;
alter table public.profiles add column if not exists notify_nearby_radius_miles smallint not null default 1 check (notify_nearby_radius_miles between 1 and 10);

-- Direct-message notifications (requests, accepted requests, new messages).
alter table public.profiles add column if not exists notify_messages boolean not null default true;

-- Default visibility applied to new posts (still changeable per-post at compose time).
alter table public.profiles add column if not exists default_post_visibility text not null default 'public' check (default_post_visibility in ('public','followers','private'));

-- ---------------------------------------------------------------------------
-- cafes
-- ---------------------------------------------------------------------------
create table if not exists public.cafes (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,
  address         text not null default '',
  city            text not null default '',
  state           text not null default '',
  country         text not null default 'USA',
  latitude        double precision not null,
  longitude       double precision not null,
  description     text not null default '',
  website         text,
  instagram       text,
  phone           text,
  cover_photo_url text not null default '',
  gallery         text[] not null default '{}',
  verified_by_joe boolean not null default false,
  status          text not null default 'approved' check (status in ('approved','pending','rejected')),
  neighborhood    text default '',
  signature_drink text default '',
  hours           text default '',
  hours_json      jsonb,
  rating          numeric(2,1) default 0,
  review_count    integer default 0,
  price_tier      smallint default 2 check (price_tier between 1 and 3),
  created_at      timestamptz not null default now()
);
create index if not exists cafes_status_idx on public.cafes (status);
create index if not exists cafes_city_idx on public.cafes (city);

-- ---------------------------------------------------------------------------
-- cafe_tags
-- ---------------------------------------------------------------------------
create table if not exists public.cafe_tags (
  id       uuid primary key default gen_random_uuid(),
  cafe_id  uuid not null references public.cafes (id) on delete cascade,
  category text not null,
  tag      text not null
);
create index if not exists cafe_tags_cafe_idx on public.cafe_tags (cafe_id);

-- Prevent duplicate tag rows (needed so admin toggles / suggestion approvals
-- can safely upsert instead of risking dupes).
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'cafe_tags_unique') then
    alter table public.cafe_tags add constraint cafe_tags_unique unique (cafe_id, category, tag);
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- posts + photos + comments + likes
-- ---------------------------------------------------------------------------
create table if not exists public.posts (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  cafe_id    uuid references public.cafes (id) on delete set null,
  caption    text not null default '',
  drink_tag  text,
  visibility text not null default 'public' check (visibility in ('public','followers','private')),
  created_at timestamptz not null default now()
);
create index if not exists posts_created_idx on public.posts (created_at desc);
create index if not exists posts_user_idx on public.posts (user_id);
create index if not exists posts_cafe_idx on public.posts (cafe_id);

create table if not exists public.post_photos (
  id        uuid primary key default gen_random_uuid(),
  post_id   uuid not null references public.posts (id) on delete cascade,
  image_url text not null,
  position  smallint not null default 0
);

create table if not exists public.comments (
  id         uuid primary key default gen_random_uuid(),
  post_id    uuid not null references public.posts (id) on delete cascade,
  user_id    uuid not null references auth.users (id) on delete cascade,
  content    text not null,
  created_at timestamptz not null default now()
);
create index if not exists comments_post_idx on public.comments (post_id);

create table if not exists public.likes (
  id      uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  unique (post_id, user_id)
);
create index if not exists likes_post_idx on public.likes (post_id);

-- ---------------------------------------------------------------------------
-- follows
-- ---------------------------------------------------------------------------
create table if not exists public.follows (
  follower_id  uuid not null references auth.users (id) on delete cascade,
  following_id uuid not null references auth.users (id) on delete cascade,
  created_at   timestamptz not null default now(),
  primary key (follower_id, following_id),
  check (follower_id <> following_id)
);

-- ---------------------------------------------------------------------------
-- user_cafe_saves  (want_to_go / sipped_there / favorite; carries visit notes)
-- ---------------------------------------------------------------------------
create table if not exists public.user_cafe_saves (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users (id) on delete cascade,
  cafe_id       uuid not null references public.cafes (id) on delete cascade,
  save_type     text not null check (save_type in ('want_to_go','sipped_there','favorite')),
  note          text,
  ordered_drink text,
  milk_type     text,
  recommend     boolean,
  created_at    timestamptz not null default now(),
  unique (user_id, cafe_id, save_type)
);
create index if not exists saves_user_idx on public.user_cafe_saves (user_id);

-- ---------------------------------------------------------------------------
-- custom_lists + items
-- ---------------------------------------------------------------------------
create table if not exists public.custom_lists (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  name        text not null,
  description text default '',
  created_at  timestamptz not null default now()
);

create table if not exists public.custom_list_items (
  id         uuid primary key default gen_random_uuid(),
  list_id    uuid not null references public.custom_lists (id) on delete cascade,
  cafe_id    uuid not null references public.cafes (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (list_id, cafe_id)
);

-- ---------------------------------------------------------------------------
-- suggested_cafes  (moderation queue -> promoted into cafes on approval)
-- ---------------------------------------------------------------------------
create table if not exists public.suggested_cafes (
  id                uuid primary key default gen_random_uuid(),
  submitted_by      uuid references auth.users (id) on delete set null,
  name              text not null,
  address           text default '',
  city              text default '',
  state             text default '',
  country           text default 'USA',
  description       text default '',
  website           text,
  instagram         text,
  photo_url         text,
  tags              text[] default '{}',
  moderation_status text not null default 'pending' check (moderation_status in ('pending','approved','rejected')),
  created_at        timestamptz not null default now()
);
create index if not exists suggested_status_idx on public.suggested_cafes (moderation_status);

-- ---------------------------------------------------------------------------
-- cafe_edit_suggestions  (user-reported corrections on an existing café)
-- ---------------------------------------------------------------------------
create table if not exists public.cafe_edit_suggestions (
  id           uuid primary key default gen_random_uuid(),
  cafe_id      uuid not null references public.cafes (id) on delete cascade,
  submitted_by uuid references auth.users (id) on delete set null,
  reason       text not null check (reason in (
    'Not a coffee shop', 'Permanently closed', 'Wrong address', 'Wrong hours',
    'Duplicate listing', 'Incorrect photos', 'Incorrect establishment type', 'Other'
  )),
  details      text default '',
  status       text not null default 'pending' check (status in ('pending','resolved')),
  created_at   timestamptz not null default now()
);
create index if not exists cafe_edit_suggestions_cafe_idx on public.cafe_edit_suggestions (cafe_id);
create index if not exists cafe_edit_suggestions_status_idx on public.cafe_edit_suggestions (status);

-- ---------------------------------------------------------------------------
-- cafe_claims  (a user asserting they own/manage an existing café)
-- ---------------------------------------------------------------------------
create table if not exists public.cafe_claims (
  id            uuid primary key default gen_random_uuid(),
  cafe_id       uuid not null references public.cafes (id) on delete cascade,
  submitted_by  uuid references auth.users (id) on delete set null,
  role          text not null check (role in ('Owner', 'Manager', 'Employee', 'Other')),
  contact_email text not null,
  phone         text default '',
  notes         text default '',
  status        text not null default 'pending' check (status in ('pending','approved','rejected')),
  created_at    timestamptz not null default now()
);
create index if not exists cafe_claims_cafe_idx on public.cafe_claims (cafe_id);
create index if not exists cafe_claims_status_idx on public.cafe_claims (status);

-- ---------------------------------------------------------------------------
-- notifications  (in-app activity feed; also the source of truth for push later)
-- ---------------------------------------------------------------------------
create table if not exists public.notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  actor_id   uuid references auth.users (id) on delete cascade,
  type       text not null check (type in (
    'like', 'comment', 'follow', 'suggestion_approved', 'suggestion_rejected',
    'edit_resolved', 'claim_approved', 'claim_rejected', 'tag_approved', 'tag_rejected',
    'message_request', 'message_accepted'
  )),
  message    text not null,
  link       text,
  read       boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists notifications_user_idx on public.notifications (user_id, created_at desc);
create index if not exists notifications_user_unread_idx on public.notifications (user_id) where not read;

-- Widen the type check for tables created before tag_approved/tag_rejected existed.
alter table public.notifications drop constraint if exists notifications_type_check;
alter table public.notifications add constraint notifications_type_check check (type in (
  'like', 'comment', 'follow', 'suggestion_approved', 'suggestion_rejected',
  'edit_resolved', 'claim_approved', 'claim_rejected', 'tag_approved', 'tag_rejected',
    'message_request', 'message_accepted'
));

-- When someone deletes their account, the notifications they caused (e.g. "X started
-- following you") are removed from other people's inboxes too. Every notification is
-- created with its actor set, so a null actor only ever means a leftover from a deleted account.
delete from public.notifications where actor_id is null;
alter table public.notifications drop constraint if exists notifications_actor_id_fkey;
alter table public.notifications add constraint notifications_actor_id_fkey
  foreign key (actor_id) references auth.users (id) on delete cascade;

-- ---------------------------------------------------------------------------
-- push_subscriptions  (one row per browser/device a user has enabled push on)
-- ---------------------------------------------------------------------------
create table if not exists public.push_subscriptions (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  endpoint   text not null unique,
  p256dh     text not null,
  auth_key   text not null,
  created_at timestamptz not null default now()
);
create index if not exists push_subscriptions_user_idx on public.push_subscriptions (user_id);

-- ---------------------------------------------------------------------------
-- cafe_notes  (one private, evolving note per user per café)
-- ---------------------------------------------------------------------------
create table if not exists public.cafe_notes (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  cafe_id    uuid not null references public.cafes (id) on delete cascade,
  note       text not null default '',
  updated_at timestamptz not null default now(),
  unique (user_id, cafe_id)
);
create index if not exists cafe_notes_user_idx on public.cafe_notes (user_id);

-- ---------------------------------------------------------------------------
-- cafe_tag_suggestions  (a user proposing a Vibe/Ambiance-style tag for a café)
-- ---------------------------------------------------------------------------
create table if not exists public.cafe_tag_suggestions (
  id           uuid primary key default gen_random_uuid(),
  cafe_id      uuid not null references public.cafes (id) on delete cascade,
  submitted_by uuid references auth.users (id) on delete set null,
  category     text not null,
  tag          text not null,
  status       text not null default 'pending' check (status in ('pending','approved','rejected')),
  created_at   timestamptz not null default now()
);
create index if not exists cafe_tag_suggestions_cafe_idx on public.cafe_tag_suggestions (cafe_id);
create index if not exists cafe_tag_suggestions_status_idx on public.cafe_tag_suggestions (status);

-- =========================================================================
-- Helper: is the current user an admin?
-- =========================================================================
create or replace function public.is_admin()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  );
$$;

-- =========================================================================
-- Row Level Security
-- =========================================================================
alter table public.profiles          enable row level security;
alter table public.cafes             enable row level security;
alter table public.cafe_tags         enable row level security;
alter table public.posts             enable row level security;
alter table public.post_photos       enable row level security;
alter table public.comments          enable row level security;
alter table public.likes             enable row level security;
alter table public.follows           enable row level security;
alter table public.user_cafe_saves   enable row level security;
alter table public.custom_lists      enable row level security;
alter table public.custom_list_items enable row level security;
alter table public.suggested_cafes   enable row level security;
alter table public.cafe_edit_suggestions enable row level security;
alter table public.cafe_claims enable row level security;
alter table public.notifications enable row level security;
alter table public.push_subscriptions enable row level security;
alter table public.cafe_notes enable row level security;
alter table public.cafe_tag_suggestions enable row level security;

-- profiles: world-readable; self-write; admins may update (e.g. grant roles).
drop policy if exists p_profiles_read on public.profiles;
create policy p_profiles_read on public.profiles for select using (true);
drop policy if exists p_profiles_self on public.profiles;
create policy p_profiles_self on public.profiles for all
  using (auth.uid() = id or public.is_admin())
  with check (auth.uid() = id or public.is_admin());

-- cafes: approved are world-readable; admins see/manage all; authed insert.
drop policy if exists p_cafes_read on public.cafes;
create policy p_cafes_read on public.cafes for select
  using (status = 'approved' or public.is_admin());
drop policy if exists p_cafes_insert on public.cafes;
create policy p_cafes_insert on public.cafes for insert to authenticated
  with check (true);
drop policy if exists p_cafes_admin on public.cafes;
create policy p_cafes_admin on public.cafes for update to authenticated
  using (public.is_admin()) with check (public.is_admin());
drop policy if exists p_cafes_del on public.cafes;
create policy p_cafes_del on public.cafes for delete to authenticated
  using (public.is_admin());

-- cafe_tags: readable with their cafe; admin-manage.
drop policy if exists p_tags_read on public.cafe_tags;
create policy p_tags_read on public.cafe_tags for select using (true);
drop policy if exists p_tags_admin on public.cafe_tags;
create policy p_tags_admin on public.cafe_tags for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- posts: visibility-aware read; owner writes; admin can delete (moderation).
drop policy if exists p_posts_read on public.posts;
create policy p_posts_read on public.posts for select using (
  visibility = 'public'
  or user_id = auth.uid()
  or public.is_admin()
  or (visibility = 'followers' and exists (
        select 1 from public.follows f
        where f.follower_id = auth.uid() and f.following_id = posts.user_id))
);
drop policy if exists p_posts_write on public.posts;
create policy p_posts_write on public.posts for insert to authenticated
  with check (user_id = auth.uid());
drop policy if exists p_posts_update on public.posts;
create policy p_posts_update on public.posts for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists p_posts_delete on public.posts;
create policy p_posts_delete on public.posts for delete to authenticated
  using (user_id = auth.uid() or public.is_admin());

-- post_photos
drop policy if exists p_photos_read on public.post_photos;
create policy p_photos_read on public.post_photos for select using (true);
drop policy if exists p_photos_write on public.post_photos;
create policy p_photos_write on public.post_photos for insert to authenticated
  with check (exists (select 1 from public.posts p where p.id = post_id and p.user_id = auth.uid()));
drop policy if exists p_photos_del on public.post_photos;
create policy p_photos_del on public.post_photos for delete to authenticated
  using (exists (select 1 from public.posts p where p.id = post_id and (p.user_id = auth.uid() or public.is_admin())));

-- comments
drop policy if exists p_comments_read on public.comments;
create policy p_comments_read on public.comments for select using (true);
drop policy if exists p_comments_write on public.comments;
create policy p_comments_write on public.comments for insert to authenticated
  with check (user_id = auth.uid());
drop policy if exists p_comments_del on public.comments;
create policy p_comments_del on public.comments for delete to authenticated
  using (user_id = auth.uid() or public.is_admin());

-- likes
drop policy if exists p_likes_read on public.likes;
create policy p_likes_read on public.likes for select using (true);
drop policy if exists p_likes_write on public.likes;
create policy p_likes_write on public.likes for insert to authenticated
  with check (user_id = auth.uid());
drop policy if exists p_likes_del on public.likes;
create policy p_likes_del on public.likes for delete to authenticated
  using (user_id = auth.uid());

-- follows
drop policy if exists p_follows_read on public.follows;
create policy p_follows_read on public.follows for select using (true);
drop policy if exists p_follows_write on public.follows;
create policy p_follows_write on public.follows for insert to authenticated
  with check (follower_id = auth.uid());
drop policy if exists p_follows_del on public.follows;
create policy p_follows_del on public.follows for delete to authenticated
  using (follower_id = auth.uid());

-- user_cafe_saves: fully private to owner.
drop policy if exists p_saves_all on public.user_cafe_saves;
create policy p_saves_all on public.user_cafe_saves for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- custom_lists + items: private to owner.
drop policy if exists p_lists_all on public.custom_lists;
create policy p_lists_all on public.custom_lists for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists p_list_items_all on public.custom_list_items;
create policy p_list_items_all on public.custom_list_items for all to authenticated
  using (exists (select 1 from public.custom_lists l where l.id = list_id and l.user_id = auth.uid()))
  with check (exists (select 1 from public.custom_lists l where l.id = list_id and l.user_id = auth.uid()));

-- suggested_cafes: submitter sees own; admin sees all; authed insert.
drop policy if exists p_sugg_read on public.suggested_cafes;
create policy p_sugg_read on public.suggested_cafes for select to authenticated
  using (submitted_by = auth.uid() or public.is_admin());
drop policy if exists p_sugg_write on public.suggested_cafes;
create policy p_sugg_write on public.suggested_cafes for insert to authenticated
  with check (submitted_by = auth.uid());
drop policy if exists p_sugg_admin on public.suggested_cafes;
create policy p_sugg_admin on public.suggested_cafes for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- cafe_edit_suggestions: submitter sees/writes own; admin sees/manages all.
drop policy if exists p_edits_read on public.cafe_edit_suggestions;
create policy p_edits_read on public.cafe_edit_suggestions for select to authenticated
  using (submitted_by = auth.uid() or public.is_admin());
drop policy if exists p_edits_write on public.cafe_edit_suggestions;
create policy p_edits_write on public.cafe_edit_suggestions for insert to authenticated
  with check (submitted_by = auth.uid());
drop policy if exists p_edits_admin on public.cafe_edit_suggestions;
create policy p_edits_admin on public.cafe_edit_suggestions for update to authenticated
  using (public.is_admin()) with check (public.is_admin());
drop policy if exists p_edits_delete on public.cafe_edit_suggestions;
create policy p_edits_delete on public.cafe_edit_suggestions for delete to authenticated
  using (public.is_admin());

-- cafe_claims: submitter sees/writes own; admin sees/manages all.
drop policy if exists p_claims_read on public.cafe_claims;
create policy p_claims_read on public.cafe_claims for select to authenticated
  using (submitted_by = auth.uid() or public.is_admin());
drop policy if exists p_claims_write on public.cafe_claims;
create policy p_claims_write on public.cafe_claims for insert to authenticated
  with check (submitted_by = auth.uid());
drop policy if exists p_claims_admin on public.cafe_claims;
create policy p_claims_admin on public.cafe_claims for update to authenticated
  using (public.is_admin()) with check (public.is_admin());
drop policy if exists p_claims_delete on public.cafe_claims;
create policy p_claims_delete on public.cafe_claims for delete to authenticated
  using (public.is_admin());

-- notifications: only the recipient can read/update their own; any
-- authenticated user may create one as long as they are the actor
-- (e.g. the liker, commenter, follower, or admin taking the action).
drop policy if exists p_notifications_read on public.notifications;
create policy p_notifications_read on public.notifications for select to authenticated
  using (user_id = auth.uid());
drop policy if exists p_notifications_write on public.notifications;
create policy p_notifications_write on public.notifications for insert to authenticated
  with check (actor_id = auth.uid());
drop policy if exists p_notifications_update on public.notifications;
create policy p_notifications_update on public.notifications for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- push_subscriptions: a user manages only their own device subscriptions.
-- The server-side push-sending route reads across all users via the
-- service role key, which bypasses RLS entirely, so no cross-user policy
-- is needed here.
drop policy if exists p_push_subs_read on public.push_subscriptions;
create policy p_push_subs_read on public.push_subscriptions for select to authenticated
  using (user_id = auth.uid());
drop policy if exists p_push_subs_write on public.push_subscriptions;
create policy p_push_subs_write on public.push_subscriptions for insert to authenticated
  with check (user_id = auth.uid());
drop policy if exists p_push_subs_delete on public.push_subscriptions;
create policy p_push_subs_delete on public.push_subscriptions for delete to authenticated
  using (user_id = auth.uid());

-- cafe_notes: fully private to owner.
drop policy if exists p_cafe_notes_all on public.cafe_notes;
create policy p_cafe_notes_all on public.cafe_notes for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- cafe_tag_suggestions: submitter sees/writes own; admin sees/manages all.
drop policy if exists p_tag_suggestions_read on public.cafe_tag_suggestions;
create policy p_tag_suggestions_read on public.cafe_tag_suggestions for select to authenticated
  using (submitted_by = auth.uid() or public.is_admin());
drop policy if exists p_tag_suggestions_write on public.cafe_tag_suggestions;
create policy p_tag_suggestions_write on public.cafe_tag_suggestions for insert to authenticated
  with check (submitted_by = auth.uid());
drop policy if exists p_tag_suggestions_admin on public.cafe_tag_suggestions;
create policy p_tag_suggestions_admin on public.cafe_tag_suggestions for update to authenticated
  using (public.is_admin()) with check (public.is_admin());
drop policy if exists p_tag_suggestions_delete on public.cafe_tag_suggestions;
create policy p_tag_suggestions_delete on public.cafe_tag_suggestions for delete to authenticated
  using (public.is_admin());

-- =========================================================================
-- Direct messaging: requests, conversations, messages, blocks, reports
-- Clients can only READ these tables. All writes go through the functions
-- below (security definer), which enforce the rules: no self-messaging,
-- no messaging across a block, one conversation per pair, and messages only
-- once the recipient has accepted.
-- =========================================================================
create table if not exists public.conversations (
  id                     uuid primary key default gen_random_uuid(),
  requester_id           uuid references auth.users (id) on delete set null,
  recipient_id           uuid references auth.users (id) on delete set null,
  status                 text not null default 'pending' check (status in ('pending','accepted','declined')),
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now(),
  requester_last_read_at timestamptz not null default now(),
  recipient_last_read_at timestamptz not null default 'epoch',
  check (requester_id <> recipient_id)
);
drop index if exists public.conversations_pair_idx;
create unique index conversations_pair_idx
  on public.conversations (least(requester_id, recipient_id), greatest(requester_id, recipient_id))
  where requester_id is not null and recipient_id is not null;
create index if not exists conversations_requester_idx on public.conversations (requester_id);
create index if not exists conversations_recipient_idx on public.conversations (recipient_id);

create table if not exists public.direct_messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  sender_id       uuid references auth.users (id) on delete set null,
  body            text not null check (char_length(body) between 1 and 2000),
  created_at      timestamptz not null default now()
);
create index if not exists direct_messages_conv_idx on public.direct_messages (conversation_id, created_at);

create table if not exists public.user_blocks (
  blocker_id uuid not null references auth.users (id) on delete cascade,
  blocked_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);

create table if not exists public.message_reports (
  id               uuid primary key default gen_random_uuid(),
  reporter_id      uuid references auth.users (id) on delete set null,
  reported_user_id uuid references auth.users (id) on delete set null,
  conversation_id  uuid references public.conversations (id) on delete set null,
  reason           text not null,
  details          text not null default '',
  evidence         text not null default '',
  status           text not null default 'pending' check (status in ('pending','resolved')),
  created_at       timestamptz not null default now()
);
create index if not exists message_reports_status_idx on public.message_reports (status);

-- Upgrade path for databases created before "keep chats when someone deletes their account":
-- when a person is deleted, the other person keeps the chat and the deleted side becomes NULL ("Deleted user").
alter table public.conversations   alter column requester_id drop not null;
alter table public.conversations   alter column recipient_id drop not null;
alter table public.direct_messages alter column sender_id    drop not null;
alter table public.conversations   drop constraint if exists conversations_requester_id_fkey;
alter table public.conversations   add constraint conversations_requester_id_fkey foreign key (requester_id) references auth.users (id) on delete set null;
alter table public.conversations   drop constraint if exists conversations_recipient_id_fkey;
alter table public.conversations   add constraint conversations_recipient_id_fkey foreign key (recipient_id) references auth.users (id) on delete set null;
alter table public.direct_messages drop constraint if exists direct_messages_sender_id_fkey;
alter table public.direct_messages add constraint direct_messages_sender_id_fkey foreign key (sender_id) references auth.users (id) on delete set null;

alter table public.conversations   enable row level security;
alter table public.direct_messages enable row level security;
alter table public.user_blocks     enable row level security;
alter table public.message_reports enable row level security;

drop policy if exists p_conversations_read on public.conversations;
create policy p_conversations_read on public.conversations for select to authenticated
  using (requester_id = auth.uid() or recipient_id = auth.uid());

drop policy if exists p_direct_messages_read on public.direct_messages;
create policy p_direct_messages_read on public.direct_messages for select to authenticated
  using (exists (
    select 1 from public.conversations c
    where c.id = conversation_id and (c.requester_id = auth.uid() or c.recipient_id = auth.uid())
  ));

drop policy if exists p_user_blocks_read on public.user_blocks;
create policy p_user_blocks_read on public.user_blocks for select to authenticated
  using (blocker_id = auth.uid());
drop policy if exists p_user_blocks_write on public.user_blocks;
create policy p_user_blocks_write on public.user_blocks for insert to authenticated
  with check (blocker_id = auth.uid());
drop policy if exists p_user_blocks_delete on public.user_blocks;
create policy p_user_blocks_delete on public.user_blocks for delete to authenticated
  using (blocker_id = auth.uid());

-- Reports hold a snapshot of the reported messages ("evidence"), so admins
-- never need blanket access to private conversations.
drop policy if exists p_message_reports_read on public.message_reports;
create policy p_message_reports_read on public.message_reports for select to authenticated
  using (public.is_admin());
drop policy if exists p_message_reports_write on public.message_reports;
create policy p_message_reports_write on public.message_reports for insert to authenticated
  with check (reporter_id = auth.uid());
drop policy if exists p_message_reports_admin on public.message_reports;
create policy p_message_reports_admin on public.message_reports for update to authenticated
  using (public.is_admin()) with check (public.is_admin());
drop policy if exists p_message_reports_delete on public.message_reports;
create policy p_message_reports_delete on public.message_reports for delete to authenticated
  using (public.is_admin());

-- Is there a block in either direction between two users? (Bypasses RLS so
-- a blocked person's client can be refused without ever learning who blocked.)
create or replace function public.users_blocked_between(a uuid, b uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.user_blocks
    where (blocker_id = a and blocked_id = b) or (blocker_id = b and blocked_id = a)
  );
$$;

create or replace function public.request_message(recipient uuid, first_message text)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  me uuid := auth.uid();
  msg text := btrim(coalesce(first_message, ''));
  conv uuid;
begin
  if me is null then raise exception 'Not signed in.'; end if;
  if recipient is null or recipient = me then raise exception 'You can''t message this person.'; end if;
  if char_length(msg) < 1 or char_length(msg) > 2000 then raise exception 'Message must be 1-2000 characters.'; end if;
  if not exists (select 1 from public.profiles where id = recipient) then raise exception 'User not found.'; end if;
  if public.users_blocked_between(me, recipient) then raise exception 'You can''t message this person.'; end if;
  if exists (
    select 1 from public.conversations
    where least(requester_id, recipient_id) = least(me, recipient)
      and greatest(requester_id, recipient_id) = greatest(me, recipient)
  ) then
    raise exception 'A conversation or request already exists.';
  end if;
  insert into public.conversations (requester_id, recipient_id) values (me, recipient) returning id into conv;
  insert into public.direct_messages (conversation_id, sender_id, body) values (conv, me, msg);
  return conv;
end; $$;

create or replace function public.respond_to_message_request(conv uuid, accept boolean)
returns void language plpgsql security definer set search_path = public as $$
declare
  me uuid := auth.uid();
  c public.conversations;
begin
  if me is null then raise exception 'Not signed in.'; end if;
  select * into c from public.conversations where id = conv and recipient_id = me and status = 'pending';
  if not found then raise exception 'Request not found.'; end if;
  if accept and public.users_blocked_between(c.requester_id, c.recipient_id) then
    raise exception 'You can''t message this person.';
  end if;
  update public.conversations
    set status = case when accept then 'accepted' else 'declined' end,
        updated_at = now(),
        recipient_last_read_at = now()
    where id = conv;
end; $$;

create or replace function public.send_message(conv uuid, msg text)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  me uuid := auth.uid();
  clean text := btrim(coalesce(msg, ''));
  c public.conversations;
  new_id uuid;
begin
  if me is null then raise exception 'Not signed in.'; end if;
  if char_length(clean) < 1 or char_length(clean) > 2000 then raise exception 'Message must be 1-2000 characters.'; end if;
  select * into c from public.conversations
    where id = conv and (requester_id = me or recipient_id = me);
  if not found then raise exception 'Conversation not found.'; end if;
  if c.requester_id is null or c.recipient_id is null then raise exception 'This person has deleted their account.'; end if;
  if c.status <> 'accepted' then raise exception 'This conversation isn''t open yet.'; end if;
  if public.users_blocked_between(c.requester_id, c.recipient_id) then raise exception 'You can''t message this person.'; end if;
  insert into public.direct_messages (conversation_id, sender_id, body) values (conv, me, clean) returning id into new_id;
  update public.conversations
    set updated_at = now(),
        requester_last_read_at = case when me = requester_id then now() else requester_last_read_at end,
        recipient_last_read_at = case when me = recipient_id then now() else recipient_last_read_at end
    where id = conv;
  return new_id;
end; $$;

create or replace function public.mark_conversation_read(conv uuid)
returns void language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid();
begin
  if me is null then raise exception 'Not signed in.'; end if;
  update public.conversations
    set requester_last_read_at = case when me = requester_id then now() else requester_last_read_at end,
        recipient_last_read_at = case when me = recipient_id then now() else recipient_last_read_at end
    where id = conv and (requester_id = me or recipient_id = me);
end; $$;

-- Internal helper only: not callable by clients (it would reveal who blocked whom).
revoke all on function public.users_blocked_between(uuid, uuid) from public;
revoke all on function public.request_message(uuid, text) from public;
revoke all on function public.respond_to_message_request(uuid, boolean) from public;
revoke all on function public.send_message(uuid, text) from public;
revoke all on function public.mark_conversation_read(uuid) from public;
grant execute on function public.request_message(uuid, text) to authenticated;
grant execute on function public.respond_to_message_request(uuid, boolean) to authenticated;
grant execute on function public.send_message(uuid, text) to authenticated;
grant execute on function public.mark_conversation_read(uuid) to authenticated;
-- Supabase grants EXECUTE to anon/authenticated by default; remove what clients must not have.
revoke execute on function public.users_blocked_between(uuid, uuid) from anon, authenticated;
revoke execute on function public.request_message(uuid, text) from anon;
revoke execute on function public.respond_to_message_request(uuid, boolean) from anon;
revoke execute on function public.send_message(uuid, text) from anon;
revoke execute on function public.mark_conversation_read(uuid) from anon;

-- =========================================================================
-- post_reports  (a user flagging a post for admin review)
-- One report per person per post. If the post is removed, its reports go with it.
-- =========================================================================
create table if not exists public.post_reports (
  id          uuid primary key default gen_random_uuid(),
  post_id     uuid not null references public.posts (id) on delete cascade,
  reporter_id uuid references auth.users (id) on delete set null,
  reason      text not null check (reason in ('Spam','Offensive','Wrong info','Other')),
  status      text not null default 'pending' check (status in ('pending','dismissed')),
  created_at  timestamptz not null default now(),
  unique (post_id, reporter_id)
);
create index if not exists post_reports_status_idx on public.post_reports (status);
alter table public.post_reports enable row level security;

-- Reporters can see their own reports (so the app can show "Reported"); admins see all.
drop policy if exists p_post_reports_read on public.post_reports;
create policy p_post_reports_read on public.post_reports for select to authenticated
  using (reporter_id = auth.uid() or public.is_admin());
-- You can only report as yourself, and never your own post.
drop policy if exists p_post_reports_write on public.post_reports;
create policy p_post_reports_write on public.post_reports for insert to authenticated
  with check (
    reporter_id = auth.uid()
    and exists (select 1 from public.posts p where p.id = post_id and p.user_id <> auth.uid())
  );
drop policy if exists p_post_reports_admin on public.post_reports;
create policy p_post_reports_admin on public.post_reports for update to authenticated
  using (public.is_admin()) with check (public.is_admin());
drop policy if exists p_post_reports_delete on public.post_reports;
create policy p_post_reports_delete on public.post_reports for delete to authenticated
  using (public.is_admin());

-- =========================================================================
-- cafe_reports  (a user flagging a café listing, e.g. one that began as a suggestion)
-- profile_reports  (a user flagging another person's profile)
-- Same shape as post_reports: one report per person per target.
-- =========================================================================
create table if not exists public.cafe_reports (
  id          uuid primary key default gen_random_uuid(),
  cafe_id     uuid not null references public.cafes (id) on delete cascade,
  reporter_id uuid references auth.users (id) on delete set null,
  reason      text not null check (reason in ('Spam','Offensive','Wrong info','Other')),
  status      text not null default 'pending' check (status in ('pending','dismissed')),
  created_at  timestamptz not null default now(),
  unique (cafe_id, reporter_id)
);
create index if not exists cafe_reports_status_idx on public.cafe_reports (status);
alter table public.cafe_reports enable row level security;

drop policy if exists p_cafe_reports_read on public.cafe_reports;
create policy p_cafe_reports_read on public.cafe_reports for select to authenticated
  using (reporter_id = auth.uid() or public.is_admin());
drop policy if exists p_cafe_reports_write on public.cafe_reports;
create policy p_cafe_reports_write on public.cafe_reports for insert to authenticated
  with check (reporter_id = auth.uid());
drop policy if exists p_cafe_reports_admin on public.cafe_reports;
create policy p_cafe_reports_admin on public.cafe_reports for update to authenticated
  using (public.is_admin()) with check (public.is_admin());
drop policy if exists p_cafe_reports_delete on public.cafe_reports;
create policy p_cafe_reports_delete on public.cafe_reports for delete to authenticated
  using (public.is_admin());

create table if not exists public.profile_reports (
  id               uuid primary key default gen_random_uuid(),
  reported_user_id uuid not null references auth.users (id) on delete cascade,
  reporter_id      uuid references auth.users (id) on delete set null,
  reason           text not null check (reason in ('Spam','Offensive','Impersonation','Other')),
  status           text not null default 'pending' check (status in ('pending','dismissed')),
  created_at       timestamptz not null default now(),
  unique (reported_user_id, reporter_id),
  check (reported_user_id <> reporter_id)
);
create index if not exists profile_reports_status_idx on public.profile_reports (status);
alter table public.profile_reports enable row level security;

drop policy if exists p_profile_reports_read on public.profile_reports;
create policy p_profile_reports_read on public.profile_reports for select to authenticated
  using (reporter_id = auth.uid() or public.is_admin());
-- You can only report as yourself, and never your own profile.
drop policy if exists p_profile_reports_write on public.profile_reports;
create policy p_profile_reports_write on public.profile_reports for insert to authenticated
  with check (reporter_id = auth.uid() and reported_user_id <> auth.uid());
drop policy if exists p_profile_reports_admin on public.profile_reports;
create policy p_profile_reports_admin on public.profile_reports for update to authenticated
  using (public.is_admin()) with check (public.is_admin());
drop policy if exists p_profile_reports_delete on public.profile_reports;
create policy p_profile_reports_delete on public.profile_reports for delete to authenticated
  using (public.is_admin());

-- =========================================================================
-- Auto-create a profile row on signup (username from metadata or email)
-- =========================================================================
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  uname text;
begin
  uname := coalesce(
    nullif(new.raw_user_meta_data->>'username', ''),
    split_part(new.email, '@', 1)
  );
  if exists (select 1 from public.profiles where username = uname) then
    uname := uname || '_' || substr(new.id::text, 1, 4);
  end if;
  insert into public.profiles (id, name, username, email, location)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data->>'name',''), split_part(new.email,'@',1)),
    uname,
    new.email,
    coalesce(new.raw_user_meta_data->>'location','')
  ) on conflict (id) do nothing;
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =========================================================================
-- Storage buckets (public): avatars, post-photos, cafe-images
-- =========================================================================
insert into storage.buckets (id, name, public) values
  ('avatars','avatars',true),
  ('post-photos','post-photos',true),
  ('cafe-images','cafe-images',true)
on conflict (id) do nothing;

drop policy if exists p_storage_read on storage.objects;
create policy p_storage_read on storage.objects for select
  using (bucket_id in ('avatars','post-photos','cafe-images'));
drop policy if exists p_storage_write on storage.objects;
create policy p_storage_write on storage.objects for insert to authenticated
  with check (bucket_id in ('avatars','post-photos','cafe-images'));
drop policy if exists p_storage_update on storage.objects;
create policy p_storage_update on storage.objects for update to authenticated
  using (bucket_id in ('avatars','post-photos','cafe-images'));
