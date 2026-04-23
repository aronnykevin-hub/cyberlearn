import React, { useState } from 'react';
import { Settings as SettingsIcon, Moon, Sun, LogOut } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import authService from '../services/authService';

interface SettingsTab {
  id: 'appearance' | 'notifications' | 'privacy' | 'account';
  label: string;
  icon: React.ReactNode;
}

/**
 * Settings Component
 * User preferences and configuration page
 */
export function Settings() {
  const { theme, setTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<'appearance' | 'notifications' | 'privacy' | 'account'>('appearance');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleLogout = async () => {
    setLoading(true);
    try {
      await authService.signOut();
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to log out' });
    } finally {
      setLoading(false);
    }
  };

  const tabs: SettingsTab[] = [
    { id: 'appearance', label: 'Appearance', icon: <Sun size={18} /> },
    { id: 'notifications', label: 'Notifications', icon: <Moon size={18} /> },
    { id: 'privacy', label: 'Privacy', icon: <SettingsIcon size={18} /> },
    { id: 'account', label: 'Account', icon: <SettingsIcon size={18} /> },
  ];

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      theme === 'dark'
        ? 'bg-slate-900 text-slate-100'
        : 'bg-slate-50 text-slate-900'
    }`}>
      {/* Header */}
      <div className={`border-b ${theme === 'dark' ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-white'}`}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-3">
            <SettingsIcon size={28} className="text-indigo-600" />
            <h1 className="text-3xl font-bold">Settings</h1>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Sidebar Navigation */}
          <div className={`md:col-span-1 rounded-lg p-4 h-fit ${
            theme === 'dark' ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-slate-200'
          }`}>
            <nav className="space-y-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    w-full flex items-center gap-3 px-4 py-3 rounded-lg
                    transition-all font-medium
                    ${activeTab === tab.id
                      ? 'bg-indigo-600 text-white'
                      : theme === 'dark'
                        ? 'text-slate-400 hover:bg-slate-700'
                        : 'text-slate-600 hover:bg-slate-100'
                    }
                  `}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Main Content */}
          <div className="md:col-span-3">
            {/* Message Alert */}
            {message && (
              <div className={`mb-6 p-4 rounded-lg ${
                message.type === 'success'
                  ? theme === 'dark'
                    ? 'bg-green-900 text-green-100 border border-green-700'
                    : 'bg-green-50 text-green-800 border border-green-200'
                  : theme === 'dark'
                    ? 'bg-red-900 text-red-100 border border-red-700'
                    : 'bg-red-50 text-red-800 border border-red-200'
              }`}>
                {message.text}
              </div>
            )}

            {/* Appearance Tab */}
            {activeTab === 'appearance' && (
              <div className={`rounded-lg p-6 ${
                theme === 'dark' ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-slate-200'
              }`}>
                <h2 className="text-2xl font-bold mb-6">Appearance</h2>
                
                <div className="space-y-6">
                  {/* Theme Selection */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Theme</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Light Mode Option */}
                      <button
                        onClick={() => setTheme('light')}
                        className={`
                          p-6 rounded-lg border-2 transition-all
                          ${theme === 'light'
                            ? 'border-indigo-600 bg-indigo-50'
                            : theme === 'dark'
                              ? 'border-slate-600 bg-slate-700 hover:border-slate-500'
                              : 'border-slate-200 bg-slate-50 hover:border-slate-300'
                          }
                        `}
                      >
                        <Sun size={32} className={theme === 'light' ? 'text-indigo-600 mx-auto mb-2' : 'mx-auto mb-2'} />
                        <p className="font-semibold">Light Mode</p>
                        <p className={`text-sm ${theme === 'light' ? 'text-indigo-600' : 'text-gray-500'}`}>
                          {theme === 'light' ? 'Current theme' : 'Switch to light mode'}
                        </p>
                      </button>

                      {/* Dark Mode Option */}
                      <button
                        onClick={() => setTheme('dark')}
                        className={`
                          p-6 rounded-lg border-2 transition-all
                          ${theme === 'dark'
                            ? 'border-indigo-600 bg-indigo-900'
                            : theme === 'dark'
                              ? 'border-slate-600 bg-slate-700 hover:border-slate-500'
                              : 'border-slate-200 bg-slate-900 text-white hover:border-slate-300'
                          }
                        `}
                      >
                        <Moon size={32} className={theme === 'dark' ? 'text-indigo-400 mx-auto mb-2' : 'mx-auto mb-2'} />
                        <p className="font-semibold">Dark Mode</p>
                        <p className={`text-sm ${theme === 'dark' ? 'text-indigo-300' : 'text-gray-400'}`}>
                          {theme === 'dark' ? 'Current theme' : 'Switch to dark mode'}
                        </p>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <div className={`rounded-lg p-6 ${
                theme === 'dark' ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-slate-200'
              }`}>
                <h2 className="text-2xl font-bold mb-6">Notification Preferences</h2>
                <p className={theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}>
                  Notification settings coming soon...
                </p>
              </div>
            )}

            {/* Privacy Tab */}
            {activeTab === 'privacy' && (
              <div className={`rounded-lg p-6 ${
                theme === 'dark' ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-slate-200'
              }`}>
                <h2 className="text-2xl font-bold mb-6">Privacy Settings</h2>
                <p className={theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}>
                  Privacy settings coming soon...
                </p>
              </div>
            )}

            {/* Account Tab */}
            {activeTab === 'account' && (
              <div className={`rounded-lg p-6 ${
                theme === 'dark' ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-slate-200'
              }`}>
                <h2 className="text-2xl font-bold mb-6">Account Settings</h2>
                
                <div className="space-y-4">
                  <div className="pb-4 border-b border-slate-600">
                    <p className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                      Logged in to your Cyberlearn account
                    </p>
                  </div>

                  <button
                    onClick={handleLogout}
                    disabled={loading}
                    className={`
                      flex items-center gap-2 px-6 py-2 rounded-lg
                      font-semibold transition-all
                      ${loading ? 'opacity-50 cursor-not-allowed' : ''}
                      bg-red-600 hover:bg-red-700 text-white
                    `}
                  >
                    <LogOut size={18} />
                    {loading ? 'Signing out...' : 'Sign Out'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Settings;
