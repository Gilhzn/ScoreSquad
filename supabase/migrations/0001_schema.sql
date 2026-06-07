-- ============================================================================
-- ScoreSquad — database schema, security (RLS) and server-side scoring
-- ----------------------------------------------------------------------------
-- Run this in the Supabase SQL editor (or via `supabase db push`).
-- Design goals:
--   * All data lives in Postgres (shared across devices, persisted on the network).
--   * Match data (teams / fixtures / live scores) is written ONLY by the server
--     (the sync edge function, which uses the service-role key and bypasses RLS).
--     Clients have READ-ONLY access — they can never change a result or kickoff time.
--   * Users can only write their own predictions (and only before lock) and their
--     own chat messages. Enforced by Row-Level Security.
--   * Points are computed server-side (a SQL view), so standings can't be faked.
-- ============================================================================

create extension if not exists "pgcrypto";

-- ----------------------------------------------------------------------------
-- app_settings: which competition/season the app currently tracks.
-- Only the service role (edge function) may change it.
-- ----------------------------------------------------------------------------
create table if not exists public.app_settings (
  key   text primary key,
  value text not null
);
insert into public.app_settings(key, value) values
  ('competition_id', '1'),   -- API-Football league id (1 = World Cup)
  ('season', '2026')
on conflict (key) do nothing;

-- ----------------------------------------------------------------------------
-- profiles: one row per auth user (1:1 with auth.users)
-- ----------------------------------------------------------------------------
create table if not exists public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  display_name  text not null default 'Player',
  avatar_color  text not null default '#FF7A1A',
  avatar_icon   text not null default '⚽',
  created_at    timestamptz not null default now()
);

-- auto-create a profile when a new auth user signs up
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ----------------------------------------------------------------------------
-- teams / players — populated by the sync edge function from API-Football
-- ----------------------------------------------------------------------------
create table if not exists public.teams (
  id        bigint primary key,          -- API-Football team id
  name      text not null,
  code      text,                         -- 3-letter code when available
  logo_url  text,
  updated_at timestamptz not null default now()
);

