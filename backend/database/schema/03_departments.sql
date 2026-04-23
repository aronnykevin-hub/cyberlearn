-- Departments belong to companies and are used for employee assignment.
CREATE TABLE IF NOT EXISTS public.departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(company_id, name)
);

-- Add FK now that departments exists
ALTER TABLE public.user_profiles
  DROP CONSTRAINT IF EXISTS user_profiles_department_id_fkey;

ALTER TABLE public.user_profiles
  ADD CONSTRAINT user_profiles_department_id_fkey
  FOREIGN KEY (department_id)
  REFERENCES public.departments(id)
  ON DELETE SET NULL;

ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;

-- Company members can read departments in their company.
DROP POLICY IF EXISTS departments_read_company_members ON public.departments;
CREATE POLICY departments_read_company_members ON public.departments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.user_profiles up
      WHERE up.user_id = auth.uid()
        AND up.company_id = departments.company_id
        AND up.is_active = true
    )
  );

-- Company admins manage departments.
DROP POLICY IF EXISTS departments_manage_company_admin ON public.departments;
CREATE POLICY departments_manage_company_admin ON public.departments
  FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM public.user_profiles admin_profile
      WHERE admin_profile.user_id = auth.uid()
        AND admin_profile.company_id = departments.company_id
        AND admin_profile.role = 'admin'
        AND admin_profile.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.user_profiles admin_profile
      WHERE admin_profile.user_id = auth.uid()
        AND admin_profile.company_id = departments.company_id
        AND admin_profile.role = 'admin'
        AND admin_profile.is_active = true
    )
  );

DROP POLICY IF EXISTS departments_service_role ON public.departments;
CREATE POLICY departments_service_role ON public.departments
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE INDEX IF NOT EXISTS departments_company_id_idx ON public.departments(company_id);
CREATE INDEX IF NOT EXISTS departments_name_idx ON public.departments(name);
