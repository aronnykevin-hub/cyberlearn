import { useEffect, useState } from "react";
import { Toaster } from "sonner";
import { Shield, Bell, Menu, X } from "lucide-react";
import authService from "./services/authService";
import { getUserProfile } from "./services/userProfileService";
import {
  getUnreadNotificationCount,
  subscribeToNotifications,
} from "./services/notificationService";
import { SignInForm } from "./SignInForm";
import { SignOutButton } from "./SignOutButton";
import { NotificationsPanel } from "./NotificationsPanel";
import LandingPage from "./LandingPage";
import { ThemeToggle } from "./components/ThemeToggle";
import { useTheme } from "./contexts/ThemeContext";
import DashboardRouter from "./components/DashboardRouter";
import AuthCallback from "./AuthCallback";

export default function App() {
  const { theme } = useTheme();
  const isAuthCallbackPath = window.location.pathname === "/auth/callback";
  const shouldOpenAuthScreen = new URLSearchParams(window.location.search).get("auth") === "signin";
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAuthScreen, setShowAuthScreen] = useState(shouldOpenAuthScreen);
  const [showNotifications, setShowNotifications] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const isAdmin = profile?.role === 'admin';

  // Initialize auth state listener
  useEffect(() => {
    let notificationsSubscription: { unsubscribe?: () => void } | null = null;

    const unsubscribe = authService.onAuthStateChange(async (event, session) => {
      const currentUser = session?.user;
      setUser(currentUser || null);
      
      if (currentUser && currentUser.id) {
        try {
          // Fetch user profile
          const userProfile = await getUserProfile(currentUser.id);
          setProfile(userProfile);

          const refreshUnreadCount = async () => {
            const count = await getUnreadNotificationCount(currentUser.id);
            setUnreadCount(count);
          };

          await refreshUnreadCount();

          notificationsSubscription?.unsubscribe?.();
          notificationsSubscription = subscribeToNotifications(currentUser.id, () => {
            void refreshUnreadCount();
          });
        } catch (error) {
          console.error("Error loading profile:", error);
          setProfile(null);
        }
      } else {
        setProfile(null);
        setUnreadCount(0);
        notificationsSubscription?.unsubscribe?.();
        notificationsSubscription = null;
      }
      
      setLoading(false);
    });

    return () => {
      unsubscribe?.();
      notificationsSubscription?.unsubscribe?.();
    };
  }, []);

  // Show loading state
  if (loading) {
    return (
      <div className={theme === 'dark' ? 'dark' : ''}>
        <div className="min-h-screen bg-white dark:bg-slate-900 text-slate-900 dark:text-white flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-slate-600 dark:text-slate-400">Loading your profile...</p>
          </div>
        </div>
      </div>
    );
  }

  if (isAuthCallbackPath) {
    return (
      <div className={theme === 'dark' ? 'dark' : ''}>
        <AuthCallback />
      </div>
    );
  }

  // Not authenticated - show landing page
  if (!user) {
    if (showAuthScreen) {
      return (
        <div className={theme === 'dark' ? 'dark' : ''}>
          <div className="min-h-screen bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
            <div className="min-h-screen flex flex-col bg-white dark:bg-slate-900">
              <header className="px-6 py-4 flex items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-indigo-600 rounded-lg flex items-center justify-center">
                    <Shield size={18} className="text-white" />
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white">Cyberlearn</span>
                    <span className="text-slate-600 dark:text-slate-400 text-xs ml-2 hidden sm:inline">Employee Cyberthreat Vigilance System</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAuthScreen(false)}
                  className="text-sm px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:border-slate-400 dark:hover:border-slate-500"
                >
                  Back to Home
                </button>
              </header>
              <div className="flex-1 flex items-center justify-center p-6">
                <div className="w-full max-w-md">
                  <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-500/30">
                      <Shield size={32} className="text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Start Your Free Trial</h1>
                    <p className="text-slate-600 dark:text-slate-400">Sign in or create an account to continue</p>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-xl">
                    <SignInForm />
                  </div>
                </div>
              </div>
            </div>
            <Toaster theme={theme === 'dark' ? 'dark' : 'light'} position="top-right" />
          </div>
        </div>
      );
    }

    return (
      <div className={theme === 'dark' ? 'dark' : ''}>
        <div className="min-h-screen bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
          <LandingPage onStartTrial={() => setShowAuthScreen(true)} />
          <Toaster theme={theme === 'dark' ? 'dark' : 'light'} position="top-right" />
        </div>
      </div>
    );
  }

  // Authenticated but no profile - show sign-in form
  if (!profile) {
    return (
      <div className={theme === 'dark' ? 'dark' : ''}>
        <div className="min-h-screen bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
          <div className="min-h-screen flex flex-col bg-white dark:bg-slate-900">
            <header className="px-6 py-4 flex items-center gap-3 border-b border-slate-200 dark:border-slate-700">
              <div className="w-9 h-9 bg-indigo-600 rounded-lg flex items-center justify-center">
                <Shield size={18} className="text-white" />
              </div>
              <div>
                <span className="font-bold text-slate-900 dark:text-white">Cyberlearn</span>
                <span className="text-slate-600 dark:text-slate-400 text-xs ml-2 hidden sm:inline">Employee Cyberthreat Vigilance System</span>
              </div>
            </header>
            <div className="flex-1 flex items-center justify-center p-6">
              <div className="w-full max-w-md">
                <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-500/30">
                    <Shield size={32} className="text-white" />
                  </div>
                  <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Welcome to Cyberlearn</h1>
                  <p className="text-slate-600 dark:text-slate-400">Complete your profile to get started</p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-xl">
                  <SignInForm />
                </div>
              </div>
            </div>
          </div>
          <Toaster theme={theme === 'dark' ? 'dark' : 'light'} position="top-right" />
        </div>
      </div>
    );
  }

  // Authenticated with profile - show dashboard
  return (
    <div className={theme === 'dark' ? 'dark' : ''}>
      <div className="min-h-screen flex flex-col bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
        {/* Header */}
        <header className="sticky top-0 z-50 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                className="md:hidden text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                  <Shield size={16} className="text-white" />
                </div>
                <div>
                  <span className="font-bold text-slate-900 dark:text-white text-sm md:text-base">Cyberlearn</span>
                  <span className="hidden md:inline text-slate-600 dark:text-slate-400 text-xs ml-2">Employee Cyberthreat Vigilance System</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-slate-200 dark:bg-slate-700 rounded-full">
                <div className={`w-2 h-2 rounded-full ${profile?.role === "admin" ? "bg-purple-400" : "bg-green-400"}`} />
                <span className="text-xs text-slate-700 dark:text-slate-300 capitalize">{profile?.role ?? "employee"}</span>
              </div>
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>
              <ThemeToggle />
              <SignOutButton />
            </div>
          </div>
        </header>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden">
            <div
              className="fixed inset-0 z-40 bg-black/30"
              onClick={() => setMobileMenuOpen(false)}
            />
            <div className="fixed top-16 left-0 right-0 z-50 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 shadow-lg">
              <div className="px-4 py-4 space-y-2">
                <button
                  onClick={() => {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                    window.dispatchEvent(new CustomEvent('cyberlearn:navigate', { detail: { target: 'dashboard-top' } }));
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200"
                >
                  Dashboard
                </button>
                <button
                  onClick={() => {
                    window.dispatchEvent(new CustomEvent('cyberlearn:navigate', { detail: { target: 'training-learn' } }));
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200"
                >
                  Training Modules
                </button>
                <button
                  onClick={() => {
                    window.dispatchEvent(new CustomEvent('cyberlearn:navigate', { detail: { target: 'reports' } }));
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200"
                >
                  Threat Reports
                </button>
                <button
                  onClick={() => {
                    window.dispatchEvent(new CustomEvent('cyberlearn:navigate', { detail: { target: 'certificates' } }));
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200"
                >
                  Certificates
                </button>
                <button
                  onClick={() => {
                    window.dispatchEvent(new CustomEvent('cyberlearn:navigate', { detail: { target: 'profile' } }));
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200"
                >
                  My Profile
                </button>
                {isAdmin && (
                  <>
                    <button
                      onClick={() => {
                        window.dispatchEvent(new CustomEvent('cyberlearn:navigate', { detail: { target: 'training-analytics' } }));
                        setMobileMenuOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200"
                    >
                      Team Analytics
                    </button>
                    <button
                      onClick={() => {
                        window.dispatchEvent(new CustomEvent('cyberlearn:navigate', { detail: { target: 'team-members' } }));
                        setMobileMenuOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200"
                    >
                      Team Members
                    </button>
                    <button
                      onClick={() => {
                        window.dispatchEvent(new CustomEvent('cyberlearn:navigate', { detail: { target: 'departments' } }));
                        setMobileMenuOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200"
                    >
                      Assign Departments
                    </button>
                    <button
                      onClick={() => {
                        window.dispatchEvent(new CustomEvent('cyberlearn:navigate', { detail: { target: 'training-analytics' } }));
                        setMobileMenuOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200"
                    >
                      Phishing Simulations
                    </button>
                    <button
                      onClick={() => {
                        window.dispatchEvent(new CustomEvent('cyberlearn:navigate', { detail: { target: 'profile' } }));
                        setMobileMenuOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200"
                    >
                      My Profile
                    </button>
                  </>
                )}
                <button
                  onClick={() => {
                    setShowNotifications(true);
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200"
                >
                  Notifications
                </button>
                <div className="flex items-center justify-between px-3 py-2 border-t border-slate-200 dark:border-slate-700">
                  <span className="text-sm text-slate-600 dark:text-slate-400">Theme</span>
                  <ThemeToggle />
                </div>
                <div className="px-3 pt-2">
                  <SignOutButton />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Notifications Panel */}
        {showNotifications && (
          <NotificationsPanel onClose={() => setShowNotifications(false)} />
        )}

        {/* Main Content */}
        <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-8">
          <DashboardRouter />
        </main>

        <Toaster theme={theme === 'dark' ? 'dark' : 'light'} position="top-right" />
      </div>
    </div>
  );
}
