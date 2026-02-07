# Quick Fix Script for Remaining Pages

## Pages That Need Fixing

The following pages still have unstable Supabase clients that could cause flickering:

1. ✅ **browse/page.tsx** - FIXED
2. ❌ **saved/page.tsx** - Line 16
3. ❌ **page.tsx** (home) - Line 96
4. ❌ **my-listings/page.tsx** - Line 16
5. ❌ **messages/page.tsx** - Line 42
6. ❌ **listing/[id]/page.tsx** - Line 18
7. ❌ **dashboard/page.tsx** - Line 27
8. ❌ **create/page.tsx** - Line 32

## Required Changes for Each Page

### Step 1: Add useMemo import
```tsx
// Change this:
import { useState, useEffect } from 'react'

// To this:
import { useState, useEffect, useMemo } from 'react'
```

### Step 2: Memoize Supabase client
```tsx
// Change this:
const supabase = createClient()

// To this:
const supabase = useMemo(() => createClient(), [])
```

### Step 3: Check useEffect dependencies
If `supabase` is in any dependency array, verify it's actually needed.
Most of the time, with memoization, it's stable and won't cause issues.

## Priority Order

**High Priority (User-facing data fetching):**
1. messages/page.tsx - Real-time chat could flicker
2. dashboard/page.tsx - User stats could flash
3. listing/[id]/page.tsx - Single listing view
4. saved/page.tsx - Saved items list

**Medium Priority (Less frequent updates):**
5. my-listings/page.tsx - User's own listings
6. page.tsx (home) - Homepage recent listings

**Low Priority (Form pages):**
7. create/page.tsx - Creation form (less affected)

## Automated Fix Command

Run this to fix all at once:
```bash
# This would require a script, but manual fixes are safer for now
```

## Testing Checklist After Fixes

- [ ] No console errors in development
- [ ] No console errors in production build
- [ ] Data loads once per filter change
- [ ] No flickering when navigating between pages
- [ ] React DevTools shows stable component tree
- [ ] Network tab shows no duplicate requests
