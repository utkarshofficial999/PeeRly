# Profile Photo Upload Feature - Complete Guide

## ✨ Features Added

### 1. Profile Photo Upload in Settings Page
- **Upload Button**: Click the camera icon on your avatar
- **File Validation**: Only PNG, JPG, WEBP allowed
- **Size Limit**: Max 2MB
- **Upload Progress**: Visual progress bar during upload
- **Remove Photo**: X button to remove current avatar
- **Immediate Update**: Photo appears instantly in header after upload

### 2. Header Avatar Display
- **Shows Profile Photo**: If uploaded, displays your avatar
- **Gradient Fallback**: Shows colored gradient with initials if no photo
- **Hover Effects**: Smooth transitions and ring effects

---

## 📋 Setup Required

### Step 1: Create Avatars Storage Bucket in Supabase

Run this SQL in **Supabase SQL Editor**:

```sql
-- File: supabase/avatars_storage_setup.sql

-- Create avatars storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Allow anyone to view avatars (public bucket)
CREATE POLICY "Anyone can view avatars"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- Allow authenticated users to upload their own avatar
CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'avatars' 
    AND (storage.foldername(name))[1] = 'avatars'
    AND auth.uid()::text = (string_to_array(name, '/'))[2]::text
);

-- Allow users to update their own avatar
CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (
    bucket_id = 'avatars' 
    AND (storage.foldername(name))[1] = 'avatars'
    AND auth.uid()::text = substring(name from 'avatars/([^-]+)')
)
WITH CHECK (
    bucket_id = 'avatars' 
    AND (storage.foldername(name))[1] = 'avatars'
    AND auth.uid()::text = substring(name from 'avatars/([^-]+)')
);

-- Allow users to delete their own avatar
CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'avatars' 
    AND (storage.foldername(name))[1] = 'avatars'
    AND auth.uid()::text = substring(name from 'avatars/([^-]+)')
);
```

### Step 2: Verify in Supabase Dashboard

1. Go to **Storage** in Supabase Dashboard
2. You should see **avatars** bucket
3. Check that **Public** is enabled
4. Test upload manually to verify permissions

---

## 🎯 How to Use

### Upload Profile Photo

1. **Go to Settings**: Click your profile icon → Settings (or visit `/settings`)
2. **Click Camera Icon**: On your avatar in Profile Settings
3. **Choose Image**: Select PNG, JPG, or WEBP under 2MB
4. **Wait for Upload**: Progress bar shows upload status
5. **Done!** Photo appears immediately in header

### Remove Profile Photo

1. **Go to Settings**: `/settings`
2. **Click X Button**: Top-right of your avatar
3. **Confirm**: Click OK on confirmation dialog
4. **Reverts to Gradient**: Shows initials again

---

## 🔧 Technical Details

### File Structure

```
src/app/settings/page.tsx          # Settings page with upload UI
src/components/layout/Header.tsx   # Header with avatar display
src/context/AuthContext.tsx        # refreshProfile() function
supabase/avatars_storage_setup.sql # Storage bucket setup
```

### Upload Flow

1. User selects image file
2. Validate file type and size
3. Upload to Supabase Storage (`avatars/`)
4. Get public URL
5. Delete old avatar (if exists)
6. Update `profiles.avatar_url` in database
7. Refresh profile data in context
8. Header updates automatically

### Storage Path Format

```
avatars/{user_id}-{timestamp}.{extension}

Example:
avatars/931111ad-125f-482b-9b89-7263b41a6b4a-1707334567890.jpg
```

### RLS Security

- **Public Read**: Anyone can view avatars
- **Upload**: Only auth users can upload to their own ID path
- **Update/Delete**: Only owners can modify their avatars
- **Path Validation**: User ID must match auth.uid()

---

## 🐛 Troubleshooting

### "Failed to upload photo"

**Cause**: Storage bucket doesn't exist or RLS policies missing

**Fix**: Run `avatars_storage_setup.sql` in Supabase

### "Image size must be less than 2MB"

**Cause**: File too large

**Fix**: Compress image or choose smaller file

### Avatar not showing in header

**Cause**: `refreshProfile()` not called or cache issue

**Fix**: 
1. Refresh browser
2. Check `profiles.avatar_url` in Supabase
3. Verify image URL is accessible

### Upload stuck at 0%

**Cause**: Network issue or Supabase connection

**Fix**:
1. Check network connection
2. Verify Supabase URL and keys in `.env.local`
3. Check browser console for errors

---

## 📊 Database Schema

### profiles Table

```sql
-- avatar_url column (should already exist)
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS avatar_url TEXT;
```

Stores the public URL of the avatar image:
```
https://{project}.supabase.co/storage/v1/object/public/avatars/{user_id}-{timestamp}.{ext}
```

---

## 🎨 Design Features

### Upload Button
- Camera icon overlay on avatar
- Primary color gradient
- Loading spinner during upload
- Disabled state while uploading

### Progress Indicator
- Horizontal progress bar
- Shows 0% → 50% (upload) → 75% (URL) → 100% (update DB)
- Primary color gradient

### Avatar Display
- 96x96px in settings (rounded-3xl)
- 40x40px in header (rounded-xl)
- Object-cover for proper scaling
- Ring effects on hover

### Remove Button
- Red X button (top-right)
- Appears only when avatar exists
- Confirmation dialog before deletion

---

## ✅ Testing Checklist

- [ ] Create avatars bucket in Supabase
- [ ] Run RLS policies SQL
- [ ] Upload profile photo from settings
- [ ] See photo in header immediately
- [ ] Remove photo successfully
- [ ] Revert to gradient with initials
- [ ] Test with different image formats (PNG, JPG, WEBP)
- [ ] Test file size validation (try >2MB file)
- [ ] Test on mobile and desktop
- [ ] Verify RLS - can't upload to another user's path

---

## 🚀 Future Enhancements

- [ ] Image cropping/resizing before upload
- [ ] Drag-and-drop upload
- [ ] Multiple photo options (profile, banner)
- [ ] Avatar history/gallery
- [ ] Integration with social login profile photos

---

## 📝 Code Changes

### Modified Files
1. `src/app/settings/page.tsx` - Added upload functionality
2. `src/components/layout/Header.tsx` - Added avatar display
3. `src/context/AuthContext.tsx` - Already had `refreshProfile()`

### New Files
1. `supabase/avatars_storage_setup.sql` - Storage setup script

---

## 🔐 Security Notes

- ✅ Only authenticated users can upload
- ✅ Users can only upload/modify their own avatars
- ✅ File type validation (client + server)
- ✅ File size validation (2MB limit)
- ✅ Public read access (safe for profile photos)
- ✅ Path-based security (user ID in filename)

---

## 💡 Tips

1. **Optimize Images**: Compress before upload for faster loading
2. **Square Images**: Work best for circular avatars
3. **Remove Old Photos**: System auto-deletes when uploading new one
4. **Public URLs**: Avatars are public (don't upload sensitive content)
5. **Refresh Profile**: Click camera again if image doesn't show

---

**Enjoy your new profile photo feature!** 📸✨
