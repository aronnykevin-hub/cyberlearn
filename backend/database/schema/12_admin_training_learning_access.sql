-- Allow company admins to learn training modules without department assignment.
-- Employees still require department assignment and only see allowed modules.

ALTER TABLE public.training_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_progress ENABLE ROW LEVEL SECURITY;

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
        AND (
          up.role = 'admin'
          OR (
            up.department_id IS NOT NULL
            AND (
              training_modules.target_department_id IS NULL
              OR training_modules.target_department_id = up.department_id
            )
          )
        )
    )
  );

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
        AND up.is_active = true
        AND (
          up.role = 'admin'
          OR up.department_id IS NOT NULL
        )
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
        AND up.is_active = true
        AND (
          up.role = 'admin'
          OR up.department_id IS NOT NULL
        )
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
        AND up.is_active = true
        AND (
          up.role = 'admin'
          OR up.department_id IS NOT NULL
        )
    )
  )
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1
      FROM public.user_profiles up
      WHERE up.user_id = auth.uid()
        AND up.company_id = training_progress.company_id
        AND up.is_active = true
        AND (
          up.role = 'admin'
          OR up.department_id IS NOT NULL
        )
    )
  );
