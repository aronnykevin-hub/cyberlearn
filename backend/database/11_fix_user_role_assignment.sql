-- Compatibility patch for legacy environments.
-- Aligns role assignment behavior with the canonical company_members model.

ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS is_department_assigned BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS assigned_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS full_name TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS avatar_url TEXT,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE public.user_profiles
ALTER COLUMN role DROP NOT NULL;

ALTER TABLE public.user_profiles
ALTER COLUMN role DROP DEFAULT;

CREATE OR REPLACE FUNCTION public.resolve_auth_display_name(
  p_metadata JSONB,
  p_fallback_email TEXT
)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT COALESCE(
    NULLIF(p_metadata->>'full_name', ''),
    NULLIF(p_metadata->>'name', ''),
    NULLIF(p_metadata->>'display_name', ''),
    NULLIF(p_metadata->>'preferred_username', ''),
    NULLIF(
      CONCAT_WS(
        ' ',
        NULLIF(p_metadata->>'given_name', ''),
        NULLIF(p_metadata->>'family_name', '')
      ),
      ''
    ),
    NULLIF(p_fallback_email, ''),
    ''
  );
$$;

DROP FUNCTION IF EXISTS public.find_cyberlearn_user_by_email(TEXT);

CREATE OR REPLACE FUNCTION public.find_cyberlearn_user_by_email(
  p_email TEXT
)
RETURNS TABLE (
  user_id UUID,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_auth_user auth.users%ROWTYPE;
  v_email TEXT := LOWER(TRIM(COALESCE(p_email, '')));
BEGIN
  IF v_email = '' THEN
    RAISE EXCEPTION 'Email is required';
  END IF;

  SELECT *
  INTO v_auth_user
  FROM auth.users au
  WHERE LOWER(au.email) = v_email;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  INSERT INTO public.users (id, email)
  VALUES (v_auth_user.id, COALESCE(v_auth_user.email, ''))
  ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email,
        updated_at = NOW();

  INSERT INTO public.user_profiles (
    user_id,
    full_name,
    phone,
    avatar_url,
    role,
    is_department_assigned,
    is_active
  )
  VALUES (
    v_auth_user.id,
    public.resolve_auth_display_name(v_auth_user.raw_user_meta_data, v_auth_user.email),
    COALESCE(v_auth_user.raw_user_meta_data->>'phone_number', v_auth_user.raw_user_meta_data->>'phone'),
    v_auth_user.raw_user_meta_data->>'avatar_url',
    NULL,
    false,
    true
  )
  ON CONFLICT (user_id) DO UPDATE
    SET full_name = COALESCE(public.user_profiles.full_name, EXCLUDED.full_name),
        phone = COALESCE(public.user_profiles.phone, EXCLUDED.phone),
        avatar_url = COALESCE(public.user_profiles.avatar_url, EXCLUDED.avatar_url),
        is_active = true;

  RETURN QUERY
  SELECT
    v_auth_user.id,
    v_auth_user.email,
    public.resolve_auth_display_name(v_auth_user.raw_user_meta_data, v_auth_user.email),
    v_auth_user.raw_user_meta_data->>'avatar_url';
END;
$$;

DROP FUNCTION IF EXISTS public.create_company_with_owner(TEXT, TEXT, TEXT, TEXT, TEXT, UUID);

UPDATE public.user_profiles up
SET role = NULL
WHERE up.role = 'employee'
  AND COALESCE(up.is_department_assigned, false) = false
  AND NOT EXISTS (
    SELECT 1
    FROM public.company_members cm
    WHERE cm.user_id = up.user_id
      AND cm.role IN ('owner', 'admin')
  );

-- create_company_with_owner function moved to 15_team_member_user_search_and_default_departments.sql
-- This older version is deprecated and replaced with one that handles p_departments parameter

CREATE OR REPLACE FUNCTION public.assign_user_to_department(
  p_user_id UUID,
  p_department_id UUID,
  p_assigned_by UUID
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_company_id UUID;
BEGIN
  SELECT d.company_id
  INTO v_company_id
  FROM public.departments d
  WHERE d.id = p_department_id;

  IF v_company_id IS NULL THEN
    RAISE EXCEPTION 'Department not found';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.company_members cm
    WHERE cm.company_id = v_company_id
      AND cm.user_id = p_assigned_by
      AND cm.role IN ('owner', 'admin')
  ) AND NOT EXISTS (
    SELECT 1
    FROM public.companies c
    WHERE c.id = v_company_id
      AND c.created_by = p_assigned_by
  ) THEN
    RAISE EXCEPTION 'Only company admins can assign departments';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.company_members cm
    WHERE cm.company_id = v_company_id
      AND cm.user_id = p_user_id
  ) THEN
    RAISE EXCEPTION 'User must be a company member before department assignment';
  END IF;

  INSERT INTO public.user_profiles (
    user_id,
    role,
    department_id,
    is_department_assigned,
    assigned_at,
    assigned_by,
    is_active
  )
  VALUES (
    p_user_id,
    'employee',
    p_department_id,
    true,
    NOW(),
    p_assigned_by,
    true
  )
  ON CONFLICT (user_id) DO UPDATE
    SET role = 'employee',
        department_id = EXCLUDED.department_id,
        is_department_assigned = true,
        assigned_at = NOW(),
        assigned_by = EXCLUDED.assigned_by,
        is_active = true;
END;
$$;

-- GRANT moved to 15_team_member_user_search_and_default_departments.sql with correct signature
-- GRANT EXECUTE ON FUNCTION public.create_company_with_owner(TEXT, TEXT, TEXT, TEXT, TEXT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.find_cyberlearn_user_by_email(TEXT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.assign_user_to_department(UUID, UUID, UUID) TO authenticated, service_role;

SELECT proname
FROM pg_proc
WHERE pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
  AND proname IN ('create_company_with_owner', 'assign_user_to_department')
ORDER BY proname;
