/* live-store.jsx — live data layer (used when window.LIVE === true).
   Loads profile/leagues/fixtures/predictions/standings/chat from Supabase,
   registers live teams into window.TEAMS (so Flag/VS keep working), wires
   realtime (live scores + chat), and exposes actions. Returns a normalized
   `data` object the screens consume — same shapes as the mock data. */

var liveR = React;

/* ---- mappers ---- */
var LIVE_STATUSES = { '1H':1,'2H':1,'HT':1,'ET':1,'BT':1,'P':1,'LIVE':1,'INT':1 };
var DONE_STATUSES = { 'FT':1,'AET':1,'PEN':1 };

function mapStatus(short, kickoffAt){
  if(LIVE_STATUSES[short]) return 'live';
  if(DONE_STATUSES[short]) return 'finished';
  var ms = new Date(kickoffAt).getTime() - Date.now();
  if(ms <= 60*60*1000) return 'locksoon'; // within an hour -> show the lock timer
  return 'upcoming';
}
function kickoffText(dateStr){
  var d = new Date(dateStr);
  var he = d.toLocaleString('he-IL', { weekday:'short', hour:'2-digit', minute:'2-digit' });
  var en = d.toLocaleString('en-GB', { weekday:'short', hour:'2-digit', minute:'2-digit' });
  return { he: he, en: en };
}
function registerTeams(teams){
  (teams || []).forEach(function(t){
    if(!t) return;
    // numeric id key; no `flag` config => Flag renders the logo image
    window.TEAMS[t.id] = { name: { he: t.name, en: t.name }, logo_url: t.logo_url, code: t.code };
  });
}
function mapFixture(f, myPredByFixture){
  var mp = myPredByFixture[f.id];
  // home/away may be expanded objects (from the join) or raw ids
  var homeId = f.home && f.home.id ? f.home.id : f.home_team_id;
  var awayId = f.away && f.away.id ? f.away.id : f.away_team_id;
  if(f.home) registerTeams([f.home]);
  if(f.away) registerTeams([f.away]);
  return {
    id: f.id, home: homeId, away: awayId,
    hs: f.home_goals, as: f.away_goals, minute: f.elapsed || 0,
    status: mapStatus(f.status, f.kickoff_at), round: f.round || '',
    kickoff: kickoffText(f.kickoff_at),
    kickoff_at: f.kickoff_at,
    lockMs: Math.max(0, new Date(f.kickoff_at).getTime() - Date.now()),
    myPred: mp ? { h: mp.home_pred, a: mp.away_pred } : null
  };
}
function mapMember(s, myId){
  return {
    id: s.user_id, name: { he: s.display_name, en: s.display_name },
    color: s.avatar_color || '#64748B', icon: s.avatar_icon || '⚽',
    pts: s.points || 0, trend: 0, you: s.user_id === myId, exact_hits: s.exact_hits || 0
  };
}
function mapMessage(m, myId){
  var prof = m.profiles || {};
  return {
    id: m.user_id || 'sys', type: m.type, mine: m.user_id === myId,
    text: { he: m.body, en: m.body },
    profile: { display_name: prof.display_name, color: prof.avatar_color, icon: prof.avatar_icon }
  };
}

