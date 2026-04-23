-- Auto-create user_profiles on signup
-- Paste this into Supabase SQL Editor

-- Create a trigger function to auto-create user profile
CREATE OR REPLACE FUNCTION public.create_user_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (user_id, full_name, is_active)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', true)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop the trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger on auth.users table
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.create_user_profile();

-- Verify trigger was created
SELECT * FROM information_schema.triggers WHERE event_object_table = 'users';
