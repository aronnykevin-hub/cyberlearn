# CyberLearn Implementation Steps - Role-Based Access Control

## Current State FIXED ✅

**Problem:** Users were automatically assigned as 'employee' on signup
**Solution:** 
- New users now start with role = NULL (newUser status)
- Users become 'admin' only when they create a company
- Users become 'employee' only when admin assigns them to department

---

## Implementation Steps

### Step 1: Run Database Migrations (IN ORDER)

**IMPORTANT:** Run these SQL files in Supabase SQL Editor in this exact order:

#### File 1: `backend/database/schema/10_company_access_control.sql`
```sql
-- Copy entire content and run in Supabase SQL Editor
-- This creates company_members table and helper functions
```

✅ Creates:
- `company_members` table
- `user_training_access` VIEW
- Helper functions: create_company_with_owner, add_user_to_company, assign_user_to_department

---

#### File 2: `backend/database/11_fix_user_role_assignment.sql` 
```sql
-- Copy entire content and run in Supabase SQL Editor
-- This fixes the signup trigger and role assignment
```

✅ Creates:
- NEW `handle_new_user()` function that does NOT auto-assign role
- NEW trigger on auth.users
- UPDATED functions to set role when company created or department assigned

---

### Step 2: Restart Backend Services

After running SQL migrations, restart your services:
```bash
# If using local development
npm run dev

# Or restart your backend processes
```

This ensures all new signups use the updated trigger.

---

### Step 3: Test User Flows

#### Flow 1: New User Signup
```
1. User signs up with email/Google
2. User profile created with role = NULL
3. User sees: "Create Your Organization" page
   ✓ newUserOnboarding shows only "Create Organization" button
   ✓ All other options locked (Step 2, Step 3)
4. User clicks "Create Organization"
5. Role automatically set to 'admin'
6. User sees: CompanyDashboard with 6 services
   ✓ Can manage employees
   ✓ Can create training
   ✓ Can launch phishing
   ✓ Can view all reports
   ✓ Can see all certificates
```

#### Flow 2: Admin Invites Employee
```
1. Admin adds existing employee by email
2. Employee found in system (must have signup before)
3. Employee profile exists but with role = NULL
4. Admin assigns employee to department
5. Employee role set to 'employee'
6. Employee can now:
   ✓ View assigned training
   ✓ Submit threat reports
   ✓ View own reports
   ✓ See own certificates
   ✗ Cannot see other employees' data
   ✗ Cannot access admin features
```

#### Flow 3: Dark/Light Mode
```
1. All pages support dark/light toggle
2. Theme persists in localStorage
3. Automatic detection of system preference (optional)
4. All components respect theme setting
```

---

## Role Matrix (After Fix)

| Action | New User | Admin | Employee |
|--------|----------|-------|----------|
| Create Company | ✅ YES | ✅ YES | ❌ NO |
| View Dashboard | ❌ NO | ✅ YES (CompanyDashboard) | ✅ YES (EmployeeDashboardLimited) |
| Manage Employees | ❌ NO | ✅ YES | ❌ NO |
| Create Training | ❌ NO | ✅ YES | ❌ NO |
| View Training | ❌ NO | ✅ YES | ✅ YES (assigned only) |
| Launch Phishing | ❌ NO | ✅ YES | ❌ NO |
| View All Reports | ❌ NO | ✅ YES | ❌ NO |
| Submit Threat Report | ❌ NO | ✅ YES | ✅ YES |
| View Own Reports | ❌ NO | ✅ YES | ✅ YES |
| View Others' Reports | ❌ NO | ✅ YES | ❌ NO |
| Issue Certificates | ❌ NO | ✅ YES | ❌ NO |
| View All Certificates | ❌ NO | ✅ YES | ❌ NO |
| View Own Certificates | ❌ NO | ✅ YES | ✅ YES |
| Assign Department | ❌ NO | ✅ YES | ❌ NO |

---

## File Changes Summary

### Database Files
- ✅ `backend/database/schema/10_company_access_control.sql` - ALREADY CREATED
- ✅ `backend/database/11_fix_user_role_assignment.sql` - NEW (fixes role trigger)

