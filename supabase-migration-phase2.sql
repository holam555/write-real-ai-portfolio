-- ============================================
-- AI Essay Humanizer — Phase 2 Migration
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. Update default uses_remaining from 2 to 3 for new users
alter table public.users alter column uses_remaining set default 3;

-- 2. Add new columns to users table for Stripe/paid tier
alter table public.users
  add column if not exists tier text not null default 'free_trial',
  add column if not exists words_remaining integer not null default 0,
  add column if not exists billing_cycle_start date,
  add column if not exists stripe_customer_id text,
  add column if not exists stripe_subscription_id text;

-- 3. Create app_config table for global settings
create table if not exists public.app_config (
  key text primary key,
  value text not null
);

-- Insert initial free trial counter
insert into public.app_config (key, value)
values ('free_trial_count', '0')
on conflict (key) do nothing;

-- RLS for app_config (read-only for everyone, write via service role)
alter table public.app_config enable row level security;

create policy "Anyone can read app_config"
  on public.app_config for select
  using (true);

-- 4. Create waitlist table
create table if not exists public.waitlist (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  created_at timestamp with time zone not null default now()
);

-- RLS for waitlist (insert allowed for anyone, no read access for users)
alter table public.waitlist enable row level security;

-- No select policy for regular users — admin only via service role

-- 5. Update the handle_new_user trigger to use 3 uses and increment trial count
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

-- Note: The trigger on_auth_user_created already exists from Phase 1
-- and will automatically use the updated function.
