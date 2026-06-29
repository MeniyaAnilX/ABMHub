ABMHub v69 — Vercel No-Lock Install Fix

This version fixes deployments stuck at "Installing dependencies...".

Reason:
- v68 pinned future/latest package combinations and Vercel started peer dependency resolution warnings around eslint/eslint-config-next.
- For this project, eslint is not needed for production build.
- Lockfiles can also keep Vercel stuck with old cache.

Changes:
- Removed all lockfiles.
- Removed eslint/eslint-config-next from devDependencies.
- Removed packageManager pin.
- Added .npmrc:
  registry=https://registry.npmjs.org/
  legacy-peer-deps=true
  package-lock=false
- Added vercel.json:
  npm install --legacy-peer-deps --no-audit --no-fund --no-package-lock
- Kept v67 Ads Admin features.

Vercel steps:
1. Push extracted v69 Source files to GitHub.
2. Vercel → Project → Deployments → Redeploy → Redeploy without Build Cache.
3. If still stuck, cancel stuck deployment first, then redeploy without cache again.
4. Do not upload package-lock.json.

Admin email:
admin@abmhub.xyz

Ads SQL:
Run ABMHub_Ads_Settings_SQL_v67.sql in Supabase if not already done.