### Frontend Files  
- ✅ `frontend/src/services/permissionService.js` - UPDATED (proper role detection)
- ✅ `frontend/src/services/companyService.js` - ALREADY CREATED
- ✅ `frontend/src/components/NewUserOnboarding.tsx` - ALREADY CREATED
- ✅ `frontend/src/components/CompanyDashboard.tsx` - ALREADY CREATED
- ✅ `frontend/src/components/EmployeeDashboardLimited.tsx` - ALREADY CREATED
- ✅ `frontend/src/components/DashboardRouter.tsx` - ALREADY CREATED
- ✅ `frontend/src/components/PermissionGuard.tsx` - ALREADY CREATED
- ✅ `frontend/src/components/CreateCompanyDialog.tsx` - ALREADY CREATED
- ✅ `frontend/src/components/CompanyMembersPanel.tsx` - ALREADY CREATED
- ✅ `frontend/src/components/CompanyOnboardingFlow.tsx` - ALREADY CREATED
- ✅ `frontend/src/components/CompanySelector.tsx` - ALREADY CREATED
- ✅ `frontend/src/App.tsx` - UPDATED (uses DashboardRouter)

---

## Verification Checklist

After running migrations and restarting:

### New User Signup Test
- [ ] Sign up as brand new user
- [ ] See "Create Your Organization" page (NOT employee dashboard)
- [ ] "Create Organization" button is active
- [ ] Steps 2 & 3 are greyed out with locks
- [ ] Click "Create Organization"
- [ ] See admin CompanyDashboard after creation
- [ ] Can see "Add Employees" option
- [ ] Can see all 6 services

### Employee Assignment Test
- [ ] Sign up as User B (different account)
- [ ] Verify User B sees onboarding (newUser)
- [ ] Switch to Admin account
- [ ] Add User B to company by email
- [ ] Assign User B to a department
- [ ] Switch to User B account
- [ ] User B now sees EmployeeDashboardLimited
- [ ] User B can see department name
- [ ] User B can see training but NOT admin controls
- [ ] User B cannot see other employees' reports

### Dark Mode Test
- [ ] Toggle dark/light mode button
- [ ] All pages update theme immediately
- [ ] Theme persists on page reload
- [ ] All text is readable in both modes
- [ ] No broken styling

---

## Troubleshooting

### "I still see employee dashboard instead of onboarding"

**Solution:** 
1. Run the fix SQL file: `11_fix_user_role_assignment.sql`
2. Clear browser cache
3. Sign out and sign back in
4. Check database: `SELECT user_id, role FROM user_profiles LIMIT 5;`
   - New users should have role = NULL (not 'employee')

### "Dark mode doesn't persist"

**Solution:**
1. Check ThemeContext.tsx has localStorage code:
   ```typescript
   useEffect(() => {
     localStorage.setItem('theme', theme);
     document.documentElement.classList.toggle('dark', theme === 'dark');
   }, [theme]);
   ```
2. Clear browser storage: DevTools → Application → Clear Site Data
3. Refresh page

### "User can access features they shouldn't"

**Solution:**
1. Check PermissionGuard wrapper is around routes
2. Verify roles in database: 
   ```sql
   SELECT up.user_id, up.role, up.is_department_assigned, d.name
   FROM user_profiles up
   LEFT JOIN departments d ON up.department_id = d.id
   WHERE up.user_id = 'user-uuid';
   ```
3. Check companyService.js has correct RLS policies

---

## Support

All components have:
- ✅ Dark/light mode support
- ✅ Loading states
- ✅ Error handling with Sonner toasts
- ✅ Responsive design (mobile, tablet, desktop)
- ✅ Accessible ARIA labels
- ✅ TypeScript strict checking

---

## Quick Start Command (After Setup)

```bash
# 1. Run migrations in Supabase
# Copy 10_company_access_control.sql → Supabase SQL Editor → Execute
# Copy 11_fix_user_role_assignment.sql → Supabase SQL Editor → Execute

# 2. Restart frontend
npm run dev

# 3. Test
# Sign up new user → See "Create Organization" → Success! ✅
```
