import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { companyService, accessControlService } from '../services/companyService';
import { toast } from 'sonner';
import { Users, Plus, Trash2, Loader, Mail, AlertCircle, Building2, UserPlus, Search } from 'lucide-react';

export const CompanyMembersPanel = ({ companyId, onMembersChanged }) => {
  const [members, setMembers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedRole, setSelectedRole] = useState('member');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      await checkAdminStatus();
      await Promise.all([loadMembers(), loadDepartments()]);
    };
    loadData();
  }, [companyId]);

  useEffect(() => {
    if (!isAdmin || !companyId) return;

    const timer = setTimeout(async () => {
      setSearchLoading(true);
      const result = await companyService.searchUsersForCompany(companyId, userSearchQuery, 25);
      if (result.success) {
        setSearchResults(result.data || []);
      } else {
        setSearchResults([]);
        if (userSearchQuery.trim().length > 0) {
          toast.error(result.error || 'Failed to search users');
        }
      }
      setSearchLoading(false);
    }, 250);

    return () => clearTimeout(timer);
  }, [isAdmin, companyId, userSearchQuery]);

  const checkAdminStatus = async () => {
    const result = await companyService.isUserCompanyAdmin(companyId);
    setIsAdmin(result.isAdmin);
  };

  const loadMembers = async () => {
    setLoading(true);
    const result = await companyService.getCompanyMembers(companyId);
    if (result.success) {
      setMembers(result.data || []);
    } else {
      toast.error('Failed to load members');
    }
    setLoading(false);
  };

  const loadDepartments = async () => {
    try {
      const { data, error } = await supabase
        .from('departments')
        .select('id, name')
        .eq('company_id', companyId)
        .order('name');

      if (error) throw error;
      let departmentRows = data || [];

      if (departmentRows.length === 0) {
        const bootstrapResult = await companyService.ensureCompanyDefaultDepartments(companyId);
        if (!bootstrapResult.success) {
          throw new Error(bootstrapResult.error || 'Failed to bootstrap default departments');
        }

        const { data: refreshedDepartments, error: refreshError } = await supabase
          .from('departments')
          .select('id, name')
          .eq('company_id', companyId)
          .order('name');

        if (refreshError) throw refreshError;

        departmentRows = refreshedDepartments || [];
      }

      setDepartments(departmentRows);
    } catch (error) {
      console.error('Error loading departments:', error);
      toast.error(error.message || 'Failed to load departments');
    }
  };

  const handleAddUser = async (e) => {
    e.preventDefault();

    if (!selectedUser) {
      toast.error('Search and select a user first');
      return;
    }

    if (selectedRole === 'member' && !selectedDepartment) {
      toast.error('Members must be assigned to a department');
      return;
    }

    setIsAddingUser(true);
    const result = await companyService.addUserToCompany(
      companyId,
      selectedUser,
      selectedRole
    );

    if (result.success) {
      if (selectedRole === 'member' && selectedDepartment && result.userId) {
        const assignmentResult = await accessControlService.assignUserToDepartment(
          result.userId,
          selectedDepartment
        );

        if (!assignmentResult.success) {
          toast.error(assignmentResult.error || 'User added, but department assignment failed');
          setIsAddingUser(false);
          await loadMembers();
          await onMembersChanged?.();
          return;
        }
      }

      if (result.alreadyMember) {
        if (result.previousRole && result.previousRole !== selectedRole) {
          toast.success(
            selectedRole === 'member'
              ? 'Existing member role updated and department assigned.'
              : 'Existing member role updated successfully.'
          );
        } else {
          toast.success(
            selectedRole === 'member'
              ? 'Existing member assigned to selected department.'
              : 'User is already a member. Details refreshed.'
          );
        }
      } else {
        toast.success(selectedRole === 'member' ? 'User added and assigned to department!' : 'User added successfully!');
      }

      setSelectedUser(null);
      setUserSearchQuery('');
      setSelectedRole('member');
      setSelectedDepartment('');
      await loadMembers();
      await loadDepartments();
      await onMembersChanged?.();
    } else {
      toast.error(result.error || 'Failed to add user');
    }

    setIsAddingUser(false);
  };

  const handleRemoveUser = async (userId) => {
    if (!confirm('Remove this user from company?')) return;

    const result = await companyService.removeUserFromCompany(companyId, userId);
    if (result.success) {
      toast.success('User removed');
      await loadMembers();
      await onMembersChanged?.();
    } else {
      toast.error(result.error);
    }
  };

  const handleUpdateRole = async (userId, newRole) => {
    const result = await companyService.updateMemberRole(companyId, userId, newRole);
    if (result.success) {
      toast.success('Role updated');
      await loadMembers();
      await onMembersChanged?.();
    } else {
      toast.error(result.error);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-lg border dark:border-slate-700 overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b dark:border-slate-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Users className="w-5 h-5 text-indigo-600" />
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Team Members</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">{members.length} member(s)</p>
            </div>
          </div>
        </div>
      </div>

      {/* Add User Form - Only for Admins */}
      {isAdmin && (
        <div className="p-6 bg-slate-50 dark:bg-slate-800 border-b dark:border-slate-700">
          <form onSubmit={handleAddUser} className="space-y-3">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Add Existing CyberLearn User
            </label>
            <div className="flex gap-2 items-start">
              <div className="flex-1 space-y-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={userSearchQuery}
                    onChange={(e) => {
                      setUserSearchQuery(e.target.value);
                      setSelectedUser(null);
                    }}
                    placeholder="Search by name or email..."
                    disabled={isAddingUser}
                    className="w-full pl-10 pr-3 py-2 border dark:border-slate-700 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-600 disabled:opacity-50"
                  />
                </div>

                <div className="max-h-48 overflow-y-auto border dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 divide-y dark:divide-slate-700">
                  {searchLoading ? (
                    <div className="p-3 text-sm text-slate-500 dark:text-slate-400 flex items-center gap-2">
                      <Loader className="w-4 h-4 animate-spin" />
                      Searching users...
                    </div>
                  ) : searchResults.length === 0 ? (
                    <div className="p-3 text-sm text-slate-500 dark:text-slate-400">
                      {userSearchQuery.trim()
                        ? 'No users found for this search.'
                        : 'Type a name or email to search all CyberLearn users.'}
                    </div>
                  ) : (
                    searchResults.map((user) => (
                      <button
                        key={user.userId}
                        type="button"
                        onClick={() => setSelectedUser(user)}
                        className={`w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors ${
                          selectedUser?.userId === user.userId ? 'bg-indigo-50 dark:bg-indigo-900/30' : ''
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                              {user.fullName || user.email}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user.email}</p>
                          </div>
                          <div className="flex items-center gap-1">
                            {user.isCompanyMember && (
                              <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 whitespace-nowrap">
                                Already member{user.memberRole ? ` (${user.memberRole})` : ''}
                              </span>
                            )}
                            {selectedUser?.userId === user.userId && (
                              <span className="text-[11px] px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 whitespace-nowrap">
                                Selected
                              </span>
                            )}
                          </div>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                disabled={isAddingUser}
                className="px-3 py-2 border dark:border-slate-700 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-600 disabled:opacity-50"
              >
                <option value="member">Member</option>
                <option value="admin">Admin</option>
              </select>
              <button
                type="submit"
                disabled={isAddingUser || !selectedUser || (selectedRole === 'member' && !selectedDepartment)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
              >
                {isAddingUser ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    Add User
                  </>
                )}
              </button>
            </div>
            {selectedUser && (
              <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 text-sm text-indigo-800 dark:text-indigo-300">
                Selected user: <span className="font-medium">{selectedUser.fullName || selectedUser.email}</span> ({selectedUser.email})
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-2">
              <div>
                <label className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-2 mb-1">
                  <Building2 className="w-3 h-3" />
                  Add directly to department
                </label>
                <select
                  value={selectedDepartment}
                  onChange={(e) => setSelectedDepartment(e.target.value)}
                  disabled={isAddingUser || departments.length === 0}
                  className="w-full px-3 py-2 border dark:border-slate-700 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-600 disabled:opacity-50"
                >
                  <option value="">No department selected</option>
                  {departments.map((department) => (
                    <option key={department.id} value={department.id}>
                      {department.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-end">
                <div className="w-full px-3 py-2 rounded-lg border dark:border-slate-700 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 text-sm flex items-center gap-2">
                  <UserPlus className="w-4 h-4" />
                  One-step add
                </div>
              </div>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              User must already have a CyberLearn account. Selecting a department gives training access immediately.
            </p>
          </form>
        </div>
      )}

      {/* Members List */}
      <div className="divide-y dark:divide-slate-700">
        {loading ? (
          <div className="p-12 text-center">
            <Loader className="w-6 h-6 animate-spin text-indigo-600 mx-auto mb-2" />
            <p className="text-slate-500 dark:text-slate-400">Loading members...</p>
          </div>
        ) : members.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2 opacity-50" />
            <p className="text-slate-500 dark:text-slate-400">No members yet</p>
          </div>
        ) : (
          members.map((member) => (
            <div
              key={member.id}
              className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  {member.user_profiles?.avatar_url ? (
                    <img
                      src={member.user_profiles.avatar_url}
                      alt="avatar"
                      className="w-10 h-10 rounded-full"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center">
                      <span className="text-sm font-medium text-indigo-600 dark:text-indigo-400">
                        {member.user_profiles?.full_name?.[0] || '?'}
                      </span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-900 dark:text-white truncate">
                      {member.user_profiles?.full_name || 'Unknown'}
                    </p>
                    <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <Mail className="w-3 h-3" />
                      {member.users?.email}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Role Selector - Only for Admins */}
                  {isAdmin ? (
                    <select
                      value={member.role}
                      onChange={(e) => handleUpdateRole(member.user_id, e.target.value)}
                      className="px-2 py-1 text-sm border dark:border-slate-700 rounded bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-600"
                    >
                      <option value="member">Member</option>
                      <option value="admin">Admin</option>
                    </select>
                  ) : (
                    <span className="px-2 py-1 text-sm bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded capitalize">
                      {member.role}
                    </span>
                  )}

                  {/* Remove Button - Only for Admins */}
                  {isAdmin && (
                    <button
                      onClick={() => handleRemoveUser(member.user_id)}
                      className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                      title="Remove user"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Joined Date */}
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">
                Joined {new Date(member.joined_at).toLocaleDateString()}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default CompanyMembersPanel;