/* ---- the hook ---- */
function useLiveData(session){
  var st = liveR.useState({ loading:true, profile:null, leagues:[], activeLeagueId:null,
    fixtures:[], members:[], chat:[], myId: session ? session.user.id : null });
  var data = st[0], setData = st[1];
  var patch = function(p){ setData(function(prev){ return Object.assign({}, prev, p); }); };

  var myId = session ? session.user.id : null;

  // initial load: profile + leagues + fixtures + my predictions
  liveR.useEffect(function(){
    if(!myId) return;
    var cancelled = false;
    (async function(){
      try {
        var profile = await window.DB.getProfile(myId).catch(function(){ return null; });
        var leagues = await window.DB.myLeagues().catch(function(){ return []; });
        var fixturesRaw = await window.DB.listFixtures().catch(function(){ return []; });
        var myPreds = await window.DB.myPredictions().catch(function(){ return []; });
        var predBy = {}; myPreds.forEach(function(p){ predBy[p.fixture_id] = p; });
        var fixtures = fixturesRaw.map(function(f){ return mapFixture(f, predBy); });
        var activeId = leagues && leagues.length ? leagues[0].id : null;
        if(cancelled) return;
        patch({ loading:false, profile:profile, leagues:leagues, fixtures:fixtures,
          activeLeagueId:activeId, myId:myId });
      } catch(e){
        console.warn('[ScoreSquad] live load failed', e);
        if(!cancelled) patch({ loading:false });
      }
    })();
    return function(){ cancelled = true; };
  }, [myId]);

  // load standings + chat for the active league, and subscribe to chat
  liveR.useEffect(function(){
    var leagueId = data.activeLeagueId;
    if(!leagueId) return;
    var chan = null, cancelled = false;
    (async function(){
      var members = await window.DB.leagueMembers(leagueId).catch(function(){ return []; });
      var msgs = await window.DB.listMessages(leagueId).catch(function(){ return []; });
      if(cancelled) return;
      patch({ members: members.map(function(m){ return mapMember(m, myId); }),
              chat: msgs.map(function(m){ return mapMessage(m, myId); }) });
      chan = window.DB.subscribeChat(leagueId, function(row){
        setData(function(prev){
          return Object.assign({}, prev, { chat: prev.chat.concat([mapMessage(row, myId)]) });
        });
      });
    })();
    return function(){ cancelled = true; if(chan) window.DB.unsubscribe(chan); };
  }, [data.activeLeagueId, myId]);

  // subscribe to live fixture changes (scores tick in real time)
  liveR.useEffect(function(){
    if(!myId) return;
    var chan = window.DB.subscribeFixtures(function(){
      window.DB.listFixtures().then(function(raw){
        setData(function(prev){
          var predBy = {}; // keep existing myPred mapping
          prev.fixtures.forEach(function(f){ if(f.myPred) predBy[f.id] = { home_pred:f.myPred.h, away_pred:f.myPred.a }; });
          return Object.assign({}, prev, { fixtures: raw.map(function(f){ return mapFixture(f, predBy); }) });
        });
        // refresh standings too (points move with live scores)
        if(data.activeLeagueId){
          window.DB.leagueMembers(data.activeLeagueId).then(function(ms){
            setData(function(prev){ return Object.assign({}, prev, { members: ms.map(function(m){ return mapMember(m, myId); }) }); });
          });
        }
      });
    });
    return function(){ if(chan) window.DB.unsubscribe(chan); };
  }, [myId, data.activeLeagueId]);

  /* ---- actions ---- */
  var actions = {
    setActiveLeague: function(id){ patch({ activeLeagueId: id }); },
    upsertPrediction: async function(fixtureId, h, a){
      await window.DB.upsertPrediction(fixtureId, h, a);
      setData(function(prev){
        return Object.assign({}, prev, { fixtures: prev.fixtures.map(function(f){
          return f.id === fixtureId ? Object.assign({}, f, { myPred:{ h:h, a:a } }) : f;
        }) });
      });
    },
    sendMessage: async function(type, body){
      if(!data.activeLeagueId) return;
      await window.DB.sendMessage(data.activeLeagueId, type, body);
      // realtime INSERT will append it
    },
    createLeague: async function(name, emoji){
      var id = await window.DB.createLeague(name, emoji);
      var leagues = await window.DB.myLeagues();
      patch({ leagues: leagues, activeLeagueId: id });
      return id;
    },
    joinLeague: async function(code){
      var id = await window.DB.joinLeague(code);
      var leagues = await window.DB.myLeagues();
      patch({ leagues: leagues, activeLeagueId: id });
      return id;
    },
    refreshProfile: async function(){
      var p = await window.DB.getProfile(myId); patch({ profile: p });
    }
  };

  // shape leagues for the UI (add bilingual name + member count placeholder)
  var leaguesUI = (data.leagues || []).map(function(l){
    return { id:l.id, name:{ he:l.name, en:l.name }, emoji:l.emoji || '🏆', code:l.code,
             members: data.activeLeagueId === l.id ? (data.members ? data.members.length : 0) : 0 };
  });
  var activeLeague = leaguesUI.filter(function(l){ return l.id === data.activeLeagueId; })[0] || null;

  return {
    live: true,
    loading: data.loading,
    myId: myId,
    profile: data.profile,
    leagues: leaguesUI,
    activeLeague: activeLeague,
    fixtures: data.fixtures,
    members: (data.members || []).slice().sort(function(a,b){ return b.pts - a.pts; }),
    chat: data.chat,
    actions: actions
  };
}

window.useLiveData = useLiveData;
