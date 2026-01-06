-- Create lab_components table for inventory management
CREATE TABLE public.lab_components (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  total_quantity INTEGER NOT NULL DEFAULT 0,
  available_quantity INTEGER NOT NULL DEFAULT 0,
  category TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID NOT NULL
);

-- Enable RLS on lab_components
ALTER TABLE public.lab_components ENABLE ROW LEVEL SECURITY;

-- Policies for lab_components
CREATE POLICY "Anyone can view lab components" 
ON public.lab_components 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage lab components" 
ON public.lab_components 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create lab_request_items table for component requests
CREATE TABLE public.lab_request_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  request_id UUID NOT NULL REFERENCES public.lab_access_requests(id) ON DELETE CASCADE,
  component_id UUID NOT NULL REFERENCES public.lab_components(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  returned_quantity INTEGER NOT NULL DEFAULT 0,
  is_returned BOOLEAN NOT NULL DEFAULT false,
  returned_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS on lab_request_items
ALTER TABLE public.lab_request_items ENABLE ROW LEVEL SECURITY;

-- Policies for lab_request_items
CREATE POLICY "Users can view their own request items" 
ON public.lab_request_items 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.lab_access_requests 
    WHERE id = request_id AND user_id = auth.uid()
  )
);

CREATE POLICY "Admins can view all request items" 
ON public.lab_request_items 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can insert their own request items" 
ON public.lab_request_items 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.lab_access_requests 
    WHERE id = request_id AND user_id = auth.uid()
  )
);

CREATE POLICY "Admins can manage request items" 
ON public.lab_request_items 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add new columns to lab_access_requests for enhanced workflow
ALTER TABLE public.lab_access_requests 
ADD COLUMN purpose TEXT,
ADD COLUMN return_date DATE,
ADD COLUMN group_members TEXT,
ADD COLUMN items_returned BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN returned_at TIMESTAMP WITH TIME ZONE;

-- Create trigger for updated_at on lab_components
CREATE TRIGGER update_lab_components_updated_at
BEFORE UPDATE ON public.lab_components
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();