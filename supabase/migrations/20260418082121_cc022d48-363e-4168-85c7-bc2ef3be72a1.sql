-- Add a SECURITY DEFINER function that "expires" a school's plan when its
-- subscription has been cancelled and the current period has passed.
-- Called by the frontend on each subscription read so the mirror stays in sync
-- without requiring a cron job.
CREATE OR REPLACE FUNCTION public.expire_stale_subscription_for_user(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sub record;
BEGIN
  SELECT * INTO v_sub
  FROM public.subscriptions
  WHERE user_id = p_user_id
  ORDER BY updated_at DESC
  LIMIT 1;

  IF v_sub IS NULL THEN RETURN; END IF;

  -- If the subscription is past its period end and either cancelled or
  -- scheduled to cancel, downgrade the linked school.
  IF v_sub.current_period_end IS NOT NULL
     AND v_sub.current_period_end < now()
     AND (v_sub.status = 'canceled' OR v_sub.cancel_at_period_end = true) THEN
    -- Mark subscription final
    UPDATE public.subscriptions
    SET status = 'canceled', updated_at = now()
    WHERE id = v_sub.id AND status <> 'canceled';

    IF v_sub.school_id IS NOT NULL THEN
      UPDATE public.schools
      SET subscription_status = 'canceled', updated_at = now()
      WHERE id = v_sub.school_id AND subscription_status <> 'canceled';
    END IF;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.expire_stale_subscription_for_user(uuid) TO authenticated;

-- Enable realtime on subscriptions so the UI can react to webhook updates instantly
ALTER TABLE public.subscriptions REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.subscriptions;