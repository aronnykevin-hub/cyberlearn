-- User profile + organization membership model.
-- department_id FK is added in 03_departments.sql after departments table creation.
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  department_id UUID,
  role TEXT NOT NULL DEFAULT 'employee' CHECK (role IN ('employee', 'admin')),
  full_name TEXT,
  job_title TEXT,
  phone TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Any signed-in user can create their own initial profile.
DROP POLICY IF EXISTS user_profiles_insert_own ON public.user_profiles;
CREATE POLICY user_profiles_insert_own ON public.user_profiles
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can read their own profile.
DROP POLICY IF EXISTS user_profiles_read_own ON public.user_profiles;
CREATE POLICY user_profiles_read_own ON public.user_profiles
  FOR SELECT
  USING (auth.uid() = user_id);

-- Company admins can read all profiles in their company.
DROP POLICY IF EXISTS user_profiles_read_company_admin ON public.user_profiles;
CREATE POLICY user_profiles_read_company_admin ON public.user_profiles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.user_profiles admin_profile
      WHERE admin_profile.user_id = auth.uid()
        AND admin_profile.company_id = user_profiles.company_id
        AND admin_profile.role = 'admin'
        AND admin_profile.is_active = true
    )
  );

-- Users can only update their own profile while unassigned to a company.
-- This prevents employees from self-assigning company/department after onboarding starts.
DROP POLICY IF EXISTS user_profiles_update_own_unassigned ON public.user_profiles;
CREATE POLICY user_profiles_update_own_unassigned ON public.user_profiles
  FOR UPDATE
  USING (
    auth.uid() = user_id
    AND company_id IS NULL
  )
  WITH CHECK (
    auth.uid() = user_id
    AND company_id IS NULL
  );

-- Company admins can assign employees to company and specific departments.
DROP POLICY IF EXISTS user_profiles_update_company_admin ON public.user_profiles;
CREATE POLICY user_profiles_update_company_admin ON public.user_profiles
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM public.user_profiles admin_profile
      WHERE admin_profile.user_id = auth.uid()
        AND admin_profile.company_id = user_profiles.company_id
        AND admin_profile.role = 'admin'
        AND admin_profile.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.user_profiles admin_profile
      WHERE admin_profile.user_id = auth.uid()
        AND admin_profile.company_id = user_profiles.company_id
        AND admin_profile.role = 'admin'
        AND admin_profile.is_active = true
    )
  );

DROP POLICY IF EXISTS user_profiles_service_role ON public.user_profiles;
CREATE POLICY user_profiles_service_role ON public.user_profiles
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE INDEX IF NOT EXISTS user_profiles_user_id_idx ON public.user_profiles(user_id);
CREATE INDEX IF NOT EXISTS user_profiles_company_id_idx ON public.user_profiles(company_id);
CREATE INDEX IF NOT EXISTS user_profiles_department_id_idx ON public.user_profiles(department_id);
CREATE INDEX IF NOT EXISTS user_profiles_role_idx ON public.user_profiles(role);
CREATE INDEX IF NOT EXISTS user_profiles_is_active_idx ON public.user_profiles(is_active);

-- Now that user_profiles exists, add company member/admin policies.
DROP POLICY IF EXISTS companies_select_members ON public.companies;
CREATE POLICY companies_select_members ON public.companies
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.user_profiles up
      WHERE up.user_id = auth.uid()
        AND up.company_id = companies.id
        AND up.is_active = true
    )
  );

DROP POLICY IF EXISTS companies_update_admin ON public.companies;
CREATE POLICY companies_update_admin ON public.companies
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM public.user_profiles admin_profile
      WHERE admin_profile.user_id = auth.uid()
        AND admin_profile.company_id = companies.id
        AND admin_profile.role = 'admin'
        AND admin_profile.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.user_profiles admin_profile
      WHERE admin_profile.user_id = auth.uid()
        AND admin_profile.company_id = companies.id
        AND admin_profile.role = 'admin'
        AND admin_profile.is_active = true
    )
  );
