-- Profile onboarding fields (run after 004_multi_user.sql)
-- Adds timezone, use_cases, and onboarding_complete to profiles table.

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'Asia/Kolkata';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS use_cases JSONB DEFAULT '[]';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarding_complete BOOLEAN DEFAULT false;
