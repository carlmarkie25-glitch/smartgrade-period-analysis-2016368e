-- Fix: Restore bootstrap policy for first admin creation
-- This allows the first user to become admin, after which only admins can assign roles
DROP POLICY IF EXISTS "Only admins can assign roles" ON public.user_roles;

CREATE POLICY "Allow admin assignment with bootstrap"
ON public.user_roles
FOR INSERT
WITH CHECK (
  -- Allow if user is already an admin
  has_role(auth.uid(), 'admin'::app_role)
  OR
  -- OR allow if no admin exists yet (bootstrap)
  NOT EXISTS (SELECT 1 FROM user_roles WHERE role = 'admin'::app_role)
);