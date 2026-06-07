/* data.jsx — all mock data + i18n (window.tx) */

/* ---------- i18n ---------- */
// value is either a plain string (returned as-is) or { he, en }.
function tx(value, lang){
  if(value == null) return '';
  if(typeof value === 'string') return value;
  var l = lang || window.__lang || 'he';
  return value[l] != null ? value[l] : (value.he != null ? value.he : value.en);
}

/* ---------- TEAMS (16) ----------
   flag config:
     dir: 'h' (horizontal bands -> column) | 'v' (vertical bands -> row)
     bands: array of colors (each band flex:1)
     extra: 'sun' | 'circle' | 'diamond' | 'cross' | 'star' | 'canton'
*/
var TEAMS = {
  ARG: { name:{he:'ארגנטינה', en:'Argentina'}, flag:{ dir:'h', bands:['#75AADB','#ffffff','#75AADB'], extra:'sun' } },
  FRA: { name:{he:'צרפת',      en:'France'},    flag:{ dir:'v', bands:['#0055A4','#ffffff','#EF4135'] } },
  BRA: { name:{he:'ברזיל',     en:'Brazil'},    flag:{ dir:'h', bands:['#009C3B'], extra:'diamond' } },
  ESP: { name:{he:'ספרד',      en:'Spain'},     flag:{ dir:'h', bands:['#AA151B','#F1BF00','#F1BF00','#AA151B'] } },
  ENG: { name:{he:'אנגליה',    en:'England'},   flag:{ dir:'h', bands:['#ffffff'], extra:'cross' } },
  POR: { name:{he:'פורטוגל',   en:'Portugal'},  flag:{ dir:'v', bands:['#006600','#006600','#FF0000','#FF0000','#FF0000'] } },
  GER: { name:{he:'גרמניה',    en:'Germany'},   flag:{ dir:'h', bands:['#000000','#DD0000','#FFCE00'] } },
  NED: { name:{he:'הולנד',     en:'Netherlands'},flag:{ dir:'h', bands:['#AE1C28','#ffffff','#21468B'] } },
  CRO: { name:{he:'קרואטיה',   en:'Croatia'},   flag:{ dir:'h', bands:['#FF0000','#ffffff','#171796'] } },
  MAR: { name:{he:'מרוקו',     en:'Morocco'},   flag:{ dir:'h', bands:['#C1272D'], extra:'star' } },
  JPN: { name:{he:'יפן',       en:'Japan'},     flag:{ dir:'h', bands:['#ffffff'], extra:'circle' } },
  USA: { name:{he:'ארה"ב',     en:'USA'},       flag:{ dir:'h', bands:['#B22234','#ffffff','#B22234','#ffffff','#B22234','#ffffff','#B22234'], extra:'canton' } },
  MEX: { name:{he:'מקסיקו',    en:'Mexico'},    flag:{ dir:'v', bands:['#006847','#ffffff','#CE1126'] } },
  BEL: { name:{he:'בלגיה',     en:'Belgium'},   flag:{ dir:'v', bands:['#000000','#FAE042','#ED2939'] } },
  URU: { name:{he:'אורוגוואי', en:'Uruguay'},   flag:{ dir:'h', bands:['#ffffff','#0038A8','#ffffff','#0038A8','#ffffff'], extra:'sun' } },
  SEN: { name:{he:'סנגל',      en:'Senegal'},   flag:{ dir:'v', bands:['#00853F','#FDEF42','#E31B23'], extra:'star' } },
};

/* ---------- PLAYERS (top-scorer candidates) ---------- */
var PLAYERS = {
  p1: { name:{he:'מסי',     en:'Messi'},    team:'ARG' },
  p2: { name:{he:'אמבפה',   en:'Mbappé'},   team:'FRA' },
  p3: { name:{he:'ויניסיוס',en:'Vinícius'}, team:'BRA' },
  p4: { name:{he:'קיין',    en:'Kane'},     team:'ENG' },
  p5: { name:{he:'רונאלדו', en:'Ronaldo'},  team:'POR' },
  p6: { name:{he:'ימאל',    en:'Yamal'},    team:'ESP' },
};

/* ---------- MEMBERS (8 league participants) ----------
   always rendered sorted by pts desc. */
