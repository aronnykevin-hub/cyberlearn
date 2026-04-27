-- Canonical organization access control and onboarding bootstrap.
-- Standardizes the app on companies + company_members membership.

-- ===========================================
-- 0. Normalize profile schema
-- ===========================================

ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS full_name TEXT,
ADD COLUMN IF NOT EXISTS job_title TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS avatar_url TEXT,
ADD COLUMN IF NOT EXISTS department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS is_department_assigned BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS assigned_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE public.user_profiles
ALTER COLUMN role DROP NOT NULL;

ALTER TABLE public.user_profiles
ALTER COLUMN role DROP DEFAULT;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'user_profiles'
      AND column_name = 'phone_number'
  ) THEN
    EXECUTE '
      UPDATE public.user_profiles
      SET phone = COALESCE(phone, phone_number)
      WHERE phone IS DISTINCT FROM COALESCE(phone, phone_number)
    ';
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS user_profiles_department_assigned_idx
ON public.user_profiles(is_department_assigned);

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

-- ===========================================
-- 1. Replace conflicting auth bootstrap
-- ===========================================

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created_profiles ON auth.users;

DROP FUNCTION IF EXISTS public.handle_new_user_profile();
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.handle_new_auth_user();
DROP FUNCTION IF EXISTS public.create_user_profile();

CREATE OR REPLACE FUNCTION public.handle_auth_user_bootstrap()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email)
  VALUES (NEW.id, COALESCE(NEW.email, ''))
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
    NEW.id,
    public.resolve_auth_display_name(NEW.raw_user_meta_data, NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'phone_number', NEW.raw_user_meta_data->>'phone'),
    NEW.raw_user_meta_data->>'avatar_url',
    NULL,
    false,
    true
  )
  ON CONFLICT (user_id) DO UPDATE
    SET full_name = COALESCE(public.user_profiles.full_name, EXCLUDED.full_name),
        phone = COALESCE(public.user_profiles.phone, EXCLUDED.phone),
        avatar_url = COALESCE(public.user_profiles.avatar_url, EXCLUDED.avatar_url),
        is_active = true;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Error bootstrapping auth user %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_auth_user_bootstrap();

-- Backfill users/profile mirrors for existing auth users.
INSERT INTO public.users (id, email)
SELECT au.id, COALESCE(au.email, '')
FROM auth.users au
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
SELECT
  au.id,
  public.resolve_auth_display_name(au.raw_user_meta_data, au.email),
  COALESCE(au.raw_user_meta_data->>'phone_number', au.raw_user_meta_data->>'phone'),
  au.raw_user_meta_data->>'avatar_url',
  NULL,
  false,
  true
FROM auth.users au
ON CONFLICT (user_id) DO UPDATE
  SET full_name = COALESCE(public.user_profiles.full_name, EXCLUDED.full_name),
      phone = COALESCE(public.user_profiles.phone, EXCLUDED.phone),
      avatar_url = COALESCE(public.user_profiles.avatar_url, EXCLUDED.avatar_url),
      is_active = true;

UPDATE public.user_profiles up
SET full_name = public.resolve_auth_display_name(au.raw_user_meta_data, au.email)
FROM auth.users au
WHERE au.id = up.user_id
  AND (up.full_name IS NULL OR up.full_name = '')
  AND public.resolve_auth_display_name(au.raw_user_meta_data, au.email) <> '';

-- ===========================================
-- 2. Canonical user_profiles RLS
-- ===========================================

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS user_profiles_read_own ON public.user_profiles;
DROP POLICY IF EXISTS user_profiles_insert_own ON public.user_profiles;
DROP POLICY IF EXISTS user_profiles_update_own ON public.user_profiles;
DROP POLICY IF EXISTS user_profiles_update_own_unassigned ON public.user_profiles;
DROP POLICY IF EXISTS user_profiles_read_company_admin ON public.user_profiles;
DROP POLICY IF EXISTS user_profiles_update_company_admin ON public.user_profiles;
DROP POLICY IF EXISTS user_profiles_read_all_authenticated ON public.user_profiles;
DROP POLICY IF EXISTS user_profiles_update_authenticated ON public.user_profiles;
DROP POLICY IF EXISTS user_profiles_read_authenticated ON public.user_profiles;
DROP POLICY IF EXISTS user_profiles_service_role ON public.user_profiles;

