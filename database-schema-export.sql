-- ============================================================
-- FULL DATABASE SCHEMA EXPORT
-- Amruta Water Solutions
-- Generated: 2026-03-02
-- ============================================================

-- ============================================================
-- 1. ENUMS
-- ============================================================

CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TYPE public.booking_status AS ENUM (
  'pending', 'confirmed', 'in_progress', 'completed', 'cancelled'
);

CREATE TYPE public.order_status AS ENUM (
  'enquiry_received', 'site_visit_scheduled', 'survey_in_progress',
  'report_generated', 'work_started', 'completed'
);

-- ============================================================
-- 2. TABLES
-- ============================================================

CREATE TABLE public.testimonials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  display_order integer NOT NULL DEFAULT 0,
  is_visible boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  name text NOT NULL,
  organization text DEFAULT ''::text,
  text text NOT NULL
);

CREATE TABLE public.services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  is_main boolean NOT NULL DEFAULT false,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  title text NOT NULL,
  description text NOT NULL,
  image text NOT NULL,
  link text
);

CREATE TABLE public.gallery_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  display_order integer NOT NULL DEFAULT 0,
  is_visible boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  image_url text NOT NULL,
  caption text
);

CREATE TABLE public.site_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  metadata jsonb DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid,
  section_key text NOT NULL,
  title text,
  content text
);

CREATE TABLE public.contact_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  is_read boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  service text,
  message text NOT NULL
);

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  full_name text NOT NULL DEFAULT ''::text,
  phone text DEFAULT ''::text
);

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role app_role NOT NULL DEFAULT 'user'::app_role,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

CREATE TABLE public.bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  service_id uuid REFERENCES public.services(id),
  booking_date date NOT NULL,
  booking_time time NOT NULL,
  status booking_status NOT NULL DEFAULT 'pending'::booking_status,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  notes text,
  location text,
  phone text
);

CREATE TABLE public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  service_id uuid NOT NULL REFERENCES public.services(id),
  rating integer NOT NULL,
  is_verified boolean DEFAULT false,
  is_published boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  content text,
  title text
);

CREATE TABLE public.saved_services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  service_id uuid NOT NULL REFERENCES public.services(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, service_id)
);

CREATE TABLE public.order_tracking (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  booking_id uuid REFERENCES public.bookings(id),
  enquiry_id uuid REFERENCES public.contact_messages(id),
  status order_status NOT NULL DEFAULT 'enquiry_received'::order_status,
  expected_completion date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  status_message text
);

-- ============================================================
-- 3. FUNCTIONS
-- ============================================================

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', '')
  );
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_update_user_role(_target_user_id uuid, _new_role app_role)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _admin_count INTEGER;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only admins can update user roles';
  END IF;
  IF auth.uid() = _target_user_id AND _new_role != 'admin' THEN
    RAISE EXCEPTION 'Cannot demote yourself from admin';
  END IF;
  IF _new_role != 'admin' THEN
    SELECT COUNT(*) INTO _admin_count
    FROM public.user_roles
    WHERE role = 'admin' AND user_id != _target_user_id;
    IF _admin_count = 0 THEN
      RAISE EXCEPTION 'Cannot remove the last admin';
    END IF;
  END IF;
  UPDATE public.user_roles SET role = _new_role WHERE user_id = _target_user_id;
  RETURN TRUE;
END;
$$;

CREATE OR REPLACE FUNCTION public.validate_contact_message()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF length(NEW.name) > 100 THEN RAISE EXCEPTION 'Name exceeds maximum length'; END IF;
  IF length(NEW.email) > 255 THEN RAISE EXCEPTION 'Email exceeds maximum length'; END IF;
  IF length(coalesce(NEW.phone, '')) > 20 THEN RAISE EXCEPTION 'Phone exceeds maximum length'; END IF;
  IF length(NEW.message) > 2000 THEN RAISE EXCEPTION 'Message exceeds maximum length'; END IF;
  IF NEW.email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' THEN RAISE EXCEPTION 'Invalid email format'; END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.rate_limit_contact_messages()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  recent_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO recent_count
  FROM public.contact_messages
  WHERE email = NEW.email AND created_at > now() - interval '1 hour';
  IF recent_count >= 5 THEN
    RAISE EXCEPTION 'Too many submissions. Please try again later.';
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_users_with_emails()
RETURNS TABLE(user_id uuid, email text, created_at timestamptz)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT au.id, au.email::text, au.created_at
  FROM auth.users au
  WHERE public.has_role(auth.uid(), 'admin')
