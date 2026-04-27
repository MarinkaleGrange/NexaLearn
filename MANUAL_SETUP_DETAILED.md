# NexaLearn Full Manual Setup (Detailed)

This is the detailed, end-to-end checklist for everything that still needs dashboard access.

## A) GitHub (Detailed)

1. Open [https://github.com/new](https://github.com/new).
2. Repository name: `NexaLearn`.
3. Visibility: Private (recommended initially).
4. Do not initialize with README/gitignore/license.
5. Click `Create repository`.

Run locally:

```powershell
cd "C:\Users\legra\NexaLearn"
git remote set-url origin https://github.com/<YOUR_GITHUB_USERNAME>/NexaLearn.git
git add .
git commit -m "Add cloudflare+supabase setup scaffolding"
git push -u origin main
```

If you get `nothing to commit`, run only `git push -u origin main`.

## B) Cloudflare Pages (Detailed)

1. Open Cloudflare dashboard.
2. Go to `Workers & Pages` -> `Create application` -> `Pages` -> `Connect to Git`.
3. Connect GitHub account if prompted.
4. Select repo: `NexaLearn`.
5. Build settings:
   - Framework preset: `None`
   - Build command: leave blank
   - Build output directory: `.`
   - Root directory: leave blank
6. Click `Save and Deploy`.

After deployment:

1. Open `Settings` -> `Environment variables`.
2. Add:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SNAPSCAN_LINK`
3. Save and trigger redeploy.

Custom domain:

1. `Custom domains` -> `Set up a custom domain`.
2. Enter preferred domain (`app.yourdomain.com`).
3. Follow DNS instructions.
4. Confirm SSL mode is `Full (strict)`.

## C) GitHub Action for Cloudflare Deploy (Detailed)

In GitHub repo -> `Settings` -> `Secrets and variables` -> `Actions` -> `New repository secret`:

1. `CLOUDFLARE_API_TOKEN`
2. `CLOUDFLARE_ACCOUNT_ID`
3. `CLOUDFLARE_PAGES_PROJECT` (exact Pages project name)

Workflow file already exists at:

- `.github/workflows/cloudflare-pages.yml`

Once secrets are set, every push to `main` can auto-deploy.

## D) Supabase Project (Detailed)

1. Open Supabase dashboard -> `New project`.
2. Name: `nexalearn-prod`.
3. Choose strong DB password and save it.
4. Wait until project is ready.

Collect from `Project Settings -> API`:

1. `Project URL`
2. `anon public key`
3. `service_role key` (server only)

## E) Supabase SQL Migration (Detailed)

In Supabase SQL editor, run in order:

1. `supabase/migrations/20260427_001_init.sql`
2. `supabase/migrations/20260427_002_storage_and_admin.sql`

Then verify:

1. Tables created in `public` schema.
2. RLS is enabled on protected tables.
3. Storage buckets exist:
   - `school-reports`
   - `custom-resource-uploads`
   - `session-materials`
   - `marketplace-pdfs`

## F) Supabase Auth (Detailed)

1. Go to `Authentication` -> `Providers`.
2. Enable `Email` provider.
3. Go to `URL Configuration`.
4. Add:
   - Site URL: your Cloudflare Pages URL or custom domain
   - Redirect URLs: local dev and production URLs
5. Save.

Admin user:

1. Create user in Auth.
2. Get that user UUID.
3. Run SQL:

```sql
insert into public.profiles (id, role, full_name)
values ('<USER_UUID>', 'admin', 'Admin User')
on conflict (id) do update set role = 'admin';
```

## G) Payment Provider Setup (Detailed)

## PayFast

1. Create/verify merchant account.
2. Configure:
   - Return URL: your app success page URL
   - Cancel URL: your app cancel URL
   - Notify URL: your backend webhook endpoint
3. Keep merchant keys private in server environment.

## EFT + SnapScan

1. Keep payment reference format standardized: `[StudentName_Month]`.
2. Daily manual reconciliation:
   - Check received payments.
   - Match reference.
   - Mark order as paid.
3. Handle unmatched references in admin queue.

## H) Security and Compliance (Detailed)

1. Keep `_headers` file in root for Cloudflare Pages security headers.
2. Never expose:
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `PAYFAST_MERCHANT_KEY`
   - `PAYFAST_PASSPHRASE`
3. Keep POPIA/GDPR retention schedule documented:
   - Student/parent data max 24 months after last lesson.
   - Financial data 5 years.
4. Log all terms acceptance in `consent_logs`.

## I) Final Verification Run

Run:

```powershell
cd "C:\Users\legra\NexaLearn"
.\scripts\preflight.ps1
```

Then test in browser:

1. Role restrictions (guest/student/parent/admin)
2. Saturday booking request flow
3. Package usage + expiry behavior
4. Legal PDF links
5. WhatsApp link

