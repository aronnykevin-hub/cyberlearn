import React, { useState, useEffect } from 'react';
import { BookOpen, AlertTriangle, Award, BarChart3, Loader, ArrowLeft, PlayCircle } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../services/supabaseClient';
import { TrainingList } from '../TrainingList';

export const EmployeeDashboardLimited = () => {
  const [stats, setStats] = useState({
    assignedModules: 0,
    completedModules: 0,
    myReports: 0,
    myCertificates: 0
  });
  const [departmentInfo, setDepartmentInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [activeView, setActiveView] = useState<'overview' | 'training'>('overview');

  useEffect(() => {
    const loadData = async () => {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        setUser(authUser);

        if (!authUser) return;

        // Get user profile with department
        const { data: profile } = await supabase
          .from('user_profiles')
          .select(`
            *,
            departments:department_id (
              id,
              name,
              description,
              companies:company_id (
                id,
                name
              )
            )
          `)
          .eq('user_id', authUser.id)
          .single();

        if (profile?.departments) {
          setDepartmentInfo(profile.departments);
        }

        // Get training modules for this user's department
        if (profile?.department_id) {
          const { data: modules, count: moduleCount } = await supabase
            .from('training_modules')
            .select('id', { count: 'exact' })
            .eq('is_active', true)
            .or(`target_department_id.is.null,target_department_id.eq.${profile.department_id}`);

          // Get completed modules
          const { data: completed, count: completedCount } = await supabase
            .from('training_progress')
            .select('id', { count: 'exact' })
            .eq('user_id', authUser.id)
            .eq('status', 'completed');

          // Get my reports
          const { data: myReports, count: reportsCount } = await supabase
            .from('threat_reports')
            .select('id', { count: 'exact' })
            .eq('user_id', authUser.id);

          // Get my certificates
          const { data: myCerts, count: certsCount } = await supabase
            .from('certificates')
            .select('id', { count: 'exact' })
            .eq('user_id', authUser.id);

          setStats({
            assignedModules: moduleCount || 0,
            completedModules: completedCount || 0,
            myReports: reportsCount || 0,
            myCertificates: certsCount || 0
          });
        }
      } catch (error) {
        console.error('Error loading dashboard:', error);
        toast.error('Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <Loader className="w-8 h-8 animate-spin text-indigo-600 mx-auto mb-2" />
          <p className="text-slate-600 dark:text-slate-400">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (activeView === 'training') {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Training Modules</h1>
            <p className="text-slate-600 dark:text-slate-400 text-sm">Complete each module quiz to finish your training.</p>
          </div>
          <button
            onClick={() => setActiveView('overview')}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
        </div>
        <TrainingList />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
          Welcome, {user?.user_metadata?.full_name || 'Employee'}
        </h1>
        <p className="text-slate-600 dark:text-slate-400">
          Your cybersecurity training dashboard
        </p>
      </div>

      {/* Department Info */}
      {departmentInfo && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
          <h3 className="font-semibold text-blue-900 dark:text-blue-400 mb-2">
            Department Assignment
          </h3>
          <p className="text-blue-800 dark:text-blue-300">
            <span className="font-bold">{departmentInfo.name}</span>
            {departmentInfo.companies && (
              <>
                {' '}at <span className="font-bold">{departmentInfo.companies.name}</span></>
            )}
          </p>
          {departmentInfo.description && (
            <p className="text-sm text-blue-700 dark:text-blue-400 mt-2">
              {departmentInfo.description}
            </p>
          )}
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            label: 'Assigned Training',
            value: stats.assignedModules,
            icon: BookOpen,
            color: 'text-blue-600',
            bgColor: 'bg-blue-50 dark:bg-blue-900/20'
          },
          {
            label: 'Completed',
            value: stats.completedModules,
            icon: BarChart3,
            color: 'text-green-600',
            bgColor: 'bg-green-50 dark:bg-green-900/20'
          },
          {
            label: 'My Reports',
            value: stats.myReports,
            icon: AlertTriangle,
            color: 'text-orange-600',
            bgColor: 'bg-orange-50 dark:bg-orange-900/20'
          },
          {
            label: 'Certificates',
            value: stats.myCertificates,
            icon: Award,
            color: 'text-purple-600',
            bgColor: 'bg-purple-50 dark:bg-purple-900/20'
          }
        ].map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div
              key={idx}
              className={`${stat.bgColor} border border-slate-200 dark:border-slate-700 rounded-lg p-4`}
            >
              <Icon className={`w-6 h-6 ${stat.color} mb-2`} />
              <p className="text-2xl font-bold text-slate-900 dark:text-white">
                {stat.value}
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                {stat.label}
              </p>
            </div>
          );
        })}
      </div>

      <div className="bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-lg p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white">Start Learning</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">Open your assigned modules and complete the quiz in each one.</p>
          </div>
          <button
            onClick={() => setActiveView('training')}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <PlayCircle className="w-4 h-4" />
            Open Training
          </button>
        </div>
      </div>

      {/* Available Features */}
      <div className="bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-lg p-6">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
          What You Can Do
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            {
              title: '📚 View Training',
              description: 'Access training modules assigned to your department'
            },
            {
              title: '⚠️ Report Threats',
              description: 'Submit threat reports and security concerns'
            },
            {
              title: '📊 My Reports',
              description: 'View the threat reports you have submitted'
            },
            {
              title: '🎓 My Certificates',
              description: 'View certificates you have earned'
            }
          ].map((feature, idx) => (
            <div
              key={idx}
              className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg border dark:border-slate-600"
            >
              <h4 className="font-semibold text-slate-900 dark:text-white mb-1">
                {feature.title}
              </h4>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Restricted Features Info */}
      <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-6">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
          What You Cannot Do
        </h3>
        <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
          <li className="flex gap-2">
            <span className="text-red-500">✗</span>
            <span>View other employees' reports or progress</span>
          </li>
          <li className="flex gap-2">
            <span className="text-red-500">✗</span>
            <span>Create or manage training modules</span>
          </li>
          <li className="flex gap-2">
            <span className="text-red-500">✗</span>
            <span>Launch phishing campaigns</span>
          </li>
          <li className="flex gap-2">
            <span className="text-red-500">✗</span>
            <span>Access admin controls or settings</span>
          </li>
        </ul>
        <p className="text-xs text-slate-600 dark:text-slate-400 mt-4">
          These features are only available to administrators
        </p>
      </div>
    </div>
  );
};

export default EmployeeDashboardLimited;
