import React, { useState } from 'react';
import { companyService } from '../services/companyService';
import { toast } from 'sonner';
import { Building2, Plus, Loader } from 'lucide-react';

export const CreateCompanyDialog = ({ isOpen, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    industry: '',
    country: '',
    address: '',
    departments:
      'IT / Cybersecurity\nFinance\nCustomer Care\nHuman Resources (HR)\nMarketing\nOperations\nSales\nAdministration'
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (!formData.name.trim()) {
      toast.error('Company name is required');
      setLoading(false);
      return;
    }

    const departments = String(formData.departments || '')
      .split('\n')
      .map((department) => department.trim())
      .filter(Boolean);

    const result = await companyService.createCompany({
      ...formData,
      departments
    });

    if (result.success) {
      toast.success('Company created successfully!');
      setFormData({
        name: '',
        industry: '',
        country: '',
        address: '',
        departments:
          'IT / Cybersecurity\nFinance\nCustomer Care\nHuman Resources (HR)\nMarketing\nOperations\nSales\nAdministration'
      });
      onSuccess?.();
      onClose();
    } else {
      toast.error(result.error || 'Failed to create company');
    }

    setLoading(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-blue-100 dark:border-slate-700">
        <div className="flex items-center gap-3 p-6 border-b border-blue-100 dark:border-slate-700 bg-gradient-to-r from-[#0047AB] to-sky-600 text-white">
          <Building2 className="w-5 h-5 text-white" />
          <h2 className="text-xl font-bold text-white">Create Company</h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Company Name */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Company Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g., Acme Corporation"
              className="w-full px-3 py-2 border dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Industry
              </label>
              <input
                type="text"
                name="industry"
                value={formData.industry}
                onChange={handleChange}
                placeholder="e.g., Technology, Finance"
                className="w-full px-3 py-2 border dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Country
              </label>
              <input
                type="text"
                name="country"
                value={formData.country}
                onChange={handleChange}
                placeholder="e.g., United States"
                className="w-full px-3 py-2 border dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Address
            </label>
            <textarea
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="Company address"
              rows="2"
              className="w-full px-3 py-2 border dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Initial Departments
            </label>
            <textarea
              name="departments"
              value={formData.departments}
              onChange={handleChange}
              placeholder="One department per line"
              rows="8"
              className="w-full px-3 py-2 border dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-600 font-mono text-sm"
            />
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              Add as many departments as you need. One per line.
            </p>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-[#0047AB] text-white rounded-lg hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
            >
              {loading ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  Create Company
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateCompanyDialog;
