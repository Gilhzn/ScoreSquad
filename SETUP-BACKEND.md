# ScoreSquad — Backend Setup (Supabase + API-Football)

This turns ScoreSquad into a **real app**: data lives in Postgres on the network,
match results/times come from a live sports feed and are **written only by the
server** (users can never change them), chat is realtime, and points are computed
server-side so standings can't be faked.

> **Status / staging.** This step sets up the **backend + client plumbing**. The
> app keeps showing demo (mock) data in the UI until the screen-wiring stage is
> done. When `config.js` is empty the app runs in offline DEMO mode; once you fill
> it in and the screens are wired to `window.DB`, it goes live.

---

## What you need
- A free **Supabase** account → https://supabase.com
- A free **API-Football** key → https://www.api-football.com (api-sports.io)
- The **Supabase CLI** (for deploying the edge function) → https://supabase.com/docs/guides/cli

---

## 1. Create the Supabase project
1. New project → pick a name + database password + region.
2. Project Settings → **API**, copy:
   - **Project URL** (e.g. `https://abcd1234.supabase.co`)
   - **anon public** key  → goes in the client (`config.js`) — safe to ship
   - **service_role** key → server-only secret (cron + function); never in the client
   - **Reference ID** (the `abcd1234` part) — used by the cron URL

## 2. Create the schema + security
Open **SQL Editor** and run the whole file:
```
supabase/migrations/0001_schema.sql
```
This creates all tables, Row-Level Security policies (read-only match data, you can
only write your own predictions before lock and your own chat), the server-side
scoring view, and the realtime publication.

## 3. Get an API-Football key & set the competition
1. Sign up at api-sports.io, copy your API key.
2. Find the league id + season you want to track. Quick test:
   ```bash
   curl https://v3.football.api-sports.io/leagues?search=world%20cup \
     -H "x-apisports-key: YOUR_KEY"
   ```
   The **World Cup** league id is `1`. Set it in SQL editor if different:
   ```sql
   update app_settings set value = '1'    where key = 'competition_id';
   update app_settings set value = '2026' where key = 'season';
   ```

## 4. Deploy the sync function
```bash
supabase login
supabase link --project-ref <PROJECT_REF>
supabase secrets set API_FOOTBALL_KEY=your_api_football_key
supabase functions deploy sync-fixtures
```
Test it (this does one real API call and fills the tables):
```bash
curl -X POST "https://<PROJECT_REF>.functions.supabase.co/sync-fixtures?mode=full" \
  -H "Authorization: Bearer <SERVICE_ROLE_KEY>"
```
Check the **fixtures** and **teams** tables — they should now have real rows.

## 5. Schedule automatic syncing
Run `supabase/cron-setup.sql` in the SQL editor after replacing `<PROJECT_REF>`
and `<SERVICE_ROLE_KEY>`. Watch the API quota note in that file (free tier ≈ 100
requests/day).

## 6. Enable auth
Authentication → Providers: enable **Email** (and optionally Google/Apple).
A `profiles` row is created automatically for every new user.

## 7. Point the client at your project
Edit **`config.js`** at the repo root:
```js
window.SCORESQUAD_CONFIG = {
  supabaseUrl: 'https://<PROJECT_REF>.supabase.co',
  supabaseAnonKey: '<ANON_PUBLIC_KEY>'
};
```
Rebuild the web bundle / APK:
```bash
npm run build:www      # web
# the GitHub Action rebuilds the APK on push
```

---

## How "no tampering" is guaranteed
- **Match data** (`teams`, `fixtures`, scores, kickoff times) has RLS that allows
  only `SELECT` for clients. The only writer is the edge function, which uses the
  **service-role** key on the server.
- **Predictions** can be inserted/updated only by their owner and only **before
  lock** (`fixture_is_locked` = kickoff − 5 min), enforced in the RLS `WITH CHECK`.
- **Opponents' predictions** are hidden until the fixture locks (the reveal mechanic).
- **Points** come from the `prediction_points` / `standings` SQL views — computed
  from real results, never sent by the client.

## Files
| File | Purpose |
|---|---|
| `supabase/migrations/0001_schema.sql` | tables, RLS, scoring views, RPCs |
| `supabase/functions/sync-fixtures/index.ts` | server-side API-Football → DB sync |
| `supabase/cron-setup.sql` | schedule the sync function |
| `supabase/config.toml` | Supabase CLI project config |
| `config.js` | client: Supabase URL + anon key (public) |
| `supabase-client.jsx` | initializes `window.sb` + `window.LIVE` |
| `db.jsx` | client data-access layer (`window.DB`) |
