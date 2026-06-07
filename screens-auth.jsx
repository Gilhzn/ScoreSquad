/* screens-auth.jsx — real authentication + league gate (live mode only). */

var authR = React;

var AUTH_COLORS = ['#FF7A1A','#2D7FF9','#00B86B','#8B5CF6','#EC4899','#06B6D4','#F59E0B','#EF4444'];
var AUTH_ICONS  = ['⚽','🥅','🧤','🏆','🔥','⚡','🎯','👟'];

function bigCTA(label, onClick, disabled){
  return authR.createElement('button', { onClick: disabled ? null : onClick, disabled: disabled, style:{
    width:'100%', height:54, borderRadius:16, fontSize:16, fontWeight:800,
    background: disabled ? 'var(--line)' : 'linear-gradient(135deg, var(--brand), var(--brand-deep))',
    color: disabled ? 'var(--ink-3)' : '#fff',
    boxShadow: disabled ? 'none' : '0 8px 20px color-mix(in srgb, var(--brand) 36%, transparent)'
  } }, label);
}

/* ---------- LiveAuth ---------- */
function LiveAuth(props){
  var lang = props.lang || 'he';
  var ta = lang === 'he' ? 'right' : 'left';
  var modeSt = authR.useState('signin'); var mode = modeSt[0], setMode = modeSt[1];
  var emailSt = authR.useState(''); var email = emailSt[0], setEmail = emailSt[1];
  var pwSt = authR.useState(''); var pw = pwSt[0], setPw = pwSt[1];
  var nameSt = authR.useState(''); var name = nameSt[0], setName = nameSt[1];
  var avSt = authR.useState(0); var avatar = avSt[0], setAvatar = avSt[1];
  var busySt = authR.useState(false); var busy = busySt[0], setBusy = busySt[1];
  var msgSt = authR.useState(null); var msg = msgSt[0], setMsg = msgSt[1];

  function field(value, onChange, placeholder, type){
    return authR.createElement('input', {
      value:value, onChange:function(e){ onChange(e.target.value); }, placeholder:placeholder, type:type||'text',
      style:{ width:'100%', height:52, borderRadius:16, border:'1px solid var(--line)', background:'var(--surface)',
        padding:'0 16px', fontSize:15, fontWeight:600, textAlign:ta, marginBottom:12, outline:'none' }
    });
  }

  async function submit(){
    setMsg(null); setBusy(true);
    try {
      if(mode === 'magic'){
        await window.DB.signInWithOtp(email);
        setMsg({ ok:true, text: window.tx({ he:'שלחנו לך קישור כניסה למייל ✉️', en:'Magic link sent to your email ✉️' }, lang) });
      } else if(mode === 'signup'){
        var res = await window.DB.signUp(email, pw, name.trim());
        // if email confirmation is off we get a session — set the avatar now
        if(res && res.session){
          try { await window.DB.updateProfile({ display_name:name.trim(),
            avatar_color:AUTH_COLORS[avatar], avatar_icon:AUTH_ICONS[avatar] }); } catch(e){}
        } else {
          setMsg({ ok:true, text: window.tx({ he:'נרשמת! אשר/י את המייל ואז התחבר/י', en:'Registered! Confirm your email, then sign in' }, lang) });
          setMode('signin');
        }
      } else {
        await window.DB.signIn(email, pw);
      }
    } catch(e){
      setMsg({ ok:false, text: (e && e.message) ? e.message : String(e) });
    }
    setBusy(false);
  }

  var canSubmit = !busy && email.indexOf('@') > 0 &&
    (mode === 'magic' || pw.length >= 6) && (mode !== 'signup' || name.trim().length > 0);

  var tabs = authR.createElement('div', { style:{ display:'flex', gap:6, background:'var(--surface-2)', padding:4, borderRadius:12, marginBottom:18 } },
    [['signin',{he:'כניסה',en:'Sign in'}],['signup',{he:'הרשמה',en:'Sign up'}],['magic',{he:'קישור',en:'Magic link'}]].map(function(t){
      var active = mode === t[0];
      return authR.createElement('button', { key:t[0], onClick:function(){ setMode(t[0]); setMsg(null); }, style:{
        flex:1, padding:'8px 0', borderRadius:9, fontSize:13, fontWeight:700,
        background: active ? 'var(--surface)' : 'transparent', color: active ? 'var(--ink)' : 'var(--ink-3)',
        boxShadow: active ? '0 1px 3px rgba(16,24,40,.12)' : 'none'
      } }, window.tx(t[1], lang));
    })
  );

  return authR.createElement('div', { style:{ position:'absolute', inset:0, display:'flex', flexDirection:'column', justifyContent:'center', padding:'0 26px', paddingTop:54 } },
    authR.createElement('div', { style:{ textAlign:'center', marginBottom:24 } },
      authR.createElement('div', { style:{ display:'inline-block', marginBottom:14 } }, authR.createElement(window.Logo, { size:72, radius:22, showText:false })),
      authR.createElement('div', { className:'ss-num', style:{ fontSize:30, fontWeight:800 } },
        'Score', authR.createElement('span', { style:{ color:'var(--brand)' } }, 'Squad'))
    ),
    tabs,
    mode === 'signup' ? field(name, setName, window.tx({ he:'שם תצוגה', en:'Display name' }, lang)) : null,
    field(email, setEmail, window.tx({ he:'אימייל', en:'Email' }, lang), 'email'),
    mode !== 'magic' ? field(pw, setPw, window.tx({ he:'סיסמה (6+ תווים)', en:'Password (6+ chars)' }, lang), 'password') : null,
    mode === 'signup' ? authR.createElement('div', { style:{ display:'grid', gridTemplateColumns:'repeat(8,1fr)', gap:7, marginBottom:14 } },
      AUTH_COLORS.map(function(c, i){
        var sel = i === avatar;
        return authR.createElement('button', { key:i, onClick:function(){ setAvatar(i); }, 'aria-label':'avatar '+(i+1), style:{
          aspectRatio:'1', borderRadius:'50%', background:c, fontSize:15,
          boxShadow: sel ? '0 0 0 2px var(--surface), 0 0 0 4px '+c : 'inset 0 -2px 4px rgba(0,0,0,.15)'
        } }, AUTH_ICONS[i]);
      })
    ) : null,
    msg ? authR.createElement('div', { style:{ fontSize:13, fontWeight:600, marginBottom:12, textAlign:'center',
      color: msg.ok ? 'var(--hit-deep)' : 'var(--miss-deep)' } }, msg.text) : null,
    bigCTA(busy ? '...' : window.tx(mode==='signup'?{he:'יצירת חשבון',en:'Create account'}:mode==='magic'?{he:'שלח קישור',en:'Send link'}:{he:'כניסה',en:'Sign in'}, lang), submit, !canSubmit),
    authR.createElement('div', { style:{ textAlign:'center', fontSize:12.5, color:'var(--ink-3)', marginTop:16 } },
      window.tx({ he:'ללא כסף אמיתי. רק אגו וכבוד.', en:'No real money. Just ego and honor.' }, lang))
  );
}

