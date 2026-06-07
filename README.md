# ScoreSquad

אפליקציית מובייל אינטראקטיבית לניחוש תוצאות משחקי ספורט (פורמט מונדיאל) לקבוצות חברים — **ללא כסף אמיתי**, רק אגו, תחרותיות וטראש-טוק. דו-לשונית (עברית RTL / אנגלית LTR), בתוך מסגרת iPhone.

A social, money-free sports-score prediction prototype (World-Cup format) for groups of friends. Bilingual (Hebrew RTL / English LTR), rendered inside an iPhone frame.

## הרצה / Running

זהו פרוטוטייפ **ללא שלב build** — React + Babel נטענים דרך CDN.

This is a **zero-build** prototype — React + Babel load from a CDN.

1. ודאו חיבור לאינטרנט (לטעינת React/ReactDOM/Babel + Google Fonts).
2. הריצו שרת סטטי מקומי מתיקיית הפרויקט, למשל:

   ```bash
   python3 -m http.server 8000
   ```

3. פתחו בדפדפן: `http://localhost:8000/ScoreSquad.html`

> פתיחה ישירה של הקובץ (`file://`) עלולה להיחסם על-ידי מדיניות CORS של חלק מהדפדפנים בעת טעינת ה-`.jsx` כ-`text/babel`. מומלץ להשתמש בשרת סטטי.
>
> Opening the file via `file://` may be blocked by some browsers' CORS policy when loading the `.jsx` scripts as `text/babel`. Prefer a static server.

## מבנה / Structure

| קובץ / File | תפקיד / Role |
|---|---|
| `ScoreSquad.html` | Shell: fonts, CSS tokens, keyframes, script load order, stage scaling |
| `data.jsx` | Mock data + i18n (`window.tx`) |
| `ui.jsx` | Shared atoms (Flag, Avatar, TrendArrow, ScoreNum, Stepper, Pill, Card, LiveDot, VS) |
| `ios-frame.jsx` | iPhone frame (IOSDevice) |
| `tweaks-panel.jsx` | Tweaks panel (language / brand color / font) + persist hook |
| `screens-onboarding.jsx` | Onboarding flow + Logo |
| `screens-home.jsx` | Home "היציע שלי" + useCountdown |
| `screens-league.jsx` | League room (table + chat) |
| `screens-predict.jsx` | Prediction center (matches + podium) |
| `screens-live.jsx` | Live arena + tension bar (WAAPI) |
| `screens-profile.jsx` | Profile + badges + performance graph |
| `app.jsx` | App shell: navigation, tab bar, tweaks, render |

## Tweaks

לחצו על גלגל השיניים בפינה כדי לפתוח את פאנל ה-Tweaks: שפה (עברית/English), צבע מותג (ירוק/כחול/כתום/סגול), וגופן (Rubik/Heebo/Assistant). ההעדפות נשמרות אוטומטית.

Click the gear icon to open Tweaks: language, brand color, and font. Preferences persist automatically.

## אפליקציית אנדרואיד (APK) / Android app

הפרוטוטייפ נארז כאפליקציית אנדרואיד באמצעות **Capacitor**, במסך מלא (ללא מסגרת האייפון). React והגופנים נארזים מקומית, כך שהאפליקציה עצמאית ואינה תלויה ב-CDN.

The prototype is packaged as an Android app via **Capacitor**, full-screen (no iPhone frame). React and fonts are bundled locally, so the app is self-contained with no CDN dependency.

### בנייה אוטומטית ב-CI (מומלץ) / Automatic CI build

בכל דחיפה לענף, **GitHub Actions** (`.github/workflows/android.yml`) בונה APK ומפרסם אותו כ-**Release**. הורידו את `ScoreSquad-debug.apk` מעמוד ה-Releases של הריפו.

On every push, **GitHub Actions** builds an APK and publishes it as a **Release**. Download `ScoreSquad-debug.apk` from the repo's Releases page.

### בנייה מקומית / Local build

```bash
npm install
npm run build:www          # assemble the self-contained www/ bundle
npx cap add android        # generate the native Android project (first time)
npx cap sync android
cd android && ./gradlew assembleDebug
# APK at: android/app/build/outputs/apk/debug/app-debug.apk
```

> דרוש Android SDK + JDK 17+ מותקנים מקומית. בסביבת הפיתוח של Claude אי אפשר לבנות APK כי `dl.google.com` / Google Maven חסומים.
>
> Requires a local Android SDK + JDK 17+. The Claude dev sandbox cannot build the APK because `dl.google.com` / Google Maven are blocked.

## הערות / Notes

- כל הנתונים mock; אין auth/שרת אמיתי. שערים בלייב מסומלצים בכפתורים.
- **SRI:** ה-CDN scripts מקובעים לגרסה אך ללא `integrity` hashes (סביבת הבנייה הייתה ללא רשת לחישובם). להפקה, הוסיפו hashes לפי ההוראות בהערה שב-`ScoreSquad.html`.
- All data is mock; no real auth/server. Live goals are simulated via buttons.
- **SRI:** CDN scripts are version-pinned but without `integrity` hashes (the build env had no network to compute them). For production, add hashes per the comment in `ScoreSquad.html`.
