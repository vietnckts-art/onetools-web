-- =====================================================================
-- OneTools — PayOS: bảng theo dõi đơn hàng tạo qua payos-create-payment,
-- payos-webhook dùng bảng này để biết cấp License gói nào, cho ai, khi PayOS báo thanh toán xong.
-- Chạy file này TRƯỚC khi deploy 2 Edge Function payos-create-payment / payos-webhook.
-- An toàn: chỉ tạo bảng mới + thêm cột mới, không đụng dữ liệu hiện có.
-- =====================================================================

create table if not exists public.payos_orders (
  order_code bigint primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  plan_id uuid not null references public.pricing_plans(id),
  amount integer not null,
  status text not null default 'pending', -- pending | paid
  payment_link_id text,
  checkout_url text,
  license_key text,
  created_at timestamptz not null default now(),
  paid_at timestamptz
);

alter table public.payos_orders enable row level security;

-- Khách chỉ xem được đơn của chính mình (chỉ để tham khảo sau này nếu cần hiển thị lịch sử —
-- việc ghi/sửa đều do 2 Edge Function làm bằng service role key, bỏ qua RLS, nên KHÔNG cần
-- policy insert/update cho client ở đây).
drop policy if exists "Read own payos orders" on public.payos_orders;
create policy "Read own payos orders"
  on public.payos_orders for select
  using (auth.uid() = user_id);

-- Theo dõi License nào được cấp từ đơn PayOS nào (giống hệt vai trò cột paddle_transaction_id bên
-- luồng Paddle) + chống cấp trùng nếu PayOS gửi lại webhook.
alter table public.licenses
  add column if not exists payos_order_code bigint;

create unique index if not exists licenses_payos_order_code_key
  on public.licenses (payos_order_code)
  where payos_order_code is not null;

-- =====================================================================
-- SAU KHI CHẠY XONG FILE NÀY:
-- 1. Deploy 2 Edge Function:
--      supabase functions deploy payos-create-payment
--      supabase functions deploy payos-webhook
-- 2. Supabase Dashboard → Edge Functions → payos-create-payment → Settings/Secrets, thêm:
--      PAYOS_CLIENT_ID, PAYOS_API_KEY, PAYOS_CHECKSUM_KEY, SITE_URL
-- 3. Supabase Dashboard → Edge Functions → payos-webhook → Settings/Secrets, thêm:
--      PAYOS_CHECKSUM_KEY   (CÙNG giá trị đã nhập ở bước 2)
-- 4. Trang payos.vn → Kênh thanh toán → cấu hình Webhook URL =
--      https://<project-ref>.supabase.co/functions/v1/payos-webhook
--    rồi bấm "Xác nhận Webhook".
-- (3 giá trị PAYOS_CLIENT_ID / PAYOS_API_KEY / PAYOS_CHECKSUM_KEY là bí mật — chỉ nhập trực tiếp vào
-- Secrets trên Supabase Dashboard, KHÔNG dán vào code hay gửi cho ai.)
-- =====================================================================
