-- Quick Database Health Check
-- Run this in Supabase SQL Editor to diagnose issues

-- 1. Check if tables exist and have data
SELECT 
    'categories' as table_name,
    COUNT(*) as row_count
FROM categories
UNION ALL
SELECT 
    'colleges' as table_name,
    COUNT(*) as row_count
FROM colleges
UNION ALL
SELECT 
    'listings' as table_name,
    COUNT(*) as row_count
FROM listings
UNION ALL
SELECT 
    'profiles' as table_name,
    COUNT(*) as row_count
FROM profiles;

-- 2. Check active listings
SELECT COUNT(*) as active_listings_count
FROM listings
WHERE is_active = true AND is_sold = false;

-- 3. If counts are 0, add sample data:

-- Add categories (if empty)
INSERT INTO categories (name, slug, icon, description)
VALUES
    ('Textbooks', 'textbooks', 'BookOpen', 'Academic books and study materials'),
    ('Electronics', 'electronics', 'Laptop', 'Gadgets, laptops, and electronic devices'),
    ('Cycles', 'cycles', 'Bike', 'Bicycles and cycling accessories'),
    ('Furniture', 'furniture', 'Sofa', 'Dorm and apartment furniture'),
    ('Clothing', 'clothing', 'Shirt', 'Clothes and fashion items'),
    ('Other', 'other', 'MoreHorizontal', 'Miscellaneous items')
ON CONFLICT (slug) DO NOTHING;

-- Add a test college (if empty)
INSERT INTO colleges (name, slug, domain, location, is_active)
VALUES ('Test University', 'test-university', 'test.edu', 'Test City', true)
ON CONFLICT (slug) DO NOTHING;

-- 4. Check RLS policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename IN ('listings', 'categories', 'colleges', 'profiles')
ORDER BY tablename, policyname;

-- 5. Test a simple query (what the browse page does)
SELECT 
    l.id,
    l.title,
    l.price,
    l.condition,
    l.images,
    l.created_at,
    l.views_count,
    p.full_name as seller_name,
    c.name as college_name
FROM listings l
LEFT JOIN profiles p ON l.seller_id = p.id
LEFT JOIN colleges c ON l.college_id = c.id
WHERE l.is_active = true 
  AND l.is_sold = false
ORDER BY l.created_at DESC
LIMIT 5;

-- 6. If the above query returns 0 rows, you need to create test listings
-- First, you need a test user profile. Check if you have any:
SELECT id, email, full_name FROM profiles LIMIT 5;

-- If no profiles, you need to sign up a user first through the app
-- Then come back and create test listings
