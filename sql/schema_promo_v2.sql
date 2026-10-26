-- =====================================================================
-- OneTools — Đợt 2 cho khuyến mại (user yêu cầu 2026-10-26, sau khi đã chạy sql/schema_promotions.sql):
--   1) Banner khuyến mại tự động: thêm dòng phụ (subtitle) nhỏ bên dưới tiêu đề.
--   2) Mã khuyến mãi (promo code) tặng riêng cho cá nhân — ĐỘC LẬP với banner khuyến mại tự động ở trên.
--      Khách nhập mã ở bước thanh toán, giá tự tính lại. Mã KHÔNG hiện công khai ở đâu cả — chỉ tra
--      được qua Edge Function (service role), tránh lộ danh sách mã nếu ai đó dò API trực tiếp.
--   Nếu khách nhập đúng 1 mã hợp lệ, mã đó THAY THẾ hoàn toàn % của đợt khuyến mại tự động đang chạy
--   (không cộng dồn 2 loại giảm giá — quyết định của user khi làm tính năng này).
-- Chạy SAU sql/schema_promotions.sql (cần bảng promotions + payos_orders + hàm public.is_admin() đã có).
-- An toàn: chỉ alter/thêm bảng mới, không đụng dữ liệu hiện có.
-- =====================================================================

-- ----- 1) Dòng phụ (subtitle) cho banner khuyến mại tự động — không bắt buộc nhập -----
alter table public.promotions
  add column if not exists subtitle_vi text,
  add column if not exists subtitle_en text;

-- ----- 2) Bảng mã khuyến mãi tặng riêng -----
create table if not exists public.promo_codes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,                 -- lưu UPPERCASE, khách nhập không phân biệt hoa/thường
  discount_percent int not null check (discount_percent > 0 and discount_percent <= 100),
  max_uses int,                              -- để trống (null) = không giới hạn số lần dùng
  used_count int not null default 0,
  assigned_email text,                       -- để trống = ai cũng dùng được; có giá trị = chỉ đúng email
                                              -- này (không phân biệt hoa/thường) mới dùng được
  valid_from timestamptz,                    -- để trống = không giới hạn ngày bắt đầu
  valid_to timestamptz,                      -- để trống = không giới hạn ngày kết thúc
  is_active boolean not null default true,
  note text,                                 -- ghi chú nội bộ cho admin, vd "Tặng anh Tuấn - KOL"
  created_at timestamptz not null default now()
);

alter table public.promo_codes enable row level security;

-- CỐ Ý KHÔNG tạo policy "select" công khai — mã chỉ được tra cứu qua Edge Function
-- validate-promo-code (dùng Service Role Key, tự bypass RLS), KHÔNG cho phép web query trực tiếp
-- bằng anon key, tránh lộ toàn bộ danh sách mã.
drop policy if exists "Admin manage promo_codes" on public.promo_codes;
create policy "Admin manage promo_codes"
  on public.promo_codes for all
  using (public.is_admin())
  with check (public.is_admin());

-- Tăng used_count an toàn (1 câu UPDATE là atomic sẵn trong Postgres) — payos-webhook gọi hàm này
-- sau khi xác nhận thanh toán PayOS thành công cho đơn có áp mã.
create or replace function public.increment_promo_code_usage(p_code text)
returns void
language sql
as $$
  update public.promo_codes set used_count = used_count + 1 where code = p_code;
$$;

-- Lưu lại mã đã dùng trên từng đơn PayOS, để payos-webhook biết tăng used_count cho đúng mã.
alter table public.payos_orders
  add column if not exists promo_code text;

-- =====================================================================
-- SAU KHI CHẠY XONG FILE NÀY:
-- 1. Deploy lại các Edge Function: payos-create-payment (đã sửa), payos-webhook (đã sửa), và
--    validate-promo-code (hàm mới) — xem chi tiết từng file trong supabase/functions/.
-- 2. Vào /admin → tab "Khuyến mại" để nhập thêm dòng phụ (nếu muốn) cho đợt khuyến mại đang chạy.
-- 3. Vào /admin → tab "Mã khuyến mãi" để tạo mã tặng riêng đầu tiên.
-- =====================================================================
