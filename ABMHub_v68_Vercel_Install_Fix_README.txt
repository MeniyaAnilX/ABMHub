ABMHub v68 — Vercel Install Fix

Issue fixed:
- v67 ZIP included package-lock.json generated inside ChatGPT sandbox.
- That lockfile contained internal registry URLs like packages.applied-caas-gateway...
- Vercel cannot access that private/internal registry, so deployment can stay stuck at "Installing dependencies..."

What changed:
- Removed bad package-lock.json.
- Added .npmrc to force public npm registry: https://registry.npmjs.org/
- Pinned package.json dependency versions instead of using "latest".
- Added vercel.json with explicit install/build commands.
- Ads Admin v67 features are kept.

Deploy:
1. Extract ABMHub_v68_Vercel_Install_Fix_Source.zip.
2. Push extracted source files to GitHub.
3. Vercel redeploys.
4. In Vercel, use "Redeploy without Build Cache" one time if old cache is stuck.
5. Run ABMHub_Ads_Settings_SQL_v67.sql in Supabase if not already done.
