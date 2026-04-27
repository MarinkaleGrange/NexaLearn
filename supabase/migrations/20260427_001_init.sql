-- NexaLearn baseline schema for Supabase
-- Run this migration in Supabase SQL editor or via Supabase CLI.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('parent', 'student', 'admin')),
  full_name text,
  created_at timestamptz not null default now()
);

create table if not exists public.students (
  id uuid primary key default gen_random_uuid(),
  parent_user_id uuid not null references auth.users(id) on delete cascade,
  student_name text not null,
  age int,
  grade_level text,
  home_language text,
  subjects text,
  created_at timestamptz not null default now()
);

create table if not exists public.lesson_packages (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  package_key text not null check (package_key in ('starter', 'core', 'boost')),
  package_label text not null,
  remaining_lessons int not null,
  purchased_at timestamptz not null default now(),
  expires_on date not null
);

create table if not exists public.tutoring_bookings (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  session_date date not null,
  session_time text not null,
  service_type text not null,
  delivery_mode text not null,
  session_language text not null,
  group_size int not null,
  neuro_addon boolean not null default false,
  amount_zar numeric(10,2) not null,
  created_at timestamptz not null default now()
);

create table if not exists public.saturday_requests (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references public.students(id) on delete set null,
  student_name text not null,
  preferred_datetime timestamptz not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now()
);

create table if not exists public.marketplace_resources (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  grade_level text not null,
  subject text not null,
  language text not null,
  price_zar numeric(10,2) not null,
  file_path text,
  created_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  parent_user_id uuid not null references auth.users(id) on delete cascade,
  total_zar numeric(10,2) not null,
  payment_method text,
  payment_reference text,
  status text not null default 'pending' check (status in ('pending', 'paid', 'failed')),
  created_at timestamptz not null default now()
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  resource_id uuid not null references public.marketplace_resources(id) on delete restrict,
  price_zar numeric(10,2) not null
);

create table if not exists public.consent_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  context text not null,
  accepted_at timestamptz not null default now(),
  terms_version text not null
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.orders(id) on delete set null,
  method text not null check (method in ('EFT', 'PayFast', 'SnapScan')),
  amount_zar numeric(10,2) not null,
  payment_reference text not null,
  verified boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.late_fees (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  fee_zar numeric(10,2) not null default 50.00,
  applied_at timestamptz not null default now()
);

create index if not exists idx_students_parent on public.students(parent_user_id);
create index if not exists idx_bookings_student_date on public.tutoring_bookings(student_id, session_date);
create index if not exists idx_packages_student_expiry on public.lesson_packages(student_id, expires_on);
create index if not exists idx_orders_parent_created on public.orders(parent_user_id, created_at);
create index if not exists idx_payments_reference on public.payments(payment_reference);

alter table public.profiles enable row level security;
alter table public.students enable row level security;
alter table public.lesson_packages enable row level security;
alter table public.tutoring_bookings enable row level security;
alter table public.saturday_requests enable row level security;
alter table public.marketplace_resources enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.consent_logs enable row level security;
alter table public.payments enable row level security;
alter table public.late_fees enable row level security;

create or replace function public.current_user_role()
returns text
language sql
stable
as $$
  select role from public.profiles where id = auth.uid()
$$;

drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own on public.profiles
for select using (id = auth.uid());

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles
for update using (id = auth.uid());

drop policy if exists students_parent_rw on public.students;
create policy students_parent_rw on public.students
for all using (parent_user_id = auth.uid())
with check (parent_user_id = auth.uid());

drop policy if exists packages_parent_read on public.lesson_packages;
create policy packages_parent_read on public.lesson_packages
for select using (
  exists (
    select 1 from public.students s
    where s.id = lesson_packages.student_id
      and s.parent_user_id = auth.uid()
  )
);

drop policy if exists packages_admin_all on public.lesson_packages;
create policy packages_admin_all on public.lesson_packages
for all using (public.current_user_role() = 'admin')
with check (public.current_user_role() = 'admin');

drop policy if exists bookings_parent_rw on public.tutoring_bookings;
create policy bookings_parent_rw on public.tutoring_bookings
for all using (
  exists (
    select 1 from public.students s
    where s.id = tutoring_bookings.student_id
      and s.parent_user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.students s
    where s.id = tutoring_bookings.student_id
      and s.parent_user_id = auth.uid()
  )
);

drop policy if exists saturday_parent_insert on public.saturday_requests;
create policy saturday_parent_insert on public.saturday_requests
for insert with check (auth.uid() is not null);

drop policy if exists saturday_parent_read_own on public.saturday_requests;
create policy saturday_parent_read_own on public.saturday_requests
for select using (
  exists (
    select 1 from public.students s
    where s.id = saturday_requests.student_id
      and s.parent_user_id = auth.uid()
  ) or saturday_requests.student_id is null
);

drop policy if exists saturday_admin_all on public.saturday_requests;
create policy saturday_admin_all on public.saturday_requests
for all using (public.current_user_role() = 'admin')
with check (public.current_user_role() = 'admin');

drop policy if exists resources_public_read on public.marketplace_resources;
create policy resources_public_read on public.marketplace_resources
for select using (true);

drop policy if exists resources_admin_write on public.marketplace_resources;
create policy resources_admin_write on public.marketplace_resources
for all using (public.current_user_role() = 'admin')
with check (public.current_user_role() = 'admin');

drop policy if exists orders_parent_rw on public.orders;
create policy orders_parent_rw on public.orders
for all using (parent_user_id = auth.uid())
with check (parent_user_id = auth.uid());

drop policy if exists order_items_parent_read on public.order_items;
create policy order_items_parent_read on public.order_items
for select using (
  exists (
    select 1 from public.orders o
    where o.id = order_items.order_id
      and o.parent_user_id = auth.uid()
  )
);

drop policy if exists consent_user_insert on public.consent_logs;
create policy consent_user_insert on public.consent_logs
for insert with check (user_id = auth.uid());

drop policy if exists consent_user_read on public.consent_logs;
create policy consent_user_read on public.consent_logs
for select using (user_id = auth.uid() or public.current_user_role() = 'admin');

drop policy if exists payments_parent_read on public.payments;
create policy payments_parent_read on public.payments
for select using (
  exists (
    select 1 from public.orders o
    where o.id = payments.order_id
      and o.parent_user_id = auth.uid()
  )
);

drop policy if exists payments_admin_all on public.payments;
create policy payments_admin_all on public.payments
for all using (public.current_user_role() = 'admin')
with check (public.current_user_role() = 'admin');

drop policy if exists late_fees_parent_read on public.late_fees;
create policy late_fees_parent_read on public.late_fees
for select using (
  exists (
    select 1 from public.orders o
    where o.id = late_fees.order_id
      and o.parent_user_id = auth.uid()
  )
);

drop policy if exists late_fees_admin_all on public.late_fees;
create policy late_fees_admin_all on public.late_fees
for all using (public.current_user_role() = 'admin')
with check (public.current_user_role() = 'admin');

insert into public.marketplace_resources (title, grade_level, subject, language, price_zar)
values
  ('Phonics Builder Pack', 'R', 'Literacy', 'English', 95),
  ('Afrikaans Begrip Oefene', '4', 'Afrikaans', 'Afrikaans', 120),
  ('Reading Fluency Cards', '2', 'Literacy', 'English', 110),
  ('CAPS Maths Drill Set', '6', 'Mathematics', 'English', 145),
  ('Taal Remediering Bundle', '7', 'Afrikaans', 'Afrikaans', 150),
  ('Study Skills Planner', '9', 'Study Skills', 'English', 80)
on conflict do nothing;

