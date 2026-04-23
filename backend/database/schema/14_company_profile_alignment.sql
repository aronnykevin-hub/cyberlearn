-- Align user_profiles company linkage with company_members so
-- department-scoped learning modules are visible/assignable.

-- Backfill company_id from assigned department when possible.
UPDATE public.user_profiles up
SET company_id = d.company_id
FROM public.departments d
WHERE up.department_id = d.id
  AND up.company_id IS NULL;

-- Backfill company_id from most recent company_members record.
UPDATE public.user_profiles up
SET company_id = cm.company_id
FROM (
  SELECT DISTINCT ON (user_id) user_id, company_id
  FROM public.company_members
  ORDER BY user_id, joined_at DESC
) cm
WHERE up.user_id = cm.user_id
  AND up.company_id IS NULL;

-- Ensure company creators are marked as admin and linked to their company.
UPDATE public.user_profiles up
SET company_id = c.id,
    role = 'admin',
    is_active = true,
    updated_at = NOW()
FROM public.companies c
WHERE c.created_by = up.user_id
  AND (up.company_id IS NULL OR up.company_id = c.id);

CREATE OR REPLACE FUNCTION public.create_company_with_owner(
  p_name TEXT,
  p_registration_number TEXT,
  p_industry TEXT,
  p_country TEXT,
  p_address TEXT
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

  RETURN v_company_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.add_user_to_company(
  p_company_id UUID,
  p_user_id UUID,
  p_added_by UUID,
  p_role TEXT DEFAULT 'member'
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_auth_user auth.users%ROWTYPE;
BEGIN
  IF p_role NOT IN ('member', 'admin') THEN
    RAISE EXCEPTION 'Invalid company role: %', p_role;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.company_members cm
    WHERE cm.company_id = p_company_id
      AND cm.user_id = p_added_by
      AND cm.role IN ('owner', 'admin')
  ) AND NOT EXISTS (
    SELECT 1
    FROM public.companies c
    WHERE c.id = p_company_id
      AND c.created_by = p_added_by
  ) THEN
    RAISE EXCEPTION 'Only company admins or owners can add users';
  END IF;

  SELECT *
  INTO v_auth_user
  FROM auth.users au
  WHERE au.id = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User does not exist in auth.users';
  END IF;

  INSERT INTO public.users (id, email)
  VALUES (p_user_id, COALESCE(v_auth_user.email, ''))
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
    p_user_id,
    p_company_id,
    public.resolve_auth_display_name(v_auth_user.raw_user_meta_data, v_auth_user.email),
    COALESCE(v_auth_user.raw_user_meta_data->>'phone_number', v_auth_user.raw_user_meta_data->>'phone'),
    v_auth_user.raw_user_meta_data->>'avatar_url',
    CASE WHEN p_role = 'admin' THEN 'admin' ELSE NULL END,
    false,
    true
  )
  ON CONFLICT (user_id) DO UPDATE
    SET company_id = COALESCE(public.user_profiles.company_id, EXCLUDED.company_id),
        full_name = COALESCE(public.user_profiles.full_name, EXCLUDED.full_name),
        phone = COALESCE(public.user_profiles.phone, EXCLUDED.phone),
        avatar_url = COALESCE(public.user_profiles.avatar_url, EXCLUDED.avatar_url),
        role = CASE
          WHEN p_role = 'admin' THEN 'admin'
          ELSE public.user_profiles.role
        END,
        is_active = true,
        updated_at = NOW();

  INSERT INTO public.company_members (
    company_id,
    user_id,
    role,
    added_by
  )
  VALUES (
    p_company_id,
    p_user_id,
    p_role,
    p_added_by
  )
  ON CONFLICT (company_id, user_id) DO UPDATE
    SET role = EXCLUDED.role,
        added_by = EXCLUDED.added_by;

  RETURN true;
END;
$$;

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
    company_id,
    role,
    department_id,
    is_department_assigned,
    assigned_at,
    assigned_by,
    is_active
  )
  VALUES (
    p_user_id,
    v_company_id,
    'employee',
    p_department_id,
    true,
    NOW(),
    p_assigned_by,
    true
  )
  ON CONFLICT (user_id) DO UPDATE
    SET company_id = COALESCE(public.user_profiles.company_id, v_company_id),
        role = 'employee',
        department_id = EXCLUDED.department_id,
        is_department_assigned = true,
        assigned_at = NOW(),
        assigned_by = EXCLUDED.assigned_by,
        is_active = true,
        updated_at = NOW();
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_company_with_owner(TEXT, TEXT, TEXT, TEXT, TEXT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.add_user_to_company(UUID, UUID, UUID, TEXT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.assign_user_to_department(UUID, UUID, UUID) TO authenticated, service_role;
