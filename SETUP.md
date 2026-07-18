# Sapiens — remaining setup (needs your accounts)

Three quick tasks that can't be done without your logins. Each takes ~5–15 minutes.

## 1. Google Search Console (SEO — do this first)

1. Go to https://search.google.com/search-console and sign in with your Google account.
2. Add property → **Domain** → enter `sapienscz.com`.
3. Google shows a TXT record like `google-site-verification=abc123...`.
   In **GoDaddy → DNS for sapienscz.com** add:
   - Type: `TXT` · Name: `@` · Value: (the string Google gave you)
4. Back in Search Console click **Verify** (may take a few minutes).
5. Open **Sitemaps** in the left menu and submit: `https://sapienscz.com/sitemap.xml`

After a few days you'll see what people search to find the site.

## 2. Email — hello@sapienscz.com (free forwarding via ImprovMX)

1. Create a free account at https://improvmx.com and add the domain `sapienscz.com`.
2. In **GoDaddy → DNS for sapienscz.com** add exactly these records:
   - Type: `MX` · Name: `@` · Value: `mx1.improvmx.com` · Priority: `10`
   - Type: `MX` · Name: `@` · Value: `mx2.improvmx.com` · Priority: `20`
   - Type: `TXT` · Name: `@` · Value: `v=spf1 include:spf.improvmx.com ~all`
   (⚠️ If any other MX records exist, delete them — there should be only these two.)
3. In ImprovMX create the alias: `hello` → your Gmail address.
4. Send a test email to hello@sapienscz.com and check it arrives.
5. Tell Claude "email works" — the **Write to us** button will then be switched
   from Instagram to `mailto:hello@sapienscz.com`.

To also *send* as hello@sapienscz.com from Gmail: ImprovMX dashboard → SMTP
credentials → add in Gmail Settings → Accounts → "Send mail as".

## 3. Analytics — GoatCounter (free, no cookie banner needed)

1. Create an account at https://www.goatcounter.com (pick a code, e.g. `sapienscz`).
2. It gives you a snippet like:
   `<script data-goatcounter="https://sapienscz.goatcounter.com/count" async src="//gc.zgo.at/count.js"></script>`
3. Send the snippet (or just your code) to Claude — it will be added to all pages.

## Waiting on decisions (no rush)

- **Donations**: a transparent bank account or Darujme.cz profile → the
  "Support the project" card on the homepage will link to it directly.
- **Team section**: names/photos of the people behind Sapiens → builds trust.
- **Real events**: dates + photos for the /events/ cards.
- **Original photos**: full-resolution versions to replace the 1080px IG crops.
