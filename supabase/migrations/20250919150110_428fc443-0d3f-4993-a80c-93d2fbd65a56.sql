-- Create orders table to store uploaded order data
CREATE TABLE public.orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  order_id TEXT,
  media_type TEXT,
  cancel_flag TEXT,
  operation TEXT,
  playdate_begin DATE,
  playdate_end DATE,
  hold_key_flag TEXT,
  tmc_media_order_id TEXT,
  tmc_theatre_id TEXT,
  note TEXT,
  screening_screen_no TEXT,
  screening_time TEXT,
  do_not_ship TEXT,
  ship_hold_type TEXT,
  delivery_method TEXT,
  return_method TEXT,
  is_no_key TEXT,
  booker_name TEXT,
  booker_phone TEXT,
  booker_email TEXT,
  content_id TEXT,
  content_title TEXT,
  package_uuid TEXT,
  film_id TEXT,
  theatre_id TEXT,
  theatre_name TEXT,
  chain_name TEXT,
  theatre_address1 TEXT,
  theatre_city TEXT,
  theatre_state TEXT,
  theatre_postal_code TEXT,
  theatre_country TEXT,
  qw_identifier TEXT,
  qw_theatre_id TEXT,
  qw_theatre_name TEXT,
  qw_theatre_city TEXT,
  qw_theatre_state TEXT,
  qw_theatre_country TEXT,
  studio_id TEXT,
  studio_name TEXT,
  qw_company_id TEXT,
  qw_company_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own orders" 
ON public.orders 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own orders" 
ON public.orders 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own orders" 
ON public.orders 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own orders" 
ON public.orders 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();