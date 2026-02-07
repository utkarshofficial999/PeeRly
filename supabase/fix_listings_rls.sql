-- FIXED RLS Policies for Listings
-- The previous policies might have been too restrictive
-- Run this to replace them with better ones

-- Drop all existing policies first
DROP POLICY IF EXISTS "allow_read_active_listings" ON listings;
DROP POLICY IF EXISTS "allow_read_own_listings" ON listings;
DROP POLICY IF EXISTS "Enable read access for all users" ON listings;

-- Create a single, comprehensive SELECT policy
-- This allows:
-- 1. Anonymous users to see active, unsold listings
-- 2. Authenticated users to see active, unsold listings
-- 3. Authenticated users to see ALL their own listings (even if inactive/sold)
CREATE POLICY "listings_select_policy" ON listings
FOR SELECT
USING (
    (is_active = true AND is_sold = false)  -- Anyone can see active listings
    OR 
    (auth.uid() = seller_id)  -- Users can see their own listings
);

-- Verify the policy was created
SELECT policyname, cmd FROM pg_policies 
WHERE tablename = 'listings' AND schemaname = 'public';