CREATE POLICY user_profiles_service_role ON public.user_profiles
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY user_profiles_read_own ON public.user_profiles
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY user_profiles_read_authenticated ON public.user_profiles
  FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY user_profiles_update_own ON public.user_profiles
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ===========================================
-- 3. Canonical organization membership table
-- ===========================================

CREATE TABLE IF NOT EXISTS public.company_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member',
  added_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(company_id, user_id)
);

ALTER TABLE public.company_members ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'company_members_role_check'
      AND conrelid = 'public.company_members'::regclass
  ) THEN
    ALTER TABLE public.company_members
    ADD CONSTRAINT company_members_role_check
    CHECK (role IN ('owner', 'admin', 'member'));
  END IF;
END $$;

DROP POLICY IF EXISTS company_members_service_role ON public.company_members;
DROP POLICY IF EXISTS company_members_view_own ON public.company_members;
DROP POLICY IF EXISTS company_members_view_in_company ON public.company_members;
DROP POLICY IF EXISTS company_members_admin ON public.company_members;
DROP POLICY IF EXISTS company_members_insert_service ON public.company_members;
DROP POLICY IF EXISTS company_members_update_service ON public.company_members;
DROP POLICY IF EXISTS company_members_delete_service ON public.company_members;

CREATE POLICY company_members_service_role ON public.company_members
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY company_members_view_own ON public.company_members
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY company_members_insert_service ON public.company_members
  FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY company_members_update_service ON public.company_members
  FOR UPDATE
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY company_members_delete_service ON public.company_members
  FOR DELETE
  USING (auth.role() = 'service_role');

CREATE INDEX IF NOT EXISTS company_members_company_idx ON public.company_members(company_id);
CREATE INDEX IF NOT EXISTS company_members_user_idx ON public.company_members(user_id);
CREATE INDEX IF NOT EXISTS company_members_role_idx ON public.company_members(role);

-- Keep explicit role semantics for users who are not owners/admins/employees yet.
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

-- ===========================================
-- 4. Training access view
-- ===========================================

ALTER TABLE public.training_progress
ADD COLUMN IF NOT EXISTS department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL;

CREATE OR REPLACE VIEW public.user_training_access AS
SELECT
  up.user_id,
  up.is_department_assigned,
  up.department_id,
  d.id AS dept_id,
  d.name AS dept_name,
  CASE
    WHEN up.is_department_assigned AND up.department_id IS NOT NULL THEN true
    ELSE false
  END AS has_training_access
FROM public.user_profiles up
LEFT JOIN public.departments d ON d.id = up.department_id;

-- ===========================================
-- 5. Organization helper functions
-- ===========================================

DROP FUNCTION IF EXISTS public.create_company_with_owner(TEXT, TEXT, TEXT, TEXT, TEXT, UUID);

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

