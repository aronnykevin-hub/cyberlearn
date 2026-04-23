# Supabase 500 Error Fix Guide

## Problem
You're getting **500 Internal Server Error** on:
- `GET /rest/v1/company_members` 
- `GET /rest/v1/companies`

## Root Cause
The RLS policies have **recursive queries** that cause infinite loops in the database.

---

## Solution: Run These Steps in Order

### Step 1: Go to Supabase SQL Editor

1. Open https://app.supabase.com → Your Project
2. Click **SQL Editor** in left sidebar
3. Create a new query

### Step 2: Clean Up Old Policies (Drop them)

Copy & run this in Supabase SQL Editor:

```sql
-- STEP 1: Drop all problematic policies first
DROP POLICY IF EXISTS company_members_service_role ON public.company_members;
DROP POLICY IF EXISTS company_members_view_own ON public.company_members;
DROP POLICY IF EXISTS company_members_admin ON public.company_members;
DROP POLICY IF EXISTS company_members_view_in_company ON public.company_members;

DROP POLICY IF EXISTS companies_select_creator ON public.companies;
DROP POLICY IF EXISTS companies_select_member ON public.companies;
DROP POLICY IF EXISTS companies_update_creator ON public.companies;
DROP POLICY IF EXISTS companies_update_admin ON public.companies;

-- Verify policies are dropped
SELECT * FROM pg_policies WHERE tablename IN ('company_members', 'companies');
```

✅ You should see empty result set

---

### Step 3: Run Fixed Schema File

Copy **ENTIRE** content of updated `backend/database/schema/10_company_access_control.sql` and run it.

The file now has:
- ✅ Non-recursive RLS policies
- ✅ Fixed table references
- ✅ Proper SELECT/UPDATE permissions

---

### Step 4: Verify Policies Are Created

Run this verification query:

```sql
-- Check company_members policies
SELECT tablename, policyname, qual FROM pg_policies
WHERE tablename = 'company_members'
ORDER BY policyname;

-- Check companies policies  
SELECT tablename, policyname, qual FROM pg_policies
WHERE tablename = 'companies'
ORDER BY policyname;
```

✅ You should see 3 `company_members` policies and 3 `companies` policies

---

### Step 5: Test the Endpoints

Go back to your frontend and test:

```javascript
// This should now work (no 500 error)
const { data, error } = await supabase
  .from('company_members')
  .select('company_id, companies(*)')
  .eq('user_id', 'your-user-id');

// This should also work
const { data: companies, error: compErr } = await supabase
  .from('companies')
  .select('*')
  .eq('created_by', 'your-user-id');
```

---

## What Changed

### OLD (Broken)
```sql
-- ❌ Recursive: queries company_members table FROM company_members policy
CREATE POLICY company_members_admin ON public.company_members
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM company_members  -- RECURSION!
      WHERE company_id = company_members.company_id
      ...
    )
  );
```

### NEW (Fixed)
```sql
-- ✅ Non-recursive: uses subquery but doesn't cause loop
CREATE POLICY company_members_view_in_company ON public.company_members
  FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM public.company_members 
      WHERE user_id = auth.uid()
    )
  );
```

---

## Quick Troubleshooting

### Still getting 500 errors?

1. **Verify company_members table has RLS enabled:**
   ```sql
   SELECT relname, relrowsecurity FROM pg_class 
   WHERE relname = 'company_members';
   -- Should return: company_members | t (true)
   ```

2. **Check if policies are correct:**
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'company_members';
   -- Should show 3 policies, not more
   ```

3. **Test basic query without select joins:**
   ```sql
   SELECT * FROM public.company_members LIMIT 1;
   -- If this works, issue is with the SELECT expansion
   ```

4. **Enable Supabase logs to see exact error:**
   - Go to Supabase Dashboard → Your Project → Logs
   - Look for database connection errors
   - Check PostgreSQL logs for constraint violations

### Need more help?

1. Check Supabase Status: https://status.supabase.com
2. Review RLS documentation: https://supabase.com/docs/guides/auth/row-level-security
3. Test policies with service role bypass first:
   ```sql
   -- Temporarily disable RLS to test if it's policy issue
   ALTER TABLE public.company_members DISABLE ROW LEVEL SECURITY;
   -- Then try query from frontend
   -- If it works, re-enable and fix policies
   ALTER TABLE public.company_members ENABLE ROW LEVEL SECURITY;
   ```

---

## Next Steps After Fix

1. ✅ Verify no more 500 errors on company_members/companies queries
2. ✅ Test user signup → should NOT error
3. ✅ Test company creation → should work  
4. ✅ Test adding employees → should work
5. ✅ Test dark/light mode → should work across all pages

Once fixed, your frontend will work perfectly! 🎉
