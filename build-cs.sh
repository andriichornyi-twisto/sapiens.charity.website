#!/bin/bash
# Regenerates cs/index.html — the pre-rendered Czech home page for SEO.
# Run this after any edit to index.html (content or dictionary), then commit both.
# Requires Google Chrome (headless) and python3.
set -euo pipefail
cd "$(dirname "$0")"

CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
TMP="$(mktemp)"

"$CHROME" --headless=new --disable-gpu --no-first-run \
  --lang=cs-CZ --accept-lang=cs-CZ --force-prefers-reduced-motion \
  --virtual-time-budget=6000 \
  --dump-dom "file://$PWD/index.html" 2>/dev/null > "$TMP"

python3 - "$TMP" <<'EOF'
import sys, re
html = open(sys.argv[1], encoding='utf-8').read()
if not html.lstrip().lower().startswith('<!doctype'):
    html = '<!DOCTYPE html>\n' + html

assert 'Lidé potřebují lidi' in html, 'Czech render failed — is Chrome available?'

# root-relative asset/page links (page lives one level deeper)
html = html.replace('src="img/', 'src="/img/')
html = html.replace('href="events/', 'href="/events/')

# this page IS the Czech version
html = html.replace('<link rel="canonical" href="https://sapienscz.com/">',
                    '<link rel="canonical" href="https://sapienscz.com/cs/">')
html = html.replace('<meta property="og:url" content="https://sapienscz.com/">',
                    '<meta property="og:url" content="https://sapienscz.com/cs/">')
html = html.replace('<meta property="og:locale" content="en_US">',
                    '<meta property="og:locale" content="cs_CZ">')
html = html.replace('<meta property="og:locale:alternate" content="cs_CZ">',
                    '<meta property="og:locale:alternate" content="en_US">')
html = html.replace('<meta property="og:title" content="Sapiens — People need people">',
                    '<meta property="og:title" content="Sapiens — Lidé potřebují lidi">')
html = html.replace('<meta property="og:description" content="A social impact project that brings people together through charity and human connection.">',
                    '<meta property="og:description" content="Projekt se sociálním přesahem, který spojuje lidi skrze dobročinnost a lidské propojení.">')

# language default: no saved choice means Czech here
html, n = re.subn(r"setLang\(saved\|\|\(browserCs\?'cs':'en'\)\);", "setLang(saved||'cs');", html)
assert n == 1, 'setLang init line not found'

import os
os.makedirs('cs', exist_ok=True)
open('cs/index.html', 'w', encoding='utf-8').write(html)
print('cs/index.html written,', len(html), 'bytes')
EOF
rm -f "$TMP"
