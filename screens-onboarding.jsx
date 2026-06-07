/* screens-onboarding.jsx — Logo + 3-step onboarding flow */

var obR = React;

/* ---------- Logo ---------- */
function Logo(props){
  var size = props.size || 44;
  var radius = props.radius || 14;
  var showText = props.showText !== false;
  var textSize = props.textSize || 20;
  var mark = obR.createElement('div', { style:{
    width:size, height:size, borderRadius:radius,
    background:'linear-gradient(135deg, var(--brand), var(--brand-deep))',
    boxShadow:'0 6px 16px color-mix(in srgb, var(--brand) 40%, transparent)',
    display:'flex', alignItems:'center', justifyContent:'center', flex:'0 0 auto'
  } },
    obR.createElement('svg', { width:size*0.56, height:size*0.56, viewBox:'0 0 24 24' },
      obR.createElement('circle', { cx:12, cy:12, r:9, fill:'none', stroke:'#fff', strokeWidth:2 }),
      obR.createElement('path', { d:'M12 6.2 L13.7 10.2 L18 10.2 L14.5 12.8 L15.9 16.9 L12 14.4 L8.1 16.9 L9.5 12.8 L6 10.2 L10.3 10.2 Z', fill:'#fff' })
    )
  );
  if(!showText) return mark;
  return obR.createElement('div', { style:{ display:'flex', alignItems:'center', gap:10 } },
    mark,
    obR.createElement('div', { className:'ss-num', style:{ fontSize:textSize, fontWeight:800, letterSpacing:0 } },
      'Score', obR.createElement('span', { style:{ color:'var(--brand)' } }, 'Squad')
    )
  );
}

var OB_AVATAR_COLORS = ['#FF7A1A','#2D7FF9','#00B86B','#8B5CF6','#EC4899','#06B6D4','#F59E0B','#EF4444'];
var OB_AVATAR_ICONS  = ['⚽','🥅','🧤','🏆','🔥','⚡','🎯','👟'];

/* primary CTA */
function CTA(props){
  return obR.createElement('button', {
    onClick: props.disabled ? null : props.onClick, disabled: props.disabled,
    style:{
      width:'100%', height:56, borderRadius:18, fontSize:16, fontWeight:800,
      background: props.disabled ? 'var(--line)' : 'linear-gradient(135deg, var(--brand), var(--brand-deep))',
      color: props.disabled ? 'var(--ink-3)' : '#fff',
      boxShadow: props.disabled ? 'none' : '0 8px 20px color-mix(in srgb, var(--brand) 36%, transparent)',
      cursor: props.disabled ? 'not-allowed' : 'pointer', transition:'background .2s'
    }
  }, props.children);
}

/* step dots (2) */
function StepperDots(props){
  return obR.createElement('div', { style:{ display:'flex', gap:6, justifyContent:'center', marginBottom:20 } },
    [0,1].map(function(i){
      var active = i === props.step;
      return obR.createElement('div', { key:i, style:{
        height:6, width: active ? 26 : 6, borderRadius:999,
        background: active ? 'var(--brand)' : 'var(--line)', transition:'width .25s'
      } });
    })
  );
}

