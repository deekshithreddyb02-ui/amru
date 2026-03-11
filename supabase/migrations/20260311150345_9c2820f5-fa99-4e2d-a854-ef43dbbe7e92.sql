
CREATE TABLE public.customer_feedback (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT,
  description TEXT,
  media_type TEXT NOT NULL DEFAULT 'image' CHECK (media_type IN ('image', 'video')),
  media_url TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_visible BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.customer_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view visible feedback"
  ON public.customer_feedback
  FOR SELECT
  USING (is_visible = true);

CREATE POLICY "Admins can manage feedback"
  ON public.customer_feedback
  FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_customer_feedback_updated_at
  BEFORE UPDATE ON public.customer_feedback
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
