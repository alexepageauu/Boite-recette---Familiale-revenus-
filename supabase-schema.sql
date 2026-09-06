-- ============================================================
-- La Boîte à Recettes — script de configuration Supabase
-- ============================================================
-- Comment l'utiliser :
--   1. Ouvre ton projet sur supabase.com
--   2. Va dans "SQL Editor" (menu de gauche)
--   3. Colle TOUT ce fichier
--   4. Clique "Run"
-- Tu peux le relancer sans danger si besoin (il ne duplique rien).
-- ============================================================

-- ============================================================
-- Familles (espaces séparés) — VERSION 2
-- ============================================================

create table if not exists public.families (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  invite_code text not null unique,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.family_members (
  family_id uuid not null references public.families(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (family_id, user_id)
);

alter table public.families enable row level security;
alter table public.family_members enable row level security;

-- On ne peut voir qu'une famille dont on est déjà membre
drop policy if exists "families_member_select" on public.families;
create policy "families_member_select"
  on public.families for select
  to authenticated
  using (exists (
    select 1 from public.family_members fm
    where fm.family_id = families.id and fm.user_id = auth.uid()
  ));

-- On ne voit que SES PROPRES appartenances (pour savoir dans quelle famille on est)
drop policy if exists "family_members_own_select" on public.family_members;
create policy "family_members_own_select"
  on public.family_members for select
  to authenticated
  using (user_id = auth.uid());

-- Créer une famille : génère un code d'invitation et ajoute automatiquement le créateur comme membre
create or replace function public.create_family(family_name text)
returns table(family_id uuid, invite_code text)
language plpgsql
security definer
set search_path = public
as $$
declare
  new_id uuid := gen_random_uuid();
  code text := upper(substr(md5(random()::text || clock_timestamp()::text), 1, 6));
begin
  insert into public.families(id, name, invite_code, created_by) values (new_id, family_name, code, auth.uid());
  insert into public.family_members(family_id, user_id) values (new_id, auth.uid());
  return query select new_id, code;
end;
$$;
grant execute on function public.create_family(text) to authenticated;

-- Rejoindre une famille avec son code (fonctionne même si on n'est pas encore membre,
-- car la fonction s'exécute avec des droits élevés — c'est la seule porte d'entrée)
create or replace function public.join_family_by_code(code text)
returns table(family_id uuid, family_name text)
language plpgsql
security definer
set search_path = public
as $$
declare
  fam record;
begin
  select id, name into fam from public.families where invite_code = upper(code);
  if fam.id is null then
    raise exception 'Code invalide';
  end if;
  insert into public.family_members(family_id, user_id) values (fam.id, auth.uid())
  on conflict do nothing;
  return query select fam.id, fam.name;
end;
$$;
grant execute on function public.join_family_by_code(text) to authenticated;

-- Table principale des recettes
create table if not exists public.recipes (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text not null default 'Autre',
  prep_min integer,
  cook_min integer,
  servings integer,
  ingredients text[] not null default '{}',
  steps text[] not null default '{}',
  photo_url text,
  author text,
  story text,
  tags text[] not null default '{}',
  source_url text,
  family_id uuid references public.families(id) on delete cascade,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

-- Ajoute les colonnes récentes si la table existait déjà sans elles (sans danger à relancer)
alter table public.recipes add column if not exists story text;
alter table public.recipes add column if not exists tags text[] not null default '{}';
alter table public.recipes add column if not exists source_url text;
alter table public.recipes add column if not exists family_id uuid references public.families(id) on delete cascade;

-- Active la sécurité au niveau des lignes (RLS)
alter table public.recipes enable row level security;

-- On ne voit que les recettes de SA PROPRE famille (plus de lecture publique en V2)
drop policy if exists "recipes_public_read" on public.recipes;
drop policy if exists "recipes_family_select" on public.recipes;
create policy "recipes_family_select"
  on public.recipes for select
  to authenticated
  using (exists (
    select 1 from public.family_members fm
    where fm.family_id = recipes.family_id and fm.user_id = auth.uid()
  ));

-- On ne peut AJOUTER une recette que dans une famille dont on est membre
drop policy if exists "recipes_authenticated_insert" on public.recipes;
drop policy if exists "recipes_family_insert" on public.recipes;
create policy "recipes_family_insert"
  on public.recipes for insert
  to authenticated
  with check (exists (
    select 1 from public.family_members fm
    where fm.family_id = recipes.family_id and fm.user_id = auth.uid()
  ));

-- On ne peut MODIFIER qu'une recette de sa propre famille
drop policy if exists "recipes_authenticated_update" on public.recipes;
drop policy if exists "recipes_family_update" on public.recipes;
create policy "recipes_family_update"
  on public.recipes for update
  to authenticated
  using (exists (
    select 1 from public.family_members fm
    where fm.family_id = recipes.family_id and fm.user_id = auth.uid()
  ))
  with check (exists (
    select 1 from public.family_members fm
    where fm.family_id = recipes.family_id and fm.user_id = auth.uid()
  ));

-- On ne peut SUPPRIMER qu'une recette de sa propre famille
drop policy if exists "recipes_authenticated_delete" on public.recipes;
drop policy if exists "recipes_family_delete" on public.recipes;
create policy "recipes_family_delete"
  on public.recipes for delete
  to authenticated
  using (exists (
    select 1 from public.family_members fm
    where fm.family_id = recipes.family_id and fm.user_id = auth.uid()
  ));

-- Active les mises à jour en direct (temps réel) sur la table
-- (cette version peut être relancée sans erreur, contrairement à l'ancienne)
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'recipes'
  ) then
    alter publication supabase_realtime add table public.recipes;
  end if;
end $$;

-- ============================================================
-- Stockage des photos
-- ============================================================

-- Crée le "bucket" (dossier de stockage) public pour les photos de recettes
insert into storage.buckets (id, name, public)
values ('recipe-photos', 'recipe-photos', true)
on conflict (id) do nothing;

-- Tout le monde peut VOIR les photos
drop policy if exists "recipe_photos_public_read" on storage.objects;
create policy "recipe_photos_public_read"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'recipe-photos');

-- Seules les personnes connectées peuvent AJOUTER une photo
drop policy if exists "recipe_photos_authenticated_insert" on storage.objects;
create policy "recipe_photos_authenticated_insert"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'recipe-photos');

-- Seules les personnes connectées peuvent REMPLACER/SUPPRIMER une photo
drop policy if exists "recipe_photos_authenticated_update" on storage.objects;
create policy "recipe_photos_authenticated_update"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'recipe-photos');

drop policy if exists "recipe_photos_authenticated_delete" on storage.objects;
create policy "recipe_photos_authenticated_delete"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'recipe-photos');

