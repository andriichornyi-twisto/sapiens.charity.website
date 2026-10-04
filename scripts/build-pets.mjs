// Generates one page per animal from the PETS array that lives in pets/index.html,
// so a single animal can be linked and shared with its own preview image.
// Run via ./build-cs.sh (CI does this on every push).
import { readFileSync, writeFileSync, mkdirSync, existsSync, rmSync, readdirSync } from 'node:fs';
import { Script, createContext } from 'node:vm';

const SITE = 'https://sapienscz.com';
const TG = { token: '8875632622:AAF-2mR_lT7EN9NQBIOjJi5kKaJeNGTjk2w', chat: '-1003973004018' };

// ---------- read the animals out of the adoption page ----------
const src = readFileSync('pets/index.html', 'utf-8');
const m = src.match(/const PETS=(\[[\s\S]*?\n {4}\]);/);
if (!m) { console.error('build-pets: could not find the PETS array'); process.exit(1); }
const ctx = createContext({});
const PETS = new Script('(' + m[1] + ')').runInContext(ctx);
if (!Array.isArray(PETS) || !PETS.length) { console.error('build-pets: PETS is empty'); process.exit(1); }

// the three drawings, pulled from the same sprite the other pages use
const sprite = src.match(/<svg width="0" height="0"[\s\S]*?<\/svg>/)[0];

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const T = {
  en: {
    lang: 'en', other: 'cs', otherLabel: 'CZ',
    back: 'All the animals', nav: { events: 'Events', pets: 'Adopt', join: 'Join us' },
    looking: 'is looking for a home',
    askTitle: 'Interested in {name}?',
    askText: 'Leave your details and we will put you in touch with the people looking after {name}.',
    name: 'Your name', email: 'Email', phone: 'Phone or Instagram (optional)',
    msg: 'Anything we should know? (optional)',
    send: 'Send', sending: 'Sending…',
    err: 'Something went wrong — please try again, or write to us on Instagram.',
    cool: 'One moment — you just sent a message. Please try again in a minute.',
    privacy: 'We will only use your details to get back to you. Nothing else, ever.',
    okTitle: 'Thank you!', okText: 'Your message is on its way — we will get back to you soon.',
    share: 'Share', copy: 'Copy link', copied: 'Link copied',
    footTag: 'People need people', footPrivacy: 'Privacy',
    credit: 'Sapiens — a social impact project',
    placeholder: 'This is a sample profile while we set the page up.',
  },
  cs: {
    lang: 'cs', other: 'en', otherLabel: 'EN',
    back: 'Všechna zvířata', nav: { events: 'Akce', pets: 'Adopce', join: 'Přidejte se' },
    looking: 'hledá domov',
    askTitle: 'Zaujal vás {name}?',
    askText: 'Nechte nám kontakt a spojíme vás s lidmi, kteří se o {name} starají.',
    name: 'Vaše jméno', email: 'E-mail', phone: 'Telefon nebo Instagram (nepovinné)',
    msg: 'Chcete nám něco říct? (nepovinné)',
    send: 'Odeslat', sending: 'Odesílám…',
    err: 'Něco se pokazilo — zkuste to prosím znovu, nebo nám napište na Instagramu.',
    cool: 'Momentík — právě jste zprávu odeslali. Zkuste to prosím za minutu.',
    privacy: 'Vaše údaje použijeme jen k tomu, abychom se vám ozvali. Nic víc, nikdy.',
    okTitle: 'Děkujeme!', okText: 'Vaše zpráva je na cestě — brzy se vám ozveme.',
    share: 'Sdílet', copy: 'Kopírovat odkaz', copied: 'Odkaz zkopírován',
    footTag: 'Lidé potřebují lidi', footPrivacy: 'Soukromí',
    credit: 'Sapiens — projekt se sociálním přesahem',
    placeholder: 'Toto je ukázkový profil, než stránku dokončíme.',
  },
};

