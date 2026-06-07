/* screens-home.jsx — Home "היציע שלי" + useCountdown + TableRow */

var homeR = React;

/* ---------- useCountdown ---------- */
function useCountdown(ms){
  var st = homeR.useState(ms || 0);
  var remaining = st[0], setRemaining = st[1];
  homeR.useEffect(function(){
    var id = setInterval(function(){
      setRemaining(function(r){ return r <= 1000 ? 0 : r - 1000; });
    }, 1000);
    return function(){ clearInterval(id); };
  }, []);
  var total = Math.max(0, Math.floor(remaining / 1000));
  var h = Math.floor(total / 3600);
  var m = Math.floor((total % 3600) / 60);
  var s = total % 60;
  function pad(n){ return (n < 10 ? '0' : '') + n; }
  return {
    h:h, m:m, s:s,
    urgent: remaining < 10 * 60 * 1000,
    str: pad(h) + ':' + pad(m) + ':' + pad(s)
  };
}

/* ---------- TableRow ---------- */
function TableRow(props){
  var m = props.m, rank = props.rank, lang = props.lang || 'he';
  var medals = { 1:'🥇', 2:'🥈', 3:'🥉' };
  var rankNode = medals[rank]
    ? homeR.createElement('span', { style:{ fontSize:18 } }, medals[rank])
    : homeR.createElement('span', { style:{ fontSize:14, fontWeight:700, color:'var(--ink-3)', width:18, textAlign:'center' } }, rank);

  return homeR.createElement('div', { style:{
    display:'flex', alignItems:'center', gap:10, padding:'8px 10px', borderRadius:14,
    background: m.you ? 'color-mix(in srgb, var(--accent2) 12%, white)' : 'transparent'
  } },
    homeR.createElement('div', { style:{ width:22, display:'flex', justifyContent:'center' } }, rankNode),
    homeR.createElement(window.Avatar, { member:m, size:34, lang:lang }),
    homeR.createElement('div', { style:{ flex:1, fontSize:14.5, fontWeight:700, minWidth:0 } },
      window.tx(m.name, lang),
      m.you ? homeR.createElement('span', { style:{ color:'var(--accent2)', fontWeight:700 } }, '  · ' + window.tx({he:'את/ה',en:'You'}, lang)) : null
    ),
    homeR.createElement(window.TrendArrow, { trend:m.trend }),
    homeR.createElement('div', { className:'ss-num', style:{ fontSize:16, minWidth:30, textAlign:'end' } }, m.pts)
  );
}

