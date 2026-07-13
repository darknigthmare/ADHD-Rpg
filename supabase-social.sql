-- NeuroQuest cloud save and live team schema.
-- Idempotent: this file can be run again in the Supabase SQL editor.

create table if not exists public.save_states (
  user_id uuid primary key references auth.users(id) on delete cascade,
  state jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.public_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  public_hero jsonb not null,
  updated_at timestamptz not null default now()
);

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

create table if not exists public.friendships (
  user_id uuid not null references auth.users(id) on delete cascade,
  friend_user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'accepted' check (status in ('accepted', 'blocked')),
  created_at timestamptz not null default now(),
  primary key (user_id, friend_user_id),
  check (user_id <> friend_user_id)
);

alter table public.save_states enable row level security;
alter table public.public_profiles enable row level security;
alter table public.friend_invites enable row level security;
alter table public.friendships enable row level security;

-- Data API privileges are explicit. Anonymous visitors cannot access player data.
revoke all on table public.save_states from anon, authenticated;
revoke all on table public.public_profiles from anon, authenticated;
revoke all on table public.friend_invites from anon, authenticated;
revoke all on table public.friendships from anon, authenticated;

grant select, insert, update on table public.save_states to authenticated;
grant select, insert, update on table public.public_profiles to authenticated;
grant select, insert, delete on table public.friend_invites to authenticated;
grant select, delete on table public.friendships to authenticated;

drop policy if exists "Users can read their own save" on public.save_states;
create policy "Users can read their own save"
on public.save_states for select to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Users can insert their own save" on public.save_states;
create policy "Users can insert their own save"
on public.save_states for insert to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update their own save" on public.save_states;
create policy "Users can update their own save"
on public.save_states for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "Authenticated users can read public profiles" on public.public_profiles;
create policy "Authenticated users can read public profiles"
on public.public_profiles for select to authenticated
using (true);

drop policy if exists "Users can insert their own public profile" on public.public_profiles;
create policy "Users can insert their own public profile"
on public.public_profiles for insert to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update their own public profile" on public.public_profiles;
create policy "Users can update their own public profile"
on public.public_profiles for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can create their own friend invites" on public.friend_invites;
create policy "Users can create their own friend invites"
on public.friend_invites for insert to authenticated
with check ((select auth.uid()) = creator_user_id);

drop policy if exists "Authenticated users can read valid friend invites" on public.friend_invites;
create policy "Users can read their own friend invites"
on public.friend_invites for select to authenticated
using (
  (select auth.uid()) = creator_user_id
  or (select auth.uid()) = accepted_by_user_id
);

drop policy if exists "Invite receivers can mark invites accepted" on public.friend_invites;

drop policy if exists "Users can delete their own friend invites" on public.friend_invites;
create policy "Users can delete their own friend invites"
on public.friend_invites for delete to authenticated
using ((select auth.uid()) = creator_user_id);

drop policy if exists "Users can create accepted friendships involving them" on public.friendships;

drop policy if exists "Users can read their friendships" on public.friendships;
create policy "Users can read their friendships"
on public.friendships for select to authenticated
using ((select auth.uid()) = user_id or (select auth.uid()) = friend_user_id);

drop policy if exists "Users can delete friendships involving them" on public.friendships;
create policy "Users can delete friendships involving them"
on public.friendships for delete to authenticated
using ((select auth.uid()) = user_id or (select auth.uid()) = friend_user_id);

create index if not exists friend_invites_creator_idx on public.friend_invites (creator_user_id);
create index if not exists friend_invites_accepted_by_idx on public.friend_invites (accepted_by_user_id);
create index if not exists friend_invites_expiry_idx on public.friend_invites (expires_at);
create index if not exists friendships_friend_idx on public.friendships (friend_user_id);

-- Accepting an invitation is atomic: validate code, consume invite, create friendship.
create or replace function public.accept_friend_invite(p_code text)
returns table (inviter_user_id uuid, inviter_public_hero jsonb)
language plpgsql
security definer
set search_path = pg_catalog, public, auth
as $function$
declare
  v_user_id uuid := auth.uid();
  v_invite public.friend_invites%rowtype;
begin
  if v_user_id is null then
    raise exception 'authentication required' using errcode = '28000';
  end if;

  select * into v_invite
  from public.friend_invites
  where code = p_code
  for update;

  if not found then
    raise exception 'invite not found' using errcode = 'P0002';
  end if;
  if v_invite.creator_user_id = v_user_id then
    raise exception 'cannot accept your own invite' using errcode = '22023';
  end if;
  if v_invite.status <> 'pending' then
    raise exception 'invite already used' using errcode = '22023';
  end if;
  if v_invite.expires_at <= now() then
    raise exception 'invite expired' using errcode = '22023';
  end if;

  update public.friend_invites
  set status = 'accepted', accepted_by_user_id = v_user_id, accepted_at = now()
  where code = p_code;

  insert into public.friendships (user_id, friend_user_id, status)
  values (v_invite.creator_user_id, v_user_id, 'accepted')
  on conflict (user_id, friend_user_id)
  do update set status = excluded.status;

  return query select v_invite.creator_user_id, v_invite.public_hero;
end;
$function$;

revoke all on function public.accept_friend_invite(text) from public, anon;
grant execute on function public.accept_friend_invite(text) to authenticated;
