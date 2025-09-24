-- Update RLS policy to allow users to view all orders for CPL management
DROP POLICY IF EXISTS "Users can view their own orders" ON public.orders;

-- Create new policy that allows all authenticated users to view all orders
CREATE POLICY "Authenticated users can view all orders" 
ON public.orders 
FOR SELECT 
USING (auth.role() = 'authenticated');

-- Keep the existing restrictive policies for INSERT, UPDATE, DELETE
-- Users can still only modify their own orders