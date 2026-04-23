import React, { useState, useEffect } from 'react';
import { permissionService } from '../services/permissionService';
import { Loader } from 'lucide-react';

// Lazy load components
const NewUserOnboarding = React.lazy(() => import('./NewUserOnboarding'));
const CompanyDashboard = React.lazy(() => import('./CompanyDashboard'));
const EmployeeDashboardLimited = React.lazy(() => import('./EmployeeDashboardLimited'));

export const DashboardRouter = () => {
  const [stage, setStage] = useState('loading');
  const [userCompany, setUserCompany] = useState(null);
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    const determineUserStage = async () => {
      try {
        const role = await permissionService.getUserRole();
        const company = await permissionService.getUserCompany();

        setUserRole(role);

        if (role === 'admin' && company) {
          setUserCompany(company);
          setStage('admin');
        } else if (role === 'employee') {
          setStage('employee');
        } else {
          setStage('onboarding');
        }
      } catch (error) {
        console.error('Error determining user stage:', error);
        setStage('onboarding');
      }
    };

    determineUserStage();
  }, []);

  if (stage === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader className="w-12 h-12 animate-spin text-indigo-600 mx-auto mb-3" />
          <p className="text-slate-600 dark:text-slate-400">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <React.Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <Loader className="w-12 h-12 animate-spin text-indigo-600 mx-auto mb-3" />
            <p className="text-slate-600 dark:text-slate-400">Loading...</p>
          </div>
        </div>
      }
    >
      {stage === 'onboarding' && <NewUserOnboarding />}
      {stage === 'admin' && userCompany && (
        <CompanyDashboard companyId={userCompany.id} companyName={userCompany.name} />
      )}
      {stage === 'employee' && <EmployeeDashboardLimited />}
    </React.Suspense>
  );
};

export default DashboardRouter;
