-- =====================================================================
-- OneTools — Thống kê lượt tải + số máy theo phiên bản (2026-11-16)
-- Chạy SAU schema.sql + schema_releases.sql. An toàn để chạy lại nhiều lần.
-- Cần cột license_seats.app_version (đã thêm 2026-11-12).
-- =====================================================================

-- ---------- 1. Bảng ghi mỗi lần bấm "Tải về" ----------
create table if not exists public.download_events (
  id bigint generated always as identity primary key,
  version text not null,
  source text not null default 'web',   -- 'web' (nút Tải về trên trang chủ)
  user_id uuid,                         -- có nếu người tải đang đăng nhập, không thì null
  created_at timestamptz not null default now()
);
create index if not exists download_events_version_idx on public.download_events (version, created_at);

alter table public.download_events enable row level security;

-- Chỉ admin đọc được. KHÔNG có policy insert: khách chỉ ghi được qua hàm log_download bên dưới.
drop policy if exists "Admin read download_events" on public.download_events;
create policy "Admin read download_events"
  on public.download_events for select
  using (public.is_admin());

-- ---------- 2. Hàm ghi 1 lượt tải (web gọi khi bấm nút Tải về) ----------
-- Chỉ ghi khi phiên bản có thật trong bảng releases, để không bị nhét dữ liệu rác.
create or replace function public.log_download(p_version text, p_source text default 'web')
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_version is null or not exists (select 1 from public.releases r where r.version = p_version) then
    return;
  end if;
  insert into public.download_events (version, source, user_id)
  values (p_version, left(coalesce(p_source, 'web'), 20), auth.uid());
end;
$$;

revoke all on function public.log_download(text, text) from public;
grant execute on function public.log_download(text, text) to anon, authenticated;

-- ---------- 3. Hàm thống kê cho trang /admin (chỉ admin nhận được dữ liệu) ----------
-- Mỗi dòng = 1 phiên bản: dl_total, dl_7d (lượt tải web), devices_30d (số máy chạy bản đó, mở OneTools
-- trong 30 ngày qua). Thêm 1 dòng ver = null = số máy hoạt động nhưng chưa rõ phiên bản.
create or replace function public.admin_version_stats()
returns table (ver text, dl_total bigint, dl_7d bigint, devices_30d bigint)
language sql
stable
security definer
set search_path = public
as $$
  with v as (
    select r.version as ver from public.releases r
    union
    select s.app_version from public.license_seats s where s.app_version is not null
    union
    select d.version from public.download_events d
  )
  select
    v.ver,
    (select count(*) from public.download_events d where d.version = v.ver),
    (select count(*) from public.download_events d
       where d.version = v.ver and d.created_at > now() - interval '7 days'),
    (select count(*) from public.license_seats s
       where s.app_version = v.ver and s.last_seen_at > now() - interval '30 days')
  from v
  where public.is_admin()
  union all
  select null, 0, 0,
    (select count(*) from public.license_seats s
       where s.app_version is null and s.last_seen_at > now() - interval '30 days')
  where public.is_admin();
$$;

revoke all on function public.admin_version_stats() from public;
grant execute on function public.admin_version_stats() to authenticated;

-- =====================================================================
-- Xong — mở /admin, tab "Bản cập nhật" sẽ có thêm cột "Lượt tải web" và "Máy đang dùng".
-- =====================================================================
