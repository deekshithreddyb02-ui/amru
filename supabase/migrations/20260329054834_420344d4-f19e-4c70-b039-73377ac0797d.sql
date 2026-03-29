
CREATE TABLE public.custom_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section_key text NOT NULL UNIQUE,
  section_type text NOT NULL DEFAULT 'text',
  title text,
  content text,
  image_url text,
  video_url text,
  button_text text,
  button_link text,
  background_color text,
  text_color text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.custom_sections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view custom sections" ON public.custom_sections FOR SELECT TO public USING (true);
CREATE POLICY "Admins can manage custom sections" ON public.custom_sections FOR ALL TO public USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
