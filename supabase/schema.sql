create table if not exists public.tactics (
  id uuid primary key default gen_random_uuid(),
  map text not null,
  side text not null check (side in ('CT', 'T')),
  title text not null,
  site text not null default 'A',
  summary text not null default '',
  steps text[] not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists public.grenades (
  id uuid primary key default gen_random_uuid(),
  map text not null,
  side text not null check (side in ('CT', 'T')),
  name text not null,
  types text[] not null default '{}',
  from_position text not null default '',
  target text not null default '',
  summary text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.links (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  url text not null,
  map text not null,
  side text not null check (side in ('CT', 'T')),
  type text not null check (type in ('tactics', 'grenades')),
  nade_types text[] not null default '{}',
  note text not null default '',
  created_at timestamptz not null default now()
);

alter table public.tactics enable row level security;
alter table public.grenades enable row level security;
alter table public.links enable row level security;

create policy "public read tactics" on public.tactics for select using (true);
create policy "public insert tactics" on public.tactics for insert with check (true);
create policy "public update tactics" on public.tactics for update using (true) with check (true);
create policy "public delete tactics" on public.tactics for delete using (true);
create policy "public read grenades" on public.grenades for select using (true);
create policy "public insert grenades" on public.grenades for insert with check (true);
create policy "public update grenades" on public.grenades for update using (true) with check (true);
create policy "public delete grenades" on public.grenades for delete using (true);
create policy "public read links" on public.links for select using (true);
create policy "public insert links" on public.links for insert with check (true);
create policy "public update links" on public.links for update using (true) with check (true);
create policy "public delete links" on public.links for delete using (true);
