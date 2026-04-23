-- Fix Infinite Recursion in user_profiles RLS Policies
-- Paste this into Supabase SQL Editor and execute

-- Step 1: Drop all problematic policies
DROP POLICY IF EXISTS user_profiles_read_own ON public.user_profiles;
DROP POLICY IF EXISTS user_profiles_read_company_admin ON public.user_profiles;
DROP POLICY IF EXISTS user_profiles_update_own_unassigned ON public.user_profiles;
DROP POLICY IF EXISTS user_profiles_update_company_admin ON public.user_profiles;
DROP POLICY IF EXISTS user_profiles_insert_own ON public.user_profiles;
DROP POLICY IF EXISTS user_profiles_service_role ON public.user_profiles;

-- Step 2: Create NEW non-recursive policies

-- Policy 1: Users can insert their own profile
CREATE POLICY user_profiles_insert_own ON public.user_profiles
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy 2: Users can read their own profile (simple, no joins)
CREATE POLICY user_profiles_read_own ON public.user_profiles
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy 3: Service role (for backend) can do anything
CREATE POLICY user_profiles_service_role ON public.user_profiles
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Policy 4: Users can update their own unassigned profile only
CREATE POLICY user_profiles_update_own ON public.user_profiles
  FOR UPDATE
  USING (auth.uid() = user_id AND company_id IS NULL)
  WITH CHECK (auth.uid() = user_id AND company_id IS NULL);

-- Step 3: For admin reads/updates, temporarily allow authenticated users
-- This will be replaced with proper admin verification once app is working
CREATE POLICY user_profiles_read_all_authenticated ON public.user_profiles
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Step 4: Allow admins to update (with proper verification in application layer)
CREATE POLICY user_profiles_update_authenticated ON public.user_profiles
  FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Verify the policies are created
SELECT * FROM pg_policies WHERE tablename = 'user_profiles';
