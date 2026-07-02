/* Shutap — Sign-In Sheet (NEUTRALIZED).
   The prior version minted an alias purely in localStorage with no real
   Supabase session. That has been removed. All auth now goes through the
   real /welcome flow (Google/Apple/email magic-link + age gate + alias
   persisted to public.aliases).

   window.ShutapAuth.requireAuth(onSuccess, trigger)
     - if signed in → onSuccess() immediately, returns true
     - else → redirect to /welcome (parent React shell handles auth)
*/
(function(){
  if (window.ShutapAuth) return;

  function getAlias(){ try{ const r=localStorage.getItem('shutap_alias'); return r?JSON.parse(r):null; }catch(e){ return null; } }

  function rememberReturn(){
    try{
      // Mirror src/lib/auth.ts rememberReturnTo — same sessionStorage key.
      sessionStorage.setItem('shutap_returnTo', location.href);
    }catch(e){}
  }

  function goWelcome(){
    rememberReturn();
    // If we're inside the SPA iframe bridge, ask the parent to navigate.
    try{
      if (window.parent && window.parent !== window) {
        window.parent.postMessage({ type: 'shutap-nav', to: '/welcome' }, '*');
        return;
      }
    }catch(e){}
    location.href = '/welcome';
  }

  window.ShutapAuth = {
    isSignedIn: () => !!getAlias(),
    alias: getAlias,
    requireAuth: function(onSuccess, _trigger){
      if (getAlias()) { try{ onSuccess && onSuccess(); }catch(e){} return true; }
      goWelcome();
      return false;
    }
  };
})();
