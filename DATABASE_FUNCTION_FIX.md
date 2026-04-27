# Database Function Signature Mismatch - FIXED

## Problem

**Error Message:**
```
PGRST202: Could not find the function public.create_company_with_owner(p_address, p_country, p_departments, p_industry, p_name, p_registration_number)
```

## Root Cause

The `create_company_with_owner` function was defined in **multiple files** with **different signatures**:

| File | Parameters | Issue |
|------|-----------|-------|
| **10_company_access_control.sql** | 5 params (no p_departments) | ❌ Outdated |
| **11_fix_user_role_assignment.sql** | 5 params (no p_departments) | ❌ Outdated |
| **14_company_profile_alignment.sql** | 5 params (no p_departments) | ❌ Outdated |
| **15_team_member_user_search_and_default_departments.sql** | 6 params (with p_departments) | ✅ Correct |

### The Conflict

- Frontend (`companyService.js`) was trying to call the function **WITH** `p_departments` parameter
- Database schema cache had the **OLDER** version **WITHOUT** `p_departments`
- PostgREST couldn't match the function call to any defined function signature

## Solution Applied

✅ **Removed duplicate/outdated function definitions** from files 10, 11, and 14

✅ **Removed outdated GRANT statements** that were granting permissions to the wrong signature

✅ **Kept the correct version** in file 15 which:
- Accepts the `p_departments` parameter as `TEXT[]`
- Calls `ensure_company_default_departments()` to create default departments for the company
- Has the correct GRANT with proper signature: `TEXT, TEXT, TEXT, TEXT, TEXT, TEXT[]`

## Files Modified

1. **10_company_access_control.sql** - Removed `create_company_with_owner` function and outdated GRANT
2. **11_fix_user_role_assignment.sql** - Removed `create_company_with_owner` function and outdated GRANT
3. **14_company_profile_alignment.sql** - Removed `create_company_with_owner` function and outdated GRANT

## Next Steps

### ⚠️ IMPORTANT: Redeploy Database Schema

You **MUST** redeploy your database schema for the changes to take effect:

```bash
# From your project root
cd backend

# Option 1: If using Supabase CLI
supabase db push

# Option 2: If running initialization script
npm run db:init

# Option 3: Manual - Copy SQL files in order
# Go to Supabase dashboard > SQL Editor
# Execute these files in order:
# 1. schema/*.sql (00_clean.sql through 15_team_member_user_search_and_default_departments.sql)
# 2. database/*.sql (in order)
```

### Verify the Fix

After redeploying, test company creation:

```javascript
// Should now work without PGRST202 error
const result = await companyService.createCompany({
  name: 'Test Company',
  industry: 'Technology',
  country: 'USA',
  address: '123 Main St',
  departments: ['IT', 'HR', 'Finance']
});
```

## Why This Happened

PostgreSQL `CREATE OR REPLACE FUNCTION` allows changing function **bodies** but not **signatures** (parameters) when using the same function name. The multiple files had conflicting signatures, causing PostgREST's schema cache to be confused about which version was authoritative.

**Best Practice:** Define each function in only ONE location to avoid this type of conflict.

## Current Correct Definition

**File:** `backend/database/schema/15_team_member_user_search_and_default_departments.sql` (lines 202-316)

```sql
CREATE OR REPLACE FUNCTION public.create_company_with_owner(
  p_name TEXT,
  p_registration_number TEXT,
  p_industry TEXT,
  p_country TEXT,
  p_address TEXT,
  p_departments TEXT[] DEFAULT NULL  -- ✅ KEY PARAMETER
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
...
```

**GRANT Statement:**
```sql
GRANT EXECUTE ON FUNCTION public.create_company_with_owner(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT[]) TO authenticated, service_role;
```
