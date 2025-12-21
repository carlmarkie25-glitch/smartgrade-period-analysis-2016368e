-- Drop the overly permissive public SELECT policy
DROP POLICY IF EXISTS "Anyone can view settings" ON public.system_settings;

-- Create a new policy that restricts viewing to authenticated users only
-- (admins already have full access via the "Admins can manage settings" policy)
CREATE POLICY "Authenticated users can view settings" 
ON public.system_settings 
FOR SELECT 
USING (auth.uid() IS NOT NULL);