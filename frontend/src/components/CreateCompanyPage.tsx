import React, { useState, useRef } from 'react';
import { companyService } from '../services/companyService';
import { toast } from 'sonner';
import { Building2, Loader, ChevronDown, ArrowLeft, CheckCircle2, AlertCircle, Plus, X } from 'lucide-react';

interface CreateCompanyPageProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

const SUGGESTED_DEPARTMENTS = [
  'IT / Cybersecurity',
  'Finance',
  'Customer Care',
  'Human Resources (HR)',
  'Marketing',
  'Operations',
  'Sales',
  'Administration',
  'Legal',
  'Product',
  'Engineering',
  'Design',
  'Quality Assurance',
  'Research & Development'
];

export const CreateCompanyPage: React.FC<CreateCompanyPageProps> = ({ onSuccess, onCancel }) => {
  const [loading, setLoading] = useState(false);
  const [activeStep, setActiveStep] = useState(1);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [customDepartmentInput, setCustomDepartmentInput] = useState('');
  const contentRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const defaultDepartments = SUGGESTED_DEPARTMENTS.slice(0, 8);

  const [formData, setFormData] = useState({
    name: '',
    industry: '',
    country: '',
    address: '',
    departments: defaultDepartments.join('\n')
  });

  React.useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Auto-scroll to content on mobile when step changes
  React.useEffect(() => {
    if (isMobile && contentRef.current) {
      setTimeout(() => {
        contentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, [activeStep, isMobile]);

  // Get currently selected departments
  const getSelectedDepartments = () => {
    return formData.departments
      .split('\n')
      .map(d => d.trim())
      .filter(Boolean);
  };

  // Toggle department selection
  const toggleDepartment = (dept: string) => {
    const selected = getSelectedDepartments();
    if (selected.includes(dept)) {
      setFormData(prev => ({
        ...prev,
        departments: selected.filter(d => d !== dept).join('\n')
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        departments: [...selected, dept].join('\n')
      }));
    }
  };

  // Add custom department
  const addCustomDepartment = () => {
    const trimmed = customDepartmentInput.trim();
    if (!trimmed) {
      toast.error('Please enter a department name');
      return;
    }

    const selected = getSelectedDepartments();
    if (selected.includes(trimmed)) {
      toast.error('This department already exists');
      return;
    }

    setFormData(prev => ({
      ...prev,
      departments: [...selected, trimmed].join('\n')
    }));
    setCustomDepartmentInput('');
    toast.success('Department added!');
  };

  // Remove department
  const removeDepartment = (dept: string) => {
    setFormData(prev => ({
      ...prev,
      departments: getSelectedDepartments()
        .filter(d => d !== dept)
        .join('\n')
    }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error for this field when user starts typing
    if (validationErrors[name]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateStep = (step: number): boolean => {
    const errors: Record<string, string> = {};

    if (step === 1) {
      if (!formData.name.trim()) {
        errors.name = 'Company name is required';
      }
      if (!formData.industry.trim()) {
        errors.industry = 'Industry is required';
      }
      if (!formData.country.trim()) {
        errors.country = 'Country is required';
      }
    }

    if (step === 2) {
      if (!formData.address.trim()) {
        errors.address = 'Address is required';
      }
      const departments = String(formData.departments || '')
        .split('\n')
        .map((d) => d.trim())
        .filter(Boolean);
      if (departments.length === 0) {
        errors.departments = 'At least one department is required';
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep(2);
      if (!isMobile) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  };

  const handleBack = () => {
    setActiveStep(1);
    if (!isMobile) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateStep(2)) return;

    setLoading(true);

    const departments = String(formData.departments || '')
      .split('\n')
      .map((department) => department.trim())
      .filter(Boolean);

    try {
      const result = await companyService.createCompany({
        ...formData,
        departments
      });

      if (result.success) {
        toast.success('🎉 Company created successfully!');
        setFormData({
          name: '',
          industry: '',
          country: '',
          address: '',
          departments: defaultDepartments.join('\n')
        });
        setCustomDepartmentInput('');
        setActiveStep(1);
        onSuccess?.();
      } else {
        toast.error(result.error || 'Failed to create company');
      }
    } catch (error) {
      toast.error('An error occurred while creating the company');
      console.error(error);
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-10 w-96 h-96 rounded-full blur-3xl bg-blue-400/10 dark:bg-blue-600/10"></div>
        <div className="absolute bottom-20 left-10 w-96 h-96 rounded-full blur-3xl bg-cyan-400/10 dark:bg-cyan-600/10"></div>
      </div>

      {/* Header */}
      <div className="sticky top-0 z-40 backdrop-blur-md bg-white/80 dark:bg-slate-900/80 border-b border-blue-100 dark:border-slate-700">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-lg">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                  Create Your Company
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">Set up your organization in Cyberlearn</p>
              </div>
            </div>
            {onCancel && (
              <button
                onClick={onCancel}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-400" />
              </button>
            )}
          </div>

          {/* Progress Bar */}
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-600 to-cyan-500 transition-all duration-500"
                  style={{ width: `${(activeStep / 2) * 100}%` }}
                ></div>
              </div>
            </div>
            <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">
              Step {activeStep}/2
            </span>
          </div>
        </div>
      </div>

      {/* Main Content - Mobile Scrollable */}
      <div ref={contentRef} className="relative z-10 max-w-2xl mx-auto px-4 py-8 sm:py-12">
        <form ref={formRef} onSubmit={handleSubmit} className="space-y-8">
          {/* Step 1: Basic Information */}
          {activeStep === 1 && (
            <div className="animate-in fade-in slide-in-from-bottom duration-300 space-y-6 pb-12">
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-3">
                  Company Information
                </h2>
                <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400">
                  Tell us about your organization so we can personalize your experience
                </p>
              </div>

              {/* Company Name */}
              <div className="space-y-3">
                <label className="block text-base sm:text-lg font-semibold text-slate-700 dark:text-slate-300">
                  Company Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="e.g., Acme Corporation"
                    className={`w-full px-4 py-4 sm:py-5 text-base sm:text-lg border-2 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-slate-900 transition-all duration-200 ${
                      validationErrors.name
                        ? 'border-red-500 focus:ring-red-500'
                        : 'border-slate-200 dark:border-slate-700 focus:border-blue-500 focus:ring-blue-500/30'
                    }`}
                  />
                  {formData.name && !validationErrors.name && (
                    <CheckCircle2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-green-500" />
                  )}
                </div>
                {validationErrors.name && (
                  <p className="flex items-center gap-2 text-sm text-red-500 mt-2">
                    <AlertCircle className="w-4 h-4" /> {validationErrors.name}
                  </p>
                )}
              </div>

              {/* Industry and Country */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <label className="block text-base sm:text-lg font-semibold text-slate-700 dark:text-slate-300">
                    Industry <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      name="industry"
                      value={formData.industry}
                      onChange={handleChange}
                      placeholder="e.g., Technology"
                      className={`w-full px-4 py-4 border-2 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-slate-900 transition-all duration-200 ${
                        validationErrors.industry
                          ? 'border-red-500 focus:ring-red-500'
                          : 'border-slate-200 dark:border-slate-700 focus:border-blue-500 focus:ring-blue-500/30'
                      }`}
                    />
                    {formData.industry && !validationErrors.industry && (
                      <CheckCircle2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-green-500" />
                    )}
                  </div>
                  {validationErrors.industry && (
                    <p className="flex items-center gap-2 text-sm text-red-500 mt-2">
                      <AlertCircle className="w-4 h-4" /> {validationErrors.industry}
                    </p>
                  )}
                </div>
                <div className="space-y-3">
                  <label className="block text-base sm:text-lg font-semibold text-slate-700 dark:text-slate-300">
                    Country <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      name="country"
                      value={formData.country}
                      onChange={handleChange}
                      placeholder="e.g., United States"
                      className={`w-full px-4 py-4 border-2 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-slate-900 transition-all duration-200 ${
                        validationErrors.country
                          ? 'border-red-500 focus:ring-red-500'
                          : 'border-slate-200 dark:border-slate-700 focus:border-blue-500 focus:ring-blue-500/30'
                      }`}
                    />
                    {formData.country && !validationErrors.country && (
                      <CheckCircle2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-green-500" />
                    )}
                  </div>
                  {validationErrors.country && (
                    <p className="flex items-center gap-2 text-sm text-red-500 mt-2">
                      <AlertCircle className="w-4 h-4" /> {validationErrors.country}
                    </p>
                  )}
                </div>
              </div>

              {/* Step 1 Button - Full Width on Mobile */}
              <div className="flex justify-end mt-12 pb-8">
                <button
                  type="button"
                  onClick={handleNext}
                  className="group w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 sm:py-5 bg-gradient-to-r from-blue-600 to-cyan-500 text-white text-lg sm:text-base rounded-xl font-semibold hover:shadow-lg hover:scale-105 transition-all duration-200 active:scale-95"
                >
                  Next <ChevronDown className="w-5 h-5 group-hover:translate-y-1 transition-transform" />
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Address & Departments */}
          {activeStep === 2 && (
            <div className="animate-in fade-in slide-in-from-bottom duration-300 space-y-6 pb-12">
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-3">
                  Departments & Location
                </h2>
                <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400">
                  Add your company address and set up initial departments
                </p>
              </div>

              {/* Address */}
              <div className="space-y-3">
                <label className="block text-base sm:text-lg font-semibold text-slate-700 dark:text-slate-300">
                  Company Address <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Enter your company address"
                  rows={3}
                  className={`w-full px-4 py-4 border-2 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-slate-900 transition-all duration-200 resize-none text-base ${
                    validationErrors.address
                      ? 'border-red-500 focus:ring-red-500'
                      : 'border-slate-200 dark:border-slate-700 focus:border-blue-500 focus:ring-blue-500/30'
                  }`}
                />
                {validationErrors.address && (
                  <p className="flex items-center gap-2 text-sm text-red-500 mt-2">
                    <AlertCircle className="w-4 h-4" /> {validationErrors.address}
                  </p>
                )}
              </div>

              {/* Departments */}
              <div className="space-y-4">
                <label className="block text-base sm:text-lg font-semibold text-slate-700 dark:text-slate-300">
                  Initial Departments <span className="text-red-500">*</span>
                </label>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Select departments or add your own. You can modify these later.
                </p>

                {/* Suggested Departments */}
                <div className="space-y-3">
                  <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">
                    Suggested Departments
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {SUGGESTED_DEPARTMENTS.map((dept) => {
                      const isSelected = getSelectedDepartments().includes(dept);
                      return (
                        <button
                          key={dept}
                          type="button"
                          onClick={() => toggleDepartment(dept)}
                          className={`group flex items-center gap-2 px-4 py-3 rounded-lg border-2 transition-all duration-200 text-left font-medium ${
                            isSelected
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                              : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-blue-400 dark:hover:border-blue-600'
                          }`}
                        >
                          <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                            isSelected
                              ? 'bg-blue-500 border-blue-500'
                              : 'border-slate-300 dark:border-slate-600'
                          }`}>
                            {isSelected && <CheckCircle2 className="w-4 h-4 text-white" />}
                          </div>
                          <span className="flex-1 text-sm">{dept}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Add Custom Department */}
                <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                  <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">
                    Add Custom Department
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={customDepartmentInput}
                      onChange={(e) => setCustomDepartmentInput(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addCustomDepartment();
                        }
                      }}
                      placeholder="E.g., Training & Development"
                      className="flex-1 px-4 py-3 border-2 border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
                    />
                    <button
                      type="button"
                      onClick={addCustomDepartment}
                      className="px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-all hover:shadow-lg active:scale-95 flex items-center gap-2"
                    >
                      <Plus className="w-5 h-5" />
                      <span className="hidden sm:inline">Add</span>
                    </button>
                  </div>
                </div>

                {/* Selected Departments List */}
                {getSelectedDepartments().length > 0 && (
                  <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">
                        Selected Departments ({getSelectedDepartments().length})
                      </p>
                    </div>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {getSelectedDepartments().map((dept) => (
                        <div
                          key={dept}
                          className="flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700"
                        >
                          <span className="font-medium text-slate-700 dark:text-slate-300 text-sm sm:text-base">
                            {dept}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeDepartment(dept)}
                            className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 rounded transition-colors"
                            title="Remove department"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Error State */}
                {validationErrors.departments && (
                  <p className="flex items-center gap-2 text-sm text-red-500 mt-3">
                    <AlertCircle className="w-4 h-4" /> {validationErrors.departments}
                  </p>
                )}

                {/* Info Box */}
                <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    ✓ <span className="font-semibold">{getSelectedDepartments().length} department(s)</span> configured
                  </p>
                </div>
              </div>

              {/* Step 2 Buttons - Mobile Optimized */}
              <div className="flex flex-col sm:flex-row justify-between mt-12 gap-3 pb-8">
                <button
                  type="button"
                  onClick={handleBack}
                  className="w-full sm:w-auto px-6 sm:px-8 py-4 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition-all duration-200 text-base sm:text-sm"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="group w-full sm:w-auto flex items-center justify-center gap-2 px-6 sm:px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-500 text-white rounded-xl font-semibold hover:shadow-lg hover:scale-105 transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 text-base sm:text-sm"
                >
                  {loading ? (
                    <>
                      <Loader className="w-5 h-5 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      Create Company
                      <CheckCircle2 className="w-5 h-5" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </form>
      </div>

      {/* Footer tip */}
      <div className="relative z-10 max-w-2xl mx-auto px-4 py-8 text-center">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          💡 You can add team members and assign departments after company creation
        </p>
      </div>
    </div>
  );
};
