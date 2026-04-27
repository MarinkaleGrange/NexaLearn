# NexaLearn Setup Status

## Completed Locally By Codex

- Moved project and git history to:
  - `C:\Users\legra\NexaLearn`
- Added Cloudflare config baseline:
  - `wrangler.toml`
  - `_headers`
  - `cloudflare/pages-env.example.txt`
- Added environment template:
  - `.env.example`
- Added Supabase baseline:
  - `supabase/config.toml`
  - `supabase/migrations/20260427_001_init.sql`
- Added detailed platform setup docs:
  - `MANUAL_SETUP_GITHUB_CLOUDFLARE_SUPABASE.md`
  - `MANUAL_SETUP_DETAILED.md`
- Added GitHub deploy workflow template:
  - `.github/workflows/cloudflare-pages.yml`
- Added Supabase storage and admin migration:
  - `supabase/migrations/20260427_002_storage_and_admin.sql`
- Added local preflight verification script:
  - `scripts/preflight.ps1`

## Still Required (External Dashboards)

1. GitHub remote finalization:
   - Replace placeholder in `origin` URL with your username.
   - Push `main`.

2. Cloudflare Pages:
   - Connect GitHub repo.
   - Deploy from root (`/`).
   - Add custom domain.
   - Add environment variables from:
     - `cloudflare/pages-env.example.txt`

3. Supabase:
   - Create project.
   - Run SQL migration:
     - `supabase/migrations/20260427_001_init.sql`
   - Configure Auth redirect URLs.
   - Create storage buckets and policies.

4. Payments:
   - Activate PayFast merchant account and webhook URLs.
   - Confirm EFT + SnapScan reconciliation process.

5. App integration phase:
   - Replace localStorage flows in `app.js` with Supabase CRUD + Auth.

6. GitHub Action secrets:
   - `CLOUDFLARE_API_TOKEN`
   - `CLOUDFLARE_ACCOUNT_ID`
   - `CLOUDFLARE_PAGES_PROJECT`

## Quick Commands (Run Manually)

```powershell
cd "C:\Users\legra\NexaLearn"
git remote set-url origin https://github.com/<your-username>/NexaLearn.git
git push -u origin main
```
