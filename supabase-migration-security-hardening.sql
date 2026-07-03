-- ============================================
-- Security Hardening — addresses Supabase Security Advisor warnings
-- Run once in Supabase SQL Editor (Production).
-- After running, re-check Advisor — the listed warnings should clear.
-- ============================================

-- =====================================================================
-- 1. Revoke EXECUTE on SECURITY DEFINER functions from public roles.
--    These are internal / trigger / admin functions and must NOT be
--    callable via PostgREST (/rest/v1/rpc/<name>) by anon or signed-in
--    users. Triggers continue to fire — EXECUTE grants only affect
--    direct invocation, not trigger invocation.
--    Service role still has implicit EXECUTE, so server-side admin
--    calls keep working.
--
--    NOTE: ping_keepalive is INTENTIONALLY left callable by anon. It
--    is invoked daily by .github/workflows/keep-supabase-alive.yml
--    using the SUPABASE_ANON_KEY. The function is a harmless heartbeat
--    (no-op write) used solely to prevent Supabase free-tier auto-pause.
--    Revoking anon EXECUTE here would break the keepalive cron.
-- =====================================================================

revoke execute on function public.deduct_usage(uuid, integer)        from anon, authenticated, public;
revoke execute on function public.deduct_usage(uuid, integer, text)  from anon, authenticated, public;
revoke execute on function public.handle_new_user()                  from anon, authenticated, public;
revoke execute on function public.handle_user_verified()             from anon, authenticated, public;
revoke execute on function public.rls_auto_enable()                  from anon, authenticated, public;

-- =====================================================================
-- 2. Pin search_path on SECURITY DEFINER functions to prevent
--    search-path hijack attacks.
-- =====================================================================

alter function public.deduct_usage(uuid, integer)        set search_path = public, pg_temp;
alter function public.deduct_usage(uuid, integer, text)  set search_path = public, pg_temp;
alter function public.handle_new_user()                  set search_path = public, pg_temp;
alter function public.handle_user_verified()             set search_path = public, pg_temp;

-- =====================================================================
-- 3. Tighten RLS on public.detection_results
--    Old policy: WITH CHECK (true) for authenticated — let any signed-in
--    user insert rows attributed to ANY user_id.
--    New policies:
--      - authenticated user: may insert rows where user_id = auth.uid()
--      - anon user (landing page guests): may insert rows where user_id IS NULL
-- =====================================================================

drop policy if exists "Allow insert for authenticated users" on public.detection_results;

create policy "Authenticated users insert own detection results"
  on public.detection_results
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Anon guests insert anonymous detection results"
  on public.detection_results
  for insert
  to anon
  with check (user_id is null);

-- =====================================================================
-- NOTE on the remaining 'waitlist' WITH CHECK (true) warning:
-- This is INTENTIONAL — anyone (including not-signed-in visitors)
-- must be able to add their email to the waitlist. Spam is mitigated
-- by app-level rate limiting in /api/waitlist. No change needed.
-- =====================================================================

-- Sanity check after running:
--   select n.nspname, p.proname, p.prosecdef, pg_get_function_identity_arguments(p.oid)
--     from pg_proc p
--     join pg_namespace n on n.oid = p.pronamespace
--    where n.nspname = 'public' and p.prosecdef;
--   -- For each: verify EXECUTE has been revoked from anon/authenticated.
