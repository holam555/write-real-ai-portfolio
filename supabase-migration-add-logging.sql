-- ============================================
-- Migration: Add input/output logging to usage_logs
-- Run this in Supabase SQL Editor
-- ============================================

-- Add new columns
alter table public.usage_logs add column if not exists input_text text;
alter table public.usage_logs add column if not exists output_text text;

-- Update mode check constraint to also allow 'style_analysis'
alter table public.usage_logs drop constraint if exists usage_logs_mode_check;
alter table public.usage_logs add constraint usage_logs_mode_check
  check (mode in ('default_style', 'personal_clone', 'style_analysis'));
