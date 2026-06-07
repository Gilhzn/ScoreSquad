/* screens-profile.jsx — Profile + gamification (PerfGraph, badges wall) */

var pfR = React;

/* ---------- PerfGraph ---------- */
function PerfGraph(props){
  var lang = props.lang || 'he';
  var data = window.PERF;
  var W = 320, H = 110, padX = 6, padY = 14;
  var n = data.length;
  var maxRank = 8; // 1 (best) .. 8 (worst)
  // invert: low rank value (good) => high on graph
  function px(i){ return padX + (i / (n - 1)) * (W - padX * 2); }
  function py(v){ return padY + ((v - 1) / (maxRank - 1)) * (H - padY * 2); }

  var linePts = data.map(function(v, i){ return px(i) + ',' + py(v); }).join(' ');
  var areaPts = 'M ' + px(0) + ',' + py(data[0]) + ' '
    + data.map(function(v, i){ return 'L ' + px(i) + ',' + py(v); }).join(' ')
    + ' L ' + px(n - 1) + ',' + H + ' L ' + px(0) + ',' + H + ' Z';

  return pfR.createElement(window.Card, { style:{ marginBottom:16 } },
    pfR.createElement('div', { style:{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 } },
      pfR.createElement('div', { style:{ fontSize:16, fontWeight:800 } }, window.tx({ he:'מסלול בטבלה', en:'Table journey' }, lang)),
      pfR.createElement(window.Pill, { tone:'hit' }, window.tx({ he:'↑ עלית 3 מקומות', en:'↑ Up 3 spots' }, lang))
    ),
    pfR.createElement('svg', { viewBox:'0 0 ' + W + ' ' + H, style:{ width:'100%', direction:'ltr', overflow:'visible' } },
      pfR.createElement('defs', null,
        pfR.createElement('linearGradient', { id:'perfFill', x1:'0', y1:'0', x2:'0', y2:'1' },
          pfR.createElement('stop', { offset:'0', stopColor:'var(--brand)', stopOpacity:0.22 }),
          pfR.createElement('stop', { offset:'1', stopColor:'var(--brand)', stopOpacity:0 })
        )
      ),
      pfR.createElement('path', { d:areaPts, fill:'url(#perfFill)' }),
      pfR.createElement('polyline', { points:linePts, fill:'none', stroke:'var(--brand)', strokeWidth:2.5, strokeLinejoin:'round', strokeLinecap:'round' }),
      data.map(function(v, i){
        var last = i === n - 1;
        return pfR.createElement('circle', { key:i, cx:px(i), cy:py(v), r: last ? 5 : 3,
          fill: last ? 'var(--brand)' : 'var(--surface)', stroke:'var(--brand)', strokeWidth:2 });
      })
    )
  );
}

