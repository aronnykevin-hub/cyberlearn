import React, { useEffect, useState } from 'react';
import { AlertTriangle, ArrowLeft, Award, BarChart3, BookOpen, Loader, PlayCircle, UserCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../services/supabaseClient';
import { TrainingList } from '../TrainingList';
import EmployeeReportsPanel from './EmployeeReportsPanel';
import DashboardTabs from './DashboardTabs';
import CertificatesPanel from './CertificatesPanel';
import MyProfilePanel from './MyProfilePanel';
import {
  getCyberlearnHistoryState,
  pushCyberlearnHistoryState,
  replaceCyberlearnHistoryState,
} from '../lib/navigationHistory';

type DashboardView = 'overview' | 'training' | 'reports' | 'certificates' | 'profile';
type EmployeeHistoryState = {
  view: DashboardView;
};

export const EmployeeDashboardLimited = () => {
  const [stats, setStats] = useState({
    assignedModules: 0,
    completedModules: 0,
    myReports: 0,
    myCertificates: 0,
  });
  const [progressRows, setProgressRows] = useState<any[]>([]);
  const [departmentInfo, setDepartmentInfo] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any | null>(null);
  const [activeView, setActiveView] = useState<DashboardView>('overview');

  const openView = (view: DashboardView, historyMode: 'push' | 'replace' = 'push') => {
    const nextState: EmployeeHistoryState = { view };
    if (historyMode === 'push') {
      pushCyberlearnHistoryState(nextState);
    } else {
      replaceCyberlearnHistoryState(nextState);
    }

    setActiveView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        const {
          data: { user: authUser },
        } = await supabase.auth.getUser();
        setUser(authUser);

        if (!authUser) return;

        const { data: profile } = await supabase
          .from('user_profiles')
          .select(
            `
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
          `,
          )
          .eq('user_id', authUser.id)
          .single();

        if (profile?.departments) {
          setDepartmentInfo(profile.departments);
        }

        if (profile?.department_id) {
          const [{ count: moduleCount }, { count: completedCount }, { count: reportsCount }, { count: certsCount }, progressResult] =
            await Promise.all([
              supabase
                .from('training_modules')
                .select('id', { count: 'exact', head: true })
                .eq('is_active', true)
                .or(`target_department_id.is.null,target_department_id.eq.${profile.department_id}`),
              supabase
                .from('training_progress')
                .select('id', { count: 'exact', head: true })
                .eq('user_id', authUser.id)
                .eq('status', 'completed'),
              supabase
                .from('threat_reports')
                .select('id', { count: 'exact', head: true })
                .eq('reporter_id', authUser.id),
              supabase
                .from('certificates')
                .select('id', { count: 'exact', head: true })
                .eq('user_id', authUser.id),
              supabase
                .from('training_progress')
                .select(
                  `
                  id,
                  module_id,
                  status,
                  score,
                  current_slide,
                  completed_at,
                  updated_at,
                  training_modules!inner (
                    id,
                    title,
                    passing_score
                  )
                `,
                )
                .eq('user_id', authUser.id)
                .order('updated_at', { ascending: false }),
            ]);

          if (progressResult.error) {
            throw progressResult.error;
          }

          setStats({
            assignedModules: moduleCount || 0,
            completedModules: completedCount || 0,
            myReports: reportsCount || 0,
            myCertificates: certsCount || 0,
          });
          setProgressRows(progressResult.data || []);
        }
      } catch (error) {
        console.error('Error loading employee dashboard:', error);
        toast.error('Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    };

    void loadData();
  }, []);

  useEffect(() => {
    replaceCyberlearnHistoryState<EmployeeHistoryState>({ view: 'overview' });

    const handlePopState = () => {
      const state = getCyberlearnHistoryState<EmployeeHistoryState>();
      setActiveView(state?.view ?? 'overview');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent).detail || {};
      const target = detail.target;

      if (target === 'training-learn') {
        openView('training');
        return;
      }

      if (target === 'reports') {
        openView('reports');
        return;
      }

      if (target === 'certificates') {
        openView('certificates');
        return;
      }

      if (target === 'profile') {
        openView('profile');
        return;
      }

      if (target === 'dashboard-top') {
        openView('overview');
      }
    };

    window.addEventListener('cyberlearn:navigate', handler as EventListener);
    return () => {
      window.removeEventListener('cyberlearn:navigate', handler as EventListener);
    };
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

  const dashboardTabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'training', label: 'Training', icon: BookOpen, badge: stats.assignedModules },
    { id: 'reports', label: 'Reports', icon: AlertTriangle, badge: stats.myReports },
    { id: 'certificates', label: 'Certificates', icon: Award, badge: stats.myCertificates },
    { id: 'profile', label: 'My Profile', icon: UserCircle2 },
  ];

  if (activeView === 'training') {
    return (
      <div className="space-y-6">
        <DashboardTabs tabs={dashboardTabs} activeTab={activeView} onChange={(tabId) => openView(tabId as DashboardView)} />
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Training Modules</h1>
            <p className="text-slate-600 dark:text-slate-400 text-sm">
              Complete each module quiz to finish your training and earn certificates.
            </p>
          </div>
          <button
            onClick={() => window.history.back()}
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

  if (activeView === 'reports') {
    return (
      <div className="space-y-6">
        <DashboardTabs tabs={dashboardTabs} activeTab={activeView} onChange={(tabId) => openView(tabId as DashboardView)} />
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Threat Reports</h1>
            <p className="text-slate-600 dark:text-slate-400 text-sm">Submit new reports and track admin replies.</p>
          </div>
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
        </div>
        <EmployeeReportsPanel />
      </div>
    );
  }

  if (activeView === 'certificates') {
    return (
      <div className="space-y-6">
        <DashboardTabs tabs={dashboardTabs} activeTab={activeView} onChange={(tabId) => openView(tabId as DashboardView)} />
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Certificates</h1>
            <p className="text-slate-600 dark:text-slate-400 text-sm">All of your issued training certificates from Supabase.</p>
          </div>
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
        </div>
        <CertificatesPanel />
      </div>
    );
  }

  if (activeView === 'profile') {
    return (
      <div className="space-y-6">
        <DashboardTabs tabs={dashboardTabs} activeTab={activeView} onChange={(tabId) => openView(tabId as DashboardView)} />
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">My Profile</h1>
            <p className="text-slate-600 dark:text-slate-400 text-sm">Keep your account details and contact information current.</p>
          </div>
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
        </div>
        <MyProfilePanel />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <DashboardTabs tabs={dashboardTabs} activeTab={activeView} onChange={(tabId) => openView(tabId as DashboardView)} />
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
          Welcome, {user?.user_metadata?.full_name || 'Employee'}
        </h1>
        <p className="text-slate-600 dark:text-slate-400">Your cybersecurity training dashboard</p>
      </div>

      {departmentInfo && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
          <h3 className="font-semibold text-blue-900 dark:text-blue-400 mb-2">Department Assignment</h3>
          <p className="text-blue-800 dark:text-blue-300">
            <span className="font-bold">{departmentInfo.name}</span>
            {departmentInfo.companies?.name ? (
              <>
                {' '}
                at <span className="font-bold">{departmentInfo.companies.name}</span>
              </>
            ) : null}
          </p>
          {departmentInfo.description ? (
            <p className="text-sm text-blue-700 dark:text-blue-400 mt-2">{departmentInfo.description}</p>
          ) : null}
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            label: 'Assigned Training',
            value: stats.assignedModules,
            icon: BookOpen,
            color: 'text-blue-600',
            bgColor: 'bg-blue-50 dark:bg-blue-900/20',
          },
          {
            label: 'Completed',
            value: stats.completedModules,
            icon: BarChart3,
            color: 'text-green-600',
            bgColor: 'bg-green-50 dark:bg-green-900/20',
          },
          {
            label: 'My Reports',
            value: stats.myReports,
            icon: AlertTriangle,
            color: 'text-orange-600',
            bgColor: 'bg-orange-50 dark:bg-orange-900/20',
          },
          {
            label: 'Certificates',
            value: stats.myCertificates,
            icon: Award,
            color: 'text-purple-600',
            bgColor: 'bg-purple-50 dark:bg-purple-900/20',
          },
        ].map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div key={idx} className={`${stat.bgColor} border border-slate-200 dark:border-slate-700 rounded-lg p-4`}>
              <Icon className={`w-6 h-6 ${stat.color} mb-2`} />
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{stat.value}</p>
              <p className="text-xs text-slate-600 dark:text-slate-400">{stat.label}</p>
            </div>
          );
        })}
      </div>

      <div className="bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-lg p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white">Start Learning and Reporting</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Open training modules, finish quizzes, and report suspicious activity to admins.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => openView('training')}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <PlayCircle className="w-4 h-4" />
              Open Training
            </button>
            <button
              onClick={() => openView('reports')}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <AlertTriangle className="w-4 h-4" />
              Open Reports
            </button>
            <button
              onClick={() => openView('certificates')}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 border border-indigo-200 dark:border-indigo-700 text-indigo-700 dark:text-indigo-300 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
            >
              <Award className="w-4 h-4" />
              Certificates
            </button>
            <button
              onClick={() => openView('profile')}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              My Profile
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-lg p-6">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">My Learning Progress</h3>
        {progressRows.length === 0 ? (
          <p className="text-sm text-slate-600 dark:text-slate-400">
            No progress records yet. Start a module to begin tracking.
          </p>
        ) : (
          <div className="space-y-2">
            {progressRows.slice(0, 8).map((row) => {
              const moduleTitle = row.training_modules?.title || 'Training Module';
              const score = row.score ?? null;
              const passingScore = row.training_modules?.passing_score ?? 70;
              return (
                <div
                  key={row.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{moduleTitle}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {String(row.status || 'not_started').replace('_', ' ')} · Updated{' '}
                      {new Date(row.updated_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    {score !== null ? (
                      <p
                        className={`text-sm font-semibold ${
                          score >= passingScore ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'
                        }`}
                      >
                        {score}%
                      </p>
                    ) : (
                      <p className="text-xs text-slate-500 dark:text-slate-400">No quiz score</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-lg p-6">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">What You Can Do</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            {
              title: 'View Training',
              description: 'Access learning modules assigned to your department.',
            },
            {
              title: 'Report Threats',
              description: 'Submit threat reports that are visible to admins only.',
            },
            {
              title: 'Track Report Replies',
              description: 'Read admin responses and follow report status updates.',
            },
            {
              title: 'Earn Certificates',
              description: 'Complete quizzes to receive certificates automatically.',
            },
          ].map((feature) => (
            <div
              key={feature.title}
              className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-600"
            >
              <h4 className="font-semibold text-slate-900 dark:text-white mb-1">{feature.title}</h4>
              <p className="text-sm text-slate-600 dark:text-slate-400">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default EmployeeDashboardLimited;
