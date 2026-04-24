-- Team Members: default department bootstrap + global user search

CREATE OR REPLACE FUNCTION public.ensure_company_default_departments(
  p_company_id UUID,
  p_departments TEXT[] DEFAULT NULL
)
RETURNS TABLE (
  department_id UUID,
  department_name TEXT,
  department_code TEXT,
  created BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_department_names TEXT[];
BEGIN
  IF p_company_id IS NULL THEN
    RAISE EXCEPTION 'Company id is required';
  END IF;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.company_members cm
    WHERE cm.company_id = p_company_id
      AND cm.user_id = v_user_id
      AND cm.role IN ('owner', 'admin')
  ) AND NOT EXISTS (
    SELECT 1
    FROM public.companies c
    WHERE c.id = p_company_id
      AND c.created_by = v_user_id
  ) THEN
    RAISE EXCEPTION 'Only company admins can bootstrap departments';
  END IF;

  v_department_names := COALESCE(p_departments, ARRAY[]::TEXT[]);
  IF array_length(v_department_names, 1) IS NULL THEN
    v_department_names := ARRAY[
      'IT / Cybersecurity',
      'Finance',
      'Customer Care',
      'Human Resources (HR)',
      'Marketing',
      'Operations'
    ]::TEXT[];
  END IF;

  RETURN QUERY
  WITH normalized AS (
    SELECT DISTINCT ON (LOWER(TRIM(src.name)))
      TRIM(src.name) AS name,
      LEFT(
        REGEXP_REPLACE(UPPER(TRIM(src.name)), '[^A-Z0-9]+', '_', 'g'),
        32
      ) AS code,
      src.ord
    FROM unnest(v_department_names) WITH ORDINALITY AS src(name, ord)
    WHERE TRIM(src.name) <> ''
    ORDER BY LOWER(TRIM(src.name)), src.ord
  ),
  existing AS (
    SELECT d.name
    FROM public.departments d
    WHERE d.company_id = p_company_id
  ),
  inserted AS (
    INSERT INTO public.departments (company_id, name, code)
    SELECT p_company_id, n.name, COALESCE(NULLIF(n.code, ''), LEFT(REGEXP_REPLACE(UPPER(n.name), '[^A-Z0-9]+', '_', 'g'), 32))
    FROM normalized n
    LEFT JOIN existing e
      ON e.name = n.name
    WHERE e.name IS NULL
    ON CONFLICT (company_id, name) DO NOTHING
    RETURNING id, name, code
  ),
  final_rows AS (
    SELECT
      dept.id,
      dept.name,
      dept.code,
      EXISTS (SELECT 1 FROM inserted i WHERE i.id = dept.id) AS created,
      n.ord
    FROM normalized n
    JOIN public.departments dept
      ON dept.company_id = p_company_id
     AND dept.name = n.name
  )
  SELECT
    fr.id AS department_id,
    fr.name AS department_name,
    fr.code AS department_code,
    fr.created
  FROM final_rows fr
  ORDER BY fr.ord;
END;
$$;

-- Remove any overloaded variants that can break PostgREST RPC resolution.
DROP FUNCTION IF EXISTS public.search_cyberlearn_users(UUID, TEXT, INTEGER);
DROP FUNCTION IF EXISTS public.search_cyberlearn_users(TEXT, UUID, INTEGER);

