-- Threat reporting enhancements:
-- 1) Threaded admin replies for employee-submitted reports.
-- 2) Automated notifications on report submission and admin reply.
-- 3) Occasional simulated ("fake") security drill notifications.

CREATE TABLE IF NOT EXISTS public.threat_report_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES public.threat_reports(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  author_role TEXT NOT NULL CHECK (author_role IN ('admin', 'employee')),
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.threat_report_replies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS threat_report_replies_read_reporter_admin ON public.threat_report_replies;
CREATE POLICY threat_report_replies_read_reporter_admin ON public.threat_report_replies
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.threat_reports tr
      WHERE tr.id = threat_report_replies.report_id
        AND (
          tr.reporter_id = auth.uid()
          OR EXISTS (
            SELECT 1
            FROM public.user_profiles admin_profile
            WHERE admin_profile.user_id = auth.uid()
              AND admin_profile.company_id = tr.company_id
              AND admin_profile.role = 'admin'
              AND admin_profile.is_active = true
          )
        )
    )
  );

DROP POLICY IF EXISTS threat_report_replies_insert_admin ON public.threat_report_replies;
CREATE POLICY threat_report_replies_insert_admin ON public.threat_report_replies
  FOR INSERT
  WITH CHECK (
    author_id = auth.uid()
    AND author_role = 'admin'
    AND EXISTS (
      SELECT 1
      FROM public.user_profiles admin_profile
      WHERE admin_profile.user_id = auth.uid()
        AND admin_profile.company_id = threat_report_replies.company_id
        AND admin_profile.role = 'admin'
        AND admin_profile.is_active = true
    )
    AND EXISTS (
      SELECT 1
      FROM public.threat_reports tr
      WHERE tr.id = threat_report_replies.report_id
        AND tr.company_id = threat_report_replies.company_id
    )
  );

DROP POLICY IF EXISTS threat_report_replies_service_role ON public.threat_report_replies;
CREATE POLICY threat_report_replies_service_role ON public.threat_report_replies
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE INDEX IF NOT EXISTS threat_report_replies_report_id_idx ON public.threat_report_replies(report_id);
CREATE INDEX IF NOT EXISTS threat_report_replies_company_id_idx ON public.threat_report_replies(company_id);
CREATE INDEX IF NOT EXISTS threat_report_replies_author_id_idx ON public.threat_report_replies(author_id);
CREATE INDEX IF NOT EXISTS threat_report_replies_created_at_idx ON public.threat_report_replies(created_at);

CREATE OR REPLACE FUNCTION public.touch_threat_report_replies_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_touch_threat_report_replies_updated_at ON public.threat_report_replies;
CREATE TRIGGER trg_touch_threat_report_replies_updated_at
BEFORE UPDATE ON public.threat_report_replies
FOR EACH ROW
EXECUTE FUNCTION public.touch_threat_report_replies_updated_at();