-- create_company_with_owner function moved to 15_team_member_user_search_and_default_departments.sql
-- This older version is deprecated and replaced with one that handles p_departments parameter

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
    full_name,
    phone,
    avatar_url,
    role,
    is_department_assigned,
    is_active
  )
  VALUES (
    p_user_id,
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

  IF p_role = 'admin' THEN
    UPDATE public.user_profiles
    SET role = 'admin',
        is_active = true
    WHERE user_id = p_user_id;
  END IF;

  RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION public.remove_user_from_company(
  p_company_id UUID,
  p_user_id UUID,
  p_removed_by UUID
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM public.company_members cm
    WHERE cm.company_id = p_company_id
      AND cm.user_id = p_removed_by
      AND cm.role IN ('owner', 'admin')
  ) AND NOT EXISTS (
    SELECT 1
    FROM public.companies c
    WHERE c.id = p_company_id
      AND c.created_by = p_removed_by
  ) THEN
    RAISE EXCEPTION 'Only company admins or owners can remove users';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.company_members cm
    WHERE cm.company_id = p_company_id
      AND cm.user_id = p_user_id
      AND cm.role = 'owner'
  ) THEN
    RAISE EXCEPTION 'Company owner cannot be removed';
  END IF;

  DELETE FROM public.company_members
  WHERE company_id = p_company_id
    AND user_id = p_user_id;

  UPDATE public.user_profiles up
  SET role = CASE
    WHEN EXISTS (
      SELECT 1
      FROM public.company_members cm
      WHERE cm.user_id = p_user_id
        AND cm.role IN ('owner', 'admin')
    ) THEN 'admin'
    WHEN COALESCE(up.is_department_assigned, false) THEN 'employee'
    ELSE NULL
  END
  WHERE up.user_id = p_user_id;

  RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_member_role(
  p_company_id UUID,
  p_user_id UUID,
  p_new_role TEXT,
  p_updated_by UUID
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_new_role NOT IN ('member', 'admin') THEN
    RAISE EXCEPTION 'Invalid company role: %', p_new_role;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.company_members cm
    WHERE cm.company_id = p_company_id
      AND cm.user_id = p_updated_by
      AND cm.role IN ('owner', 'admin')
  ) AND NOT EXISTS (
    SELECT 1
    FROM public.companies c
    WHERE c.id = p_company_id
      AND c.created_by = p_updated_by
  ) THEN
    RAISE EXCEPTION 'Only company admins or owners can update roles';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.company_members cm
    WHERE cm.company_id = p_company_id
      AND cm.user_id = p_user_id
      AND cm.role = 'owner'
  ) THEN
    RAISE EXCEPTION 'Company owner role cannot be changed';
  END IF;

  UPDATE public.company_members
  SET role = p_new_role
  WHERE company_id = p_company_id
    AND user_id = p_user_id;

  IF p_new_role = 'admin' THEN
    UPDATE public.user_profiles
    SET role = 'admin',
        is_active = true
    WHERE user_id = p_user_id;
  ELSE
    UPDATE public.user_profiles up
    SET role = CASE
      WHEN EXISTS (
        SELECT 1
        FROM public.company_members cm
        WHERE cm.user_id = p_user_id
          AND cm.role IN ('owner', 'admin')
      ) THEN 'admin'
      WHEN COALESCE(up.is_department_assigned, false) THEN 'employee'
      ELSE NULL
    END
    WHERE up.user_id = p_user_id;
  END IF;

  RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION public.is_user_company_admin(
  p_company_id UUID,
  p_user_id UUID
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN COALESCE(
    (
      SELECT cm.role IN ('owner', 'admin')
      FROM public.company_members cm
      WHERE cm.company_id = p_company_id
        AND cm.user_id = p_user_id
    ),
    EXISTS (
      SELECT 1
      FROM public.companies c
      WHERE c.id = p_company_id
        AND c.created_by = p_user_id
    )
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.get_company_members(
  p_company_id UUID
)
RETURNS TABLE (
  member_id UUID,
  company_id UUID,
  user_id UUID,
  role TEXT,
  joined_at TIMESTAMPTZ,
  added_by UUID,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  phone TEXT,
  department_id UUID,
  is_department_assigned BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.company_members cm
    WHERE cm.company_id = p_company_id
      AND cm.user_id = auth.uid()
  ) AND NOT EXISTS (
    SELECT 1
    FROM public.companies c
    WHERE c.id = p_company_id
      AND c.created_by = auth.uid()
  ) THEN
    RAISE EXCEPTION 'You are not a member of this company';
  END IF;

  RETURN QUERY
  SELECT
    cm.id AS member_id,
    cm.company_id,
    cm.user_id,
    cm.role,
    cm.joined_at,
    cm.added_by,
    u.email,
    up.full_name,
    up.avatar_url,
    up.phone,
    up.department_id,
    up.is_department_assigned
  FROM public.company_members cm
  JOIN public.users u
    ON u.id = cm.user_id
  LEFT JOIN public.user_profiles up
    ON up.user_id = cm.user_id
  WHERE cm.company_id = p_company_id
  ORDER BY
    CASE cm.role
      WHEN 'owner' THEN 0
      WHEN 'admin' THEN 1
      ELSE 2
    END,
    COALESCE(up.full_name, u.email);
END;
$$;

-- ===========================================
-- 6. Companies RLS
-- ===========================================

ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS companies_select_members ON public.companies;
DROP POLICY IF EXISTS companies_update_admin ON public.companies;
DROP POLICY IF EXISTS companies_insert_admin ON public.companies;
DROP POLICY IF EXISTS companies_insert_authenticated ON public.companies;
DROP POLICY IF EXISTS companies_update_creator ON public.companies;
DROP POLICY IF EXISTS companies_service_role ON public.companies;
DROP POLICY IF EXISTS companies_select_creator ON public.companies;

CREATE POLICY companies_service_role ON public.companies
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY companies_select_creator ON public.companies
  FOR SELECT
  USING (created_by = auth.uid());

CREATE POLICY companies_select_members ON public.companies
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.company_members cm
      WHERE cm.company_id = companies.id
        AND cm.user_id = auth.uid()
    )
  );

