-- =====================================================================
-- OneTools — Bổ sung: giá USD cho gói đăng ký (hiển thị khi web ở chế độ EN)
-- Chạy file này SAU khi đã chạy schema.sql và schema_releases.sql — an toàn, chỉ thêm cột mới.
-- =====================================================================

alter table public.pricing_plans
  add column if not exists price_usd text not null default '';

-- Gợi ý: điền giá USD tương ứng cho các gói mẫu đã có sẵn (bỏ qua nếu anh tự nhập qua trang Admin)
-- update public.pricing_plans set price_usd = '39' where name_vi = 'Cá nhân';
-- update public.pricing_plans set price_usd = '139' where name_vi = 'Văn phòng';

-- =====================================================================
-- Sau khi chạy xong: vào /admin → tab "Gói giá" → mỗi gói giờ có thêm ô "Giá USD"
-- =====================================================================
