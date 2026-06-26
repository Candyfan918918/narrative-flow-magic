/* Shutap — feedback loop engine.
   One engine, loaded on every page. Captures what users LOVE and where they hit FRICTION —
   from explicit signals AND implicit behavior AND what they ask the companion — so the team
   can ship daily builds against real signal.

   window.ShutapFeedback
     .track(type, payload)         passive/explicit event → append to ring buffer
     .ask(context, opts)           companion-voiced micro-prompt ("how did that land?")
     .rate(target, valence, note)  explicit rating ('loved' | 'meh' | 'friction')
     .signals()                    raw event array (newest last)
     .summary()                    aggregated → { loved, friction, questions, sentiment, byType, counts }
     .clearForDemo()               (dev only) wipe captured feedback

   Storage: localStorage 'shutap_feedback' (ring buffer, cap 600).
   Pseudonymous + on-device by design — events carry the alias + opaque session id, never a real identity.
*/
(function(){
  if (window.ShutapFeedback) return;

  var KEY='shutap_feedback', CAP=600;
  function getJSON(k,f){ try{ return JSON.parse(localStorage.getItem(k)||'null')||f; }catch(e){ return f; } }
  function setJSON(k,v){ try{ localStorage.setItem(k, JSON.stringify(v)); }catch(e){} }
  function alias(){ try{ var a=JSON.parse(localStorage.getItem('shutap_alias')||'null'); return a?(a.emoji+' '+a.name):'(guest)'; }catch(e){ return '(guest)'; } }
  function sid(){ try{ var s=sessionStorage.getItem('shutap_fb_sid'); if(!s){ s=Math.random().toString(36).slice(2,9); sessionStorage.setItem('shutap_fb_sid',s);} return s; }catch(e){ return 'x'; } }
  function page(){ var p=(location.pathname.split('/').pop()||'').replace('.dc.html','').replace('.html',''); return p||'Landing'; }

  // ---- POSITIVE vs FRICTION classification ----
  // each event type carries a default valence; explicit ratings override.
  var VALENCE={
    // love signals
    relate:'love', react:'love', share_accept:'love', scan_done:'love', spill_publish:'love',
    mirror_open:'love', mirror_reading:'love', mirror_unlock:'love', comment_post:'love',
    room_dwell_long:'love', return_visit:'love', rate_loved:'love',
    // friction signals
    spill_abandon:'friction', scan_abandon:'friction', share_dismiss:'friction',
    room_bounce:'friction', dead_click:'friction', rage_click:'friction',
    paywall_bounce:'friction', rate_friction:'friction', error:'friction',
    // neutral / context
    page_view:'neutral', room_open:'neutral', companion_open:'neutral',
    companion_q:'question', search:'question', rate_meh:'neutral'
  };

  function track(type, payload){
    var log=getJSON(KEY,[]);
    var ev={ id:Date.now()+'-'+Math.random().toString(36).slice(2,6), type:type, t:Date.now(),
             page:page(), sid:sid(), alias:alias(), v:VALENCE[type]||'neutral' };
    if(payload) for(var k in payload){ if(payload.hasOwnProperty(k)) ev[k]=payload[k]; }
    log.push(ev);
    if(log.length>CAP) log=log.slice(-CAP);
    setJSON(KEY,log);
    if(window.console&&console.debug) console.debug('[fb]',type,payload||'');
    return ev;
  }

  function rate(target, valence, note){
    var t = valence==='love'||valence==='loved' ? 'rate_loved'
          : valence==='friction'||valence==='bad' ? 'rate_friction' : 'rate_meh';
    return track(t, { target:target||page(), note:note||null });
  }

  // ---- aggregation for the team ----
  function summary(){
    var log=getJSON(KEY,[]);
    var counts={love:0,friction:0,question:0,neutral:0,total:log.length};
    var byType={}, lovedMap={}, fricMap={}, qs=[];
    log.forEach(function(e){
      counts[e.v]=(counts[e.v]||0)+1;
      byType[e.type]=(byType[e.type]||0)+1;
      if(e.v==='love'){ var lk=e.target||e.label||e.type; lovedMap[lk]=(lovedMap[lk]||0)+1; }
      if(e.v==='friction'){ var fk=e.target||e.label||e.type; fricMap[fk]=(fricMap[fk]||0)+1; }
      if(e.v==='question' && (e.text||e.q)) qs.push({ text:(e.text||e.q), page:e.page, t:e.t });
    });
    function rank(m){ return Object.keys(m).map(function(k){return {key:k,n:m[k]};}).sort(function(a,b){return b.n-a.n;}); }
    var denom=(counts.love+counts.friction)||1;
    return {
      counts:counts,
      sentiment: Math.round(counts.love/denom*100),     // 0..100 love share
      loved: rank(lovedMap),
      friction: rank(fricMap),
      questions: qs.slice(-40).reverse(),               // newest first
      byType: rank(byType)
    };
  }

  // ---- the companion micro-prompt (active, on-brand, rare) ----
  // a quiet slide-up: companion line + two taps (this helped / not for me) + optional one-line note.
  var EYE='<svg viewBox="0 0 56 56" fill="none" style="width:20px;height:20px;display:block;flex:none"><rect x="15.25" y="16" width="11.5" height="24" rx="5.75" fill="url(#fbEyeG)"/><rect x="29.25" y="16" width="11.5" height="24" rx="5.75" fill="url(#fbEyeG)"/><ellipse cx="21" cy="29" rx="4" ry="5" fill="#2a0d18"/><ellipse cx="35" cy="29" rx="4" ry="5" fill="#2a0d18"/></svg>';
  function ensureDefs(){
    if(document.getElementById('_fbDefs')) return;
    var s=document.createElementNS('http://www.w3.org/2000/svg','svg');
    s.id='_fbDefs'; s.setAttribute('width','0'); s.setAttribute('height','0'); s.style.position='absolute';
    s.innerHTML='<defs><radialGradient id="fbEyeG" cx="40%" cy="18%" r="75%"><stop offset="0%" stop-color="#fff"/><stop offset="20%" stop-color="#ffd0e8"/><stop offset="52%" stop-color="#f060a0"/><stop offset="100%" stop-color="#880040"/></radialGradient></defs>';
    document.body.appendChild(s);
  }
  function askCap(){ // at most one prompt per session, and a daily ceiling — never nag
    try{
      if(sessionStorage.getItem('shutap_fb_asked')==='1') return false;
      var d=getJSON('shutap_fb_askday',{date:'',n:0}); var today=new Date().toISOString().slice(0,10);
      if(d.date!==today){ d={date:today,n:0}; }
      if(d.n>=2) return false;
      return true;
    }catch(e){ return true; }
  }
  function markAsked(){ try{ sessionStorage.setItem('shutap_fb_asked','1'); var today=new Date().toISOString().slice(0,10); var d=getJSON('shutap_fb_askday',{date:today,n:0}); if(d.date!==today)d={date:today,n:0}; d.n++; setJSON('shutap_fb_askday',d); }catch(e){} }

  function ask(context, opts){
    opts=opts||{};
    if(!opts.force && !askCap()) return;
    markAsked();
    ensureDefs();
    var prev=document.getElementById('_fbprompt'); if(prev) prev.remove();
    var line=opts.line || 'how did that land?';
    var wrap=document.createElement('div'); wrap.id='_fbprompt';
    wrap.style.cssText='position:fixed;left:50%;bottom:22px;transform:translate(-50%,140%);z-index:96;width:calc(100% - 32px);max-width:380px;background:rgba(255,255,255,.98);backdrop-filter:blur(8px);border:.5px solid rgba(11,8,15,.1);border-radius:20px;box-shadow:0 18px 50px -12px rgba(70,12,40,.35);padding:15px 16px 14px;transition:transform .5s cubic-bezier(.2,.9,.25,1);font-family:Inter,system-ui,sans-serif';
    wrap.innerHTML=
      '<div style="display:flex;align-items:center;gap:9px;margin-bottom:11px">'+
        '<span style="width:30px;height:30px;border-radius:50%;background:rgba(231,84,138,.14);display:grid;place-items:center;flex:none">'+EYE+'</span>'+
        '<div style="font-family:Newsreader,serif;font-style:italic;font-size:14.5px;color:#2e1a26;line-height:1.4">'+line+'</div>'+
      '</div>'+
      '<div style="display:flex;gap:9px">'+
        '<div data-fb="love" role="button" style="flex:1;text-align:center;cursor:pointer;padding:10px;border-radius:13px;background:rgba(231,84,138,.1);font-family:Sora,sans-serif;font-weight:600;font-size:13px;color:#a01a55">🤍 this helped</div>'+
        '<div data-fb="friction" role="button" style="flex:1;text-align:center;cursor:pointer;padding:10px;border-radius:13px;background:rgba(11,8,15,.05);font-family:Sora,sans-serif;font-weight:600;font-size:13px;color:#6b4a5c">🥀 not for me</div>'+
      '</div>'+
      '<div data-fb-note style="display:none;margin-top:10px">'+
        '<input data-fb-input placeholder="one line — what would make it better?" style="width:100%;box-sizing:border-box;border:.5px solid rgba(11,8,15,.14);border-radius:12px;padding:10px 12px;font-family:Newsreader,serif;font-style:italic;font-size:13.5px;outline:none;background:#fff">'+
      '</div>'+
      '<div data-fb-x role="button" style="position:absolute;top:10px;right:13px;font-size:17px;color:#b9a7b1;cursor:pointer;line-height:1">×</div>';
    document.body.appendChild(wrap);
    requestAnimationFrame(function(){ wrap.style.transform='translate(-50%,0)'; });
    function close(){ wrap.style.transform='translate(-50%,140%)'; setTimeout(function(){ wrap.remove(); },480); }
    var chosen=null;
    wrap.querySelectorAll('[data-fb]').forEach(function(b){
      b.addEventListener('click',function(){
        chosen=b.getAttribute('data-fb');
        rate(context, chosen);
        wrap.querySelectorAll('[data-fb]').forEach(function(x){ x.style.opacity=x===b?'1':'.4'; });
        var note=wrap.querySelector('[data-fb-note]'); note.style.display='block';
        var inp=wrap.querySelector('[data-fb-input]'); inp.focus();
        inp.addEventListener('keydown',function(e){ if(e.key==='Enter'){ if(inp.value.trim()) track(chosen==='love'?'rate_loved':'rate_friction',{target:context,note:inp.value.trim()}); inp.value=''; close(); } });
        // auto-dismiss after the reaction even without a note
        clearTimeout(wrap._t); wrap._t=setTimeout(close, 4200);
      });
    });
    wrap.querySelector('[data-fb-x]').addEventListener('click',close);
  }

  // ---- self-wiring passive capture ----
  function initPassive(){
    track('page_view',{target:page()});
    // returning user
    try{ var last=localStorage.getItem('shutap_fb_lastvisit'); var now=Date.now();
      if(last && (now-Number(last))>1000*60*30) track('return_visit',{gapMin:Math.round((now-Number(last))/60000)});
      localStorage.setItem('shutap_fb_lastvisit',String(now));
    }catch(e){}
    // dwell on this page → long dwell = engagement signal
    var t0=Date.now();
    window.addEventListener('beforeunload',function(){ var s=Math.round((Date.now()-t0)/1000); track(s>=25?'room_dwell_long':'page_dwell',{sec:s,target:page()}); });
    // dead-click detection: a tap that hits nothing interactive, repeated, = friction
    var deadStreak=0, lastDead=0;
    document.addEventListener('click',function(e){
      var el=e.target;
      var interactive=el.closest&&el.closest('a,button,input,textarea,select,[role="button"],[onclick],[data-fb],label');
      if(!interactive){ var now=Date.now(); if(now-lastDead<1200){ deadStreak++; } else { deadStreak=1; } lastDead=now;
        if(deadStreak>=3){ track('rage_click',{target:page()}); deadStreak=0; }
      } else { deadStreak=0; }
    },true);
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',initPassive); else initPassive();

  window.ShutapFeedback={ track:track, ask:ask, rate:rate,
    signals:function(){ return getJSON(KEY,[]); },
    summary:summary,
    clearForDemo:function(){ try{ localStorage.removeItem(KEY); }catch(e){} } };
})();
