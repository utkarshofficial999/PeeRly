# Complete RLS Policies Setup Guide

## Problem
"Listing Not Found" error when clicking on items - likely due to missing or incorrect RLS policies.

## Solution: Run ALL These SQL Queries in Supabase

Copy and paste each section into **Supabase SQL Editor** and run them one by one.

---

## 1. Enable RLS on All Tables (if not already enabled)

```sql
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE colleges ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_listings ENABLE ROW LEVEL SECURITY;
```

---

## 2. LISTINGS Table Policies

```sql
-- Allow everyone (including anonymous users) to view active listings
DROP POLICY IF EXISTS "allow_read_active_listings" ON listings;
CREATE POLICY "allow_read_active_listings" ON listings
FOR SELECT TO anon, authenticated
USING (is_active = true AND is_sold = false);

-- Allow users to view their own listings (even if inactive)
DROP POLICY IF EXISTS "allow_read_own_listings" ON listings;
CREATE POLICY "allow_read_own_listings" ON listings
FOR SELECT TO authenticated
USING (seller_id = auth.uid());

-- Allow users to create their own listings
DROP POLICY IF EXISTS "allow_create_own_listings" ON listings;
CREATE POLICY "allow_create_own_listings" ON listings
FOR INSERT TO authenticated
WITH CHECK (seller_id = auth.uid());

-- Allow users to update their own listings
DROP POLICY IF EXISTS "allow_update_own_listings" ON listings;
CREATE POLICY "allow_update_own_listings" ON listings
FOR UPDATE TO authenticated
USING (seller_id = auth.uid())
WITH CHECK (seller_id = auth.uid());

-- Allow users to delete their own listings
DROP POLICY IF EXISTS "allow_delete_own_listings" ON listings;
CREATE POLICY "allow_delete_own_listings" ON listings
FOR DELETE TO authenticated
USING (seller_id = auth.uid());
```

---

## 3. PROFILES Table Policies

```sql
-- Allow users to read their own profile
DROP POLICY IF EXISTS "allow_read_own_profile" ON profiles;
CREATE POLICY "allow_read_own_profile" ON profiles
FOR SELECT TO authenticated
USING (auth.uid() = id);

-- Allow everyone to read public profile data
DROP POLICY IF EXISTS "allow_read_public_profiles" ON profiles;
CREATE POLICY "allow_read_public_profiles" ON profiles
FOR SELECT TO anon, authenticated
USING (true);

-- Allow users to update their own profile
DROP POLICY IF EXISTS "allow_update_own_profile" ON profiles;
CREATE POLICY "allow_update_own_profile" ON profiles
FOR UPDATE TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Allow users to insert their own profile (for signup)
DROP POLICY IF EXISTS "allow_insert_own_profile" ON profiles;
CREATE POLICY "allow_insert_own_profile" ON profiles
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = id);
```

---

## 4. CATEGORIES Table Policies

```sql
-- Allow everyone to read categories
DROP POLICY IF EXISTS "allow_read_categories" ON categories;
CREATE POLICY "allow_read_categories" ON categories
FOR SELECT TO anon, authenticated
USING (true);
```

---

## 5. COLLEGES Table Policies

```sql
-- Allow everyone to read colleges
DROP POLICY IF EXISTS "allow_read_colleges" ON colleges;
CREATE POLICY "allow_read_colleges" ON colleges
FOR SELECT TO anon, authenticated
USING (true);
```

---

## 6. CONVERSATIONS Table Policies

```sql
-- Allow users to view their own conversations
DROP POLICY IF EXISTS "allow_view_own_conversations" ON conversations;
CREATE POLICY "allow_view_own_conversations" ON conversations
FOR SELECT TO authenticated
USING (buyer_id = auth.uid() OR seller_id = auth.uid());

-- Allow users to create conversations as buyer
DROP POLICY IF EXISTS "allow_create_conversations" ON conversations;
CREATE POLICY "allow_create_conversations" ON conversations
FOR INSERT TO authenticated
WITH CHECK (buyer_id = auth.uid());

-- Allow users to update their own conversations
DROP POLICY IF EXISTS "allow_update_own_conversations" ON conversations;
CREATE POLICY "allow_update_own_conversations" ON conversations
FOR UPDATE TO authenticated
USING (buyer_id = auth.uid() OR seller_id = auth.uid())
WITH CHECK (buyer_id = auth.uid() OR seller_id = auth.uid());
```

---

## 7. MESSAGES Table Policies

```sql
-- Allow users to view messages in their conversations
DROP POLICY IF EXISTS "allow_view_own_messages" ON messages;
CREATE POLICY "allow_view_own_messages" ON messages
FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM conversations
        WHERE conversations.id = messages.conversation_id
        AND (conversations.buyer_id = auth.uid() OR conversations.seller_id = auth.uid())
    )
);

-- Allow users to send messages in their conversations
DROP POLICY IF EXISTS "allow_send_messages" ON messages;
CREATE POLICY "allow_send_messages" ON messages
FOR INSERT TO authenticated
WITH CHECK (
    sender_id = auth.uid() AND
    EXISTS (
        SELECT 1 FROM conversations
        WHERE conversations.id = conversation_id
        AND (conversations.buyer_id = auth.uid() OR conversations.seller_id = auth.uid())
    )
);

-- Allow users to update messages in their conversations
DROP POLICY IF EXISTS "allow_update_messages" ON messages;
CREATE POLICY "allow_update_messages" ON messages
FOR UPDATE TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM conversations
        WHERE conversations.id = messages.conversation_id
        AND (conversations.buyer_id = auth.uid() OR conversations.seller_id = auth.uid())
    )
);
```

---

## 8. SAVED_LISTINGS Table Policies

```sql
-- Allow users to view their own saved listings
DROP POLICY IF EXISTS "allow_view_own_saved" ON saved_listings;
CREATE POLICY "allow_view_own_saved" ON saved_listings
FOR SELECT TO authenticated
USING (user_id = auth.uid());

-- Allow users to save listings
DROP POLICY IF EXISTS "allow_create_saved" ON saved_listings;
CREATE POLICY "allow_create_saved" ON saved_listings
FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

-- Allow users to unsave listings
DROP POLICY IF EXISTS "allow_delete_saved" ON saved_listings;
CREATE POLICY "allow_delete_saved" ON saved_listings
FOR DELETE TO authenticated
USING (user_id = auth.uid());
```

---

## 9. Verify Policies Are Created

```sql
-- Check all policies
SELECT 
    tablename,
    policyname,
    cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

---

## After Running All SQL

1. **Refresh your app** in the browser
2. **Click on a listing** from browse page
3. **Should work!** ✅

## Still Not Working?

If you still see "Listing Not Found":

1. **Open browser console** (F12)
2. **Click on a listing**
3. **Share the console logs** that start with 📄 or ❌
4. I'll debug further!
