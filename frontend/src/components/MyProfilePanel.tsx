import { useEffect, useState } from 'react';
import { Building2, CheckCircle2, Loader2, Mail, Phone, Save, UserCircle2, Briefcase } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../services/supabaseClient';

type ProfileRecord = {
  user_id: string;
  full_name: string | null;
  job_title: string | null;
  phone: string | null;
  role: 'admin' | 'employee' | null;
  is_active: boolean | null;
  company_id: string | null;
  department_id: string | null;
  departments?: {
    id: string;
    name: string | null;
    description: string | null;
    companies?: {
      id: string;
      name: string | null;
    } | null;
  } | null;
  companies?: {
    id: string;
    name: string | null;
  } | null;
};

type SmartDefaults = {
  fullName: string;
  jobTitle: string;
  phone: string;
  companyName: string;
  departmentName: string;
  roleLabel: string;
  insight: string;
};

function titleCase(value: string) {
  return value
    .replace(/[._-]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

function deriveNameFromEmail(email: string | null | undefined) {
  if (!email) return '';
  const localPart = email.split('@')[0] || '';
  return titleCase(localPart);
}

function buildSmartDefaults(profile: ProfileRecord | null, user: any): SmartDefaults {
  const companyName = profile?.companies?.name ?? profile?.departments?.companies?.name ?? 'CyberLearn';
  const departmentName = profile?.departments?.name ?? '';
  const roleLabel = profile?.role === 'admin' ? 'Admin' : 'Employee';

  const fullName =
    profile?.full_name?.trim() ||
    user?.user_metadata?.full_name?.trim() ||
    user?.user_metadata?.name?.trim() ||
    deriveNameFromEmail(user?.email) ||
    'CyberLearn User';

  const jobTitle =
    profile?.job_title?.trim() ||
    (profile?.role === 'admin'
      ? companyName && companyName !== 'CyberLearn'
        ? `${companyName} Security Admin`
        : 'Security Admin'
      : departmentName
        ? `${departmentName} Security Champion`
        : 'Cybersecurity Trainee');

  const phone =
    profile?.phone?.trim() ||
    user?.phone?.trim() ||
    user?.user_metadata?.phone?.trim() ||
    '';

  const insight =
    profile?.role === 'admin'
      ? `Admin profile tailored to ${companyName}.`
      : departmentName
        ? `Employee profile aligned to ${departmentName}.`
        : 'Employee profile ready for company assignment.';

  return {
    fullName,
    jobTitle,
    phone,
    companyName,
    departmentName,
    roleLabel,
    insight,
  };
}

export function MyProfilePanel() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [email, setEmail] = useState<string | null>(null);
  const [profile, setProfile] = useState<ProfileRecord | null>(null);
  const [fullName, setFullName] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [phone, setPhone] = useState('');
  const [smartDefaults, setSmartDefaults] = useState<SmartDefaults | null>(null);

  useEffect(() => {
    let mounted = true;

    const loadProfile = async () => {
      setLoading(true);

      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!mounted) return;

        setEmail(user?.email ?? null);

        if (!user) {
          setProfile(null);
          return;
        }

        const { data, error } = await supabase
          .from('user_profiles')
          .select(
            `
            user_id,
            full_name,
            job_title,
            phone,
            role,
            is_active,
            company_id,
            department_id,
            companies:company_id (
              id,
              name
            ),
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
          .eq('user_id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') {
          throw error;
        }

        if (!mounted) return;

        const nextProfile = (data as ProfileRecord | null) ?? null;
        const nextDefaults = buildSmartDefaults(nextProfile, user);
        setProfile(nextProfile);
        setSmartDefaults(nextDefaults);
        setFullName(nextDefaults.fullName);
        setJobTitle(nextDefaults.jobTitle);
        setPhone(nextDefaults.phone);
      } catch (loadError: any) {
        if (!mounted) return;
        toast.error(loadError?.message || 'Failed to load profile.');
        setProfile(null);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    void loadProfile();

    return () => {
      mounted = false;
    };
  }, []);

  const canEdit = Boolean(email);

  const resetToSmartDefaults = () => {
    if (!smartDefaults) return;
    setFullName(smartDefaults.fullName);
    setJobTitle(smartDefaults.jobTitle);
    setPhone(smartDefaults.phone);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('You need to sign in again.');
      }

      const { error } = await supabase.rpc('update_my_profile', {
        p_full_name: fullName.trim() || null,
        p_job_title: jobTitle.trim() || null,
        p_phone: phone.trim() || null,
      });

      if (error) {
        throw error;
      }

      const { data: refreshedProfile, error: refreshError } = await supabase
        .from('user_profiles')
        .select(
          `
          user_id,
          full_name,
          job_title,
          phone,
          role,
          is_active,
          company_id,
          department_id,
          companies:company_id (
            id,
            name
          ),
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
        .eq('user_id', user.id)
        .single();

      if (refreshError && refreshError.code !== 'PGRST116') {
        throw refreshError;
      }

      if (refreshedProfile) {
        setProfile(refreshedProfile as ProfileRecord);
      }

      toast.success('Profile updated successfully.');
    } catch (saveError: any) {
      toast.error(saveError?.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-slate-50 py-16 text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        Loading profile...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
          <UserCircle2 size={14} />
          My Profile
        </div>
        <h2 className="mt-3 text-2xl font-bold text-slate-900 dark:text-white">Account details</h2>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Keep your professional details up to date.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
          <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Status</p>
          <div className="mt-2 flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
            <CheckCircle2 size={16} className={profile?.is_active ? 'text-emerald-500' : 'text-slate-400'} />
            {profile?.is_active ? 'Active' : 'Inactive'}
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
          <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Role</p>
          <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-white capitalize">{profile?.role ?? 'employee'}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
          <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Email</p>
          <p className="mt-2 truncate text-sm font-semibold text-slate-900 dark:text-white">{email ?? 'No email linked'}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Profile information</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {canEdit
                  ? 'You can update the fields below. Edits save directly to your own profile.'
                  : 'Your profile is loading or unavailable right now.'}
              </p>
              {smartDefaults ? (
                <p className="mt-1 text-xs font-medium text-indigo-600 dark:text-indigo-300">{smartDefaults.insight}</p>
              ) : null}
            </div>
            <div className="flex flex-wrap gap-2">
              {canEdit && smartDefaults ? (
                <button
                  type="button"
                  onClick={resetToSmartDefaults}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Reapply smart defaults
                </button>
              ) : null}
              {canEdit ? (
                <button
                  type="button"
                  onClick={() => void handleSave()}
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Save size={14} />
                  {saving ? 'Saving...' : 'Save changes'}
                </button>
              ) : null}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <label className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Full name</span>
              <input
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                disabled={!canEdit}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none disabled:cursor-not-allowed disabled:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500 dark:disabled:bg-slate-900"
                placeholder={smartDefaults?.fullName || 'Your full name'}
              />
            </label>

            <label className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Job title</span>
              <input
                value={jobTitle}
                onChange={(event) => setJobTitle(event.target.value)}
                disabled={!canEdit}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none disabled:cursor-not-allowed disabled:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500 dark:disabled:bg-slate-900"
                placeholder={smartDefaults?.jobTitle || 'Security analyst'}
              />
            </label>

            <label className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Phone</span>
              <input
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                disabled={!canEdit}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none disabled:cursor-not-allowed disabled:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500 dark:disabled:bg-slate-900"
                placeholder={smartDefaults?.phone || '+1 555 0100'}
              />
            </label>
          </div>
        </div>

        <div className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Organization snapshot</h3>

          <div className="space-y-3">
            <div className="flex items-start gap-3 rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/70">
              <Building2 size={18} className="mt-0.5 text-indigo-600 dark:text-indigo-400" />
              <div className="min-w-0">
                <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Company</p>
                <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                  {smartDefaults?.companyName ?? profile?.departments?.companies?.name ?? 'Not assigned yet'}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/70">
              <Briefcase size={18} className="mt-0.5 text-indigo-600 dark:text-indigo-400" />
              <div className="min-w-0">
                <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Department</p>
                <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                  {smartDefaults?.departmentName || profile?.departments?.name || 'Unassigned'}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/70">
              <Mail size={18} className="mt-0.5 text-indigo-600 dark:text-indigo-400" />
              <div className="min-w-0">
                <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Email</p>
                <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{email ?? '—'}</p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/70">
              <Phone size={18} className="mt-0.5 text-indigo-600 dark:text-indigo-400" />
              <div className="min-w-0">
                <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Phone</p>
                <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{phone || 'Not provided'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MyProfilePanel;
