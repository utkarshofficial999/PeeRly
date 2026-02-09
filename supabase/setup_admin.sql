-- =============================================
-- Admin Dashboard & Verification System Setup
-- Run this in your Supabase SQL Editor
-- =============================================

-- 1. Add ID Verification fields to profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS id_card_url TEXT,
ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'approved', 'rejected')),
ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- 2. Update listings for approval flow
ALTER TABLE listings 
ALTER COLUMN is_active SET DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected')),
ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- 3. Create Audit Logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  admin_id UUID REFERENCES profiles(id),
  action TEXT NOT NULL,
  target_type TEXT NOT NULL, -- 'user', 'listing'
  target_id UUID NOT NULL,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Storage bucket for ID Cards (Private)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('id_cards', 'id_cards', FALSE)
ON CONFLICT (id) DO NOTHING;

-- 5. RLS for Audit Logs
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Only super admin can view audit logs" ON audit_logs
  FOR SELECT USING (auth.jwt() ->> 'email' = 'utkarsh@abes.ac.in');

-- 6. RLS for ID Cards Storage
-- Note: Replace with actual bucket policies if needed
CREATE POLICY "Only admin and owner can view ID card" ON storage.objects
FOR SELECT USING (
  bucket_id = 'id_cards' AND (
    auth.jwt() ->> 'email' = 'utkarsh@abes.ac.in' OR 
    (storage.foldername(name))[1] = auth.uid()::text
  )
);

CREATE POLICY "Authenticated users can upload ID cards" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'id_cards' 
  AND auth.role() = 'authenticated'
);

-- 7. Update existing listings to 'approved' so they don't disappear
UPDATE listings SET approval_status = 'approved', is_active = TRUE WHERE approval_status IS NULL;
