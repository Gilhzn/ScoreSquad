/* tweaks-panel.jsx — Tweaks panel (language / brand color / font) + useTweaks persist hook */

var tweakR = React;
var TWEAK_KEY = 'scoresquad.tweaks';

/* persist hook: reads/writes localStorage automatically */
function useTweaks(defaults){
  var init = defaults;
  try{
    var raw = window.localStorage.getItem(TWEAK_KEY);
    if(raw){ init = Object.assign({}, defaults, JSON.parse(raw)); }
  }catch(e){}
  var st = tweakR.useState(init);
  var t = st[0], set = st[1];
  function setTweak(patch){
    set(function(prev){
      var next = Object.assign({}, prev, patch);
      try{ window.localStorage.setItem(TWEAK_KEY, JSON.stringify(next)); }catch(e){}
      return next;
    });
  }
  return [t, setTweak];
}

/* ---- shared label ---- */
function fieldLabel(text){
  return tweakR.createElement('div', { style:{ fontSize:12, fontWeight:700, color:'var(--ink-2)', marginBottom:8 } }, text);
}

/* TweakRadio — segmented choice */
function TweakRadio(props){
  return tweakR.createElement('div', { style:{ marginBottom:16 } },
    fieldLabel(props.label),
    tweakR.createElement('div', { style:{ display:'flex', gap:6, background:'var(--surface-2)', padding:4, borderRadius:12 } },
      props.options.map(function(o){
        var active = o.value === props.value;
        return tweakR.createElement('button', { key:o.value, onClick:function(){ props.onChange(o.value); }, style:{
          flex:1, padding:'8px 0', borderRadius:9, fontSize:13, fontWeight:700,
          background: active ? 'var(--surface)' : 'transparent',
          color: active ? 'var(--ink)' : 'var(--ink-3)',
          boxShadow: active ? '0 1px 3px rgba(16,24,40,.12)' : 'none'
        } }, o.label);
      })
    )
  );
}

/* TweakColor — brand color swatches */
function TweakColor(props){
  return tweakR.createElement('div', { style:{ marginBottom:16 } },
    fieldLabel(props.label),
    tweakR.createElement('div', { style:{ display:'flex', gap:12 } },
      props.options.map(function(c){
        var active = c === props.value;
        return tweakR.createElement('button', { key:c, onClick:function(){ props.onChange(c); }, 'aria-label':c, style:{
          width:38, height:38, borderRadius:'50%', background:c,
          boxShadow: active ? '0 0 0 2px var(--surface), 0 0 0 4px '+c : 'inset 0 -2px 4px rgba(0,0,0,.15)',
          transform: active ? 'scale(1.06)' : 'none', transition:'transform .15s'
        } });
      })
    )
  );
}

/* TweakSelect — dropdown */
function TweakSelect(props){
  return tweakR.createElement('div', { style:{ marginBottom:16 } },
    fieldLabel(props.label),
    tweakR.createElement('select', {
      value: props.value, onChange:function(e){ props.onChange(e.target.value); },
      style:{
        width:'100%', padding:'10px 12px', borderRadius:12, border:'1px solid var(--line)',
        background:'var(--surface)', fontSize:14, fontWeight:600, color:'var(--ink)'
      }
    }, props.options.map(function(o){
      return tweakR.createElement('option', { key:o, value:o }, o);
    }))
  );
}

/* TweaksPanel — the full panel body */
function TweaksPanel(props){
  var t = props.t, setTweak = props.setTweak;
  return tweakR.createElement('div', { style:{ padding:16 } },
    tweakR.createElement('div', { style:{ fontSize:16, fontWeight:800, marginBottom:14 } }, 'Tweaks'),
    tweakR.createElement(TweakRadio, {
      label:'שפה / Language', value:t.lang,
      options:[ {value:'he', label:'עברית'}, {value:'en', label:'English'} ],
      onChange:function(v){ setTweak({ lang:v }); }
    }),
    tweakR.createElement(TweakColor, {
      label:'צבע מותג / Brand', value:t.accent,
      options:['#00B86B','#2D7FF9','#FF7A1A','#8B5CF6'],
      onChange:function(v){ setTweak({ accent:v }); }
    }),
    tweakR.createElement(TweakSelect, {
      label:'גופן / Font', value:t.font,
      options:['Rubik','Heebo','Assistant'],
      onChange:function(v){ setTweak({ font:v }); }
    })
  );
}

Object.assign(window, {
  useTweaks: useTweaks,
  TweakRadio: TweakRadio, TweakColor: TweakColor, TweakSelect: TweakSelect,
  TweaksPanel: TweaksPanel
});
