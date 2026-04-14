-- Add assigned_to column to contact_messages
ALTER TABLE public.contact_messages ADD COLUMN assigned_to uuid DEFAULT NULL;

-- Create lead_region_assignments table
CREATE TABLE public.lead_region_assignments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id uuid NOT NULL,
  biz_area text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(biz_area)
);

ALTER TABLE public.lead_region_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage region assignments"
ON public.lead_region_assignments
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Employees can view region assignments"
ON public.lead_region_assignments
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'employee'));

-- Allow employees to view leads assigned to them (read-only)
CREATE POLICY "Employees can view assigned leads"
ON public.contact_messages
FOR SELECT
TO authenticated
USING (auth.uid() = assigned_to);

-- Create a function to auto-assign leads based on region mappings
CREATE OR REPLACE FUNCTION public.auto_assign_lead()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only auto-assign if not already assigned and biz_area is set
  IF NEW.assigned_to IS NULL AND NEW.biz_area IS NOT NULL THEN
    SELECT employee_id INTO NEW.assigned_to
    FROM public.lead_region_assignments
    WHERE biz_area = NEW.biz_area
    LIMIT 1;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER auto_assign_lead_trigger
BEFORE INSERT ON public.contact_messages
FOR EACH ROW
EXECUTE FUNCTION public.auto_assign_lead();