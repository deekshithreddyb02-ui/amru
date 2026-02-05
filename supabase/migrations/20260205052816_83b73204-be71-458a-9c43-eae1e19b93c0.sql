-- Create enum for booking status
CREATE TYPE public.booking_status AS ENUM ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled');

-- Create enum for order tracking status
CREATE TYPE public.order_status AS ENUM ('enquiry_received', 'site_visit_scheduled', 'survey_in_progress', 'report_generated', 'work_started', 'completed');

-- Reviews table for user ratings and feedback
CREATE TABLE public.reviews (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    service_id UUID REFERENCES public.services(id) ON DELETE CASCADE NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title TEXT,
    content TEXT,
    is_verified BOOLEAN DEFAULT false,
    is_published BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Bookings table for service appointments
CREATE TABLE public.bookings (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    service_id UUID REFERENCES public.services(id) ON DELETE SET NULL,
    booking_date DATE NOT NULL,
    booking_time TIME NOT NULL,
    status booking_status NOT NULL DEFAULT 'pending',
    notes TEXT,
    location TEXT,
    phone TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Saved services (wishlist/favorites)
CREATE TABLE public.saved_services (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    service_id UUID REFERENCES public.services(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(user_id, service_id)
);

-- Order tracking for project progress
CREATE TABLE public.order_tracking (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE,
    enquiry_id UUID REFERENCES public.contact_messages(id) ON DELETE CASCADE,
    status order_status NOT NULL DEFAULT 'enquiry_received',
    status_message TEXT,
    expected_completion DATE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_tracking ENABLE ROW LEVEL SECURITY;

-- Reviews policies
CREATE POLICY "Anyone can read published reviews" ON public.reviews
    FOR SELECT USING (is_published = true);

CREATE POLICY "Users can create their own reviews" ON public.reviews
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reviews" ON public.reviews
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reviews" ON public.reviews
    FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all reviews" ON public.reviews
    FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Bookings policies
CREATE POLICY "Users can view their own bookings" ON public.bookings
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own bookings" ON public.bookings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own bookings" ON public.bookings
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can cancel their own bookings" ON public.bookings
    FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all bookings" ON public.bookings
    FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Saved services policies
CREATE POLICY "Users can view their saved services" ON public.saved_services
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can save services" ON public.saved_services
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove saved services" ON public.saved_services
    FOR DELETE USING (auth.uid() = user_id);

-- Order tracking policies
CREATE POLICY "Users can view their own orders" ON public.order_tracking
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all orders" ON public.order_tracking
    FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Create triggers for updated_at
CREATE TRIGGER update_reviews_updated_at
    BEFORE UPDATE ON public.reviews
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at
    BEFORE UPDATE ON public.bookings
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_order_tracking_updated_at
    BEFORE UPDATE ON public.order_tracking
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();