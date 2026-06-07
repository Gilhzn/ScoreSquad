/* screens-league.jsx — League room (FullTable + Chat) */

var lgR = React;

/* ---------- segmented control ---------- */
function Segmented(props){
  return lgR.createElement('div', { style:{ display:'flex', gap:6, background:'var(--surface-2)', padding:4, borderRadius:14, marginBottom:16 } },
    props.options.map(function(o){
      var active = o.value === props.value;
      return lgR.createElement('button', { key:o.value, onClick:function(){ props.onChange(o.value); }, style:{
        flex:1, padding:'9px 0', borderRadius:11, fontSize:14, fontWeight:700,
        position:'relative', display:'flex', alignItems:'center', justifyContent:'center', gap:6,
        background: active ? 'var(--surface)' : 'transparent',
        color: active ? 'var(--ink)' : 'var(--ink-3)',
        boxShadow: active ? '0 1px 4px rgba(16,24,40,.12)' : 'none', transition:'background .15s'
      } },
        o.label,
        o.dot ? lgR.createElement('span', { style:{ width:7, height:7, borderRadius:'50%', background:'var(--miss)' } }) : null
      );
    })
  );
}

/* ---------- FullTable ---------- */
function FullTable(props){
  var lang = props.lang || 'he';
  var sorted = window.membersSorted();
  var medals = { 1:'🥇', 2:'🥈', 3:'🥉' };
  var header = lgR.createElement('div', { style:{ display:'flex', alignItems:'center', gap:10, padding:'0 14px 8px', fontSize:12, fontWeight:700, color:'var(--ink-3)' } },
    lgR.createElement('div', { style:{ width:22, textAlign:'center' } }, '#'),
    lgR.createElement('div', { style:{ width:36 } }),
    lgR.createElement('div', { style:{ flex:1 } }, window.tx({ he:'שחקן', en:'Player' }, lang)),
    lgR.createElement('div', null, window.tx({ he:'מגמה', en:'Trend' }, lang)),
    lgR.createElement('div', { style:{ minWidth:34, textAlign:'end' } }, window.tx({ he:"נק'", en:'Pts' }, lang))
  );
  var rows = sorted.map(function(m, i){
    var rank = i + 1;
    return lgR.createElement('div', { key:m.id, style:{
      display:'flex', alignItems:'center', gap:10, padding:'10px 12px', borderRadius:14,
      background: m.you ? 'color-mix(in srgb, var(--accent2) 14%, white)' : 'transparent'
    } },
      lgR.createElement('div', { style:{ width:22, display:'flex', justifyContent:'center' } },
        medals[rank] ? lgR.createElement('span', { style:{ fontSize:19 } }, medals[rank])
          : lgR.createElement('span', { style:{ fontSize:14, fontWeight:700, color:'var(--ink-3)' } }, rank)),
      lgR.createElement(window.Avatar, { member:m, size:36, lang:lang }),
      lgR.createElement('div', { style:{ flex:1, fontSize:15, fontWeight:700, minWidth:0 } },
        window.tx(m.name, lang),
        m.you ? lgR.createElement('span', { style:{ color:'var(--accent2)' } }, '  · ' + window.tx({he:'את/ה',en:'You'}, lang)) : null),
      lgR.createElement(window.TrendArrow, { trend:m.trend }),
      lgR.createElement('div', { className:'ss-num', style:{ fontSize:17, minWidth:34, textAlign:'end' } }, m.pts)
    );
  });
  return lgR.createElement('div', null,
    header,
    lgR.createElement(window.Card, { pad:6 }, rows)
  );
}

/* ---------- GifBubble ---------- */
function GifBubble(){
  return lgR.createElement('div', { style:{
    width:150, height:110, borderRadius:14, position:'relative', overflow:'hidden',
    background:'linear-gradient(135deg, #FF7A1A, #EC4899)', display:'flex', alignItems:'center', justifyContent:'center'
  } },
    lgR.createElement('span', { style:{ fontSize:44 } }, '🎉'),
    lgR.createElement('span', { style:{ position:'absolute', bottom:6, insetInlineStart:8, fontSize:10, fontWeight:800, color:'#fff', background:'rgba(0,0,0,.3)', padding:'2px 6px', borderRadius:6 } }, 'GIF')
  );
}

