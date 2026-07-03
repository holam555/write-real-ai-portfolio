-- ============================================
-- AI Essay Humanizer — Security Migration
-- Run this in Supabase SQL Editor IMMEDIATELY
-- ============================================

-- 🔴 CRITICAL FIX: Remove permissive update policy on users table.
-- The old policy allowed authenticated users to update ANY column on their own row,
-- meaning a user could self-promote to paid tier or reset their uses via browser console.
-- All user updates now go through the admin client (service role) in API routes.
DROP POLICY IF EXISTS "Users can update own data" ON public.users;

-- Verify: the remaining policies on users should be:
--   "Users can read own data" (select)
--   "Service role can insert users" (insert)
-- The service role (used by API routes) bypasses RLS entirely, so no update policy is needed.
