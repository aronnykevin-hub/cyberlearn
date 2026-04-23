// Company Management Service
// Handles company creation, user invitations, and member management

import { supabase } from './supabaseClient';

// ===========================
// Company Service
// ===========================

export const companyService = {
  // Create a new company with current user as owner
  async createCompany(companyData) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Call database function to create company with owner
      const { data, error } = await supabase
        .rpc('create_company_with_owner', {
          p_name: companyData.name,
          p_registration_number: companyData.registrationNumber || null,
          p_industry: companyData.industry || null,
          p_country: companyData.country || null,
          p_address: companyData.address || null
        });

      if (error) throw error;

      return {
        success: true,
        companyId: data,
        message: 'Company created successfully'
      };
    } catch (error) {
      console.error('Error creating company:', error);
      return {
        success: false,
        error: error.message || 'Failed to create company'
      };
    }
  },

  // Get all companies for current user
  async getUserCompanies() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Get organizations created by user
      const { data: ownedOrgs, error: ownError } = await supabase
        .from('companies')
        .select(`
          id,
          name,
          registration_number,
          industry,
          country,
          address,
          created_by,
          created_at,
          updated_at
        `)
        .eq('created_by', user.id);

      if (ownError && ownError.code !== 'PGRST116') throw ownError;

      // Get organizations user is member of
      const { data: memberOrgs, error: memberError } = await supabase
        .from('company_members')
        .select(`
          company_id,
          companies (
            id,
            name,
            registration_number,
            industry,
            country,
            address,
            created_by,
            created_at,
            updated_at
          )
        `)
        .eq('user_id', user.id);

      if (memberError && memberError.code !== 'PGRST116') throw memberError;

      // Merge results and remove duplicates
      const allOrganisations = [
        ...(ownedOrgs || []),
        ...(memberOrgs || [])
          .filter(m => m.companies)
          .map(m => m.companies)
      ];

      // Remove duplicates by id
      const uniqueOrganisations = Array.from(
        new Map(allOrganisations.map(c => [c.id, c])).values()
      );

      return { success: true, data: uniqueOrganisations };
    } catch (error) {
      console.error('Error fetching companies:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch companies'
      };
    }
  },

  // Get organization details
  async getCompanyDetails(companyId) {
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .eq('id', companyId)
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error fetching organization:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch organization'
      };
    }
  },

  // Add existing user to organization
  async addUserToCompany(companyId, userInput, role = 'member') {
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) throw new Error('User not authenticated');

      let resolvedUserId = null;
      let resolvedEmail = '';
      let wasAlreadyMember = false;
      let previousRole = null;

      if (typeof userInput === 'object' && userInput !== null && (userInput.userId || userInput.user_id)) {
        resolvedUserId = userInput.userId || userInput.user_id;
        resolvedEmail = (userInput.email || '').trim().toLowerCase();
        wasAlreadyMember = Boolean(userInput.isCompanyMember ?? userInput.is_company_member);
        previousRole = userInput.memberRole || userInput.member_role || null;
      } else {
        const normalizedEmail = String(userInput || '').trim().toLowerCase();
        if (!normalizedEmail) {
          return {
            success: false,
            error: 'User email is required'
          };
        }

        // Resolve the user from Supabase auth and mirror them into public tables if needed.
        const { data: foundUsers, error: findError } = await supabase.rpc('find_cyberlearn_user_by_email', {
          p_email: normalizedEmail
        });

        if (findError) {
          if (findError.code === 'PGRST202' || findError.status === 404 || /could not find the function/i.test(findError.message || '')) {
            return {
              success: false,
              error: 'Database migration missing: run backend/database/schema/10_company_access_control.sql so Google-auth users can be resolved.'
            };
          }

          throw findError;
        }

        const user = Array.isArray(foundUsers) ? foundUsers[0] : foundUsers;
        if (!user) {
          return {
            success: false,
            error: 'User not found in CyberLearn system'
          };
        }

        resolvedUserId = user.user_id;
        resolvedEmail = (user.email || normalizedEmail).trim().toLowerCase();
      }

      // Add user to company
      const { error } = await supabase
        .rpc('add_user_to_company', {
          p_company_id: companyId,
          p_user_id: resolvedUserId,
          p_added_by: currentUser.id,
          p_role: role
        });

      if (error) throw error;

      return {
        success: true,
        userId: resolvedUserId,
        userEmail: resolvedEmail,
        alreadyMember: wasAlreadyMember,
        previousRole,
        message: wasAlreadyMember
          ? 'User already existed in organization. Membership updated.'
          : 'User added to organization successfully'
      };
    } catch (error) {
      console.error('Error adding user to organization:', error);
      return {
        success: false,
        error: error.message || 'Failed to add user to organization'
      };
    }
  },

  // Ensure default departments exist for a company
  async ensureCompanyDefaultDepartments(companyId) {
    try {
      const { data, error } = await supabase
        .rpc('ensure_company_default_departments', {
          p_company_id: companyId
        });

      if (error) {
        if (error.code === 'PGRST202' || error.status === 404 || /could not find the function/i.test(error.message || '')) {
          return {
            success: false,
            error: 'Database migration missing: run backend/database/schema/15_team_member_user_search_and_default_departments.sql.'
          };
        }
        throw error;
      }

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Error ensuring default departments:', {
        message: error?.message,
        details: error?.details,
        hint: error?.hint,
        code: error?.code,
        status: error?.status,
      });
      return {
        success: false,
        error:
          [
            error?.message,
            error?.details,
            error?.hint,
          ]
            .filter(Boolean)
            .join(' | ') || 'Failed to ensure default departments'
      };
    }
  },

  // Search CyberLearn users by name/email for adding to a company
  async searchUsersForCompany(companyId, query = '', limit = 20) {
    try {
      const rpcPayload = {
        p_company_id: companyId,
        p_query: String(query ?? ''),
        p_limit: Number(limit) || 20,
      };

      const { data, error } = await supabase
        .rpc('search_cyberlearn_users', rpcPayload);

      if (error) {
        if (error.code === 'PGRST202' || error.status === 404 || /could not find the function/i.test(error.message || '')) {
          return {
            success: false,
            error: 'Database migration missing: run backend/database/schema/15_team_member_user_search_and_default_departments.sql.'
          };
        }
        if (/could not choose the best candidate function/i.test(error.message || '')) {
          return {
            success: false,
            error:
              'Supabase has overloaded RPC versions for search_cyberlearn_users. ' +
              'Run: DROP FUNCTION IF EXISTS public.search_cyberlearn_users(UUID, TEXT, INTEGER); ' +
              'DROP FUNCTION IF EXISTS public.search_cyberlearn_users(TEXT, UUID, INTEGER); ' +
              'Then re-run migration 15.'
          };
        }
        if (/only company admins can search users/i.test(error.message || '')) {
          return {
            success: false,
            error: 'Current user is not recognized as company admin/owner for this company.'
          };
        }
        throw error;
      }

      const users = (data || []).map((row) => ({
        userId: row.user_id,
        email: row.email,
        fullName: row.full_name || row.email || row.user_id,
        avatarUrl: row.avatar_url || null,
        isCompanyMember: row.is_company_member === true,
        memberRole: row.member_role || null,
      }));

      return { success: true, data: users };
    } catch (error) {
      console.error('Error searching users for company:', {
        message: error?.message,
        details: error?.details,
        hint: error?.hint,
        code: error?.code,
        status: error?.status,
      });
      return {
        success: false,
        error:
          [
            error?.message,
            error?.details,
            error?.hint,
          ]
            .filter(Boolean)
            .join(' | ') || 'Failed to search users'
      };
    }
  },

  // Get organization members
  async getCompanyMembers(companyId) {
    try {
      const { data, error } = await supabase
        .rpc('get_company_members', {
          p_company_id: companyId
        });

      if (error) throw error;

      const members = (data || []).map((member) => ({
        id: member.member_id,
        company_id: member.company_id,
        user_id: member.user_id,
        role: member.role,
        joined_at: member.joined_at,
        added_by: member.added_by,
        display_name: member.full_name || member.email || member.user_id,
        users: {
          id: member.user_id,
          email: member.email
        },
        user_profiles: {
          full_name: member.full_name,
          avatar_url: member.avatar_url,
          phone: member.phone,
          department_id: member.department_id,
          is_department_assigned: member.is_department_assigned
        }
      }));

      return { success: true, data: members };
    } catch (error) {
      console.error('Error fetching organization members:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch organization members'
      };
    }
  },

  // Remove user from organization
  async removeUserFromCompany(companyId, userId) {
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) throw new Error('User not authenticated');

      // Call RPC function with permission check built in
      const { error } = await supabase
        .rpc('remove_user_from_company', {
          p_company_id: companyId,
          p_user_id: userId,
          p_removed_by: currentUser.id
        });

      if (error) throw error;

      return {
        success: true,
        message: 'User removed from organization'
      };
    } catch (error) {
      console.error('Error removing user from organization:', error);
      return {
        success: false,
        error: error.message || 'Failed to remove user'
      };
    }
  },

  // Update member role
  async updateMemberRole(companyId, userId, newRole) {
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) throw new Error('User not authenticated');

      // Call RPC function with permission check built in
      const { error } = await supabase
        .rpc('update_member_role', {
          p_company_id: companyId,
          p_user_id: userId,
          p_new_role: newRole,
          p_updated_by: currentUser.id
        });

      if (error) throw error;

      return {
        success: true,
        message: 'Member role updated successfully'
      };
    } catch (error) {
      console.error('Error updating member role:', error);
      return {
        success: false,
        error: error.message || 'Failed to update role'
      };
    }
  },

  // Check if user is organization admin
  async isUserCompanyAdmin(companyId, userId = null) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const checkUserId = userId || user?.id;

      if (!checkUserId) throw new Error('User not authenticated');

      // Call RPC function to check admin status
      const { data, error } = await supabase
        .rpc('is_user_company_admin', {
          p_company_id: companyId,
          p_user_id: checkUserId
        });

      if (error) {
        return { success: false, isAdmin: false };
      }

      return {
        success: true,
        isAdmin: data === true
      };
    } catch (error) {
      return { success: false, isAdmin: false };
    }
  }
};

