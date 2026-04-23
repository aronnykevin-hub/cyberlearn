import React, { useState, useEffect } from 'react';
import { permissionService } from '../services/permissionService';
import { AlertCircle, Lock } from 'lucide-react';

export const PermissionGuard = ({ 
  children, 
  permission,
  fallback = null,
  showMessage = true 
}) => {
  const [hasAccess, setHasAccess] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkPermission = async () => {
      const can = await permissionService.can(permission);
      setHasAccess(can);
      setLoading(false);
    };

    checkPermission();
  }, [permission]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-2"></div>
          <p className="text-slate-600 dark:text-slate-400">Checking access...</p>
        </div>
      </div>
    );
  }

  if (!hasAccess) {
    if (fallback) return fallback;

    if (!showMessage) return null;

    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
        <div className="flex items-start gap-4">
          <Lock className="w-6 h-6 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-red-900 dark:text-red-400 mb-1">
              Access Restricted
            </h3>
            <p className="text-red-800 dark:text-red-300 text-sm">
              You don't have permission to access this feature. Only administrators can use this feature.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return children;
};

// Convenience hook for checking permissions in components
export const usePermission = (permission) => {
  const [hasAccess, setHasAccess] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkPermission = async () => {
      const can = await permissionService.can(permission);
      setHasAccess(can);
      setLoading(false);
    };

    checkPermission();
  }, [permission]);

  return { hasAccess, loading };
};

export default PermissionGuard;
