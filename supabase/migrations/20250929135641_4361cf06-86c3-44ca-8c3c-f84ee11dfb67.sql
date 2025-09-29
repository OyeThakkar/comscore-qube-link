-- Fix email privacy issue by updating profiles SELECT policy
-- This prevents client_service users from accessing other users' email addresses
DROP POLICY IF EXISTS "Users can view all profiles if admin or client_service" ON public.profiles;

-- Create new restrictive policy for profiles SELECT - only allow users to see their own profile or admins to see all
CREATE POLICY "Users can view own profile or admins can view all" 
ON public.profiles 
FOR SELECT 
USING (id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));