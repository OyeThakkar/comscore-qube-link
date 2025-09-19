-- Add new columns for delivery details and booking information
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS booking_ref text,
ADD COLUMN IF NOT EXISTS booking_created_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS wiretap_serial_number text,
ADD COLUMN IF NOT EXISTS partner_name text,
ADD COLUMN IF NOT EXISTS tracking_id text;