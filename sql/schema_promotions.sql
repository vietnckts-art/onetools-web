-- =====================================================================
-- OneTools — Khuyến mại hiển thị ở khu vực thanh toán (cột PayOS) + tự động trừ giá thật khi tạo đơn
-- PayOS, để nội dung hiển thị và giá thu tiền luôn khớp nhau (user yêu cầu 2026-10-26).
-- Chạy file này SAU khi đã có sql/schema.sql (cần sẵn hàm public.is_admin()).
-- An toàn: chỉ tạo bảng mới + thêm cột mới vào payos_orders, không đụng dữ liệu hiện có.
-- =====================================================================

create table if not exists public.promotions (
  id uuid primary key default gen_random_uuid(),
  title_vi text not null,              -- nội dung banner, vd 'Khuyến mại mừng ra mắt'
  title_en text not null,
  discount_percent int not null check (discount_percent > 0 and discount_percent <= 100),
  valid_from timestamptz not null,
  valid_to timestamptz not null,
  is_active boolean not null default true,   -- tắt nhanh mà không cần xoá/sửa ngày
  created_at timestamptz not null default now()
);

alter table public.promotions enable row level security;

-- Ai cũng đọc được (trang chủ/checkout hiển thị banner không cần đăng nhập)
drop policy if exists "Public read promotions" on public.promotions;
create policy "Public read promotions"
  on public.promotions for select
  using (true);

-- Chỉ admin mới được thêm/sửa/xoá — giống đúng pattern is_admin() đang dùng cho tool_videos/pricing_plans.
drop policy if exists "Admin manage promotions" on public.promotions;
create policy "Admin manage promotions"
  on public.promotions for all
  using (public.is_admin())
  with check (public.is_admin());

-- Lưu lại % đã áp dụng + giá gốc trên từng đơn PayOS, để đối soát sau này (không ảnh hưởng webhook cũ,
-- payos-webhook vẫn chỉ đọc amount/plan_id như trước — amount giờ là giá ĐÃ giảm nếu có khuyến mại).
alter table public.payos_orders
  add column if not exists original_amount integer,
  add column if not exists promo_discount_percent int;

-- =====================================================================
-- LƯU Ý QUAN TRỌNG: khuyến mại ở đây CHỈ áp dụng cho kênh PayOS (trong nước). Kênh Paddle (quốc tế)
-- KHÔNG đọc bảng này — nếu cần giảm giá cho khách Paddle, dùng tính năng Discounts riêng của Paddle
-- (Paddle Dashboard → Catalog → Discounts), vì Paddle tự quản lý giá/thuế của họ.
--
-- Nếu có nhiều đợt khuyến mại trùng ngày hiệu lực, hệ thống chỉ dùng ĐÚNG 1 đợt — đợt được TẠO GẦN
-- ĐÂY NHẤT (created_at mới nhất) — nên tránh để 2 đợt is_active=true chồng ngày nhau cùng lúc.
--
-- SAU KHI CHẠY XONG FILE NÀY:
-- 1. Deploy lại Edge Function: supabase functions deploy payos-create-payment
--    (hoặc dán đè nội dung mới vào Supabase Dashboard → Edge Functions → payos-create-payment → Deploy,
--    nếu chưa cài Supabase CLI trên máy).
-- 2. Vào /admin → tab "Khuyến mại" để tạo đợt khuyến mại đầu tiên.
-- =====================================================================
