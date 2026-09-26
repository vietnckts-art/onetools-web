-- =====================================================================
-- OneTools — Bổ sung: chống cấp License trùng khi webhook Paddle gửi lại cùng 1 thông báo
-- Chạy file này TRƯỚC khi deploy Edge Function `paddle-webhook` — an toàn, chỉ thêm cột mới.
-- =====================================================================

alter table public.licenses
  add column if not exists paddle_transaction_id text;

-- Cho phép nhiều dòng NULL (license trial/thủ công không có transaction Paddle) nhưng không cho phép
-- 2 dòng cùng 1 paddle_transaction_id không rỗng — đây là chốt chặn trùng lặp chính.
create unique index if not exists licenses_paddle_transaction_id_key
  on public.licenses (paddle_transaction_id)
  where paddle_transaction_id is not null;

-- =====================================================================
-- Sau khi chạy xong: xem hướng dẫn deploy đầy đủ ở
-- supabase-edge-functions/paddle-webhook/README.md
-- =====================================================================
