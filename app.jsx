/* app.jsx — App shell: navigation, tab bar, tweaks, render */

var appR = React;

var TWEAK_DEFAULTS = { lang:'he', accent:'#00B86B', font:'Rubik' };
var ACCENTS = {
  '#00B86B':'#04965A', // green
  '#2D7FF9':'#1A5FD0', // blue
  '#FF7A1A':'#E85D00', // orange
  '#8B5CF6':'#6D3FD4', // purple
};

/* ---------- tab bar icons ---------- */
function icon(name, color){
  var common = { width:24, height:24, viewBox:'0 0 24 24', fill:'none', stroke:color, strokeWidth:2, strokeLinecap:'round', strokeLinejoin:'round' };
  if(name === 'home'){
    return appR.createElement('svg', common,
      appR.createElement('path', { d:'M3 10.5 12 3l9 7.5' }),
      appR.createElement('path', { d:'M5 9.5V20h14V9.5' }));
  }
  if(name === 'league'){
    return appR.createElement('svg', common,
      appR.createElement('rect', { x:4, y:4, width:16, height:16, rx:2 }),
      appR.createElement('path', { d:'M4 9h16M9 4v16' }));
  }
  if(name === 'live'){
    return appR.createElement('svg', common,
      appR.createElement('circle', { cx:12, cy:12, r:3 }),
      appR.createElement('path', { d:'M6.3 6.3a8 8 0 0 0 0 11.4M17.7 6.3a8 8 0 0 1 0 11.4M3.5 3.5a12 12 0 0 0 0 17M20.5 3.5a12 12 0 0 1 0 17' }));
  }
  if(name === 'profile'){
    return appR.createElement('svg', common,
      appR.createElement('circle', { cx:12, cy:8, r:4 }),
      appR.createElement('path', { d:'M4 20c0-4 3.6-6 8-6s8 2 8 6' }));
  }
  // predict (FAB) — plus / target
  return appR.createElement('svg', { width:24, height:24, viewBox:'0 0 24 24', fill:'none', stroke:'#fff', strokeWidth:2.4, strokeLinecap:'round' },
    appR.createElement('path', { d:'M12 6v12M6 12h12' }));
}

function TabBar(props){
  var tab = props.tab, setTab = props.setTab, lang = props.lang;
  var items = [
    { key:'home',    label:{he:'בית',en:'Home'} },
    { key:'league',  label:{he:'ליגה',en:'League'} },
    { key:'predict', label:{he:'הימורים',en:'Predict'}, fab:true },
    { key:'live',    label:{he:'לייב',en:'Live'}, dot:true },
    { key:'profile', label:{he:'פרופיל',en:'Profile'} },
  ];

  return appR.createElement('div', { style:{
    position:'absolute', bottom:0, insetInlineStart:0, insetInlineEnd:0, paddingBottom:26, zIndex:40,
    background:'linear-gradient(to top, var(--bg) 55%, transparent)'
  } },
    appR.createElement('div', { style:{
      margin:14, height:64, borderRadius:24, background:'var(--surface)',
      boxShadow:'0 1px 2px rgba(16,24,40,.04), 0 10px 28px rgba(16,24,40,.12)',
      display:'flex', alignItems:'center'
    } },
      items.map(function(it){
        var active = tab === it.key;
        if(it.fab){
          return appR.createElement('button', { key:it.key, onClick:function(){ setTab(it.key); }, 'aria-label': window.tx(it.label, lang), style:{
            flex:1, display:'flex', alignItems:'center', justifyContent:'center'
          } },
            appR.createElement('div', { style:{
              width:46, height:46, borderRadius:16, background:'linear-gradient(135deg, var(--brand), var(--brand-deep))',
              display:'flex', alignItems:'center', justifyContent:'center',
              boxShadow:'0 8px 18px color-mix(in srgb, var(--brand) 40%, transparent)'
            } }, icon('predict'))
          );
        }
        var color = active ? 'var(--brand)' : 'var(--ink-3)';
        return appR.createElement('button', { key:it.key, onClick:function(){ setTab(it.key); }, 'aria-label': window.tx(it.label, lang), style:{
          flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:3
        } },
          appR.createElement('div', { style:{ position:'relative' } },
            icon(it.key, color),
            it.dot ? appR.createElement('span', { style:{
              position:'absolute', top:-2, insetInlineEnd:-3, width:7, height:7, borderRadius:'50%',
              background:'var(--live)', animation:'ssBlink 1s steps(1) infinite'
            } }) : null
          ),
          appR.createElement('span', { style:{ fontSize:10.5, fontWeight:700, color:color } }, window.tx(it.label, lang))
        );
      })
    )
  );
}

