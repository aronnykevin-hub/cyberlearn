# CyberLearn - Quick Fix Reference 🚀

## Your Problem
```
❌ 500 Error when creating company
❌ company_members query failing  
❌ companies query failing
```

## The Fix (3 Steps - 10 minutes)

### 1️⃣ Copy SQL File
```
File: backend/database/schema/10_company_access_control.sql
Select ALL (Ctrl+A) and Copy (Ctrl+C)
```

### 2️⃣ Run in Supabase
```
1. Go to: https://app.supabase.com
2. Click: SQL Editor (left sidebar)
3. Click: New Query
4. Paste: (Ctrl+V) - the entire SQL file
5. Click: Run button
6. Wait: Green checkmark ✅
```

### 3️⃣ Test Frontend
```
1. Hard refresh: Ctrl+F5
2. Sign out → back in
3. Create company
4. Expected: Works! No 500 errors ✅
```

---

## What Was Fixed

| Issue | Fix |
|-------|-----|
| RLS policy recursion | Changed `IN (SELECT...)` to `EXISTS (SELECT...)` |
| Missing service_role | Added policy so RPC functions work |
| Conflicting policies | Cleaned up and reorganized all policies |
| Role assignment bugs | Functions now set roles correctly |

---

## Files Changed

✅ `backend/database/schema/10_company_access_control.sql` - Main SQL file
✅ `frontend/src/services/permissionService.js` - Role detection
✅ `frontend/src/services/companyService.js` - Company queries (no changes needed)

---

## Verification Query

After running SQL, check everything exists:

```sql
SELECT tablename, rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename IN ('company_members', 'companies')
AND schemaname = 'public';
```

**Expected:**
```
tablename          | rls_enabled
company_members    | true
companies          | true
```

---

## If Still Getting Errors

### Error Code in Console?
```
PGRST116 = RLS policy issue → Run SQL again
42501 = Permission denied → Check policies exist
23503 = Foreign key error → Check users exist
```

### Quick Debug
```sql
-- Check policies exist
SELECT COUNT(*) FROM pg_policies 
WHERE tablename IN ('company_members', 'companies');
-- Expected: 7-8 policies

-- Test RPC function
SELECT create_company_with_owner(
  'Test', 'REG123', 'Tech', 'USA', '123 St',
  'YOUR_USER_UUID'::uuid
);
```

---

## Role System (After Fix)

| User Type | Role | Can Do |
|-----------|------|--------|
| Just Signed Up | `NULL` (newUser) | Create company |
| Company Owner | `admin` | Everything |
| Assigned Employee | `employee` | View training, report threats, see own data |

---

## Common Issues

### "Still showing 500"
→ SQL might not have run completely  
→ Try running it again step by step

### "No error in console"
→ Open DevTools (F12) → Console tab  
→ Try creating company again  
→ Look for error object

### "Can't find error message"
→ DevTools → Network tab  
→ Try creating company  
→ Click failed request (red)  
→ Click "Response" tab

---

## Success = ✅

- ✅ No 500 errors
- ✅ Company created
- ✅ See CompanyDashboard
- ✅ 6 services visible
- ✅ Dark/light mode works

---

## Files to Know

- **Main fix:** `backend/database/schema/10_company_access_control.sql`
- **Detailed guide:** `SUPABASE_RLS_FIX_GUIDE.md`
- **Full action plan:** `FIX_ACTION_PLAN.md`
- **Permission system:** `frontend/src/services/permissionService.js`
- **Company queries:** `frontend/src/services/companyService.js`

---

## Timing

⏱️ **SQL Run:** 1-2 minutes  
⏱️ **Verification:** 1 minute  
⏱️ **Frontend Test:** 3-5 minutes  
⏱️ **Total:** ~10 minutes

---

**Ready?** Copy the SQL, run it in Supabase, refresh frontend, test! 🚀
