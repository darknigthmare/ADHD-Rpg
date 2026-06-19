-- NeuroQuest social invites
-- Run this in Supabase SQL editor after save_states is configured.

create table if not exists public.friend_invites (
  code text primary key,
  creator_user_id uuid not null references auth.users(id) on delete cascade,
  public_hero jsonb not null,
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
using (expires_at > now());

drop policy if exists "Users can delete their own friend invites" on public.friend_invites;
create policy "Users can delete their own friend invites"
on public.friend_invites
for delete
to authenticated
using (auth.uid() = creator_user_id);
