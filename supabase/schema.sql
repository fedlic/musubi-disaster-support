create type public.user_role as enum ('admin', 'volunteer');
create type public.request_status as enum ('unverified', 'unassigned', 'assigned', 'in_progress', 'completed');
create type public.source_type as enum ('anonymous', 'admin', 'x_ai');
create schema if not exists private;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  role public.user_role not null default 'volunteer',
  municipality_id text,
  approved_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.support_requests (
  id uuid primary key default gen_random_uuid(),
  public_code text unique not null,
  source public.source_type not null default 'anonymous',
  title text not null,
  public_area text not null,
  public_lat double precision not null,
  public_lng double precision not null,
  category text not null,
  people_count integer not null default 1 check (people_count >= 0),
  public_detail text not null,
  priority text not null default 'normal',
  status public.request_status not null default 'unverified',
  is_verified boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table private.request_details (
  request_id uuid primary key references public.support_requests(id) on delete cascade,
  exact_address text,
  exact_lat double precision,
  exact_lng double precision,
  requester_name text,
  contact_encrypted text,
  sensitive_notes text,
  consent_at timestamptz not null
);

create table public.assignments (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.support_requests(id) on delete cascade,
  volunteer_id uuid not null references public.profiles(id),
  assigned_by uuid not null references public.profiles(id),
  assigned_at timestamptz not null default now(),
  completed_at timestamptz
);

alter table public.profiles enable row level security;
alter table public.support_requests enable row level security;
alter table public.assignments enable row level security;
alter table private.request_details enable row level security;

create policy "authenticated users read public requests"
  on public.support_requests for select to authenticated using (true);
create policy "volunteers read own profile"
  on public.profiles for select to authenticated using (auth.uid() = id);
create policy "volunteers read own assignments"
  on public.assignments for select to authenticated using (auth.uid() = volunteer_id);

revoke all on schema private from anon, authenticated;
revoke all on private.request_details from anon, authenticated;

-- private.request_details is intentionally excluded from browser grants.
-- Anonymous intake must call a rate-limited server/Edge Function which splits
-- public location data from encrypted contact and exact-location data.
