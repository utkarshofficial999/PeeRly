-- Performance Indexes for Browse Page
-- Run this in Supabase SQL Editor to dramatically speed up queries

-- 1. Composite index for active, unsold listings (most common query)
CREATE INDEX IF NOT EXISTS idx_listings_active_sold_created 
ON listings(is_active, is_sold, created_at DESC)
WHERE is_active = true AND is_sold = false;

-- 2. Index for category filtering
CREATE INDEX IF NOT EXISTS idx_listings_category_active 
ON listings(category_id, is_active, is_sold, created_at DESC)
WHERE is_active = true AND is_sold = false;

-- 3. Index for college filtering
CREATE INDEX IF NOT EXISTS idx_listings_college_active 
ON listings(college_id, is_active, is_sold, created_at DESC)
WHERE is_active = true AND is_sold = false;

-- 4. Index for price sorting
CREATE INDEX IF NOT EXISTS idx_listings_price_active 
ON listings(price, is_active, is_sold)
WHERE is_active = true AND is_sold = false;

-- 5. Index for popularity sorting
CREATE INDEX IF NOT EXISTS idx_listings_views_active 
ON listings(views_count DESC, is_active, is_sold)
WHERE is_active = true AND is_sold = false;

-- 6. Index for title search (case-insensitive)
CREATE INDEX IF NOT EXISTS idx_listings_title_search 
ON listings USING gin(to_tsvector('english', title))
WHERE is_active = true AND is_sold = false;

-- 7. Index for condition filtering
CREATE INDEX IF NOT EXISTS idx_listings_condition_active 
ON listings(condition, is_active, is_sold, created_at DESC)
WHERE is_active = true AND is_sold = false;

-- Verify indexes were created
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'listings'
ORDER BY indexname;