$$;

-- ============================================================
-- 4. TRIGGERS (attach to auth.users on your new Supabase project)
-- ============================================================

-- NOTE: These triggers attach to auth.users.
-- Run them AFTER setting up your Supabase project.

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TRIGGER on_auth_user_created_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_profile();

-- Contact message validation & rate limiting
CREATE TRIGGER validate_contact_message_trigger
  BEFORE INSERT ON public.contact_messages
  FOR EACH ROW EXECUTE FUNCTION public.validate_contact_message();

CREATE TRIGGER rate_limit_contact_messages_trigger
  BEFORE INSERT ON public.contact_messages
  FOR EACH ROW EXECUTE FUNCTION public.rate_limit_contact_messages();

-- ============================================================
-- 5. ROW LEVEL SECURITY
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gallery_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_tracking ENABLE ROW LEVEL SECURITY;

-- == testimonials ==
CREATE POLICY "Anyone can view visible testimonials" ON public.testimonials
  FOR SELECT USING (is_visible = true);
CREATE POLICY "Admins can manage testimonials" ON public.testimonials
  FOR ALL USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

-- == services ==
CREATE POLICY "Anyone can read services" ON public.services
  FOR SELECT USING (true);
CREATE POLICY "Admins can insert services" ON public.services
  FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update services" ON public.services
  FOR UPDATE USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete services" ON public.services
  FOR DELETE USING (has_role(auth.uid(), 'admin'));

-- == saved_services ==
CREATE POLICY "Users can view their saved services" ON public.saved_services
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can save services" ON public.saved_services
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can remove saved services" ON public.saved_services
  FOR DELETE USING (auth.uid() = user_id);

-- == gallery_images ==
CREATE POLICY "Admins can manage gallery images" ON public.gallery_images
  FOR ALL USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Anyone can view visible gallery images" ON public.gallery_images
  FOR SELECT USING (is_visible = true);

-- == bookings ==
CREATE POLICY "Users can view their own bookings" ON public.bookings
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own bookings" ON public.bookings
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own bookings" ON public.bookings
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can cancel their own bookings" ON public.bookings
  FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all bookings" ON public.bookings
  FOR ALL USING (has_role(auth.uid(), 'admin'));

-- == reviews ==
CREATE POLICY "Anyone can read published reviews" ON public.reviews
  FOR SELECT USING (is_published = true);
CREATE POLICY "Users can create their own reviews" ON public.reviews
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own reviews" ON public.reviews
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own reviews" ON public.reviews
  FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all reviews" ON public.reviews
  FOR ALL USING (has_role(auth.uid(), 'admin'));

-- == site_content ==
CREATE POLICY "Anyone can read content" ON public.site_content
  FOR SELECT USING (true);
CREATE POLICY "Admins can update content" ON public.site_content
  FOR UPDATE USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert content" ON public.site_content
  FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'));

-- == user_roles ==
CREATE POLICY "Users can view own roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all roles" ON public.user_roles
  FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Prevent direct role insertions" ON public.user_roles
  FOR INSERT WITH CHECK (false);
CREATE POLICY "Prevent direct role updates" ON public.user_roles
  FOR UPDATE USING (false);
CREATE POLICY "Prevent direct role deletions" ON public.user_roles
  FOR DELETE USING (false);

-- == contact_messages ==
CREATE POLICY "Admins can view messages" ON public.contact_messages
  FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Anyone can submit messages" ON public.contact_messages
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can update messages" ON public.contact_messages
  FOR UPDATE USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete messages" ON public.contact_messages
  FOR DELETE USING (has_role(auth.uid(), 'admin'));

-- == profiles ==
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (has_role(auth.uid(), 'admin'));

-- == order_tracking ==
CREATE POLICY "Users can view their own orders" ON public.order_tracking
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all orders" ON public.order_tracking
  FOR ALL USING (has_role(auth.uid(), 'admin'));

-- ============================================================
-- 6. STORAGE BUCKET
-- ============================================================

-- Create a public storage bucket named 'main'
INSERT INTO storage.buckets (id, name, public) VALUES ('main', 'main', true);

-- ============================================================
-- END OF EXPORT
-- ============================================================
