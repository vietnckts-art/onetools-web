-- =====================================================================
-- OneTools — NGUỒN KHÁCH: lượt tải + lượt đăng ký theo quảng cáo / quốc gia (2026-11-23)
-- Chạy trong Supabase SQL Editor, SAU schema_download_stats.sql. An toàn khi chạy lại.
-- =====================================================================

-- ---------- 1. Lượt tải web: thêm nguồn (UTM) + quốc gia + trang giới thiệu ----------
alter table public.download_events
  add column if not exists utm_source text,
  add column if not exists utm_campaign text,
  add column if not exists country text,
  add column if not exists referrer text;

-- Thay hàm log_download (2 tham số) bằng bản có thêm tham số tuỳ chọn.
-- Code web cũ gọi { p_version, p_source } vẫn chạy được (các tham số mới có giá trị mặc định).
drop function if exists public.log_download(text, text);
create or replace function public.log_download(
  p_version text,
  p_source text default 'web',
  p_utm_source text default null,
  p_utm_campaign text default null,
  p_country text default null,
  p_referrer text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_version is null or not exists (select 1 from public.releases r where r.version = p_version) then
    return;
  end if;
  insert into public.download_events (version, source, user_id, utm_source, utm_campaign, country, referrer)
  values (
    p_version,
    left(coalesce(p_source, 'web'), 20),
    auth.uid(),
    left(lower(p_utm_source), 40),
    left(p_utm_campaign, 60),
    left(upper(p_country), 2),
    left(p_referrer, 80)
  );
end;
$$;

revoke all on function public.log_download(text, text, text, text, text, text) from public;
grant execute on function public.log_download(text, text, text, text, text, text) to anon, authenticated;

-- ---------- 2. Lượt đăng ký (Trial) - Edge Function sign-up ghi vào đây ----------
--  via         : 'addin' (đăng ký trong Revit) | 'web' (trang /signup)
--  country     : quốc gia theo IP (chỉ có khi đăng ký trên web)
--  os_region   : vùng của Windows (Settings > Region), vd 'VN', 'US' - có khi đăng ký trong add-in
--  os_language / time_zone: ngôn ngữ giao diện Windows + múi giờ máy - hỗ trợ đoán quốc gia
--  utm_*       : nguồn quảng cáo (chỉ có khi đăng ký trên web)
create table if not exists public.signup_events (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  user_id uuid,
  email text,
  via text,
  country text,
  os_region text,
  os_language text,
  time_zone text,
  utm_source text,
  utm_campaign text,
  channel text,
  app_version text
);
create index if not exists signup_events_created_idx on public.signup_events (created_at);

alter table public.signup_events enable row level security;

-- Chỉ admin đọc. Không có policy insert: chỉ Edge Function (service role) ghi.
drop policy if exists "Admin read signup_events" on public.signup_events;
create policy "Admin read signup_events"
  on public.signup_events for select
  using (public.is_admin());

-- =====================================================================
-- Xong — /admin → tab "Nguồn khách" đọc 2 bảng download_events + signup_events.
-- =====================================================================
