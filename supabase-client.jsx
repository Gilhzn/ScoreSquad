/* supabase-client.jsx — initialize the Supabase client (if configured).
   Sets window.sb (the client) and window.LIVE (true when a backend is wired).
   When not configured, the app stays in offline DEMO mode using mock data. */
(function(){
  var cfg = window.SCORESQUAD_CONFIG || {};
  var url = cfg.supabaseUrl || '';
  var key = cfg.supabaseAnonKey || '';
  window.sb = null;
  window.LIVE = false;
  if(url && key && window.supabase && window.supabase.createClient){
    try {
      window.sb = window.supabase.createClient(url, key, {
        auth: { persistSession: true, autoRefreshToken: true }
      });
      window.LIVE = true;
    } catch(e){
      console.warn('[ScoreSquad] Supabase init failed — staying in demo mode.', e);
    }
  }
})();
