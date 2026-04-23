# CyberLearn Deployment & Troubleshooting Guide

## Issues Fixed ✅

### 1. **RLS Policy Recursion Errors (500 Errors)**
**Symptom:** `500 Internal Server Error` on company_members and companies queries

**Root Cause:** Recursive RLS policies created infinite loops
- OLD: `company_members_admin` policy queried `company_members` table from within `company_members` context
- OLD: `companies_select_creator` had ambiguous table alias references

**Files Fixed:**
- ✅ `backend/database/schema/10_company_access_control.sql` - Rewrote all RLS policies
- ✅ `frontend/src/services/companyService.js` - Fixed `getUserCompanies()` query syntax

**Changes Made:**
1. **Removed recursive policies** - Changed from `EXISTS (SELECT FROM company_members...)` to `IN (SELECT company_id FROM company_members...)`
2. **Split policies into three simpler ones:**
   - `company_members_service_role` - Service role bypass
   - `company_members_view_own` - User sees own records
   - `company_members_view_in_company` - User sees records from companies they're in
3. **Fixed companies table RLS:**
   - `companies_select_creator` - User sees companies they created
   - `companies_select_member` - User sees companies they're members of
   - `companies_update_admin` - Admin can update company

---

## Deployment Steps

### Step 1: Update Supabase Schema ⚙️

1. Go to **Supabase Dashboard** → Your Project → **SQL Editor**
2. Create new query
3. Copy **entire** content of: `backend/database/schema/10_company_access_control.sql`
4. Paste into Supabase SQL Editor
5. Click **Execute**

**Wait for success message before proceeding!**

---

### Step 2: Clean Up Old Migrations (Optional)

If you previously ran problematic versions, run this cleanup:

```sql
-- Remove old problematic policies if they exist
DROP POLICY IF EXISTS company_members_admin ON public.company_members CASCADE;
DROP POLICY IF EXISTS companies_update_creator ON public.companies CASCADE;

-- Verify cleanup
SELECT tablename, policyname FROM pg_policies 
WHERE tablename IN ('company_members', 'companies')
ORDER BY tablename, policyname;
```

---

### Step 3: Verify Deployment

Run this verification in Supabase SQL Editor:

```sql
-- Check company_members table
SELECT 
  column_name, 
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'company_members'
ORDER BY ordinal_position;

-- Check company_members policies
SELECT tablename, policyname FROM pg_policies 
WHERE tablename = 'company_members'
ORDER BY policyname;

-- Check companies policies
SELECT tablename, policyname FROM pg_policies 
WHERE tablename = 'companies'
ORDER BY policyname;

-- Verify functions exist
SELECT proname 
FROM pg_proc 
WHERE pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
AND proname IN (
  'create_company_with_owner',
  'add_user_to_company',
  'assign_user_to_department'
);
```

✅ **Expected Results:**
- `company_members` has 7 columns (id, company_id, user_id, role, added_by, joined_at, and 3 new dept columns)
- 3 `company_members` policies exist
- 3 `companies` policies exist
- 3 functions exist

---

### Step 4: Restart Frontend Services

```bash
# Terminal in project root
npm run dev
```

Clear browser cache:
- **Chrome:** DevTools → Application → Clear Site Data
- **Firefox:** Right-click → Inspect → Storage → Clear All

---

### Step 5: Test Workflows

#### Test 1: New User Signup ✓
```
1. Sign up with new email address
2. Should see: "Create Your Organization" page
3. Should NOT see: Employee dashboard
4. Expected: newUser onboarding screen only
```

#### Test 2: Create Company ✓
```
1. From onboarding, click "Create Organization"
2. Fill form: name, registration number, industry, country, address
3. Expected: See admin CompanyDashboard with 6 services
4. Verify: User role in DB changed from NULL → 'admin'
```

#### Test 3: Add Employee ✓
```
1. From admin dashboard, click "Manage Employees"
2. Enter existing user's email (must have signup before)
3. Add them as 'member'
4. Expected: Employee appears in company members list
```

#### Test 4: Assign to Department ✓
```
1. From admin dashboard, click "Manage Employees"
2. Select employee, choose department
3. Click "Assign"
4. Expected: Employee gets role = 'employee' in DB
5. Switch to employee account
6. Expected: Employee sees EmployeeDashboardLimited (not admin features)
```

#### Test 5: Dark Mode ✓
```
1. Click theme toggle (sun/moon icon) top-right
2. Page should switch to dark/light mode
3. All text should be readable
4. Close tab and reopen
5. Expected: Theme persists (from localStorage)
```

---

## Testing Checklist

### Database Layer ✅
- [ ] Run schema update in Supabase without errors
- [ ] All 3 functions created successfully
- [ ] All policies created (3 for company_members, 3 for companies)
- [ ] No duplicate policies

