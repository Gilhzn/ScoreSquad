/* screens-predict.jsx — Prediction center (MatchPredictions + PodiumPredictions) */

var prR = React;

/* ---------- ScoringLegend ---------- */
function ScoringLegend(props){
  var lang = props.lang || 'he';
  return prR.createElement('div', { style:{ display:'flex', gap:8, marginBottom:16 } },
    window.SCORING.map(function(rule, i){
      return prR.createElement('div', { key:i, style:{
        flex:1, borderRadius:14, padding:'10px 8px', textAlign:'center',
        background:'color-mix(in srgb, var(--' + rule.tone + ') 12%, white)'
      } },
        prR.createElement('div', { className:'ss-num', style:{ fontSize:22, color:'var(--' + rule.tone + '-deep)', marginBottom:2 } }, rule.pts),
        prR.createElement('div', { style:{ fontSize:11.5, fontWeight:800 } }, window.tx(rule.label, lang)),
        prR.createElement('div', { style:{ fontSize:10, color:'var(--ink-3)', marginTop:1 } }, window.tx(rule.sub, lang))
      );
    })
  );
}

/* ---------- LockTimer ---------- */
function LockTimer(props){
  var lang = props.lang || 'he';
  var cd = window.useCountdown(props.ms);
  function pad(n){ return (n<10?'0':'') + n; }
  var mm = pad(cd.h * 60 + cd.m), ss = pad(cd.s);
  return prR.createElement(window.Pill, { tone:'miss' },
    prR.createElement('svg', { width:13, height:13, viewBox:'0 0 24 24' },
      prR.createElement('circle', { cx:12, cy:13, r:8, fill:'none', stroke:'currentColor', strokeWidth:2 }),
      prR.createElement('path', { d:'M12 9v4l2.5 2.5', fill:'none', stroke:'currentColor', strokeWidth:2, strokeLinecap:'round' })
    ),
    prR.createElement('span', { className:'ss-num', style:{ direction:'ltr', fontSize:12.5 } }, mm + ':' + ss),
    window.tx({ he:'לנעילה', en:'to lock' }, lang)
  );
}

/* ---------- MatchPredictions ---------- */
function MatchPredictions(props){
  var lang = props.lang || 'he';
  var L = props.data;
  var allFixtures = L ? L.fixtures : window.FIXTURES;
  var games = allFixtures.filter(function(f){ return f.status !== 'live' && f.status !== 'finished'; });

  var initial = {};
  games.forEach(function(f){
    initial[f.id] = f.myPred ? { h:f.myPred.h, a:f.myPred.a, set:true } : { h:0, a:0, set:false };
  });
  var predsSt = prR.useState(initial); var preds = predsSt[0], setPreds = predsSt[1];

  function update(id, side, val){
    var nextVals;
    setPreds(function(prev){
      var next = Object.assign({}, prev);
      next[id] = Object.assign({}, prev[id], { set:true });
      next[id][side] = val;
      nextVals = next[id];
      return next;
    });
    // persist to the backend in live mode (RLS rejects writes after lock)
    if(L && nextVals){
      L.actions.upsertPrediction(id, nextVals.h, nextVals.a).catch(function(e){
        console.warn('[ScoreSquad] save prediction failed', e);
      });
    }
  }

  return prR.createElement('div', null,
    prR.createElement(ScoringLegend, { lang:lang }),
    games.map(function(f){
      var p = preds[f.id];
      var statusPill;
      if(f.status === 'locksoon'){
        statusPill = prR.createElement(LockTimer, { ms:f.lockMs, lang:lang });
      } else if(p.set){
        statusPill = prR.createElement(window.Pill, { tone:'hit' }, window.tx({ he:'✓ נשמר', en:'✓ Saved' }, lang));
      } else {
        statusPill = prR.createElement(window.Pill, { tone:'neutral' }, window.tx({ he:'פתוח', en:'Open' }, lang));
      }
      function teamSide(code){
        return prR.createElement('div', { style:{ display:'flex', flexDirection:'column', alignItems:'center', gap:5, width:62 } },
          prR.createElement(window.Flag, { code:code, size:30 }),
          prR.createElement('div', { style:{ fontSize:12, fontWeight:700, whiteSpace:'nowrap' } }, window.tx(window.TEAMS[code].name, lang))
        );
      }
      return prR.createElement(window.Card, { key:f.id, style:{ marginBottom:12 } },
        prR.createElement('div', { style:{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 } },
          prR.createElement('div', { style:{ fontSize:12.5, fontWeight:700, color:'var(--ink-3)' } },
            window.tx({ he:'מחזור', en:'Round' }, lang) + ' ' + f.round + ' · ' + window.tx(f.kickoff, lang)),
          statusPill
        ),
        prR.createElement('div', { style:{ display:'flex', alignItems:'center', justifyContent:'center', gap:10 } },
          teamSide(f.home),
          prR.createElement(window.Stepper, { value:p.h, onChange:function(v){ update(f.id, 'h', v); } }),
          prR.createElement('span', { style:{ fontWeight:800, fontSize:20, color:'var(--ink-3)' } }, ':'),
          prR.createElement(window.Stepper, { value:p.a, onChange:function(v){ update(f.id, 'a', v); } }),
          teamSide(f.away)
        )
      );
    })
  );
}