/* ---------- Profile screen ---------- */
function ProfileScreen(props){
  var lang = props.lang || 'he';
  var L = props.data;
  var sorted = L ? L.members : window.membersSorted();
  var meLive = L ? (sorted.filter(function(m){ return m.you; })[0] || null) : null;
  var me = L
    ? { name:{ he:(L.profile&&L.profile.display_name)||'You', en:(L.profile&&L.profile.display_name)||'You' },
        color:(L.profile&&L.profile.avatar_color)||'#FF7A1A',
        pts: meLive ? meLive.pts : 0, exact_hits: meLive ? meLive.exact_hits : 0 }
    : window.memberById('me');
  var meRank = sorted.findIndex(function(m){ return m.you; }) + 1;
  if(meRank === 0) meRank = sorted.length || 1;

  /* hero */
  var hero = pfR.createElement('div', { style:{ textAlign:'center', marginBottom:22 } },
    pfR.createElement('div', { style:{ position:'relative', display:'inline-block', marginBottom:12 } },
      pfR.createElement('div', { style:{
        width:84, height:84, borderRadius:'50%', background:me.color,
        display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontSize:38, fontWeight:700,
        boxShadow:'inset 0 -3px 6px rgba(0,0,0,.15)'
      } }, '★'),
      pfR.createElement('div', { style:{
        position:'absolute', bottom:-2, insetInlineEnd:-2, width:32, height:32, borderRadius:'50%',
        background:'color-mix(in srgb, var(--gold) 40%, white)', display:'flex', alignItems:'center', justifyContent:'center',
        fontSize:18, boxShadow:'0 0 0 3px var(--bg)'
      } }, '🏆')
    ),
    pfR.createElement('div', { style:{ fontSize:24, fontWeight:800, marginBottom:8 } }, window.tx(me.name, lang)),
    pfR.createElement('div', { style:{ display:'flex', justifyContent:'center' } },
      pfR.createElement(window.Pill, { tone:'brand' }, window.tx({ he:'נביא מתחיל · רמה 4', en:'Rookie prophet · Lvl 4' }, lang)))
  );

  /* stats grid */
  var stats = [
    { label:{he:'נקודות',en:'Points'}, value: me.pts },
    { label:{he:'דירוג',en:'Rank'}, value: '#' + meRank },
    { label:{he:'תארים',en:'Titles'}, value: L ? (window.BADGES.filter(function(b){return b.earned;}).length) : 3 },
    { label:{he:'בולים',en:'Hits'}, value: L ? (me.exact_hits || 0) : 7 },
  ];
  var statsGrid = pfR.createElement('div', { style:{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8, marginBottom:16 } },
    stats.map(function(s, i){
      return pfR.createElement(window.Card, { key:i, pad:10, style:{ textAlign:'center' } },
        pfR.createElement('div', { className:'ss-num', style:{ fontSize:22, fontWeight:800 } }, s.value),
        pfR.createElement('div', { style:{ fontSize:11, color:'var(--ink-3)', fontWeight:700, marginTop:2 } }, window.tx(s.label, lang))
      );
    })
  );

  /* badges wall */
  var earnedCount = window.BADGES.filter(function(b){ return b.earned; }).length;
  var badgesWall = pfR.createElement('div', { style:{ marginBottom:16 } },
    pfR.createElement('div', { style:{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 } },
      pfR.createElement('div', { style:{ fontSize:18, fontWeight:800 } }, window.tx({ he:'קיר התארים', en:'Wall of titles' }, lang)),
      pfR.createElement('div', { style:{ fontSize:14, fontWeight:700, color:'var(--ink-3)' } }, earnedCount + '/6')
    ),
    pfR.createElement('div', { style:{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10 } },
      window.BADGES.map(function(b){
        return pfR.createElement('div', { key:b.id, style:{
          position:'relative', borderRadius:18, padding:'14px 8px', textAlign:'center', background:'var(--surface)',
          opacity: b.earned ? 1 : 0.55,
          border: b.earned ? '1.5px solid ' + b.tone : '1.5px dashed var(--line)',
          boxShadow: b.earned ? '0 1px 2px rgba(16,24,40,.04), 0 6px 18px rgba(16,24,40,.05)' : 'none'
        } },
          pfR.createElement('div', { style:{ fontSize:34, marginBottom:6, filter: b.earned ? 'none' : 'grayscale(1)' } }, b.icon),
          pfR.createElement('div', { style:{ fontSize:13, fontWeight:800, marginBottom:3 } }, window.tx(b.name, lang)),
          pfR.createElement('div', { style:{ fontSize:10.5, color:'var(--ink-3)', lineHeight:1.3 } }, window.tx(b.desc, lang)),
          b.earned ? null : pfR.createElement('div', { style:{ position:'absolute', top:8, insetInlineEnd:8, fontSize:14 } }, '🔒')
        );
      })
    )
  );

  /* logout */
  var logoutBtn = pfR.createElement('button', { onClick:props.onLogout, style:{
    width:'100%', height:50, borderRadius:16, border:'1px solid var(--line)', background:'var(--surface)',
    color:'var(--miss-deep)', fontSize:15, fontWeight:800
  } }, window.tx({ he:'התנתקות', en:'Log out' }, lang));

  return pfR.createElement('div', { style:{ padding:'8px 18px 110px' } },
    hero, statsGrid, pfR.createElement(PerfGraph, { lang:lang }), badgesWall, logoutBtn
  );
}

Object.assign(window, { ProfileScreen: ProfileScreen, PerfGraph: PerfGraph });
