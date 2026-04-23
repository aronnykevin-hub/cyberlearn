import React, { useState, useEffect } from 'react';
import { Building2, ArrowRight, CheckCircle, Lock } from 'lucide-react';
import { permissionService } from '../services/permissionService';
import CreateCompanyDialog from './CreateCompanyDialog';
import CompanyDashboard from './CompanyDashboard';

export const NewUserOnboarding = () => {
  const [stage, setStage] = useState('loading');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [userCompany, setUserCompany] = useState(null);

  useEffect(() => {
    const checkUserStage = async () => {
      const permissions = await permissionService.getUserPermissions();
      const company = await permissionService.getUserCompany();

      if (company) {
        setUserCompany(company);
        setStage('dashboard');
      } else {
        setStage('onboarding');
      }
    };

    checkUserStage();
  }, []);

  const handleCreateSuccess = async () => {
    const company = await permissionService.getUserCompany();
    if (company) {
      setUserCompany(company);
      setStage('dashboard');
    }
  };

  if (stage === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-3"></div>
          <p className="text-slate-600 dark:text-slate-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (stage === 'dashboard' && userCompany) {
    return <CompanyDashboard companyId={userCompany.id} companyName={userCompany.name} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Welcome Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 dark:bg-indigo-900/30 rounded-full mb-4">
            <Building2 className="w-8 h-8 text-indigo-600" />
          </div>
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-3">
            Welcome to CyberLearn
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400">
            Secure Your Organization with Comprehensive Cybersecurity Training
          </p>
        </div>

        {/* What's Available */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg border dark:border-slate-700 overflow-hidden mb-8">
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-6 text-white">
            <h2 className="text-2xl font-bold">Get Started in 3 Steps</h2>
          </div>

          {/* Content */}
          <div className="p-8">
            <div className="space-y-6">
              {/* Step 1 - Active */}
              <div className="flex gap-6 pb-6 border-b dark:border-slate-700">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                    Step 1: Create Your Organization
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400 mb-4">
                    Set up your company profile, configure departments, and define your security policies. You'll become an admin immediately.
                  </p>
                  <button
                    onClick={() => setIsCreateDialogOpen(true)}
                    className="inline-flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                  >
                    <ArrowRight className="w-4 h-4" />
                    Create Organization Now
                  </button>
                </div>
              </div>

              {/* Step 2 - Locked */}
              <div className="flex gap-6 pb-6 border-b dark:border-slate-700 opacity-60">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center w-12 h-12 rounded-full bg-slate-200 dark:bg-slate-700">
                    <Lock className="w-6 h-6 text-slate-500" />
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                    Step 2: Add Employees & Assign Roles
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400">
                    Import employees who've already signed up and assign them to departments. They'll gain access to training immediately.
                  </p>
                  <span className="inline-block mt-4 px-3 py-1 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400 text-sm rounded-full">
                    Available after creating organization
                  </span>
                </div>
              </div>

              {/* Step 3 - Locked */}
              <div className="flex gap-6 opacity-60">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center w-12 h-12 rounded-full bg-slate-200 dark:bg-slate-700">
                    <Lock className="w-6 h-6 text-slate-500" />
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                    Step 3: Unlock All Features
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400">
                    Deploy training modules, launch phishing simulations, monitor threat reports, and issue certificates - all from your admin dashboard.
                  </p>
                  <span className="inline-block mt-4 px-3 py-1 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400 text-sm rounded-full">
                    Available after creating organization
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Features Overview */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg border dark:border-slate-700 overflow-hidden">
          <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-8 py-6 text-white">
            <h2 className="text-2xl font-bold">What You'll Get As Admin</h2>
          </div>

          <div className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                {
                  title: 'Full Dashboard Access',
                  description: 'Manage all aspects of your organization from one central dashboard'
                },
                {
                  title: 'Employee Management',
                  description: 'Add, assign roles, and manage all employees in your company'
                },
                {
                  title: 'Training Control',
                  description: 'Create and deploy custom training modules for your departments'
                },
                {
                  title: 'Security Testing',
                  description: 'Launch phishing simulations to test employee awareness'
                },
                {
                  title: 'Threat Monitoring',
                  description: 'Receive and manage all threat reports with full analytics'
                },
                {
                  title: 'Certificates',
                  description: 'Auto-issue digital certificates upon training completion'
                }
              ].map((feature, idx) => (
                <div key={idx} className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg border dark:border-slate-600">
                  <h3 className="font-semibold text-slate-900 dark:text-white mb-2">
                    ✓ {feature.title}
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="mt-12 text-center">
          <button
            onClick={() => setIsCreateDialogOpen(true)}
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:shadow-lg hover:shadow-indigo-500/50 transition-all font-bold text-lg"
          >
            <Building2 className="w-6 h-6" />
            Create Your Organization
          </button>
          <p className="text-slate-600 dark:text-slate-400 mt-4">
            Takes less than 2 minutes to get started
          </p>
        </div>
      </div>

      <CreateCompanyDialog
        isOpen={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        onSuccess={handleCreateSuccess}
      />
    </div>
  );
};

export default NewUserOnboarding;
