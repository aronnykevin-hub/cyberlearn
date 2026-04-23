# Supabase RLS 500 Error Fix Guide

## Problem
You're getting **500 Internal Server Error** when:
1. Querying `company_members` with nested `companies` selection
2. Querying `companies` with `created_by` filter
3. Creating a company

## Root Cause
**RLS (Row-Level Security) policy conflicts** - The policies had:
- ❌ Recursive `IN` subqueries causing infinite loops
- ❌ Conflicting policies on the same table
- ❌ Improper policy ordering
- ❌ Missing `service_role` override for RPC functions

## Solution

### Step 1: Re-run Fixed SQL ✅

Copy and run the ENTIRE updated SQL file in Supabase SQL Editor:
**File:** `backend/database/schema/10_company_access_control.sql`

Key fixes in this version:
- ✅ Changed `IN (SELECT...)` to `EXISTS (SELECT...)` - eliminates recursion
- ✅ Simplified RLS policies to use `EXISTS` which is more efficient
- ✅ Added `companies_service_role` policy so RPC functions work
- ✅ Added `companies_insert_admin` policy for company creation
- ✅ Updated functions to set roles correctly (admin on company creation, employee on dept assignment)

**Steps to run:**
1. Go to https://app.supabase.com
2. Log in to your CyberLearn project
3. Click "SQL Editor" in left sidebar
4. Click "New Query"
5. Copy entire content of `backend/database/schema/10_company_access_control.sql`
6. Paste into SQL editor
7. Click "Run" button
8. Wait for "Success" message

### Step 2: Verify RLS Setup

After running the SQL, verify everything is set up correctly. Run these verification queries in the same SQL Editor:

```sql
-- 1. Check RLS is enabled
SELECT tablename, rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename IN ('company_members', 'companies')
AND schemaname = 'public';
-- Expected: Both should show TRUE for rls_enabled

-- 2. Count RLS policies
SELECT tablename, COUNT(*) as policy_count
FROM pg_policies
WHERE tablename IN ('company_members', 'companies')
AND schemaname = 'public'
GROUP BY tablename;
-- Expected: company_members: 3 policies, companies: 4-5 policies

-- 3. List all policies
SELECT policyname, tablename, cmd
FROM pg_policies
WHERE tablename IN ('company_members', 'companies')
AND schemaname = 'public'
ORDER BY tablename, policyname;
```

### Step 3: Test the Flow

After verification, test in your frontend:

**Test 1: Create Company**
```
1. Sign in as a new user (not yet in company_members)
2. Click "Create Organization"
3. Fill in company details
4. Click "Create"
5. Expected: Company created, you become admin, see CompanyDashboard
6. Check console: No 500 errors
```

**Test 2: Query Companies**
```
Frontend should successfully fetch:
- GET companies?select=*&created_by=eq.<user_id> ✅ (your companies)
- GET company_members?select=company_id,companies(*)&user_id=eq.<user_id> ✅ (your memberships)
```

### Step 4: Check Browser Console

If you still see errors, open browser DevTools:
- Press `F12` → Console tab
- Look for error messages with `"code"` field
- Common codes:
  - `"PGRST116"` = Policy violation
  - `"42501"` = Permission denied
  - `"23502"` = NULL constraint violation

### Step 5: Clear Cache and Refresh

If you already tested and now making changes:
```
1. Clear browser cache: Ctrl+Shift+Delete
2. Or: DevTools → Application → Clear Site Data
3. Hard refresh: Ctrl+F5
4. Try again
```

---

## Understanding the Fix

### Old RLS Policy (Broken ❌)
```sql
CREATE POLICY companies_select_member ON public.companies
  FOR SELECT
  USING (
    id IN (
      SELECT company_id FROM public.company_members
      WHERE user_id = auth.uid()
    )
  );
```
**Problem:** Uses `IN` with subquery that selects from potentially many rows

### New RLS Policy (Fixed ✅)
```sql
CREATE POLICY companies_select_members ON public.companies
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.company_members
      WHERE company_id = companies.id
      AND user_id = auth.uid()
    )
  );
```
**Solution:** Uses `EXISTS` with table alias, much more efficient

### Why EXISTS is Better
- ✅ Stops searching after finding first match
- ✅ Doesn't require building entire result set
- ✅ Avoids potential recursion in Supabase RLS engine
- ✅ Better database query planning

---

## Troubleshooting Checklist

| Issue | Solution |
|-------|----------|
| Still getting 500 errors | 1. Re-run the SQL file completely<br>2. Run verification queries<br>3. Check for typos in table names |
| "Permission denied" error | Check RLS policies are in correct order:<br>1. service_role (allows all)<br>2. creator rule (for created_by)<br>3. members rule (for company_members)<br>4. admin/insert rules |
| Nested `companies(*)` in query fails | Ensure `companies` table has RLS enabled<br>and all 4-5 policies are created |
| Frontend still can't create company | 1. Verify create_company_with_owner() function exists<br>2. Check it sets role = 'admin'<br>3. Check it creates company_member record |
| Users not seeing their companies | 1. Check user is in company_members table<br>2. Run: `SELECT * FROM company_members WHERE user_id = 'YOUR_UUID'`<br>3. If empty, company creation didn't complete |

---

## SQL File Contents Summary

The fixed SQL creates:

### Tables
- ✅ `company_members` - Tracks user membership in companies

### Columns Added to user_profiles
- ✅ `department_id` - Which department user assigned to
- ✅ `is_department_assigned` - Boolean flag
- ✅ `assigned_at` - When assigned
- ✅ `assigned_by` - Who assigned them

### Views
- ✅ `user_training_access` - Check if user has training access

### Functions
- ✅ `create_company_with_owner()` - Creates company + sets owner role to admin
- ✅ `add_user_to_company()` - Adds existing user to company
- ✅ `assign_user_to_department()` - Assigns user to dept + sets role to employee

### RLS Policies

**On company_members table:**
1. `company_members_service_role` - RPC functions can access
2. `company_members_view_own` - Users see their own membership
3. `company_members_view_in_company` - Users see other members in same company

**On companies table:**
1. `companies_service_role` - RPC functions can access
2. `companies_select_creator` - Users see companies they created
3. `companies_select_members` - Users see companies they're members of
4. `companies_update_admin` - Admins/owners can update
5. `companies_insert_admin` - Admins can create companies

---

## Next Steps

After fixing:
1. ✅ New user signs up → sees "Create Organization"
2. ✅ Creates company → becomes admin
3. ✅ Admin can add users from existing accounts
4. ✅ Admin can assign users to departments
5. ✅ Assigned users see limited dashboard

---

## Getting Help

If errors persist:

1. **Check Supabase Status:** https://status.supabase.com/
2. **Run verification queries** above and share results
3. **Check function execution:**
   ```sql
   SELECT create_company_with_owner(
     'Test Company',
     'REG123',
     'Technology',
     'USA',
     '123 Main St',
     'YOUR_USER_UUID'
   );
   ```
4. **Check RLS by temporarily disabling:**
   ```sql
   ALTER TABLE companies DISABLE ROW LEVEL SECURITY;
   -- Test if works - if yes, RLS is the issue
   ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
   ```
