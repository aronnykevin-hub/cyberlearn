-- New Database Schema for Phishing Simulations and Digital Certificates
-- Run this in Supabase SQL Editor

-- ===========================================
-- 1. Phishing Campaigns Table
-- ===========================================
CREATE TABLE IF NOT EXISTS public.phishing_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  
  -- Campaign Info
  title TEXT NOT NULL,
  description TEXT,
  template_type TEXT NOT NULL DEFAULT 'email', -- email, notification, link
  subject_line TEXT,
  email_body TEXT,
  sender_name TEXT,
  sender_email TEXT,
  
  -- Campaign Status
  status TEXT NOT NULL DEFAULT 'draft', -- draft, scheduled, active, completed, paused
  scheduled_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  
  -- Campaign Settings
  target_department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
  target_user_ids UUID[] DEFAULT ARRAY[]::UUID[],
  success_rate_threshold DECIMAL DEFAULT 0.0, -- 0-1 for expected click rate
  
  -- Tracking
  total_sent INT DEFAULT 0,
  total_clicked INT DEFAULT 0,
  total_reported INT DEFAULT 0,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.phishing_campaigns ENABLE ROW LEVEL SECURITY;

-- Policies for Phishing Campaigns
DROP POLICY IF EXISTS phishing_campaigns_service_role ON public.phishing_campaigns;
CREATE POLICY phishing_campaigns_service_role ON public.phishing_campaigns
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS phishing_campaigns_creator_access ON public.phishing_campaigns;
CREATE POLICY phishing_campaigns_creator_access ON public.phishing_campaigns
  FOR SELECT
  USING (created_by = auth.uid() OR auth.role() = 'service_role');

DROP POLICY IF EXISTS phishing_campaigns_admin_access ON public.phishing_campaigns;
CREATE POLICY phishing_campaigns_admin_access ON public.phishing_campaigns
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_id = auth.uid() AND role = 'admin'
    ) OR auth.role() = 'service_role'
  );

CREATE INDEX IF NOT EXISTS phishing_campaigns_company_idx ON public.phishing_campaigns(company_id);
CREATE INDEX IF NOT EXISTS phishing_campaigns_created_by_idx ON public.phishing_campaigns(created_by);
CREATE INDEX IF NOT EXISTS phishing_campaigns_status_idx ON public.phishing_campaigns(status);

-- ===========================================
-- 2. Phishing Responses Table
-- ===========================================
CREATE TABLE IF NOT EXISTS public.phishing_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.phishing_campaigns(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  
  -- Response Data
  status TEXT NOT NULL DEFAULT 'sent', -- sent, clicked, reported, ignored
  clicked_at TIMESTAMPTZ,
  reported_at TIMESTAMPTZ,
  ip_address INET,
  user_agent TEXT,
  
  -- Admin Notes
  admin_notes TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.phishing_responses ENABLE ROW LEVEL SECURITY;

-- Policies for Phishing Responses
DROP POLICY IF EXISTS phishing_responses_service_role ON public.phishing_responses;
CREATE POLICY phishing_responses_service_role ON public.phishing_responses
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS phishing_responses_user_view ON public.phishing_responses;
CREATE POLICY phishing_responses_user_view ON public.phishing_responses
  FOR SELECT
  USING (user_id = auth.uid() OR auth.role() = 'service_role');

DROP POLICY IF EXISTS phishing_responses_admin_access ON public.phishing_responses;
CREATE POLICY phishing_responses_admin_access ON public.phishing_responses
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_id = auth.uid() AND role = 'admin'
    ) OR auth.role() = 'service_role'
  );

CREATE INDEX IF NOT EXISTS phishing_responses_campaign_idx ON public.phishing_responses(campaign_id);
CREATE INDEX IF NOT EXISTS phishing_responses_user_idx ON public.phishing_responses(user_id);
CREATE INDEX IF NOT EXISTS phishing_responses_status_idx ON public.phishing_responses(status);

-- ===========================================
-- 3. Certificate Templates Table
-- ===========================================
CREATE TABLE IF NOT EXISTS public.certificate_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  
  -- Template Info
  name TEXT NOT NULL,
  description TEXT,
  template_type TEXT NOT NULL DEFAULT 'standard', -- standard, premium, custom
  
  -- Design
  background_color TEXT DEFAULT '#4f46e5',
  text_color TEXT DEFAULT '#ffffff',
  logo_url TEXT,
  signature_url TEXT,
  
  -- Template HTML
  html_content TEXT,
  
  is_active BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.certificate_templates ENABLE ROW LEVEL SECURITY;