CREATE OR REPLACE FUNCTION public.search_cyberlearn_users(
  p_company_id UUID,
  p_query TEXT,
  p_limit INTEGER DEFAULT 20
)
RETURNS TABLE (
  user_id UUID,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  is_company_member BOOLEAN,
  member_role TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_query TEXT := LOWER(TRIM(COALESCE(p_query, '')));
  v_limit INTEGER := LEAST(GREATEST(COALESCE(p_limit, 20), 1), 100);
BEGIN
  IF p_company_id IS NULL THEN
    RAISE EXCEPTION 'Company id is required';
  END IF;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.company_members cm
    WHERE cm.company_id = p_company_id
      AND cm.user_id = v_user_id
      AND cm.role IN ('owner', 'admin')
  ) AND NOT EXISTS (
    SELECT 1
    FROM public.companies c
    WHERE c.id = p_company_id
      AND c.created_by = v_user_id
  ) THEN
    RAISE EXCEPTION 'Only company admins can search users';
  END IF;

  RETURN QUERY
  WITH user_pool AS (
    SELECT
      au.id AS user_id,
      COALESCE(au.email::text, ''::text) AS email,
      COALESCE(
        NULLIF(up.full_name, ''),
        NULLIF(au.raw_user_meta_data->>'full_name', ''),
        NULLIF(au.raw_user_meta_data->>'name', ''),
        NULLIF(
          CONCAT_WS(
            ' ',
            NULLIF(au.raw_user_meta_data->>'given_name', ''),
            NULLIF(au.raw_user_meta_data->>'family_name', '')
          ),
          ''
        ),
        COALESCE(au.email::text, ''::text)
      )::text AS full_name,
      COALESCE(up.avatar_url::text, (au.raw_user_meta_data->>'avatar_url')::text) AS avatar_url
    FROM auth.users au
    LEFT JOIN public.user_profiles up
      ON up.user_id = au.id
  )
  SELECT
    up.user_id::uuid,
    up.email::text,
    up.full_name::text,
    up.avatar_url::text,
    (cm.user_id IS NOT NULL)::boolean AS is_company_member,
    cm.role::text AS member_role
  FROM user_pool up
  LEFT JOIN public.company_members cm
    ON cm.company_id = p_company_id
   AND cm.user_id = up.user_id
  WHERE
    v_query = ''
    OR LOWER(up.email) LIKE '%' || v_query || '%'
    OR LOWER(COALESCE(up.full_name, '')) LIKE '%' || v_query || '%'
  ORDER BY
    CASE WHEN cm.user_id IS NULL THEN 0 ELSE 1 END,
    up.full_name,
    up.email
  LIMIT v_limit;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_company_with_owner(
  p_name TEXT,
  p_registration_number TEXT,
  p_industry TEXT,
  p_country TEXT,
  p_address TEXT,
  p_departments TEXT[] DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_owner_id UUID;
  v_company_id UUID;
  v_auth_user auth.users%ROWTYPE;
BEGIN
  v_owner_id := auth.uid();

  IF v_owner_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  SELECT *
  INTO v_auth_user
  FROM auth.users au
  WHERE au.id = v_owner_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Authenticated user record not found';
  END IF;

  INSERT INTO public.users (id, email)
  VALUES (v_owner_id, COALESCE(v_auth_user.email, ''))
  ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email,
        updated_at = NOW();

  INSERT INTO public.user_profiles (
    user_id,
    company_id,
    full_name,
    phone,
    avatar_url,
    role,
    is_department_assigned,
    is_active
  )
  VALUES (
    v_owner_id,
    NULL,
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

  INSERT INTO public.companies (
    name,
    registration_number,
    industry,
    country,
    address,
    created_by
  )
  VALUES (
    p_name,
    p_registration_number,
    p_industry,
    p_country,
    p_address,
    v_owner_id
  )
  RETURNING id INTO v_company_id;

  INSERT INTO public.company_members (
    company_id,
    user_id,
    role,
    added_by
  )
  VALUES (
    v_company_id,
    v_owner_id,
    'owner',
    v_owner_id
  )
  ON CONFLICT (company_id, user_id) DO UPDATE
    SET role = 'owner',
        added_by = EXCLUDED.added_by;

  UPDATE public.user_profiles
  SET role = 'admin',
      company_id = v_company_id,
      is_active = true,
      updated_at = NOW()
  WHERE user_id = v_owner_id;

  PERFORM public.ensure_company_default_departments(v_company_id, p_departments);

  RETURN v_company_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.ensure_company_default_departments(UUID, TEXT[]) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.search_cyberlearn_users(UUID, TEXT, INTEGER) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.create_company_with_owner(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT[]) TO authenticated, service_role;
