// Auto-copied from design reference; DO NOT hand-edit style values.
export const IMMERSIVE_HTML = `<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>
  <radialGradient id="eyeG2" cx="40%" cy="18%" r="75%"><stop offset="0%" stop-color="#fff"></stop><stop offset="18%" stop-color="#ffd0e8"></stop><stop offset="48%" stop-color="#f060a0"></stop><stop offset="78%" stop-color="#c0206a"></stop><stop offset="100%" stop-color="#880040"></stop></radialGradient>
  <radialGradient id="pupG2" cx="50%" cy="55%" r="58%"><stop offset="0%" stop-color="#3a1020"></stop><stop offset="100%" stop-color="#060106"></stop></radialGradient>
</defs></svg>

<!-- ══ PRELOADER ══ -->
<div data-pre="" style="position:fixed;inset:0;z-index:100;background:#100c14;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:26px;transition:opacity .7s cubic-bezier(.6,0,.3,1),visibility .7s">
  <span style="width:120px;height:82px;display:block;animation:eblink 2.2s infinite;transform-origin:center">
    <svg viewBox="0 0 140 96" fill="none" style="display:block;width:100%;height:100%">
      <rect x="16" y="6" width="56" height="84" rx="28" fill="url(#eyeG2)"></rect>
      <rect x="84" y="6" width="56" height="84" rx="28" fill="url(#eyeG2)"></rect>
      <ellipse data-prepup="" cx="44" cy="62" rx="19" ry="24" fill="url(#pupG2)"></ellipse>
      <ellipse data-prepup="" cx="112" cy="62" rx="19" ry="24" fill="url(#pupG2)"></ellipse>
    </svg>
  </span>
  <div style="font-family:'Newsreader',serif;font-style:italic;font-size:clamp(18px,2.4vw,24px);color:#f7e8f0">shutap. <em style="color:#e7548a">speak up.</em></div>
</div>


<!-- ══ HEADER ══ -->
<header data-hdr="" style="position:fixed;top:0;left:0;right:0;z-index:50;transition:background .35s,backdrop-filter .35s,box-shadow .35s">
  <div style="max-width:1560px;margin:0 auto;padding:20px 30px;display:flex;align-items:center;justify-content:space-between;gap:12px">
    <a href="/" data-link="/" data-hover="" style="display:flex;align-items:center;gap:10px;color:inherit">
      <span style="width:34px;height:24px;display:block;animation:eblink 3.4s infinite;transform-origin:center">
        <svg viewBox="0 0 140 96" fill="none" style="display:block;width:100%;height:100%">
          <rect x="16" y="6" width="56" height="84" rx="28" fill="url(#eyeG2)"></rect>
          <rect x="84" y="6" width="56" height="84" rx="28" fill="url(#eyeG2)"></rect>
          <ellipse cx="44" cy="62" rx="19" ry="24" fill="url(#pupG2)"></ellipse>
          <ellipse cx="112" cy="62" rx="19" ry="24" fill="url(#pupG2)"></ellipse>
        </svg>
      </span>
      <span data-brandword="" style="font-family:'Sora',sans-serif;font-weight:800;font-size:20px;letter-spacing:-.04em;color:#0b080f;transition:color .4s">shut<span style="color:#e7548a">ap</span></span>
    </a>
    <nav style="display:flex;align-items:center;gap:6px">
      <a href="/stream" data-link="/stream" data-hover="" data-navlink="" style="font-family:'Newsreader',serif;font-style:italic;font-size:15px;color:#6b4a5c;padding:8px 14px;transition:color .4s">rooms</a>
      <a href="/halls" data-link="/halls" data-hover="" data-navlink="" style="font-family:'Newsreader',serif;font-style:italic;font-size:15px;color:#6b4a5c;padding:8px 14px;transition:color .4s">halls</a>
      <a href="/welcome" data-link="/welcome" data-hover="" data-mag="" style="display:inline-block;font-family:'Sora',sans-serif;font-weight:700;font-size:13px;color:#fff;background:#0b080f;border-radius:999px;padding:11px 22px;transition:background .3s" style-hover="background:#c1216b">join →</a>
    </nav>
  </div>
</header>

<main>

<!-- ══ HERO ══ -->
<section data-screen-label="Hero" style="position:relative;min-height:100vh;display:flex;flex-direction:column;justify-content:center;overflow:hidden;padding:clamp(76px,10vh,110px) clamp(18px,4vw,30px) clamp(50px,8vh,80px);scroll-snap-align:start">
  <div style="position:absolute;inset:-30% -10% auto;height:90vh;background:radial-gradient(ellipse at 50% 40%,rgba(231,84,138,.13),transparent 60%);pointer-events:none"></div>

  <div data-heroinner="" style="max-width:1560px;margin:0 auto;width:100%;position:relative;will-change:transform,opacity">
    <div style="display:flex;justify-content:center;margin-bottom:clamp(18px,3vh,40px)">
      <span data-heroeyes="" style="width:clamp(110px,min(20vw,20vh),270px);display:block">
        <span style="display:block;animation:eblink 4.6s infinite;transform-origin:center">
        <svg viewBox="0 0 140 96" fill="none" style="display:block;width:100%;height:auto;filter:drop-shadow(0 24px 48px rgba(193,33,107,.35))">
          <rect x="16" y="6" width="56" height="84" rx="28" fill="url(#eyeG2)"></rect>
          <rect x="84" y="6" width="56" height="84" rx="28" fill="url(#eyeG2)"></rect>
          <ellipse data-pup="" cx="44" cy="62" rx="19" ry="24" fill="url(#pupG2)"></ellipse>
          <ellipse data-pup="" cx="112" cy="62" rx="19" ry="24" fill="url(#pupG2)"></ellipse>
          <path d="M44 22 C41 18 35 18 35 24 C35 30 44 36 44 36 C44 36 53 30 53 24 C53 18 47 18 44 22Z" fill="#fff" opacity=".95"></path>
          <path d="M112 22 C109 18 103 18 103 24 C103 30 112 36 112 36 C112 36 121 30 121 24 C121 18 115 18 112 22Z" fill="#fff" opacity=".95"></path>
        </svg>
        </span>
      </span>
    </div>

    <h1 data-heroh1="" style="font-family:'Sora',sans-serif;font-weight:800;font-size:clamp(36px,min(7vw,9.5vh),96px);line-height:1;letter-spacing:-.045em;margin:0;color:#0b080f;text-align:center;will-change:transform">
      <span style="display:block">
        <span style="display:inline-block;overflow:hidden;vertical-align:top"><span data-wr="" style="display:inline-block">finally,</span></span>
        <span style="display:inline-block;overflow:hidden;vertical-align:top"><span data-wr="" style="display:inline-block">somewhere</span></span>
        <span style="display:inline-block;overflow:hidden;vertical-align:top"><span data-wr="" style="display:inline-block">to</span></span>
      </span>
      <span style="display:block;overflow:hidden"><span data-wr="" style="display:inline-block;font-family:'Newsreader',serif;font-style:italic;font-weight:400;letter-spacing:-.02em;background:linear-gradient(92deg,#e7548a,#890041 70%);-webkit-background-clip:text;background-clip:text;color:transparent;padding:0 .06em .08em">not shut up.</span></span>
    </h1>

    <div data-rv="zoom" style="display:flex;flex-direction:column;align-items:center;gap:clamp(14px,2.6vh,26px);margin-top:clamp(18px,3.4vh,44px)">
      <p style="font-family:'Newsreader',serif;font-style:italic;font-size:clamp(17px,1.6vw,21px);line-height:1.55;color:#4a3040;max-width:44ch;margin:0;text-align:center">venting is free therapy — and you're not the only one who's been through this. spill it; someone in here has lived your exact thing.</p>
      <div style="display:flex;gap:14px;flex-wrap:wrap;justify-content:center">
        <a href="#spill" data-cta="spill" data-hover="" data-mag="" style="display:inline-flex;align-items:center;gap:10px;font-family:'Sora',sans-serif;font-weight:700;font-size:16px;color:#fff;background:linear-gradient(155deg,#ff7eb3,#e7548a 55%,#c1216b);border-radius:999px;padding:18px 34px;box-shadow:0 16px 36px -14px rgba(193,33,107,.6)">spill it <span style="font-weight:400">→</span></a>
        <a href="/stream" data-link="/stream" data-hover="" data-mag="" style="display:inline-flex;align-items:center;gap:10px;font-family:'Sora',sans-serif;font-weight:700;font-size:16px;color:#c1216b;background:#fff;border:1.5px solid rgba(231,84,138,.35);border-radius:999px;padding:18px 34px;transition:border-color .3s" style-hover="border-color:#e7548a">sit in a room</a>
      </div>
      <div style="display:inline-flex;align-items:center;gap:8px;font-family:'Sora',sans-serif;font-weight:600;font-size:11px;letter-spacing:.2em;text-transform:uppercase;color:#e7548a"><span style="width:7px;height:7px;border-radius:50%;background:#e7548a;animation:breathe 2.8s ease-in-out infinite;display:block"></span><span data-livecount="">31</span>&nbsp;rooms open now</div>
    </div>
  </div>

  <div style="position:absolute;bottom:26px;left:50%;transform:translateX(-50%);display:flex;flex-direction:column;align-items:center;gap:8px;color:#9e7a8c">
    <span style="font-family:'Newsreader',serif;font-style:italic;font-size:13px">scroll</span>
    <span style="display:block;width:1.5px;height:34px;background:linear-gradient(#e7548a,transparent);animation:scrollHint 1.8s ease-in-out infinite"></span>
  </div>
</section>

<!-- ══ CHAPTERS (sticky stack) ══ -->
<div data-screen-label="Chapters" style="background:#100c14">

  <!-- 01 SPILL -->
  <section data-screen-label="01 Spill" class="chsec" style="position:relative;min-height:96vh;scroll-snap-align:start;background:#fdf0f5;display:flex;align-items:center;overflow:hidden">
    <div class="chgrid">
      <div data-rv="swipe-l">
        <div style="font-family:'Sora',sans-serif;font-weight:700;font-size:12px;letter-spacing:.24em;text-transform:uppercase;color:#e7548a;margin-bottom:22px">chapter 01 — spill it</div>
        <h2 data-words="" style="font-family:'Sora',sans-serif;font-weight:800;font-size:clamp(30px,3.8vw,54px);line-height:1.08;letter-spacing:-.04em;margin:0 0 24px;color:#0b080f">say the thing you can't say <em style="font-family:'Newsreader',serif;font-style:italic;font-weight:400;color:#c1216b">anywhere else.</em></h2>
        <p style="font-family:'Newsreader',serif;font-style:italic;font-size:clamp(16px,1.4vw,20px);line-height:1.6;color:#4a3040;max-width:44ch;margin:0 0 32px">tell your story — it opens a room the world can sit in. people who've lived your exact thing show up, relate, and tell you what actually happened next.</p>
        <a href="#spill" data-cta="spill" data-hover="" data-mag="" style="display:inline-flex;align-items:center;gap:10px;font-family:'Sora',sans-serif;font-weight:700;font-size:15px;color:#fff;background:#0b080f;border-radius:999px;padding:16px 30px;transition:background .3s" style-hover="background:#c1216b">open a room →</a>
      </div>
      <div data-rv="pop" style="display:flex;justify-content:center">
        <div data-tilt="" style="width:min(380px,100%);background:linear-gradient(160deg,#2e0d1a,#1a0a12);border:1px solid rgba(255,255,255,.1);border-radius:24px;padding:24px;box-shadow:0 40px 90px -40px rgba(60,10,30,.65);will-change:transform">
          <div style="display:flex;align-items:center;gap:9px;margin-bottom:16px">
            <svg viewBox="0 0 56 56" fill="none" style="width:24px;height:24px;flex:none"><rect x="15.25" y="16" width="11.5" height="24" rx="5.75" fill="url(#eyeG2)"></rect><rect x="29.25" y="16" width="11.5" height="24" rx="5.75" fill="url(#eyeG2)"></rect><ellipse cx="21" cy="29" rx="4" ry="5" fill="url(#pupG2)"></ellipse><ellipse cx="35" cy="29" rx="4" ry="5" fill="url(#pupG2)"></ellipse></svg>
            <span style="font-family:'Sora',sans-serif;font-weight:700;font-size:13px;color:#fff">spilling it</span>
            <span style="margin-left:auto;font-family:'Newsreader',serif;font-style:italic;font-size:12px;color:#9e7a8c">the interview · sample</span>
          </div>
          <div style="display:flex;flex-direction:column;gap:10px">
            <div data-sp="" style="align-self:flex-start;max-width:88%;background:rgba(255,255,255,.07);color:#e9dce4;border-radius:16px 16px 16px 5px;padding:10px 14px;font-family:'Newsreader',serif;font-style:italic;font-size:14.5px;line-height:1.5;opacity:0;transform:translateY(8px);transition:opacity .5s,transform .5s">i'm listening. what happened?</div>
            <div data-sp="" style="align-self:flex-end;max-width:88%;background:#e7548a;color:#fff;border-radius:16px 16px 5px 16px;padding:10px 14px;font-family:'Newsreader',serif;font-style:italic;font-size:14.5px;line-height:1.5;opacity:0;transform:translateY(8px);transition:opacity .5s,transform .5s;min-height:41px"><span data-type="my sister told me she's been scared of me since we were kids. i had no idea."></span></div>
            <div data-sp="" style="align-self:flex-start;max-width:88%;background:rgba(255,255,255,.07);color:#e9dce4;border-radius:16px 16px 16px 5px;padding:10px 14px;font-family:'Newsreader',serif;font-style:italic;font-size:14.5px;line-height:1.5;opacity:0;transform:translateY(8px);transition:opacity .5s,transform .5s">that's heavy. how long has it been sitting on you?</div>
            <div data-sp="" style="align-self:flex-end;max-width:88%;background:#e7548a;color:#fff;border-radius:16px 16px 5px 16px;padding:10px 14px;font-family:'Newsreader',serif;font-style:italic;font-size:14.5px;line-height:1.5;opacity:0;transform:translateY(8px);transition:opacity .5s,transform .5s;min-height:41px"><span data-type="since tuesday. i can't say this to anyone who knows us."></span></div>
            <div data-sp="" style="align-self:flex-start;max-width:88%;background:rgba(255,255,255,.07);color:#e9dce4;border-radius:16px 16px 16px 5px;padding:10px 14px;font-family:'Newsreader',serif;font-style:italic;font-size:14.5px;line-height:1.5;opacity:0;transform:translateY(8px);transition:opacity .5s,transform .5s">you don't have to. i can open a room — pseudonymous, full of people who've lived this exact thing.</div>
            <div data-sp="" style="align-self:center;display:inline-flex;align-items:center;gap:7px;background:rgba(93,202,165,.12);border:.5px solid rgba(93,202,165,.4);color:#5DCAA5;border-radius:999px;padding:7px 15px;font-family:'Sora',sans-serif;font-weight:700;font-size:12px;opacity:0;transform:translateY(8px);transition:opacity .5s,transform .5s;margin-top:4px"><span style="width:7px;height:7px;border-radius:50%;background:#5DCAA5;animation:breathe 2.8s ease-in-out infinite;display:block"></span>room opened · 31 sitting in</div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- 02 SCAN -->
  <section data-screen-label="02 Scan" class="chsec" style="position:relative;min-height:96vh;scroll-snap-align:start;background:linear-gradient(165deg,#241d47,#151030 60%,#100c14);display:flex;align-items:center;overflow:hidden">
    <div class="chgrid rev">
      <div data-rv="pop" data-democard="" style="display:flex;justify-content:center">
        <!-- the scan flow as a self-playing sample: questions → reading → score -->
        <div data-reactive="" data-glow="rgba(231,84,138,.55)" style="width:min(330px,88vw);background:linear-gradient(170deg,#241226,#160b16 70%);border:1px solid rgba(231,84,138,.35);border-radius:24px;padding:24px 22px 20px;box-shadow:0 40px 90px -40px rgba(0,0,0,.7)">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">
            <span style="display:inline-flex;align-items:center;gap:6px;background:rgba(231,84,138,.16);color:#f7b8d4;border:.5px solid rgba(231,84,138,.3);border-radius:999px;padding:4px 12px;font-family:'Sora',sans-serif;font-weight:600;font-size:10.5px;letter-spacing:.08em;text-transform:uppercase">relationships</span>
            <span style="font-family:'Newsreader',serif;font-style:italic;font-size:12.5px;color:#9e7a8c">the scan · sample</span>
          </div>
          <div style="position:relative;height:330px">
            <div data-scph="" style="position:absolute;inset:0;display:flex;flex-direction:column;justify-content:center;gap:14px;opacity:0;transition:opacity .45s;pointer-events:none">
              <div style="font-family:'Sora',sans-serif;font-weight:700;font-size:10px;letter-spacing:.22em;text-transform:uppercase;color:#8d86c9">question 2 of 6</div>
              <div style="font-family:'Newsreader',serif;font-style:italic;font-size:20px;line-height:1.45;color:#f7e8f0">when it flares up, where do you feel it first?</div>
              <div style="display:flex;flex-direction:column;gap:9px">
                <span data-scpick="" style="display:block;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.14);border-radius:14px;padding:11px 14px;font-family:'Newsreader',serif;font-style:italic;font-size:14.5px;color:#e9e4f6;transition:background .35s,border-color .35s,transform .35s">my chest goes tight</span>
                <span style="display:block;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.14);border-radius:14px;padding:11px 14px;font-family:'Newsreader',serif;font-style:italic;font-size:14.5px;color:#e9e4f6">my head starts spinning</span>
                <span style="display:block;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.14);border-radius:14px;padding:11px 14px;font-family:'Newsreader',serif;font-style:italic;font-size:14.5px;color:#e9e4f6">i go completely numb</span>
              </div>
            </div>
            <div data-scph="" style="position:absolute;inset:0;display:flex;flex-direction:column;justify-content:center;gap:14px;opacity:0;transition:opacity .45s;pointer-events:none">
              <div style="font-family:'Sora',sans-serif;font-weight:700;font-size:10px;letter-spacing:.22em;text-transform:uppercase;color:#8d86c9">question 3 of 6</div>
              <div style="font-family:'Newsreader',serif;font-style:italic;font-size:20px;line-height:1.45;color:#f7e8f0">how often does it visit you?</div>
              <div style="display:flex;flex-direction:column;gap:9px">
                <span style="display:block;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.14);border-radius:14px;padding:11px 14px;font-family:'Newsreader',serif;font-style:italic;font-size:14.5px;color:#e9e4f6">once in a while</span>
                <span data-scpick="" style="display:block;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.14);border-radius:14px;padding:11px 14px;font-family:'Newsreader',serif;font-style:italic;font-size:14.5px;color:#e9e4f6;transition:background .35s,border-color .35s,transform .35s">most days</span>
                <span style="display:block;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.14);border-radius:14px;padding:11px 14px;font-family:'Newsreader',serif;font-style:italic;font-size:14.5px;color:#e9e4f6">it never really leaves</span>
              </div>
            </div>
            <div data-scph="" style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;opacity:0;transition:opacity .45s;pointer-events:none">
              <svg viewBox="0 0 56 56" fill="none" style="width:46px;height:46px"><rect x="15.25" y="16" width="11.5" height="24" rx="5.75" fill="url(#eyeG2)"></rect><rect x="29.25" y="16" width="11.5" height="24" rx="5.75" fill="url(#eyeG2)"></rect><ellipse cx="21" cy="29" rx="4" ry="5" fill="url(#pupG2)"></ellipse><ellipse cx="35" cy="29" rx="4" ry="5" fill="url(#pupG2)"></ellipse></svg>
              <div style="font-family:'Newsreader',serif;font-style:italic;font-size:16.5px;color:#c6c0ef">reading the weight of it…</div>
              <div style="display:flex;gap:7px"><span style="width:8px;height:8px;border-radius:50%;background:#7F77DD;animation:breathe 1.2s ease-in-out infinite;display:block"></span><span style="width:8px;height:8px;border-radius:50%;background:#7F77DD;animation:breathe 1.2s ease-in-out .2s infinite;display:block"></span><span style="width:8px;height:8px;border-radius:50%;background:#7F77DD;animation:breathe 1.2s ease-in-out .4s infinite;display:block"></span></div>
            </div>
            <div data-scph="" style="position:absolute;inset:0;display:flex;flex-direction:column;justify-content:center;opacity:0;transition:opacity .45s;pointer-events:none">
              <div style="position:relative;display:grid;place-items:center;margin:2px 0">
                <svg viewBox="0 0 200 200" style="width:60%;max-width:196px;transform:rotate(-90deg)">
                  <circle cx="100" cy="100" r="84" fill="none" stroke="rgba(255,255,255,.08)" stroke-width="10"></circle>
                  <circle data-arc="" cx="100" cy="100" r="84" fill="none" stroke="#e7548a" stroke-width="10" stroke-linecap="round" stroke-dasharray="527.8" stroke-dashoffset="527.8" style="filter:drop-shadow(0 0 8px rgba(231,84,138,.6))"></circle>
                </svg>
                <div style="position:absolute;text-align:center">
                  <div data-scannum="" style="font-family:'Sora',sans-serif;font-weight:800;font-size:52px;letter-spacing:-.04em;color:#e7548a;line-height:.9;font-variant-numeric:tabular-nums">0</div>
                  <div style="font-family:'Sora',sans-serif;font-weight:600;font-size:9px;letter-spacing:.18em;text-transform:uppercase;color:#9e7a8c;margin-top:5px">of 999 · heavy &amp; loud</div>
                </div>
              </div>
              <div style="text-align:center;margin-bottom:14px">
                <div style="font-family:'Sora',sans-serif;font-weight:800;font-size:20px;color:#f7e8f0;line-height:1.15">Carrying It Loud</div>
                <div style="margin-top:6px;font-family:'Newsreader',serif;font-style:italic;font-size:13.5px;line-height:1.5;color:#c4a0b2">the part that hurts is how unseen it makes you feel — and you keep showing up anyway.</div>
              </div>
              <div style="height:5px;border-radius:3px;background:linear-gradient(90deg,#9e8f9c,#7F77DD,#c87c4a,#e7548a,#c1216b);position:relative"><span data-mark="" style="position:absolute;left:0;top:50%;width:13px;height:13px;border-radius:50%;background:#fff;border:3px solid #e7548a;transform:translate(-50%,-50%)"></span></div>
            </div>
          </div>
          <div style="display:flex;align-items:center;justify-content:center;gap:6px;opacity:.6;margin-top:10px"><span style="font-family:'Sora',sans-serif;font-weight:800;font-size:8.5px;letter-spacing:.28em;color:#c4a0b2">SHUTAP · THE SCAN</span></div>
        </div>
      </div>
      <div data-rv="swipe-r">
        <div style="font-family:'Sora',sans-serif;font-weight:700;font-size:12px;letter-spacing:.24em;text-transform:uppercase;color:#aaa3e8;margin-bottom:22px">chapter 02 — scan it</div>
        <h2 data-words="" style="font-family:'Sora',sans-serif;font-weight:800;font-size:clamp(30px,3.8vw,54px);line-height:1.08;letter-spacing:-.04em;margin:0 0 24px;color:#fff">how heavy is it, <em style="font-family:'Newsreader',serif;font-style:italic;font-weight:400;color:#aaa3e8">really?</em></h2>
        <p style="font-family:'Newsreader',serif;font-style:italic;font-size:clamp(16px,1.4vw,20px);line-height:1.6;color:#c6c0ef;max-width:44ch;margin:0 0 32px">a 60-second read. the companion asks, you answer, and you get a private intensity score — before you decide whether the world gets to sit in.</p>
        <a href="#scan" data-cta="scan" data-hover="" data-mag="" style="display:inline-flex;align-items:center;gap:10px;font-family:'Sora',sans-serif;font-weight:700;font-size:15px;color:#100c14;background:#fff;border-radius:999px;padding:16px 30px;transition:background .3s" style-hover="background:#aaa3e8">scan it →</a>
      </div>
    </div>
  </section>

  <!-- 03 MIRROR -->
  <section data-screen-label="03 Mirror" class="chsec" style="position:relative;min-height:96vh;scroll-snap-align:start;background:#100c14;display:flex;align-items:center;overflow:hidden">
    <div style="position:absolute;inset:auto 0 -20% 0;height:60vh;background:radial-gradient(ellipse at 50% 100%,rgba(231,84,138,.12),transparent 65%);pointer-events:none"></div>
    <div class="chgrid">
      <div data-rv="swipe-l" style="text-align:left">
        <div style="font-family:'Sora',sans-serif;font-weight:700;font-size:12px;letter-spacing:.24em;text-transform:uppercase;color:#e9c06a;margin-bottom:22px">chapter 03 — the mirror ✦</div>
        <h2 data-words="" style="font-family:'Sora',sans-serif;font-weight:800;font-size:clamp(30px,3.8vw,54px);line-height:1.08;letter-spacing:-.04em;margin:0 0 24px;color:#f7e8f0">your patterns, <em style="font-family:'Newsreader',serif;font-style:italic;font-weight:400;color:#f7b8d4">read as cards.</em></h2>
        <p style="font-family:'Newsreader',serif;font-style:italic;font-size:clamp(16px,1.4vw,20px);line-height:1.6;color:#caaebb;max-width:44ch;margin:0 0 32px">the mirror reads across your rooms and deals what keeps coming back — how deep it runs, which way it's moving, and how far you've already come.</p>
        <a href="/welcome" data-link="/welcome" data-hover="" data-mag="" style="display:inline-flex;align-items:center;gap:10px;font-family:'Sora',sans-serif;font-weight:700;font-size:15px;color:#100c14;background:#e9c06a;border-radius:999px;padding:16px 30px;transition:background .3s" style-hover="background:#f7b8d4">unlock the full mirror ✦</a>
      </div>
      <div data-rv="pop" data-democard="" style="display:flex;justify-content:center">
        <!-- the mirror's full read: cycling patterns with depth, trend + signal analytics -->
        <div data-reactive="" data-glow="rgba(233,192,106,.6)" style="display:block;width:min(380px,92vw);position:relative;border-radius:22px;overflow:hidden;background:radial-gradient(125% 80% at 50% 0%,#7F77DD2e,#1c0d16 58%,#140810);border:1px solid rgba(233,192,106,.85);box-shadow:0 40px 90px -34px rgba(0,0,0,.85),0 0 0 1px rgba(233,192,106,.33),0 0 38px -6px rgba(233,192,106,.4);padding:20px">
          <div style="position:absolute;inset:0;border-radius:22px;background:linear-gradient(180deg,rgba(255,255,255,.13),rgba(255,255,255,.03) 18%,transparent 38%);pointer-events:none;z-index:2"></div>
          <div style="position:absolute;top:0;left:12%;right:12%;height:1.5px;background:linear-gradient(90deg,transparent,#7F77DD,#e7548a,#5B8A5E,transparent);opacity:.4;pointer-events:none;z-index:3"></div>
          <div style="position:absolute;inset:6px;border:.5px solid rgba(233,192,106,.5);border-radius:16px;pointer-events:none"></div>
          <div style="position:relative;z-index:3">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">
              <span style="font-family:'Sora',sans-serif;font-weight:800;font-size:9.5px;letter-spacing:.24em;color:#e9c06a">✦ THE MIRROR — FULL READ</span>
              <span style="display:inline-flex;gap:5px;align-items:center"><span data-mdot="" style="width:6px;height:6px;border-radius:50%;background:#e9c06a;transition:background .4s;display:block"></span><span data-mdot="" style="width:6px;height:6px;border-radius:50%;background:rgba(233,192,106,.28);transition:background .4s;display:block"></span><span data-mdot="" style="width:6px;height:6px;border-radius:50%;background:rgba(233,192,106,.28);transition:background .4s;display:block"></span></span>
            </div>
            <div style="position:relative;height:448px">
              <div data-mc="" style="position:absolute;inset:0;opacity:0;transition:opacity .55s;display:flex;flex-direction:column">
                <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:2px">
                  <span style="display:inline-flex;align-items:center;gap:7px"><span style="width:24px;height:24px;border-radius:7px;display:grid;place-items:center;background:rgba(127,119,221,.14);border:.5px solid rgba(127,119,221,.33);color:#7F77DD;font-size:13px">▲</span><span style="font-family:'Sora',sans-serif;font-weight:700;font-size:9.5px;letter-spacing:.18em;text-transform:uppercase;color:#7F77DD">Career</span></span>
                  <span style="font-family:'Newsreader',serif;font-style:italic;font-weight:700;font-size:22px;color:#e9c06a;line-height:1">V</span>
                </div>
                <div style="font-family:'Newsreader',serif;font-style:italic;font-weight:500;font-size:22px;line-height:1.08;margin:2px 0 8px;color:#fbe9f1;text-align:center">Impostor at the Table</div>
                <div style="position:relative;width:116px;height:126px;margin:0 auto">
                  <svg viewBox="0 0 120 120" style="position:absolute;left:3px;top:0;width:110px;height:110px;transform:rotate(-90deg)"><circle cx="60" cy="60" r="46" fill="none" stroke="rgba(255,255,255,.08)" stroke-width="8"></circle><circle data-mring="" data-off="0" cx="60" cy="60" r="46" fill="none" stroke="#7F77DD" stroke-width="8" stroke-linecap="round" stroke-dasharray="289" stroke-dashoffset="289" style="filter:drop-shadow(0 0 6px rgba(127,119,221,.65))"></circle></svg>
                  <div style="position:absolute;left:3px;top:0;width:110px;height:110px;display:grid;place-items:center"><span style="font-size:34px;filter:drop-shadow(0 0 12px rgba(127,119,221,.8));animation:bob 3.6s ease-in-out infinite">🎭</span></div>
                  <div style="position:absolute;bottom:0;left:0;right:0;text-align:center;font-family:'Sora',sans-serif;font-weight:800;font-size:10px;letter-spacing:.14em;color:#7F77DD">DEPTH 5/5</div>
                </div>
                <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;margin:8px 0 6px;padding-top:11px;border-top:.5px solid rgba(255,255,255,.08)">
                  <span style="display:flex;align-items:baseline;gap:8px"><span data-mcount="" data-n="140" style="font-family:'Sora',sans-serif;font-weight:800;font-size:22px;line-height:1;color:#7F77DD;font-variant-numeric:tabular-nums">0</span><span style="font-family:'Sora',sans-serif;font-weight:600;font-size:9px;letter-spacing:.1em;text-transform:uppercase;color:#7a5f6c">all-time<br>signals</span></span>
                  <span style="display:inline-flex;align-items:center;gap:4px;font-family:'Sora',sans-serif;font-weight:700;font-size:10px;letter-spacing:.06em;text-transform:uppercase;color:#c4a0b2;background:rgba(196,160,178,.12);border:.5px solid rgba(196,160,178,.27);border-radius:999px;padding:3px 9px">→ steady</span>
                </div>
                <svg viewBox="0 0 248 66" preserveAspectRatio="none" style="width:100%;height:42px;display:block;overflow:visible"><path data-mspark="" d="M0 23.7 L41.3 16.9 L82.7 23.7 L124 10 L165.3 16.9 L206.7 10 L248 16.9" fill="none" stroke="#7F77DD" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="600" stroke-dashoffset="600" style="filter:drop-shadow(0 0 4px rgba(127,119,221,.53))"></path><circle cx="248" cy="16.9" r="4" fill="#7F77DD"></circle></svg>
                <div style="display:flex;justify-content:space-between;font-family:'Sora',sans-serif;font-weight:600;font-size:8.5px;letter-spacing:.08em;color:#7a5f6c;margin-top:2px"><span>7 WEEKS AGO</span><span>THIS WEEK</span></div>
                <div style="font-family:'Sora',sans-serif;font-weight:600;font-size:8.5px;letter-spacing:.18em;color:#7a5f6c;margin:10px 0 5px">WHERE IT SHOWS UP</div>
                <div style="display:flex;align-items:center;justify-content:space-between">
                  <span style="display:inline-flex;align-items:baseline;gap:4px;font-family:'Sora',sans-serif;font-weight:700;font-size:11px;color:#e7548a"><span>🗯</span>22</span>
                  <span style="display:inline-flex;align-items:baseline;gap:4px;font-family:'Sora',sans-serif;font-weight:700;font-size:11px;color:#7F77DD"><span>📸</span>18</span>
                  <span style="display:inline-flex;align-items:baseline;gap:4px;font-family:'Sora',sans-serif;font-weight:700;font-size:11px;color:#c87c4a"><span>💬</span>14</span>
                  <span style="display:inline-flex;align-items:baseline;gap:4px;font-family:'Sora',sans-serif;font-weight:700;font-size:11px;color:#c1216b"><span>♥</span>19</span>
                  <span style="display:inline-flex;align-items:baseline;gap:4px;font-family:'Sora',sans-serif;font-weight:700;font-size:11px;color:#5B8A5E"><span>✦</span>7</span>
                  <span style="display:inline-flex;align-items:baseline;gap:4px;font-family:'Sora',sans-serif;font-weight:700;font-size:11px;color:#9a7bd0"><span>👁</span>60</span>
                </div>
                <div style="margin-top:auto;font-family:'Newsreader',serif;font-style:italic;font-weight:500;font-size:15px;line-height:1.4;color:#fbe9f1;text-align:center">“140 rooms you earned and you still sit like the bouncer is en route.”</div>
              </div>
              <div data-mc="" style="position:absolute;inset:0;opacity:0;transition:opacity .55s;display:flex;flex-direction:column">
                <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:2px">
                  <span style="display:inline-flex;align-items:center;gap:7px"><span style="width:24px;height:24px;border-radius:7px;display:grid;place-items:center;background:rgba(231,84,138,.14);border:.5px solid rgba(231,84,138,.33);color:#e7548a;font-size:13px">✸</span><span style="font-family:'Sora',sans-serif;font-weight:700;font-size:9.5px;letter-spacing:.18em;text-transform:uppercase;color:#e7548a">Personal</span></span>
                  <span style="font-family:'Newsreader',serif;font-style:italic;font-weight:700;font-size:22px;color:#e9c06a;line-height:1">IV</span>
                </div>
                <div style="font-family:'Newsreader',serif;font-style:italic;font-weight:500;font-size:22px;line-height:1.08;margin:2px 0 8px;color:#fbe9f1;text-align:center">Avoidant Texter</div>
                <div style="position:relative;width:116px;height:126px;margin:0 auto">
                  <svg viewBox="0 0 120 120" style="position:absolute;left:3px;top:0;width:110px;height:110px;transform:rotate(-90deg)"><circle cx="60" cy="60" r="46" fill="none" stroke="rgba(255,255,255,.08)" stroke-width="8"></circle><circle data-mring="" data-off="0" cx="60" cy="60" r="46" fill="none" stroke="#e7548a" stroke-width="8" stroke-linecap="round" stroke-dasharray="289" stroke-dashoffset="289" style="filter:drop-shadow(0 0 6px rgba(231,84,138,.65))"></circle></svg>
                  <div style="position:absolute;left:3px;top:0;width:110px;height:110px;display:grid;place-items:center"><span style="font-size:34px;filter:drop-shadow(0 0 12px rgba(231,84,138,.8));animation:bob 3.6s ease-in-out infinite">📱</span></div>
                  <div style="position:absolute;bottom:0;left:0;right:0;text-align:center;font-family:'Sora',sans-serif;font-weight:800;font-size:10px;letter-spacing:.14em;color:#e7548a">DEPTH 5/5</div>
                </div>
                <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;margin:8px 0 6px;padding-top:11px;border-top:.5px solid rgba(255,255,255,.08)">
                  <span style="display:flex;align-items:baseline;gap:8px"><span data-mcount="" data-n="192" style="font-family:'Sora',sans-serif;font-weight:800;font-size:22px;line-height:1;color:#e7548a;font-variant-numeric:tabular-nums">0</span><span style="font-family:'Sora',sans-serif;font-weight:600;font-size:9px;letter-spacing:.1em;text-transform:uppercase;color:#7a5f6c">all-time<br>signals</span></span>
                  <span style="display:inline-flex;align-items:center;gap:4px;font-family:'Sora',sans-serif;font-weight:700;font-size:10px;letter-spacing:.06em;text-transform:uppercase;color:#7fd49a;background:rgba(127,212,154,.12);border:.5px solid rgba(127,212,154,.27);border-radius:999px;padding:3px 9px">↗ rising</span>
                </div>
                <svg viewBox="0 0 248 66" preserveAspectRatio="none" style="width:100%;height:42px;display:block;overflow:visible"><path data-mspark="" d="M0 53.2 L41.3 48.4 L82.7 48.4 L124 38.8 L165.3 34 L206.7 24.4 L248 10" fill="none" stroke="#e7548a" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="600" stroke-dashoffset="600" style="filter:drop-shadow(0 0 4px rgba(231,84,138,.53))"></path><circle cx="248" cy="10" r="4" fill="#e7548a"></circle></svg>
                <div style="display:flex;justify-content:space-between;font-family:'Sora',sans-serif;font-weight:600;font-size:8.5px;letter-spacing:.08em;color:#7a5f6c;margin-top:2px"><span>7 WEEKS AGO</span><span>THIS WEEK</span></div>
                <div style="font-family:'Sora',sans-serif;font-weight:600;font-size:8.5px;letter-spacing:.18em;color:#7a5f6c;margin:10px 0 5px">WHERE IT SHOWS UP</div>
                <div style="display:flex;align-items:center;justify-content:space-between">
                  <span style="display:inline-flex;align-items:baseline;gap:4px;font-family:'Sora',sans-serif;font-weight:700;font-size:11px;color:#e7548a"><span>🗯</span>24</span>
                  <span style="display:inline-flex;align-items:baseline;gap:4px;font-family:'Sora',sans-serif;font-weight:700;font-size:11px;color:#7F77DD"><span>📸</span>14</span>
                  <span style="display:inline-flex;align-items:baseline;gap:4px;font-family:'Sora',sans-serif;font-weight:700;font-size:11px;color:#c87c4a"><span>💬</span>8</span>
                  <span style="display:inline-flex;align-items:baseline;gap:4px;font-family:'Sora',sans-serif;font-weight:700;font-size:11px;color:#c1216b"><span>♥</span>71</span>
                  <span style="display:inline-flex;align-items:baseline;gap:4px;font-family:'Sora',sans-serif;font-weight:700;font-size:11px;color:#5B8A5E"><span>✦</span>5</span>
                  <span style="display:inline-flex;align-items:baseline;gap:4px;font-family:'Sora',sans-serif;font-weight:700;font-size:11px;color:#9a7bd0"><span>👁</span>70</span>
                </div>
                <div style="margin-top:auto;font-family:'Newsreader',serif;font-style:italic;font-weight:500;font-size:15px;line-height:1.4;color:#fbe9f1;text-align:center">“192 reads, zero replies. not mysterious bestie, just scared with great wifi.”</div>
              </div>
              <div data-mc="" style="position:absolute;inset:0;opacity:0;transition:opacity .55s;display:flex;flex-direction:column">
                <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:2px">
                  <span style="display:inline-flex;align-items:center;gap:7px"><span style="width:24px;height:24px;border-radius:7px;display:grid;place-items:center;background:rgba(193,33,107,.14);border:.5px solid rgba(193,33,107,.33);color:#c1216b;font-size:13px">♥</span><span style="font-family:'Sora',sans-serif;font-weight:700;font-size:9.5px;letter-spacing:.18em;text-transform:uppercase;color:#c1216b">Relationship</span></span>
                  <span style="font-family:'Newsreader',serif;font-style:italic;font-weight:700;font-size:22px;color:#e9c06a;line-height:1">III</span>
                </div>
                <div style="font-family:'Newsreader',serif;font-style:italic;font-weight:500;font-size:22px;line-height:1.08;margin:2px 0 8px;color:#fbe9f1;text-align:center">Heart on Read</div>
                <div style="position:relative;width:116px;height:126px;margin:0 auto">
                  <svg viewBox="0 0 120 120" style="position:absolute;left:3px;top:0;width:110px;height:110px;transform:rotate(-90deg)"><circle cx="60" cy="60" r="46" fill="none" stroke="rgba(255,255,255,.08)" stroke-width="8"></circle><circle data-mring="" data-off="115.6" cx="60" cy="60" r="46" fill="none" stroke="#c1216b" stroke-width="8" stroke-linecap="round" stroke-dasharray="289" stroke-dashoffset="289" style="filter:drop-shadow(0 0 6px rgba(193,33,107,.65))"></circle></svg>
                  <div style="position:absolute;left:3px;top:0;width:110px;height:110px;display:grid;place-items:center"><span style="font-size:34px;filter:drop-shadow(0 0 12px rgba(193,33,107,.8));animation:bob 3.6s ease-in-out infinite">💌</span></div>
                  <div style="position:absolute;bottom:0;left:0;right:0;text-align:center;font-family:'Sora',sans-serif;font-weight:800;font-size:10px;letter-spacing:.14em;color:#c1216b">DEPTH 3/5</div>
                </div>
                <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;margin:8px 0 6px;padding-top:11px;border-top:.5px solid rgba(255,255,255,.08)">
                  <span style="display:flex;align-items:baseline;gap:8px"><span data-mcount="" data-n="54" style="font-family:'Sora',sans-serif;font-weight:800;font-size:22px;line-height:1;color:#c1216b;font-variant-numeric:tabular-nums">0</span><span style="font-family:'Sora',sans-serif;font-weight:600;font-size:9px;letter-spacing:.1em;text-transform:uppercase;color:#7a5f6c">all-time<br>signals</span></span>
                  <span style="display:inline-flex;align-items:center;gap:4px;font-family:'Sora',sans-serif;font-weight:700;font-size:10px;letter-spacing:.06em;text-transform:uppercase;color:#7fd49a;background:rgba(127,212,154,.12);border:.5px solid rgba(127,212,154,.27);border-radius:999px;padding:3px 9px">↗ rising</span>
                </div>
                <svg viewBox="0 0 248 66" preserveAspectRatio="none" style="width:100%;height:42px;display:block;overflow:visible"><path data-mspark="" d="M0 48.4 L41.3 43.6 L82.7 48.4 L124 34 L165.3 29.2 L206.7 19.6 L248 10" fill="none" stroke="#c1216b" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="600" stroke-dashoffset="600" style="filter:drop-shadow(0 0 4px rgba(193,33,107,.53))"></path><circle cx="248" cy="10" r="4" fill="#c1216b"></circle></svg>
                <div style="display:flex;justify-content:space-between;font-family:'Sora',sans-serif;font-weight:600;font-size:8.5px;letter-spacing:.08em;color:#7a5f6c;margin-top:2px"><span>7 WEEKS AGO</span><span>THIS WEEK</span></div>
                <div style="font-family:'Sora',sans-serif;font-weight:600;font-size:8.5px;letter-spacing:.18em;color:#7a5f6c;margin:10px 0 5px">WHERE IT SHOWS UP</div>
                <div style="display:flex;align-items:center;justify-content:space-between">
                  <span style="display:inline-flex;align-items:baseline;gap:4px;font-family:'Sora',sans-serif;font-weight:700;font-size:11px;color:#e7548a"><span>🗯</span>6</span>
                  <span style="display:inline-flex;align-items:baseline;gap:4px;font-family:'Sora',sans-serif;font-weight:700;font-size:11px;color:#7F77DD"><span>📸</span>3</span>
                  <span style="display:inline-flex;align-items:baseline;gap:4px;font-family:'Sora',sans-serif;font-weight:700;font-size:11px;color:#c87c4a"><span>💬</span>4</span>
                  <span style="display:inline-flex;align-items:baseline;gap:4px;font-family:'Sora',sans-serif;font-weight:700;font-size:11px;color:#c1216b"><span>♥</span>31</span>
                  <span style="display:inline-flex;align-items:baseline;gap:4px;font-family:'Sora',sans-serif;font-weight:700;font-size:11px;color:#5B8A5E"><span>✦</span>4</span>
                  <span style="display:inline-flex;align-items:baseline;gap:4px;font-family:'Sora',sans-serif;font-weight:700;font-size:11px;color:#9a7bd0"><span>👁</span>6</span>
                </div>
                <div style="margin-top:auto;font-family:'Newsreader',serif;font-style:italic;font-weight:500;font-size:15px;line-height:1.4;color:#fbe9f1;text-align:center">“54 hearts dropped, zero texts back. you flirt like a hit-and-run.”</div>
              </div>
            </div>
            <div style="margin-top:14px;padding-top:13px;border-top:.5px solid rgba(255,255,255,.08)">
              <div style="font-family:'Sora',sans-serif;font-weight:600;font-size:8.5px;letter-spacing:.18em;color:#7a5f6c;margin-bottom:8px">THE MIRROR WORLD · 5 DISTRICTS</div>
              <div style="display:flex;gap:7px">
                <span style="flex:1;display:flex;flex-direction:column;align-items:center;gap:6px;background:rgba(255,255,255,.03);border:.5px solid rgba(255,255,255,.07);border-radius:12px;padding:10px 4px 8px">
                  <span style="display:flex;align-items:flex-end;gap:3px;height:32px"><span style="width:5px;height:31px;border-radius:2px 2px 0 0;background:#e7548a;display:block"></span><span style="width:5px;height:21px;border-radius:2px 2px 0 0;background:#e7548a;opacity:.75;display:block"></span><span style="width:5px;height:21px;border-radius:2px 2px 0 0;background:#e7548a;opacity:.6;display:block"></span><span style="width:5px;height:16px;border-radius:2px 2px 0 0;background:#e7548a;opacity:.45;display:block"></span><span style="width:5px;height:21px;border-radius:2px 2px 0 0;background:#6f7a5e;display:block"></span></span>
                  <span style="color:#e7548a;font-size:11px;line-height:1">✸</span>
                  <span style="font-family:'Sora',sans-serif;font-weight:600;font-size:7.5px;letter-spacing:.08em;text-transform:uppercase;color:#7a5f6c">personal</span>
                </span>
                <span style="flex:1;display:flex;flex-direction:column;align-items:center;gap:6px;background:rgba(255,255,255,.03);border:.5px solid rgba(255,255,255,.07);border-radius:12px;padding:10px 4px 8px">
                  <span style="display:flex;align-items:flex-end;gap:3px;height:32px"><span style="width:5px;height:31px;border-radius:2px 2px 0 0;background:#7F77DD;display:block"></span><span style="width:5px;height:26px;border-radius:2px 2px 0 0;background:#7F77DD;opacity:.7;display:block"></span><span style="width:5px;height:16px;border-radius:2px 2px 0 0;background:#7F77DD;opacity:.45;display:block"></span></span>
                  <span style="color:#7F77DD;font-size:11px;line-height:1">▲</span>
                  <span style="font-family:'Sora',sans-serif;font-weight:600;font-size:7.5px;letter-spacing:.08em;text-transform:uppercase;color:#7a5f6c">career</span>
                </span>
                <span style="flex:1;display:flex;flex-direction:column;align-items:center;gap:6px;background:rgba(255,255,255,.03);border:.5px solid rgba(255,255,255,.07);border-radius:12px;padding:10px 4px 8px">
                  <span style="display:flex;align-items:flex-end;gap:3px;height:32px"><span style="width:5px;height:26px;border-radius:2px 2px 0 0;background:#c1216b;display:block"></span><span style="width:5px;height:21px;border-radius:2px 2px 0 0;background:#c1216b;opacity:.7;display:block"></span><span style="width:5px;height:21px;border-radius:2px 2px 0 0;background:#c1216b;opacity:.5;display:block"></span></span>
                  <span style="color:#c1216b;font-size:11px;line-height:1">♥</span>
                  <span style="font-family:'Sora',sans-serif;font-weight:600;font-size:7.5px;letter-spacing:.08em;text-transform:uppercase;color:#7a5f6c">relationship</span>
                </span>
                <span style="flex:1;display:flex;flex-direction:column;align-items:center;gap:6px;background:rgba(255,255,255,.03);border:.5px solid rgba(255,255,255,.07);border-radius:12px;padding:10px 4px 8px">
                  <span style="display:flex;align-items:flex-end;gap:3px;height:32px"><span style="width:5px;height:21px;border-radius:2px 2px 0 0;background:#c87c4a;display:block"></span><span style="width:5px;height:26px;border-radius:2px 2px 0 0;background:#6f7a5e;display:block"></span></span>
                  <span style="color:#c87c4a;font-size:11px;line-height:1">⌂</span>
                  <span style="font-family:'Sora',sans-serif;font-weight:600;font-size:7.5px;letter-spacing:.08em;text-transform:uppercase;color:#7a5f6c">family</span>
                </span>
                <span style="flex:1;display:flex;flex-direction:column;align-items:center;gap:6px;background:rgba(255,255,255,.03);border:.5px solid rgba(255,255,255,.07);border-radius:12px;padding:10px 4px 8px">
                  <span style="display:flex;align-items:flex-end;gap:3px;height:32px"><span style="width:5px;height:26px;border-radius:2px 2px 0 0;background:#5B8A5E;display:block"></span><span style="width:5px;height:16px;border-radius:2px 2px 0 0;background:#5B8A5E;opacity:.55;display:block"></span></span>
                  <span style="color:#5B8A5E;font-size:11px;line-height:1">✦</span>
                  <span style="font-family:'Sora',sans-serif;font-weight:600;font-size:7.5px;letter-spacing:.08em;text-transform:uppercase;color:#7a5f6c">social</span>
                </span>
              </div>
            </div>
            <div style="margin-top:12px;display:flex;align-items:center;gap:10px;background:rgba(233,192,106,.08);border:.5px solid rgba(233,192,106,.4);border-radius:14px;padding:11px 14px">
              <span style="font-size:15px;line-height:1">🔒</span>
              <span style="flex:1;font-family:'Newsreader',serif;font-style:italic;font-size:13px;color:#e9c06a;line-height:1.4">subscription required for full mirror access</span>
              <span style="font-family:'Sora',sans-serif;font-weight:700;font-size:11px;color:#100c14;background:#e9c06a;border-radius:999px;padding:6px 12px;white-space:nowrap">unlock →</span>
            </div>
            <div style="display:flex;align-items:center;justify-content:center;gap:6px;margin-top:14px;opacity:.6"><span style="font-family:'Sora',sans-serif;font-weight:800;font-size:9px;letter-spacing:.28em;color:#c4a0b2">SHUTAP · THE MIRROR · DEMO</span></div>
          </div>
        </div>
      </div>
    </div>
  </section>
</div>

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
</main>`;
