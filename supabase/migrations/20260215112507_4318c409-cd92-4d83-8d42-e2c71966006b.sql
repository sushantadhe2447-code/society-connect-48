
-- Staff assignments table for admin to assign workers
CREATE TABLE public.staff_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_user_id UUID NOT NULL,
  assignment_type TEXT NOT NULL,
  description TEXT,
  schedule TEXT DEFAULT 'daily',
  wing TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  assigned_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.staff_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage staff assignments" ON public.staff_assignments
FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Staff can view own assignments" ON public.staff_assignments
FOR SELECT USING (staff_user_id = auth.uid());

CREATE TRIGGER update_staff_assignments_updated_at
BEFORE UPDATE ON public.staff_assignments
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Maintenance payments table
CREATE TABLE public.maintenance_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  amount NUMERIC(10,2) NOT NULL DEFAULT 2000,
  month TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  paid_at TIMESTAMPTZ,
  payment_method TEXT,
  transaction_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.maintenance_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own payments" ON public.maintenance_payments
FOR SELECT USING (user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can insert own payments" ON public.maintenance_payments
FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own payments" ON public.maintenance_payments
FOR UPDATE USING (user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete payments" ON public.maintenance_payments
FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

-- Society funds table for admin to track income/expenses
CREATE TABLE public.society_funds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'income',
  amount NUMERIC(10,2) NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'maintenance',
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.society_funds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage funds" ON public.society_funds
FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated can view funds" ON public.society_funds
FOR SELECT USING (auth.uid() IS NOT NULL);

-- Update notification insert policy to allow admin/staff to send to any user
DROP POLICY IF EXISTS "Authenticated can create notifications" ON public.notifications;
CREATE POLICY "Admin and staff can create notifications" ON public.notifications
FOR INSERT WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'maintenance_staff'::app_role) OR
  user_id = auth.uid()
);
