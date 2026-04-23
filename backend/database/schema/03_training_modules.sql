CREATE TABLE IF NOT EXISTS public.training_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  target_department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL CHECK (
    category IN ('phishing', 'password', 'social_engineering', 'malware', 'data_protection', 'incident_response')
  ),
  difficulty TEXT NOT NULL CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  estimated_minutes INTEGER NOT NULL CHECK (estimated_minutes > 0),
  content JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  passing_score NUMERIC(5,2) NOT NULL DEFAULT 70.0,
  created_by UUID NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.training_modules ENABLE ROW LEVEL SECURITY;

-- Only assigned company members can read modules.
-- Admins in the company can read all; employees read global or department-targeted modules.
DROP POLICY IF EXISTS training_modules_read_company_members ON public.training_modules;
CREATE POLICY training_modules_read_company_members ON public.training_modules
  FOR SELECT
  USING (
    is_active = true
    AND EXISTS (
      SELECT 1
      FROM public.user_profiles up
      WHERE up.user_id = auth.uid()
        AND up.company_id = training_modules.company_id
        AND up.is_active = true
        AND up.department_id IS NOT NULL
        AND (
          up.role = 'admin'
          OR training_modules.target_department_id IS NULL
          OR training_modules.target_department_id = up.department_id
        )
    )
  );

DROP POLICY IF EXISTS training_modules_manage_company_admin ON public.training_modules;
CREATE POLICY training_modules_manage_company_admin ON public.training_modules
  FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM public.user_profiles up
      WHERE up.user_id = auth.uid()
        AND up.company_id = training_modules.company_id
        AND up.role = 'admin'
        AND up.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.user_profiles up
      WHERE up.user_id = auth.uid()
        AND up.company_id = training_modules.company_id
        AND up.role = 'admin'
        AND up.is_active = true
    )
  );

DROP POLICY IF EXISTS training_modules_service_role ON public.training_modules;
CREATE POLICY training_modules_service_role ON public.training_modules
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE INDEX IF NOT EXISTS training_modules_company_id_idx ON public.training_modules(company_id);
CREATE INDEX IF NOT EXISTS training_modules_target_department_id_idx ON public.training_modules(target_department_id);
CREATE INDEX IF NOT EXISTS training_modules_is_active_idx ON public.training_modules(is_active);
CREATE INDEX IF NOT EXISTS training_modules_category_idx ON public.training_modules(category);
