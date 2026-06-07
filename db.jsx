/* db.jsx — data-access layer over Supabase.
   Thin async wrappers used by the screens when window.LIVE === true.
   Each returns plain data (or throws); realtime helpers return the channel so
   callers can unsubscribe. All writes are constrained server-side by RLS:
   users can only touch their own predictions (before lock) and their own chat. */
(function(){
  function sb(){ if(!window.sb) throw new Error('Supabase not configured'); return window.sb; }

  var DB = {
    /* -------------------- auth -------------------- */
    async signUp(email, password, displayName){
      var r = await sb().auth.signUp({ email: email, password: password,
        options: { data: { display_name: displayName } } });
      if(r.error) throw r.error; return r.data;
    },
    async signIn(email, password){
      var r = await sb().auth.signInWithPassword({ email: email, password: password });
      if(r.error) throw r.error; return r.data;
    },
    async signInWithOtp(email){
      var r = await sb().auth.signInWithOtp({ email: email });
      if(r.error) throw r.error; return r.data;
    },
    async signInWithOAuth(provider){
      var r = await sb().auth.signInWithOAuth({ provider: provider });
      if(r.error) throw r.error; return r.data;
    },
    async signOut(){ await sb().auth.signOut(); },
    async getSession(){ var r = await sb().auth.getSession(); return r.data ? r.data.session : null; },
    onAuthChange(cb){ return sb().auth.onAuthStateChange(function(_e, session){ cb(session); }); },

    /* -------------------- profile -------------------- */
    async getProfile(userId){
      var r = await sb().from('profiles').select('*').eq('id', userId).single();
      if(r.error) throw r.error; return r.data;
    },
    async updateProfile(patch){
      var u = (await sb().auth.getUser()).data.user;
      var r = await sb().from('profiles').update(patch).eq('id', u.id).select().single();
      if(r.error) throw r.error; return r.data;
    },

    /* -------------------- leagues -------------------- */
    async myLeagues(){
      // leagues the current user belongs to (RLS limits to memberships)
      var r = await sb().from('leagues').select('id,name,emoji,code,owner_id');
      if(r.error) throw r.error; return r.data;
    },
    async createLeague(name, emoji){
      var r = await sb().rpc('create_league', { p_name: name, p_emoji: emoji });
      if(r.error) throw r.error; return r.data; // league id
    },
    async joinLeague(code){
      var r = await sb().rpc('join_league', { p_code: code });
      if(r.error) throw r.error; return r.data; // league id
    },
    async leagueMembers(leagueId){
      var r = await sb().from('standings').select('*').eq('league_id', leagueId)
        .order('points', { ascending: false });
      if(r.error) throw r.error; return r.data;
    },

    /* -------------------- fixtures -------------------- */
    async listFixtures(){
      var r = await sb().from('fixtures')
        .select('*, home:home_team_id(id,name,code,logo_url), away:away_team_id(id,name,code,logo_url)')
        .order('kickoff_at', { ascending: true });
      if(r.error) throw r.error; return r.data;
    },
    subscribeFixtures(onChange){
      return sb().channel('fixtures-live')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'fixtures' }, onChange)
        .subscribe();
    },

    /* -------------------- predictions -------------------- */
    async myPredictions(){
      var u = (await sb().auth.getUser()).data.user;
      var r = await sb().from('predictions').select('*').eq('user_id', u.id);
      if(r.error) throw r.error; return r.data;
    },
    async upsertPrediction(fixtureId, homePred, awayPred){
      var u = (await sb().auth.getUser()).data.user;
      var r = await sb().from('predictions')
        .upsert({ user_id: u.id, fixture_id: fixtureId, home_pred: homePred, away_pred: awayPred,
                  updated_at: new Date().toISOString() }, { onConflict: 'user_id,fixture_id' })
        .select().single();
      if(r.error) throw r.error; return r.data;
    },
    async revealedPredictions(fixtureId){
      // RLS only returns others' rows once the fixture is locked
      var r = await sb().from('predictions')
        .select('user_id, home_pred, away_pred, profiles:user_id(display_name,avatar_color,avatar_icon)')
        .eq('fixture_id', fixtureId);
      if(r.error) throw r.error; return r.data;
    },

    /* -------------------- chat -------------------- */
    async listMessages(leagueId){
      var r = await sb().from('chat_messages')
        .select('*, profiles:user_id(display_name,avatar_color,avatar_icon)')
        .eq('league_id', leagueId).order('created_at', { ascending: true }).limit(200);
      if(r.error) throw r.error; return r.data;
    },
    async sendMessage(leagueId, type, body){
      var u = (await sb().auth.getUser()).data.user;
      var r = await sb().from('chat_messages')
        .insert({ league_id: leagueId, user_id: u.id, type: type || 'msg', body: body })
        .select().single();
      if(r.error) throw r.error; return r.data;
    },
    subscribeChat(leagueId, onInsert){
      return sb().channel('chat-' + leagueId)
        .on('postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: 'league_id=eq.' + leagueId },
          function(payload){ onInsert(payload.new); })
        .subscribe();
    },

    unsubscribe(channel){ if(channel) sb().removeChannel(channel); },
  };

  window.DB = DB;
})();
