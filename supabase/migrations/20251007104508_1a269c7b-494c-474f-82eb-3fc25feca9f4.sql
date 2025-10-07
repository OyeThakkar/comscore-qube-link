-- Ensure one row per (studio_id, qw_company_id)
WITH ranked AS (
  SELECT id,
         row_number() OVER (
           PARTITION BY studio_id, qw_company_id
           ORDER BY updated_at DESC, created_at DESC
         ) AS rn
  FROM public.distributors
)
DELETE FROM public.distributors d
USING ranked r
WHERE d.id = r.id AND r.rn > 1;

-- Create unique index to support ON CONFLICT upserts
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE schemaname = 'public' AND indexname = 'distributors_unique_studio_company_idx'
  ) THEN
    CREATE UNIQUE INDEX distributors_unique_studio_company_idx
    ON public.distributors (studio_id, qw_company_id);
  END IF;
END $$;

-- Backfill distributors from existing orders
INSERT INTO public.distributors (studio_id, studio_name, qw_company_id, qw_company_name, user_id)
SELECT DISTINCT o.studio_id, o.studio_name, o.qw_company_id, o.qw_company_name, o.user_id
FROM public.orders o
WHERE o.studio_id IS NOT NULL
  AND o.studio_name IS NOT NULL
  AND o.qw_company_id IS NOT NULL
  AND o.qw_company_name IS NOT NULL
ON CONFLICT (studio_id, qw_company_id) DO NOTHING;

-- Trigger function to auto-sync distributors when orders are inserted/updated
CREATE OR REPLACE FUNCTION public.sync_distributor_from_order()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Ignore when required fields are missing
  IF NEW.studio_id IS NULL OR NEW.studio_name IS NULL OR NEW.qw_company_id IS NULL OR NEW.qw_company_name IS NULL THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.distributors (studio_id, studio_name, qw_company_id, qw_company_name, user_id)
  VALUES (NEW.studio_id, NEW.studio_name, NEW.qw_company_id, NEW.qw_company_name, NEW.user_id)
  ON CONFLICT (studio_id, qw_company_id)
  DO UPDATE SET
    studio_name = EXCLUDED.studio_name,
    qw_company_name = EXCLUDED.qw_company_name,
    updated_at = now(),
    updated_by = NEW.user_id;

  RETURN NEW;
END;
$$;

-- Create trigger on orders table
DROP TRIGGER IF EXISTS trg_sync_distributor_from_order ON public.orders;
CREATE TRIGGER trg_sync_distributor_from_order
AFTER INSERT OR UPDATE OF studio_id, studio_name, qw_company_id, qw_company_name, user_id
ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.sync_distributor_from_order();