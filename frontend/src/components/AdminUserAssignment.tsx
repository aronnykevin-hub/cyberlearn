import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { accessControlService, companyService } from '../services/companyService';
import { toast } from 'sonner';
import { Users, UserCheck, AlertCircle, Loader, Search, Plus, Edit, Trash2, X } from 'lucide-react';

export const AdminUserAssignment = ({ companyId, onAssignmentComplete }) => {
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [assigning, setAssigning] = useState(false);
  
  // Department management states
  const [showDeptForm, setShowDeptForm] = useState(false);
  const [editingDept, setEditingDept] = useState(null);
  const [newDeptName, setNewDeptName] = useState('');
  const [savingDept, setSavingDept] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      await loadUsers();
      await loadDepartments();
    };

    loadData();
  }, [companyId]);

  const loadUsers = async () => {
    try {
      const result = await companyService.getCompanyMembers(companyId);
      if (!result.success) throw new Error(result.error || 'Failed to load users');

      setUsers(result.data || []);
    } catch (error) {
      console.error('Error loading users:', error);
      toast.error('Failed to load users');
    }
  };

  const loadDepartments = async () => {
    try {
      const { data, error } = await supabase
        .from('departments')
        .select('id, name')
        .eq('company_id', companyId)
        .order('name');

      if (error) throw error;

      setDepartments(data || []);
    } catch (error) {
      console.error('Error loading departments:', error);
      toast.error('Failed to load departments');
    }

    setLoading(false);
  };

  const handleAddDepartment = async () => {
    if (!newDeptName.trim()) {
      toast.error('Department name is required');
      return;
    }

    setSavingDept(true);
    try {
      const { data, error } = await supabase
        .from('departments')
        .insert({
          company_id: companyId,
          name: newDeptName.trim(),
        })
        .select();

      if (error) throw error;

      setDepartments([...departments, data[0]]);
      setNewDeptName('');
      setShowDeptForm(false);
      toast.success('Department created successfully!');
    } catch (error) {
      console.error('Error creating department:', error);
      toast.error('Failed to create department');
    } finally {
      setSavingDept(false);
    }
  };

  const handleEditDepartment = async () => {
    if (!newDeptName.trim()) {
      toast.error('Department name is required');
      return;
    }

    setSavingDept(true);
    try {
      const { error } = await supabase
        .from('departments')
        .update({ name: newDeptName.trim() })
        .eq('id', editingDept.id);

      if (error) throw error;

      setDepartments(departments.map(d => d.id === editingDept.id ? { ...d, name: newDeptName.trim() } : d));
      setNewDeptName('');
      setEditingDept(null);
      toast.success('Department updated successfully!');
    } catch (error) {
      console.error('Error updating department:', error);
      toast.error('Failed to update department');
    } finally {
      setSavingDept(false);
    }
  };

  const handleDeleteDepartment = async (deptId) => {
    if (!window.confirm('Are you sure you want to delete this department?')) return;

    try {
      const { error } = await supabase
        .from('departments')
        .delete()
        .eq('id', deptId);

      if (error) throw error;

      setDepartments(departments.filter(d => d.id !== deptId));
      if (selectedDepartment === deptId) setSelectedDepartment('');
      toast.success('Department deleted successfully!');
    } catch (error) {
      console.error('Error deleting department:', error);
      toast.error('Failed to delete department');
    }
  };

  const filteredUsers = users.filter((user) => {
    const email = user.users?.email?.toLowerCase() || '';
    const fullName = user.user_profiles?.full_name?.toLowerCase() || '';
    const displayName = user.display_name?.toLowerCase() || '';
    const userId = user.user_id?.toLowerCase() || '';
    const query = searchTerm.toLowerCase();

    return email.includes(query) || fullName.includes(query) || displayName.includes(query) || userId.includes(query);
  });

  const handleAssignDepartment = async () => {
    if (!selectedUser || !selectedDepartment) {
      toast.error('Please select both user and department');
      return;
    }

    setAssigning(true);

    const result = await accessControlService.assignUserToDepartment(
      selectedUser.user_id,
      selectedDepartment
    );

    if (result.success) {
      toast.success('User assigned to department!');
      setSelectedUser(null);
      setSelectedDepartment('');
      await loadUsers();
      await onAssignmentComplete?.();
    } else {
      toast.error(result.error || 'Failed to assign department');
    }

    setAssigning(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader className="w-6 h-6 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-lg border dark:border-slate-700 overflow-hidden">
      <div className="p-6 border-b dark:border-slate-700">
        <div className="flex items-center gap-3 mb-4">
          <UserCheck className="w-5 h-5 text-indigo-600" />
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Assign Users to Departments</h3>
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Assign company members to departments to give them access to training features
        </p>
      </div>

      <div className="p-6 space-y-4">
        {departments.length === 0 && (
          <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-yellow-900 dark:text-yellow-400">No Departments</p>
              <p className="text-xs text-yellow-800 dark:text-yellow-300 mt-1">
                Create departments first before assigning users
              </p>
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Select User
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name or email..."
              className="w-full pl-10 pr-3 py-2 border dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-600"
            />
          </div>

          <div className="mt-3 space-y-2 max-h-48 overflow-y-auto border dark:border-slate-700 rounded-lg divide-y dark:divide-slate-700">
            {filteredUsers.map((user) => (
              <button
                key={user.user_id}
                onClick={() => setSelectedUser(user)}
                className={`w-full p-3 text-left hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors ${
                   selectedUser?.user_id === user.user_id ? 'bg-indigo-50 dark:bg-indigo-900/30 border-l-4 border-indigo-600' : ''
                 }`}
               >
                 <p className="font-medium text-slate-900 dark:text-white">
                   {user.user_profiles?.full_name || user.display_name || 'Unknown'}
                 </p>
                 <p className="text-sm text-slate-500 dark:text-slate-400">{user.users?.email}</p>
                <div className="mt-1 flex items-center gap-2">
                  {user.user_profiles?.is_department_assigned ? (
                    <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-0.5 rounded-full">
                      Assigned
                    </span>
                  ) : (
                    <span className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded-full">
                      Not assigned
                    </span>
                  )}
                </div>
              </button>
            ))}

            {filteredUsers.length === 0 && (
              <div className="p-4 text-center text-slate-500 dark:text-slate-400">
                {users.length === 0 ? 'No users in company' : 'No matching users found'}
              </div>
            )}
          </div>
        </div>

        {selectedUser && (
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-sm text-blue-900 dark:text-blue-300">
              <span className="font-medium">Selected:</span> {selectedUser.user_profiles?.full_name || selectedUser.display_name}
            </p>
          </div>
        )}

        {departments.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Select Department
              </label>
              <button
                onClick={() => {
                  setShowDeptForm(true);
                  setEditingDept(null);
                  setNewDeptName('');
                }}
                className="flex items-center gap-1 text-xs px-3 py-1 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <Plus className="w-3 h-3" />
                Add Department
              </button>
            </div>

            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="w-full px-3 py-2 border dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-600"
            >
              <option value="">Choose a department...</option>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.name}
                </option>
              ))}
            </select>

            {/* Department Management UI */}
            <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg space-y-3 border border-slate-200 dark:border-slate-700">
              <h4 className="text-sm font-semibold text-slate-900 dark:text-white">Manage Departments</h4>
              
              {/* Add/Edit Department Form */}
              {showDeptForm && (
                <div className="bg-white dark:bg-slate-900 p-4 rounded-lg border border-blue-200 dark:border-blue-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <h5 className="font-medium text-slot-900 dark:text-white">
                      {editingDept ? 'Edit Department' : 'Add New Department'}
                    </h5>
                    <button
                      onClick={() => {
                        setShowDeptForm(false);
                        setEditingDept(null);
                        setNewDeptName('');
                      }}
                      className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <input
                    type="text"
                    placeholder="Department name"
                    value={newDeptName}
                    onChange={(e) => setNewDeptName(e.target.value)}
                    className="w-full px-3 py-2 border dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={editingDept ? handleEditDepartment : handleAddDepartment}
                      disabled={savingDept}
                      className="flex-1 px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors font-medium"
                    >
                      {savingDept && <Loader className="w-4 h-4 animate-spin" />}
                      {editingDept ? 'Update' : 'Create'} Department
                    </button>
                    <button
                      onClick={() => {
                        setShowDeptForm(false);
                        setEditingDept(null);
                        setNewDeptName('');
                      }}
                      className="px-3 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Departments List */}
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {departments.length === 0 ? (
                  <p className="text-xs text-slate-500 dark:text-slate-400 italic">No departments yet</p>
                ) : (
                  departments.map((dept) => (
                    <div key={dept.id} className="flex items-center justify-between bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 transition-colors">
                      <span className="text-sm font-medium text-slate-900 dark:text-white">{dept.name}</span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setEditingDept(dept);
                            setNewDeptName(dept.name);
                            setShowDeptForm(true);
                          }}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                          title="Edit department"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteDepartment(dept.id)}
                          className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                          title="Delete department"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        <button
          onClick={handleAssignDepartment}
          disabled={!selectedUser || !selectedDepartment || assigning}
          className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors font-medium"
        >
          {assigning ? (
            <>
              <Loader className="w-4 h-4 animate-spin" />
              Assigning...
            </>
          ) : (
            <>
              <UserCheck className="w-4 h-4" />
              Assign to Department
            </>
          )}
        </button>
      </div>

      <div className="bg-slate-50 dark:bg-slate-800 p-6 border-t dark:border-slate-700">
        <h4 className="font-medium text-slate-900 dark:text-white mb-3 flex items-center gap-2">
          <Users className="w-4 h-4" />
          Assignment Summary
        </h4>
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 bg-white dark:bg-slate-900 rounded border dark:border-slate-700">
            <p className="text-2xl font-bold text-indigo-600">{users.filter((user) => user.user_profiles?.is_department_assigned).length}</p>
            <p className="text-xs text-slate-600 dark:text-slate-400">Assigned Users</p>
          </div>
          <div className="p-3 bg-white dark:bg-slate-900 rounded border dark:border-slate-700">
            <p className="text-2xl font-bold text-slate-600 dark:text-slate-300">{users.filter((user) => !user.user_profiles?.is_department_assigned).length}</p>
            <p className="text-xs text-slate-600 dark:text-slate-400">Pending Assignment</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminUserAssignment;
