-- Update user_profiles RLS to work with trigger
-- Paste this into Supabase SQL Editor AFTER running fix_signup_trigger.sql

-- Step 1: Drop all user_profiles policies
DROP POLICY IF EXISTS user_profiles_read_own ON public.user_profiles;
DROP POLICY IF EXISTS user_profiles_read_company_admin ON public.user_profiles;
DROP POLICY IF EXISTS user_profiles_read_all_authenticated ON public.user_profiles;
DROP POLICY IF EXISTS user_profiles_insert_own ON public.user_profiles;
DROP POLICY IF EXISTS user_profiles_update_own ON public.user_profiles;
DROP POLICY IF EXISTS user_profiles_update_own_unassigned ON public.user_profiles;
DROP POLICY IF EXISTS user_profiles_update_company_admin ON public.user_profiles;
DROP POLICY IF EXISTS user_profiles_update_authenticated ON public.user_profiles;
DROP POLICY IF EXISTS user_profiles_service_role ON public.user_profiles;

-- Step 2: Create clean policies

-- Policy 1: Service role can do everything (for backend and triggers)
CREATE POLICY user_profiles_service_role ON public.user_profiles
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Policy 2: Users can read their own profile
CREATE POLICY user_profiles_read_own ON public.user_profiles
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy 3: Users can create their own profile (for manual profile creation)
CREATE POLICY user_profiles_insert_own ON public.user_profiles
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy 4: Authenticated users can read all profiles (for dashboard/admin features)
CREATE POLICY user_profiles_read_authenticated ON public.user_profiles
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Policy 5: Users can update their own profile when unassigned
CREATE POLICY user_profiles_update_own ON public.user_profiles
  FOR UPDATE
  USING (auth.uid() = user_id AND company_id IS NULL)
  WITH CHECK (auth.uid() = user_id AND company_id IS NULL);

-- Policy 6: Authenticated users can update any profile (for admin/assignment)
CREATE POLICY user_profiles_update_authenticated ON public.user_profiles
  FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Verify
SELECT * FROM pg_policies WHERE tablename = 'user_profiles' ORDER BY policyname;
