#!/bin/bash
# Regenerates cs/index.html and cs/events/index.html — the pre-rendered Czech
# pages for SEO. Run after any edit to index.html or events/index.html, then
# commit the cs/ output too. (CI also runs this via .github/workflows/build-cs.yml.)
# Requires Chrome/Chromium (headless) and python3.
set -euo pipefail
cd "$(dirname "$0")"

CHROME="${CHROME:-}"
if [ -z "$CHROME" ]; then
  for c in \
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
    "$(command -v google-chrome || true)" \
    "$(command -v chromium-browser || true)" \
    "$(command -v chromium || true)"; do
    if [ -n "$c" ] && [ -x "$c" ]; then CHROME="$c"; break; fi
  done
fi
[ -n "$CHROME" ] || { echo "Chrome not found — set CHROME=/path/to/chrome"; exit 1; }

render () { # $1 = source html, $2 = output dir, $3 = canonical path (e.g. /cs/)
  local tmp; tmp="$(mktemp)"
  "$CHROME" --headless=new --disable-gpu --no-sandbox --no-first-run \
    --lang=cs-CZ --accept-lang=cs-CZ --force-prefers-reduced-motion \
    --virtual-time-budget=6000 \
    --dump-dom "file://$PWD/$1" 2>/dev/null > "$tmp"
  OUT_DIR="$2" CANON="$3" SRC="$1" python3 - "$tmp" <<'EOF'
import sys, re, os
html = open(sys.argv[1], encoding='utf-8').read()
out_dir, canon, src = os.environ['OUT_DIR'], os.environ['CANON'], os.environ['SRC']
if not html.lstrip().lower().startswith('<!doctype'):
    html = '<!DOCTYPE html>\n' + html

assert 'Lidé potřebují lidi' in html or 'Akce — Sapiens' in html, f'Czech render of {src} failed'

# root-relative asset/page links (pages live one level deeper)
html = html.replace('src="img/', 'src="/img/')
html = html.replace('href="events/', 'href="/events/')
html = html.replace('href="join/', 'href="/join/')

# this page IS the Czech version
old_canon = canon.replace('/cs/', '/', 1)
html = html.replace(f'<link rel="canonical" href="https://sapienscz.com{old_canon}">',
                    f'<link rel="canonical" href="https://sapienscz.com{canon}">')
html = html.replace(f'<meta property="og:url" content="https://sapienscz.com{old_canon}">',
                    f'<meta property="og:url" content="https://sapienscz.com{canon}">')
html = html.replace('<meta property="og:locale" content="en_US">',
                    '<meta property="og:locale" content="cs_CZ">')
html = html.replace('<meta property="og:locale:alternate" content="cs_CZ">',
                    '<meta property="og:locale:alternate" content="en_US">')
if src == 'index.html':
    html = html.replace('<meta property="og:title" content="Sapiens — People need people">',
                        '<meta property="og:title" content="Sapiens — Lidé potřebují lidi">')
    html = html.replace('<meta property="og:description" content="A social impact project that brings people together through charity and human connection.">',
                        '<meta property="og:description" content="Projekt se sociálním přesahem, který spojuje lidi skrze dobročinnost a lidské propojení.">')
elif src == 'events/index.html':
    html = html.replace('<meta property="og:title" content="Events — Sapiens">',
                        '<meta property="og:title" content="Akce — Sapiens">')
    html = html.replace('<meta property="og:description" content="Moments we create — come to a Sapiens event or start one of your own.">',
                        '<meta property="og:description" content="Okamžiky, které vytváříme — přijďte na akci Sapiens, nebo vytvořte vlastní.">')
else:
    html = html.replace('<meta property="og:title" content="Join us — Sapiens">',
                        '<meta property="og:title" content="Přidejte se — Sapiens">')
    html = html.replace('<meta property="og:description" content="Volunteer, partner as a business, or ask for help — join the Sapiens society.">',
                        '<meta property="og:description" content="Dobrovolnictví, firemní spolupráce, nebo žádost o pomoc — přidejte se ke komunitě Sapiens.">')
    html = html.replace('value="https://sapienscz.com/join/?sent=1"',
                        'value="https://sapienscz.com/cs/join/?sent=1"')

# language default: no saved choice means Czech here
html, n = re.subn(r"setLang\(saved\|\|\(browserCs\?'cs':'en'\)\);", "setLang(saved||'cs');", html)
assert n == 1, 'setLang init line not found'

os.makedirs(out_dir, exist_ok=True)
path = os.path.join(out_dir, 'index.html')
open(path, 'w', encoding='utf-8').write(html)
print(path, 'written,', len(html), 'bytes')
EOF
  rm -f "$tmp"
}

render index.html          cs        /cs/
render events/index.html   cs/events /cs/events/
render join/index.html     cs/join   /cs/join/
