
-- Create visitor_entries table
CREATE TABLE public.visitor_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  visitor_name TEXT NOT NULL,
  visitor_type TEXT NOT NULL DEFAULT 'guest',
  purpose TEXT,
  resident_flat TEXT,
  resident_name TEXT,
  check_in TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  check_out TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.visitor_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view visitor entries"
  ON public.visitor_entries FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admin and staff can manage visitor entries"
  ON public.visitor_entries FOR ALL
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'maintenance_staff'));
