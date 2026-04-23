// Permission & Role Management Service

import { supabase } from './supabaseClient';

export const permissionService = {
  // Define what each role can see
  ROLE_PERMISSIONS: {
    admin: {
      canCreateCompany: true,
      canViewDashboard: true,
      canManageEmployees: true,
      canCreateTraining: true,
      canViewTraining: true,
      canLaunchPhishing: true,
      canViewPhishing: true,
      canViewAllReports: true,        // Can see ALL reports
      canViewOthersReports: true,     // Can see other employees' reports
      canRespondToReports: true,
      canIssueCertificates: true,
      canViewAllCertificates: true,   // Can see all certificates
      canViewEmployeeProgress: true,  // Can see all employees' progress
      canViewOwnProgress: true,
      canAssignUsers: true,
      canAssignDepartments: true
    },
    employee: {
      canCreateCompany: false,
      canViewDashboard: false,
      canManageEmployees: false,
      canCreateTraining: false,
      canViewTraining: true,          // Can only view assigned training
      canLaunchPhishing: false,
      canViewPhishing: false,
      canViewAllReports: false,
      canViewOthersReports: false,    // Cannot see other employees' reports
      canRespondToReports: false,
      canIssueCertificates: false,
      canViewAllCertificates: false,
      canViewEmployeeProgress: false, // Cannot see others' progress
      canViewOwnProgress: true,       // Can only see own progress
      canAssignUsers: false,
      canAssignDepartments: false
    },
    newUser: {
      canCreateCompany: true,
      canViewDashboard: false,
      canManageEmployees: false,
      canCreateTraining: false,
      canViewTraining: false,
      canLaunchPhishing: false,
      canViewPhishing: false,
      canViewAllReports: false,
      canViewOthersReports: false,
      canRespondToReports: false,
      canIssueCertificates: false,
      canViewAllCertificates: false,
      canViewEmployeeProgress: false,
      canViewOwnProgress: false,
      canAssignUsers: false,
      canAssignDepartments: false
    }
  },

  // Determine user's role based on actual state
  async getUserRole() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return 'newUser';

      // Check user profile and company status
      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select(`
          role,
          is_department_assigned,
          department_id
        `)
        .eq('user_id', user.id)
        .single();

      if (error || !profile) return 'newUser';

      // If user has explicit role set
      if (profile.role === 'admin') return 'admin';
      if (profile.role === 'employee' && profile.is_department_assigned) return 'employee';

      // If role is null, check if they created a company
      if (!profile.role) {
        const { data: company } = await supabase
          .from('company_members')
          .select('role')
          .eq('user_id', user.id)
          .eq('role', 'owner')
          .limit(1)
          .maybeSingle();

        if (company) return 'admin';
        
        // If they're assigned to department but role not set, they're employee
        if (profile.is_department_assigned && profile.department_id) {
          return 'employee';
        }

        // Otherwise they're a new user
        return 'newUser';
      }

      return 'newUser';
    } catch (error) {
      console.error('Error getting user role:', error);
      return 'newUser';
    }
  },

  // Get permissions for user's role
  async getUserPermissions() {
    const role = await this.getUserRole();
    return this.ROLE_PERMISSIONS[role] || this.ROLE_PERMISSIONS.newUser;
  },

  // Check specific permission
  async can(permission) {
    const permissions = await this.getUserPermissions();
    return permissions[permission] || false;
  },

  // Get user's company
  async getUserCompany() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('company_members')
        .select('company_id, companies(*)')
        .eq('user_id', user.id)
        .limit(1)
        .maybeSingle();

      if (error) {
        // Try getting company created by user
        const { data: ownedCompany } = await supabase
          .from('companies')
          .select('*')
          .eq('created_by', user.id)
          .limit(1)
          .maybeSingle();

        return ownedCompany;
      }

      return data?.companies;
    } catch (error) {
      console.error('Error getting user company:', error);
      return null;
    }
  },

  // Check if user can access training
  async canAccessTraining() {
    try {
      const permissions = await this.getUserPermissions();
      if (!permissions.canViewTraining) return false;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      // Employees need department assignment
      if (permissions.canViewTraining && !permissions.canCreateCompany) {
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('is_department_assigned')
          .eq('user_id', user.id)
          .single();

        return profile?.is_department_assigned || false;
      }

      return true;
    } catch (error) {
      return false;
    }
  },

  // Get filtered reports (role-based)
  async getAccessibleReports() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const permissions = await this.getUserPermissions();

      if (permissions.canViewAllReports) {
        // Admin: get all reports
        const { data } = await supabase
          .from('threat_reports')
          .select('*')
          .order('created_at', { ascending: false });
        return data || [];
      } else if (permissions.canViewOwnProgress) {
        // Employee: get own reports only
        const { data } = await supabase
          .from('threat_reports')
          .select('*')
          .eq('reporter_id', user.id)
          .order('created_at', { ascending: false });
        return data || [];
      }

      return [];
    } catch (error) {
      console.error('Error getting reports:', error);
      return [];
    }
  },

  // Get filtered progress (role-based)
  async getAccessibleProgress() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const permissions = await this.getUserPermissions();

      if (permissions.canViewEmployeeProgress) {
        // Admin: get all progress
        const { data } = await supabase
          .from('training_progress')
          .select('*')
          .order('updated_at', { ascending: false });
        return data || [];
      } else if (permissions.canViewOwnProgress) {
        // Employee: get own progress only
        const { data } = await supabase
          .from('training_progress')
          .select('*')
          .eq('user_id', user.id)
          .order('updated_at', { ascending: false });
        return data || [];
      }

      return [];
    } catch (error) {
      console.error('Error getting progress:', error);
      return [];
    }
  },

  // Get filtered certificates (role-based)
  async getAccessibleCertificates() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const permissions = await this.getUserPermissions();

      if (permissions.canViewAllCertificates) {
        // Admin: get all certificates
        const { data } = await supabase
          .from('certificates')
          .select('*')
          .order('issue_date', { ascending: false });
        return data || [];
      } else if (permissions.canViewOwnProgress) {
        // Employee: get own certificates only
        const { data } = await supabase
          .from('certificates')
          .select('*')
          .eq('user_id', user.id)
          .order('issue_date', { ascending: false });
        return data || [];
      }

      return [];
    } catch (error) {
      console.error('Error getting certificates:', error);
      return [];
    }
  }
};
