-- =============================================
-- ID Verification Security Refinements
-- =============================================

-- 1. Tighten Listing Creation Policy
-- Only allow users with 'approved' verification status to post listings
DROP POLICY IF EXISTS "Users can create listings" ON listings;
CREATE POLICY "Only approved students can create listings" ON listings
FOR INSERT WITH CHECK (
  auth.uid() = seller_id AND 
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND verification_status = 'approved'
  )
);

-- 1b. Admin Listing Access
-- Allow super admin to see all listings (including pending/inactive)
DROP POLICY IF EXISTS "Super admin can view all listings" ON listings;
CREATE POLICY "Super admin can view all listings" ON listings
FOR SELECT USING (
  auth.jwt() ->> 'email' = 'utkarsh@abes.ac.in'
);

-- Allow super admin to update any listing (to approve/reject)
DROP POLICY IF EXISTS "Super admin can update all listings" ON listings;
CREATE POLICY "Super admin can update all listings" ON listings
FOR UPDATE USING (
  auth.jwt() ->> 'email' = 'utkarsh@abes.ac.in'
);

-- 2. Allow Super Admin to view all ID Cards regardless of folder name
-- (Updating the previous policy from setup_admin.sql)
DROP POLICY IF EXISTS "Only admin and owner can view ID card" ON storage.objects;
CREATE POLICY "Super admin and owners can access ID cards" ON storage.objects
FOR SELECT USING (
  bucket_id = 'id_cards' AND (
    auth.jwt() ->> 'email' = 'utkarsh@abes.ac.in' OR 
    (storage.foldername(name))[1] = auth.uid()::text
  )
);

-- 3. Ensure profiles are only updateable by owners, but admin can update verification status
-- NOTE: In a real system, you'd use a service role or a specific admin function.
-- For now, we'll allow the admin email to update verification fields.
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile or admin can verify" ON profiles
FOR UPDATE USING (
  auth.uid() = id OR 
  auth.jwt() ->> 'email' = 'utkarsh@abes.ac.in'
);

-- 4. Initial categories if missing (optional safety check)
INSERT INTO categories (name, slug, icon)
VALUES 
  ('Textbooks', 'textbooks', '📚'),
  ('Electronics', 'electronics', '💻'),
  ('Cycles', 'cycles', '🚲'),
  ('Furniture', 'furniture', '🪑'),
  ('Clothing', 'clothing', '👕'),
  ('Sports', 'sports', '⚽'),
  ('Music', 'music', '🎸'),
  ('Other', 'other', '📦')
ON CONFLICT (slug) DO NOTHING;
