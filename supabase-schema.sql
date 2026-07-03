-- ============================================
-- AI Essay Humanizer — Supabase Database Schema
-- Run this in Supabase SQL Editor (for fresh installs)
-- For existing databases, run supabase-migration-phase2.sql instead
-- ============================================

-- 1. Users table
create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  uses_remaining integer not null default 3,
  email_verified boolean not null default false,
  tier text not null default 'free_trial',
  words_remaining integer not null default 0,
  monthly_quota integer not null default 20000,
  billing_cycle_start date,
  stripe_customer_id text,
  stripe_subscription_id text,
  created_at timestamp with time zone not null default now()
);

-- 2. Style prompts table
create table public.style_prompts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  custom_prompt text not null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

-- 3. Usage logs table
create table public.usage_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  timestamp timestamp with time zone not null default now(),
  words_used integer not null,
  mode text not null check (mode in ('default_style', 'personal_clone', 'style_analysis')),
  input_text text,
  output_text text
);

-- 4. App config table (global settings)
create table public.app_config (
  key text primary key,
  value text not null
);

insert into public.app_config (key, value) values ('free_trial_count', '0');

-- 5. Waitlist table
create table public.waitlist (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  created_at timestamp with time zone not null default now()
);

-- ============================================
-- Row Level Security (RLS)
-- ============================================

alter table public.users enable row level security;
alter table public.style_prompts enable row level security;
alter table public.usage_logs enable row level security;
alter table public.app_config enable row level security;
alter table public.waitlist enable row level security;

-- Users
-- IMPORTANT: No update policy for authenticated users.
-- All user row updates (tier, uses_remaining, words_remaining, etc.)
-- must go through API routes using the admin client (service role),
-- which bypasses RLS entirely. This prevents users from self-promoting
-- their tier or resetting their usage via the browser console.
create policy "Users can read own data"
  on public.users for select
  using (auth.uid() = id);

create policy "Service role can insert users"
  on public.users for insert
  with check (auth.uid() = id);

-- Style prompts
create policy "Users can read own style prompts"
  on public.style_prompts for select
  using (auth.uid() = user_id);

create policy "Users can insert own style prompts"
  on public.style_prompts for insert
  with check (auth.uid() = user_id);

create policy "Users can update own style prompts"
  on public.style_prompts for update
  using (auth.uid() = user_id);

create policy "Users can delete own style prompts"
  on public.style_prompts for delete
  using (auth.uid() = user_id);

-- Usage logs
create policy "Users can read own usage logs"
  on public.usage_logs for select
  using (auth.uid() = user_id);

create policy "Users can insert own usage logs"
  on public.usage_logs for insert
  with check (auth.uid() = user_id);

-- App config (read-only for everyone)
create policy "Anyone can read app_config"
  on public.app_config for select
  using (true);

-- Waitlist (no user-facing policies — admin only via service role)

-- ============================================
-- Trigger: auto-create user row on signup
-- ============================================

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, uses_remaining, email_verified)
  values (
    new.id,
    new.email,
    3,
    coalesce(new.email_confirmed_at is not null, false)
  );

  -- Increment free trial count
  update public.app_config
  set value = (coalesce(value::integer, 0) + 1)::text
  where key = 'free_trial_count';

  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================
-- Trigger: update email_verified when confirmed
-- ============================================

create or replace function public.handle_user_verified()
returns trigger as $$
begin
  if new.email_confirmed_at is not null and old.email_confirmed_at is null then
    update public.users
    set email_verified = true
    where id = new.id;
  end if;
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_verified
  after update on auth.users
  for each row execute function public.handle_user_verified();
