# NexaLearn Manual Setup (GitHub + Cloudflare + Supabase)

This guide is for deploying the current NexaLearn app with:

- GitHub (source control + CI trigger source)
- Cloudflare Pages (hosting)
- Supabase (database, auth, storage)

---

## 1) Prepare Local Project

Project path:

`C:\Users\legra\NexaLearn`

Confirm required files:

- `index.html`
- `styles.css`
- `app.js`
- `assets/logo.png`
- `assets/privacy-policy.pdf`
- `assets/terms-and-conditions.pdf`

---

## 2) GitHub Setup

## 2.1 Create Repo

1. In GitHub, create a new repository named `NexaLearn`.
2. Keep it private initially.
3. Do not add README/gitignore/license from GitHub UI (you already have local files).

## 2.2 Push Local Project

Run in PowerShell:

```powershell
cd "C:\Users\legra\NexaLearn"
git add .
git commit -m "Initial NexaLearn app scaffold"
git branch -M main
git remote add origin https://github.com/<your-username>/NexaLearn.git
git push -u origin main
```

If remote already exists:

```powershell
git remote set-url origin https://github.com/<your-username>/NexaLearn.git
git push -u origin main
```

---

## 3) Supabase Setup

## 3.1 Create Project

1. Go to Supabase dashboard.
2. Create new project: `nexalearn-prod`.
3. Save these values securely:
   - `Project URL`
   - `anon public key`
   - `service_role key` (server only, never browser)
   - database password

## 3.2 SQL Schema (minimum)

In Supabase SQL Editor, run:

```sql
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('parent','student','admin')),
  full_name text,
  created_at timestamptz default now()
);

create table if not exists students (
  id uuid primary key default gen_random_uuid(),
  parent_user_id uuid not null references auth.users(id) on delete cascade,
  student_name text not null,
  age int,
  grade_level text,
  home_language text,
  subjects text,
  created_at timestamptz default now()
);

create table if not exists lesson_packages (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references students(id) on delete cascade,
  package_key text not null check (package_key in ('starter','core','boost')),
  package_label text not null,
  remaining_lessons int not null,
  purchased_at timestamptz not null default now(),
  expires_on date not null
);

create table if not exists tutoring_bookings (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references students(id) on delete cascade,
  session_date date not null,
  session_time text not null,
  service_type text not null,
  delivery_mode text not null,
  session_language text not null,
  group_size int not null,
  neuro_addon boolean default false,
  amount_zar numeric(10,2) not null,
  created_at timestamptz default now()
);

create table if not exists saturday_requests (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references students(id) on delete set null,
  student_name text not null,
  preferred_datetime timestamptz not null,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  created_at timestamptz default now()
);

create table if not exists marketplace_resources (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  grade_level text not null,
  subject text not null,
  language text not null,
  price_zar numeric(10,2) not null,
  file_path text
);

create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  parent_user_id uuid not null references auth.users(id) on delete cascade,
  total_zar numeric(10,2) not null,
  payment_method text,
  payment_reference text,
  status text not null default 'pending' check (status in ('pending','paid','failed')),
  created_at timestamptz default now()
);

create table if not exists order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  resource_id uuid not null references marketplace_resources(id) on delete restrict,
  price_zar numeric(10,2) not null
);

create table if not exists consent_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  context text not null,
  accepted_at timestamptz default now(),
  terms_version text not null
);
```

## 3.3 Row Level Security (RLS)

Enable RLS on all user data tables and start with strict policies. Example:

```sql
alter table students enable row level security;

create policy "parents see own students"
on students for select
using (parent_user_id = auth.uid());

create policy "parents insert own students"
on students for insert
with check (parent_user_id = auth.uid());
```

Do similar role-aware policies for bookings, orders, packages, and saturday_requests.

## 3.4 Auth

In Supabase Auth settings:

1. Enable Email auth.
2. Configure email templates.
3. Set redirect URLs:
   - local: `http://localhost:3000` (or your dev URL)
   - production: `https://<your-domain>`
4. Create initial admin user, then set `profiles.role = 'admin'`.

## 3.5 Storage Buckets

Create private buckets:

1. `school-reports`
2. `custom-resource-uploads`
3. `session-materials`
4. `marketplace-pdfs`

Set policies so only authorized users can access signed URLs.

---

## 4) Cloudflare Setup

## 4.1 Cloudflare Pages Project

1. In Cloudflare dashboard -> Pages -> Create project.
2. Connect GitHub and select `NexaLearn` repo.
3. Build settings for static app:
   - Build command: leave blank
   - Build output directory: `/`
4. Deploy.

## 4.2 Custom Domain + DNS

1. Add your domain to Cloudflare (if not already).
2. In Pages project -> Custom domains -> add `app.<yourdomain>` or root domain.
3. Confirm DNS records are created automatically.
4. Enable SSL/TLS Full (strict).

## 4.3 Environment Variables (Pages)

Set in Pages -> Settings -> Environment variables:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `PAYFAST_MERCHANT_ID` (when backend added)
- `PAYFAST_MERCHANT_KEY` (server-side only)
- `SNAPSCAN_LINK` = `https://pos.snapscan.io/qr/uajMqmLI`

Never put `SUPABASE_SERVICE_ROLE_KEY` in frontend/public environment.

## 4.4 Security Headers

Add `_headers` file or Cloudflare transform rules:

```text
/*
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  Referrer-Policy: no-referrer-when-downgrade
  Permissions-Policy: geolocation=(), microphone=(), camera=()
```

---

## 5) App Integration Tasks (Manual)

Current app uses localStorage. To make it production:

1. Add Supabase JS client.
2. Replace local state writes with DB inserts/updates.
3. Replace role dropdown with real auth session + role from `profiles`.
4. Load resources/orders/sessions from Supabase.
5. Store uploads in Supabase Storage via signed uploads.

---

## 6) Payments (Manual External Setup)

## 6.1 PayFast

1. Create merchant account and complete verification.
2. Configure:
   - return URL
   - cancel URL
   - notify URL (webhook endpoint)
3. Use payment reference format:
   - `[StudentName_Month]`

## 6.2 EFT and SnapScan Reconciliation

1. Daily check for incoming payments.
2. Match by reference format.
3. Mark `orders.status = 'paid'` only after confirmation.
4. Keep audit trail in DB.

---

## 7) Minimum Go-Live Tests

1. Parent can create bookings, student cannot access admin pages.
2. Saturday cannot be booked via normal calendar.
3. Package expiry and remaining lessons enforce correctly.
4. Terms acceptance is logged in `consent_logs`.
5. Privacy/Terms PDFs open in production.
6. WhatsApp button opens `+27 66 051 0002`.
7. Address appears only on booking success and message templates.

---

## 8) Recommended Next Implementation

1. Add Supabase client integration in frontend.
2. Add Cloudflare Worker or Supabase Edge Function for payment webhooks.
3. Add email/SMS reminders from backend events.
4. Move all pricing/discount rules to backend validation.
