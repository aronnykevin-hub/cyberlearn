# CyberLearn Phase 2: System Architecture & Integration Map

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     CYBERLEARN PLATFORM                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │             USER AUTHENTICATION LAYER                     │   │
│  │  (Google OAuth + Email/Password - EXISTING)             │   │
│  └──────────────────────────────────────────────────────────┘   │
│                              ↓                                    │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │           ORGANIZATION MANAGEMENT LAYER (NEW)            │   │
│  │  ┌─────────────────────────────────────────────────────┐ │   │
│  │  │ User Creates Company → Becomes Owner                │ │   │
│  │  │ Owner Adds Existing Users → Members Invited         │ │   │
│  │  │ Company Members → Can be Admin/Member               │ │   │
│  │  └─────────────────────────────────────────────────────┘ │   │
│  └──────────────────────────────────────────────────────────┘   │
│                              ↓                                    │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │         ACCESS CONTROL LAYER (DEPARTMENT ASSIGNMENT)     │   │
│  │  ┌─────────────────────────────────────────────────────┐ │   │
│  │  │ Admin Assigns User to Department                    │ │   │
│  │  │ Department Assignment Unlocks Training Access       │ │   │
│  │  │ is_department_assigned = TRUE ✓                     │ │   │
│  │  └─────────────────────────────────────────────────────┘ │   │
│  └──────────────────────────────────────────────────────────┘   │
│                              ↓                                    │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │         PROTECTED FEATURES LAYER (GUARDED)              │   │
│  │  ┌─────────────────────────────────────────────────────┐ │   │
│  │  │ 📚 Training Platform  (wrapped in Guard)            │ │   │
│  │  │ 📋 Training Modules   (wrapped in Guard)            │ │   │
│  │  │ ⚠️  Report Threat      (wrapped in Guard)            │ │   │
│  │  │ 📊 My Reports         (wrapped in Guard)            │ │   │
│  │  │ 🎓 Training Progress  (wrapped in Guard)            │ │   │
│  │  └─────────────────────────────────────────────────────┘ │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

## Database Schema Relationships

```
┌────────────────────────────────────────────────────────────┐
│                    Database Tables                         │
├────────────────────────────────────────────────────────────┤
│                                                             │
│  users (existing)                                          │
│  ├─ id (PK)                                               │
│  ├─ email                                                 │
│  └─ auth_id                                               │
│         ↑                                                   │
│         │ foreign key                                      │
│         │                                                  │
│  user_profiles (existing, UPDATED)                        │
│  ├─ user_id (PK)                                          │
│  ├─ role                                                  │
│  ├─ is_department_assigned (NEW)                          │
│  ├─ department_id (NEW) ────────────┐                    │
│  ├─ assigned_at (NEW)               │                    │
│  └─ assigned_by (NEW)               │                    │
│         ↑                             │                    │
│         │ foreign key                 │ foreign key       │
│         │                             │                   │
│  companies (existing)           departments (existing)    │
│  ├─ id (PK)                    ├─ id (PK)                │
│  ├─ name                       ├─ name                   │
│  ├─ created_by ──────────┐    └─ company_id             │
│  └─ (other details)      │         ↑                     │
│                           │         │ foreign key        │
│         ↑                 │         │                    │
│         │ foreign key     │─────────┘                    │
│         │                                                 │
│  company_members (NEW)                                   │
│  ├─ id (PK)                                              │
│  ├─ company_id (FK)                                      │
│  ├─ user_id (FK)                                         │
│  ├─ role (owner/admin/member)                            │
│  └─ joined_at                                            │
│                                                             │
└────────────────────────────────────────────────────────────┘
```

## Component Integration Points

### 1. App.tsx (Main Entry Point)
```
App.tsx
├─ Route: "/" → LandingPage
├─ Route: "/admin-dashboard"
│  └─ TrainingAccessGuard
│     └─ AdminDashboard
│        └─ AdminUserAssignment (NEW)  ← Component #4
│
├─ Route: "/employee-dashboard"
│  └─ TrainingAccessGuard
│     └─ EmployeeDashboard
│        └─ TrainingList
│           └─ TrainingAccessGuard  ← Nested Guard
│
├─ Route: "/training/:id"
│  └─ TrainingAccessGuard
│     └─ TrainingModule
│
├─ Route: "/training-progress"
│  └─ TrainingAccessGuard
│     └─ AdminTraining
│
├─ Route: "/threat-report"
│  └─ TrainingAccessGuard
│     └─ ThreatReportForm
│
├─ Route: "/my-reports"
│  └─ TrainingAccessGuard
│     └─ MyReports
│
└─ Route: "/settings"
   └─ Settings
      ├─ ThemeToggle (existing)
      └─ CreateCompanyDialog (NEW)  ← Component #1
         └─ CompanyMembersPanel (NEW) ← Component #2
```

