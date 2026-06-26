/* Shutap — Sign-In Sheet (§3.3 + app-shell interceptor).
   A bottom sheet that intercepts a contribution action when anon, authenticates
   (Google / Apple / Email), confirms 18+, mints a pseudonymous alias, then RESUMES
   the original action — without ever leaving the screen.

   window.ShutapAuth.requireAuth(onSuccess, trigger)
     - if signed in → onSuccess() immediately, returns true
     - else → opens the sheet; on success sets shutap_alias + terms, fires events, calls onSuccess()
   window.ShutapAuth.isSignedIn()  → bool
   window.ShutapAuth.alias()       → {name, emoji} | null
*/
(function(){
  if (window.ShutapAuth) return;

  function getAlias(){ try{ const r=localStorage.getItem('shutap_alias'); return r?JSON.parse(r):null; }catch(e){ return null; } }
  function track(t,p){ try{ if(window.ShutapFeedback) window.ShutapFeedback.track(t,p||{}); }catch(e){} }

  const EMO=['Quiet','Wistful','Defiant','Restless','Tender','Patient','Forlorn','Honest','Careful','Steady','Hopeful','Reluctant','Curious','Fierce','Gentle','Weary','Plainspoken','Soft'];
  const NAT=['Nigerian','Filipino','Brazilian','Kenyan','Indian','Ethiopian','Pakistani','Moroccan','Chilean','Polish','Cuban','Vietnamese','Lebanese','Indonesian','Ghanaian','Korean','Italian','Welsh','Turkish','Peruvian'];
  const CRE=[['Owl','🦉'],['Fox','🦊'],['Bear','🐻'],['Lion','🦁'],['Butterfly','🦋'],['Hedgehog','🦔'],['Swan','🦢'],['Wolf','🐺'],['Hawk','🦅'],['Crane','🕊'],['Fawn','🦌'],['Hare','🐇'],['Dove','🕊'],['Otter','🦦'],['Robin','🐦'],['Heron','🪿']];
  const r=a=>a[Math.floor(Math.random()*a.length)];

  const GOOGLE='<svg width="19" height="19" viewBox="0 0 24 24"><path fill="#4285F4" d="M23.745 12.27c0-.79-.07-1.54-.19-2.27h-11.3v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"/><path fill="#34A853" d="M12.255 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96h-3.98v3.09C3.515 21.3 7.565 24 12.255 24z"/><path fill="#FBBC05" d="M5.525 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62h-3.98a11.86 11.86 0 0 0 0 10.76l3.98-3.09z"/><path fill="#EA4335" d="M12.255 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C18.205 1.19 15.495 0 12.255 0c-4.69 0-8.74 2.7-10.71 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z"/></svg>';
  const APPLE='<svg width="19" height="19" viewBox="0 0 24 24" fill="#f7e8f0"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11"/></svg>';

  function mountSheet(onSuccess, trigger){
    track('signin_wall_hit', {trigger: trigger||'contribute'});
    let prev=document.getElementById('_authsheet'); if(prev) prev.remove();

    const root=document.createElement('div'); root.id='_authsheet';
    root.style.cssText='position:fixed;inset:0;z-index:120;display:flex;align-items:flex-end;justify-content:center;font-family:Inter,system-ui,sans-serif';
    const back=document.createElement('div');
    back.style.cssText='position:absolute;inset:0;background:rgba(10,5,14,.66);backdrop-filter:blur(7px);opacity:0;transition:opacity .35s';
    const sheet=document.createElement('div');
    sheet.style.cssText='position:relative;width:100%;max-width:460px;background:linear-gradient(165deg,#2a0d1a,#170a12);border:.5px solid rgba(255,255,255,.13);border-top-left-radius:26px;border-top-right-radius:26px;box-shadow:0 -20px 60px -10px rgba(70,12,40,.6);padding:26px 24px calc(28px + env(safe-area-inset-bottom));transform:translateY(110%);transition:transform .5s cubic-bezier(.2,.9,.25,1);max-height:92vh;overflow-y:auto';
    root.appendChild(back); root.appendChild(sheet); document.body.appendChild(root);
    requestAnimationFrame(()=>{ back.style.opacity='1'; sheet.style.transform='translateY(0)'; });

    const EYE='<svg viewBox="0 0 56 56" fill="none" style="width:34px;height:34px;display:block"><circle cx="28" cy="28" r="27" fill="rgba(231,84,138,.14)"/><rect x="15.25" y="16" width="11.5" height="24" rx="5.75" fill="url(#eyeG)"/><rect x="29.25" y="16" width="11.5" height="24" rx="5.75" fill="url(#eyeG)"/><ellipse cx="21" cy="29" rx="4" ry="5" fill="#2a0d18"/><ellipse cx="35" cy="29" rx="4" ry="5" fill="#2a0d18"/></svg>';
    // ensure eyeG gradient exists (pages already define it, but be safe)
    if(!document.querySelector('#eyeG')){
      const defs=document.createElementNS('http://www.w3.org/2000/svg','svg');
      defs.setAttribute('width','0'); defs.setAttribute('height','0'); defs.style.position='absolute';
      defs.innerHTML='<defs><radialGradient id="eyeG" cx="40%" cy="18%" r="75%"><stop offset="0%" stop-color="#fff"/><stop offset="20%" stop-color="#ffd0e8"/><stop offset="52%" stop-color="#f060a0"/><stop offset="100%" stop-color="#880040"/></radialGradient></defs>';
      document.body.appendChild(defs);
    }

    function close(resumed){ back.style.opacity='0'; sheet.style.transform='translateY(110%)'; setTimeout(()=>root.remove(),420); }
    back.addEventListener('click',()=>close(false));

    let dob={m:'',d:'',y:''};

    function stepAuth(){
      sheet.innerHTML=
        '<div style="display:flex;justify-content:center;margin-bottom:14px">'+EYE+'</div>'+
        '<div style="text-align:center;font-family:Newsreader,serif;font-style:italic;font-size:22px;line-height:1.35;color:#f7e8f0;margin-bottom:7px">wanna keep this?</div>'+
        '<div style="text-align:center;font-family:Newsreader,serif;font-style:italic;font-size:15px;color:#c4a0b2;line-height:1.5;margin-bottom:22px">grab a spot — pseudonymous, your real name never shows \uD83D\uDD12</div>'+
        '<div style="display:flex;flex-direction:column;gap:10px">'+
          '<div data-a="google" role="button" style="display:flex;align-items:center;justify-content:center;gap:10px;width:100%;padding:14px;border-radius:14px;border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.06);cursor:pointer;font-family:Sora,sans-serif;font-weight:600;font-size:14px;color:#f7e8f0">'+GOOGLE+' continue with Google</div>'+
          '<div data-a="apple" role="button" style="display:flex;align-items:center;justify-content:center;gap:10px;width:100%;padding:14px;border-radius:14px;border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.06);cursor:pointer;font-family:Sora,sans-serif;font-weight:600;font-size:14px;color:#f7e8f0">'+APPLE+' continue with Apple</div>'+
          '<div style="display:flex;align-items:center;gap:11px;margin:4px 0"><div style="flex:1;height:1px;background:rgba(255,255,255,.12)"></div><span style="font-family:Newsreader,serif;font-style:italic;font-size:12px;color:#9e7a8c">or</span><div style="flex:1;height:1px;background:rgba(255,255,255,.12)"></div></div>'+
          '<input data-email type="email" placeholder="your email" style="width:100%;box-sizing:border-box;padding:14px;border-radius:14px;border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.04);color:#f7e8f0;font-family:Inter,sans-serif;font-size:14px;outline:none">'+
          '<div data-a="email" role="button" style="text-align:center;width:100%;padding:14px;border-radius:14px;background:#e7548a;cursor:pointer;font-family:Sora,sans-serif;font-weight:700;font-size:14px;color:#fff">continue with email</div>'+
        '</div>'+
        '<div style="text-align:center;font-family:Newsreader,serif;font-style:italic;font-size:12px;color:#9e7a8c;margin-top:16px;line-height:1.5">by continuing you confirm you\u2019re 18+ and agree to our <a href="Legal.dc.html#terms" target="_blank" style="color:#c4a0b2">Terms</a> &amp; <a href="Legal.dc.html#privacy" target="_blank" style="color:#c4a0b2">Privacy</a>.<br>your real name is never attached to anything here.</div>';
      sheet.querySelectorAll('[data-a]').forEach(b=>b.addEventListener('click',()=>{
        if(b.getAttribute('data-a')==='email'){ const em=sheet.querySelector('[data-email]'); if(!em.value.trim()||!/.+@.+\..+/.test(em.value)){ em.style.borderColor='#e7548a'; em.focus(); return; } }
        stepAge();
      }));
    }

    function stepAge(){
      const months=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      const yNow=new Date().getFullYear();
      const opt=(arr,sel,ph)=>'<option value="" '+(sel?'':'selected')+' disabled>'+ph+'</option>'+arr.map(v=>'<option value="'+v.v+'">'+v.l+'</option>').join('');
      const mOpts=months.map((m,i)=>({v:i,l:m}));
      const dOpts=Array.from({length:31},(_,i)=>({v:i+1,l:i+1}));
      const yOpts=Array.from({length:90},(_,i)=>({v:yNow-18-i,l:yNow-18-i}));
      const selCss='flex:1;padding:13px 10px;border-radius:13px;border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.05);color:#f7e8f0;font-family:Inter,sans-serif;font-size:14px;outline:none;-webkit-appearance:none;appearance:none';
      sheet.innerHTML=
        '<div style="display:flex;justify-content:center;margin-bottom:14px">'+EYE+'</div>'+
        '<div style="text-align:center;font-family:Newsreader,serif;font-style:italic;font-size:22px;line-height:1.35;color:#f7e8f0;margin-bottom:7px">one small thing first.</div>'+
        '<div style="text-align:center;font-family:Newsreader,serif;font-style:italic;font-size:15px;color:#c4a0b2;line-height:1.5;margin-bottom:20px">the room is for grown-ups. when\u2019s your birthday?</div>'+
        '<div style="display:flex;gap:9px;margin-bottom:6px">'+
          '<select data-m style="'+selCss+'">'+opt(mOpts,false,'month')+'</select>'+
          '<select data-d style="'+selCss+'">'+opt(dOpts,false,'day')+'</select>'+
          '<select data-y style="'+selCss+'">'+opt(yOpts,false,'year')+'</select>'+
        '</div>'+
        '<div data-err style="font-family:Newsreader,serif;font-style:italic;font-size:13.5px;color:#e7548a;min-height:20px;text-align:center;margin:6px 0"></div>'+
        '<label style="display:flex;gap:10px;align-items:flex-start;margin:6px 0 16px;cursor:pointer"><input data-terms type="checkbox" style="margin-top:3px;width:16px;height:16px;accent-color:#e7548a"><span style="font-family:Newsreader,serif;font-style:italic;font-size:13px;color:#c4a0b2;line-height:1.45">i\u2019m 18+ and i agree to the terms & privacy.</span></label>'+
        '<div data-confirm role="button" style="text-align:center;width:100%;padding:15px;border-radius:14px;background:#e7548a;cursor:pointer;font-family:Sora,sans-serif;font-weight:700;font-size:15px;color:#fff">continue</div>'+
        '<div data-back role="button" style="text-align:center;margin-top:12px;font-family:Newsreader,serif;font-style:italic;font-size:13.5px;color:#9e7a8c;cursor:pointer">back</div>';
      sheet.querySelector('[data-back]').addEventListener('click',stepAuth);
      sheet.querySelector('[data-confirm]').addEventListener('click',()=>{
        const m=sheet.querySelector('[data-m]').value, d=sheet.querySelector('[data-d]').value, y=sheet.querySelector('[data-y]').value;
        const err=sheet.querySelector('[data-err]'); const terms=sheet.querySelector('[data-terms]').checked;
        if(m===''||d===''||y===''){ err.textContent='pick your full birthday.'; return; }
        const dobDate=new Date(+y,+m,+d), now=new Date();
        let age=now.getFullYear()-dobDate.getFullYear()-(now<new Date(now.getFullYear(),dobDate.getMonth(),dobDate.getDate())?1:0);
        if(age<18){ err.textContent='the room is for people 18 and over.'; return; }
        if(!terms){ err.textContent='please confirm 18+ and the terms.'; return; }
        stepMint();
      });
    }

    function stepMint(){
      const emo=r(EMO), nat=r(NAT), cre=r(CRE);
      const name=emo+' '+nat+' '+cre[0];
      sheet.innerHTML=
        '<div style="text-align:center;padding:8px 0 4px">'+
        '<div style="display:flex;justify-content:center;margin-bottom:16px">'+EYE+'</div>'+
        '<div style="font-family:Newsreader,serif;font-style:italic;font-size:15px;color:#c4a0b2;margin-bottom:10px">the room will know you as</div>'+
        '<div style="font-family:Sora,sans-serif;font-weight:800;font-size:23px;color:#f7e8f0;line-height:1.25;margin-bottom:6px">'+cre[1]+' '+name+'</div>'+
        '<div style="font-family:Newsreader,serif;font-style:italic;font-size:13.5px;color:#9e7a8c;margin-bottom:22px">never your real name. always this. \uD83D\uDD12</div>'+
        '<div data-keep role="button" style="width:100%;padding:15px;border-radius:14px;background:#e7548a;cursor:pointer;font-family:Sora,sans-serif;font-weight:700;font-size:15px;color:#fff">this is me \u2192</div>'+
        '<div data-respin role="button" style="margin-top:12px;font-family:Newsreader,serif;font-style:italic;font-size:13.5px;color:#9e7a8c;cursor:pointer">give me another</div>'+
        '</div>';
      sheet.querySelector('[data-respin]').addEventListener('click',stepMint);
      sheet.querySelector('[data-keep]').addEventListener('click',()=>{
        try{
          localStorage.setItem('shutap_alias', JSON.stringify({name, emoji:cre[1]}));
          localStorage.setItem('shutap_terms', JSON.stringify({version:'mvp-1', at:Date.now()}));
        }catch(e){}
        track('signed_in', {trigger:trigger||'contribute'});
        close(true);
        setTimeout(()=>{ try{ onSuccess&&onSuccess(); }catch(e){} }, 360);
      });
    }

    stepAuth();
  }

  window.ShutapAuth={
    isSignedIn:()=>!!getAlias(),
    alias:getAlias,
    requireAuth:function(onSuccess, trigger){
      if(getAlias()){ try{ onSuccess&&onSuccess(); }catch(e){} return true; }
      mountSheet(onSuccess, trigger);
      return false;
    }
  };
})();
