/* screens-live.jsx — Live arena + Tension Bar (the core screen) */

var lvR = React;

/* ---------- zone logic ---------- */
function sign(n){ return n > 0 ? 1 : n < 0 ? -1 : 0; }
function bucketOf(pred, score){
  if(pred.h === score.h && pred.a === score.a) return 'hit';
  if(sign(pred.h - pred.a) === sign(score.h - score.a)) return 'track';
  return 'miss';
}
var ZONE = {
  miss:  { center:16, tone:'miss',  icon:'💀', label:{he:'הלך ההימור', en:'Bet is gone'} },
  track: { center:50, tone:'close', icon:'📈', label:{he:'בכיוון הנכון', en:'On track'} },
  hit:   { center:84, tone:'hit',   icon:'🎯', label:{he:'בול פגיעה', en:'Exact hit'} },
};
var ZONE_ORDER = ['miss', 'track', 'hit'];

/* ---------- BarAvatar (WAAPI animation — critical) ---------- */
function BarAvatar(props){
  var lang = props.lang || 'he';
  var b = props.b, tx = props.tx, ty = props.ty;
  var elRef = lvR.useRef(null);
  var prev = lvR.useRef({ tx:tx, ty:ty });

  lvR.useLayoutEffect(function(){
    var el = elRef.current;
    if(!el) return;
    var p = prev.current;
    if(p.tx !== tx || p.ty !== ty){
      // Web Animations API: runs on an independent timeline, immune to parent (stage) transform rewrites
      el.animate(
        [
          { transform: 'translate(' + p.tx + 'px,' + p.ty + 'px)' },
          { transform: 'translate(' + tx + 'px,' + ty + 'px)' }
        ],
        { duration:700, easing:'cubic-bezier(.34,1.4,.5,1)', fill:'both' }
      );
      prev.current = { tx:tx, ty:ty };
    }
  }, [tx, ty]);

  var avatarSize = b.you ? 34 : 28;
  return lvR.createElement('div', { ref:elRef, style:{
    position:'absolute', left:0, top:0, transform:'translate(' + tx + 'px,' + ty + 'px)',
    zIndex: b.you ? 3 : 2, display:'flex', flexDirection:'column', alignItems:'center', gap:3
  } },
    lvR.createElement(window.Avatar, { member:b, size:avatarSize, ring: b.you ? 2 : 0, lang:lang }),
    lvR.createElement('div', { style:{
      fontSize:9.5, fontWeight:700, background:'var(--surface)', padding:'1px 5px', borderRadius:5,
      whiteSpace:'nowrap', boxShadow:'0 1px 2px rgba(16,24,40,.12)'
    } }, b.you ? window.tx({he:'את/ה',en:'You'}, lang) : window.tx(b.name, lang))
  );
}

/* ---------- SimBtn ---------- */
function SimBtn(props){
  return lvR.createElement('button', { onClick:props.onClick, style:{
    flex:1, padding:'12px 8px', borderRadius:14, fontSize:13, fontWeight:800,
    color: props.blue ? '#fff' : 'var(--ink)',
    background: props.blue ? '#2D7FF9' : 'var(--surface)',
    boxShadow: props.blue ? '0 4px 12px rgba(45,127,249,.3)' : 'inset 0 0 0 1px var(--line)'
  } }, props.children);
}

