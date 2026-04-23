-- Auto-issue certificates when a user completes a training module quiz.

ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_progress ENABLE ROW LEVEL SECURITY;

-- Ensure one certificate per user/module.
CREATE UNIQUE INDEX IF NOT EXISTS certificates_user_module_unique_idx
ON public.certificates(user_id, training_module_id);

-- Allow users to insert only their own certificates and only for completed modules.
DROP POLICY IF EXISTS certificates_user_insert_completed ON public.certificates;
CREATE POLICY certificates_user_insert_completed ON public.certificates
  FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM public.training_progress tp
      WHERE tp.user_id = auth.uid()
        AND tp.module_id = certificates.training_module_id
        AND tp.company_id = certificates.company_id
        AND tp.status = 'completed'
    )
  );

CREATE OR REPLACE FUNCTION public.issue_training_certificate_on_completion()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_module_title TEXT;
  v_company_id UUID;
  v_employee_name TEXT;
BEGIN
  IF NEW.status <> 'completed' THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' AND COALESCE(OLD.status, 'not_started') = 'completed' THEN
    RETURN NEW;
  END IF;

  SELECT tm.title, tm.company_id
  INTO v_module_title, v_company_id
  FROM public.training_modules tm
  WHERE tm.id = NEW.module_id;

  IF v_module_title IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT COALESCE(up.full_name, u.email, 'Employee')
  INTO v_employee_name
  FROM public.users u
  LEFT JOIN public.user_profiles up ON up.user_id = u.id
  WHERE u.id = NEW.user_id;

  INSERT INTO public.certificates (
    user_id,
    training_module_id,
    company_id,
    certificate_number,
    issue_date,
    employee_name,
    module_title,
    completion_score,
    status,
    is_verified,
    created_at,
    updated_at
  )
  VALUES (
    NEW.user_id,
    NEW.module_id,
    COALESCE(NEW.company_id, v_company_id),
    NULL,
    NOW(),
    COALESCE(v_employee_name, 'Employee'),
    v_module_title,
    NEW.score,
    'issued',
    true,
    NOW(),
    NOW()
  )
  ON CONFLICT (user_id, training_module_id) DO UPDATE
    SET completion_score = EXCLUDED.completion_score,
        status = 'issued',
        updated_at = NOW();

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS training_progress_issue_certificate ON public.training_progress;
CREATE TRIGGER training_progress_issue_certificate
AFTER INSERT OR UPDATE OF status, score ON public.training_progress
FOR EACH ROW
EXECUTE FUNCTION public.issue_training_certificate_on_completion();
