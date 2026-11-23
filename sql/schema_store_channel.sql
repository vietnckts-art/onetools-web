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
