-- RLS Policies for Profiles Table
-- Run this in Supabase SQL Editor

-- Allow users to read their own profile
CREATE POLICY IF NOT EXISTS "allow_read_own_profile" ON profiles
FOR SELECT TO authenticated
USING (auth.uid() = id);

-- Allow users to read public profile data
CREATE POLICY IF NOT EXISTS "allow_read_public_profiles" ON profiles
FOR SELECT TO anon, authenticated
USING (true);

-- Allow users to update their own profile
CREATE POLICY IF NOT EXISTS "allow_update_own_profile" ON profiles
FOR UPDATE TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Allow users to insert their own profile (for signup)
CREATE POLICY IF NOT EXISTS "allow_insert_own_profile" ON profiles
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = id);
