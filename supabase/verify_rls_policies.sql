-- Verify RLS Policies - Run this to check if all policies exist
-- Run in Supabase SQL Editor

-- Check RLS is enabled on tables
SELECT 
    schemaname,
    tablename,
    rowsecurity as "RLS Enabled"
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('listings', 'profiles', 'conversations', 'messages', 'categories', 'colleges')
ORDER BY tablename;

-- Check existing policies for listings
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'listings'
ORDER BY tablename, policyname;

-- Check existing policies for profiles
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'profiles'
ORDER BY tablename, policyname;

-- Check existing policies for conversations
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'conversations'
ORDER BY tablename, policyname;

-- Check existing policies for messages
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'messages'
ORDER BY tablename, policyname;
