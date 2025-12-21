-- Drop the policy that allows all authenticated users to view settings
DROP POLICY IF EXISTS "Authenticated users can view settings" ON public.system_settings;

-- System settings are now only accessible via the existing "Admins can manage settings" policy
-- which already restricts all operations (including SELECT) to admins only