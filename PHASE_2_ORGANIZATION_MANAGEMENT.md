# Phase 2: Organization & Access Control Implementation Guide

## Overview

This implementation enables a smart permission model where:
1. **Any user** can sign up and create an account
2. **Users can create organizations/companies** if they want
3. **Users can invite existing CyberLearn users** to their organization
4. **Admins assign users to departments**, unlocking training features
5. **Access to training services** (Training, Report Threat, My Reports, Training Modules) **requires department assignment**

## Database Changes

### New Tables & Schema
Run the following SQL in Supabase:
```sql
-- File: backend/database/schema/10_company_access_control.sql
```

**What was added:**
- `company_members` table: Track which users belong to which companies with their roles
- `user_profiles.department_id`: Link user to department
- `user_profiles.is_department_assigned`: Boolean flag for access control
- `user_training_access` VIEW: Query user access rights
- Helper functions for company creation and user assignment

## Frontend Services

### companyService.js
**Location:** `frontend/src/services/companyService.js`

**Key Functions:**

```javascript
// Create a company
companyService.createCompany({
  name: "Acme Corp",
  registrationNumber: "REG-123",
  industry: "Technology",
  country: "USA",
  address: "123 Main St"
});

// Add existing user to company (requires admin role)
companyService.addUserToCompany(
  companyId,
  "user@example.com",
  "member"  // or "admin"
);

// Get company members
companyService.getCompanyMembers(companyId);

// Update member role
companyService.updateMemberRole(companyId, userId, "admin");

// Check training access
accessControlService.hasTrainingAccess();  // Returns { hasAccess: boolean }

// Admin: Assign user to department
accessControlService.assignUserToDepartment(userId, departmentId);
```

## Frontend Components

### 1. CreateCompanyDialog.tsx
**Location:** `frontend/src/components/CreateCompanyDialog.tsx`

**Usage:**
```tsx
import CreateCompanyDialog from '../components/CreateCompanyDialog';

function SettingsPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <>
      <button onClick={() => setIsDialogOpen(true)}>
        Create Company
      </button>
      <CreateCompanyDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onSuccess={() => {
          // Refresh company list
        }}
      />
    </>
  );
}
```

**Features:**
- Form for company creation
- Support for company details (name, registration, industry, country, address)
- User becomes owner of company automatically
- Dark/light mode support

### 2. CompanyMembersPanel.tsx
**Location:** `frontend/src/components/CompanyMembersPanel.tsx`

**Usage:**
```tsx
import CompanyMembersPanel from '../components/CompanyMembersPanel';

function CompanySettingsPage({ companyId }) {
  return (
    <CompanyMembersPanel companyId={companyId} />
  );
}
```

**Features:**
- Display all company members
- Search users by name/email
- **Admin only:** Add existing CyberLearn users by email
- **Admin only:** Change user roles (member/admin)
- **Admin only:** Remove users from company
- Show assignment status

### 3. TrainingAccessGuard.tsx
**Location:** `frontend/src/components/TrainingAccessGuard.tsx`

**Usage:**
```tsx
import TrainingAccessGuard from '../components/TrainingAccessGuard';

function TrainingPage() {
  return (
    <TrainingAccessGuard>
      {/* This only shows if user is assigned to department */}
      <TrainingContent />
    </TrainingAccessGuard>
  );
}
```

**Features:**
- Check if user has training access
- Show helpful message if access denied
- Show user's department info if assigned
- Block access to training features before assignment

### 4. AdminUserAssignment.tsx
**Location:** `frontend/src/components/AdminUserAssignment.tsx`

**Usage:**
```tsx
import AdminUserAssignment from '../components/AdminUserAssignment';

function AdminPage({ companyId }) {
  return (
    <AdminUserAssignment companyId={companyId} />
  );
}
```

**Features:**
- Search company members
- Assign users to departments
- Shows assignment status
- Summary statistics (assigned vs pending)

## Integration Steps

### Step 1: Run Database Schema
In Supabase SQL Editor, run:
```sql
-- Copy content from: backend/database/schema/10_company_access_control.sql
```

Verify it ran successfully - should see:
- `company_members` table created
- RLS policies enabled
- Indexes created
- Helper functions registered

### Step 2: Update App.tsx
```tsx
import TrainingAccessGuard from './components/TrainingAccessGuard';

// Wrap training routes with guard
<TrainingAccessGuard>
  <TrainingList />
</TrainingAccessGuard>

<TrainingAccessGuard>
  <AdminTraining />
</TrainingAccessGuard>

<TrainingAccessGuard>
  <AdminReports />
</TrainingAccessGuard>

<TrainingAccessGuard>
  <ThreatReportForm />
</TrainingAccessGuard>
```

### Step 3: Update Settings Component
Add company management section:

