CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('alert', 'training', 'report', 'system')),
  is_read BOOLEAN NOT NULL DEFAULT false,
  related_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS notifications_read_own ON public.notifications;
CREATE POLICY notifications_read_own ON public.notifications
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS notifications_update_own ON public.notifications;
CREATE POLICY notifications_update_own ON public.notifications
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS notifications_delete_own ON public.notifications;
CREATE POLICY notifications_delete_own ON public.notifications
  FOR DELETE
  USING (auth.uid() = user_id);

-- Company admins can create notifications for users in their company.
DROP POLICY IF EXISTS notifications_insert_company_admin ON public.notifications;
CREATE POLICY notifications_insert_company_admin ON public.notifications
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.user_profiles admin_profile
      WHERE admin_profile.user_id = auth.uid()
        AND admin_profile.company_id = notifications.company_id
        AND admin_profile.role = 'admin'
        AND admin_profile.is_active = true
    )
  );

DROP POLICY IF EXISTS notifications_service_role ON public.notifications;
CREATE POLICY notifications_service_role ON public.notifications
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE INDEX IF NOT EXISTS notifications_company_id_idx ON public.notifications(company_id);
CREATE INDEX IF NOT EXISTS notifications_user_id_idx ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS notifications_user_unread_idx ON public.notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS notifications_type_idx ON public.notifications(type);
