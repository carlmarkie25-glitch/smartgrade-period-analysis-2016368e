
-- Notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'general',
  target_role TEXT DEFAULT 'all',
  created_by UUID REFERENCES auth.users(id),
  is_read BOOLEAN NOT NULL DEFAULT false,
  recipient_user_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Admins can manage all notifications
CREATE POLICY "Admins can manage notifications"
  ON public.notifications FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Users can view notifications targeted to them or their role or general
CREATE POLICY "Users can view their notifications"
  ON public.notifications FOR SELECT TO authenticated
  USING (
    recipient_user_id = auth.uid()
    OR (
      recipient_user_id IS NULL
      AND (
        target_role = 'all'
        OR (target_role = 'teacher' AND has_role(auth.uid(), 'teacher'::app_role))
        OR (target_role = 'student' AND has_role(auth.uid(), 'student'::app_role))
        OR (target_role = 'parent' AND has_role(auth.uid(), 'parent'::app_role))
        OR (target_role = 'admin' AND has_role(auth.uid(), 'admin'::app_role))
      )
    )
  );

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can mark notifications as read"
  ON public.notifications FOR UPDATE TO authenticated
  USING (
    recipient_user_id = auth.uid()
    OR (
      recipient_user_id IS NULL
      AND (
        target_role = 'all'
        OR (target_role = 'teacher' AND has_role(auth.uid(), 'teacher'::app_role))
        OR (target_role = 'student' AND has_role(auth.uid(), 'student'::app_role))
        OR (target_role = 'parent' AND has_role(auth.uid(), 'parent'::app_role))
      )
    )
  )
  WITH CHECK (
    recipient_user_id = auth.uid()
    OR (
      recipient_user_id IS NULL
      AND (
        target_role = 'all'
        OR (target_role = 'teacher' AND has_role(auth.uid(), 'teacher'::app_role))
        OR (target_role = 'student' AND has_role(auth.uid(), 'student'::app_role))
        OR (target_role = 'parent' AND has_role(auth.uid(), 'parent'::app_role))
      )
    )
  );

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
