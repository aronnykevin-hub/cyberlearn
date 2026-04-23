CREATE TABLE IF NOT EXISTS public.threat_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  reporter_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  reporter_department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (
    type IN ('phishing', 'malware', 'suspicious_email', 'unauthorized_access', 'data_breach', 'social_engineering', 'other')
  ),
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  affected_systems TEXT,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'resolved', 'dismissed')),
  admin_notes TEXT,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.threat_reports ENABLE ROW LEVEL SECURITY;

-- Employees can report/read only when assigned to company + department.
DROP POLICY IF EXISTS threat_reports_read_own_assigned ON public.threat_reports;
CREATE POLICY threat_reports_read_own_assigned ON public.threat_reports
  FOR SELECT
  USING (
    auth.uid() = reporter_id
    AND EXISTS (
      SELECT 1
      FROM public.user_profiles up
      WHERE up.user_id = auth.uid()
        AND up.company_id = threat_reports.company_id
        AND up.department_id IS NOT NULL
        AND up.is_active = true
    )
  );

DROP POLICY IF EXISTS threat_reports_insert_assigned ON public.threat_reports;
CREATE POLICY threat_reports_insert_assigned ON public.threat_reports
  FOR INSERT
  WITH CHECK (
    auth.uid() = reporter_id
    AND EXISTS (
      SELECT 1
      FROM public.user_profiles up
      WHERE up.user_id = auth.uid()
        AND up.company_id = threat_reports.company_id
        AND up.department_id IS NOT NULL
        AND up.is_active = true
    )
  );

DROP POLICY IF EXISTS threat_reports_update_own_open ON public.threat_reports;
CREATE POLICY threat_reports_update_own_open ON public.threat_reports
  FOR UPDATE
  USING (auth.uid() = reporter_id AND status = 'open')
  WITH CHECK (auth.uid() = reporter_id);

-- Company admins can read/update all reports in their company.
DROP POLICY IF EXISTS threat_reports_read_company_admin ON public.threat_reports;
CREATE POLICY threat_reports_read_company_admin ON public.threat_reports
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.user_profiles admin_profile
      WHERE admin_profile.user_id = auth.uid()
        AND admin_profile.company_id = threat_reports.company_id
        AND admin_profile.role = 'admin'
        AND admin_profile.is_active = true
    )
  );

DROP POLICY IF EXISTS threat_reports_update_company_admin ON public.threat_reports;
CREATE POLICY threat_reports_update_company_admin ON public.threat_reports
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM public.user_profiles admin_profile
      WHERE admin_profile.user_id = auth.uid()
        AND admin_profile.company_id = threat_reports.company_id
        AND admin_profile.role = 'admin'
        AND admin_profile.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.user_profiles admin_profile
      WHERE admin_profile.user_id = auth.uid()
        AND admin_profile.company_id = threat_reports.company_id
        AND admin_profile.role = 'admin'
        AND admin_profile.is_active = true
    )
  );

DROP POLICY IF EXISTS threat_reports_service_role ON public.threat_reports;
CREATE POLICY threat_reports_service_role ON public.threat_reports
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE INDEX IF NOT EXISTS threat_reports_company_id_idx ON public.threat_reports(company_id);
CREATE INDEX IF NOT EXISTS threat_reports_reporter_id_idx ON public.threat_reports(reporter_id);
CREATE INDEX IF NOT EXISTS threat_reports_status_idx ON public.threat_reports(status);
CREATE INDEX IF NOT EXISTS threat_reports_severity_idx ON public.threat_reports(severity);
