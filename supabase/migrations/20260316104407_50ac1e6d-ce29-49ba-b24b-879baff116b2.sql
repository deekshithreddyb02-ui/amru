ALTER TABLE public.services
  ADD COLUMN is_main_tablet boolean NOT NULL DEFAULT false,
  ADD COLUMN is_main_mobile boolean NOT NULL DEFAULT false,
  ADD COLUMN display_order_tablet integer NOT NULL DEFAULT 0,
  ADD COLUMN display_order_mobile integer NOT NULL DEFAULT 0;

-- Copy existing values as defaults for all devices
UPDATE public.services SET
  is_main_tablet = is_main,
  is_main_mobile = is_main,
  display_order_tablet = display_order,
  display_order_mobile = display_order;