/* ---------- LiveLeagueGate (shown when the user has no league yet) ---------- */
function LiveLeagueGate(props){
  var lang = props.lang || 'he';
  var ta = lang === 'he' ? 'right' : 'left';
  var modeSt = authR.useState(null); var mode = modeSt[0], setMode = modeSt[1];
  var nameSt = authR.useState(''); var name = nameSt[0], setName = nameSt[1];
  var codeSt = authR.useState(''); var code = codeSt[0], setCode = codeSt[1];
  var busySt = authR.useState(false); var busy = busySt[0], setBusy = busySt[1];
  var errSt = authR.useState(null); var err = errSt[0], setErr = errSt[1];

  async function go(){
    setErr(null); setBusy(true);
    try {
      if(mode === 'create') await props.actions.createLeague(name.trim() || 'My League', '🏆');
      else await props.actions.joinLeague(code.trim());
    } catch(e){ setErr((e && e.message) === 'league_not_found' ? window.tx({he:'קוד לא נמצא',en:'Code not found'}, lang) : (e && e.message) || String(e)); }
    setBusy(false);
  }
  function cardBtn(m, title, sub){
    var sel = mode === m;
    return authR.createElement('button', { onClick:function(){ setMode(m); setErr(null); }, style:{
      width:'100%', textAlign:ta, padding:16, marginBottom:12, borderRadius:18, background:'var(--surface)',
      border: sel ? '2px solid var(--brand)' : '1px solid var(--line)',
      boxShadow: sel ? '0 8px 20px color-mix(in srgb, var(--brand) 28%, transparent)' : 'none'
    } },
      authR.createElement('div', { style:{ fontSize:16, fontWeight:800, marginBottom:3 } }, title),
      authR.createElement('div', { style:{ fontSize:13, color:'var(--ink-2)' } }, sub)
    );
  }

  var canGo = !busy && (mode === 'create' ? true : (mode === 'join' && code.trim().length >= 4));

  return authR.createElement('div', { style:{ position:'absolute', inset:0, display:'flex', flexDirection:'column', justifyContent:'center', padding:'0 24px', paddingTop:54 } },
    authR.createElement('div', { style:{ textAlign:'center', marginBottom:22 } },
      authR.createElement('div', { style:{ fontSize:24, fontWeight:800, marginBottom:6 } }, window.tx({ he:'מצטרפים לליגה', en:'Join a league' }, lang)),
      authR.createElement('div', { style:{ fontSize:14, color:'var(--ink-2)' } }, window.tx({ he:'פתחו ליגה חדשה או הצטרפו עם קוד', en:'Create a new league or join with a code' }, lang))
    ),
    cardBtn('create', window.tx({ he:'צור ליגה חדשה', en:'Create new league' }, lang), window.tx({ he:'אתה הקומישינר. הזמן את כולם.', en:"You're the commissioner." }, lang)),
    cardBtn('join', window.tx({ he:'הצטרף עם קוד', en:'Join with a code' }, lang), window.tx({ he:'קיבלת קוד מחבר?', en:'Got a code from a friend?' }, lang)),
    mode === 'create' ? authR.createElement('input', {
      value:name, onChange:function(e){ setName(e.target.value); }, placeholder: window.tx({ he:'שם הליגה', en:'League name' }, lang),
      style:{ width:'100%', height:52, borderRadius:16, border:'1px solid var(--line)', background:'var(--surface)', padding:'0 16px', fontSize:15, textAlign:ta, marginBottom:14, outline:'none' }
    }) : null,
    mode === 'join' ? authR.createElement('input', {
      value:code, onChange:function(e){ setCode(e.target.value.toUpperCase()); }, maxLength:5, placeholder: window.tx({ he:'קוד הצטרפות · XF93K', en:'Join code · XF93K' }, lang),
      style:{ width:'100%', height:52, borderRadius:16, border:'1px solid var(--line)', background:'var(--surface)', padding:'0 16px', fontSize:16, fontWeight:700, textAlign:'center', letterSpacing:4, marginBottom:14, outline:'none' }
    }) : null,
    err ? authR.createElement('div', { style:{ fontSize:13, fontWeight:600, color:'var(--miss-deep)', textAlign:'center', marginBottom:12 } }, err) : null,
    bigCTA(busy ? '...' : window.tx({ he:'כניסה ליציע', en:'Enter the stand' }, lang), go, !canGo)
  );
}

Object.assign(window, { LiveAuth: LiveAuth, LiveLeagueGate: LiveLeagueGate });