/* ---------- Chat ---------- */
function Chat(props){
  var lang = props.lang || 'he';
  var msgsSt = lgR.useState(window.CHAT.slice());
  var msgs = msgsSt[0], setMsgs = msgsSt[1];
  var inputSt = lgR.useState(''); var input = inputSt[0], setInput = inputSt[1];
  var stickersSt = lgR.useState(false); var showStickers = stickersSt[0], setShowStickers = stickersSt[1];
  var scrollRef = lgR.useRef(null);

  lgR.useEffect(function(){
    if(scrollRef.current){ scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }
  }, [msgs]);

  function send(text){
    if(!text || !text.trim()) return;
    setMsgs(function(prev){ return prev.concat([{ id:'me', type:'msg', mine:true, text:text }]); });
    setInput('');
  }

  function renderMsg(msg, i){
    if(msg.type === 'system'){
      return lgR.createElement('div', { key:i, style:{ display:'flex', justifyContent:'center', margin:'4px 0' } },
        lgR.createElement('div', { style:{
          maxWidth:'85%', textAlign:'center', padding:'10px 14px', borderRadius:14,
          background:'color-mix(in srgb, var(--accent2) 14%, white)'
        } },
          lgR.createElement('div', { style:{ fontSize:11.5, fontWeight:800, color:'var(--accent2-deep)', marginBottom:3 } },
            window.tx({ he:'⚡ אירוע מערכת', en:'⚡ System event' }, lang)),
          lgR.createElement('div', { style:{ fontSize:13, fontWeight:600, color:'var(--ink)' } }, window.tx(msg.text, lang))
        )
      );
    }
    var member = window.memberById(msg.id);
    if(msg.mine){
      return lgR.createElement('div', { key:i, style:{ display:'flex', flexDirection:'row-reverse', marginBottom:10 } },
        lgR.createElement('div', { style:{
          maxWidth:'72%', padding:'9px 13px', borderRadius:'16px 16px 4px 16px',
          background:'var(--brand)', color:'#fff', fontSize:14, fontWeight:600
        } }, window.tx(msg.text, lang))
      );
    }
    var content = msg.type === 'gif'
      ? lgR.createElement(GifBubble, null)
      : lgR.createElement('div', { style:{
          maxWidth:'72%', padding:'9px 13px', borderRadius:'16px 16px 16px 4px',
          background:'var(--surface)', boxShadow:'0 1px 3px rgba(16,24,40,.06)', fontSize:14, fontWeight:600
        } }, window.tx(msg.text, lang));
    return lgR.createElement('div', { key:i, style:{ display:'flex', alignItems:'flex-end', gap:8, marginBottom:10 } },
      lgR.createElement(window.Avatar, { member:member, size:30, lang:lang }),
      lgR.createElement('div', null,
        lgR.createElement('div', { style:{ fontSize:11.5, fontWeight:700, color: member ? member.color : 'var(--ink-3)', marginBottom:3, marginInlineStart:4 } },
          member ? window.tx(member.name, lang) : ''),
        content
      )
    );
  }

  var stickerBar = showStickers ? lgR.createElement('div', { style:{ display:'flex', gap:8, overflowX:'auto', padding:'8px 4px' } },
    window.STICKERS.map(function(s, i){
      return lgR.createElement('button', { key:i, onClick:function(){ send(s); }, style:{
        width:52, height:52, borderRadius:14, flex:'0 0 auto', background:'var(--surface-2)', fontSize:26
      } }, s);
    })
  ) : null;

  var planeIcon = lgR.createElement('svg', { width:20, height:20, viewBox:'0 0 24 24', style:{ transform: lang==='he' ? 'scaleX(-1)' : 'none' } },
    lgR.createElement('path', { fill:'#fff', d:'M3 3 21 12 3 21 3 14 15 12 3 10 Z' })
  );

  return lgR.createElement('div', { style:{ display:'flex', flexDirection:'column', height:'100%' } },
    lgR.createElement('div', { ref:scrollRef, style:{ flex:1, overflowY:'auto', paddingBottom:8 } },
      msgs.map(renderMsg)
    ),
    stickerBar,
    lgR.createElement('div', { style:{ display:'flex', alignItems:'center', gap:8, paddingTop:8 } },
      lgR.createElement('button', { onClick:function(){ setShowStickers(!showStickers); }, 'aria-label':'stickers', style:{
        width:42, height:42, borderRadius:'50%', flex:'0 0 auto', fontSize:20,
        background: showStickers ? 'var(--brand)' : 'var(--surface-2)'
      } }, '😜'),
      lgR.createElement('input', {
        value:input, onChange:function(e){ setInput(e.target.value); },
        onKeyDown:function(e){ if(e.key === 'Enter'){ send(input); } },
        placeholder: window.tx({ he:'תכתוב משהו...', en:'Type something...' }, lang),
        style:{
          flex:1, height:42, borderRadius:999, border:'1px solid var(--line)', background:'var(--surface)',
          padding:'0 16px', fontSize:14, textAlign: lang==='he'?'right':'left', outline:'none'
        }
      }),
      lgR.createElement('button', { onClick:function(){ send(input); }, 'aria-label':'send', style:{
        width:42, height:42, borderRadius:'50%', flex:'0 0 auto', background:'var(--brand)',
        display:'flex', alignItems:'center', justifyContent:'center'
      } }, planeIcon)
    )
  );
}

