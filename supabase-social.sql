-- NeuroQuest social/live team system
-- Run this in Supabase SQL editor after save_states is configured.

create table if not exists public.public_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  public_hero jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.public_profiles enable row level security;

drop policy if exists "Authenticated users can read public profiles" on public.public_profiles;
create policy "Authenticated users can read public profiles"
on public.public_profiles
for select
to authenticated
using (true);

drop policy if exists "Users can insert their own public profile" on public.public_profiles;
create policy "Users can insert their own public profile"
on public.public_profiles
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can update their own public profile" on public.public_profiles;
create policy "Users can update their own public profile"
on public.public_profiles
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create table if not exists public.friend_invites (
  code text primary key,
  creator_user_id uuid not null references auth.users(id) on delete cascade,
  public_hero jsonb not null,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'revoked')),
  accepted_by_user_id uuid references auth.users(id) on delete set null,
  accepted_at timestamptz,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '14 days')
);

alter table public.friend_invites enable row level security;

drop policy if exists "Users can create their own friend invites" on public.friend_invites;
create policy "Users can create their own friend invites"
on public.friend_invites
for insert
to authenticated
with check (auth.uid() = creator_user_id);

drop policy if exists "Authenticated users can read valid friend invites" on public.friend_invites;
create policy "Authenticated users can read valid friend invites"
on public.friend_invites
for select
to authenticated
using (expires_at > now() or creator_user_id = auth.uid() or accepted_by_user_id = auth.uid());

drop policy if exists "Invite receivers can mark invites accepted" on public.friend_invites;
create policy "Invite receivers can mark invites accepted"
on public.friend_invites
for update
to authenticated
using (expires_at > now() and status = 'pending')
with check (accepted_by_user_id = auth.uid() and status = 'accepted');

drop policy if exists "Users can delete their own friend invites" on public.friend_invites;
create policy "Users can delete their own friend invites"
on public.friend_invites
for delete
to authenticated
using (auth.uid() = creator_user_id);

create table if not exists public.friendships (
  user_id uuid not null references auth.users(id) on delete cascade,
  friend_user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'accepted' check (status in ('accepted', 'blocked')),
  created_at timestamptz not null default now(),
  primary key (user_id, friend_user_id),
  check (user_id <> friend_user_id)
);

alter table public.friendships enable row level security;

drop policy if exists "Users can read their friendships" on public.friendships;
create policy "Users can read their friendships"
on public.friendships
for select
to authenticated
using (auth.uid() = user_id or auth.uid() = friend_user_id);

drop policy if exists "Users can create accepted friendships involving them" on public.friendships;
create policy "Users can create accepted friendships involving them"
on public.friendships
for insert
to authenticated
with check (auth.uid() = user_id or auth.uid() = friend_user_id);

drop policy if exists "Users can delete friendships involving them" on public.friendships;
create policy "Users can delete friendships involving them"
on public.friendships
for delete
to authenticated
using (auth.uid() = user_id or auth.uid() = friend_user_id);
