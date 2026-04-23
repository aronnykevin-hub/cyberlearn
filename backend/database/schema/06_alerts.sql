CREATE TABLE IF NOT EXISTS public.alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  target_department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('info', 'warning', 'danger', 'critical')),
  target_role TEXT NOT NULL CHECK (target_role IN ('all', 'employee', 'admin')),
  created_by UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;

-- Company members read active alerts that match role + department targeting.
DROP POLICY IF EXISTS alerts_read_company_members ON public.alerts;
CREATE POLICY alerts_read_company_members ON public.alerts
  FOR SELECT
  USING (
    is_active = true
    AND (expires_at IS NULL OR expires_at > NOW())
    AND EXISTS (
      SELECT 1
      FROM public.user_profiles up
      WHERE up.user_id = auth.uid()
        AND up.company_id = alerts.company_id
        AND up.is_active = true
        AND (
          alerts.target_role = 'all'
          OR alerts.target_role = up.role
        )
        AND (
          alerts.target_department_id IS NULL
          OR alerts.target_department_id = up.department_id
          OR up.role = 'admin'
        )
    )
  );

DROP POLICY IF EXISTS alerts_manage_company_admin ON public.alerts;
CREATE POLICY alerts_manage_company_admin ON public.alerts
  FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM public.user_profiles admin_profile
      WHERE admin_profile.user_id = auth.uid()
        AND admin_profile.company_id = alerts.company_id
        AND admin_profile.role = 'admin'
        AND admin_profile.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.user_profiles admin_profile
      WHERE admin_profile.user_id = auth.uid()
        AND admin_profile.company_id = alerts.company_id
        AND admin_profile.role = 'admin'
        AND admin_profile.is_active = true
    )
  );

DROP POLICY IF EXISTS alerts_service_role ON public.alerts;
CREATE POLICY alerts_service_role ON public.alerts
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE INDEX IF NOT EXISTS alerts_company_id_idx ON public.alerts(company_id);
CREATE INDEX IF NOT EXISTS alerts_target_department_id_idx ON public.alerts(target_department_id);
CREATE INDEX IF NOT EXISTS alerts_is_active_idx ON public.alerts(is_active);
CREATE INDEX IF NOT EXISTS alerts_target_role_idx ON public.alerts(target_role);
