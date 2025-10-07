-- Drop the existing restrictive SELECT policy
DROP POLICY IF EXISTS "Only admins can view distributors" ON public.distributors;

-- Create new policy allowing all authenticated users to view distributors
CREATE POLICY "All authenticated users can view distributors"
ON public.distributors
FOR SELECT
TO authenticated
USING (true);