### 2. Settings Component (User Profile & Company Management)
```
Settings
├─ Header with theme toggle
├─ Profile info
├─ Theme settings (existing)
│
└─ Company Management (NEW)
   ├─ "Create Company" button
   │  └─ CreateCompanyDialog
   │     ├─ Company name input
   │     ├─ Registration number input
   │     ├─ Industry input
   │     ├─ Country input
   │     ├─ Address input
   │     └─ Submit → creates company + adds user as owner
   │
   ├─ "Select Company" dropdown
   │  └─ CompanyMembersPanel
   │     ├─ Members list
   │     ├─ "Add User" form (admin only)
   │     │  ├─ Email input
   │     │  ├─ Role selector
   │     │  └─ Search + Add button
   │     ├─ Member cards
   │     │  ├─ Name + Email
   │     │  ├─ Role selector
   │     │  ├─ Remove button
   │     │  └─ Assignment status badge
   │     └─ Stats (assigned vs pending)
```

### 3. AdminDashboard (Department Assignment)
```
AdminDashboard
│
└─ User Assignment Section (NEW)
   └─ AdminUserAssignment
      ├─ Users list with search
      │  ├─ Filter by name/email
      │  ├─ Select user
      │  └─ Show assignment status
      │
      ├─ Department selector
      │  └─ Dropdown with company departments
      │
      ├─ Assign button
      │  └─ Call: assignUserToDepartment()
      │
      └─ Summary stats
         ├─ Total assigned users
         └─ Total pending assignment
```

### 4. Protected Features (Training Access Guard)
```
Every Training Route
├─ TrainingAccessGuard (wrapper)
│  ├─ Check: hasTrainingAccess()
│  │  └─ Query: is_department_assigned = true?
│  │
│  ├─ IF true:
│  │  ├─ Render: [Department name badge]
│  │  └─ Render: [Protected content]
│  │
│  └─ IF false:
│     └─ Render: Access blocked message
│        ├─ "You're not assigned to department"
│        ├─ "Ask your admin to assign you"
│        └─ "Or create a company in Settings"
```

## Service Layer Integration

```
companyService.js
│
├─ createCompany()
│  ├─ Get current user
│  ├─ Call RPC: create_company_with_owner()
│  ├─ Returns: companyId
│  └─ Toast: Success/Error
│
├─ addUserToCompany()
│  ├─ Get current user (must be admin)
│  ├─ Find user by email
│  ├─ Call RPC: add_user_to_company()
│  └─ Toast: Success/Error
│
├─ getCompanyMembers()
│  ├─ Query: company_members + users + user_profiles
│  └─ Returns: members array with details
│
└─ isUserCompanyAdmin()
   ├─ Query: company_members WHERE role IN (admin, owner)
   └─ Returns: boolean

accessControlService.js
│
├─ hasTrainingAccess()
│  ├─ Query: user_profiles
│  ├─ Check: is_department_assigned AND department_id != null
│  └─ Returns: { hasAccess, departmentId, reason }
│
└─ assignUserToDepartment()
   ├─ Verify admin (from user_profiles.role = 'admin')
   ├─ Call RPC: assign_user_to_department()
   └─ Updates: user_profiles + is_department_assigned
```

## Data Flow: Company Creation

```
1. User in Settings
   └─ Clicks "Create Company"

2. CreateCompanyDialog opens
   └─ User fills form + clicks "Create Company"

3. companyService.createCompany() called
   ├─ Gets current user ID
   └─ Calls RPC: create_company_with_owner()

4. Database RPC executes
   ├─ INSERT companies table → gets company_id
   ├─ INSERT company_members (user_id, company_id, role='owner')
   └─ Returns company_id

5. Frontend handles response
   ├─ Show toast "Company created!"
   ├─ Close dialog
   └─ Refresh companies list

6. Result
   └─ User now appears as owner in CompanyMembersPanel
```