### Backend Layer ✅
- [ ] Create company RPC call succeeds
- [ ] User added as company owner with role = 'owner'
- [ ] Add user to company RPC call succeeds
- [ ] Assign user to department RPC call succeeds

### Frontend Layer ✅
- [ ] `permissionService.getUserRole()` returns correct role
- [ ] `companyService.getUserCompanies()` shows all companies (owned + member of)
- [ ] `companyService.getCompanyMembers()` lists all members
- [ ] Company creation dialog submits successfully
- [ ] Employee assignment works without errors

### User Experience ✅
- [ ] New user → sees onboarding (not employee dashboard)
- [ ] Company creation → user becomes admin
- [ ] Employee assignment → employee sees limited dashboard
- [ ] Permissions enforced (employee can't see admin buttons)
- [ ] Dark/light mode works everywhere
- [ ] No 500 errors in browser console

---

## Troubleshooting

### Issue: Still Getting 500 Errors

**Cause:** RLS policies not properly updated

**Fix:**
```sql
-- Check if policies are using correct syntax
SELECT 
  tablename, 
  policyname, 
  permissive,
  roles,
  qual
FROM pg_policies 
WHERE tablename = 'company_members';

-- If old recursive policy still exists, drop it
DROP POLICY IF EXISTS company_members_admin ON public.company_members;

-- Re-run the schema file to recreate
```

---

### Issue: "User not found in system" when adding employee

**Cause:** Employee must have signed up first

**Fix:**
1. Have employee sign up first (with email/password or Google)
2. Wait for user_profile to be auto-created (via trigger)
3. Then admin can add them to company

**Verify:**
```sql
-- Check if user exists
SELECT id, email FROM auth.users WHERE email = 'employee@example.com';

-- Check if profile exists
SELECT user_id, role FROM public.user_profiles 
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'employee@example.com');
```

---

### Issue: Employee can see admin features (permission not enforced)

**Cause:** PermissionGuard wrapper missing or permission check incorrect

**Fix:**
1. Check `App.tsx` - all admin routes should be wrapped in `<PermissionGuard permission="canManageEmployees">`
2. Check `permissionService.getUserRole()` returns 'employee' not 'admin'
3. Check `user_profiles.role` in database is set to 'employee' (not 'admin')

---

### Issue: Dark mode not persisting

**Cause:** localStorage not working or ThemeProvider missing

**Fix:**
```javascript
// Verify ThemeContext has localStorage code
const ThemeContext.tsx should have:
useEffect(() => {
  localStorage.setItem('theme', theme);
  document.documentElement.classList.toggle('dark', theme === 'dark');
}, [theme]);

// Clear browser cache and try again
```

---

### Issue: Companies query returns empty for member users

**Cause:** RLS policy not allowing access

**Fix:**
```sql
-- Verify membership record exists
SELECT * FROM company_members 
WHERE user_id = 'user-id' 
AND company_id = 'company-id';

-- Check RLS policy allows it
SELECT * FROM pg_policies 
WHERE tablename = 'company_members' 
AND policyname = 'company_members_view_in_company';

-- Temporarily test with service_role
ALTER TABLE company_members DISABLE ROW LEVEL SECURITY;
-- Try query from frontend
ALTER TABLE company_members ENABLE ROW LEVEL SECURITY;
```

---

## Files Updated Summary

### Database
- ✅ `backend/database/schema/10_company_access_control.sql` - FIXED RLS policies

### Frontend
- ✅ `frontend/src/services/companyService.js` - FIXED `getUserCompanies()` query
- ✅ `frontend/src/services/permissionService.js` - UPDATED role detection (earlier)

### Documentation
- ✅ `SUPABASE_FIX_500_ERRORS.md` - Error troubleshooting
- ✅ `IMPLEMENTATION_GUIDE.md` - Step-by-step setup
- ✅ `DEPLOYMENT_GUIDE.md` - This file

---

## Next Phase Tasks

After deployment and testing passes:

1. **Phase 3: Training Management**
   - Admin creates training modules
   - Admin assigns modules to employees
   - Employees complete training

2. **Phase 4: Phishing Campaigns**
   - Admin launches simulated phishing
   - Track employee interactions
   - Generate reports

3. **Phase 5: Threat Reports & Certificates**
   - Employees submit threat reports
   - Admin responds to reports
   - Auto-issue certificates on training completion

---

## Quick Start

```bash
# 1. Update schema in Supabase (run SQL file)
# 2. Restart frontend
npm run dev

# 3. Test workflows
# Sign up → Create Company → Invite Employee → Assign Department

# 4. Verify all 5 tests pass
# ✅ New user signup
# ✅ Company creation
# ✅ Add employee
# ✅ Assign to department
# ✅ Dark/light mode

# 5. You're ready to go! 🎉
```
