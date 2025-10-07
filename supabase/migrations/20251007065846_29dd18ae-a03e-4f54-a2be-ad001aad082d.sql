-- Update RLS policies to allow all authenticated users to view all orders
DROP POLICY IF EXISTS "Users can view orders based on role" ON public.orders;

CREATE POLICY "All authenticated users can view all orders" 
ON public.orders 
FOR SELECT 
TO authenticated
USING (true);

-- Update RLS policies to allow all authenticated users to view all CPL data
DROP POLICY IF EXISTS "Users can view their own CPL data" ON public.cpl_management;

CREATE POLICY "All authenticated users can view all CPL data" 
ON public.cpl_management 
FOR SELECT 
TO authenticated
USING (true);

-- Keep INSERT/UPDATE/DELETE policies restricted to owners
-- (These already exist and will remain as is)