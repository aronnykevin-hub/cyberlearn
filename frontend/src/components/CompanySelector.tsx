import React, { useState, useEffect } from 'react';
import { Building2, Plus, ArrowRight } from 'lucide-react';
import { companyService } from '../services/companyService';
import { toast } from 'sonner';
import CreateCompanyDialog from './CreateCompanyDialog';

export const CompanySelector = ({ onSelectCompany }) => {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  useEffect(() => {
    const loadCompanies = async () => {
      const result = await companyService.getUserCompanies();
      if (result.success) {
        setCompanies(result.data || []);
      }
      setLoading(false);
    };

    loadCompanies();
  }, []);

  const handleCreateSuccess = async () => {
    const result = await companyService.getUserCompanies();
    if (result.success) {
      setCompanies(result.data || []);
      toast.success('Company created! You can now manage it.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-3"></div>
          <p className="text-slate-600 dark:text-slate-400">Loading companies...</p>
        </div>
      </div>
    );
  }

  if (companies.length === 0) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="text-center py-12">
          <Building2 className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
            No Company Yet
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            Create your organization to get started with CyberLearn's security training platform
          </p>
          <button
            onClick={() => setIsCreateDialogOpen(true)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
          >
            <Plus className="w-5 h-5" />
            Create Your Organization
          </button>
        </div>

        <CreateCompanyDialog
          isOpen={isCreateDialogOpen}
          onClose={() => setIsCreateDialogOpen(false)}
          onSuccess={handleCreateSuccess}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Your Organizations</h2>
        <button
          onClick={() => setIsCreateDialogOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          Create New
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {companies.map((company) => (
          <button
            key={company.id}
            onClick={() => onSelectCompany(company)}
            className="text-left p-6 bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-lg hover:border-indigo-400 dark:hover:border-indigo-500 hover:shadow-lg dark:hover:shadow-lg/20 transition-all group"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/50 transition-colors">
                <Building2 className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors" />
            </div>
            <h3 className="font-bold text-slate-900 dark:text-white mb-1">
              {company.name}
            </h3>
            {company.industry && (
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                {company.industry}
              </p>
            )}
            <div className="flex gap-2 text-xs">
              {company.country && (
                <span className="px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded">
                  {company.country}
                </span>
              )}
              <span className="px-2 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 rounded">
                Click to manage
              </span>
            </div>
          </button>
        ))}
      </div>

      <CreateCompanyDialog
        isOpen={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        onSuccess={handleCreateSuccess}
      />
    </div>
  );
};

export default CompanySelector;