var MEMBERS = [
  { id:'m1', name:{he:'דני',  en:'Danny'},  color:'#2D7FF9', pts:87, trend:0,  you:false },
  { id:'m2', name:{he:'יוסי', en:'Yossi'},  color:'#00B86B', pts:81, trend:+2, you:false },
  { id:'me', name:{he:'את/ה', en:'You'},    color:'#FF7A1A', pts:74, trend:+1, you:true  },
  { id:'m3', name:{he:'גל',   en:'Gal'},    color:'#8B5CF6', pts:71, trend:-2, you:false },
  { id:'m4', name:{he:'רוני', en:'Roni'},   color:'#EC4899', pts:66, trend:+1, you:false },
  { id:'m5', name:{he:'נועה', en:'Noa'},    color:'#06B6D4', pts:58, trend:-1, you:false },
  { id:'m6', name:{he:'אבי',  en:'Avi'},    color:'#F59E0B', pts:49, trend:0,  you:false },
  { id:'m7', name:{he:'אילן', en:'Ilan'},   color:'#64748B', pts:41, trend:-3, you:false },
];
function membersSorted(){ return MEMBERS.slice().sort(function(a,b){ return b.pts - a.pts; }); }
function memberById(id){ for(var i=0;i<MEMBERS.length;i++){ if(MEMBERS[i].id===id) return MEMBERS[i]; } return null; }

/* ---------- LEAGUES (3) ---------- */
var LEAGUES = [
  { id:'l1', name:{he:"החבר'ה מהצבא", en:'Army Buddies'}, members:8,  emoji:'🎖️', code:'XF93K' },
  { id:'l2', name:{he:'משפחה',        en:'Family'},        members:12, emoji:'🏠', code:'FAM21' },
  { id:'l3', name:{he:'עבודה',        en:'Work'},          members:23, emoji:'💼', code:'WRK88' },
];

/* ---------- FIXTURES (6) ----------
   status: 'live' | 'locksoon' | 'upcoming' | 'finished' */
var FIXTURES = [
  { id:'f1', home:'ARG', away:'FRA', hs:2, as:1, minute:78, status:'live',     round:1, kickoff:{he:'עכשיו', en:'Now'},       myPred:null },
  { id:'f2', home:'ESP', away:'GER', hs:null, as:null,      status:'locksoon', round:1, kickoff:{he:'היום 22:00', en:'Today 22:00'}, lockMs: 5*60*1000 + 40*1000, myPred:null },
  { id:'f3', home:'BRA', away:'ENG', hs:null, as:null,      status:'upcoming', round:1, kickoff:{he:'מחר 19:00', en:'Tomorrow 19:00'}, myPred:{h:2,a:1} },
  { id:'f4', home:'POR', away:'NED', hs:null, as:null,      status:'upcoming', round:1, kickoff:{he:'מחר 22:00', en:'Tomorrow 22:00'}, myPred:null },
  { id:'f5', home:'CRO', away:'MAR', hs:null, as:null,      status:'upcoming', round:2, kickoff:{he:'ג׳ 17:00', en:'Wed 17:00'}, myPred:null },
  { id:'f6', home:'JPN', away:'BEL', hs:null, as:null,      status:'upcoming', round:2, kickoff:{he:'ג׳ 20:00', en:'Wed 20:00'}, myPred:null },
];
function fixtureById(id){ for(var i=0;i<FIXTURES.length;i++){ if(FIXTURES[i].id===id) return FIXTURES[i]; } return null; }

/* ---------- LIVE_PREDS — friends' predictions on the live game (ARG 2–1 FRA) ---------- */
var LIVE_PREDS = [
  { id:'m2', h:2, a:1 },
  { id:'me', h:2, a:0 },
  { id:'m3', h:3, a:1 },
  { id:'m4', h:2, a:1 },
  { id:'m1', h:1, a:1 },
  { id:'m7', h:0, a:2 },
  { id:'m5', h:3, a:2 },
  { id:'m6', h:1, a:0 },
];