function Onboarding(props){
  var lang = props.lang || 'he';
  var stepSt = obR.useState(0); var step = stepSt[0], setStep = stepSt[1];
  var avSt = obR.useState(0); var avatar = avSt[0], setAvatar = avSt[1];
  var nameSt = obR.useState(''); var name = nameSt[0], setName = nameSt[1];
  var modeSt = obR.useState(null); var mode = modeSt[0], setMode = modeSt[1]; // 'create' | 'join'
  var codeSt = obR.useState(''); var code = codeSt[0], setCode = codeSt[1];

  var ta = lang === 'he' ? 'right' : 'left';

  /* ---------- Step 0: Auth ---------- */
  function renderAuth(){
    function socialBtn(label, icon){
      return obR.createElement('button', { onClick:function(){ setStep(1); }, style:{
        width:'100%', height:54, borderRadius:16, border:'1px solid var(--line)', background:'var(--surface)',
        display:'flex', alignItems:'center', justifyContent:'center', gap:10, fontSize:15, fontWeight:700, marginBottom:12
      } }, icon, label);
    }
    var googleIcon = obR.createElement('svg', { width:20, height:20, viewBox:'0 0 24 24' },
      obR.createElement('path', { fill:'#4285F4', d:'M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1Z' }),
      obR.createElement('path', { fill:'#34A853', d:'M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z' }),
      obR.createElement('path', { fill:'#FBBC05', d:'M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84Z' }),
      obR.createElement('path', { fill:'#EA4335', d:'M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84C6.71 7.3 9.14 5.38 12 5.38Z' })
    );
    var appleIcon = obR.createElement('svg', { width:18, height:18, viewBox:'0 0 24 24' },
      obR.createElement('path', { fill:'#000', d:'M16.37 12.7c.02 2.6 2.28 3.46 2.3 3.47-.02.06-.36 1.24-1.19 2.46-.72 1.05-1.46 2.1-2.64 2.12-1.15.02-1.52-.68-2.84-.68-1.31 0-1.72.66-2.81.7-1.13.04-1.99-1.14-2.72-2.19-1.48-2.16-2.62-6.1-1.1-8.76a4.25 4.25 0 0 1 3.58-2.18c1.11-.02 2.16.75 2.84.75.68 0 1.96-.93 3.3-.79.56.02 2.14.23 3.15 1.7-.08.05-1.88 1.1-1.86 3.28M14.2 4.56c.6-.73 1.01-1.74.9-2.76-.87.04-1.92.58-2.55 1.31-.56.65-1.05 1.68-.92 2.67.97.08 1.96-.49 2.57-1.22' })
    );
    var phoneIcon = obR.createElement('svg', { width:18, height:18, viewBox:'0 0 24 24' },
      obR.createElement('path', { fill:'var(--ink)', d:'M6.6 10.8a15.5 15.5 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.24c1.1.37 2.3.57 3.5.57a1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.2.2 2.4.57 3.5a1 1 0 0 1-.25 1l-2.2 2.3Z' })
    );

    return obR.createElement('div', { style:{ flex:1, display:'flex', flexDirection:'column', justifyContent:'center', padding:'0 28px' } },
      obR.createElement('div', { style:{ textAlign:'center', marginBottom:32 } },
        obR.createElement('div', { style:{ position:'relative', display:'inline-block', marginBottom:22 } },
          obR.createElement('div', { style:{ position:'absolute', inset:-30, background:'radial-gradient(circle, color-mix(in srgb, var(--brand) 30%, transparent), transparent 70%)' } }),
          obR.createElement('div', { style:{ position:'relative' } }, obR.createElement(Logo, { size:92, radius:28, showText:false }))
        ),
        obR.createElement('div', { className:'ss-num', style:{ fontSize:34, fontWeight:800, marginBottom:10 } },
          'Score', obR.createElement('span', { style:{ color:'var(--brand)' } }, 'Squad')
        ),
        obR.createElement('div', { style:{ fontSize:15, color:'var(--ink-2)', maxWidth:250, margin:'0 auto', lineHeight:1.5 } },
          window.tx({ he:'נחשו תוצאות. טפסו בטבלה. תעשו צחוק על החברים.', en:'Predict scores. Climb the table. Roast your friends.' }, lang))
      ),
      socialBtn('Google', googleIcon),
      socialBtn('Apple', appleIcon),
      socialBtn(window.tx({ he:'טלפון', en:'Phone' }, lang), phoneIcon),
      obR.createElement('div', { style:{ textAlign:'center', fontSize:12.5, color:'var(--ink-3)', marginTop:18 } },
        window.tx({ he:'ללא כסף אמיתי. רק אגו וכבוד.', en:'No real money. Just ego and honor.' }, lang))
    );
  }

  /* ---------- Step 1: Profile ---------- */
  function renderProfile(){
    return obR.createElement('div', { style:{ flex:1, display:'flex', flexDirection:'column', padding:'0 24px', justifyContent:'center' } },
      obR.createElement(StepperDots, { step:0 }),
      obR.createElement('div', { style:{ textAlign:'center', marginBottom:24 } },
        obR.createElement('div', { style:{ fontSize:24, fontWeight:800, marginBottom:6 } },
          window.tx({ he:'איך נקרא לך?', en:'What should we call you?' }, lang)),
        obR.createElement('div', { style:{ fontSize:14, color:'var(--ink-2)' } },
          window.tx({ he:'השם שיופיע בטבלאות הליגה', en:'The name that shows in the league tables' }, lang))
      ),
      obR.createElement('div', { style:{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:22 } },
        OB_AVATAR_COLORS.map(function(c, i){
          var sel = i === avatar;
          return obR.createElement('button', { key:i, onClick:function(){ setAvatar(i); }, 'aria-label':'avatar '+(i+1), style:{
            aspectRatio:'1', borderRadius:'50%', background:c, fontSize:24,
            display:'flex', alignItems:'center', justifyContent:'center',
            transform: sel ? 'scale(1.04)' : 'none', transition:'transform .15s',
            boxShadow: sel ? '0 0 0 2px var(--surface), 0 0 0 4px '+c : 'inset 0 -2px 5px rgba(0,0,0,.15)'
          } }, OB_AVATAR_ICONS[i]);
        })
      ),
      obR.createElement('input', {
        value:name, onChange:function(e){ setName(e.target.value); },
        placeholder: window.tx({ he:'שם משתמש', en:'Username' }, lang),
        style:{
          width:'100%', height:52, borderRadius:16, border:'1px solid var(--line)', background:'var(--surface)',
          padding:'0 16px', fontSize:15, fontWeight:600, textAlign:ta, marginBottom:18, outline:'none'
        }
      }),
      obR.createElement(CTA, { disabled: !name.trim(), onClick:function(){ setStep(2); } },
        window.tx({ he:'יאללה, ממשיכים', en:"Let's go" }, lang))
    );
  }

  /* ---------- Step 2: Create / Join ---------- */
  function renderLeague(){
    function cardBtn(m, title, sub, iconBox){
      var sel = mode === m;
      return obR.createElement('button', { onClick:function(){ setMode(m); }, style:{
        width:'100%', textAlign: ta, display:'flex', alignItems:'center', gap:14, padding:16, marginBottom:12,
        borderRadius:18, background:'var(--surface)',
        border: sel ? '2px solid var(--brand)' : '1px solid var(--line)',
        boxShadow: sel ? '0 8px 20px color-mix(in srgb, var(--brand) 28%, transparent)' : 'none', transition:'border .15s'
      } },
        iconBox,
        obR.createElement('div', { style:{ flex:1 } },
          obR.createElement('div', { style:{ fontSize:16, fontWeight:800, marginBottom:3 } }, title),
          obR.createElement('div', { style:{ fontSize:13, color:'var(--ink-2)' } }, sub)
        )
      );
    }
    var plusBox = obR.createElement('div', { style:{
      width:46, height:46, borderRadius:14, background:'color-mix(in srgb, var(--brand) 16%, white)',
      color:'var(--brand-deep)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:26, fontWeight:700, flex:'0 0 auto'
    } }, '+');
    var joinBox = obR.createElement('div', { style:{
      width:46, height:46, borderRadius:14, background:'color-mix(in srgb, #2D7FF9 16%, white)',
      color:'#2D7FF9', display:'flex', alignItems:'center', justifyContent:'center', flex:'0 0 auto'
    } },
      obR.createElement('svg', { width:24, height:24, viewBox:'0 0 24 24' },
        obR.createElement('path', { fill:'currentColor', d:'M11 7 9.6 8.4 12.2 11H3v2h9.2l-2.6 2.6L11 17l5-5-5-5Zm8-3H13v2h6v12h-6v2h6a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2Z' })
      )
    );

    return obR.createElement('div', { style:{ flex:1, display:'flex', flexDirection:'column', padding:'0 24px', justifyContent:'center' } },
      obR.createElement(StepperDots, { step:1 }),
      obR.createElement('div', { style:{ textAlign:'center', marginBottom:24 } },
        obR.createElement('div', { style:{ fontSize:24, fontWeight:800, marginBottom:6 } },
          window.tx({ he:'מצטרפים לליגה', en:'Join a league' }, lang)),
        obR.createElement('div', { style:{ fontSize:14, color:'var(--ink-2)' } },
          window.tx({ he:'פתחו ליגה חדשה או הצטרפו עם קוד', en:'Start a new league or join with a code' }, lang))
      ),
      cardBtn('create',
        window.tx({ he:'צור ליגה חדשה', en:'Create new league' }, lang),
        window.tx({ he:'אתה הקומישינר. הזמן את כולם.', en:"You're the commissioner. Invite everyone." }, lang),
        plusBox),
      cardBtn('join',
        window.tx({ he:'הצטרף עם קוד', en:'Join with a code' }, lang),
        window.tx({ he:'קיבלת לינק או קוד מחבר?', en:'Got a link or code from a friend?' }, lang),
        joinBox),
      mode === 'join' ? obR.createElement('input', {
        value:code, onChange:function(e){ setCode(e.target.value.toUpperCase()); }, maxLength:5,
        placeholder: window.tx({ he:'קוד הצטרפות · XF93K', en:'Join code · XF93K' }, lang),
        style:{
          width:'100%', height:52, borderRadius:16, border:'1px solid var(--line)', background:'var(--surface)',
          padding:'0 16px', fontSize:16, fontWeight:700, textAlign:'center', letterSpacing:4, textTransform:'uppercase',
          margin:'2px 0 18px', outline:'none'
        }
      }) : obR.createElement('div', { style:{ height:18 } }),
      obR.createElement(CTA, {
        disabled: !mode || (mode === 'join' && code.trim().length < 4),
        onClick: props.onDone
      }, window.tx({ he:'כניסה ליציע', en:'Enter the stand' }, lang))
    );
  }

  var body = step === 0 ? renderAuth() : step === 1 ? renderProfile() : renderLeague();

  return obR.createElement('div', { style:{ position:'absolute', inset:0, display:'flex', flexDirection:'column', paddingTop:54, paddingBottom:24 } },
    body
  );
}

Object.assign(window, { Onboarding: Onboarding, Logo: Logo });
