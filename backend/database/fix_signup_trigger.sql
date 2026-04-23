-- Fix signup flow - Improved trigger with proper permissions
-- Paste this into Supabase SQL Editor

-- Step 1: Drop existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.create_user_profile();

-- Step 2: Recreate function with SECURITY DEFINER to bypass RLS
CREATE OR REPLACE FUNCTION public.create_user_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_profiles (user_id, is_active)
  VALUES (NEW.id, true)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Log error but don't fail the signup
  RAISE WARNING 'Error creating user profile for user %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$$;

-- Step 3: Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.create_user_profile();

-- Step 4: Simplify RLS policies for users table to allow auth role
-- First check if users table has RLS enabled
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read their own user record
DROP POLICY IF EXISTS users_read_own ON public.users;
CREATE POLICY users_read_own ON public.users
  FOR SELECT
  USING (auth.uid() = id);

-- Allow service role to do everything
DROP POLICY IF EXISTS users_service_role ON public.users;
CREATE POLICY users_service_role ON public.users
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Step 5: Verify
SELECT 
  trigger_name, 
  event_object_table, 
  action_timing 
FROM information_schema.triggers 
WHERE event_object_table = 'users' AND trigger_name = 'on_auth_user_created';