/* ---------- CHAT — initial messages ---------- */
var CHAT = [
  { id:'m1', type:'msg', text:{he:'מי שלא ממלא הימור עד 22:00 משלם על הפיצה הבאה 🍕', en:"Whoever doesn't predict by 22:00 pays for the next pizza 🍕"} },
  { id:'m4', type:'msg', text:{he:'ארגנטינה 3-0 קלי קלות. תרשמו', en:'Argentina 3-0 easy. Mark my words'} },
  { id:'sys', type:'system', text:{he:'אילן איבד את הבול פגיעה בדקה ה-94! בואו ללחוץ לו על היבלת 😈', en:'Ilan lost his exact-hit in the 94th minute! Come rub it in 😈'} },
  { id:'m2', type:'gif' },
  { id:'me', type:'msg', mine:true, text:{he:'אתם תבכו אחרי המחזור הזה', en:"You'll all cry after this round"} },
];

/* ---------- STICKERS ---------- */
var STICKERS = ['⚽','🥅','🧤','🎯','🤡','🔥','💀','😂'];

/* ---------- BADGES (6 titles) ---------- */
var BADGES = [
  { id:'b1', name:{he:'נוסטרדמוס', en:'Nostradamus'}, desc:{he:'3 בולים מדויקים ברצף', en:'3 exact hits in a row'},          icon:'🔮', earned:true,  tone:'#8B5CF6' },
  { id:'b2', name:{he:'דקה 90',    en:'90th Minute'},  desc:{he:'שערי סיום הצילו לך הכי הרבה ניקוד', en:'Late goals saved you the most points'}, icon:'⏱️', earned:true,  tone:'#2D7FF9' },
  { id:'b3', name:{he:'על האש',    en:'On Fire'},      desc:{he:'5 מחזורים רצופים בטופ 3', en:'5 straight rounds in top 3'}, icon:'🔥', earned:true,  tone:'#FF7A1A' },
  { id:'b4', name:{he:'השף',       en:'The Clown'},    desc:{he:'0 נקודות ב-3 משחקים ברצף', en:'0 points in 3 straight games'}, icon:'🤡', earned:false, tone:'#EC4899' },
  { id:'b5', name:{he:'הסנייפר',   en:'The Sniper'},   desc:{he:'10 בולים מדויקים בטורניר', en:'10 exact hits in the tournament'}, icon:'🎯', earned:false, tone:'#00B86B' },
  { id:'b6', name:{he:'הנביא',     en:'The Prophet'},  desc:{he:'ניחשת נכון את כל הפודיום', en:'Predicted the entire podium correctly'}, icon:'👑', earned:false, tone:'#FFC53D' },
];

/* ---------- SCORING (per-game legend) ----------
   tone keys map to zone colors. 'trend' uses the close color. */
var SCORING = [
  { pts:10, tone:'hit',   label:{he:'בול פגיעה', en:'Exact hit'},     sub:{he:'תוצאה מדויקת', en:'Exact score'} },
  { pts:5,  tone:'close', label:{he:'הפרש נכון', en:'Right margin'},  sub:{he:'מנצחת + הפרש', en:'Winner + margin'} },
  { pts:3,  tone:'close', label:{he:'מגמה', en:'Trend'},              sub:{he:'מנצחת / תיקו', en:'Winner / draw'} },
  { pts:0,  tone:'miss',  label:{he:'פספוס', en:'Miss'},              sub:{he:'לא פגעת', en:"Didn't hit"} },
];

/* ---------- long-term scoring (podium) ---------- */
var PODIUM_PTS = { champion:30, runnerup:20, third:15, scorer:25 };

/* ---------- PERF (table position over tournament days, 1 = leader) ---------- */
var PERF = [6, 5, 5, 4, 6, 3, 3, 2, 3, 3];

/* ---------- exports ---------- */
Object.assign(window, {
  tx: tx,
  TEAMS: TEAMS,
  PLAYERS: PLAYERS,
  MEMBERS: MEMBERS,
  membersSorted: membersSorted,
  memberById: memberById,
  LEAGUES: LEAGUES,
  FIXTURES: FIXTURES,
  fixtureById: fixtureById,
  LIVE_PREDS: LIVE_PREDS,
  CHAT: CHAT,
  STICKERS: STICKERS,
  BADGES: BADGES,
  SCORING: SCORING,
  PODIUM_PTS: PODIUM_PTS,
  PERF: PERF,
});
