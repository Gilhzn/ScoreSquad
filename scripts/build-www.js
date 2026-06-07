/* build-www.js — assemble a self-contained web bundle (www/) for Capacitor.
   The prototype already uses React.createElement (no JSX), so no Babel is needed:
   the .jsx files are valid JS and are copied to www/ as plain .js and loaded with
   ordinary <script> tags. React + fonts are vendored locally so the Android WebView
   needs no network. */

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const www = path.join(root, 'www');
const vendor = path.join(www, 'vendor');
const fontsDir = path.join(www, 'fonts');

function rmrf(p){ if(fs.existsSync(p)) fs.rmSync(p, { recursive:true, force:true }); }
function mkdirp(p){ fs.mkdirSync(p, { recursive:true }); }
function copy(src, dest){ fs.copyFileSync(src, dest); }

// 1. clean
rmrf(www);
mkdirp(vendor);
mkdirp(fontsDir);

// 2. vendor React UMD (production)
copy(path.join(root, 'node_modules/react/umd/react.production.min.js'), path.join(vendor, 'react.production.min.js'));
copy(path.join(root, 'node_modules/react-dom/umd/react-dom.production.min.js'), path.join(vendor, 'react-dom.production.min.js'));

// 3. fonts (Rubik variable: hebrew + latin subsets)
const fsrc = path.join(root, 'node_modules/@fontsource-variable/rubik/files');
copy(path.join(fsrc, 'rubik-hebrew-wght-normal.woff2'), path.join(fontsDir, 'rubik-hebrew.woff2'));
copy(path.join(fsrc, 'rubik-latin-wght-normal.woff2'),  path.join(fontsDir, 'rubik-latin.woff2'));

const HEBREW_RANGE = 'U+0307-0308,U+0590-05FF,U+200C-2010,U+20AA,U+25CC,U+FB1D-FB4F';
const LATIN_RANGE  = 'U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD';
const fontCss =
`@font-face{
  font-family:'Rubik';
  font-style:normal;
  font-display:swap;
  font-weight:300 900;
  src:url('rubik-hebrew.woff2') format('woff2-variations');
  unicode-range:${HEBREW_RANGE};
}
@font-face{
  font-family:'Rubik';
  font-style:normal;
  font-display:swap;
  font-weight:300 900;
  src:url('rubik-latin.woff2') format('woff2-variations');
  unicode-range:${LATIN_RANGE};
}
/* Heebo / Assistant Tweak options fall back to Rubik when offline */
`;
fs.writeFileSync(path.join(fontsDir, 'rubik.css'), fontCss);

// 4. copy app scripts (.jsx -> .js, content unchanged)
const SCRIPTS = ['data','ui','ios-frame','tweaks-panel','screens-onboarding','screens-home','screens-league','screens-predict','screens-live','screens-profile','app'];
SCRIPTS.forEach(function(name){
  copy(path.join(root, name + '.jsx'), path.join(www, name + '.js'));
});

// 5. reuse the design-system <style> block from ScoreSquad.html so tokens never drift
const shell = fs.readFileSync(path.join(root, 'ScoreSquad.html'), 'utf8');
const styleMatch = shell.match(/<style>([\s\S]*?)<\/style>/);
const styleBlock = styleMatch ? styleMatch[1] : '';

const scriptTags = ['vendor/react.production.min.js', 'vendor/react-dom.production.min.js']
  .concat(SCRIPTS.map(function(n){ return n + '.js'; }))
  .map(function(src, i){
    // inject the native flag right before the app scripts (after the two vendor scripts)
    var flag = (i === 2) ? '  <script>window.SS_NATIVE = true;</script>\n' : '';
    return flag + '  <script src="' + src + '"></script>';
  }).join('\n');

const indexHtml =
`<!DOCTYPE html>
<html lang="he">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />
<title>ScoreSquad</title>
<link rel="stylesheet" href="fonts/rubik.css" />
<style>${styleBlock}</style>
<style>
  /* native full-screen overrides (no desktop stage scaling) */
  html, body { width:100%; height:100%; }
  body { display:block; background:var(--bg); overflow:hidden; }
  #stage { transform:none !important; width:100%; height:100%; }
  #root { width:100%; height:100%; }
</style>
</head>
<body>
  <div id="stage"><div id="root"></div></div>
${scriptTags}
</body>
</html>
`;
fs.writeFileSync(path.join(www, 'index.html'), indexHtml);

console.log('www/ built:');
console.log('  ' + fs.readdirSync(www).join(', '));
console.log('  vendor: ' + fs.readdirSync(vendor).join(', '));
console.log('  fonts:  ' + fs.readdirSync(fontsDir).join(', '));
