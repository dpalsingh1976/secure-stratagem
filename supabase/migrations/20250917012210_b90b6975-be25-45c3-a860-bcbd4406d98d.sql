-- Create leads table to store assessment data and follow up
CREATE TABLE public.leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT,
  name TEXT,
  phone TEXT,
  assessment_data JSONB NOT NULL,
  risk_scores JSONB NOT NULL,
  ai_insights TEXT,
  report_generated_at TIMESTAMP WITH TIME ZONE,
  consultation_requested BOOLEAN DEFAULT false,
  follow_up_scheduled BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'qualified', 'converted')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Create policies for leads (public access for lead generation)
CREATE POLICY "Anyone can create leads" 
ON public.leads 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can view their own leads by email" 
ON public.leads 
FOR SELECT 
USING (email = current_setting('request.jwt.claims', true)::json->>'email' OR email IS NOT NULL);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_leads_updated_at
BEFORE UPDATE ON public.leads
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();