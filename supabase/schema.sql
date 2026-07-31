create type public.user_role as enum ('admin', 'volunteer');
create type public.request_status as enum ('unverified', 'unassigned', 'assigned', 'in_progress', 'completed');
create type public.source_type as enum ('anonymous', 'admin', 'x_ai');
create type public.staff_role as enum ('super_admin', 'municipal_admin', 'coordinator', 'dispatcher', 'viewer');
create schema if not exists private;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  email text,
  role public.user_role not null default 'volunteer',
  municipality_id text,
  approved_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  organization_type text not null default 'municipality',
  municipality_code text,
  created_at timestamptz not null default now()
);

create table public.staff_memberships (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role public.staff_role not null default 'viewer',
  title text,
  is_active boolean not null default true,
  invited_by uuid references public.profiles(id),
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  unique (organization_id, user_id)
);

create table public.staff_invitations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  email text not null,
  role public.staff_role not null,
  title text,
  invited_by uuid not null references public.profiles(id),
  expires_at timestamptz not null,
  accepted_at timestamptz,
  created_at timestamptz not null default now(),
  unique (organization_id, email)
);

create table public.audit_logs (
  id bigint generated always as identity primary key,
  organization_id uuid references public.organizations(id),
  actor_user_id uuid not null references public.profiles(id),
  action text not null,
  resource_type text not null,
  resource_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.support_requests (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id),
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
  organization_id uuid references public.organizations(id),
  request_id uuid not null references public.support_requests(id) on delete cascade,
  volunteer_id uuid not null references public.profiles(id),
  assigned_by uuid not null references public.profiles(id),
  assigned_at timestamptz not null default now(),
  completed_at timestamptz
);

alter table public.profiles enable row level security;
alter table public.organizations enable row level security;
alter table public.staff_memberships enable row level security;
alter table public.staff_invitations enable row level security;
alter table public.audit_logs enable row level security;
alter table public.support_requests enable row level security;
alter table public.assignments enable row level security;
alter table private.request_details enable row level security;

create or replace function public.current_staff_organization_ids()
returns setof uuid
language sql
stable
security definer
set search_path = ''
as $$
  select organization_id
  from public.staff_memberships
  where user_id = auth.uid() and is_active;
$$;

create policy "authenticated users read public requests"
  on public.support_requests for select to authenticated using (true);
create policy "volunteers read own profile"
  on public.profiles for select to authenticated using (auth.uid() = id);
create policy "staff read memberships in own organization"
  on public.staff_memberships for select to authenticated using (
    user_id = auth.uid() or organization_id in (select public.current_staff_organization_ids())
  );
create policy "staff read own organizations"
  on public.organizations for select to authenticated using (
    id in (select public.current_staff_organization_ids())
  );
create policy "administrators read organization audit logs"
  on public.audit_logs for select to authenticated using (
    organization_id in (
      select organization_id from public.staff_memberships
      where user_id = auth.uid() and is_active
        and role in ('super_admin', 'municipal_admin')
    )
  );
create policy "volunteers read own assignments"
  on public.assignments for select to authenticated using (auth.uid() = volunteer_id);

revoke all on schema private from anon, authenticated;
revoke all on private.request_details from anon, authenticated;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)),
    new.email
  )
  on conflict (id) do update set
    display_name = excluded.display_name,
    email = excluded.email;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert or update of email, raw_user_meta_data on auth.users
  for each row execute procedure public.handle_new_user();

-- private.request_details is intentionally excluded from browser grants.
-- Anonymous intake must call a rate-limited server/Edge Function which splits
-- public location data from encrypted contact and exact-location data.
