-- Self-service profile edits
-- Allows authenticated users to update their own display-oriented profile fields
-- without touching company, department, or role assignment data.

CREATE OR REPLACE FUNCTION public.update_my_profile(
  p_full_name TEXT DEFAULT NULL,
  p_job_title TEXT DEFAULT NULL,
  p_phone TEXT DEFAULT NULL
)
RETURNS public.user_profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_company_id UUID;
  v_role TEXT := 'employee';
  v_profile public.user_profiles%ROWTYPE;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  SELECT
    cm.company_id,
    CASE
      WHEN cm.role IN ('owner', 'admin') THEN 'admin'
      ELSE 'employee'
    END
  INTO v_company_id, v_role
  FROM public.company_members cm
  WHERE cm.user_id = v_user_id
  ORDER BY CASE WHEN cm.role = 'owner' THEN 1 WHEN cm.role = 'admin' THEN 2 ELSE 3 END
  LIMIT 1;

  UPDATE public.user_profiles
  SET
    full_name = NULLIF(BTRIM(p_full_name), ''),
    job_title = NULLIF(BTRIM(p_job_title), ''),
    phone = NULLIF(BTRIM(p_phone), ''),
    updated_at = NOW()
  WHERE user_id = v_user_id
  RETURNING * INTO v_profile;

  IF NOT FOUND THEN
    INSERT INTO public.user_profiles (
      user_id,
      full_name,
      job_title,
      phone,
      company_id,
      role,
      is_active
    )
    VALUES (
      v_user_id,
      NULLIF(BTRIM(p_full_name), ''),
      NULLIF(BTRIM(p_job_title), ''),
      NULLIF(BTRIM(p_phone), ''),
      v_company_id,
      v_role,
      true
    )
    RETURNING * INTO v_profile;
  END IF;

  RETURN v_profile;
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_my_profile(TEXT, TEXT, TEXT) TO authenticated, service_role;
