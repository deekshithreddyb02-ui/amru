
-- ============================================================
-- FIX 1: Convert RESTRICTIVE policies to PERMISSIVE
-- All access-granting policies need to be PERMISSIVE.
-- The 3 user_roles deny policies stay RESTRICTIVE.
-- ============================================================

-- == testimonials ==
DROP POLICY IF EXISTS "Anyone can view visible testimonials" ON public.testimonials;
CREATE POLICY "Anyone can view visible testimonials" ON public.testimonials
  FOR SELECT USING (is_visible = true);

DROP POLICY IF EXISTS "Admins can manage testimonials" ON public.testimonials;
CREATE POLICY "Admins can manage testimonials" ON public.testimonials
  FOR ALL USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

-- == services ==
DROP POLICY IF EXISTS "Anyone can read services" ON public.services;
CREATE POLICY "Anyone can read services" ON public.services
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can insert services" ON public.services;
CREATE POLICY "Admins can insert services" ON public.services
  FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can update services" ON public.services;
CREATE POLICY "Admins can update services" ON public.services
  FOR UPDATE USING (has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can delete services" ON public.services;
CREATE POLICY "Admins can delete services" ON public.services
  FOR DELETE USING (has_role(auth.uid(), 'admin'));

-- == saved_services ==
DROP POLICY IF EXISTS "Users can view their saved services" ON public.saved_services;
CREATE POLICY "Users can view their saved services" ON public.saved_services
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can save services" ON public.saved_services;
CREATE POLICY "Users can save services" ON public.saved_services
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can remove saved services" ON public.saved_services;
CREATE POLICY "Users can remove saved services" ON public.saved_services
  FOR DELETE USING (auth.uid() = user_id);

-- == gallery_images ==
DROP POLICY IF EXISTS "Admins can manage gallery images" ON public.gallery_images;
CREATE POLICY "Admins can manage gallery images" ON public.gallery_images
  FOR ALL USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Anyone can view visible gallery images" ON public.gallery_images;
CREATE POLICY "Anyone can view visible gallery images" ON public.gallery_images
  FOR SELECT USING (is_visible = true);

-- == bookings ==
DROP POLICY IF EXISTS "Users can view their own bookings" ON public.bookings;
CREATE POLICY "Users can view their own bookings" ON public.bookings
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own bookings" ON public.bookings;
CREATE POLICY "Users can create their own bookings" ON public.bookings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own bookings" ON public.bookings;
CREATE POLICY "Users can update their own bookings" ON public.bookings
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id AND status IN ('pending', 'cancelled'));

DROP POLICY IF EXISTS "Users can cancel their own bookings" ON public.bookings;
CREATE POLICY "Users can cancel their own bookings" ON public.bookings
  FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can manage all bookings" ON public.bookings;
CREATE POLICY "Admins can manage all bookings" ON public.bookings
  FOR ALL USING (has_role(auth.uid(), 'admin'));

-- == reviews ==
DROP POLICY IF EXISTS "Anyone can read published reviews" ON public.reviews;
CREATE POLICY "Anyone can read published reviews" ON public.reviews
  FOR SELECT USING (is_published = true);

DROP POLICY IF EXISTS "Users can create their own reviews" ON public.reviews;
CREATE POLICY "Users can create their own reviews" ON public.reviews
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
    AND (is_verified IS NULL OR is_verified = false)
    AND (is_published IS NULL OR is_published = true)
  );

DROP POLICY IF EXISTS "Users can update their own reviews" ON public.reviews;
CREATE POLICY "Users can update their own reviews" ON public.reviews
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own reviews" ON public.reviews;
CREATE POLICY "Users can delete their own reviews" ON public.reviews
  FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can manage all reviews" ON public.reviews;
CREATE POLICY "Admins can manage all reviews" ON public.reviews
  FOR ALL USING (has_role(auth.uid(), 'admin'));

-- == site_content ==
DROP POLICY IF EXISTS "Anyone can read content" ON public.site_content;
CREATE POLICY "Anyone can read content" ON public.site_content
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can update content" ON public.site_content;
CREATE POLICY "Admins can update content" ON public.site_content
  FOR UPDATE USING (has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can insert content" ON public.site_content;
CREATE POLICY "Admins can insert content" ON public.site_content
  FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'));

-- == user_roles (SELECT policies become PERMISSIVE, deny policies stay RESTRICTIVE) ==
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
CREATE POLICY "Users can view own roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
CREATE POLICY "Admins can view all roles" ON public.user_roles
  FOR SELECT USING (has_role(auth.uid(), 'admin'));

-- Keep deny policies as RESTRICTIVE
DROP POLICY IF EXISTS "Prevent direct role insertions" ON public.user_roles;
CREATE POLICY "Prevent direct role insertions" ON public.user_roles
  AS RESTRICTIVE FOR INSERT WITH CHECK (false);

DROP POLICY IF EXISTS "Prevent direct role updates" ON public.user_roles;
CREATE POLICY "Prevent direct role updates" ON public.user_roles
  AS RESTRICTIVE FOR UPDATE USING (false);

DROP POLICY IF EXISTS "Prevent direct role deletions" ON public.user_roles;
CREATE POLICY "Prevent direct role deletions" ON public.user_roles
  AS RESTRICTIVE FOR DELETE USING (false);

-- == contact_messages ==
DROP POLICY IF EXISTS "Admins can view messages" ON public.contact_messages;
CREATE POLICY "Admins can view messages" ON public.contact_messages
  FOR SELECT USING (has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Anyone can submit messages" ON public.contact_messages;
CREATE POLICY "Anyone can submit messages" ON public.contact_messages
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can update messages" ON public.contact_messages;
CREATE POLICY "Admins can update messages" ON public.contact_messages
  FOR UPDATE USING (has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can delete messages" ON public.contact_messages;
CREATE POLICY "Admins can delete messages" ON public.contact_messages
  FOR DELETE USING (has_role(auth.uid(), 'admin'));

-- == profiles ==
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (has_role(auth.uid(), 'admin'));

-- == order_tracking ==
DROP POLICY IF EXISTS "Users can view their own orders" ON public.order_tracking;
CREATE POLICY "Users can view their own orders" ON public.order_tracking
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can manage all orders" ON public.order_tracking;
CREATE POLICY "Admins can manage all orders" ON public.order_tracking
  FOR ALL USING (has_role(auth.uid(), 'admin'));

-- ============================================================
-- FIX 2: Trigger to prevent non-admins from setting is_verified
-- ============================================================
CREATE OR REPLACE FUNCTION public.lock_review_controlled_fields()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    NEW.is_verified := false;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER enforce_review_verified
  BEFORE INSERT OR UPDATE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.lock_review_controlled_fields();

-- ============================================================
-- FIX 3: Create private bucket for chat uploads
-- ============================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-uploads', 'chat-uploads', false)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for chat-uploads bucket
CREATE POLICY "Users can upload chat files" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'chat-uploads'
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can view own chat files" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'chat-uploads'
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can delete own chat files" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'chat-uploads'
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
