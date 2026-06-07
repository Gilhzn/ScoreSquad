/* ui.jsx — shared atom components (Flag, Avatar, TrendArrow, ScoreNum, Stepper, Pill, Card, LiveDot, VS) */

var uiR = React;

/* ---------- Flag (CSS-drawn for demo teams; logo image for live teams) ---------- */
function Flag(props){
  var size = props.size || 28;
  var round = props.round != null ? props.round : 7;
  var team = window.TEAMS[props.code];

  // Live teams carry a logo_url instead of a CSS flag config — render the crest.
  if(team && team.logo_url && !team.flag){
    return uiR.createElement('div', { style:{
      width:size, height:size, borderRadius:'50%', overflow:'hidden', flex:'0 0 auto',
      background:'#fff', boxShadow:'inset 0 0 0 1px rgba(0,0,0,0.08)',
      display:'flex', alignItems:'center', justifyContent:'center'
    } },
      uiR.createElement('img', { src:team.logo_url, alt:'', width:size, height:size,
        style:{ width:'100%', height:'100%', objectFit:'contain' } })
    );
  }

  var flag = team ? team.flag : { dir:'h', bands:['#ccc'] };
  var h = size * 0.72;

  var bands = flag.bands.map(function(c, i){
    return uiR.createElement('div', { key:i, style:{ flex:1, background:c } });
  });

  var extra = null;
  var ex = flag.extra;
  if(ex === 'sun'){
    var sun = h * 0.34;
    extra = uiR.createElement('div', { style:{
      width:sun, height:sun, borderRadius:'50%', background:'#F6B40E',
      boxShadow:'0 0 0 2px #C77B0E'
    } });
  } else if(ex === 'circle'){
    var circ = h * 0.42;
    extra = uiR.createElement('div', { style:{ width:circ, height:circ, borderRadius:'50%', background:'#BC002D' } });
  } else if(ex === 'diamond'){
    var dia = h * 0.62;
    extra = uiR.createElement('div', { style:{
      width:dia, height:dia, background:'#FFDF00', transform:'rotate(45deg)',
      display:'flex', alignItems:'center', justifyContent:'center'
    } },
      uiR.createElement('div', { style:{ width:dia*0.42, height:dia*0.42, borderRadius:'50%', background:'#002776', transform:'rotate(-45deg)' } })
    );
  } else if(ex === 'cross'){
    extra = uiR.createElement('div', { style:{ position:'absolute', inset:0 } },
      uiR.createElement('div', { style:{ position:'absolute', left:'42%', top:0, bottom:0, width:'16%', background:'#CE1124' } }),
      uiR.createElement('div', { style:{ position:'absolute', top:'38%', left:0, right:0, height:'24%', background:'#CE1124' } })
    );
  } else if(ex === 'star'){
    var starColor = props.code === 'MAR' ? '#006233' : '#0C8043';
    extra = uiR.createElement('div', { style:{ color:starColor, fontSize:h*0.5, lineHeight:1 } }, '★');
  } else if(ex === 'canton'){
    extra = uiR.createElement('div', { style:{ position:'absolute', insetInlineStart:0, top:0, width:'42%', height:'54%', background:'#3C3B6E' } });
  }

  return uiR.createElement('div', { style:{
    width:size, height:h, borderRadius:round, overflow:'hidden', position:'relative',
    display:'flex', flexDirection: flag.dir === 'h' ? 'column' : 'row',
    boxShadow:'inset 0 0 0 1px rgba(0,0,0,0.08)', flex:'0 0 auto'
  } },
    bands,
    extra ? uiR.createElement('div', { style:{
      position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center'
    } }, extra) : null
  );
}

/* ---------- Avatar ---------- */
function Avatar(props){
  var member = props.member || {};
  var size = props.size || 36;
  var ring = props.ring || 0;
  var lang = props.lang || window.__lang || 'he';
  var content;
  if(member.you){
    content = '★';
  } else {
    var en = (member.name && member.name.en) ? member.name.en : 'X';
    content = en.charAt(0).toUpperCase();
  }
  var shadow = ring
    ? '0 0 0 ' + ring + 'px var(--surface), 0 0 0 ' + (ring+2) + 'px ' + member.color
    : 'inset 0 -2px 4px rgba(0,0,0,.12)';
  return uiR.createElement('div', { style:{
    width:size, height:size, borderRadius:'50%', background:member.color,
    display:'flex', alignItems:'center', justifyContent:'center',
    color:'#fff', fontWeight:700, fontSize:size*0.42, fontFamily:'Rubik',
    boxShadow:shadow, flex:'0 0 auto'
  } }, content);
}

/* ---------- TrendArrow ---------- */
function TrendArrow(props){
  var trend = props.trend || 0;
  if(trend === 0){
    return uiR.createElement('span', { style:{ color:'var(--ink-3)', fontWeight:700, fontSize:14 } }, '–');
  }
  var up = trend > 0;
  var color = up ? 'var(--hit)' : 'var(--miss)';
  var tri = uiR.createElement('svg', { width:9, height:9, viewBox:'0 0 10 10',
    style:{ transform: up ? 'none' : 'rotate(180deg)' } },
    uiR.createElement('path', { d:'M5 1 L9 8 L1 8 Z', fill:color })
  );
  return uiR.createElement('span', { style:{ display:'inline-flex', alignItems:'center', gap:2, color:color, fontWeight:700, fontSize:12.5 } },
    tri, String(Math.abs(trend))
  );
}