// ===========================
// Access Control Service
// ===========================

export const accessControlService = {
  // Check if user has access to training features
  async hasTrainingAccess(userId = null) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const checkUserId = userId || user?.id;

      if (!checkUserId) {
        return { success: false, hasAccess: false, reason: 'Not authenticated' };
      }

      const { data, error } = await supabase
        .from('user_profiles')
        .select('is_department_assigned, department_id')
        .eq('user_id', checkUserId)
        .single();

      if (error || !data) {
        return {
          success: false,
          hasAccess: false,
          reason: 'User profile not found'
        };
      }

      const hasAccess = data.is_department_assigned && data.department_id !== null;

      return {
        success: true,
        hasAccess,
        departmentId: data.department_id,
        reason: hasAccess ? 'User has access' : 'User not assigned to department'
      };
    } catch (error) {
      console.error('Error checking training access:', error);
      return {
        success: false,
        hasAccess: false,
        reason: error.message
      };
    }
  },

  // Get user's department info
  async getUserDepartmentInfo(userId = null) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const checkUserId = userId || user?.id;

      if (!checkUserId) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('user_profiles')
        .select(`
          is_department_assigned,
          department_id,
          departments!inner (
            id,
            name,
            description,
            company_id
          )
        `)
        .eq('user_id', checkUserId)
        .single();

      if (error) throw error;

      return {
        success: true,
        data: {
          isAssigned: data.is_department_assigned,
          department: data.departments
        }
      };
    } catch (error) {
      console.error('Error fetching department info:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  // Admin: Assign user to department
  async assignUserToDepartment(userId, departmentId) {
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) throw new Error('User not authenticated');

      // Check if current user is admin
      const { data: adminCheck, error: adminError } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('user_id', currentUser.id)
        .eq('role', 'admin')
        .single();

      if (adminError || !adminCheck) {
        return {
          success: false,
          error: 'Only admins can assign departments'
        };
      }

      // Call database function
      const { error } = await supabase
        .rpc('assign_user_to_department', {
          p_user_id: userId,
          p_department_id: departmentId,
          p_assigned_by: currentUser.id
        });

      if (error) throw error;

      return {
        success: true,
        message: 'User assigned to department successfully'
      };
    } catch (error) {
      console.error('Error assigning department:', error);
      return {
        success: false,
        error: error.message || 'Failed to assign department'
      };
    }
  }
};