create table if not exists public.players (
  id         bigint primary key,          -- API-Football player id
  name       text not null,
  team_id    bigint references public.teams(id),
  photo_url  text,
  updated_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- fixtures — the real matches. Written ONLY by the server.
-- ----------------------------------------------------------------------------
create table if not exists public.fixtures (
  id            bigint primary key,        -- API-Football fixture id
  competition_id bigint not null,
  season        int not null,
  round         text,
  home_team_id  bigint references public.teams(id),
  away_team_id  bigint references public.teams(id),
  kickoff_at    timestamptz not null,
  status        text not null default 'NS', -- NS, 1H, HT, 2H, ET, LIVE, FT, AET, PEN, PST, CANC...
  elapsed       int,
  home_goals    int,
  away_goals    int,
  updated_at    timestamptz not null default now()
);
create index if not exists fixtures_kickoff_idx on public.fixtures (kickoff_at);

-- a fixture is "live" / "finished" helpers
create or replace function public.fixture_is_locked(f_id bigint)
returns boolean language sql stable as $$
  select coalesce(now() >= (kickoff_at - interval '5 minutes'), true)
  from public.fixtures where id = f_id;
$$;

-- ----------------------------------------------------------------------------
-- leagues / membership (friend groups)
-- ----------------------------------------------------------------------------
create table if not exists public.leagues (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  emoji      text not null default '🏆',
  code       text not null unique,
  owner_id   uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.league_members (
  league_id uuid not null references public.leagues(id) on delete cascade,
  user_id   uuid not null references public.profiles(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (league_id, user_id)
);

-- SECURITY DEFINER helper to avoid recursive RLS on league_members
create or replace function public.is_league_member(l_id uuid, u_id uuid)
returns boolean language sql security definer stable set search_path = public as $$
  select exists(select 1 from public.league_members where league_id = l_id and user_id = u_id);
$$;

-- join a league by code (bypasses RLS safely)
create or replace function public.join_league(p_code text)
returns uuid language plpgsql security definer set search_path = public as $$
declare l_id uuid;
begin
  select id into l_id from public.leagues where upper(code) = upper(p_code);
  if l_id is null then raise exception 'league_not_found'; end if;
  insert into public.league_members(league_id, user_id) values (l_id, auth.uid())
    on conflict do nothing;
  return l_id;
end; $$;

-- create a league and auto-join the creator
create or replace function public.create_league(p_name text, p_emoji text)
returns uuid language plpgsql security definer set search_path = public as $$
declare l_id uuid; new_code text;
begin
  new_code := upper(substr(replace(gen_random_uuid()::text,'-',''),1,5));
  insert into public.leagues(name, emoji, code, owner_id)
    values (p_name, coalesce(p_emoji,'🏆'), new_code, auth.uid())
    returning id into l_id;
  insert into public.league_members(league_id, user_id) values (l_id, auth.uid());
  return l_id;
end; $$;

-- ----------------------------------------------------------------------------
-- predictions — users write their own, only before lock
-- ----------------------------------------------------------------------------
create table if not exists public.predictions (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  fixture_id bigint not null references public.fixtures(id) on delete cascade,
  home_pred  int not null check (home_pred >= 0),
  away_pred  int not null check (away_pred >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, fixture_id)
);

-- ----------------------------------------------------------------------------
-- chat messages (per league) — realtime enabled
-- ----------------------------------------------------------------------------
create table if not exists public.chat_messages (
  id         uuid primary key default gen_random_uuid(),
  league_id  uuid not null references public.leagues(id) on delete cascade,
  user_id    uuid references public.profiles(id) on delete set null,
  type       text not null default 'msg' check (type in ('msg','sticker','gif','system')),
  body       text,
  created_at timestamptz not null default now()
);
create index if not exists chat_league_idx on public.chat_messages (league_id, created_at);

-- ============================================================================
-- SCORING — server-side, as a view. Clients cannot alter points.
--   10 = exact score · 5 = correct winner + exact margin · 3 = correct trend · 0 = miss
--   (points count once a fixture is live or finished, so the table moves in real time)
-- ============================================================================
create or replace view public.prediction_points
with (security_invoker = true) as
select
  p.user_id,
  p.fixture_id,
  case
    when p.home_pred = f.home_goals and p.away_pred = f.away_goals then 10
    when sign(p.home_pred - p.away_pred) = sign(f.home_goals - f.away_goals) then
      case
        when f.home_goals <> f.away_goals
             and (p.home_pred - p.away_pred) = (f.home_goals - f.away_goals) then 5
        else 3
      end
    else 0
  end as points
from public.predictions p
join public.fixtures f on f.id = p.fixture_id
where f.status <> 'NS' and f.home_goals is not null and f.away_goals is not null;

-- standings per league (sum of each member's points)
create or replace view public.standings
with (security_invoker = true) as
select
  lm.league_id,
  lm.user_id,
  pr.display_name,
  pr.avatar_color,
  pr.avatar_icon,
  coalesce(sum(pp.points), 0)::int as points,
  count(pp.points) filter (where pp.points = 10)::int as exact_hits
from public.league_members lm
join public.profiles pr on pr.id = lm.user_id
left join public.prediction_points pp on pp.user_id = lm.user_id
group by lm.league_id, lm.user_id, pr.display_name, pr.avatar_color, pr.avatar_icon;

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================
alter table public.profiles        enable row level security;
alter table public.teams           enable row level security;
alter table public.players         enable row level security;
alter table public.fixtures        enable row level security;
alter table public.leagues         enable row level security;
alter table public.league_members  enable row level security;
alter table public.predictions     enable row level security;
alter table public.chat_messages   enable row level security;
alter table public.app_settings    enable row level security;

-- profiles: anyone authenticated can read; you may update only your own
create policy profiles_read   on public.profiles for select to authenticated using (true);
create policy profiles_update on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

-- reference data: read-only for authenticated users (no client writes at all)
create policy teams_read    on public.teams    for select to authenticated using (true);
create policy players_read  on public.players  for select to authenticated using (true);
create policy fixtures_read on public.fixtures for select to authenticated using (true);
create policy settings_read on public.app_settings for select to authenticated using (true);

-- leagues: members can read their leagues; any authenticated user may create one
create policy leagues_read   on public.leagues for select to authenticated
  using (public.is_league_member(id, auth.uid()));
create policy leagues_insert on public.leagues for insert to authenticated
  with check (owner_id = auth.uid());

-- league_members: visible to fellow members
create policy members_read on public.league_members for select to authenticated
  using (public.is_league_member(league_id, auth.uid()));

-- predictions:
--   * read your own anytime
--   * read others' only after the fixture is locked (the "reveal" mechanic)
--   * insert/update your own only before lock
create policy preds_read_own on public.predictions for select to authenticated
  using (user_id = auth.uid());
create policy preds_read_revealed on public.predictions for select to authenticated
  using (public.fixture_is_locked(fixture_id));
create policy preds_insert on public.predictions for insert to authenticated
  with check (user_id = auth.uid() and not public.fixture_is_locked(fixture_id));
create policy preds_update on public.predictions for update to authenticated
  using (user_id = auth.uid() and not public.fixture_is_locked(fixture_id))
  with check (user_id = auth.uid() and not public.fixture_is_locked(fixture_id));

-- chat: members of the league can read & post (as themselves)
create policy chat_read on public.chat_messages for select to authenticated
  using (public.is_league_member(league_id, auth.uid()));
create policy chat_insert on public.chat_messages for insert to authenticated
  with check (public.is_league_member(league_id, auth.uid())
              and (user_id = auth.uid() or user_id is null)
              and type in ('msg','sticker','gif'));

-- realtime publication for chat + live fixtures/standings updates
alter publication supabase_realtime add table public.chat_messages;
alter publication supabase_realtime add table public.fixtures;
alter publication supabase_realtime add table public.predictions;
