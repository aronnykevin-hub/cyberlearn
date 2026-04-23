# CyberLearn - Supabase 500 Error Fix Action Plan

## ⚠️ Your Issue

**Error:** 500 Internal Server Error when creating a company
- ❌ `GET /company_members?select=company_id,companies(*)&user_id=eq.<uuid>` → 500
- ❌ `GET /companies?select=*&created_by=eq.<uuid>` → 500

**Cause:** Row-Level Security (RLS) policies had recursive queries and conflicts

**Status:** ✅ FIXED in updated SQL file

---

## 🔧 How to Fix (3 Steps)

### Step 1: Run Updated SQL (5 minutes)

The SQL file has been fixed. Here's how to run it:

**Go to Supabase:**
1. Open https://app.supabase.com
2. Select your **CyberLearn** project
3. Click **SQL Editor** (left sidebar)
4. Click **New Query** button

**Copy and Run:**
1. Open: `backend/database/schema/10_company_access_control.sql` in your editor
2. Select ALL content (Ctrl+A)
3. Copy (Ctrl+C)
4. Paste into Supabase SQL Editor
5. Click **Run** button
6. Wait for green checkmark ✅ "Success"

**What this does:**
- ✅ Drops broken RLS policies
- ✅ Creates new fixed policies using `EXISTS` instead of `IN`
- ✅ Adds `service_role` policy so RPC functions work
- ✅ Updates functions to set roles correctly
- ✅ Enables RLS on all necessary tables

### Step 2: Verify Setup (2 minutes)

Run this verification query in the same SQL Editor to confirm everything is correct:

```sql
-- Check 1: RLS is enabled
SELECT tablename, rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename IN ('company_members', 'companies')
AND schemaname = 'public';
-- Expected: TRUE for both
```

✅ Both should show `rls_enabled = true`

### Step 3: Test in Frontend (5 minutes)

1. **Refresh your app** (Ctrl+F5 hard refresh)
2. **Clear browser cache** (DevTools → Application → Clear Site Data)
3. **Sign out and back in**
4. **Try creating a company**

**Expected result:**
- ✅ Form submits successfully
- ✅ No 500 errors in console
- ✅ You see CompanyDashboard with 6 services
- ✅ Dark/light mode works

---

## 🔍 If You Still Get Errors

### Check 1: Verify SQL Ran Completely

Run this to see all RLS policies:

```sql
SELECT policyname, tablename, cmd
FROM pg_policies
WHERE tablename IN ('company_members', 'companies')
AND schemaname = 'public'
ORDER BY tablename;
```

**Expected: About 7-8 policies total**
- company_members: 3 policies
- companies: 4-5 policies

If fewer than this, the SQL didn't run completely. Try again.

### Check 2: Test RPC Function Directly

Run this in SQL Editor to test the company creation function:

```sql
-- Get your UUID first
SELECT id FROM auth.users WHERE email = 'YOUR_EMAIL_HERE' LIMIT 1;

-- Then run this (replace YOUR_UUID)
SELECT create_company_with_owner(
  'Test Company',
  'REG123',
  'Technology',
  'USA',
  '123 Main St',
  'YOUR_UUID'::uuid
);
```

If this works, the function is fine. If it errors, check the error message.

### Check 3: Check Browser Console

Open DevTools (F12) → Console tab

Look for error objects with these fields:
```
{
  "status": 500,
  "code": "PGRST116",  // OR another code
  "hint": "...",
  "message": "..."
}
```

Common codes:
- `PGRST116` = RLS policy violation
- `42501` = Permission denied
- `23503` = Foreign key violation
- `23502` = NOT NULL constraint violation

**Share this error code if you need help**

### Check 4: Network Tab

Open DevTools (F12) → Network tab

1. Try to create company again
2. Look for failed request (red color)
3. Click on it
4. Click "Response" tab
5. You'll see the detailed error message

**Example:**
```json
{
  "code": "PGRST116",
  "message": "The query attempted to select from 'companies' and it returned no rows",
  "details": "Permission denied: policy 'companies_select_creator' denies..."
}
```

---

## 📊 Database Structure After Fix

```
Table: users (auth.users)
├─ id (UUID) - Primary key
├─ email
└─ created_at

Table: user_profiles
├─ user_id (FK to users)
├─ role ('admin' | 'employee' | NULL for newUser)
├─ department_id (FK to departments)
├─ is_department_assigned (boolean)
├─ assigned_at (timestamp)
└─ assigned_by (UUID)

Table: companies
├─ id (UUID)
├─ name
├─ created_by (FK to users)
├─ registration_number
├─ industry
├─ country
├─ address
└─ created_at

Table: company_members  [NEW]
├─ id (UUID)
├─ company_id (FK to companies)
├─ user_id (FK to users)
├─ role ('owner' | 'admin' | 'member')
├─ joined_at
└─ added_by

Table: departments
├─ id
├─ company_id (FK to companies)
└─ name

RLS Policies (NEW):
├─ company_members: 3 policies (service_role, view_own, view_in_company)
└─ companies: 4 policies (service_role, select_creator, select_members, update_admin, insert_admin)
```

---

## 🔑 Key RLS Policies Explained

### Policy 1: Service Role (Allows RPC)
```sql
CREATE POLICY companies_service_role ON public.companies
  FOR ALL
  USING (auth.role() = 'service_role')
```
**Purpose:** RPC functions (create_company_with_owner, etc.) run as `service_role`, so they need full access

### Policy 2: Creator Can View
```sql
CREATE POLICY companies_select_creator ON public.companies
  FOR SELECT
  USING (created_by = auth.uid());
```
**Purpose:** Users can see companies they created

### Policy 3: Members Can View
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
**Purpose:** Users can see companies they're members of

**Why `EXISTS` instead of `IN`?**
- ✅ `EXISTS`: Stops searching after finding first match
- ❌ `IN`: Tries to build entire list first (can cause recursion issues)

---

## 🎯 Next Steps After Fix

Once the 500 errors are gone:

1. **Test User Flows:**
   - [ ] New user signs up → sees "Create Your Organization"
   - [ ] Creates company → becomes admin
   - [ ] Sees CompanyDashboard with 6 services
   - [ ] Can add employees from existing accounts

2. **Test Admin Features:**
   - [ ] Admin can see all employees
   - [ ] Admin can assign employees to departments
   - [ ] Assigned employees see EmployeeDashboardLimited

3. **Test Permission System:**
   - [ ] Employee can only see their training
   - [ ] Employee can submit threat reports
   - [ ] Employee cannot see other employees' data
   - [ ] Employee cannot access admin features

4. **Test Dark Mode:**
   - [ ] Toggle works on all pages
   - [ ] Theme persists on refresh
   - [ ] All text is readable in both modes

---

## 📞 Support

If you still have issues after following these steps:

1. **Run verification queries** above and share results
2. **Check the error code** from browser console
3. **Share the RLS policies** list from SQL Editor
4. **Try temporarily disabling RLS** to isolate the issue:
   ```sql
   ALTER TABLE companies DISABLE ROW LEVEL SECURITY;
   -- Try creating company - if works, RLS is the issue
   ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
   ```

---

## ✅ Checklist

- [ ] Opened Supabase SQL Editor
- [ ] Ran entire `10_company_access_control.sql` file
- [ ] Saw "Success" checkmark
- [ ] Ran verification query and confirmed RLS policies exist
- [ ] Hard refreshed frontend (Ctrl+F5)
- [ ] Cleared browser cache
- [ ] Tried creating company
- [ ] No 500 errors in console ✅

**If all checkmarks are done and still getting errors → Please share the error code from DevTools → Console**
