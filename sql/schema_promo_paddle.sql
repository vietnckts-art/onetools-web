-- =====================================================================
-- OneTools — Khuyến mại tự động áp cho cả Paddle (2026-11-16)
-- Thêm cột lưu "Checkout discount code" đã tạo trên Paddle cho từng đợt khuyến mại.
-- Khi đợt đang chạy có mã này, web tự gắn mã vào Paddle Checkout (khách không phải nhập).
-- Chạy SAU sql/schema_promotions.sql. An toàn để chạy lại nhiều lần.
-- =====================================================================

alter table public.promotions
  add column if not exists paddle_discount_code text;

-- Dọn 4 cột khuyến mại thử nghiệm thêm vào pricing_plans ngày 2026-11-12 (không code nào dùng,
-- trùng chức năng với bảng promotions). Bỏ qua được nếu đã xoá trước đó.
alter table public.pricing_plans
  drop column if exists promo_percent,
  drop column if exists promo_code,
  drop column if exists promo_starts_at,
  drop column if exists promo_ends_at;
