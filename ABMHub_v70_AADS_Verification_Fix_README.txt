ABMHub v70 — A-ADS Verification Fix

Issue:
A-ADS bot says Not found because it checks the exact URL HTML. In v67-v69, public homepage ads were rendered only after React/Supabase client load, so verification bots may not find the ad code in static/server HTML.

Fix:
- AdSlot now renders saved ad code in initial HTML using dangerouslySetInnerHTML.
- Added /ads-verify page.
- /ads-verify renders the saved ad code server-side from Supabase.
- Keep Admin → Ads Settings and 1–2 ads per page logic.

How to verify A-ADS:
1. Admin → Ads Settings → paste A-ADS code in Home/Main Site Ad Code.
2. Enable Ads ON and Save Ads.
3. Open https://www.abmhub.xyz/ads-verify and confirm ad box appears.
4. In A-ADS ad unit settings, set/check the specified URL as:
   https://www.abmhub.xyz/ads-verify
   OR use the exact URL where the ad is visible.
5. Click Verify embedded HTML code.

Important:
- A-ADS checks only the specified URL, not every page.
- If A-ADS is set to https://abmhub.xyz but the live site redirects/uses https://www.abmhub.xyz, use the exact final URL.
- Wait 1–2 minutes after saving ads because Supabase/schema/cache may delay slightly.

Admin email:
admin@abmhub.xyz
Backup:
abmcryptox@gmail.com
