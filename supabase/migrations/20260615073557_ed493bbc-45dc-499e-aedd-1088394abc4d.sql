
-- 1) Dedupe existing organization rows: keep the oldest per (workspace_id, normalized name),
--    repoint all FK references to the survivor, then delete the duplicates.
DO $$
DECLARE
  rec RECORD;
  survivor UUID;
  dup_ids UUID[];
BEGIN
  FOR rec IN
    SELECT workspace_id, lower(btrim(regexp_replace(name, '\s+', ' ', 'g'))) AS norm_name
    FROM public.crm_organizations
    GROUP BY 1,2
    HAVING count(*) > 1
  LOOP
    SELECT id INTO survivor
      FROM public.crm_organizations
     WHERE workspace_id = rec.workspace_id
       AND lower(btrim(regexp_replace(name, '\s+', ' ', 'g'))) = rec.norm_name
     ORDER BY created_at ASC, id ASC
     LIMIT 1;

    SELECT array_agg(id) INTO dup_ids
      FROM public.crm_organizations
     WHERE workspace_id = rec.workspace_id
       AND lower(btrim(regexp_replace(name, '\s+', ' ', 'g'))) = rec.norm_name
       AND id <> survivor;

    UPDATE public.crm_activities       SET organization_id = survivor WHERE organization_id = ANY(dup_ids);
    UPDATE public.crm_contacts         SET organization_id = survivor WHERE organization_id = ANY(dup_ids);
    UPDATE public.crm_contracts        SET organization_id = survivor WHERE organization_id = ANY(dup_ids);
    UPDATE public.crm_deals            SET organization_id = survivor WHERE organization_id = ANY(dup_ids);
    UPDATE public.crm_documents        SET organization_id = survivor WHERE organization_id = ANY(dup_ids);
    UPDATE public.crm_feedback_surveys SET organization_id = survivor WHERE organization_id = ANY(dup_ids);
    UPDATE public.crm_field_visits     SET organization_id = survivor WHERE organization_id = ANY(dup_ids);
    UPDATE public.crm_invoices         SET organization_id = survivor WHERE organization_id = ANY(dup_ids);
    UPDATE public.crm_portal_tokens    SET organization_id = survivor WHERE organization_id = ANY(dup_ids);
    UPDATE public.crm_quotations       SET organization_id = survivor WHERE organization_id = ANY(dup_ids);
    UPDATE public.crm_sales_orders     SET organization_id = survivor WHERE organization_id = ANY(dup_ids);
    UPDATE public.crm_support_tickets  SET organization_id = survivor WHERE organization_id = ANY(dup_ids);

    DELETE FROM public.crm_organizations WHERE id = ANY(dup_ids);
  END LOOP;
END $$;

-- 2) Unique index on normalized name per workspace.
CREATE UNIQUE INDEX IF NOT EXISTS crm_organizations_workspace_name_unique
  ON public.crm_organizations (workspace_id, lower(btrim(regexp_replace(name, '\s+', ' ', 'g'))));
