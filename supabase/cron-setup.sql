-- ============================================================================
-- Schedule the sync-fixtures edge function with pg_cron + pg_net.
-- Run this in the Supabase SQL editor AFTER deploying the function.
-- Replace <PROJECT_REF> and <SERVICE_ROLE_KEY> with your values
--   (Dashboard -> Project Settings -> API: "Reference ID" and "service_role" key).
--
-- ⚠️ API-Football quota: the free tier is ~100 requests/day. Each function run
-- makes ONE request. Tune the cadence to your plan. The defaults below
-- (live every 5 min + full every 6 h) can exceed the free tier on a busy match
-- day — lower the frequency, or only enable the live job during match windows.
-- ============================================================================

create extension if not exists pg_cron;
create extension if not exists pg_net;

-- live in-play scores
select cron.schedule('scoresquad-live', '*/5 * * * *', $$
  select net.http_post(
    url     := 'https://<PROJECT_REF>.functions.supabase.co/sync-fixtures',
    headers := jsonb_build_object(
                 'Authorization', 'Bearer <SERVICE_ROLE_KEY>',
                 'Content-Type',  'application/json'),
    body    := '{}'::jsonb
  );
$$);

-- full schedule + final results
select cron.schedule('scoresquad-full', '0 */6 * * *', $$
  select net.http_post(
    url     := 'https://<PROJECT_REF>.functions.supabase.co/sync-fixtures?mode=full',
    headers := jsonb_build_object(
                 'Authorization', 'Bearer <SERVICE_ROLE_KEY>',
                 'Content-Type',  'application/json'),
    body    := '{}'::jsonb
  );
$$);

-- to remove later:  select cron.unschedule('scoresquad-live');  select cron.unschedule('scoresquad-full');