-- ============================================================
-- Coups de cœur (favoris)
-- ============================================================

create table if not exists public.favorites (
  user_id uuid not null references auth.users(id) on delete cascade,
  recipe_id uuid not null references public.recipes(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, recipe_id)
);

alter table public.favorites enable row level security;

-- Chacun ne voit, n'ajoute et ne retire que SES PROPRES favoris
drop policy if exists "favorites_own_select" on public.favorites;
create policy "favorites_own_select"
  on public.favorites for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "favorites_own_insert" on public.favorites;
create policy "favorites_own_insert"
  on public.favorites for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "favorites_own_delete" on public.favorites;
create policy "favorites_own_delete"
  on public.favorites for delete
  to authenticated
  using (auth.uid() = user_id);

-- ============================================================
-- Blogue nutrition
-- ============================================================

create table if not exists public.blog_posts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  cover_url text,
  author text,
  family_id uuid references public.families(id) on delete cascade,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.blog_posts enable row level security;

drop policy if exists "blog_public_read" on public.blog_posts;
drop policy if exists "blog_family_select" on public.blog_posts;
create policy "blog_family_select"
  on public.blog_posts for select
  to authenticated
  using (exists (
    select 1 from public.family_members fm
    where fm.family_id = blog_posts.family_id and fm.user_id = auth.uid()
  ));

drop policy if exists "blog_authenticated_insert" on public.blog_posts;
drop policy if exists "blog_family_insert" on public.blog_posts;
create policy "blog_family_insert"
  on public.blog_posts for insert
  to authenticated
  with check (exists (
    select 1 from public.family_members fm
    where fm.family_id = blog_posts.family_id and fm.user_id = auth.uid()
  ));

drop policy if exists "blog_authenticated_update" on public.blog_posts;
drop policy if exists "blog_family_update" on public.blog_posts;
create policy "blog_family_update"
  on public.blog_posts for update
  to authenticated
  using (exists (
    select 1 from public.family_members fm
    where fm.family_id = blog_posts.family_id and fm.user_id = auth.uid()
  ))
  with check (exists (
    select 1 from public.family_members fm
    where fm.family_id = blog_posts.family_id and fm.user_id = auth.uid()
  ));

drop policy if exists "blog_authenticated_delete" on public.blog_posts;
drop policy if exists "blog_family_delete" on public.blog_posts;
create policy "blog_family_delete"
  on public.blog_posts for delete
  to authenticated
  using (exists (
    select 1 from public.family_members fm
    where fm.family_id = blog_posts.family_id and fm.user_id = auth.uid()
  ));

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'blog_posts'
  ) then
    alter publication supabase_realtime add table public.blog_posts;
  end if;
end $$;

-- Photos de couverture du blogue (même principe que les photos de recettes)
insert into storage.buckets (id, name, public)
values ('blog-photos', 'blog-photos', true)
on conflict (id) do nothing;

drop policy if exists "blog_photos_public_read" on storage.objects;
create policy "blog_photos_public_read"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'blog-photos');

drop policy if exists "blog_photos_authenticated_insert" on storage.objects;
create policy "blog_photos_authenticated_insert"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'blog-photos');

drop policy if exists "blog_photos_authenticated_update" on storage.objects;
create policy "blog_photos_authenticated_update"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'blog-photos');

drop policy if exists "blog_photos_authenticated_delete" on storage.objects;
create policy "blog_photos_authenticated_delete"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'blog-photos');
