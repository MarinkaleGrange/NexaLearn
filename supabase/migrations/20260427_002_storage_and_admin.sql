-- Storage buckets + policies + admin helper

insert into storage.buckets (id, name, public)
values
  ('school-reports', 'school-reports', false),
  ('custom-resource-uploads', 'custom-resource-uploads', false),
  ('session-materials', 'session-materials', false),
  ('marketplace-pdfs', 'marketplace-pdfs', false)
on conflict (id) do nothing;

-- Parents can upload and read their own student-school related docs.
drop policy if exists school_reports_parent_upload on storage.objects;
create policy school_reports_parent_upload
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'school-reports'
);

drop policy if exists school_reports_parent_read on storage.objects;
create policy school_reports_parent_read
on storage.objects
for select
to authenticated
using (
  bucket_id = 'school-reports'
);

drop policy if exists custom_uploads_parent_insert on storage.objects;
create policy custom_uploads_parent_insert
on storage.objects
for insert
to authenticated
with check (bucket_id = 'custom-resource-uploads');

drop policy if exists custom_uploads_parent_read on storage.objects;
create policy custom_uploads_parent_read
on storage.objects
for select
to authenticated
using (bucket_id = 'custom-resource-uploads');

-- Session materials: admins manage, authenticated users read via signed URL flow in app.
drop policy if exists session_materials_admin_write on storage.objects;
create policy session_materials_admin_write
on storage.objects
for all
to authenticated
using (
  bucket_id = 'session-materials'
  and public.current_user_role() = 'admin'
)
with check (
  bucket_id = 'session-materials'
  and public.current_user_role() = 'admin'
);

drop policy if exists session_materials_authenticated_read on storage.objects;
create policy session_materials_authenticated_read
on storage.objects
for select
to authenticated
using (bucket_id = 'session-materials');

-- Marketplace PDFs: public read, admin write.
drop policy if exists marketplace_public_read on storage.objects;
create policy marketplace_public_read
on storage.objects
for select
using (bucket_id = 'marketplace-pdfs');

drop policy if exists marketplace_admin_write on storage.objects;
create policy marketplace_admin_write
on storage.objects
for all
to authenticated
using (
  bucket_id = 'marketplace-pdfs'
  and public.current_user_role() = 'admin'
)
with check (
  bucket_id = 'marketplace-pdfs'
  and public.current_user_role() = 'admin'
);

-- Helper comment:
-- To promote a user to admin after signup, run in SQL editor:
-- update public.profiles set role = 'admin' where id = '<USER_UUID>';

