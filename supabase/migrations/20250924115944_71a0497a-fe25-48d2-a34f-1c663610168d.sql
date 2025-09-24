-- Create distributors table for managing studio and company information
CREATE TABLE public.distributors (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    studio_id TEXT NOT NULL,
    studio_name TEXT NOT NULL,
    qw_company_id TEXT NOT NULL,
    qw_company_name TEXT NOT NULL,
    qw_pat_encrypted TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    user_id UUID NOT NULL,
    UNIQUE(studio_id, qw_company_id)
);

-- Enable Row Level Security
ALTER TABLE public.distributors ENABLE ROW LEVEL SECURITY;

-- Create policies for distributor access
CREATE POLICY "All authenticated users can view distributors" 
ON public.distributors 
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Admins can create distributors" 
ON public.distributors 
FOR INSERT 
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update distributors" 
ON public.distributors 
FOR UPDATE 
TO authenticated
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete distributors" 
ON public.distributors 
FOR DELETE 
TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_distributors_updated_at
BEFORE UPDATE ON public.distributors
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();