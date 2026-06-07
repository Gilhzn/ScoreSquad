// ============================================================================
// sync-fixtures — Supabase Edge Function (Deno)
// ----------------------------------------------------------------------------
// Fetches real match data from API-Football (api-sports.io) and writes it into
// the database using the SERVICE ROLE key (bypasses RLS). This is the ONLY thing
// that writes teams/fixtures/scores — so clients can never tamper with results
// or kickoff times.
//
// Secrets required (set with `supabase secrets set ...`):
//   API_FOOTBALL_KEY              your api-sports.io key
//   SUPABASE_URL                  (auto-provided by Supabase)
//   SUPABASE_SERVICE_ROLE_KEY     (auto-provided by Supabase)
//
// Invoke:
//   POST .../functions/v1/sync-fixtures            -> mode "live"  (in-play only, cheap)
//   POST .../functions/v1/sync-fixtures?mode=full  -> mode "full"  (whole season schedule)
//
// Schedule it with pg_cron / the dashboard. Mind your API quota (free = 100/day):
//   * "full" a few times a day (schedule + final results)
//   * "live" every 1–10 min, ideally only on match days
// ============================================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const API_BASE = "https://v3.football.api-sports.io";

type ApiFixture = {
  fixture: { id: number; date: string; status: { short: string; elapsed: number | null } };
  league: { id: number; season: number; round: string };
  teams: { home: Team; away: Team };
  goals: { home: number | null; away: number | null };
};
type Team = { id: number; name: string; logo: string };

Deno.serve(async (req) => {
  try {
    const url = new URL(req.url);
    const mode = (url.searchParams.get("mode") ?? "live").toLowerCase();

    const apiKey = Deno.env.get("API_FOOTBALL_KEY");
    if (!apiKey) return json({ error: "API_FOOTBALL_KEY not set" }, 500);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } },
    );

    // read the tracked competition/season from app_settings
    const { data: settings } = await supabase.from("app_settings").select("key,value");
    const cfg = Object.fromEntries((settings ?? []).map((r) => [r.key, r.value]));
    const competitionId = Number(cfg.competition_id ?? "1");
    const season = Number(cfg.season ?? new Date().getUTCFullYear());

    // build the API-Football query
    const params = mode === "full"
      ? `?league=${competitionId}&season=${season}`
      : `?live=all`;

    const res = await fetch(`${API_BASE}/fixtures${params}`, {
      headers: { "x-apisports-key": apiKey },
    });
    if (!res.ok) return json({ error: `api-football ${res.status}`, body: await res.text() }, 502);
    const payload = await res.json();
    let fixtures: ApiFixture[] = payload.response ?? [];

    // for live mode, keep only our competition
    if (mode !== "full") fixtures = fixtures.filter((f) => f.league.id === competitionId);

    if (fixtures.length === 0) return json({ mode, synced: 0, note: "no fixtures returned" });

    // upsert teams (dedup home + away)
    const teamMap = new Map<number, Team>();
    for (const f of fixtures) {
      teamMap.set(f.teams.home.id, f.teams.home);
      teamMap.set(f.teams.away.id, f.teams.away);
    }
    const teamRows = [...teamMap.values()].map((t) => ({
      id: t.id, name: t.name, logo_url: t.logo, updated_at: new Date().toISOString(),
    }));
    const { error: teamErr } = await supabase.from("teams").upsert(teamRows, { onConflict: "id" });
    if (teamErr) return json({ error: "teams upsert", detail: teamErr.message }, 500);

    // upsert fixtures
    const fixtureRows = fixtures.map((f) => ({
      id: f.fixture.id,
      competition_id: f.league.id,
      season: f.league.season,
      round: f.league.round,
      home_team_id: f.teams.home.id,
      away_team_id: f.teams.away.id,
      kickoff_at: f.fixture.date,
      status: f.fixture.status.short,
      elapsed: f.fixture.status.elapsed,
      home_goals: f.goals.home,
      away_goals: f.goals.away,
      updated_at: new Date().toISOString(),
    }));
    const { error: fxErr } = await supabase.from("fixtures").upsert(fixtureRows, { onConflict: "id" });
    if (fxErr) return json({ error: "fixtures upsert", detail: fxErr.message }, 500);

    return json({ mode, competitionId, season, synced: fixtureRows.length, teams: teamRows.length });
  } catch (e) {
    return json({ error: String(e?.message ?? e) }, 500);
  }
});

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}
