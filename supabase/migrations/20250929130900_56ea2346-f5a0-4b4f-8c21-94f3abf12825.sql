-- Update the SELECT policy on distributors table to restrict access to admin users only
DROP POLICY IF EXISTS "All authenticated users can view distributors" ON public.distributors;

-- Create new restrictive policy for distributors SELECT
CREATE POLICY "Only admins can view distributors" 
ON public.distributors 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));