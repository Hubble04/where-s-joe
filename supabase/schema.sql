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
