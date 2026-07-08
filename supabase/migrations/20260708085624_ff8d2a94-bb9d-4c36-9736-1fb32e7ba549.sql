create table public.billing_emails (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  kind text not null,
  dedupe_key text not null,
  sent_at timestamptz not null default now(),
  unique (kind, dedupe_key)
);
create index idx_billing_emails_user_id on public.billing_emails(user_id);
grant all on public.billing_emails to service_role;
alter table public.billing_emails enable row level security;