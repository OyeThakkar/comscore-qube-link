-- Add updated_by column to distributors table for audit tracking
ALTER TABLE public.distributors 
ADD COLUMN updated_by UUID REFERENCES auth.users(id);

-- Update existing records to set updated_by to the user who created them
UPDATE public.distributors 
SET updated_by = user_id 
WHERE updated_by IS NULL;