/* ---------- Home screen ---------- */
function HomeScreen(props){
  var lang = props.lang || 'he';
  var go = props.go;
  var L = props.data; // live store when present

  // data sources (live vs demo)
  var leagues = L ? L.leagues : window.LEAGUES;
  var league  = L ? (L.activeLeague || (L.leagues[0]||{})) : props.league;
  var setLeague = L ? function(lg){ L.actions.setActiveLeague(lg.id); } : props.setLeague;
  var fixtures = L ? L.fixtures : window.FIXTURES;
  var sorted   = L ? L.members : window.membersSorted();

  // next match = soonest unlocked fixture; live = an in-play fixture
  var nextFixture = L
    ? (fixtures.filter(function(f){ return f.status==='locksoon'; })[0] ||
       fixtures.filter(function(f){ return f.status==='upcoming'; })[0] || null)
    : window.fixtureById('f2');
  var liveFixture = L
    ? (fixtures.filter(function(f){ return f.status==='live'; })[0] || null)
    : window.fixtureById('f1');

  var cd = useCountdown(nextFixture ? nextFixture.lockMs : 0);
  var meRank = sorted.findIndex(function(m){ return m.you; }) + 1;

  /* header */
  var header = homeR.createElement('div', { style:{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:16 } },
    homeR.createElement('div', null,
      homeR.createElement('div', { style:{ fontSize:13, fontWeight:700, color:'var(--ink-3)', marginBottom:2 } },
        window.tx({ he:'מחזור 1 · גביע העולם', en:'Round 1 · World Cup' }, lang)),
      homeR.createElement('div', { style:{ fontSize:27, fontWeight:800 } },
        window.tx({ he:'היציע שלי', en:'My Stand' }, lang))
    ),
    homeR.createElement('div', { style:{
      width:44, height:44, borderRadius:'50%', background:'color-mix(in srgb, var(--accent2) 18%, white)',
      display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, flex:'0 0 auto'
    } }, '⚽')
  );

  /* league carousel */
  var carousel = homeR.createElement('div', { style:{ display:'flex', gap:8, overflowX:'auto', marginBottom:16, paddingBottom:2 } },
    leagues.map(function(lg){
      var active = lg.id === league.id;
      return homeR.createElement('button', { key:lg.id, onClick:function(){ setLeague(lg); }, style:{
        display:'flex', alignItems:'center', gap:7, padding:'8px 14px', borderRadius:999, flex:'0 0 auto',
        background: active ? 'var(--ink)' : 'var(--surface)',
        color: active ? '#fff' : 'var(--ink)',
        boxShadow: active ? '0 4px 12px rgba(16,24,40,.18)' : 'inset 0 0 0 1px var(--line)',
        fontSize:13.5, fontWeight:700
      } },
        homeR.createElement('span', null, lg.emoji),
        homeR.createElement('span', null, window.tx(lg.name, lang)),
        homeR.createElement('span', { style:{ opacity:.6, fontSize:12 } }, lg.members)
      );
    })
  );

  /* next match widget */
  var predicted = !!(nextFixture && nextFixture.myPred);
  var nextMatch = nextFixture ? homeR.createElement(window.Card, { style:{ marginBottom:14 } },
    homeR.createElement('div', { style:{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 } },
      homeR.createElement('div', { style:{ fontSize:14, fontWeight:700, color:'var(--ink-2)' } },
        window.tx({ he:'המשחק הקרוב', en:'Next match' }, lang)),
      homeR.createElement(window.Pill, { tone: predicted ? 'hit' : 'miss' },
        predicted ? window.tx({ he:'✓ הימרת', en:'✓ Predicted' }, lang) : window.tx({ he:'טרם הימרת', en:'Not predicted' }, lang))
    ),
    homeR.createElement('div', { style:{ marginBottom:14 } },
      homeR.createElement(window.VS, { home:nextFixture.home, away:nextFixture.away, lang:lang, big:true })),
    homeR.createElement('div', { style:{
      display:'flex', alignItems:'center', gap:8, padding:'10px 12px', borderRadius:14, marginBottom:12,
      background: cd.urgent ? 'color-mix(in srgb, var(--miss) 12%, white)' : 'var(--surface-2)',
      color: cd.urgent ? 'var(--miss-deep)' : 'var(--ink-2)'
    } },
      homeR.createElement('svg', { width:16, height:16, viewBox:'0 0 24 24' },
        homeR.createElement('circle', { cx:12, cy:13, r:8, fill:'none', stroke:'currentColor', strokeWidth:2 }),
        homeR.createElement('path', { d:'M12 9v4l2.5 2.5', fill:'none', stroke:'currentColor', strokeWidth:2, strokeLinecap:'round' }),
        homeR.createElement('path', { d:'M9 2h6', stroke:'currentColor', strokeWidth:2, strokeLinecap:'round' })
      ),
      homeR.createElement('span', { style:{ fontSize:13, fontWeight:700, flex:1 } },
        window.tx({ he:'נעילת הימורים בעוד', en:'Predictions lock in' }, lang)),
      homeR.createElement('span', { className:'ss-num', style:{ fontSize:15, direction:'ltr' } }, cd.str)
    ),
    homeR.createElement('button', { onClick:function(){ go('predict'); }, style:{
      width:'100%', height:50, borderRadius:16, background:'var(--brand)', color:'#fff', fontSize:15, fontWeight:800
    } }, predicted ? window.tx({ he:'ערוך הימור', en:'Edit prediction' }, lang) : window.tx({ he:'הזן הימור עכשיו', en:'Predict now' }, lang))
  ) : null;

  /* live strip (only when a game is in play) */
  var f1 = liveFixture;
  var liveStrip = f1 ? homeR.createElement('button', { onClick:function(){ go('live'); }, style:{ width:'100%', textAlign: lang==='he'?'right':'left', marginBottom:14 } },
    homeR.createElement('div', { style:{
      position:'relative', overflow:'hidden', borderRadius:20, padding:16,
      background:'linear-gradient(135deg, var(--ink), #232838)', color:'#fff'
    } },
      homeR.createElement('div', { style:{ position:'absolute', top:-40, insetInlineEnd:-30, width:140, height:140, borderRadius:'50%', background:'radial-gradient(circle, color-mix(in srgb, var(--brand) 45%, transparent), transparent 70%)' } }),
      homeR.createElement('div', { style:{ position:'relative' } },
        homeR.createElement('div', { style:{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 } },
          homeR.createElement(window.Pill, { tone:'live', style:{ background:'rgba(255,59,48,.18)', color:'#fff' } },
            homeR.createElement(window.LiveDot, { size:6 }), 'LIVE · ' + f1.minute + "'"),
          homeR.createElement('span', { style:{ fontSize:13, fontWeight:700, opacity:.85 } },
            window.tx({ he:'זירת הלייב →', en:'Live arena →' }, lang))
        ),
        homeR.createElement('div', { style:{ display:'flex', alignItems:'center', justifyContent:'center', gap:14, marginBottom:10 } },
          homeR.createElement('div', { style:{ display:'flex', alignItems:'center', gap:8 } },
            homeR.createElement(window.Flag, { code:f1.home, size:26 }),
            homeR.createElement('span', { style:{ fontWeight:700, fontSize:14 } }, window.tx(window.TEAMS[f1.home].name, lang))),
          homeR.createElement(window.ScoreNum, { size:26, color:'#fff' }, f1.hs),
          homeR.createElement('span', { style:{ opacity:.6, fontWeight:800 } }, ':'),
          homeR.createElement(window.ScoreNum, { size:26, color:'#fff' }, f1.as),
          homeR.createElement('div', { style:{ display:'flex', alignItems:'center', gap:8 } },
            homeR.createElement('span', { style:{ fontWeight:700, fontSize:14 } }, window.tx(window.TEAMS[f1.away].name, lang)),
            homeR.createElement(window.Flag, { code:f1.away, size:26 }))
        ),
        homeR.createElement('div', { style:{ fontSize:12.5, opacity:.85, textAlign:'center' } },
          L ? window.tx({ he:'🔴 משחק חי עכשיו · היכנס לזירת הלייב', en:'🔴 Live now · enter the live arena' }, lang)
            : window.tx({ he:'🎯 יוסי ורוני בבול פגיעה · אתה בכיוון', en:'🎯 Yossi & Roni nailed it · you\'re on track' }, lang))
      )
    )
  ) : null;

  /* mini-table */
  var top3 = sorted.slice(0, 3);
  var miniTable = homeR.createElement(window.Card, null,
    homeR.createElement('div', { style:{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 } },
      homeR.createElement('div', { style:{ fontSize:16, fontWeight:800 } }, window.tx({ he:'הטבלה', en:'The Table' }, lang)),
      homeR.createElement('button', { onClick:function(){ go('league'); }, style:{ fontSize:13, fontWeight:700, color:'var(--brand)' } },
        window.tx({ he:'לכל הטבלה →', en:'Full table →' }, lang))
    ),
    top3.map(function(m, i){ return homeR.createElement(TableRow, { key:m.id, m:m, rank:i+1, lang:lang }); }),
    meRank > 3 ? homeR.createElement('div', { style:{ borderTop:'1.5px dashed var(--line)', margin:'6px 0' } }) : null,
    meRank > 3 ? homeR.createElement(TableRow, { m: sorted[meRank-1], rank:meRank, lang:lang }) : null
  );

  return homeR.createElement('div', { style:{ padding:'8px 18px 110px' } },
    header, carousel, nextMatch, liveStrip, miniTable
  );
}

Object.assign(window, { HomeScreen: HomeScreen, useCountdown: useCountdown, TableRow: TableRow });
