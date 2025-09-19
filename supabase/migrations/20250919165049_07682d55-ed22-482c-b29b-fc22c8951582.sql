-- Create CPL management table
CREATE TABLE public.cpl_management (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  content_id TEXT NOT NULL,
  content_title TEXT,
  package_uuid TEXT NOT NULL,
  film_id TEXT,
  cpl_list TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, content_id, package_uuid)
);

-- Enable Row Level Security
ALTER TABLE public.cpl_management ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own CPL data" 
ON public.cpl_management 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own CPL data" 
ON public.cpl_management 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own CPL data" 
ON public.cpl_management 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own CPL data" 
ON public.cpl_management 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_cpl_management_updated_at
BEFORE UPDATE ON public.cpl_management
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();