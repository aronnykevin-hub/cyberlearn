-- Companies/organizations created by signed-in users.
-- Bootstrap dependency in case this file is executed before 01_users.sql
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  registration_number TEXT,
  industry TEXT,
  country TEXT,
  address TEXT,
  created_by UUID NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

-- Any authenticated user can create a company for themselves.
DROP POLICY IF EXISTS companies_insert_authenticated ON public.companies;
CREATE POLICY companies_insert_authenticated ON public.companies
  FOR INSERT
  WITH CHECK (
    auth.uid() = created_by
  );

-- Creator can always read/update their own created companies.
DROP POLICY IF EXISTS companies_select_creator ON public.companies;
CREATE POLICY companies_select_creator ON public.companies
  FOR SELECT
  USING (created_by = auth.uid());

DROP POLICY IF EXISTS companies_update_creator ON public.companies;
CREATE POLICY companies_update_creator ON public.companies
  FOR UPDATE
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

DROP POLICY IF EXISTS companies_service_role ON public.companies;
CREATE POLICY companies_service_role ON public.companies
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE INDEX IF NOT EXISTS companies_created_by_idx ON public.companies(created_by);
CREATE INDEX IF NOT EXISTS companies_name_idx ON public.companies(name);
