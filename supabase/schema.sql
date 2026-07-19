create extension if not exists pgcrypto;

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  hospital_id text not null,
  hospital_name text not null,
  surgery_name text not null,
  booking_type text not null check (booking_type in ('consultation', 'surgery')),
  slot_date text,
  slot_time text,
  estimated_cost numeric,
  patient_name text,
  status text not null default 'confirmed',
  created_at timestamptz not null default now()
);

-- Run this if the table already exists:
-- alter table public.bookings add column if not exists patient_name text;

alter table public.bookings enable row level security;

drop policy if exists "Users can view their own bookings" on public.bookings;
create policy "Users can view their own bookings"
on public.bookings
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can insert their own bookings" on public.bookings;
create policy "Users can insert their own bookings"
on public.bookings
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can cancel their own bookings" on public.bookings;
create policy "Users can cancel their own bookings"
on public.bookings
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create table if not exists public.hospitals (
  id text primary key,
  name text not null,
  city text not null,
  address text not null,
  type text not null check (type in ('multi-specialty', 'standard')),
  rating numeric not null,
  image text not null
);

create table if not exists public.surgeries (
  name text primary key,
  typical_min_price numeric not null,
  typical_max_price numeric not null
);

create table if not exists public.insurance_plans (
  id text primary key,
  insurer_name text not null,
  plan_name text not null,
  coverage_cap numeric not null,
  premium_per_year numeric not null,
  covered_surgeries text[] not null default '{}',
  network_hospital_ids text[] not null default '{}'
);

create table if not exists public.hospital_surgeries (
  hospital_id text not null references public.hospitals (id) on delete cascade,
  surgery_name text not null references public.surgeries (name) on delete cascade,
  min_price numeric not null,
  max_price numeric not null,
  primary key (hospital_id, surgery_name)
);

create table if not exists public.hospital_slots (
  id bigint generated always as identity primary key,
  hospital_id text not null references public.hospitals (id) on delete cascade,
  slot_date text not null,
  slot_time text not null,
  is_available boolean not null default true,
  unique (hospital_id, slot_date, slot_time)
);

create index if not exists hospital_slots_hospital_id_idx on public.hospital_slots (hospital_id);
create index if not exists hospitals_city_idx on public.hospitals (city);
create index if not exists hospital_surgeries_surgery_name_idx on public.hospital_surgeries (surgery_name);

grant select on public.hospitals to anon, authenticated;
grant select on public.surgeries to anon, authenticated;
grant select on public.insurance_plans to anon, authenticated;
grant select on public.hospital_surgeries to anon, authenticated;
grant select on public.hospital_slots to anon, authenticated;
grant update on public.hospital_slots to authenticated;