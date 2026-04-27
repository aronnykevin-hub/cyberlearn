# Quick Redeploy Guide - Database Function Fix

## 🚀 Redeploy Your Database Schema

### Option 1: Using Supabase CLI (Recommended)

```bash
# From your project root
cd backend

# Push the changes to Supabase
supabase db push

# Or if you need to reset and rebuild
supabase db reset
```

### Option 2: Manual - Supabase Dashboard

1. Go to [Supabase Dashboard](https://supabase.com)
2. Select your project
3. Go to **SQL Editor**
4. Create a new query and run these commands:

```sql
-- Drop the old function definitions (to avoid conflicts)
DROP FUNCTION IF EXISTS public.create_company_with_owner(TEXT, TEXT, TEXT, TEXT, TEXT) CASCADE;

-- Then execute 15_team_member_user_search_and_default_departments.sql
-- Copy the entire file content and paste it into the SQL editor
```

Then run the full schema migration by executing all files in this order:
- `backend/database/schema/15_team_member_user_search_and_default_departments.sql`

### Option 3: Using Your Setup Script

```bash
cd backend
npm run db:init
```

## ✅ Verification

After deployment, test by creating a company:

```bash
# Open your browser console or run a test
# Should see success with departments created
```

Expected behavior:
- ✅ No PGRST202 error
- ✅ Company created with owner role set to 'admin'
- ✅ Default departments created automatically
- ✅ Company members record created

## 🔍 Troubleshooting

**Still getting PGRST202 error?**

1. Clear your browser cache (Ctrl+Shift+Delete)
2. Hard refresh the page (Ctrl+Shift+R or Cmd+Shift+R)
3. Check Supabase dashboard that the function exists with correct signature:
   ```sql
   -- Run in Supabase SQL Editor
   SELECT proname, pronargs, pg_get_functiondef(oid)
   FROM pg_proc
   WHERE proname = 'create_company_with_owner';
   ```

**Still have issues?**

Check that your Supabase project has these functions:
- `create_company_with_owner` - with 6 parameters ✅
- `ensure_company_default_departments` - helper function ✅
- `resolve_auth_display_name` - helper function ✅

## 📋 What Changed

| File | Change |
|------|--------|
| 10_company_access_control.sql | Removed outdated function definition |
| 11_fix_user_role_assignment.sql | Removed outdated function definition |
| 14_company_profile_alignment.sql | Removed outdated function definition |
| 15_team_member_user_search_and_default_departments.sql | ✅ Contains the CORRECT version |

The fix ensures that only ONE correct version of the function exists in the database schema.