```tsx
import CreateCompanyDialog from './components/CreateCompanyDialog';
import CompanyMembersPanel from './components/CompanyMembersPanel';

export function Settings() {
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  return (
    <div className="space-y-6">
      {/* Theme Settings - existing */}

      {/* Company Management - NEW */}
      <div className="border-t pt-6">
        <h3 className="text-lg font-bold mb-4">Company Management</h3>
        
        <button
          onClick={() => setIsCreateDialogOpen(true)}
          className="mb-6 px-4 py-2 bg-indigo-600 text-white rounded-lg"
        >
          Create Company
        </button>

        <CreateCompanyDialog
          isOpen={isCreateDialogOpen}
          onClose={() => setIsCreateDialogOpen(false)}
        />

        {/* List companies and show members panel */}
        {selectedCompany && (
          <CompanyMembersPanel companyId={selectedCompany.id} />
        )}
      </div>
    </div>
  );
}
```

### Step 4: Update AdminDashboard.tsx
Add user assignment section:

```tsx
import AdminUserAssignment from './components/AdminUserAssignment';

export function AdminDashboard() {
  const [selectedCompany, setSelectedCompany] = useState(null);

  return (
    <div className="space-y-6">
      {/* Existing admin features */}

      {/* Department Assignment - NEW */}
      {selectedCompany && (
        <div className="border-t pt-6">
          <h3 className="text-lg font-bold mb-4">User Assignment</h3>
          <AdminUserAssignment companyId={selectedCompany.id} />
        </div>
      )}
    </div>
  );
}
```

## User Workflows

### Workflow 1: Create Company & Add Users

**User A (Company Owner):**
1. Sign up with Google/email
2. Go to Settings → Company Management
3. Click "Create Company"
4. Fill in company details (name, industry, address, etc.)
5. Company is created! User A is now the owner

**Later: User A adds User B**
1. User B signs up separately
2. User A goes to Settings → Company Management
3. In Company Members panel, click "Add User"
4. Enter User B's email
5. Select role (member or admin)
6. User B is added to company

### Workflow 2: Admin Assigns Department

**Admin (User A):**
1. Go to Admin Dashboard
2. Open "User Assignment" section
3. Search for User B
4. Select department (e.g., "IT Security")
5. Click "Assign to Department"
6. User B now has training access!

### Workflow 3: Employee Accesses Training

**Employee (User B):**
1. User B tries to click "Training" in sidebar
2. Page loads with `TrainingAccessGuard` wrapper
3. Component checks: is_department_assigned = true?
4. YES → Training page loads ✓
5. NO → Shows message "You're not assigned to department yet"

## Database Queries (for reference)

### Check if user has training access:
```sql
SELECT 
  user_id,
  is_department_assigned,
  department_id
FROM public.user_profiles
WHERE user_id = 'user-uuid'
AND is_department_assigned = true;
```

### Get user's department:
```sql
SELECT 
  up.user_id,
  d.name as department_name,
  d.id as department_id,
  c.name as company_name
FROM public.user_profiles up
JOIN public.departments d ON up.department_id = d.id
JOIN public.companies c ON d.company_id = c.id
WHERE up.user_id = 'user-uuid';
```

### List company members with assignment status:
```sql
SELECT 
  cm.user_id,
  u.email,
  up.full_name,
  up.is_department_assigned,
  d.name as department_name
FROM public.company_members cm
JOIN public.users u ON cm.user_id = u.id
JOIN public.user_profiles up ON cm.user_id = up.user_id
LEFT JOIN public.departments d ON up.department_id = d.id
WHERE cm.company_id = 'company-uuid'
ORDER BY cm.joined_at;
```

## Smart Features Included

1. **Email Validation**: Can only add users who exist in CyberLearn
2. **Role-Based Access**: Only company admins/owners can manage users
3. **RLS Policies**: Database enforces access control
4. **Helpful Messages**: Users get clear feedback about why they can't access features
5. **Department Tracking**: Shows which department user belongs to
6. **Automatic Owner Assignment**: Company creator becomes owner automatically
7. **Assignment History**: Tracks when users were assigned and by whom

## Error Handling

The system handles:
- User not found (email doesn't exist)
- Permission denied (non-admin trying to add users)
- Department already assigned
- User not authenticated
- Company not found
- Invalid department

All errors are caught and shown to user via Sonner toasts.

## Next Steps

1. ✅ Run database schema (10_company_access_control.sql)
2. ✅ Copy services (companyService.js)
3. ✅ Copy components (4 new components)
4. Integrate components into App.tsx, Settings, AdminDashboard
5. Test the workflows above
6. Phase 3: Landing page feature implementation
7. Phase 4: Admin training & threat management
8. Phase 5: Employee certificates & reports

## Testing Checklist

- [ ] User can create company
- [ ] Company members panel shows all members
- [ ] Admin can add user by email
- [ ] Admin can change member roles
- [ ] Admin can remove users
- [ ] User without department sees training access guard
- [ ] User with department can access training
- [ ] Department name displays in training area
- [ ] Non-admins cannot add users to company
- [ ] Existing user can be found by email
- [ ] New user gets helpful error message if not found
