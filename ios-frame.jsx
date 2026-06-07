/* ios-frame.jsx — IOSDevice iPhone frame (status bar, dynamic island, home indicator) */

var frameR = React;

function IOSDevice(props){
  var w = props.width || 402;
  var h = props.height || 874;

  // Native (APK / full-screen) mode: drop the iPhone chrome and fill the viewport.
  // The OS provides the real status bar; we only reserve the safe-area insets.
  if(window.SS_NATIVE){
    return frameR.createElement('div', { style:{
      position:'fixed', inset:0, background:'var(--bg)', overflow:'hidden',
      paddingTop:'env(safe-area-inset-top, 0px)', paddingBottom:'env(safe-area-inset-bottom, 0px)'
    } },
      frameR.createElement('div', { style:{ position:'relative', width:'100%', height:'100%', overflow:'hidden' } },
        props.children
      )
    );
  }

  // status bar
  var statusBar = frameR.createElement('div', { style:{
    position:'absolute', top:0, insetInlineStart:0, insetInlineEnd:0, height:54,
    display:'flex', alignItems:'flex-start', justifyContent:'space-between',
    padding:'14px 26px 0', zIndex:50, pointerEvents:'none',
    color:'var(--ink)', fontWeight:600, fontSize:15
  } },
    frameR.createElement('div', { style:{ fontVariantNumeric:'tabular-nums', letterSpacing:0 } }, '9:41'),
    // dynamic island
    frameR.createElement('div', { style:{
      position:'absolute', insetInlineStart:'50%', transform:'translateX(-50%)', top:11,
      width:118, height:34, borderRadius:18, background:'#000'
    } }),
    // right cluster: signal / wifi / battery
    frameR.createElement('div', { style:{ display:'flex', alignItems:'center', gap:6, direction:'ltr' } },
      frameR.createElement('svg', { width:18, height:12, viewBox:'0 0 18 12' },
        [3,7,11,15].map(function(x,i){
          return frameR.createElement('rect', { key:i, x:x, y:8-i*2.4, width:2.6, height:4+i*2.4, rx:0.8, fill:'var(--ink)' });
        })
      ),
      frameR.createElement('svg', { width:17, height:12, viewBox:'0 0 17 12' },
        frameR.createElement('path', { d:'M8.5 3.2c2.3 0 4.4.9 6 2.4l-1.5 1.6A6.4 6.4 0 0 0 8.5 5.4 6.4 6.4 0 0 0 4 7.2L2.5 5.6A8.6 8.6 0 0 1 8.5 3.2Z', fill:'var(--ink)' }),
        frameR.createElement('circle', { cx:8.5, cy:9.4, r:1.6, fill:'var(--ink)' })
      ),
      frameR.createElement('div', { style:{ display:'flex', alignItems:'center', gap:1 } },
        frameR.createElement('div', { style:{ width:22, height:11, borderRadius:3, boxShadow:'inset 0 0 0 1px rgba(0,0,0,.35)', padding:1.5 } },
          frameR.createElement('div', { style:{ width:'78%', height:'100%', borderRadius:1.5, background:'var(--ink)' } })
        ),
        frameR.createElement('div', { style:{ width:1.5, height:4, borderRadius:1, background:'rgba(0,0,0,.35)' } })
      )
    )
  );

  // home indicator
  var homeIndicator = frameR.createElement('div', { style:{
    position:'absolute', bottom:8, insetInlineStart:'50%', transform:'translateX(-50%)',
    width:140, height:5, borderRadius:3, background:'var(--ink)', opacity:.9, zIndex:60, pointerEvents:'none'
  } });

  return frameR.createElement('div', { style:{
    width:w, height:h, position:'relative',
    background:'#0b0b0d', borderRadius:54, padding:11,
    boxShadow:'0 30px 60px rgba(16,24,40,.28), 0 4px 14px rgba(16,24,40,.18), inset 0 0 0 2px rgba(255,255,255,.04)'
  } },
    frameR.createElement('div', { style:{
      width:'100%', height:'100%', position:'relative', overflow:'hidden',
      borderRadius:44, background:'var(--bg)'
    } },
      statusBar,
      props.children,
      homeIndicator
    )
  );
}

Object.assign(window, { IOSDevice: IOSDevice });
