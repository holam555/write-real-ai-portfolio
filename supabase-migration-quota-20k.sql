-- ============================================
-- Migration: Per-user monthly quota (20,000 default)
-- Grandfathers existing paid subscribers at 50,000 forever.
-- Run once in Supabase SQL Editor.
-- ============================================

alter table public.users
  add column if not exists monthly_quota integer not null default 20000;

update public.users
   set monthly_quota = 50000
 where tier = 'paid'
   and stripe_subscription_id is not null;

-- Sanity check:
-- select monthly_quota, count(*) from public.users group by monthly_quota;