/* ---------- PickerSheet ---------- */
function PickerSheet(props){
  var lang = props.lang || 'he';
  var items;
  if(props.kind === 'scorer'){
    items = Object.keys(window.PLAYERS).map(function(pid){
      var pl = window.PLAYERS[pid];
      return prR.createElement('button', { key:pid, onClick:function(){ props.onPick(pid); }, style:rowStyle() },
        prR.createElement(window.Flag, { code:pl.team, size:26 }),
        prR.createElement('div', { style:{ flex:1, textAlign: lang==='he'?'right':'left' } },
          prR.createElement('div', { style:{ fontSize:15, fontWeight:700 } }, window.tx(pl.name, lang)),
          prR.createElement('div', { style:{ fontSize:12, color:'var(--ink-3)' } }, window.tx(window.TEAMS[pl.team].name, lang))
        )
      );
    });
  } else {
    items = Object.keys(window.TEAMS).map(function(code){
      return prR.createElement('button', { key:code, onClick:function(){ props.onPick(code); }, style:rowStyle() },
        prR.createElement(window.Flag, { code:code, size:26 }),
        prR.createElement('div', { style:{ flex:1, fontSize:15, fontWeight:700, textAlign: lang==='he'?'right':'left' } }, window.tx(window.TEAMS[code].name, lang))
      );
    });
  }
  function rowStyle(){
    return { display:'flex', alignItems:'center', gap:12, padding:'12px 6px', width:'100%', borderBottom:'1px solid var(--line)' };
  }
  return prR.createElement('div', { onClick:props.onClose, style:{
    position:'absolute', inset:0, zIndex:100, background:'rgba(8,10,16,.45)', backdropFilter:'blur(3px)',
    display:'flex', alignItems:'flex-end'
  } },
    prR.createElement('div', { onClick:function(e){ e.stopPropagation(); }, style:{
      width:'100%', maxHeight:'72%', background:'var(--surface)', borderRadius:'28px 28px 0 0',
      padding:'10px 18px 24px', overflowY:'auto'
    } },
      prR.createElement('div', { style:{ width:40, height:5, borderRadius:3, background:'var(--line)', margin:'0 auto 14px' } }),
      prR.createElement('div', { style:{ fontSize:17, fontWeight:800, marginBottom:8 } }, props.title),
      items
    )
  );
}