CREATE POLICY companies_update_admin ON public.companies
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM public.company_members cm
      WHERE cm.company_id = companies.id
        AND cm.user_id = auth.uid()
        AND cm.role IN ('owner', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.company_members cm
      WHERE cm.company_id = companies.id
        AND cm.user_id = auth.uid()
        AND cm.role IN ('owner', 'admin')
    )
  );

CREATE POLICY companies_insert_admin ON public.companies
  FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

-- ===========================================
-- 7. Function grants
-- ===========================================

GRANT EXECUTE ON FUNCTION public.assign_user_to_department(UUID, UUID, UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.find_cyberlearn_user_by_email(TEXT) TO authenticated, service_role;
-- GRANT moved to 15_team_member_user_search_and_default_departments.sql with correct signature
-- GRANT EXECUTE ON FUNCTION public.create_company_with_owner(TEXT, TEXT, TEXT, TEXT, TEXT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.add_user_to_company(UUID, UUID, UUID, TEXT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.remove_user_from_company(UUID, UUID, UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.update_member_role(UUID, UUID, TEXT, UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_user_company_admin(UUID, UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_company_members(UUID) TO authenticated, service_role;

-- ===========================================
-- Verification queries
-- ===========================================

SELECT
  trigger_name,
  event_object_table
FROM information_schema.triggers
WHERE event_object_table = 'users'
  AND trigger_name IN ('on_auth_user_created', 'on_auth_user_created_profiles');

SELECT
  proname AS function_name
FROM pg_proc
WHERE pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
  AND proname IN (
    'handle_auth_user_bootstrap',
    'find_cyberlearn_user_by_email',
    'assign_user_to_department',
    'create_company_with_owner',
    'add_user_to_company',
    'remove_user_from_company',
    'update_member_role',
    'is_user_company_admin',
    'get_company_members'
  )
ORDER BY proname;

SELECT
  schemaname,
  tablename,
  rowsecurity AS rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('companies', 'company_members', 'user_profiles')
ORDER BY tablename;

SELECT
  policyname,
  tablename,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('companies', 'company_members', 'user_profiles')
ORDER BY tablename, policyname;