/* ---------- Live screen ---------- */
function LiveScreen(props){
  var lang = props.lang || 'he';
  var L = props.data;
  var fixtures = L ? L.fixtures : null;
  // live: prefer an in-play game, else the most recent finished, else the soonest upcoming
  var fx = L
    ? (fixtures.filter(function(f){ return f.status==='live'; })[0]
       || fixtures.filter(function(f){ return f.status==='finished'; }).slice(-1)[0]
       || fixtures.filter(function(f){ return f.status==='locksoon'||f.status==='upcoming'; })[0] || null)
    : window.fixtureById('f1');
  var seed = fx || { hs:0, as:0, minute:0, home:null, away:null };

  var scoreSt = lvR.useState({ h:seed.hs || 0, a:seed.as || 0 }); var score = scoreSt[0], setScore = scoreSt[1];
  var minSt = lvR.useState(seed.minute || 0); var minute = minSt[0], setMinute = minSt[1];
  var flashSt = lvR.useState(null); var flash = flashSt[0], setFlash = flashSt[1];
  var betsSt = lvR.useState(false); var showBets = betsSt[0], setShowBets = betsSt[1];
  var barWSt = lvR.useState(366); var barW = barWSt[0], setBarW = barWSt[1];
  var liveBetsSt = lvR.useState([]); var liveBets = liveBetsSt[0], setLiveBets = liveBetsSt[1];
  var barRef = lvR.useRef(null);
  var f1 = fx; // alias used by the scoreboard below

  // measure bar width
  lvR.useLayoutEffect(function(){
    function measure(){ if(barRef.current){ setBarW(barRef.current.clientWidth); } }
    measure();
    window.addEventListener('resize', measure);
    return function(){ window.removeEventListener('resize', measure); };
  }, []);

  // demo only: minute auto-increment (live minute comes from the server)
  lvR.useEffect(function(){
    if(L) return;
    var id = setInterval(function(){ setMinute(function(m){ return m < 90 ? m + 1 : m; }); }, 4000);
    return function(){ clearInterval(id); };
  }, []);

  // live: keep score/minute in sync with the real fixture (updated via realtime)
  var fxKey = fx ? (fx.id + ':' + fx.hs + ':' + fx.as + ':' + fx.minute) : '';
  lvR.useEffect(function(){
    if(L && fx){ setScore({ h: fx.hs || 0, a: fx.as || 0 }); setMinute(fx.minute || 0); }
  }, [fxKey]);

  // live: fetch the revealed predictions for this fixture (RLS reveals them after lock)
  lvR.useEffect(function(){
    if(!L || !fx){ return; }
    var cancelled = false;
    window.DB.revealedPredictions(fx.id).then(function(rows){
      if(cancelled) return;
      setLiveBets(rows.map(function(r){
        var p = r.profiles || {};
        return { id:r.user_id, h:r.home_pred, a:r.away_pred,
          member:{ id:r.user_id, name:{ he:p.display_name, en:p.display_name },
                   color:p.avatar_color || '#64748B', you:r.user_id === L.myId } };
      }));
    }).catch(function(){});
    return function(){ cancelled = true; };
  }, [L ? (fx ? fx.id : 0) : 0]);

  function fireGoal(side){
    setFlash(side === 'var' ? 'var' : 'goal');
    setTimeout(function(){
      setScore(function(s){
        if(side === 'var'){ return { h: Math.max(0, s.h - 1), a:s.a }; }
        if(side === 'h'){ return { h:s.h + 1, a:s.a }; }
        return { h:s.h, a:s.a + 1 };
      });
    }, 400);
    setTimeout(function(){ setFlash(null); }, 1700);
  }

  // unified prediction source: demo mock vs live revealed bets
  var preds = L
    ? liveBets
    : window.LIVE_PREDS.map(function(p){ return { id:p.id, h:p.h, a:p.a, member:window.memberById(p.id) }; });

  /* avatar positions (posOf) — group of 2 per column inside each zone */
  function buildAvatars(){
    var byZone = { miss:[], track:[], hit:[] };
    preds.forEach(function(p){
      var bucket = bucketOf({ h:p.h, a:p.a }, score);
      var member = p.member;
      if(member){ byZone[bucket].push(member); }
    });
    var out = [];
    ZONE_ORDER.forEach(function(zk){
      var list = byZone[zk];
      var center = ZONE[zk].center;
      list.forEach(function(member, idx){
        var row = Math.floor(idx / 2);
        var loneLast = (idx === list.length - 1) && (idx % 2 === 0);
        var dx = loneLast ? 0 : (idx % 2 === 0 ? -17 : 17);
        var x = (center / 100) * barW + dx;
        var y = 30 + row * 33;
        var tx = x - (member.you ? 17 : 14);
        out.push({ member:member, tx:tx, ty:y });
      });
    });
    return out;
  }
  var avatars = buildAvatars();

  /* scoreboard header */
  var scoreboard = lvR.createElement('div', { style:{
    position:'relative', overflow:'hidden', borderRadius:22, padding:18, marginBottom:14,
    background:'linear-gradient(135deg, var(--ink), #232838)', color:'#fff'
  } },
    lvR.createElement('div', { style:{ position:'absolute', top:-50, insetInlineEnd:-40, width:170, height:170, borderRadius:'50%', background:'radial-gradient(circle, color-mix(in srgb, var(--brand) 45%, transparent), transparent 70%)' } }),
    lvR.createElement('div', { style:{ position:'relative' } },
      lvR.createElement('div', { style:{ display:'flex', justifyContent:'center', marginBottom:12 } },
        lvR.createElement(window.Pill, { tone:'live', style:{ background:'rgba(255,59,48,.2)', color:'#fff' } },
          lvR.createElement(window.LiveDot, { size:6 }), 'LIVE · ' + minute + "'")),
      lvR.createElement('div', { style:{ display:'flex', alignItems:'center', justifyContent:'center', gap:16 } },
        lvR.createElement('div', { style:{ display:'flex', flexDirection:'column', alignItems:'center', gap:6, flex:1 } },
          lvR.createElement(window.Flag, { code:f1.home, size:52 }),
          lvR.createElement('div', { style:{ fontWeight:700, fontSize:14 } }, window.tx(window.TEAMS[f1.home].name, lang))),
        lvR.createElement('div', { style:{ display:'flex', alignItems:'center', gap:10 } },
          lvR.createElement(window.ScoreNum, { size:56, color:'#fff' }, score.h),
          lvR.createElement('span', { style:{ fontSize:34, fontWeight:800, opacity:.5 } }, ':'),
          lvR.createElement(window.ScoreNum, { size:56, color:'#fff' }, score.a)),
        lvR.createElement('div', { style:{ display:'flex', flexDirection:'column', alignItems:'center', gap:6, flex:1 } },
          lvR.createElement(window.Flag, { code:f1.away, size:52 }),
          lvR.createElement('div', { style:{ fontWeight:700, fontSize:14 } }, window.tx(window.TEAMS[f1.away].name, lang)))
      )
    ),
    flash ? lvR.createElement('div', { style:{
      position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:6,
      background: flash === 'goal' ? 'rgba(18,185,129,.95)' : 'rgba(45,127,249,.95)',
      animation:'ssPop .3s ease-out'
    } },
      lvR.createElement('div', { style:{ fontSize:46, animation:'ssShake .5s ease-in-out' } }, flash === 'goal' ? '⚽' : '📺'),
      lvR.createElement('div', { className:'ss-num', style:{ fontSize:30, fontWeight:800, color:'#fff' } }, flash === 'goal' ? 'GOAL!' : 'VAR!')
    ) : null
  );

  /* tension bar */
  var zones = ZONE_ORDER.map(function(zk, i){
    var z = ZONE[zk];
    return lvR.createElement('div', { key:zk, style:{
      flex:1, position:'relative', background:'color-mix(in srgb, var(--' + z.tone + ') 10%, white)',
      borderInlineEnd: i < 2 ? '1.5px dashed color-mix(in srgb, var(--' + z.tone + ') 35%, white)' : 'none'
    } },
      lvR.createElement('div', { style:{
        position:'absolute', top:8, insetInlineStart:0, insetInlineEnd:0, textAlign:'center',
        fontSize:11, fontWeight:800, color:'var(--' + z.tone + '-deep)', display:'flex', alignItems:'center', justifyContent:'center', gap:4
      } }, lvR.createElement('span', null, z.icon), window.tx(z.label, lang))
    );
  });

  var tensionBar = lvR.createElement('div', { ref:barRef, style:{
    position:'relative', height:172, borderRadius:20, overflow:'hidden', direction:'ltr',
    display:'flex', marginBottom:14, boxShadow:'inset 0 0 0 1px var(--line)'
  } },
    zones,
    avatars.map(function(a){
      return lvR.createElement(BarAvatar, { key:a.member.id, b:a.member, tx:a.tx, ty:a.ty, lang:lang });
    })
  );

  /* sim buttons — demo only (live scores come from the server, not simulation) */
  var simButtons = L ? null : lvR.createElement('div', { style:{ display:'flex', gap:8, marginBottom:16 } },
    lvR.createElement(SimBtn, { onClick:function(){ fireGoal('h'); } }, '⚽ ' + window.tx({ he:'גול לבית', en:'Home goal' }, lang)),
    lvR.createElement(SimBtn, { onClick:function(){ fireGoal('a'); } }, '⚽ ' + window.tx({ he:'גול לחוץ', en:'Away goal' }, lang)),
    lvR.createElement(SimBtn, { blue:true, onClick:function(){ fireGoal('var'); } }, '📺 VAR')
  );

  /* "what did they bet?" feed */
  var feedData = preds.filter(function(p){ return p.member; }).map(function(p){
    return { member:p.member, h:p.h, a:p.a, bucket: bucketOf({ h:p.h, a:p.a }, score) };
  });
  var visible = showBets ? feedData : feedData.slice(0, 4);

  var feed = lvR.createElement(window.Card, { pad:14 },
    lvR.createElement('div', { style:{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 } },
      lvR.createElement('div', null,
        lvR.createElement('div', { style:{ fontSize:16, fontWeight:800 } }, window.tx({ he:'מה הם שמו?', en:'What did they bet?' }, lang)),
        lvR.createElement('div', { style:{ fontSize:11.5, color:'var(--ink-3)', fontWeight:700, marginTop:2 } },
          window.tx({ he:'ננעל · נחשף', en:'Locked · revealed' }, lang))
      ),
      lvR.createElement('span', { style:{ fontSize:18, color:'var(--ink-3)' } }, showBets ? '▲' : '▼')
    ),
    visible.map(function(row){
      var z = ZONE[row.bucket];
      return lvR.createElement('div', { key:row.member.id, style:{ display:'flex', alignItems:'center', gap:10, padding:'7px 0' } },
        lvR.createElement(window.Avatar, { member:row.member, size:32, lang:lang }),
        lvR.createElement('div', { style:{ flex:1, fontSize:14, fontWeight:700 } },
          row.member.you ? window.tx({he:'את/ה',en:'You'}, lang) : window.tx(row.member.name, lang)),
        lvR.createElement('div', { className:'ss-num', style:{ fontSize:15, direction:'ltr', minWidth:42, textAlign:'center' } }, row.h + '–' + row.a),
        lvR.createElement(window.Pill, { tone: z.tone }, z.icon)
      );
    }),
    lvR.createElement('button', { onClick:function(){ setShowBets(!showBets); }, style:{
      width:'100%', marginTop:8, padding:'8px 0', borderRadius:12, fontSize:13, fontWeight:700,
      color:'var(--brand)', background:'var(--surface-2)'
    } }, showBets ? window.tx({ he:'הסתר', en:'Hide' }, lang) : window.tx({ he:'הצג את כולם', en:'Show all' }, lang))
  );

  var title = lvR.createElement('div', { style:{ fontSize:25, fontWeight:800, marginBottom:14 } }, window.tx({ he:'זירת הלייב', en:'Live Arena' }, lang));

  if(L && !fx){
    return lvR.createElement('div', { style:{ padding:'8px 18px 110px' } }, title,
      lvR.createElement(window.Card, { style:{ textAlign:'center', padding:'40px 16px', color:'var(--ink-3)', fontWeight:700 } },
        window.tx({ he:'אין משחק חי כרגע. חזרו בזמן משחק! ⚽', en:'No live game right now. Come back at kickoff! ⚽' }, lang))
    );
  }

  return lvR.createElement('div', { style:{ padding:'8px 18px 110px' } },
    title, scoreboard, tensionBar, simButtons, feed
  );
}

Object.assign(window, { LiveScreen: LiveScreen, BarAvatar: BarAvatar, bucketOf: bucketOf, ZONE: ZONE });