/* ---------- League screen ---------- */
function LeagueScreen(props){
  var lang = props.lang || 'he';
  var league = props.league;
  var tabSt = lgR.useState('table'); var tab = tabSt[0], setTab = tabSt[1];

  var shareIcon = lgR.createElement('svg', { width:20, height:20, viewBox:'0 0 24 24' },
    lgR.createElement('path', { fill:'var(--ink-2)', d:'M18 16a3 3 0 0 0-2.3 1.1l-6.1-3.1a3 3 0 0 0 0-1.9l6.1-3.1A3 3 0 1 0 15 6c0 .3 0 .6.1.9L9 10a3 3 0 1 0 0 4l6.1 3.1c0 .3-.1.6-.1.9a3 3 0 1 0 3-3Z' })
  );

  var header = lgR.createElement('div', { style:{ display:'flex', alignItems:'center', gap:12, marginBottom:16 } },
    lgR.createElement('div', { style:{
      width:48, height:48, borderRadius:16, background:'var(--surface)', boxShadow:'inset 0 0 0 1px var(--line)',
      display:'flex', alignItems:'center', justifyContent:'center', fontSize:24, flex:'0 0 auto'
    } }, league.emoji),
    lgR.createElement('div', { style:{ flex:1, minWidth:0 } },
      lgR.createElement('div', { style:{ fontSize:23, fontWeight:800 } }, window.tx(league.name, lang)),
      lgR.createElement('div', { style:{ fontSize:13, color:'var(--ink-2)', fontWeight:600 } },
        league.members + ' ' + window.tx({ he:'משתתפים', en:'members' }, lang) + ' · ' + window.tx({ he:'קוד', en:'code' }, lang) + ' ' + league.code)
    ),
    lgR.createElement('button', { 'aria-label':'share', style:{ width:40, height:40, borderRadius:12, background:'var(--surface-2)', display:'flex', alignItems:'center', justifyContent:'center' } }, shareIcon)
  );

  var content = tab === 'table'
    ? lgR.createElement(FullTable, { lang:lang })
    : lgR.createElement('div', { style:{ height:'calc(100vh - 320px)', minHeight:380 } }, lgR.createElement(Chat, { lang:lang }));

  return lgR.createElement('div', { style:{ padding:'8px 18px 110px', display:'flex', flexDirection:'column', height:'100%' } },
    header,
    lgR.createElement(Segmented, {
      value:tab, onChange:setTab,
      options:[
        { value:'table', label: window.tx({ he:'טבלה', en:'Table' }, lang) },
        { value:'chat',  label: window.tx({ he:'טראש-טוק', en:'Trash-talk' }, lang), dot:true }
      ]
    }),
    lgR.createElement('div', { style:{ flex:1, minHeight:0 } }, content)
  );
}

Object.assign(window, { LeagueScreen: LeagueScreen, Segmented: Segmented });
