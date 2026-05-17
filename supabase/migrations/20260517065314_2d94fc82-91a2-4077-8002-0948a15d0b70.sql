CREATE OR REPLACE FUNCTION public.protect_profile_financials()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Service role (server functions using supabaseAdmin) has no auth.uid(); allow.
  IF auth.uid() IS NULL THEN RETURN NEW; END IF;
  IF public.has_role(auth.uid(), 'admin') THEN RETURN NEW; END IF;
  IF NEW.balance IS DISTINCT FROM OLD.balance
     OR NEW.total_earned IS DISTINCT FROM OLD.total_earned
     OR NEW.total_withdrawn IS DISTINCT FROM OLD.total_withdrawn
     OR NEW.referral_code IS DISTINCT FROM OLD.referral_code
     OR NEW.referred_by IS DISTINCT FROM OLD.referred_by THEN
    RAISE EXCEPTION 'Cannot modify protected fields';
  END IF;
  RETURN NEW;
END;
$function$;