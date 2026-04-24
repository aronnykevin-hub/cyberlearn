import type { LucideIcon } from 'lucide-react';

export interface DashboardTabItem {
  id: string;
  label: string;
  icon: LucideIcon;
  description?: string;
  badge?: string | number;
}

interface DashboardTabsProps {
  tabs: DashboardTabItem[];
  activeTab: string;
  onChange: (tabId: string) => void;
  className?: string;
}

export function DashboardTabs({ tabs, activeTab, onChange, className = '' }: DashboardTabsProps) {
  return (
    <div className={`sticky top-16 z-30 -mx-4 px-4 py-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur border-b border-slate-200 dark:border-slate-800 ${className}`}>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChange(tab.id)}
              className={`flex min-w-fit items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all border ${
                isActive
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-600/20'
                  : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 dark:hover:bg-slate-700'
              }`}
              aria-pressed={isActive}
            >
              <Icon size={16} />
              <span>{tab.label}</span>
              {tab.badge !== undefined && (
                <span
                  className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-white text-slate-700 dark:bg-slate-900 dark:text-slate-300'
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default DashboardTabs;