-- Policies for Certificate Templates
DROP POLICY IF EXISTS certificate_templates_service_role ON public.certificate_templates;
CREATE POLICY certificate_templates_service_role ON public.certificate_templates
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS certificate_templates_admin_access ON public.certificate_templates;
CREATE POLICY certificate_templates_admin_access ON public.certificate_templates
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_id = auth.uid() AND role = 'admin'
    ) OR auth.role() = 'service_role'
  );

CREATE INDEX IF NOT EXISTS certificate_templates_company_idx ON public.certificate_templates(company_id);

-- ===========================================
-- 4. Digital Certificates Table
-- ===========================================
CREATE TABLE IF NOT EXISTS public.certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  training_module_id UUID NOT NULL REFERENCES public.training_modules(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  template_id UUID REFERENCES public.certificate_templates(id) ON DELETE SET NULL,
  
  -- Certificate Data
  certificate_number TEXT NOT NULL UNIQUE,
  issue_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expiry_date TIMESTAMPTZ,
  
  -- Content
  employee_name TEXT NOT NULL,
  module_title TEXT NOT NULL,
  completion_score DECIMAL,
  instructor_name TEXT,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'issued', -- issued, revoked, expired
  is_shared BOOLEAN DEFAULT false,
  is_verified BOOLEAN DEFAULT true,
  
  -- Download
  pdf_url TEXT,
  verification_code TEXT UNIQUE DEFAULT gen_random_uuid()::TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;

-- Policies for Certificates
DROP POLICY IF EXISTS certificates_service_role ON public.certificates;
CREATE POLICY certificates_service_role ON public.certificates
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS certificates_user_view ON public.certificates;
CREATE POLICY certificates_user_view ON public.certificates
  FOR SELECT
  USING (user_id = auth.uid() OR auth.role() = 'service_role');

DROP POLICY IF EXISTS certificates_admin_access ON public.certificates;
CREATE POLICY certificates_admin_access ON public.certificates
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_id = auth.uid() AND role = 'admin'
    ) OR auth.role() = 'service_role'
  );

CREATE INDEX IF NOT EXISTS certificates_user_idx ON public.certificates(user_id);
CREATE INDEX IF NOT EXISTS certificates_training_module_idx ON public.certificates(training_module_id);
CREATE INDEX IF NOT EXISTS certificates_company_idx ON public.certificates(company_id);
CREATE INDEX IF NOT EXISTS certificates_verification_code_idx ON public.certificates(verification_code);

-- ===========================================
-- 5. Helper Functions
-- ===========================================

-- Function to track phishing campaign metrics
CREATE OR REPLACE FUNCTION public.update_phishing_campaign_metrics(campaign_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.phishing_campaigns
  SET 
    total_sent = (SELECT COUNT(*) FROM phishing_responses WHERE campaign_id = $1),
    total_clicked = (SELECT COUNT(*) FROM phishing_responses WHERE campaign_id = $1 AND status = 'clicked'),
    total_reported = (SELECT COUNT(*) FROM phishing_responses WHERE campaign_id = $1 AND status = 'reported'),
    updated_at = NOW()
  WHERE id = $1;
END;
$$;

-- Function to generate unique certificate number
CREATE OR REPLACE FUNCTION public.generate_certificate_number()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN 'CERT-' || TO_CHAR(NOW(), 'YYYY-MM-DD-') || SUBSTRING(gen_random_uuid()::TEXT, 1, 8);
END;
$$;

-- Trigger to auto-generate certificate number
CREATE OR REPLACE FUNCTION public.handle_certificate_creation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.certificate_number IS NULL THEN
    NEW.certificate_number := generate_certificate_number();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_certificate_created ON public.certificates;
CREATE TRIGGER on_certificate_created
BEFORE INSERT ON public.certificates
FOR EACH ROW
EXECUTE FUNCTION public.handle_certificate_creation();

-- ===========================================
-- Verification Queries
-- ===========================================

-- Verify new tables created
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('phishing_campaigns', 'phishing_responses', 'certificate_templates', 'certificates')
ORDER BY table_name;

-- Verify indexes
SELECT indexname FROM pg_indexes 
WHERE schemaname = 'public' 
AND tablename IN ('phishing_campaigns', 'phishing_responses', 'certificate_templates', 'certificates')
ORDER BY indexname;

-- Verify RLS is enabled
SELECT tablename FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('phishing_campaigns', 'phishing_responses', 'certificate_templates', 'certificates')
AND rowsecurity = true
ORDER BY tablename;
