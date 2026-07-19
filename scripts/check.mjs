// Smoke checks for the Sapiens site — run by CI on every push (see .github/workflows/checks.yml)
// and locally via: node scripts/check.mjs
import { readFileSync, existsSync } from 'node:fs';
import { Script } from 'node:vm';

const pages = ['index.html', 'events/index.html', 'join/index.html', '404.html', 'privacy/index.html'];
const dictPages = ['index.html', 'events/index.html', 'join/index.html', 'privacy/index.html'];
let failures = 0;
const fail = msg => { failures++; console.error('✗ ' + msg); };
const ok = msg => console.log('✓ ' + msg);

for (const page of pages) {
  const html = readFileSync(page, 'utf-8');

  // 1. inline JS parses
  const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];
  for (const [, code] of scripts) {
    try { new Script(code); } catch (e) { fail(`${page}: inline JS syntax error — ${e.message}`); }
  }

  // 2. every data-i18n key exists in both dictionaries
  if (dictPages.includes(page)) {
    const script = scripts.map(s => s[1]).join('\n');
    const en = script.match(/en:\{([\s\S]*?)\n\s*\},\n\s*cs:\{/);
    const cs = script.match(/cs:\{([\s\S]*?)\n\s*\}\n\s*\};/);
    if (!en || !cs) { fail(`${page}: could not locate i18n dictionaries`); }
    else {
      const keys = block => new Set([...block.matchAll(/(\w+):'/g)].map(m => m[1]));
      const enk = keys(en[1]), csk = keys(cs[1]);
      const used = new Set([...html.matchAll(/data-i18n="([^"]+)"/g)].map(m => m[1]));
      for (const k of used) {
        if (!enk.has(k)) fail(`${page}: data-i18n="${k}" missing in EN dictionary`);
        if (!csk.has(k)) fail(`${page}: data-i18n="${k}" missing in CS dictionary`);
      }
      for (const k of enk) if (!csk.has(k)) fail(`${page}: key "${k}" in EN but not CS`);
      for (const k of csk) if (!enk.has(k)) fail(`${page}: key "${k}" in CS but not EN`);
    }
  }

  // 3. local links/assets resolve to real files
  const refs = [...html.matchAll(/(?:href|src)="(\/[^"#?]*|(?:img|js|fonts|events|join|cs|privacy)\/[^"#?]*)"/g)]
    .map(m => m[1])
    .filter(u => !u.startsWith('//'));
  for (let u of refs) {
    u = u.replace(/^\//, '');
    if (u === '') continue;
    const candidates = [u, u.replace(/\/$/, '') + '/index.html'];
    if (!candidates.some(c => existsSync(c))) fail(`${page}: broken local reference "${u}"`);
  }
  ok(`${page} checked`);
}

// 4. pre-rendered Czech pages exist and are actually Czech
for (const cs of ['cs/index.html', 'cs/events/index.html', 'cs/join/index.html']) {
  if (!existsSync(cs)) { fail(`${cs} missing — run ./build-cs.sh`); continue; }
  const html = readFileSync(cs, 'utf-8');
  if (!/lang="cs"/.test(html)) fail(`${cs}: not rendered in Czech — run ./build-cs.sh`);
  else ok(`${cs} is Czech`);
}

if (failures) { console.error(`\n${failures} check(s) failed`); process.exit(1); }
console.log('\nAll checks passed');
