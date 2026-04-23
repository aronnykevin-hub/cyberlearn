# Phase 2: Quick Start - Implementation Checklist

## ✅ COMPLETED - What I've Created For You

### 1. Database Schema
**File:** `backend/database/schema/10_company_access_control.sql`
- ✅ `company_members` table
- ✅ Enhanced `user_profiles` table
- ✅ `user_training_access` VIEW
- ✅ 3 helper RPC functions
- ✅ All RLS policies

### 2. Services (Backend Logic)
**File:** `frontend/src/services/companyService.js`
- ✅ `companyService` object with 7 methods
- ✅ `accessControlService` object with 3 methods
- ✅ Error handling & validation
- ✅ Toast notifications

### 3. React Components
**File:** `frontend/src/components/CreateCompanyDialog.tsx`
- ✅ Form to create company
- ✅ Validation & loading states
- ✅ Dark/light mode

**File:** `frontend/src/components/CompanyMembersPanel.tsx`
- ✅ Display company members
- ✅ Add users by email (admin only)
- ✅ Change roles (admin only)
- ✅ Remove users (admin only)
- ✅ Search functionality

**File:** `frontend/src/components/TrainingAccessGuard.tsx`
- ✅ Protective wrapper component
- ✅ Shows helpful blocked message
- ✅ Department info display

**File:** `frontend/src/components/AdminUserAssignment.tsx`
- ✅ Admin panel for assignments
- ✅ Search & select users
- ✅ Choose department
- ✅ Summary statistics

### 4. Documentation
- ✅ `PHASE_2_ORGANIZATION_MANAGEMENT.md` - Full guide
- ✅ `PHASE_2_ARCHITECTURE.md` - System design
- ✅ This file - Quick start

---

## 🚀 NEXT STEPS - What You Need To Do

### Step 1: Run Database Schema
```bash
# In Supabase SQL Editor:
# Copy entire content from: backend/database/schema/10_company_access_control.sql
# Paste and execute
# ✓ Verify tables created
# ✓ Verify functions created
```

**Time:** 2 minutes

---

### Step 2: Update App.tsx
Wrap training routes with `TrainingAccessGuard`:

```tsx
// At top of file, add import:
import TrainingAccessGuard from './components/TrainingAccessGuard';

// In your routes, wrap protected features:

// BEFORE:
<Route path="/training" element={<TrainingList />} />

// AFTER:
<Route path="/training" element={
  <TrainingAccessGuard>
    <TrainingList />
  </TrainingAccessGuard>
} />
```

**Apply to:** TrainingList, AdminTraining, AdminReports, ThreatReportForm, MyReports, AdminAlerts

**Time:** 5 minutes

---

### Step 3: Update Settings Component
Add company management section:

```tsx
// Add imports
import CreateCompanyDialog from './components/CreateCompanyDialog';
import CompanyMembersPanel from './components/CompanyMembersPanel';
import { Building2 } from 'lucide-react';

export function Settings() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedCompanyId, setSelectedCompanyId] = useState(null);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Existing theme settings */}

      {/* Company Management - ADD THIS SECTION */}
      <div className="border-t dark:border-slate-700 pt-6">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
          Company Management
        </h3>

        <button
          onClick={() => setIsCreateDialogOpen(true)}
          className="mb-6 inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Building2 className="w-4 h-4" />
          Create Company
        </button>

        <CreateCompanyDialog
          isOpen={isCreateDialogOpen}
          onClose={() => setIsCreateDialogOpen(false)}
          onSuccess={() => {
            // Refresh your company list if you have one
          }}
        />

        {/* Optional: Company selector + members panel */}
        {selectedCompanyId && (
          <CompanyMembersPanel companyId={selectedCompanyId} />
        )}
      </div>
    </div>
  );
}
```

**Time:** 10 minutes

---

### Step 4: Update AdminDashboard.tsx
Add user assignment panel:

```tsx
// Add import
import AdminUserAssignment from './components/AdminUserAssignment';

export function AdminDashboard() {
  const [selectedCompanyId, setSelectedCompanyId] = useState(null);

  return (
    <div className="space-y-6">
      {/* Existing admin features */}

      {/* User Assignment - ADD THIS SECTION */}
      {selectedCompanyId && (
        <div className="border-t dark:border-slate-700 pt-6">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
            Assign Users to Departments
          </h3>
          <AdminUserAssignment companyId={selectedCompanyId} />
        </div>
      )}
    </div>
  );
}
```

**Time:** 5 minutes

---

### Step 5: Test the Workflows

#### Test Workflow 1: Create Company
```
1. Sign in as User A
2. Go to Settings
3. Click "Create Company"
4. Fill in company details
5. Click "Create Company"
✓ Should see success toast
✓ Dialog closes
✓ User A becomes owner
```