/* ---------- PodiumPredictions ---------- */
function PodiumPredictions(props){
  var lang = props.lang || 'he';
  var pickSt = prR.useState({ 1:'ARG', 2:'FRA', 3:null, scorer:'p2' });
  var picks = pickSt[0], setPicks = pickSt[1];
  var sheetSt = prR.useState(null); var sheet = sheetSt[0], setSheet = sheetSt[1]; // {key,kind,title}

  var rows = [
    { key:1, kind:'team', medal:'🥇', label:{he:'האלופה',en:'Champion'}, pts:window.PODIUM_PTS.champion },
    { key:2, kind:'team', medal:'🥈', label:{he:'הסגנית',en:'Runner-up'}, pts:window.PODIUM_PTS.runnerup },
    { key:3, kind:'team', medal:'🥉', label:{he:'מקום שלישי',en:'Third place'}, pts:window.PODIUM_PTS.third },
    { key:'scorer', kind:'scorer', medal:'👟', label:{he:'מלך השערים',en:'Top scorer'}, pts:window.PODIUM_PTS.scorer },
  ];

  function currentDisplay(row){
    var val = picks[row.key];
    if(!val) return prR.createElement('span', { style:{ color:'var(--brand)', fontWeight:700, fontSize:14 } }, window.tx({ he:'בחר →', en:'Pick →' }, lang));
    if(row.kind === 'scorer'){
      var pl = window.PLAYERS[val];
      return prR.createElement('div', { style:{ display:'flex', alignItems:'center', gap:7 } },
        prR.createElement(window.Flag, { code:pl.team, size:22 }),
        prR.createElement('span', { style:{ fontSize:14, fontWeight:700 } }, window.tx(pl.name, lang)));
    }
    return prR.createElement('div', { style:{ display:'flex', alignItems:'center', gap:7 } },
      prR.createElement(window.Flag, { code:val, size:22 }),
      prR.createElement('span', { style:{ fontSize:14, fontWeight:700 } }, window.tx(window.TEAMS[val].name, lang)));
  }

  return prR.createElement('div', null,
    prR.createElement('div', { style:{
      borderRadius:18, padding:16, marginBottom:16,
      background:'color-mix(in srgb, var(--gold) 20%, white)'
    } },
      prR.createElement('div', { style:{ fontSize:15, fontWeight:800, marginBottom:4 } },
        '🔒 ' + window.tx({ he:'נעילה שעה לפני המשחק הראשון', en:'Locks one hour before the first match' }, lang)),
      prR.createElement('div', { style:{ fontSize:13, color:'var(--gold-deep)', fontWeight:700 } },
        window.tx({ he:'עד 90 נקודות בהימורים ארוכי-טווח', en:'Up to 90 points in long-term bets' }, lang))
    ),
    rows.map(function(row){
      return prR.createElement(window.Card, { key:row.key, style:{ marginBottom:10 }, pad:14,
        onClick:function(){ setSheet({ key:row.key, kind:row.kind, title: window.tx(row.label, lang) }); } },
        prR.createElement('div', { style:{ display:'flex', alignItems:'center', gap:12 } },
          prR.createElement('span', { style:{ fontSize:26 } }, row.medal),
          prR.createElement('div', { style:{ flex:1 } },
            prR.createElement('div', { style:{ fontSize:15, fontWeight:800 } }, window.tx(row.label, lang)),
            prR.createElement('div', { style:{ fontSize:12.5, fontWeight:700, color:'var(--gold-deep)' } }, '+' + row.pts)),
          currentDisplay(row)
        )
      );
    }),
    sheet ? prR.createElement(PickerSheet, {
      lang:lang, kind:sheet.kind, title:sheet.title,
      onClose:function(){ setSheet(null); },
      onPick:function(val){
        setPicks(function(prev){ var n = Object.assign({}, prev); n[sheet.key] = val; return n; });
        setSheet(null);
      }
    }) : null
  );
}

/* ---------- Predict screen ---------- */
function PredictScreen(props){
  var lang = props.lang || 'he';
  var tabSt = prR.useState('matches'); var tab = tabSt[0], setTab = tabSt[1];
  return prR.createElement('div', { style:{ padding:'8px 18px 110px' } },
    prR.createElement('div', { style:{ fontSize:25, fontWeight:800, marginBottom:14 } },
      window.tx({ he:'מרכז ההימורים', en:'Prediction Center' }, lang)),
    prR.createElement(window.Segmented, {
      value:tab, onChange:setTab,
      options:[
        { value:'matches', label: window.tx({ he:'משחקים', en:'Matches' }, lang) },
        { value:'podium',  label: window.tx({ he:'פודיום הטורניר', en:'Tournament podium' }, lang) }
      ]
    }),
    tab === 'matches' ? prR.createElement(MatchPredictions, { lang:lang, data:props.data }) : prR.createElement(PodiumPredictions, { lang:lang, data:props.data })
  );
}

Object.assign(window, {
  PredictScreen: PredictScreen, ScoringLegend: ScoringLegend, LockTimer: LockTimer,
  MatchPredictions: MatchPredictions, PodiumPredictions: PodiumPredictions, PickerSheet: PickerSheet
});
