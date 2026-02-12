
-- Fix function search path for generate_complaint_number
CREATE OR REPLACE FUNCTION public.generate_complaint_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  seq_num INT;
BEGIN
  SELECT COUNT(*) + 1 INTO seq_num FROM public.complaints;
  NEW.complaint_number := 'CMP-' || LPAD(seq_num::TEXT, 5, '0');
  RETURN NEW;
END;
$$;

-- Fix function search path for update_updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Fix permissive notification insert policy
DROP POLICY IF EXISTS "System can create notifications" ON public.notifications;
CREATE POLICY "Authenticated can create notifications" ON public.notifications FOR INSERT TO authenticated 
  WITH CHECK (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