CREATE OR REPLACE FUNCTION public.notify_admins_on_threat_report()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_reporter_name TEXT;
BEGIN
  SELECT COALESCE(up.full_name, u.email, 'Employee')
  INTO v_reporter_name
  FROM public.users u
  LEFT JOIN public.user_profiles up
    ON up.user_id = u.id
  WHERE u.id = NEW.reporter_id;

  INSERT INTO public.notifications (
    company_id,
    user_id,
    title,
    message,
    type,
    related_id,
    is_read
  )
  SELECT
    NEW.company_id,
    cm.user_id,
    'New Threat Report Submitted',
    format('%s reported "%s" (%s severity).', COALESCE(v_reporter_name, 'Employee'), NEW.title, NEW.severity),
    'report',
    NEW.id::text,
    false
  FROM public.company_members cm
  WHERE cm.company_id = NEW.company_id
    AND cm.role IN ('owner', 'admin')
    AND cm.user_id <> NEW.reporter_id
  ON CONFLICT DO NOTHING;

  IF random() < 0.30 THEN
    INSERT INTO public.notifications (
      company_id,
      user_id,
      title,
      message,
      type,
      related_id,
      is_read
    )
    VALUES (
      NEW.company_id,
      NEW.reporter_id,
      '[Simulation Drill] Suspicious Login Alert',
      'This is a simulated security notification. Validate request authenticity before taking action.',
      'system',
      NEW.id::text,
      false
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_admins_on_threat_report ON public.threat_reports;
CREATE TRIGGER trg_notify_admins_on_threat_report
AFTER INSERT ON public.threat_reports
FOR EACH ROW
EXECUTE FUNCTION public.notify_admins_on_threat_report();

CREATE OR REPLACE FUNCTION public.notify_reporter_on_admin_reply()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_reporter_id UUID;
BEGIN
  SELECT tr.reporter_id
  INTO v_reporter_id
  FROM public.threat_reports tr
  WHERE tr.id = NEW.report_id;

  IF v_reporter_id IS NOT NULL THEN
    INSERT INTO public.notifications (
      company_id,
      user_id,
      title,
      message,
      type,
      related_id,
      is_read
    )
    VALUES (
      NEW.company_id,
      v_reporter_id,
      'Admin Replied to Your Threat Report',
      LEFT(NEW.message, 240),
      'report',
      NEW.report_id::text,
      false
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_reporter_on_admin_reply ON public.threat_report_replies;
CREATE TRIGGER trg_notify_reporter_on_admin_reply
AFTER INSERT ON public.threat_report_replies
FOR EACH ROW
EXECUTE FUNCTION public.notify_reporter_on_admin_reply();

CREATE OR REPLACE FUNCTION public.submit_threat_report(
  p_type TEXT,
  p_severity TEXT,
  p_title TEXT,
  p_description TEXT,
  p_affected_systems TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_profile RECORD;
  v_report_id UUID;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  SELECT
    up.company_id,
    up.department_id,
    up.is_department_assigned,
    up.is_active
  INTO v_profile
  FROM public.user_profiles up
  WHERE up.user_id = v_user_id;

  IF NOT FOUND OR v_profile.company_id IS NULL THEN
    RAISE EXCEPTION 'User is not linked to a company';
  END IF;

  IF COALESCE(v_profile.is_active, false) = false THEN
    RAISE EXCEPTION 'Inactive users cannot submit threat reports';
  END IF;

  IF COALESCE(v_profile.is_department_assigned, false) = false
     OR v_profile.department_id IS NULL THEN
    RAISE EXCEPTION 'Department assignment is required before submitting threat reports';
  END IF;

  INSERT INTO public.threat_reports (
    company_id,
    reporter_id,
    reporter_department_id,
    type,
    severity,
    title,
    description,
    affected_systems,
    status
  )
  VALUES (
    v_profile.company_id,
    v_user_id,
    v_profile.department_id,
    p_type,
    p_severity,
    p_title,
    p_description,
    p_affected_systems,
    'open'
  )
  RETURNING id INTO v_report_id;

  RETURN v_report_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.reply_to_threat_report(
  p_report_id UUID,
  p_message TEXT,
  p_status TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_report RECORD;
  v_reply_id UUID;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF p_report_id IS NULL THEN
    RAISE EXCEPTION 'Report id is required';
  END IF;

  IF COALESCE(TRIM(p_message), '') = '' THEN
    RAISE EXCEPTION 'Reply message is required';
  END IF;

  SELECT tr.*
  INTO v_report
  FROM public.threat_reports tr
  WHERE tr.id = p_report_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Threat report not found';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.user_profiles up
    WHERE up.user_id = v_user_id
      AND up.company_id = v_report.company_id
      AND up.role = 'admin'
      AND up.is_active = true
  ) THEN
    RAISE EXCEPTION 'Only company admins can reply to threat reports';
  END IF;

  INSERT INTO public.threat_report_replies (
    report_id,
    company_id,
    author_id,
    author_role,
    message
  )
  VALUES (
    p_report_id,
    v_report.company_id,
    v_user_id,
    'admin',
    p_message
  )
  RETURNING id INTO v_reply_id;

  UPDATE public.threat_reports tr
  SET
    admin_notes = CASE
      WHEN tr.admin_notes IS NULL OR tr.admin_notes = ''
      THEN p_message
      ELSE tr.admin_notes || E'\n\n' || p_message
    END,
    status = CASE
      WHEN p_status IN ('open', 'investigating', 'resolved', 'dismissed') THEN p_status
      ELSE tr.status
    END,
    resolved_at = CASE
      WHEN p_status = 'resolved' THEN NOW()
      WHEN p_status IN ('open', 'investigating', 'dismissed') THEN NULL
      ELSE tr.resolved_at
    END,
    resolved_by = CASE
      WHEN p_status = 'resolved' THEN v_user_id
      WHEN p_status IN ('open', 'investigating', 'dismissed') THEN NULL
      ELSE tr.resolved_by
    END,
    updated_at = NOW()
  WHERE tr.id = p_report_id;

  RETURN v_reply_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.submit_threat_report(TEXT, TEXT, TEXT, TEXT, TEXT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.reply_to_threat_report(UUID, TEXT, TEXT) TO authenticated, service_role;
