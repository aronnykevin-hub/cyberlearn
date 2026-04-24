-- Paste-ready deployment script for resolving and adding Google-auth CyberLearn users.
-- Run this in Supabase SQL editor on the target database.

-- ===========================================
-- 0. Normalize profile columns
-- ===========================================

ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS full_name TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS avatar_url TEXT,
ADD COLUMN IF NOT EXISTS is_department_assigned BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE public.user_profiles
ALTER COLUMN role DROP NOT NULL;

ALTER TABLE public.user_profiles
ALTER COLUMN role DROP DEFAULT;

-- ===========================================
-- 1. Shared auth display-name helper
-- ===========================================

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

-- ===========================================
-- 2. Lookup + mirror Google-auth users
-- ===========================================

DROP FUNCTION IF EXISTS public.find_cyberlearn_user_by_email(TEXT);

CREATE OR REPLACE FUNCTION public.find_cyberlearn_user_by_email(
  p_email TEXT
)
RETURNS TABLE (
  found_user_id UUID,
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

CREATE OR REPLACE FUNCTION public.search_cyberlearn_users(
  p_query TEXT,
  p_company_id UUID DEFAULT NULL,
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
  matched_user_id UUID,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_query TEXT := LOWER(TRIM(COALESCE(p_query, '')));
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF p_company_id IS NOT NULL THEN
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
  END IF;

  RETURN QUERY
  SELECT
    au.id AS matched_user_id,
    au.email,
    public.resolve_auth_display_name(au.raw_user_meta_data, au.email) AS full_name,
    au.raw_user_meta_data->>'avatar_url' AS avatar_url
  FROM auth.users au
  WHERE v_query = ''
    OR LOWER(COALESCE(au.email, '')) LIKE '%' || v_query || '%'
    OR LOWER(public.resolve_auth_display_name(au.raw_user_meta_data, au.email)) LIKE '%' || v_query || '%'
  ORDER BY
    CASE
      WHEN LOWER(COALESCE(au.email, '')) = v_query THEN 0
      WHEN LOWER(public.resolve_auth_display_name(au.raw_user_meta_data, au.email)) = v_query THEN 1
      ELSE 2
    END,
    COALESCE(public.resolve_auth_display_name(au.raw_user_meta_data, au.email), au.email)
  LIMIT GREATEST(COALESCE(p_limit, 10), 1);
END;
$$;

-- Backfill existing auth users into mirror tables.
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
-- 3. Trigger for future signups
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

-- ===========================================
-- 4. Permissions
-- ===========================================

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS user_profiles_read_own ON public.user_profiles;
DROP POLICY IF EXISTS user_profiles_read_authenticated ON public.user_profiles;
DROP POLICY IF EXISTS user_profiles_update_own ON public.user_profiles;
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

GRANT EXECUTE ON FUNCTION public.resolve_auth_display_name(JSONB, TEXT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.find_cyberlearn_user_by_email(TEXT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.handle_auth_user_bootstrap() TO authenticated, service_role;
