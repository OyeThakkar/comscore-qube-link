-- Fix security issue: Restrict orders table access to prevent unauthorized access to customer data
-- Drop the overly permissive policy that allows all authenticated users to see all orders
DROP POLICY IF EXISTS "Authenticated users can view all orders" ON public.orders;

-- Create new secure policy: Users can only view their own orders, unless they have admin/client_service roles
CREATE POLICY "Users can view orders based on role" 
ON public.orders 
FOR SELECT 
USING (
  (auth.uid() = user_id) OR 
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'client_service'::app_role)
);