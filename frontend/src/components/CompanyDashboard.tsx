import React, { useState, useEffect, useRef } from 'react';
import { Building2, Users, BookOpen, AlertTriangle, Zap, Award, Settings, BarChart3, UserPlus, UserCheck, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../services/supabaseClient';
import { companyService } from '../services/companyService';
import { ensureDepartmentLearningModules } from '../services/trainingModuleService';
import DashboardTabs from './DashboardTabs';
import CompanyMembersPanel from './CompanyMembersPanel';
import AdminUserAssignment from './AdminUserAssignment';
import AdminReportsPanel from './AdminReportsPanel';
import CertificatesPanel from './CertificatesPanel';
import MyProfilePanel from './MyProfilePanel';
import { TrainingList } from '../TrainingList';
import { AdminTraining } from '../AdminTraining';

export const CompanyDashboard = ({ companyId, companyName }) => {
  const [stats, setStats] = useState({
    employees: 0,
    departments: 0,
    trainingModules: 0,
    phishingCampaigns: 0,
    threatReports: 0,
    certificates: 0
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [activePanel, setActivePanel] = useState('members');
  const [trainingPanel, setTrainingPanel] = useState<'learn' | 'analytics'>('learn');
  const [activeServiceTab, setActiveServiceTab] = useState(0);
  const [initializingTrainingModules, setInitializingTrainingModules] = useState(false);
  const [hasAttemptedAutoInit, setHasAttemptedAutoInit] = useState(false);
  const managementSectionRef = useRef(null);
  const trainingSectionRef = useRef(null);
  const reportsSectionRef = useRef(null);

  const navigateTo = (path) => {
    window.location.assign(path);
  };

  const openTab = (tabId) => {
    setActiveTab(tabId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollToManagement = (panel) => {
    setActivePanel(panel);
    requestAnimationFrame(() => {
      managementSectionRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    });
  };

  const scrollToTraining = (panel) => {
    setTrainingPanel(panel);
    requestAnimationFrame(() => {
      trainingSectionRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    });
  };

  const scrollToReports = () => {
    requestAnimationFrame(() => {
      reportsSectionRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    });
  };

  const loadStats = async () => {
    try {
      // Get departments
      const { count: departmentsCount } = await supabase
        .from('departments')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', companyId);

      const membersResult = await companyService.getCompanyMembers(companyId);
      const membersCount = membersResult.success ? (membersResult.data || []).length : 0;

      // Get training modules
      const { count: modulesCount } = await supabase
        .from('training_modules')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', companyId);

      // Get phishing campaigns
      const { count: campaignsCount } = await supabase
        .from('phishing_campaigns')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', companyId);

      // Get threat reports
      const { count: reportsCount } = await supabase
        .from('threat_reports')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', companyId);

      // Get certificates
      const { count: certsCount } = await supabase
        .from('certificates')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', companyId);

      setStats({
        employees: membersCount,
        departments: departmentsCount || 0,
        trainingModules: modulesCount || 0,
        phishingCampaigns: campaignsCount || 0,
        threatReports: reportsCount || 0,
        certificates: certsCount || 0
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (companyId) loadStats();
  }, [companyId]);

  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent).detail || {};
      const target = detail.target;

      if (target === 'training-learn') {
        setActiveTab('training');
        scrollToTraining('learn');
        return;
      }

      if (target === 'training-analytics') {
        setActiveTab('training');
        scrollToTraining('analytics');
        return;
      }

      if (target === 'team-members') {
        setActiveTab('team');
        scrollToManagement('members');
        return;
      }

      if (target === 'departments') {
        setActiveTab('team');
        scrollToManagement('departments');
        return;
      }

      if (target === 'reports') {
        setActiveTab('reports');
        scrollToReports();
        return;
      }

      if (target === 'certificates') {
        setActiveTab('certificates');
        return;
      }

      if (target === 'profile') {
        setActiveTab('profile');
        return;
      }

      if (target === 'dashboard-top') {
        setActiveTab('overview');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    };

    window.addEventListener('cyberlearn:navigate', handler as EventListener);
    return () => {
      window.removeEventListener('cyberlearn:navigate', handler as EventListener);
    };
  }, []);

  const initializeDepartmentModules = async () => {
    if (!companyId || initializingTrainingModules) {
      return;
    }

    setInitializingTrainingModules(true);
    try {
      const result = await ensureDepartmentLearningModules(companyId);
      if (result.createdDepartments > 0 || result.createdModules > 0) {
        toast.success(
          `Learning setup complete: ${result.createdDepartments} department(s), ${result.createdModules} module(s).`,
        );
      }
      await loadStats();
    } catch (error: any) {
      console.error('Failed to initialize department learning modules:', error);
      toast.error(error?.message || 'Failed to initialize department learning modules.');
    } finally {
      setInitializingTrainingModules(false);
      setHasAttemptedAutoInit(true);
    }
  };

  useEffect(() => {
    if (trainingPanel !== 'learn') return;
    if (!companyId) return;
    if (stats.trainingModules > 0) return;
    if (hasAttemptedAutoInit) return;
    if (initializingTrainingModules) return;
    void initializeDepartmentModules();
  }, [trainingPanel, companyId, stats.trainingModules, hasAttemptedAutoInit, initializingTrainingModules]);

  const services = [
    {
      number: 1,
      title: 'Company Profile',
      description: 'Configure departments and security policies',
      icon: Building2,
      color: 'from-blue-500 to-blue-600',
      stat: stats.departments,
      statLabel: 'Departments',
      action: () => navigateTo('/company-settings'),
      actionText: 'Configure'
    },
    {
      number: 2,
      title: 'Employee Management',
      description: 'Add, assign roles, and manage employees',
      icon: Users,
      color: 'from-purple-500 to-purple-600',
      stat: stats.employees,
      statLabel: 'Employees',
      action: () => scrollToManagement('members'),
      actionText: 'Manage'
    },
    {
      number: 3,
      title: 'Training Modules',
      description: 'Create department-based training content',
      icon: BookOpen,
      color: 'from-green-500 to-green-600',
      stat: stats.trainingModules,
      statLabel: 'Modules',
      action: () => scrollToTraining('learn'),
      actionText: 'Learn'
    },
    {
      number: 4,
      title: 'Security Drills',
      description: 'Review simulation readiness and vigilance tracking',
      icon: AlertTriangle,
      color: 'from-orange-500 to-orange-600',
      stat: stats.phishingCampaigns,
      statLabel: 'Campaigns',
      action: () => navigateTo('/phishing-campaigns'),
      actionText: 'Review'
    },
    {
      number: 5,
      title: 'Threat Reports',
      description: 'Monitor and respond to threat reports',
      icon: Zap,
      color: 'from-red-500 to-red-600',
      stat: stats.threatReports,
      statLabel: 'Reports',
      action: () => scrollToReports(),
      actionText: 'Review'
    },
    {
      number: 6,
      title: 'Certificates',
      description: 'Issue and track digital certificates',
      icon: Award,
      color: 'from-indigo-500 to-indigo-600',
      stat: stats.certificates,
      statLabel: 'Issued',
      action: () => navigateTo('/certificates'),
      actionText: 'View'
    }
  ];

  const dashboardTabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'team', label: 'Team', icon: Users, badge: stats.employees },
    { id: 'training', label: 'Training', icon: BookOpen, badge: stats.trainingModules },
    { id: 'reports', label: 'Reports', icon: Zap, badge: stats.threatReports },
    { id: 'certificates', label: 'Certificates', icon: Award, badge: stats.certificates },
    { id: 'profile', label: 'My Profile', icon: Settings },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-3"></div>
          <p className="text-slate-600 dark:text-slate-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between mb-2">
          <div>
            <p className="hidden md:block text-xs font-semibold uppercase tracking-[0.24em] text-indigo-600 dark:text-indigo-300">
              Admin workspace
            </p>
            <h1 className="mt-0 md:mt-2 text-3xl font-bold text-slate-900 dark:text-white">{companyName}</h1>
            <p className="hidden md:block mt-2 text-slate-600 dark:text-slate-400">
              Move between your team, training, reports, certificates, and profile without leaving the page.
            </p>
          </div>
          <div className="hidden md:flex flex-wrap gap-2">
            <button
              onClick={() => {
                openTab('team');
                setActivePanel('members');
              }}
              className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-white transition-colors hover:bg-indigo-700"
            >
              <UserPlus className="w-4 h-4" />
              Add Employee
            </button>
            <button
              onClick={() => openTab('profile')}
              className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              <Settings className="w-4 h-4" />
              My Profile
            </button>
          </div>
        </div>
      </div>

      <DashboardTabs tabs={dashboardTabs} activeTab={activeTab} onChange={openTab} />

      {activeTab === 'overview' && (
        <div className="space-y-8">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
            {[
              { label: 'Employees', value: stats.employees, icon: Users, color: 'text-purple-600' },
              { label: 'Departments', value: stats.departments, icon: Building2, color: 'text-blue-600' },
              { label: 'Modules', value: stats.trainingModules, icon: BookOpen, color: 'text-green-600' },
              { label: 'Campaigns', value: stats.phishingCampaigns, icon: AlertTriangle, color: 'text-orange-600' },
              { label: 'Reports', value: stats.threatReports, icon: Zap, color: 'text-red-600' },
              { label: 'Certificates', value: stats.certificates, icon: Award, color: 'text-indigo-600' }
            ].map((stat, idx) => {
              const Icon = stat.icon;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    if (stat.label === 'Certificates') openTab('certificates');
                    else if (stat.label === 'Reports') openTab('reports');
                    else if (stat.label === 'Modules') openTab('training');
                    else if (stat.label === 'Employees' || stat.label === 'Departments') openTab('team');
                    else openTab('overview');
                  }}
                  className="rounded-2xl border border-slate-200 bg-white p-4 text-center transition-all hover:border-slate-300 hover:shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:hover:border-slate-600"
                >
                  <Icon className={`w-6 h-6 ${stat.color} mx-auto mb-2`} />
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">{stat.value}</p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">{stat.label}</p>
                </button>
              );
            })}
          </div>

          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Services & Workspace</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 auto-rows-max">
              {services.map((service, idx) => {
                const Icon = service.icon;
                const isWide = idx === 1 || idx === 4;
                const isTall = idx === 0 || idx === 2;
                
                return (
                  <div
                    key={idx}
                    onClick={() => setActiveServiceTab(idx)}
                    className={`group relative overflow-hidden rounded-3xl border border-slate-200 bg-white transition-all cursor-pointer hover:shadow-xl dark:border-slate-700 dark:bg-slate-900 ${
                      activeServiceTab === idx ? 'ring-2 ring-indigo-600 dark:ring-indigo-400' : ''
                    } ${isWide ? 'lg:col-span-2' : ''} ${isTall ? 'md:row-span-2' : ''}`}
                  >
                    {/* Background Gradient Header */}
                    <div className={`relative h-32 bg-gradient-to-br ${service.color} overflow-hidden group-hover:scale-105 transition-transform`}>
                      <div className="absolute inset-0 opacity-20">
                        <Icon className="absolute -right-4 -top-4 h-24 w-24" />
                      </div>
                      <div className="relative flex h-full items-end p-4">
                        <div>
                          <p className="text-xs font-semibold text-white/70 uppercase tracking-wider">Service {idx + 1}</p>
                          <h3 className="text-lg font-bold text-white">{service.title}</h3>
                        </div>
                      </div>
                    </div>

                    {/* Content Area */}
                    <div className="p-6 space-y-4">
                      <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{service.description}</p>
                      
                      <div className="rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-700 p-4 text-center">
                        <p className="text-3xl font-bold text-slate-900 dark:text-white">{service.stat}</p>
                        <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mt-1">{service.statLabel}</p>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          service.action();
                        }}
                        className={`w-full rounded-xl bg-gradient-to-r ${service.color} px-4 py-3 text-sm font-semibold text-white transition-all hover:shadow-lg active:scale-95`}
                      >
                        {service.actionText}
                      </button>
                    </div>

                    {/* Hover Indicator */}
                    <div className="absolute top-0 right-0 w-12 h-12 bg-gradient-to-br from-white/20 to-transparent rounded-bl-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-3xl border border-blue-200 bg-blue-50 p-6 dark:border-blue-800 dark:bg-blue-900/20">
            <h3 className="mb-3 flex items-center gap-2 font-bold text-blue-900 dark:text-blue-400">
              <BarChart3 className="h-5 w-5" />
              Getting Started with CyberLearn
            </h3>
            <ol className="space-y-2 text-sm text-blue-800 dark:text-blue-300">
              <li className="flex gap-3">
                <span className="flex-shrink-0 font-bold">1.</span>
                <span>Start with Company Profile to keep your account details current.</span>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 font-bold">2.</span>
                <span>Add employees through Team management and assign them to departments.</span>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 font-bold">3.</span>
                <span>Open Training to create or review learning modules and awareness drills.</span>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 font-bold">4.</span>
                <span>Monitor Threat Reports and keep an eye on issued Certificates.</span>
              </li>
            </ol>
          </div>
        </div>
      )}

      {activeTab === 'team' && (
        <div
          ref={managementSectionRef}
          className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-900"
        >
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Employee Management</h2>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Add existing CyberLearn users, place them in departments, and unlock training access.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setActivePanel('members')}
                className={`flex items-center gap-2 rounded-xl px-4 py-2 transition-colors ${
                  activePanel === 'members'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                }`}
              >
                <UserPlus className="w-4 h-4" />
                Add Employees
              </button>
              <button
                onClick={() => setActivePanel('departments')}
                className={`flex items-center gap-2 rounded-xl px-4 py-2 transition-colors ${
                  activePanel === 'departments'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                }`}
              >
                <UserCheck className="w-4 h-4" />
                Assign Departments
              </button>
            </div>
          </div>

          {activePanel === 'members' ? (
            <CompanyMembersPanel companyId={companyId} onMembersChanged={loadStats} />
          ) : (
            <AdminUserAssignment companyId={companyId} onAssignmentComplete={loadStats} />
          )}
        </div>
      )}

      {activeTab === 'training' && (
        <div
          ref={trainingSectionRef}
          className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-900"
        >
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Training Workspace</h2>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Learn modules directly and monitor team completion and quiz scores.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setTrainingPanel('learn')}
                className={`flex items-center gap-2 rounded-xl px-4 py-2 transition-colors ${
                  trainingPanel === 'learn'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                }`}
              >
                <BookOpen className="w-4 h-4" />
                Learn Modules
              </button>
              <button
                onClick={() => setTrainingPanel('analytics')}
                className={`flex items-center gap-2 rounded-xl px-4 py-2 transition-colors ${
                  trainingPanel === 'analytics'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                }`}
              >
                <BarChart3 className="w-4 h-4" />
                Team Analytics
              </button>
              {trainingPanel === 'learn' && (
                <button
                  onClick={() => void initializeDepartmentModules()}
                  disabled={initializingTrainingModules}
                  className="rounded-xl border border-indigo-300 px-4 py-2 text-indigo-700 transition-colors hover:bg-indigo-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-indigo-700 dark:text-indigo-300 dark:hover:bg-indigo-900/20"
                >
                  {initializingTrainingModules ? 'Preparing Modules...' : 'Create Department Modules'}
                </button>
              )}
            </div>
          </div>

          {trainingPanel === 'learn' ? <TrainingList /> : <AdminTraining />}
        </div>
      )}

      {activeTab === 'reports' && (
        <div
          ref={reportsSectionRef}
          className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-900"
        >
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Threat Report Center</h2>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Review employee reports, reply directly, and track report resolution status.
              </p>
            </div>
            <button
              onClick={() => scrollToReports()}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <MessageSquare className="w-4 h-4" />
              Open Reports
            </button>
          </div>

          <AdminReportsPanel companyId={companyId} />
        </div>
      )}

      {activeTab === 'certificates' && (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-900">
          <CertificatesPanel />
        </div>
      )}

      {activeTab === 'profile' && (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-900">
          <MyProfilePanel />
        </div>
      )}
    </div>
  );
};

export default CompanyDashboard;