function page(pet, lang) {
  const t = T[lang];
  const isCs = lang === 'cs';
  const kind = isCs ? pet.kindCs : pet.kindEn;
  const age = isCs ? pet.ageCs : pet.ageEn;
  const bio = isCs ? pet.bioCs : pet.bioEn;
  const tags = isCs ? pet.tagsCs : pet.tagsEn;
  const base = isCs ? '/cs' : '';
  const here = `${SITE}${base}/pets/${pet.id}/`;
  const alt = isCs ? `${SITE}/pets/${pet.id}/` : `${SITE}/cs/pets/${pet.id}/`;
  const ogImg = pet.photo ? SITE + pet.photo : `${SITE}/img/og-card.jpg`;
  const title = `${pet.name} — ${t.looking} | Sapiens`;
  const desc = bio.length > 180 ? bio.slice(0, 177) + '…' : bio;
  const art = pet.photo
    ? `<img src="${pet.photo}" alt="${esc(pet.name)}" width="900" height="900">`
    : `<svg viewBox="0 0 120 120" aria-hidden="true"><use href="#${pet.art}"></use></svg>`;

  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="theme-color" content="#FFFAF4">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<meta property="og:title" content="${esc(pet.name)} — ${esc(t.looking)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:type" content="article">
<meta property="og:url" content="${here}">
<meta property="og:image" content="${ogImg}">
<meta property="og:locale" content="${isCs ? 'cs_CZ' : 'en_US'}">
<meta property="og:locale:alternate" content="${isCs ? 'en_US' : 'cs_CZ'}">
<meta name="twitter:card" content="summary_large_image">
<link rel="canonical" href="${here}">
<link rel="alternate" hreflang="en" href="${SITE}/pets/${pet.id}/">
<link rel="alternate" hreflang="cs" href="${SITE}/cs/pets/${pet.id}/">
<link rel="alternate" hreflang="x-default" href="${SITE}/pets/${pet.id}/">
<link rel="icon" type="image/png" sizes="32x32" href="/img/favicon-32.png">
<link rel="icon" type="image/png" sizes="192x192" href="/img/favicon-192.png">
<link rel="apple-touch-icon" href="/img/apple-touch-icon.png">
<link rel="preload" href="/fonts/archivo-latin.woff2" as="font" type="font/woff2" crossorigin>
<style>
  @font-face{font-family:'Archivo';font-style:normal;font-weight:500 900;font-display:swap;
    src:url('/fonts/archivo-latin-ext.woff2') format('woff2');
    unicode-range:U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF;}
  @font-face{font-family:'Archivo';font-style:normal;font-weight:500 900;font-display:swap;
    src:url('/fonts/archivo-latin.woff2') format('woff2');
    unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD;}
  :root{--cream:#FFFAF4;--ochre:#DFA84F;--peri:#B9CBEA;--royal:#2B57C6;--wine:#55202E;--wine-deep:#471A26;
    --white:#FFF;--font:'Archivo','Helvetica Neue',Arial,sans-serif;}
  *{margin:0;padding:0;box-sizing:border-box;}
  [hidden]{display:none !important;}
  html{-webkit-text-size-adjust:100%;background:var(--cream);scroll-behavior:smooth;}
  body{font-family:var(--font);background:var(--cream);color:var(--wine);-webkit-font-smoothing:antialiased;}
  a:focus-visible,button:focus-visible{outline:3px solid var(--royal);outline-offset:3px;border-radius:4px;}
  .wrap{max-width:900px;margin:0 auto;padding:0 clamp(20px,4vw,48px);}
  header{position:sticky;top:0;z-index:50;background:color-mix(in srgb,var(--cream) 90%,transparent);
    backdrop-filter:blur(10px);border-bottom:1px solid rgba(85,32,46,.08);}
  .nav{display:flex;align-items:center;justify-content:space-between;height:64px;gap:16px;}
  .wordmark{font-weight:700;font-size:15px;letter-spacing:.42em;text-transform:uppercase;color:var(--wine);text-decoration:none;}
  .nav-right{display:flex;align-items:center;gap:18px;}
  .nav-right a{font-size:12px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;
    color:var(--wine);text-decoration:none;opacity:.75;white-space:nowrap;}
  .nav-right a:hover{opacity:1;}
  .lang{border:1.5px solid rgba(85,32,46,.35);border-radius:999px;padding:6px 11px;font-size:10px;
    font-weight:800;letter-spacing:.1em;opacity:1 !important;}
  main{padding:clamp(28px,5vw,56px) 0 clamp(60px,8vw,100px);}
  .back{display:inline-flex;align-items:center;gap:8px;margin-bottom:clamp(18px,3vw,28px);
    font-size:12px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;
    color:var(--wine);text-decoration:none;opacity:.6;}
  .back:hover{opacity:1;}
  .hero{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:clamp(24px,4vw,48px);align-items:start;}
  @media (max-width:760px){.hero{grid-template-columns:1fr;}}
  .shot{position:relative;border-radius:24px;overflow:hidden;aspect-ratio:1;
    background:var(--band,var(--ochre));display:grid;place-items:center;
    box-shadow:0 1px 2px rgba(85,32,46,.05),0 14px 34px rgba(85,32,46,.14);}
  .tone-ochre{--band:var(--ochre);} .tone-peri{--band:var(--peri);} .tone-sand{--band:#F1E2CC;}
  .shot img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;}
  .shot svg{width:100%;height:100%;padding:16px;color:var(--wine);}
  h1{font-size:clamp(2.4rem,6vw,3.8rem);font-weight:800;letter-spacing:-.03em;line-height:.95;}
  .facts{margin-top:10px;font-size:.82rem;font-weight:700;letter-spacing:.1em;text-transform:uppercase;opacity:.55;}
  .bio{margin-top:18px;font-size:1.05rem;font-weight:600;line-height:1.6;opacity:.85;}
  .tags{display:flex;flex-wrap:wrap;gap:8px;margin-top:20px;}
  .tags span{font-size:.72rem;font-weight:800;letter-spacing:.08em;text-transform:uppercase;
    background:rgba(85,32,46,.06);border:1px solid rgba(85,32,46,.07);border-radius:999px;padding:6px 12px;}
  .note{margin-top:20px;font-size:.8rem;font-weight:600;opacity:.5;line-height:1.5;}
  .share{display:flex;flex-wrap:wrap;align-items:center;gap:10px;margin-top:26px;}
  .share b{font-size:12px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;opacity:.6;margin-right:4px;}
  .sbtn{display:inline-grid;place-items:center;width:42px;height:42px;border-radius:999px;cursor:pointer;
    border:2px solid rgba(85,32,46,.18);background:transparent;color:var(--wine);text-decoration:none;
    transition:border-color .2s,background .2s,color .2s;}
  .sbtn:hover{border-color:var(--wine);background:var(--wine);color:var(--cream);}
  .sbtn svg{width:19px;height:19px;}
  .copied{font-size:12px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:var(--royal);}
  .ask{margin-top:clamp(44px,6vw,72px);border-top:1px solid rgba(85,32,46,.12);padding-top:clamp(30px,4vw,44px);}
  .ask h2{font-size:clamp(1.5rem,3vw,2.1rem);font-weight:800;letter-spacing:-.02em;}
  .ask > p{margin-top:10px;font-weight:600;line-height:1.55;opacity:.8;max-width:52ch;}
  form{margin-top:24px;max-width:620px;}
  .frow{display:grid;grid-template-columns:1fr 1fr;gap:0 16px;}
  @media (max-width:640px){.frow{grid-template-columns:1fr;}}
  .field{display:flex;flex-direction:column;gap:8px;margin-bottom:16px;}
  .field label{font-size:12px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;opacity:.8;}
  .field input,.field textarea{font-family:var(--font);font-size:1rem;font-weight:600;color:var(--wine);
    background:var(--white);border:1.5px solid rgba(85,32,46,.25);border-radius:12px;padding:13px 14px;width:100%;}
  .field textarea{resize:vertical;min-height:100px;}
  .field input:focus,.field textarea:focus{outline:3px solid var(--royal);outline-offset:1px;border-color:var(--royal);}
  .btn{display:inline-flex;align-items:center;gap:10px;font-family:var(--font);font-size:13px;font-weight:800;
    letter-spacing:.14em;text-transform:uppercase;text-decoration:none;border-radius:999px;padding:16px 30px;
    border:0;cursor:pointer;background:var(--wine);color:var(--cream);transition:transform .15s,background .2s;}
  .btn:hover{transform:translateY(-2px);background:var(--wine-deep);}
  .btn[disabled]{opacity:.6;transform:none !important;cursor:default;}
  .err{margin-top:14px;font-size:.95rem;font-weight:700;color:#B3261E;line-height:1.5;max-width:52ch;}
  .privacy{margin-top:14px;font-size:.85rem;font-weight:600;opacity:.6;line-height:1.5;max-width:52ch;}
  .ok{text-align:center;padding:30px 0;}
  .ok h2{font-size:clamp(1.6rem,3.4vw,2.3rem);font-weight:800;text-transform:uppercase;letter-spacing:-.02em;}
  .ok p{margin-top:12px;font-weight:600;opacity:.8;}
  .ok .btn{margin-top:24px;}
  footer{background:var(--wine);color:var(--cream);padding:48px 0 32px;margin-top:auto;}
  .foot{display:flex;justify-content:space-between;gap:16px;flex-wrap:wrap;font-size:12px;font-weight:600;
    letter-spacing:.06em;opacity:.75;}
  footer a{color:var(--cream);}
  @media (prefers-reduced-motion:reduce){*{animation:none !important;transition:none !important;}}
</style>
</head>
<body>
${sprite}
<header>
  <div class="wrap nav">
    <a class="wordmark" href="${base}/">Sapiens</a>
    <nav class="nav-right">
      <a href="${base}/events/">${esc(t.nav.events)}</a>
      <a href="${base}/pets/">${esc(t.nav.pets)}</a>
      <a href="${base}/join/">${esc(t.nav.join)}</a>
      <a class="lang" href="${alt}">${t.otherLabel}</a>
    </nav>
  </div>
</header>

<main>
  <div class="wrap">
    <a class="back" href="${base}/pets/">&larr; ${esc(t.back)}</a>

    <div class="hero">
      <div class="shot tone-${pet.tone}">${art}</div>
      <div>
        <h1>${esc(pet.name)}</h1>
        <p class="facts">${esc(kind)} &middot; ${esc(age)} &middot; ${esc(pet.place)}</p>
        <p class="bio">${esc(bio)}</p>
        <div class="tags">${tags.map(x => `<span>${esc(x)}</span>`).join('')}</div>
        <p class="note">${esc(t.placeholder)}</p>
        <div class="share">
          <b>${esc(t.share)}</b>
          <a class="sbtn" id="waBtn" href="#" target="_blank" rel="noopener" aria-label="WhatsApp">
            <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18a8 8 0 0 1-4.1-1.1l-.3-.2-3 .8.8-2.9-.2-.3A8 8 0 1 1 12 20Z"/><path d="M9.5 7.6c-.2-.4-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3c-.3.3-.9.9-.9 2.1s.9 2.5 1 2.7c.1.2 1.8 2.8 4.4 3.9 1.6.6 2.2.7 3 .6.5-.1 1.4-.6 1.6-1.2.2-.6.2-1.1.1-1.2 0-.1-.2-.2-.4-.3l-1.6-.8c-.2-.1-.4-.1-.5.1l-.7.9c-.1.2-.3.2-.5.1a6.5 6.5 0 0 1-3.2-2.8c-.1-.2 0-.4.1-.5l.4-.5.2-.4v-.4Z"/></svg>
          </a>
          <a class="sbtn" id="tgBtn" href="#" target="_blank" rel="noopener" aria-label="Telegram">
            <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M21.9 4.3 18.7 19c-.2 1-.9 1.3-1.8.8l-4.9-3.6-2.4 2.3c-.3.3-.5.5-1 .5l.4-5 9.1-8.2c.4-.3-.1-.5-.6-.2L6.2 12.1l-4.8-1.5c-1-.3-1-1 .2-1.5l18.9-7.3c.9-.3 1.6.2 1.4 1.5Z"/></svg>
          </a>
          <button class="sbtn" id="copyBtn" type="button" aria-label="${esc(t.copy)}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></svg>
          </button>
          <span class="copied" id="copied" hidden>${esc(t.copied)}</span>
        </div>
      </div>
    </div>

    <section class="ask" id="ask">
      <div id="askMain">
        <h2>${esc(t.askTitle.replace('{name}', pet.name))}</h2>
        <p>${esc(t.askText.replace('{name}', pet.name))}</p>
        <form id="petForm" novalidate="false">
          <input type="text" name="_honey" style="display:none" tabindex="-1" autocomplete="off" aria-hidden="true">
          <div class="frow">
            <div class="field">
              <label for="fName">${esc(t.name)}</label>
              <input id="fName" name="Name" type="text" required autocomplete="name" maxlength="100">
            </div>
            <div class="field">
              <label for="fEmail">${esc(t.email)}</label>
              <input id="fEmail" name="Email" type="email" required autocomplete="email" maxlength="120">
            </div>
          </div>
          <div class="field">
            <label for="fPhone">${esc(t.phone)}</label>
            <input id="fPhone" name="Phone" type="text" maxlength="100">
          </div>
          <div class="field">
            <label for="fMsg">${esc(t.msg)}</label>
            <textarea id="fMsg" name="Message" maxlength="1500"></textarea>
          </div>
          <button class="btn" type="submit" id="sendBtn">${esc(t.send)}</button>
          <p class="err" id="formErr" hidden></p>
          <p class="privacy">${esc(t.privacy)}</p>
        </form>
      </div>
      <div class="ok" id="askOk" hidden>
        <h2>${esc(t.okTitle)}</h2>
        <p>${esc(t.okText)}</p>
        <a class="btn" href="${base}/pets/">${esc(t.back)}</a>
      </div>
    </section>
  </div>
</main>

<footer>
  <div class="wrap foot">
    <span>&copy; <span id="yr"></span> ${esc(t.credit)}</span>
    <span><a href="${base}/privacy/">${esc(t.footPrivacy)}</a> &nbsp;&middot;&nbsp;
    <a href="https://www.instagram.com/sapiens.cz/" target="_blank" rel="noopener">instagram.com/sapiens.cz</a></span>
  </div>
</footer>

<script>
  document.getElementById('yr').textContent=new Date().getFullYear();
  (function(){
    var url=location.href, name=${JSON.stringify(pet.name)};
    var text=name+' — ${esc(t.looking)}';
    document.getElementById('waBtn').href='https://wa.me/?text='+encodeURIComponent(text+' '+url);
    document.getElementById('tgBtn').href='https://t.me/share/url?url='+encodeURIComponent(url)+'&text='+encodeURIComponent(text);
    var cb=document.getElementById('copyBtn'), done=document.getElementById('copied');
    cb.addEventListener('click',function(){
      (navigator.clipboard?navigator.clipboard.writeText(url):Promise.reject()).then(function(){
        done.hidden=false; setTimeout(function(){done.hidden=true;},2200);
      }).catch(function(){ prompt('${esc(t.copy)}', url); });
    });
  })();
  (function(){
    var form=document.getElementById('petForm');
    if(!form) return;
    var petName=${JSON.stringify(pet.name)};
    var btn=document.getElementById('sendBtn'), err=document.getElementById('formErr');
    var TG={token:${JSON.stringify(TG.token)},chat:${JSON.stringify(TG.chat)}};
    var esc=function(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');};
    form.addEventListener('submit',function(e){
      e.preventDefault();
      if(!form.reportValidity()) return;
      if(form.querySelector('[name="_honey"]').value){
        document.getElementById('askMain').hidden=true;
        document.getElementById('askOk').hidden=false; return;
      }
      err.hidden=true;
      var last=0; try{last=parseInt(localStorage.getItem('sapiens-pets-ts')||'0',10);}catch(x){}
      if(Date.now()-last<60000){ err.textContent=${JSON.stringify(T[lang].cool)}; err.hidden=false; return; }
      btn.disabled=true; btn.textContent=${JSON.stringify(T[lang].sending)};
      var v=function(n){var el=form.querySelector('[name="'+n+'"]');return el?el.value.trim():'';};
      var lines=['\\u{1F43E} <b>New adoption enquiry</b>',
        '<b>Interested in:</b> '+esc(petName),
        '<b>Name:</b> '+esc(v('Name')),
        '<b>Email:</b> '+esc(v('Email'))];
      if(v('Phone')) lines.push('<b>Phone/IG:</b> '+esc(v('Phone')));
      if(v('Message')) lines.push('','<b>Message:</b>',esc(v('Message')));
      lines.push('','\\u2014 '+esc(location.href)+' [${lang}]');
      fetch('https://api.telegram.org/bot'+TG.token+'/sendMessage',{
        method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({chat_id:TG.chat,text:lines.join('\\n'),parse_mode:'HTML',disable_web_page_preview:true})
      }).then(function(r){return r.json();}).then(function(d){
        if(d&&d.ok){
          try{localStorage.setItem('sapiens-pets-ts',String(Date.now()));}catch(x){}
          document.getElementById('askMain').hidden=true;
          document.getElementById('askOk').hidden=false;
        } else { throw new Error('telegram not ok'); }
      }).catch(function(){ err.textContent=${JSON.stringify(T[lang].err)}; err.hidden=false; })
        .finally(function(){ btn.disabled=false; btn.textContent=${JSON.stringify(T[lang].send)}; });
    });
  })();
</script>
</body>
</html>
`;
}

// ---------- write the pages ----------
const ids = new Set(PETS.map(p => p.id));
let written = 0;
for (const pet of PETS) {
  for (const lang of ['en', 'cs']) {
    const dir = lang === 'cs' ? `cs/pets/${pet.id}` : `pets/${pet.id}`;
    mkdirSync(dir, { recursive: true });
    writeFileSync(`${dir}/index.html`, page(pet, lang), 'utf-8');
    written++;
  }
}

// drop folders for animals that are no longer in the list
for (const root of ['pets', 'cs/pets']) {
  for (const entry of readdirSync(root, { withFileTypes: true })) {
    if (entry.isDirectory() && !ids.has(entry.name)) {
      rmSync(`${root}/${entry.name}`, { recursive: true, force: true });
      console.log('removed stale', `${root}/${entry.name}`);
    }
  }
}

// ---------- keep the sitemap in step ----------
const SM = 'sitemap.xml';
const smSrc = readFileSync(SM, 'utf-8');
const START = '  <!-- pets:start -->', END = '  <!-- pets:end -->';
const block = PETS.map(p => ['en', 'cs'].map(lang => {
  const loc = lang === 'cs' ? `${SITE}/cs/pets/${p.id}/` : `${SITE}/pets/${p.id}/`;
  return `  <url>
    <loc>${loc}</loc>
    <xhtml:link rel="alternate" hreflang="en" href="${SITE}/pets/${p.id}/"/>
    <xhtml:link rel="alternate" hreflang="cs" href="${SITE}/cs/pets/${p.id}/"/>
  </url>`;
}).join('\n')).join('\n');

let out;
if (smSrc.includes(START) && smSrc.includes(END)) {
  out = smSrc.replace(new RegExp(START.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '[\\s\\S]*?' + END.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')),
    `${START}\n${block}\n${END}`);
} else {
  out = smSrc.replace('</urlset>', `${START}\n${block}\n${END}\n</urlset>`);
}
writeFileSync(SM, out, 'utf-8');

console.log(`build-pets: ${written} pages for ${PETS.length} animals, sitemap updated`);