#### Test Workflow 2: Add User to Company
```
1. Still logged in as User A
2. Sign up as separate browser tab → User B
3. Back to User A settings
4. In Company Members panel, click "Add User"
5. Enter User B's email
6. Select role: "member"
7. Click "Add User"
✓ Should find User B
✓ User B appears in members list
✓ Status shows "Not assigned"
```

#### Test Workflow 3: Assign to Department
```
1. Switch to admin account (if one exists) or ask admin
2. Go to Admin Dashboard
3. Open "Assign Users to Departments"
4. Search for User B
5. Select department (must exist first)
6. Click "Assign to Department"
✓ User B now shows as "Assigned"
✓ Summary updates
```

#### Test Workflow 4: Access Training
```
1. Sign in as User B
2. Try to click "Training" in sidebar
✓ If NOT assigned: See "Access Restricted" message
✓ If assigned: See training page + department badge
```

**Time:** 15 minutes

---

## 📋 Summary of Changes

| Component | Status | Location |
|-----------|--------|----------|
| Database Schema | ✅ Created | `backend/database/schema/10_company_access_control.sql` |
| Company Service | ✅ Created | `frontend/src/services/companyService.js` |
| CreateCompanyDialog | ✅ Created | `frontend/src/components/CreateCompanyDialog.tsx` |
| CompanyMembersPanel | ✅ Created | `frontend/src/components/CompanyMembersPanel.tsx` |
| TrainingAccessGuard | ✅ Created | `frontend/src/components/TrainingAccessGuard.tsx` |
| AdminUserAssignment | ✅ Created | `frontend/src/components/AdminUserAssignment.tsx` |
| App.tsx | 🟡 Needs Update | Wrap training routes with guard |
| Settings.tsx | 🟡 Needs Update | Add company management section |
| AdminDashboard.tsx | 🟡 Needs Update | Add user assignment section |
| Documentation | ✅ Created | `PHASE_2_*.md` files |

---

## 🎯 What Users Can Do After Implementation

### Regular User (Employee)
- ✅ Sign up with Google/email
- ✅ See "Access Restricted" on training features
- ✅ Go to Settings
- ✅ See if assigned to department
- ✅ Wait for admin to assign them

### User with Company
- ✅ Create their own company
- ✅ See themselves as owner
- ✅ Add other existing CyberLearn users
- ✅ Change member roles
- ✅ Remove members

### Admin/Owner in Company
- ✅ (All above)
- ✅ Go to Admin Dashboard
- ✅ Assign users to departments
- ✅ See assignment status
- ✅ Once assigned, users unlock training

---

## ❓ Common Questions

**Q: How do I create departments?**
A: Departments are created separately (not in this phase). They already exist from earlier schema. Admins select from existing departments when assigning.

**Q: Can users create companies without admin?**
A: Yes! This is a self-service feature. Any user can create their own company.

**Q: What if user email not found?**
A: The system shows error "User not found in CyberLearn system". They must sign up first.

**Q: How do I know if user is admin?**
A: Check `user_profiles.role = 'admin'`. Company admin is tracked separately in `company_members.role`.

**Q: Do I need to update existing companies?**
A: If you have existing companies, you may want to add them to `company_members` table manually so owners can manage them.

**Q: What about permissions for existing users?**
A: Existing users who aren't assigned to departments see "Access Restricted" message. Admin must assign them.

---

## 🛠 Troubleshooting

**Problem:** "User not found in CyberLearn system"
**Solution:** Ensure user exists in `users` table and has email. User must sign up first.

**Problem:** "Only admins can assign departments"
**Solution:** Verify the user doing assignment has `user_profiles.role = 'admin'`

**Problem:** Training features still accessible without assignment
**Solution:** Make sure you wrapped route with `<TrainingAccessGuard>` component

**Problem:** Can't add user to company
**Solution:** Check if you're company owner/admin. Only they can add users.

**Problem:** Component not updating after add/assign
**Solution:** Component should auto-refresh via `await loadMembers()`. If not, clear browser cache.

---

## 📞 Ready to Integrate?

1. Run the SQL schema first
2. Copy services and components
3. Update App.tsx, Settings, AdminDashboard
4. Test workflows 1-4
5. Go live!

**Total implementation time: ~30 minutes**

---

## 📚 Reference Documents

- **Full Guide:** See `PHASE_2_ORGANIZATION_MANAGEMENT.md`
- **Architecture:** See `PHASE_2_ARCHITECTURE.md`
- **Database Queries:** See `PHASE_2_ORGANIZATION_MANAGEMENT.md` → "Database Queries" section
