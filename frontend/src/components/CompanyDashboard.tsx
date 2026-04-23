import React, { useState, useEffect, useRef } from 'react';
import { Building2, Users, BookOpen, AlertTriangle, Zap, Award, Settings, BarChart3, UserPlus, UserCheck } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../services/supabaseClient';
import { companyService } from '../services/companyService';
import CompanyMembersPanel from './CompanyMembersPanel';
import AdminUserAssignment from './AdminUserAssignment';

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
  const [activePanel, setActivePanel] = useState('members');
  const managementSectionRef = useRef(null);

  const navigateTo = (path) => {
    window.location.assign(path);
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
      description: 'Create and deploy custom training content',
      icon: BookOpen,
      color: 'from-green-500 to-green-600',
      stat: stats.trainingModules,
      statLabel: 'Modules',
      action: () => navigateTo('/admin-training'),
      actionText: 'View'
    },
    {
      number: 4,
      title: 'Phishing Simulations',
      description: 'Test employee awareness with phishing campaigns',
      icon: AlertTriangle,
      color: 'from-orange-500 to-orange-600',
      stat: stats.phishingCampaigns,
      statLabel: 'Campaigns',
      action: () => navigateTo('/phishing-campaigns'),
      actionText: 'Launch'
    },
    {
      number: 5,
      title: 'Threat Reports',
      description: 'Monitor and respond to threat reports',
      icon: Zap,
      color: 'from-red-500 to-red-600',
      stat: stats.threatReports,
      statLabel: 'Reports',
      action: () => navigateTo('/admin-reports'),
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
      {/* Header */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">{companyName}</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={() => scrollToManagement('members')}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <UserPlus className="w-4 h-4" />
              Add Employee
            </button>
            <button
              onClick={() => navigateTo('/company-settings')}
              className="flex items-center gap-2 px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
            >
              <Settings className="w-4 h-4" />
              Settings
            </button>
          </div>
        </div>
        <p className="text-slate-600 dark:text-slate-400">
          6 services to manage your organization's cybersecurity training
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
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
            <div
              key={idx}
              className="bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-lg p-4 text-center hover:border-slate-300 dark:hover:border-slate-600 transition-colors"
            >
              <Icon className={`w-6 h-6 ${stat.color} mx-auto mb-2`} />
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{stat.value}</p>
              <p className="text-xs text-slate-600 dark:text-slate-400">{stat.label}</p>
            </div>
          );
        })}
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {services.map((service) => {
          const Icon = service.icon;
          return (
            <div
              key={service.number}
              className="bg-white dark:bg-slate-900 border dark:border-slate-700 rounded-lg overflow-hidden hover:shadow-lg dark:hover:shadow-lg/20 transition-all hover:border-slate-300 dark:hover:border-slate-600"
            >
              {/* Header with gradient */}
              <div className={`h-24 bg-gradient-to-br ${service.color} relative overflow-hidden`}>
                <div className="absolute inset-0 opacity-10">
                  <Icon className="w-full h-full absolute right-0 top-0 transform translate-x-1/3 -translate-y-1/3" />
                </div>
                <div className="relative p-6 flex items-end justify-between h-full">
                  <div>
                    <p className="text-white/80 text-xs font-semibold mb-1">Service {service.number}</p>
                    <h3 className="text-white font-bold">{service.title}</h3>
                  </div>
                  <div className="bg-white/20 backdrop-blur-sm p-2 rounded-lg">
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                <p className="text-slate-600 dark:text-slate-400 text-sm mb-4">
                  {service.description}
                </p>

                {/* Stat */}
                <div className="mb-6 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg text-center">
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">
                    {service.stat}
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    {service.statLabel}
                  </p>
                </div>

                {/* Action Button */}
                <button
                  onClick={service.action}
                  className={`w-full py-2 px-4 bg-gradient-to-r ${service.color} text-white rounded-lg hover:shadow-lg hover:shadow-indigo-500/50 transition-all font-medium text-sm`}
                >
                  {service.actionText}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div
        ref={managementSectionRef}
        className="bg-white dark:bg-slate-900 border dark:border-slate-700 rounded-lg p-6 space-y-6"
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
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                activePanel === 'members'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
              }`}
            >
              <UserPlus className="w-4 h-4" />
              Add Employees
            </button>
            <button
              onClick={() => setActivePanel('departments')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                activePanel === 'departments'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
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

      {/* Getting Started Guide */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
        <h3 className="font-bold text-blue-900 dark:text-blue-400 mb-3 flex items-center gap-2">
          <BarChart3 className="w-5 h-5" />
          Getting Started with CyberLearn
        </h3>
        <ol className="space-y-2 text-sm text-blue-800 dark:text-blue-300">
          <li className="flex gap-3">
            <span className="font-bold flex-shrink-0">1.</span>
            <span>Start with Company Profile - configure your departments and security policies</span>
          </li>
          <li className="flex gap-3">
            <span className="font-bold flex-shrink-0">2.</span>
            <span>Add employees through Employee Management and assign them to departments</span>
          </li>
          <li className="flex gap-3">
            <span className="font-bold flex-shrink-0">3.</span>
            <span>Create or assign Training Modules for your departments</span>
          </li>
          <li className="flex gap-3">
            <span className="font-bold flex-shrink-0">4.</span>
            <span>Launch Phishing Simulations to test employee awareness</span>
          </li>
          <li className="flex gap-3">
            <span className="font-bold flex-shrink-0">5.</span>
            <span>Monitor Threat Reports from your employees</span>
          </li>
          <li className="flex gap-3">
            <span className="font-bold flex-shrink-0">6.</span>
            <span>Issue Certificates to employees upon training completion</span>
          </li>
        </ol>
      </div>
    </div>
  );
};

export default CompanyDashboard;
