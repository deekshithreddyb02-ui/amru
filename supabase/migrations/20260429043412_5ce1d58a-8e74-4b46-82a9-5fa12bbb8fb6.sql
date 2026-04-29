-- Stock movements table for inventory tracking
CREATE TABLE public.crm_stock_movements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL,
  product_id UUID NOT NULL,
  movement_type TEXT NOT NULL CHECK (movement_type IN ('in','out','adjustment','reserved','released')),
  quantity NUMERIC NOT NULL,
  unit_cost NUMERIC DEFAULT 0,
  reference_type TEXT,
  reference_id UUID,
  reference_number TEXT,
  notes TEXT,
  performed_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_stock_movements_workspace ON public.crm_stock_movements(workspace_id, created_at DESC);
CREATE INDEX idx_stock_movements_product ON public.crm_stock_movements(product_id, created_at DESC);

ALTER TABLE public.crm_stock_movements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members view stock movements" ON public.crm_stock_movements
  FOR SELECT USING (is_crm_member(auth.uid(), workspace_id));

CREATE POLICY "Members create stock movements" ON public.crm_stock_movements
  FOR INSERT WITH CHECK (is_crm_member(auth.uid(), workspace_id));

CREATE POLICY "CRM admins delete stock movements" ON public.crm_stock_movements
  FOR DELETE USING (is_super_admin(auth.uid()) OR has_crm_role(auth.uid(), workspace_id, 'crm_admin'::app_role));

-- Trigger to auto-update product stock_quantity when movement created
CREATE OR REPLACE FUNCTION public.apply_stock_movement()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.movement_type = 'in' THEN
    UPDATE public.crm_products SET stock_quantity = stock_quantity + NEW.quantity, updated_at = now() WHERE id = NEW.product_id;
  ELSIF NEW.movement_type = 'out' THEN
    UPDATE public.crm_products SET stock_quantity = stock_quantity - NEW.quantity, updated_at = now() WHERE id = NEW.product_id;
  ELSIF NEW.movement_type = 'adjustment' THEN
    UPDATE public.crm_products SET stock_quantity = NEW.quantity, updated_at = now() WHERE id = NEW.product_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_apply_stock_movement
AFTER INSERT ON public.crm_stock_movements
FOR EACH ROW EXECUTE FUNCTION public.apply_stock_movement();