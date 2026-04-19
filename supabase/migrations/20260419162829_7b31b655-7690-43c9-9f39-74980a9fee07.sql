CREATE TABLE public.certifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  subtitle text,
  description text NOT NULL,
  icon_name text NOT NULL DEFAULT 'Award',
  display_order integer NOT NULL DEFAULT 0,
  is_visible boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.certifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view visible certifications"
  ON public.certifications
  FOR SELECT
  USING (is_visible = true);

CREATE POLICY "Admins can manage certifications"
  ON public.certifications
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_certifications_updated_at
  BEFORE UPDATE ON public.certifications
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.certifications (title, subtitle, description, icon_name, display_order) VALUES
  ('ISO 1901: 2015 Certified Company', NULL, 'ISO Certified Company, We follow the Global Compliance and Standards in the Business process - EURO Global Certified Company.', 'Award', 0),
  ('Certified Engineers from IIT Bombay', 'in Water Sustenance and Rainwater Harvesting', 'We have Certified Engineers in Rainwater Harvesting from IIT (INDIAN INSTITUTE OF TECHNOLOGY) Bombay.', 'GraduationCap', 1),
  ('Certified from State Govt of Maharashtra', NULL, 'We have the Qualified and Certified Engineers in Rainwater Harvesting Implementation and Practices.', 'BadgeCheck', 2),
  ('Association with Indian Water Works', NULL, 'Amruta Ground Water Discovery is Associated with Indian Water Works.', 'Users', 3);