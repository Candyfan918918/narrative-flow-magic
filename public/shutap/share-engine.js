/* Shutap §22 — companion-initiated share engine.
   One engine, loaded on every page. Replaces static share buttons.
   The companion catches a positive-valence peak and hands over a finished card.
   window.ShutapShare.offer(triggerId, opts) → shows a slide-up share sheet (or silently declines per the rules).
*/
(function(){
  if (window.ShutapShare) return;

  var EYE = '<svg viewBox="0 0 56 56" fill="none" style="width:22px;height:22px;display:block;flex:none"><rect x="15.25" y="16" width="11.5" height="24" rx="5.75" fill="url(#eyeG)"/><rect x="29.25" y="16" width="11.5" height="24" rx="5.75" fill="url(#eyeG)"/><ellipse cx="21" cy="29" rx="4" ry="5" fill="url(#pupG)"/><ellipse cx="35" cy="29" rx="4" ry="5" fill="url(#pupG)"/></svg>';

  // ---- defs (eye gradients) injected once so the engine works on any page ----
  function ensureDefs(){
    if (document.getElementById('_shareDefs')) return;
    var s = document.createElementNS('http://www.w3.org/2000/svg','svg');
    s.setAttribute('id','_shareDefs'); s.setAttribute('width','0'); s.setAttribute('height','0');
    s.style.position='absolute';
    s.innerHTML='<defs><radialGradient id="eyeG" cx="40%" cy="18%" r="75%"><stop offset="0%" stop-color="#fff"/><stop offset="18%" stop-color="#ffd0e8"/><stop offset="48%" stop-color="#f060a0"/><stop offset="78%" stop-color="#c0206a"/><stop offset="100%" stop-color="#880040"/></radialGradient><radialGradient id="pupG" cx="50%" cy="55%" r="58%"><stop offset="0%" stop-color="#3a1020"/><stop offset="100%" stop-color="#060106"/></radialGradient></defs>';
    document.body.appendChild(s);
  }

  // ---- frequency / restraint state (§22.2) ----
  var DAY_CAP = 3;          // low daily ceiling
  var COOLDOWN_MS = 1000*60*60*6; // 6h cool-down on a dismissed trigger
  function today(){ return new Date().toISOString().slice(0,10); }
  function getJSON(k,f){ try{ return JSON.parse(localStorage.getItem(k)||'null')||f; }catch(e){ return f; } }
  function setJSON(k,v){ try{ localStorage.setItem(k, JSON.stringify(v)); }catch(e){} }

  function sessionUsed(){ try{ return sessionStorage.getItem('shutap_share_session')==='1'; }catch(e){ return false; } }
  function markSession(){ try{ sessionStorage.setItem('shutap_share_session','1'); }catch(e){} }
  function dailyCount(){ var d=getJSON('shutap_share_daily',{date:today(),n:0}); if(d.date!==today()){ d={date:today(),n:0}; setJSON('shutap_share_daily',d);} return d.n; }
  function bumpDaily(){ var d=getJSON('shutap_share_daily',{date:today(),n:0}); if(d.date!==today()) d={date:today(),n:0}; d.n++; setJSON('shutap_share_daily',d); }
  function dismissedRecently(id){ var m=getJSON('shutap_share_dismiss',{}); var e=m[id]; if(!e) return false; return (Date.now()-e.ts) < COOLDOWN_MS; }
  function markDismiss(id){ var m=getJSON('shutap_share_dismiss',{}); var e=m[id]||{n:0,ts:0}; e.n++; e.ts=Date.now(); m[id]=e; setJSON('shutap_share_dismiss',m); }
  function dismissFatigue(id){ var m=getJSON('shutap_share_dismiss',{}); var e=m[id]; return e && e.n>=3; } // learn: 3 dismissals → stop offering this trigger

  // ---- instrumentation (§22.5) ----
  function track(ev, id, extra){
    var log=getJSON('shutap_share_metrics',[]);
    log.push({ev:ev,trigger:id,t:Date.now(),extra:extra||null});
    if(log.length>200) log=log.slice(-200);
    setJSON('shutap_share_metrics',log);
    if(window.console&&console.debug) console.debug('[share]',ev,id,extra||'');
  }

  // ---- valence gate (§22.0) ----
  function valenceOk(opts){
    if(!opts) return false;
    if(opts.crisis) return false;
    if(opts.valence==='heavy'||opts.valence==='negative') return false;
    return true;
  }

  function canFire(id, opts){
    if(opts && opts.force) return true;            // explicit user action (fallback share) bypasses caps
    if(!valenceOk(opts)) { track('suppressed_valence',id); return false; }
    if(sessionUsed()) return false;                // one offer per session
    if(dailyCount()>=DAY_CAP) return false;        // daily ceiling
    if(dismissedRecently(id)) return false;        // cool-down
    if(dismissFatigue(id)) return false;           // learned restraint
    return true;
  }

  // ---- artifact rendering: brand card, varies by kind ----
  function artifact(opts){
    var kind=opts.kind||'generic';
    var accent=opts.accent||'#e7548a';
    var bg='linear-gradient(165deg,#2a0d18,#160810)';
    var inner='';
    if(kind==='scan'){
      bg='radial-gradient(120% 90% at 50% 0%, #3a1020, #160810)';
      inner='<div style="font-family:Sora,sans-serif;font-weight:800;font-size:64px;line-height:1;letter-spacing:-.04em;color:'+accent+'">'+(opts.big||'')+'</div>'+
            '<div style="margin-top:10px;font-family:Sora,sans-serif;font-weight:700;font-size:16px;color:#f7e8f0">'+(opts.headline||'')+'</div>';
    } else if(kind==='signature'){
      inner='<div style="font-family:\'Cormorant Garamond\',Newsreader,serif;font-style:italic;font-size:38px;line-height:1.1;color:#f7e8f0">'+(opts.headline||'')+'</div>'+
            (opts.sub?'<div style="margin-top:12px;font-family:Newsreader,serif;font-style:italic;font-size:15px;color:#c9a3b6">'+opts.sub+'</div>':'');
    } else if(kind==='relate'||kind==='milestone'){
      inner='<div style="font-family:Sora,sans-serif;font-weight:800;font-size:46px;line-height:1;color:'+accent+'">'+(opts.big||'')+'</div>'+
            '<div style="margin-top:12px;font-family:Newsreader,serif;font-style:italic;font-size:18px;line-height:1.4;color:#f7e8f0">'+(opts.headline||'')+'</div>';
    } else if(kind==='hall'){
      inner='<div style="font-size:34px;margin-bottom:8px">'+(opts.badge||'🏛')+'</div>'+
            '<div style="font-family:Sora,sans-serif;font-weight:800;font-size:20px;color:'+accent+'">'+(opts.headline||'')+'</div>'+
            (opts.sub?'<div style="margin-top:8px;font-family:Newsreader,serif;font-style:italic;font-size:14px;color:#c9a3b6">'+opts.sub+'</div>':'');
    } else if(kind==='arc'||kind==='growth'||kind==='outcome'){
      inner='<div style="font-family:Newsreader,serif;font-style:italic;font-size:22px;line-height:1.35;color:#f7e8f0">'+(opts.headline||'')+'</div>'+
            (opts.sub?'<div style="margin-top:10px;font-family:Sora,sans-serif;font-weight:700;font-size:13px;letter-spacing:.04em;color:'+accent+'">'+opts.sub+'</div>':'');
    } else {
      inner='<div style="font-family:Newsreader,serif;font-style:italic;font-size:20px;line-height:1.4;color:#f7e8f0">'+(opts.headline||'')+'</div>';
    }
    var loop=opts.loopLabel?'<div style="position:absolute;left:0;right:0;bottom:14px;text-align:center;font-family:Sora,sans-serif;font-weight:700;font-size:11px;letter-spacing:.06em;color:'+accent+'">'+opts.loopLabel+'</div>':'';
    return '<div style="position:relative;border-radius:18px;padding:30px 22px 38px;background:'+bg+';border:.5px solid rgba(255,255,255,.12);overflow:hidden;text-align:center;min-height:150px;display:flex;flex-direction:column;align-items:center;justify-content:center">'+
      inner+loop+
      '<div style="position:absolute;top:12px;left:14px;display:flex;align-items:center;gap:6px;opacity:.7">'+EYE+'<span style="font-family:Sora,sans-serif;font-weight:800;font-size:11px;letter-spacing:-.02em;color:#f7e8f0">shut<span style="color:'+accent+'">ap</span></span></div>'+
    '</div>';
  }

  // ---- share targets (real, per platform) ----
  function doPlatform(p, caption, url){
    var enc=encodeURIComponent, text=caption+'\n'+url;
    if(p==='native' && navigator.share){ navigator.share({text:caption,url:url}).catch(function(){}); return; }
    if(p==='x'){ window.open('https://twitter.com/intent/tweet?text='+enc(caption)+'&url='+enc(url),'_blank'); return; }
    if(p==='whatsapp'){ window.open('https://wa.me/?text='+enc(text),'_blank'); return; }
    if(p==='sms'){ window.open('sms:?&body='+enc(text),'_blank'); return; }
    if(p==='instagram'||p==='tiktok'){ copy(text); window.open(p==='instagram'?'https://instagram.com':'https://tiktok.com','_blank'); return; }
    copy(text);
  }
  function copy(t){ try{ navigator.clipboard.writeText(t); }catch(e){} }

  // brand logos (inline SVG, currentColor where mono)
  var LOGOS={
    native:'<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:17px;height:17px"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4"></path></svg>',
    sms:'<svg viewBox="0 0 24 24" fill="#fff" style="width:17px;height:17px"><path d="M12 2C6.5 2 2 5.8 2 10.5c0 2.5 1.3 4.7 3.3 6.2-.2 1.4-.9 2.8-1.9 3.9 1.7-.2 3.4-.8 4.8-1.7 1.2.3 2.5.5 3.8.5 5.5 0 10-3.8 10-8.5S17.5 2 12 2z"/></svg>',
    x:'<svg viewBox="0 0 24 24" fill="#fff" style="width:15px;height:15px"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>',
    whatsapp:'<svg viewBox="0 0 24 24" fill="#fff" style="width:17px;height:17px"><path d="M.057 24l1.687-6.163a11.867 11.867 0 01-1.587-5.946C.16 5.335 5.495 0 12.05 0a11.82 11.82 0 018.413 3.488 11.82 11.82 0 013.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 01-5.688-1.448zM6.597 20.13c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884a9.86 9.86 0 001.51 5.26l-.999 3.648zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.096 3.2 5.077 4.487.71.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/></svg>',
    instagram:'<svg viewBox="0 0 24 24" fill="#fff" style="width:17px;height:17px"><path d="M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41a3.72 3.72 0 01-1.38-.9 3.72 3.72 0 01-.9-1.38c-.16-.42-.36-1.06-.41-2.23C2.17 15.58 2.16 15.2 2.16 12s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.06-.36 2.23-.41C8.42 2.17 8.8 2.16 12 2.16zm0 3.68A6.16 6.16 0 1018.16 12 6.16 6.16 0 0012 5.84zm0 10.16A4 4 0 1116 12a4 4 0 01-4 4zm6.4-10.4a1.44 1.44 0 11-1.44-1.44 1.44 1.44 0 011.44 1.44z"/></svg>',
    tiktok:'<svg viewBox="0 0 24 24" fill="#fff" style="width:16px;height:16px"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1.04-.1z"/></svg>',
    copy:'<svg viewBox="0 0 24 24" fill="none" stroke="#f7e8f0" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:16px;height:16px"><rect x="9" y="9" width="13" height="13" rx="2"></rect><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"></path></svg>'
  };

  function platRow(caption, getUrl, onPosted){
    var has=!!navigator.share;
    var btns=[];
    if(has) btns.push(['native','share','#e7548a']);
    btns.push(['sms','Messages','#34C759'],['x','X','#0b080f'],['whatsapp','WhatsApp','#25D366'],['instagram','Instagram','linear-gradient(135deg,#feda75,#d62976 45%,#962fbf 75%,#4f5bd5)'],['tiktok','TikTok','#0b080f'],['copy','copy link','rgba(255,255,255,.10)']);
    var wrap=document.createElement('div');
    wrap.style.cssText='display:flex;flex-wrap:wrap;gap:10px;margin-top:14px';
    btns.forEach(function(b){
      var el=document.createElement('button');
      el.title=b[1];
      el.style.cssText='display:inline-flex;align-items:center;gap:8px;font-family:Sora,sans-serif;font-weight:700;font-size:12px;padding:9px 14px 9px 11px;border-radius:999px;cursor:pointer;border:none;color:#fff;transition:transform .12s;background:'+b[2];
      el.innerHTML='<span style="display:grid;place-items:center;width:18px;height:18px">'+(LOGOS[b[0]]||'')+'</span><span>'+b[1]+'</span>';
      el.addEventListener('mouseover',function(){ el.style.transform='translateY(-1px)'; });
      el.addEventListener('mouseout',function(){ el.style.transform='none'; });
      el.addEventListener('click',function(){ doPlatform(b[0], caption.value!==undefined?caption.value:caption, getUrl()); if(onPosted) onPosted(b[0]); });
      wrap.appendChild(el);
    });
    return wrap;
  }

  function showSheet(id, opts){
    ensureDefs();
    markSession(); bumpDaily(); track('offer_shown',id);
    var url = opts.url || location.origin;
    var ov=document.createElement('div');
    ov.setAttribute('data-sharesheet','');
    ov.style.cssText='position:fixed;inset:0;z-index:120;display:flex;align-items:flex-end;justify-content:center';
    var back=document.createElement('div');
    back.style.cssText='position:absolute;inset:0;background:rgba(10,5,12,.55);backdrop-filter:blur(5px);opacity:0;transition:opacity .25s';
    var sheet=document.createElement('div');
    sheet.style.cssText='position:relative;width:100%;max-width:520px;background:linear-gradient(180deg,#241019,#15090f);border:.5px solid rgba(255,255,255,.14);border-radius:24px 24px 0 0;padding:20px 20px 26px;transform:translateY(100%);transition:transform .34s cubic-bezier(.2,.8,.2,1);max-height:92vh;overflow-y:auto';
    // companion line
    var head='<div style="display:flex;gap:10px;align-items:flex-start;margin-bottom:15px">'+EYE+'<div style="flex:1;font-family:Newsreader,serif;font-style:italic;font-size:15.5px;line-height:1.5;color:#f7e8f0">'+(opts.companion||'want to share this?')+'</div></div>';
    sheet.innerHTML=head+artifact(opts);
    // caption
    var capWrap=document.createElement('div');
    capWrap.style.cssText='margin-top:14px';
    capWrap.innerHTML='<div style="font-family:Sora,sans-serif;font-weight:700;font-size:9.5px;letter-spacing:.14em;text-transform:uppercase;color:#9b8090;margin-bottom:6px">your caption · edit freely</div>';
    var cap=document.createElement('textarea');
    cap.rows=2; cap.value=opts.caption||'';
    cap.style.cssText='width:100%;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.14);border-radius:13px;padding:12px 14px;color:#f7e8f0;font-family:Newsreader,serif;font-style:italic;font-size:15px;resize:none;outline:none;line-height:1.45;box-sizing:border-box';
    var edited=false; cap.addEventListener('input',function(){ if(!edited){ edited=true; track('caption_edited',id);} cap.style.height='auto'; cap.style.height=cap.scrollHeight+'px'; });
    capWrap.appendChild(cap);
    sheet.appendChild(capWrap);
    // share row + not now
    var row=platRow(cap, function(){ return url; }, function(p){ track('posted',id,p); bubbleConfirm(sheet); });
    sheet.appendChild(row);
    var foot=document.createElement('div');
    foot.style.cssText='display:flex;align-items:center;justify-content:space-between;margin-top:14px;gap:10px';
    foot.innerHTML='<span style="font-family:Newsreader,serif;font-style:italic;font-size:12px;color:#9b8090">'+(opts.privacy||'only this card leaves — never your words or name.')+'</span>';
    var no=document.createElement('span');
    no.textContent='not now';
    no.style.cssText='font-family:Newsreader,serif;font-style:italic;font-size:13.5px;color:#9b8090;cursor:pointer;flex:none';
    no.addEventListener('click',function(){ markDismiss(id); track('dismissed',id); close(); });
    foot.appendChild(no);
    sheet.appendChild(foot);

    ov.appendChild(back); ov.appendChild(sheet);
    document.body.appendChild(ov);
    requestAnimationFrame(function(){ back.style.opacity='1'; sheet.style.transform='none'; });
    function close(){ back.style.opacity='0'; sheet.style.transform='translateY(100%)'; setTimeout(function(){ ov.remove(); },340); }
    back.addEventListener('click',function(){ markDismiss(id); track('dismissed',id); close(); });
    ov._close=close;
  }
  function bubbleConfirm(sheet){
    var c=sheet.querySelector('[data-shared-confirm]');
    if(c) return;
    var d=document.createElement('div'); d.setAttribute('data-shared-confirm','');
    d.style.cssText='margin-top:12px;font-family:Newsreader,serif;font-style:italic;font-size:13.5px;color:#7fd4a8;text-align:center';
    d.textContent='passed on. someone out there will feel less alone. ♥';
    sheet.appendChild(d);
  }

  window.ShutapShare = {
    offer: function(id, opts){
      opts = opts||{};
      if(!canFire(id, opts)) return false;
      showSheet(id, opts);
      return true;
    },
    // explicit user-triggered share (fallback, §22.4) — bypasses caps
    manual: function(opts){ opts=opts||{}; opts.force=true; showSheet(opts.trigger||'manual', opts); return true; },
    metrics: function(){ return getJSON('shutap_share_metrics',[]); }
  };
})();
