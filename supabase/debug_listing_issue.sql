-- Debug Listing Issue
-- Run this in Supabase SQL Editor to check if the listing exists

-- Check if the listing exists and its status
SELECT 
    id,
    title,
    is_active,
    is_sold,
    seller_id,
    created_at
FROM listings
WHERE id = '5f2d8a49-0324-43b1-8707-aec6028911fd';

-- If listing exists but is inactive/sold, this query will show it
-- If nothing is returned, the listing doesn't exist

-- Check ALL listings to see if any exist
SELECT 
    COUNT(*) as total_listings,
    COUNT(*) FILTER (WHERE is_active = true) as active_listings,
    COUNT(*) FILTER (WHERE is_sold = true) as sold_listings
FROM listings;

-- Check RLS policies on listings table
SELECT 
    policyname,
    cmd,
    qual
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'listings';
