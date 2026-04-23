import React, { useState, useEffect } from 'react';
import { accessControlService } from '../services/companyService';
import { AlertCircle, Lock } from 'lucide-react';

export const TrainingAccessGuard = ({ children, fallback = null }) => {
  const [hasAccess, setHasAccess] = useState(null);
  const [departmentInfo, setDepartmentInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAccess = async () => {
      const accessResult = await accessControlService.hasTrainingAccess();
      setHasAccess(accessResult.hasAccess);

      if (accessResult.hasAccess) {
        const deptResult = await accessControlService.getUserDepartmentInfo();
        if (deptResult.success) {
          setDepartmentInfo(deptResult.data.department);
        }
      }

      setLoading(false);
    };

    checkAccess();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-3"></div>
          <p className="text-slate-600 dark:text-slate-400">Checking access...</p>
        </div>
      </div>
    );
  }

  if (!hasAccess) {
    return fallback || (
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
        <div className="flex items-start gap-4">
          <AlertCircle className="w-6 h-6 text-yellow-600 dark:text-yellow-500 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-yellow-900 dark:text-yellow-400 mb-1">
              Access Restricted
            </h3>
            <p className="text-yellow-800 dark:text-yellow-300 text-sm mb-3">
              You don't have access to this feature yet. To use CyberLearn training services, an administrator must assign you to a department.
            </p>
            <p className="text-sm text-yellow-700 dark:text-yellow-400">
              <strong>Next steps:</strong>
            </p>
            <ul className="text-sm text-yellow-700 dark:text-yellow-400 list-disc list-inside mt-2 space-y-1">
              <li>If you have a company, ask your company administrator to assign you to a department</li>
              <li>If you don't have a company, create one in Settings first</li>
              <li>The administrator will then assign you to a department to unlock training features</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {departmentInfo && (
        <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg text-sm text-blue-800 dark:text-blue-300">
          <span className="font-medium">Department:</span> {departmentInfo.name}
        </div>
      )}
      {children}
    </>
  );
};

export default TrainingAccessGuard;
