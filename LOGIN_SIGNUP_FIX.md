# Login/Signup Button Issue - Quick Fix

## Problem
- Clicking "Log In" opens dashboard (user is logged in)
- Header shows "Log In" / "Sign Up" instead of profile icon
- "Sign Up" button does nothing

## Root Cause
The AuthContext is failing to fetch the user's profile from the `profiles` table, likely due to missing RLS policies.

## Solution

### Step 1: Add RLS Policies for Profiles (REQUIRED)

Go to **Supabase SQL Editor** and run:

```sql
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
```

### Step 2: Check Browser Console

1. Press **F12** to open DevTools
2. Go to **Console** tab
3. Look for errors like:
   - `Error fetching profile:`
   - `row-level security policy violation`

### Step 3: Test After Adding Policies

1. **Sign out** (reload page if needed)
2. **Sign in again**
3. Header should now show your profile icon

### Step 4: Fix Sign Up Button Links

If "Sign Up" button still doesn't work after adding policies, check:

**Open:** `src/components/layout/Header.tsx`

**Find lines ~197-199:**
```tsx
<Link href="/signup" className="btn-primary py-2.5 px-5">
    Sign Up
</Link>
```

**Verify:**
- ✅ Link points to `/signup` (not `/sign-up`)
- ✅ Signup page exists at `src/app/signup/page.tsx`

## Expected Result After Fix

✅ Header shows profile icon when logged in  
✅ "Log In" button works (shows login page)  
✅ "Sign Up" button works (shows signup page)  
✅ No console errors about profile fetch

## Why This Happened

When you created the RLS policies earlier, you only added policies for `listings`, `categories`, and `colleges`. The `profiles` table also needs RLS policies so the AuthContext can fetch user profile data.

Without these policies:
- `auth.getSession()` returns user ✅
- `fetchProfile()` fails due to RLS ❌
- Header sees `user` but not `profile`, gets confused
- Shows "Log In" instead of profile icon