/* ---------- Shell (shared chrome: spacer + scroll area + tab bar) ---------- */
function Shell(props){
  // In native (full-screen) mode the OS draws the status bar, so we need only a small spacer.
  var topSpacer = window.SS_NATIVE ? 14 : 58;
  return appR.createElement('div', { style:{ position:'absolute', inset:0, display:'flex', flexDirection:'column' } },
    appR.createElement('div', { style:{ height:topSpacer, flex:'0 0 auto' } }),
    appR.createElement('div', { style:{ flex:1, overflowY:'auto', overflowX:'hidden' } }, props.screen),
    appR.createElement(TabBar, { tab:props.tab, setTab:props.setTab, lang:props.lang })
  );
}

function centered(node){
  return appR.createElement('div', { style:{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', color:'var(--ink-3)', fontWeight:700 } }, node);
}

/* ---------- DemoApp (offline mock data) ---------- */
function DemoApp(props){
  var lang = props.lang;
  var authedSt = appR.useState(false); var authed = authedSt[0], setAuthed = authedSt[1];
  var tabSt = appR.useState('home'); var tab = tabSt[0], setTab = tabSt[1];
  var leagueSt = appR.useState(window.LEAGUES[0]); var league = leagueSt[0], setLeague = leagueSt[1];
  function go(target){ setTab(target); }

  if(!authed) return appR.createElement(window.Onboarding, { lang:lang, onDone:function(){ setAuthed(true); } });

  var screen;
  if(tab === 'home')    screen = appR.createElement(window.HomeScreen, { lang:lang, go:go, league:league, setLeague:setLeague });
  else if(tab === 'league')  screen = appR.createElement(window.LeagueScreen, { lang:lang, league:league });
  else if(tab === 'predict') screen = appR.createElement(window.PredictScreen, { lang:lang });
  else if(tab === 'live')    screen = appR.createElement(window.LiveScreen, { lang:lang });
  else if(tab === 'profile') screen = appR.createElement(window.ProfileScreen, { lang:lang, onLogout:function(){ setAuthed(false); setTab('home'); } });
  return appR.createElement(Shell, { lang:lang, tab:tab, setTab:setTab, screen:screen });
}

/* ---------- LiveApp (real Supabase backend) ---------- */
function LiveApp(props){
  var lang = props.lang;
  var sessionSt = appR.useState(undefined); var session = sessionSt[0], setSession = sessionSt[1]; // undefined=loading
  var tabSt = appR.useState('home'); var tab = tabSt[0], setTab = tabSt[1];
  function go(target){ setTab(target); }

  appR.useEffect(function(){
    window.DB.getSession().then(function(s){ setSession(s || null); });
    var sub = window.DB.onAuthChange(function(s){ setSession(s || null); });
    return function(){ if(sub && sub.data && sub.data.subscription) sub.data.subscription.unsubscribe(); };
  }, []);

  var data = window.useLiveData(session || null);  // hook called unconditionally

  if(session === undefined) return centered('...');
  if(session === null) return appR.createElement(window.LiveAuth, { lang:lang });
  if(data.loading) return centered(window.tx({ he:'טוען נתונים חיים…', en:'Loading live data…' }, lang));
  if(!data.leagues || data.leagues.length === 0)
    return appR.createElement(window.LiveLeagueGate, { lang:lang, actions:data.actions });

  var screen;
  if(tab === 'home')    screen = appR.createElement(window.HomeScreen, { lang:lang, go:go, data:data });
  else if(tab === 'league')  screen = appR.createElement(window.LeagueScreen, { lang:lang, data:data });
  else if(tab === 'predict') screen = appR.createElement(window.PredictScreen, { lang:lang, data:data });
  else if(tab === 'live')    screen = appR.createElement(window.LiveScreen, { lang:lang, data:data });
  else if(tab === 'profile') screen = appR.createElement(window.ProfileScreen, { lang:lang, data:data, onLogout:function(){ window.DB.signOut(); setTab('home'); } });
  return appR.createElement(Shell, { lang:lang, tab:tab, setTab:setTab, screen:screen });
}

/* ---------- App (styling wrapper; picks demo vs live) ---------- */
function App(props){
  var t = props.t;
  var lang = t.lang;
  window.__lang = lang;
  var rootVars = {
    '--brand': t.accent,
    '--brand-deep': ACCENTS[t.accent] || '#04965A',
    fontFamily: t.font + ", system-ui, sans-serif",
  };
  var dir = lang === 'he' ? 'rtl' : 'ltr';
  var inner = window.LIVE
    ? appR.createElement(LiveApp, { lang:lang })
    : appR.createElement(DemoApp, { lang:lang });
  return appR.createElement('div', { dir:dir, style:Object.assign({ position:'absolute', inset:0 }, rootVars) }, inner);
}

/* ---------- Root (wires tweaks + frame) ---------- */
function Root(){
  var tw = window.useTweaks(TWEAK_DEFAULTS);
  var t = tw[0], setTweak = tw[1];
  var showSt = appR.useState(false); var show = showSt[0], setShow = showSt[1];
  window.__lang = t.lang;

  // gear toggle (stands in for the host environment's Tweaks bar)
  var gearPos = window.SS_NATIVE
    ? { position:'fixed', top:'calc(env(safe-area-inset-top, 0px) + 10px)', insetInlineEnd:12 }
    : { position:'absolute', top:14, insetInlineEnd:-2 };
  var gear = appR.createElement('button', { onClick:function(){ setShow(!show); }, 'aria-label':'Tweaks', style:Object.assign({
    zIndex:200, width:34, height:34, borderRadius:'50%', background:'rgba(255,255,255,.92)',
    boxShadow:'0 4px 12px rgba(16,24,40,.2)', display:'flex', alignItems:'center', justifyContent:'center'
  }, gearPos) },
    appR.createElement('svg', { width:19, height:19, viewBox:'0 0 24 24', fill:'none', stroke:'#15171C', strokeWidth:2 },
      appR.createElement('circle', { cx:12, cy:12, r:3 }),
      appR.createElement('path', { d:'M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5V21a2 2 0 0 1-4 0v-.1a1.6 1.6 0 0 0-1-1.5 1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1H3a2 2 0 0 1 0-4h.1a1.6 1.6 0 0 0 1.5-1 1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H9a1.6 1.6 0 0 0 1-1.5V3a2 2 0 0 1 4 0v.1a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V9a1.6 1.6 0 0 0 1.5 1H21a2 2 0 0 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1Z' })
    )
  );

  var dir = t.lang === 'he' ? 'rtl' : 'ltr';
  var tweaksOverlay = show ? appR.createElement('div', { dir:dir, onClick:function(){ setShow(false); }, style:{
    position:'absolute', inset:0, zIndex:150, background:'rgba(8,10,16,.45)', backdropFilter:'blur(3px)',
    display:'flex', alignItems:'center', justifyContent:'center', fontFamily: t.font + ', system-ui, sans-serif'
  } },
    appR.createElement('div', { onClick:function(e){ e.stopPropagation(); }, style:{
      width:300, background:'var(--surface)', borderRadius:22, boxShadow:'0 20px 50px rgba(16,24,40,.3)'
    } }, appR.createElement(window.TweaksPanel, { t:t, setTweak:setTweak }))
  ) : null;

  return appR.createElement('div', { style:{ position:'relative' } },
    appR.createElement(window.IOSDevice, null,
      appR.createElement(App, { t:t, setTweak:setTweak }),
      tweaksOverlay
    ),
    gear
  );
}

/* ---------- render ---------- */
var rootEl = document.getElementById('root');
ReactDOM.createRoot(rootEl).render(appR.createElement(Root));

Object.assign(window, { App: App, Root: Root, TabBar: TabBar, ACCENTS: ACCENTS, TWEAK_DEFAULTS: TWEAK_DEFAULTS });
