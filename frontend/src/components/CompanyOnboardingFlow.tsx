import React, { useState } from 'react';
import { Building2, Users, BookOpen, AlertTriangle, Zap, Award } from 'lucide-react';

export const CompanyOnboardingFlow = ({ companyId, companyName }) => {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      number: 1,
      title: 'Admin Creates Company Profile',
      description: 'Set up your organization, configure departments, and define security policies',
      icon: Building2,
      features: [
        'Configure departments',
        'Set security policies',
        'Invite team members'
      ],
      color: 'from-blue-500 to-blue-600'
    },
    {
      number: 2,
      title: 'Add Employees & Assign Roles',
      description: 'Import employees who\'ve already signed up and assign them to departments and roles',
      icon: Users,
      features: [
        'Bulk import employees',
        'Assign roles',
        'Set permissions'
      ],
      color: 'from-purple-500 to-purple-600'
    },
    {
      number: 3,
      title: 'Deploy Custom Training Modules',
      description: 'Create or assign department-specific training tailored to your organization',
      icon: BookOpen,
      features: [
        'Create modules',
        'Customize content',
        'Set schedules'
      ],
      color: 'from-green-500 to-green-600'
    },
    {
      number: 4,
      title: 'Send Phishing Simulations',
      description: 'Test employee awareness with realistic phishing campaigns and fake notifications',
      icon: AlertTriangle,
      features: [
        'Schedule campaigns',
        'Customize templates',
        'Track responses'
      ],
      color: 'from-orange-500 to-orange-600'
    },
    {
      number: 5,
      title: 'Monitor Threat Reports',
      description: 'Receive and manage employee threat reports with admin responses and tracking',
      icon: Zap,
      features: [
        'Receive reports',
        'Add responses',
        'Track resolution'
      ],
      color: 'from-red-500 to-red-600'
    },
    {
      number: 6,
      title: 'Issue Certificates',
      description: 'Automatically award digital certificates upon successful module completion',
      icon: Award,
      features: [
        'Auto-issue certs',
        'Track achievements',
        'Share credentials'
      ],
      color: 'from-indigo-500 to-indigo-600'
    }
  ];

  const currentStepData = steps[currentStep];
  const CurrentIcon = currentStepData.icon;

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-sm border-b border-slate-700">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white mb-1">
                {companyName}
              </h1>
              <p className="text-slate-400">
                Setup & Configuration Guide
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-slate-400">Step {currentStep + 1} of 6</p>
              <div className="w-48 h-1 bg-slate-700 rounded-full mt-2 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-300"
                  style={{ width: `${((currentStep + 1) / 6) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <div className={`bg-gradient-to-br ${currentStepData.color} rounded-lg p-8 text-white mb-8`}>
              <div className="flex items-start gap-4 mb-6">
                <div className="p-3 bg-white/20 rounded-lg">
                  <CurrentIcon className="w-8 h-8" />
                </div>
                <div>
                  <p className="text-sm font-semibold opacity-90">Step {currentStepData.number}</p>
                  <h2 className="text-3xl font-bold">{currentStepData.title}</h2>
                </div>
              </div>
              <p className="text-lg opacity-90">{currentStepData.description}</p>
            </div>

            {/* Features List */}
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-8 mb-8">
              <h3 className="text-lg font-semibold text-white mb-4">What you can do:</h3>
              <ul className="space-y-3">
                {currentStepData.features.map((feature, idx) => (
                  <li key={idx} className="flex items-center gap-3 text-slate-300">
                    <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${currentStepData.color}`} />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>

            {/* Navigation Buttons */}
            <div className="flex gap-4">
              <button
                onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                disabled={currentStep === 0}
                className="flex-1 px-6 py-3 border border-slate-600 text-white rounded-lg hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                ← Previous
              </button>
              <button
                onClick={() => setCurrentStep(Math.min(steps.length - 1, currentStep + 1))}
                disabled={currentStep === steps.length - 1}
                className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next →
              </button>
            </div>
          </div>

          {/* Sidebar - All Steps */}
          <div className="lg:col-span-1">
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 sticky top-28">
              <h3 className="text-sm font-semibold text-slate-400 mb-4 uppercase tracking-wide">
                Setup Steps
              </h3>
              <div className="space-y-2">
                {steps.map((step, idx) => {
                  const StepIcon = step.icon;
                  const isActive = idx === currentStep;
                  const isCompleted = idx < currentStep;

                  return (
                    <button
                      key={idx}
                      onClick={() => setCurrentStep(idx)}
                      className={`w-full text-left p-3 rounded-lg transition-all ${
                        isActive
                          ? `bg-gradient-to-r ${step.color} text-white`
                          : isCompleted
                          ? 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
                          : 'bg-slate-700/30 text-slate-400 hover:bg-slate-700/50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded ${isActive ? 'bg-white/20' : isCompleted ? 'bg-green-500/20' : 'bg-slate-600/30'}`}>
                          <StepIcon className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold opacity-75">Step {step.number}</p>
                          <p className="text-sm font-medium truncate">{step.title.split('\n')[0]}</p>
                        </div>
                        {isCompleted && (
                          <span className="text-green-400 text-lg">✓</span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompanyOnboardingFlow;
