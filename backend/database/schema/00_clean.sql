-- Clean database script for development
-- This script safely drops all app tables/functions in the correct dependency order.

-- Drop app-specific functions and triggers first
DROP FUNCTION IF EXISTS public.create_company_with_departments(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT[]) CASCADE;
DROP FUNCTION IF EXISTS public.assign_employee_to_department(UUID, UUID, UUID, TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_auth_user() CASCADE;

-- Drop all tables (children first)
DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TABLE IF EXISTS public.alerts CASCADE;
DROP TABLE IF EXISTS public.threat_reports CASCADE;
DROP TABLE IF EXISTS public.training_progress CASCADE;
DROP TABLE IF EXISTS public.training_modules CASCADE;
DROP TABLE IF EXISTS public.user_profiles CASCADE;
DROP TABLE IF EXISTS public.departments CASCADE;
DROP TABLE IF EXISTS public.companies CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

SELECT 'Database cleaned successfully' AS status;
