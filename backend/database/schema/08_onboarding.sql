-- Onboarding helper functions:
-- 1) create_company_with_departments -> creator becomes admin by default
-- 2) assign_employee_to_department -> admin assigns users to company + department

CREATE OR REPLACE FUNCTION public.create_company_with_departments(
  p_name TEXT,
  p_registration_number TEXT DEFAULT NULL,
  p_industry TEXT DEFAULT NULL,
  p_country TEXT DEFAULT NULL,
  p_address TEXT DEFAULT NULL,
  p_departments TEXT[] DEFAULT ARRAY[]::TEXT[]
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_company_id UUID;
BEGIN
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  INSERT INTO public.users (id, email)
  SELECT au.id, COALESCE(au.email, '')
  FROM auth.users au
  WHERE au.id = v_user_id
  ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email,
        updated_at = NOW();

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
    v_user_id
  )
  RETURNING id INTO v_company_id;

  -- Creator becomes admin by default
  INSERT INTO public.user_profiles (
    user_id,
    company_id,
    role,
    is_active,
    updated_at
  )
  VALUES (
    v_user_id,
    v_company_id,
    'admin',
    true,
    NOW()
  )
  ON CONFLICT (user_id) DO UPDATE
    SET company_id = EXCLUDED.company_id,
        role = 'admin',
        is_active = true,
        updated_at = NOW();

  -- Insert departments during company registration
  IF p_departments IS NOT NULL AND array_length(p_departments, 1) IS NOT NULL THEN
    INSERT INTO public.departments (company_id, name)
    SELECT v_company_id, TRIM(d)
    FROM unnest(p_departments) AS d
    WHERE TRIM(d) <> ''
    ON CONFLICT (company_id, name) DO NOTHING;
  END IF;

  RETURN v_company_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.assign_employee_to_department(
  p_employee_user_id UUID,
  p_company_id UUID,
  p_department_id UUID,
  p_role TEXT DEFAULT 'employee'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin_id UUID;
  v_department_company_id UUID;
BEGIN
  v_admin_id := auth.uid();

  IF v_admin_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF p_role NOT IN ('employee', 'admin') THEN
    RAISE EXCEPTION 'Invalid role: %', p_role;
  END IF;

  -- Caller must be admin of the target company
  IF NOT EXISTS (
    SELECT 1
    FROM public.user_profiles up
    WHERE up.user_id = v_admin_id
      AND up.company_id = p_company_id
      AND up.role = 'admin'
      AND up.is_active = true
  ) THEN
    RAISE EXCEPTION 'Only company admins can assign employees';
  END IF;

  SELECT d.company_id
  INTO v_department_company_id
  FROM public.departments d
  WHERE d.id = p_department_id;

  IF v_department_company_id IS NULL THEN
    RAISE EXCEPTION 'Department not found';
  END IF;

  IF v_department_company_id <> p_company_id THEN
    RAISE EXCEPTION 'Department does not belong to company';
  END IF;

  INSERT INTO public.users (id, email)
  SELECT au.id, COALESCE(au.email, '')
  FROM auth.users au
  WHERE au.id = p_employee_user_id
  ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email,
        updated_at = NOW();

  INSERT INTO public.user_profiles (
    user_id,
    company_id,
    department_id,
    role,
    is_active,
    updated_at
  )
  VALUES (
    p_employee_user_id,
    p_company_id,
    p_department_id,
    p_role,
    true,
    NOW()
  )
  ON CONFLICT (user_id) DO UPDATE
    SET company_id = EXCLUDED.company_id,
        department_id = EXCLUDED.department_id,
        role = EXCLUDED.role,
        is_active = true,
        updated_at = NOW();

  RETURN p_employee_user_id;
END;
$$;
