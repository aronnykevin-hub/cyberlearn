CREATE TABLE IF NOT EXISTS public.training_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  module_id UUID NOT NULL REFERENCES public.training_modules(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed')),
  score NUMERIC(5,2),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  current_slide INTEGER NOT NULL DEFAULT 0,
  quiz_answers INTEGER[],
  attempts INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, module_id)
);

ALTER TABLE public.training_progress ENABLE ROW LEVEL SECURITY;

-- Employees can access only their own progress once assigned to company + department.
DROP POLICY IF EXISTS training_progress_read_own_assigned ON public.training_progress;
CREATE POLICY training_progress_read_own_assigned ON public.training_progress
  FOR SELECT
  USING (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1
      FROM public.user_profiles up
      WHERE up.user_id = auth.uid()
        AND up.company_id = training_progress.company_id
        AND up.department_id IS NOT NULL
        AND up.is_active = true
    )
  );

DROP POLICY IF EXISTS training_progress_insert_own_assigned ON public.training_progress;
CREATE POLICY training_progress_insert_own_assigned ON public.training_progress
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1
      FROM public.user_profiles up
      WHERE up.user_id = auth.uid()
        AND up.company_id = training_progress.company_id
        AND up.department_id IS NOT NULL
        AND up.is_active = true
    )
  );

DROP POLICY IF EXISTS training_progress_update_own_assigned ON public.training_progress;
CREATE POLICY training_progress_update_own_assigned ON public.training_progress
  FOR UPDATE
  USING (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1
      FROM public.user_profiles up
      WHERE up.user_id = auth.uid()
        AND up.company_id = training_progress.company_id
        AND up.department_id IS NOT NULL
        AND up.is_active = true
    )
  )
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1
      FROM public.user_profiles up
      WHERE up.user_id = auth.uid()
        AND up.company_id = training_progress.company_id
        AND up.department_id IS NOT NULL
        AND up.is_active = true
    )
  );

-- Company admins can read all company progress.
DROP POLICY IF EXISTS training_progress_read_company_admin ON public.training_progress;
CREATE POLICY training_progress_read_company_admin ON public.training_progress
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.user_profiles admin_profile
      WHERE admin_profile.user_id = auth.uid()
        AND admin_profile.company_id = training_progress.company_id
        AND admin_profile.role = 'admin'
        AND admin_profile.is_active = true
    )
  );

DROP POLICY IF EXISTS training_progress_service_role ON public.training_progress;
CREATE POLICY training_progress_service_role ON public.training_progress
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE INDEX IF NOT EXISTS training_progress_company_id_idx ON public.training_progress(company_id);
CREATE INDEX IF NOT EXISTS training_progress_user_id_idx ON public.training_progress(user_id);
CREATE INDEX IF NOT EXISTS training_progress_module_id_idx ON public.training_progress(module_id);
CREATE INDEX IF NOT EXISTS training_progress_status_idx ON public.training_progress(status);
