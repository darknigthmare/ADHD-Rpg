# NeuroQuest

Application web statique RPG/TDA(H) pour transformer les taches, routines, repos et recompenses en experience ludique.

## Deploiement Vercel

- Framework preset: `Other`
- Build command: laisser vide
- Output directory: `.`

Le fichier principal est `index.html`.

## Comptes utilisateur avec Supabase

1. Creer un projet sur Supabase.
2. Dans `index.html`, renseigner :
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
3. Dans Supabase, aller dans `SQL Editor` et executer :

```sql
create table if not exists public.save_states (
  user_id uuid primary key references auth.users(id) on delete cascade,
  state jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.save_states enable row level security;

create policy "Users can read their own save"
on public.save_states
for select
using (auth.uid() = user_id);

create policy "Users can insert their own save"
on public.save_states
for insert
with check (auth.uid() = user_id);

create policy "Users can update their own save"
on public.save_states
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
```

4. Dans `Authentication > URL Configuration`, ajouter l'URL Vercel du site dans les URLs autorisees.

La sauvegarde locale reste active en secours. Quand un utilisateur est connecte, NeuroQuest synchronise aussi la sauvegarde dans `save_states`.
