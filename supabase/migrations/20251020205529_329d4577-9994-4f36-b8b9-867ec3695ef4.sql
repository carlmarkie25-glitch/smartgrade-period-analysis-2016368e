-- Add policy to allow first admin assignment when no admins exist
CREATE POLICY "Allow first admin assignment"
ON public.user_roles
FOR INSERT
WITH CHECK (
  -- Allow if no admins exist yet (bootstrap scenario)
  NOT EXISTS (
    SELECT 1 FROM public.user_roles WHERE role = 'admin'
  )
  OR
  -- Or if the current user is already an admin
  has_role(auth.uid(), 'admin'::app_role)
);