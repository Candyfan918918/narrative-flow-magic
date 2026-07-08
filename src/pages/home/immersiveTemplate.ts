// Pass 1 bridge — only the not-yet-ported sections (rooms strip, FAQ,
// finale, footer, companion sheet) remain here. Pass 2 deletes this file.
export const IMMERSIVE_REST_HTML = `
<!-- ══ ROOMS STRIP ══ -->
<section data-screen-label="Rooms strip" style="position:relative;background:#fdf0f5;padding:clamp(80px,11vh,130px) 0 clamp(56px,8vh,90px);overflow:hidden">
  <div style="max-width:1360px;margin:0 auto;padding:0 30px 26px;display:flex;align-items:baseline;justify-content:space-between;gap:14px;flex-wrap:wrap">
    <h2 data-rv="swipe-l" data-words="" style="font-family:'Sora',sans-serif;font-weight:800;font-size:clamp(28px,3.6vw,54px);letter-spacing:-.04em;margin:0;color:#0b080f">rooms open <em style="font-family:'Newsreader',serif;font-style:italic;font-weight:400;color:#c1216b">right now.</em></h2>
    <a href="/stream" data-link="/stream" data-hover="" style="font-family:'Newsreader',serif;font-style:italic;font-size:16px">all rooms →</a>
  </div>
  <div data-strip="" style="display:flex;gap:18px;overflow-x:auto;padding:6px 30px 22px;cursor:grab;user-select:none">
    <!--ROOMS-->
  </div>
</section>

<!-- ══ FAQ ══ -->
<section data-screen-label="FAQ" style="position:relative;background:#fdf0f5;padding:clamp(46px,7vh,80px) 22px clamp(36px,5vh,60px)">
  <div style="max-width:740px;margin:0 auto">
    <div data-rv="">
      <div style="font-family:'Sora',sans-serif;font-weight:700;font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:#e7548a;margin-bottom:14px">what is shutap</div>
      <h2 data-words="" style="font-family:'Sora',sans-serif;font-weight:800;font-size:clamp(26px,3.4vw,44px);line-height:1.08;letter-spacing:-.03em;margin:0 0 16px;color:#0b080f">questions, <em style="font-family:'Newsreader',serif;font-style:italic;font-weight:400;color:#c1216b">answered.</em></h2>
      <p style="font-family:'Newsreader',serif;font-style:italic;font-size:17px;line-height:1.65;color:#2e1a26;margin:0 0 10px;max-width:52ch">a pseudonymous place to vent about relationships, marriage, family, and work — and see what actually happened next for people who lived your exact thing.</p>
      <p style="font-family:'Newsreader',serif;font-style:italic;font-size:15.5px;line-height:1.65;color:#6b4a5c;margin:0 0 24px;max-width:52ch"><a href="#spill" data-cta="spill">spill it</a> — one question at a time, the companion helps you find the words. or <a href="#scan" data-cta="scan">scan it</a> — sixty seconds of questions, a private read saved just for you.</p>
      <div style="display:flex;flex-direction:column">
        <details style="border-top:.5px solid rgba(11,8,15,.08);padding:15px 0">
          <summary style="font-family:'Sora',sans-serif;font-weight:600;font-size:14px;cursor:pointer;color:#0b080f;display:flex;justify-content:space-between;align-items:center;list-style:none">is this anonymous?<span style="color:#e7548a;font-size:20px;font-weight:300">+</span></summary>
          <p style="font-family:'Newsreader',serif;font-style:italic;font-size:15px;color:#6b4a5c;line-height:1.6;margin:10px 0 0;max-width:52ch">pseudonymous. you get a persistent alias — something like 🦉 Quiet Indonesian Owl — generated the first time you sit down. your real name is never attached to anything, anywhere, including us.</p>
        </details>
        <details style="border-top:.5px solid rgba(11,8,15,.08);padding:15px 0">
          <summary style="font-family:'Sora',sans-serif;font-weight:600;font-size:14px;cursor:pointer;color:#0b080f;display:flex;justify-content:space-between;align-items:center;list-style:none">what happens when i vent?<span style="color:#e7548a;font-size:20px;font-weight:300">+</span></summary>
          <p style="font-family:'Newsreader',serif;font-style:italic;font-size:15px;color:#6b4a5c;line-height:1.6;margin:10px 0 0;max-width:52ch">you open a room. people who've lived your exact situation respond, relate, and share what actually happened next for them. your story, your rules — you stay in control of what's shown.</p>
        </details>
        <details style="border-top:.5px solid rgba(11,8,15,.08);padding:15px 0">
          <summary style="font-family:'Sora',sans-serif;font-weight:600;font-size:14px;cursor:pointer;color:#0b080f;display:flex;justify-content:space-between;align-items:center;list-style:none">what does the companion do?<span style="color:#e7548a;font-size:20px;font-weight:300">+</span></summary>
          <p style="font-family:'Newsreader',serif;font-style:italic;font-size:15px;color:#6b4a5c;line-height:1.6;margin:10px 0 0;max-width:52ch">it helps you put words to it. asks one question at a time, reflects back what it heard, and helps you decide whether you want the room to hear it — or whether you just needed to say it to yourself first.</p>
        </details>
        <details style="border-top:.5px solid rgba(11,8,15,.08);border-bottom:.5px solid rgba(11,8,15,.08);padding:15px 0">
          <summary style="font-family:'Sora',sans-serif;font-weight:600;font-size:14px;cursor:pointer;color:#0b080f;display:flex;justify-content:space-between;align-items:center;list-style:none">what happens after I share?<span style="color:#e7548a;font-size:20px;font-weight:300">+</span></summary>
          <p style="font-family:'Newsreader',serif;font-style:italic;font-size:15px;color:#6b4a5c;line-height:1.6;margin:10px 0 0;max-width:52ch">your story opens a room. people can sit in it, relate to it, react to it. when the room goes quiet for 72 hours — it rests. if it's carried enough resonance, it finds its way into the hall of fame.</p>
        </details>
      </div>
    </div>
  </div>
</section>

<!-- ══ FINALE ══ -->
<section data-screen-label="Finale" style="position:relative;background:#fdf0f5;padding:60px 30px 40px;overflow:hidden">
  <div style="max-width:1360px;margin:0 auto;text-align:center;position:relative">
    <div data-rv="zoom" style="padding:60px 0 70px">
      <div style="font-family:'Newsreader',serif;font-style:italic;font-size:clamp(17px,1.6vw,22px);color:#6b4a5c;margin-bottom:18px">ready when you are.</div>
      <h2 data-words="" style="font-family:'Sora',sans-serif;font-weight:800;font-size:clamp(44px,8vw,110px);line-height:1;letter-spacing:-.05em;margin:0 0 44px;color:#0b080f">say it <em style="font-family:'Newsreader',serif;font-style:italic;font-weight:400;background:linear-gradient(92deg,#e7548a,#890041 70%);-webkit-background-clip:text;background-clip:text;color:transparent">here.</em></h2>
      <a href="/welcome" data-link="/welcome" data-hover="" data-mag="" style="display:inline-flex;align-items:center;gap:12px;font-family:'Sora',sans-serif;font-weight:700;font-size:18px;color:#fff;background:linear-gradient(155deg,#ff7eb3,#e7548a 55%,#c1216b);border-radius:999px;padding:22px 46px;box-shadow:0 20px 44px -16px rgba(193,33,107,.6)">join shutap →</a>
    </div>
    <div style="border-top:.5px solid rgba(11,8,15,.1);padding-top:24px;display:flex;flex-direction:column;gap:14px">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:14px;flex-wrap:wrap">
        <span style="font-family:'Sora',sans-serif;font-weight:800;font-size:16px;letter-spacing:-.04em;color:#0b080f">shut<span style="color:#e7548a">ap</span> <span style="font-family:'Newsreader',serif;font-style:italic;font-weight:400;font-size:13px;color:#9e7a8c;letter-spacing:0">— a room for what you're carrying.</span></span>
        <div style="display:flex;flex-wrap:wrap;gap:8px 18px;font-family:'Newsreader',serif;font-style:italic;font-size:14px">
          <a href="/stream" data-link="/stream" data-hover="">rooms</a>
          <a href="/halls" data-link="/halls" data-hover="">halls</a>
          <a href="/vent/family" data-link="/vent/family" data-hover="">topics</a>
        </div>
      </div>
      <div style="display:flex;flex-wrap:wrap;gap:7px 16px;justify-content:center;font-family:'Inter',sans-serif;font-size:12px">
        <a href="/terms" data-link="/terms" data-hover="" style="color:#6b4a5c">Terms</a>
        <a href="/privacy" data-link="/privacy" data-hover="" style="color:#6b4a5c">Privacy</a>
        <a href="/guidelines" data-link="/guidelines" data-hover="" style="color:#6b4a5c">Guidelines</a>
        <a href="/safety" data-link="/safety" data-hover="" style="color:#6b4a5c">Safety</a>
        <a href="/ai-disclosure" data-link="/ai-disclosure" data-hover="" style="color:#6b4a5c">AI Disclosure</a>
        <a href="/legal" data-link="/legal" data-hover="" style="color:#6b4a5c">Disclaimer</a>
        <a href="mailto:hello@shutap.com" data-hover="" style="color:#6b4a5c">Contact</a>
      </div>
      <div style="text-align:center;font-family:'Newsreader',serif;font-style:italic;font-size:12px;color:#9e7a8c;line-height:1.7">18+ · pseudonymous · your real name never shows · your story, your rules 🤍<br>shutap is your group chat, not your therapist — not a medical or legal service. in an emergency, call or text 988 (US).</div>
      <div style="text-align:center;font-family:'Sora',sans-serif;font-weight:700;font-size:10px;letter-spacing:.18em;text-transform:uppercase;color:#6b4a5c">you don't have to shut up here</div>
    </div>
  </div>
</section>

<div data-comp-action="open" role="button" tabindex="0" aria-label="Ask the companion" title="ask the companion" style="position:fixed;left:calc(50% - 29px);bottom:24px;z-index:60;width:58px;height:58px;border-radius:50%;background:rgba(231,84,138,0.18);backdrop-filter:blur(4px);box-shadow:0 12px 30px -8px rgba(60,10,30,.35);display:grid;place-items:center;cursor:pointer;user-select:none">
  <svg viewBox="0 0 56 56" fill="none" style="width:32px;height:32px;display:block;pointer-events:none"><rect x="15.25" y="16" width="11.5" height="24" rx="5.75" fill="url(#eyeG2)"></rect><rect x="29.25" y="16" width="11.5" height="24" rx="5.75" fill="url(#eyeG2)"></rect><ellipse cx="21" cy="29" rx="4" ry="5" fill="url(#pupG2)"></ellipse><ellipse cx="35" cy="29" rx="4" ry="5" fill="url(#pupG2)"></ellipse></svg>
</div>

<!-- COMPANION SHEET (in-page) -->
<div data-comp="root" style="position:fixed;inset:0;z-index:90;display:none;align-items:flex-end;justify-content:center">
  <div data-comp="back" style="position:absolute;inset:0;background:rgba(10,6,14,.72);backdrop-filter:blur(8px);opacity:0;transition:opacity .3s"></div>
  <div style="position:relative;width:100%;max-width:560px;background:linear-gradient(170deg,#1c1024,#100c14 70%);border:.5px solid rgba(255,255,255,.12);border-radius:26px 26px 0 0;padding:22px 22px 26px;transform:translateY(30px);opacity:0;transition:transform .35s cubic-bezier(.2,.8,.2,1),opacity .3s" data-comp="sheet">
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:4px">
      <svg viewBox="0 0 56 56" fill="none" style="width:26px;height:26px;flex:none"><rect x="15.25" y="16" width="11.5" height="24" rx="5.75" fill="url(#eyeG2)"></rect><rect x="29.25" y="16" width="11.5" height="24" rx="5.75" fill="url(#eyeG2)"></rect><ellipse cx="21" cy="29" rx="4" ry="5" fill="url(#pupG2)"></ellipse><ellipse cx="35" cy="29" rx="4" ry="5" fill="url(#pupG2)"></ellipse></svg>
      <div style="flex:1;font-family:'Sora',sans-serif;font-weight:700;font-size:14px;color:#fff">the companion</div>
      <div data-comp-action="close" role="button" style="font-family:'Newsreader',serif;font-style:italic;font-size:14px;color:#aaa3e8;cursor:pointer;padding:4px 8px">close</div>
    </div>
    <div style="font-family:'Newsreader',serif;font-style:italic;font-size:12.5px;color:#8d86c9;margin-bottom:14px">an ai — not a human, not a therapist. it listens, reflects, finds you a room.</div>
    <div data-comp="log" style="max-height:38vh;overflow-y:auto;display:flex;flex-direction:column;gap:10px;margin-bottom:14px"></div>
    <div style="display:flex;align-items:flex-end;gap:10px;background:rgba(255,255,255,.05);border:.5px solid rgba(255,255,255,.14);border-radius:16px;padding:10px 12px">
      <textarea data-comp="input" rows="1" placeholder="tell me what's going on…" style="flex:1;background:none;border:none;outline:none;resize:none;font-family:'Newsreader',serif;font-style:italic;font-size:15.5px;color:#f3eefc;line-height:1.5;min-height:24px;max-height:110px"></textarea>
      <div data-comp-action="send" role="button" style="font-family:'Sora',sans-serif;font-weight:700;font-size:13px;color:#100c14;background:#e7548a;border-radius:999px;padding:8px 16px;cursor:pointer;flex:none">send</div>
    </div>
    <a href="/mirror" data-link="/mirror" style="margin-top:13px;display:flex;align-items:center;gap:11px;background:rgba(233,192,106,.08);border:.5px solid rgba(233,192,106,.3);border-radius:14px;padding:12px 14px;text-decoration:none">
      <span style="font-size:17px">✦</span>
      <span style="flex:1"><span style="display:block;font-family:'Sora',sans-serif;font-weight:700;font-size:13px;color:#e9c06a">the mirror</span><span style="display:block;font-family:'Newsreader',serif;font-style:italic;font-size:12.5px;color:#b9a67e">your patterns, read as cards</span></span>
      <span style="font-family:'Newsreader',serif;font-style:italic;font-size:13px;color:#e9c06a">open →</span>
    </a>
  </div>
</div>
`;