## Data Flow: User Assignment

```
1. Admin in AdminDashboard
   └─ Opens AdminUserAssignment

2. Admin searches + selects employee
   └─ Loads company members with status

3. Admin selects department
   └─ Dropdown shows available departments

4. Admin clicks "Assign to Department"

5. accessControlService.assignUserToDepartment() called
   ├─ Verifies admin status
   └─ Calls RPC: assign_user_to_department()

6. Database RPC executes
   ├─ UPDATE user_profiles
   ├─ SET is_department_assigned = true
   ├─ SET department_id = <selected_dept_id>
   ├─ SET assigned_at = NOW()
   └─ SET assigned_by = <admin_user_id>

7. Frontend handles response
   ├─ Show toast "User assigned!"
   ├─ Refresh members list
   └─ Update status badge

8. Result
   └─ Employee now sees training features ✓
```

## Access Control Decision Tree

```
User tries to access Training Feature
│
├─ Is user authenticated?
│  ├─ NO → Redirect to signin
│  └─ YES ↓
│
├─ Is user assigned to department?
│  ├─ NO → Show "Access Blocked" message
│  │        ├─ "You need department assignment"
│  │        ├─ "Ask your admin"
│  │        └─ "Or create company in Settings"
│  │
│  └─ YES ↓
│
├─ Does user have valid department_id?
│  ├─ NO → Show "Access Blocked" message
│  └─ YES ↓
│
├─ Show "Department: [name]" badge
└─ RENDER: Training feature ✓
```

## File Structure After Implementation

```
frontend/src/
├─ components/
│  ├─ CreateCompanyDialog.tsx         (NEW)
│  ├─ CompanyMembersPanel.tsx         (NEW)
│  ├─ TrainingAccessGuard.tsx         (NEW)
│  ├─ AdminUserAssignment.tsx         (NEW)
│  ├─ ThemeToggle.tsx                 (existing)
│  ├─ Settings.tsx                    (to update)
│  ├─ AdminDashboard.tsx              (to update)
│  ├─ TrainingList.tsx                (to update)
│  ├─ TrainingModule.tsx              (to update)
│  ├─ ThreatReportForm.tsx            (to update)
│  ├─ MyReports.tsx                   (to update)
│  └─ App.tsx                         (to update)
│
├─ services/
│  ├─ companyService.js               (NEW)
│  ├─ authService.js                  (existing)
│  ├─ supabaseClient.ts               (existing)
│  ├─ trainingModuleService.js        (existing)
│  ├─ trainingProgressService.js      (existing)
│  └─ ... (other services)
│
└─ contexts/
   └─ ThemeContext.tsx                (existing)

backend/database/schema/
├─ 01_users.sql
├─ 02_companies.sql
├─ 03_departments.sql
├─ ... (other schema files)
├─ 09_phishing_and_certificates.sql
└─ 10_company_access_control.sql      (NEW)
```

## Security & RLS Policies

All operations are protected by:

1. **Authentication**: User must be logged in
2. **Row-Level Security**: Database enforces access at table level
3. **Role-Based Access**:
   - Only company admins/owners can manage members
   - Only admins can assign departments
   - Users can only see own profile & assigned company
4. **Function-Level Security**: RPC functions use SECURITY DEFINER with validation

## Testing Checklist

**Company Creation:**
- [ ] User can create company
- [ ] User becomes owner automatically
- [ ] Company name required validation
- [ ] Success toast shown
- [ ] Company appears in Settings

**Member Management:**
- [ ] Admin can add user by email
- [ ] Only existing users can be added (email validation)
- [ ] Non-admin cannot add users (permission check)
- [ ] Members list shows all members
- [ ] Admin can change member roles
- [ ] Admin can remove members

**Department Assignment:**
- [ ] Admin can assign user to department
- [ ] Department selector works
- [ ] Assignment updated in database
- [ ] User status changes from "Pending" to "Assigned"

**Access Control:**
- [ ] Unassigned user sees access blocked message
- [ ] Assigned user can access training
- [ ] Department name badge shows
- [ ] All protected routes blocked before assignment
- [ ] Access guard works on all training routes

**User Experience:**
- [ ] Dark/light mode works everywhere
- [ ] Error messages clear and helpful
- [ ] Toasts show for success/error
- [ ] Dialogs close after success
- [ ] Loading states show properly
- [ ] Search works in all lists
