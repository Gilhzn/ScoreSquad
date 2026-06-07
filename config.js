/* config.js — public client configuration.
   Fill these from your Supabase project: Dashboard -> Project Settings -> API.
   BOTH values are PUBLIC and safe to ship in the client (the anon key is
   protected by Row-Level Security). The API-Football key is NEVER here — it
   lives only in the Edge Function secrets on the server.

   Leave the strings empty to run the app in offline DEMO mode (mock data). */
window.SCORESQUAD_CONFIG = {
  supabaseUrl: '',
  supabaseAnonKey: ''
};
