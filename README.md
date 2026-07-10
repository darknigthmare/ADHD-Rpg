# NeuroQuest

Application web statique RPG/TDA(H) pour transformer les taches, routines, repos et recompenses en experience ludique.

## Deploiement Vercel

- Framework preset: `Other`
- Build command: laisser vide
- Output directory: `.`

Le fichier principal est `index.html`.

## Structure actuelle

- `index.html` : interface et logique applicative encore consolidee.
- `assets/css/app.css` : styles de l'application.
- `assets/` : sprites, decors, objets et autres medias.
- `api/` : configuration serveur exposee a Vercel.
- `docs/audits/` : captures et rapports des passes de qualite.

Le decoupage de `index.html` se fait progressivement pour limiter les regressions. Les prochaines extractions JavaScript doivent suivre les domaines fonctionnels : sauvegarde, audio, quetes/planner, bataille, puis equipe/cloud.

## Principe de progression

Les XP et les PO recompensent une action accomplie : quete, sous-tache, Focus Raid ou haut fait. Laisser l'application ouverte ne genere pas de progression. Le repos au camp peut seulement recuperer des PV et preparer le bonus de repos.

## Comptes utilisateur avec Supabase

1. Creer un projet sur Supabase.
2. Dans Vercel, ajouter les variables d'environnement :
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
3. L'app les lit automatiquement via `/api/supabase-config`.
4. Dans Supabase, aller dans `SQL Editor` et executer :

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

5. Dans `Authentication > URL Configuration`, ajouter l'URL Vercel du site dans les URLs autorisees.

La sauvegarde locale reste active en secours. Quand un utilisateur est connecte, NeuroQuest synchronise aussi la sauvegarde dans `save_states`.
