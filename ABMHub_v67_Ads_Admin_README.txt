# ABMHub v67 Ads Admin Update

## What changed

- Added Admin Panel -> Ads Settings.
- Admin can paste A-ADS, AdSense, iframe, or script code directly.
- Homepage supports 1-2 ads per page.
- Project detail/post pages support 1-2 ads per page.
- Ad code is rendered with iframe/script support through a dedicated AdSlot component.
- Ads are responsive and non-sticky/non-popup for better UX.

## Admin email

Final admin email: admin@abmhub.xyz
Backup/old admin email also kept in SQL: abmcryptox@gmail.com

## Supabase setup

Run this file in Supabase SQL Editor:

ABMHub_Ads_Settings_SQL_v67.sql

After running SQL, open /admin, login as admin, and paste your ad code in Ads Settings.

## Best placement

- Home/Main Site Ad Code: paste A-ADS verification code here first.
- Home Cards Middle Ad Code: optional second ad after project cards.
- Post/Project Detail Top Ad Code: first ad after summary.
- Post/Project Detail Bottom Ad Code: second ad before disclaimer.

Keep Max Ads Per Page = 1 or 2 only.

## Deploy

1. Upload/push source to GitHub.
2. Vercel auto deploy.
3. Run Supabase SQL if not already done.
4. Open /admin -> Ads Settings -> paste code -> Save Ads.
5. Click A-ADS verify after code appears on homepage.
