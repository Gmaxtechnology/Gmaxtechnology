-- ============================================================
-- GMAX Technology Ltd — Supabase Storage setup for product photos
-- Run this AFTER schema.sql, in Supabase SQL Editor.
-- ============================================================

-- Create a public bucket for product photos (public = anyone can VIEW,
-- but writes are still locked down to admins below).
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

-- Anyone can view/download images (needed so they show up on the public site)
create policy "product_images_public_read"
  on storage.objects for select
  using (bucket_id = 'product-images');

-- Only admins (profiles.is_admin = true) can upload
create policy "product_images_admin_insert"
  on storage.objects for insert
  with check (
    bucket_id = 'product-images'
    and exists (select 1 from profiles p where p.id = auth.uid() and p.is_admin)
  );

-- Only admins can overwrite/replace an image
create policy "product_images_admin_update"
  on storage.objects for update
  using (
    bucket_id = 'product-images'
    and exists (select 1 from profiles p where p.id = auth.uid() and p.is_admin)
  );

-- Only admins can delete an image
create policy "product_images_admin_delete"
  on storage.objects for delete
  using (
    bucket_id = 'product-images'
    and exists (select 1 from profiles p where p.id = auth.uid() and p.is_admin)
  );

-- ============================================================
-- That's it — no manual bucket creation needed in the dashboard.
-- The admin Products page now uploads straight into this bucket.
-- ============================================================
