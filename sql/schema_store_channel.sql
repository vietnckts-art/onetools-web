-- =====================================================================
-- OneTools — Kênh Autodesk App Store (2026-11-23)
-- Chạy trong Supabase SQL Editor. An toàn khi chạy lại (chỉ thêm mới).
-- =====================================================================

-- Đánh dấu bản phát hành ĐÃ CÓ trên Autodesk App Store (Autodesk duyệt xong).
-- Bấm nút "Đã có trên Store" trong /admin → tab Bản cập nhật.
-- Edge Function activate-seat / confirm-seat-otp: với add-in gửi channel = "store", "bản mới nhất" = bản
-- on_store = true có số phiên bản cao nhất (không dùng cột is_latest của web).
alter table public.releases
  add column if not exists on_store boolean not null default false;

-- Bản 1.3.9 là bản đầu tiên nộp lên Store — chỉ bấm "Đã có trên Store" cho bản này SAU KHI Autodesk duyệt.

-- ---------------------------------------------------------------------
-- Khoá buộc cập nhật THEO KÊNH (web / store).
-- Máy chạy bản THẤP HƠN min_version của kênh mình -> activate-seat / confirm-seat-otp trả status
-- "force_update" -> add-in khoá tool và báo cập nhật (bản Store: báo cài bản mới từ Autodesk App Store).
-- min_version = NULL (mặc định) = không khoá ai.
--
-- Ví dụ khoá bản web cũ hơn 1.4.0, KHÔNG đụng tới khách Store:
--   update public.app_channel_policy set min_version = '1.4.0' where channel = 'web';
-- Gỡ khoá:
--   update public.app_channel_policy set min_version = null where channel = 'web';
-- CHỈ đặt min_version cho kênh 'store' khi bản đó ĐÃ có trên Autodesk App Store (cột "Trên Store" = ✓),
-- nếu không khách Store bị khoá mà không có bản mới để cài.
-- ---------------------------------------------------------------------
create table if not exists public.app_channel_policy (
  channel text primary key check (channel in ('web', 'store')),
  min_version text,
  message_vi text,
  message_en text,
  updated_at timestamptz not null default now()
);

insert into public.app_channel_policy (channel) values ('web'), ('store')
on conflict (channel) do nothing;

alter table public.app_channel_policy enable row level security;

drop policy if exists "Admin manage channel policy" on public.app_channel_policy;
create policy "Admin manage channel policy"
  on public.app_channel_policy for all
  using (public.is_admin())
  with check (public.is_admin());
-- (Edge Function dùng service role nên đọc được, không cần policy public.)
