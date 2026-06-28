
create extension if not exists vector;

alter table public.situations
  add column if not exists embedding vector(1536),
  add column if not exists is_seed boolean not null default false,
  add column if not exists human_response_at timestamptz;

create index if not exists situations_embedding_idx
  on public.situations using hnsw (embedding vector_cosine_ops);

create index if not exists situations_public_pillar_idx
  on public.situations (pillar, created_at desc)
  where is_public = true and is_seed = false and crisis_flag = false and deleted_at is null;

create table if not exists public.pillar_status (
  pillar text primary key,
  opened_at timestamptz,
  real_story_floor int not null default 25,
  sla_target_minutes int not null default 30,
  updated_at timestamptz not null default now()
);

grant select on public.pillar_status to anon, authenticated;
grant all on public.pillar_status to service_role;
alter table public.pillar_status enable row level security;
create policy "pillar_status readable by everyone"
  on public.pillar_status for select using (true);
create policy "pillar_status admin write"
  on public.pillar_status for all
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

insert into public.pillar_status (pillar, opened_at)
values ('relationships', now())
on conflict (pillar) do nothing;
insert into public.pillar_status (pillar)
values ('marriage'), ('family'), ('career')
on conflict (pillar) do nothing;

create or replace function public.match_situations(
  query_embedding vector(1536),
  match_pillar text default null,
  match_count int default 10,
  similarity_floor float default 0.78
)
returns table (
  id uuid,
  pillar text,
  clean_text text,
  created_at timestamptz,
  similarity float
)
language sql stable
security definer
set search_path = public
as $$
  select s.id,
         s.pillar::text,
         s.clean_text,
         s.created_at,
         1 - (s.embedding <=> query_embedding) as similarity
  from public.situations s
  where s.embedding is not null
    and s.is_public = true
    and s.is_seed = false
    and s.crisis_flag = false
    and s.deleted_at is null
    and (match_pillar is null or s.pillar::text = match_pillar)
    and 1 - (s.embedding <=> query_embedding) >= similarity_floor
  order by s.embedding <=> query_embedding
  limit match_count;
$$;

create or replace function public.touch_pillar_status()
returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end; $$;

drop trigger if exists pillar_status_touch on public.pillar_status;
create trigger pillar_status_touch
  before update on public.pillar_status
  for each row execute function public.touch_pillar_status();