/* ---------- ScoreNum ---------- */
function ScoreNum(props){
  var size = props.size || 44;
  return uiR.createElement('span', { className:'ss-num', style:{
    fontSize:size, color: props.color || 'var(--ink)', lineHeight:1, fontFamily:'Rubik'
  } }, props.children);
}

/* ---------- Stepper ---------- */
function Stepper(props){
  var value = props.value || 0;
  var color = props.color;
  function btn(label, onClick){
    return uiR.createElement('button', { onClick:onClick, style:{
      width:34, height:34, borderRadius:11, background:'var(--surface-2)',
      boxShadow:'inset 0 0 0 1px var(--line)', fontSize:20, fontWeight:700,
      color:'var(--ink-2)', display:'flex', alignItems:'center', justifyContent:'center'
    } }, label);
  }
  return uiR.createElement('div', { style:{ display:'flex', alignItems:'center', gap:8 } },
    btn('–', function(){ props.onChange(Math.max(0, value - 1)); }),
    uiR.createElement('div', { style:{ minWidth:24, textAlign:'center' } },
      uiR.createElement(ScoreNum, { size:30, color:color }, value)
    ),
    btn('+', function(){ props.onChange(value + 1); })
  );
}

/* ---------- Pill ---------- */
function Pill(props){
  var tone = props.tone || 'neutral';
  var map = {
    neutral: { bg:'var(--surface-2)', fg:'var(--ink-2)' },
    brand:   { bg:'color-mix(in srgb, var(--brand) 14%, white)', fg:'var(--brand-deep)' },
    live:    { bg:'color-mix(in srgb, var(--live) 14%, white)',  fg:'var(--live)' },
    hit:     { bg:'color-mix(in srgb, var(--hit) 14%, white)',   fg:'var(--hit-deep)' },
    close:   { bg:'color-mix(in srgb, var(--close) 16%, white)', fg:'var(--close-deep)' },
    miss:    { bg:'color-mix(in srgb, var(--miss) 14%, white)',  fg:'var(--miss-deep)' },
    gold:    { bg:'color-mix(in srgb, var(--gold) 22%, white)',  fg:'var(--gold-deep)' },
  };
  var c = map[tone] || map.neutral;
  return uiR.createElement('span', { style:Object.assign({
    display:'inline-flex', alignItems:'center', gap:5, padding:'4px 10px',
    borderRadius:999, fontSize:12.5, fontWeight:700, background:c.bg, color:c.fg, whiteSpace:'nowrap'
  }, props.style || {}) }, props.children);
}

/* ---------- Card ---------- */
function Card(props){
  var pad = props.pad != null ? props.pad : 16;
  return uiR.createElement('div', {
    onClick: props.onClick,
    style: Object.assign({
      background:'var(--surface)', borderRadius:22, padding:pad,
      boxShadow:'0 1px 2px rgba(16,24,40,.04), 0 6px 18px rgba(16,24,40,.05)',
      cursor: props.onClick ? 'pointer' : 'default'
    }, props.style || {})
  }, props.children);
}

/* ---------- LiveDot ---------- */
function LiveDot(props){
  var size = props.size || 7;
  return uiR.createElement('span', { style:Object.assign({
    width:size, height:size, borderRadius:'50%', background:'#fff',
    display:'inline-block', animation:'ssBlink 1s steps(1) infinite'
  }, props.style || {}) });
}

/* ---------- VS ---------- */
function VS(props){
  var lang = props.lang || window.__lang || 'he';
  var big = !!props.big;
  var flagSize = big ? 36 : 28;
  var nameSize = big ? 15 : 13;
  function side(code){
    return uiR.createElement('div', { style:{ display:'flex', flexDirection:'column', alignItems:'center', gap:6, flex:1, minWidth:0 } },
      uiR.createElement(Flag, { code:code, size:flagSize }),
      uiR.createElement('div', { style:{ fontSize:nameSize, fontWeight:700, textAlign:'center', whiteSpace:'nowrap' } },
        window.tx(window.TEAMS[code].name, lang))
    );
  }
  var middle;
  if(props.hs != null){
    middle = uiR.createElement('div', { style:{ display:'flex', alignItems:'center', gap:8 } },
      uiR.createElement(ScoreNum, { size: big ? 40 : 30 }, props.hs),
      uiR.createElement('span', { style:{ color:'var(--ink-3)', fontWeight:800, fontSize: big?28:20 } }, ':'),
      uiR.createElement(ScoreNum, { size: big ? 40 : 30 }, props.as)
    );
  } else {
    middle = uiR.createElement('div', { style:{ color:'var(--ink-3)', fontWeight:800, fontSize: big?20:16 } }, 'VS');
  }
  return uiR.createElement('div', { style:{ display:'flex', alignItems:'center', gap:10 } },
    side(props.home),
    uiR.createElement('div', { style:{ flex:'0 0 auto', minWidth: big?92:64, display:'flex', justifyContent:'center' } }, middle),
    side(props.away)
  );
}

/* ---------- exports ---------- */
Object.assign(window, {
  Flag: Flag, Avatar: Avatar, TrendArrow: TrendArrow, ScoreNum: ScoreNum,
  Stepper: Stepper, Pill: Pill, Card: Card, LiveDot: LiveDot, VS: VS
});
