-- =====================================================================
-- OneTools — Bổ sung: bảng "releases" (phiên bản cài đặt) + nơi lưu file .exe
-- Chạy file này SAU khi đã chạy schema.sql — an toàn, chỉ thêm mới.
-- =====================================================================

-- ---------- 1. Bảng lưu thông tin từng bản phát hành ----------
create table if not exists public.releases (
  id uuid primary key default gen_random_uuid(),
  version text not null,                 -- vd '1.5.0'
  file_name text not null,               -- vd 'OneToolsSetup_v1.5.0.exe'
  download_url text not null,            -- link công khai tới file trong Storage
  file_size_mb numeric not null default 0,
  revit_versions text not null default '2025 · 2026',
  release_notes_vi text not null default '',
  release_notes_en text not null default '',
  is_latest boolean not null default false,  -- chỉ 1 bản được đánh dấu true tại 1 thời điểm
  published_at timestamptz not null default now()
);

alter table public.releases enable row level security;

drop policy if exists "Public read releases" on public.releases;
create policy "Public read releases"
  on public.releases for select
  using (true);

drop policy if exists "Admin manage releases" on public.releases;
create policy "Admin manage releases"
  on public.releases for all
  using (public.is_admin())
  with check (public.is_admin());

-- Tự động đảm bảo chỉ 1 bản là "is_latest = true" — mỗi khi đánh dấu 1 bản mới nhất,
-- các bản khác tự bỏ đánh dấu, tránh anh quên gỡ đánh dấu bản cũ.
create or replace function public.enforce_single_latest_release()
returns trigger as $$
begin
  if new.is_latest = true then
    update public.releases set is_latest = false where id <> new.id;
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_release_latest_change on public.releases;
create trigger on_release_latest_change
  after insert or update of is_latest on public.releases
  for each row
  when (new.is_latest = true)
  execute procedure public.enforce_single_latest_release();

-- ---------- 2. Nơi lưu file cài đặt (.exe) ----------
insert into storage.buckets (id, name, public)
values ('installers', 'installers', true)
on conflict (id) do nothing;

-- Ai cũng tải được file (khách bấm nút "Tải về" trên web không cần đăng nhập)
drop policy if exists "Public read installers" on storage.objects;
create policy "Public read installers"
  on storage.objects for select
  using (bucket_id = 'installers');

-- Chỉ admin mới được upload/xoá file
drop policy if exists "Admin upload installers" on storage.objects;
create policy "Admin upload installers"
  on storage.objects for insert
  with check (bucket_id = 'installers' and public.is_admin());

drop policy if exists "Admin delete installers" on storage.objects;
create policy "Admin delete installers"
  on storage.objects for delete
  using (bucket_id = 'installers' and public.is_admin());

-- =====================================================================
-- Xong — quay lại trang /admin, tab "Bản cập nhật" sẽ dùng được ngay.
-- =====================================================================
