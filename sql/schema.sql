-- =====================================================================
-- OneTools — Schema cho Website (videos hướng dẫn + gói giá + phân quyền admin)
-- Chạy toàn bộ file này 1 lần trong Supabase Dashboard → SQL Editor → New query
-- An toàn: chỉ TẠO MỚI bảng, không đụng tới bảng license/user hiện có của anh.
-- =====================================================================

-- ---------- 1. Bảng video hướng dẫn từng tool ----------
create table if not exists public.tool_videos (
  id uuid primary key default gen_random_uuid(),
  code text not null,                 -- số thứ tự hiển thị, vd '01', '02'
  name_vi text not null,
  name_en text not null,
  desc_vi text not null,
  desc_en text not null,
  youtube_id text not null,           -- chỉ phần ID, vd 'dQw4w9WgXcQ'
  sort_order int not null default 0,  -- số nhỏ hiện trước
  is_published boolean not null default true,
  created_at timestamptz not null default now()
);

-- ---------- 2. Bảng gói giá ----------
create table if not exists public.pricing_plans (
  id uuid primary key default gen_random_uuid(),
  name_vi text not null,
  name_en text not null,
  price text not null,                -- vd '990.000' hoặc 'Liên hệ' — để text cho linh hoạt định dạng
  period_vi text not null default '',
  period_en text not null default '',
  seats_vi text not null,
  seats_en text not null,
  features_vi text[] not null default '{}',
  features_en text[] not null default '{}',
  is_contact boolean not null default false,  -- true = nút "Liên hệ tư vấn" thay vì "Đăng ký ngay"
  highlight boolean not null default false,   -- true = viền nổi bật (gói đề xuất)
  sort_order int not null default 0,
  is_published boolean not null default true,
  created_at timestamptz not null default now()
);

-- ---------- 3. Bảng đánh dấu quyền admin ----------
-- Supabase Auth đã có sẵn bảng auth.users; bảng này chỉ thêm cờ is_admin.
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

-- Tự động tạo 1 dòng profiles mỗi khi có user mới đăng ký qua Supabase Auth
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Hàm kiểm tra người đang đăng nhập có phải admin không (dùng trong RLS policy)
create or replace function public.is_admin()
returns boolean as $$
  select coalesce(
    (select is_admin from public.profiles where id = auth.uid()),
    false
  );
$$ language sql security definer stable;

-- ---------- 4. Bật Row Level Security ----------
alter table public.tool_videos enable row level security;
alter table public.pricing_plans enable row level security;
alter table public.profiles enable row level security;

-- Ai cũng đọc được video/gói giá đã publish (khách vãng lai xem web không cần đăng nhập)
drop policy if exists "Public read published videos" on public.tool_videos;
create policy "Public read published videos"
  on public.tool_videos for select
  using (is_published = true);

drop policy if exists "Public read published plans" on public.pricing_plans;
create policy "Public read published plans"
  on public.pricing_plans for select
  using (is_published = true);

-- Chỉ admin mới được thêm/sửa/xoá
drop policy if exists "Admin manage videos" on public.tool_videos;
create policy "Admin manage videos"
  on public.tool_videos for all
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Admin manage plans" on public.pricing_plans;
create policy "Admin manage plans"
  on public.pricing_plans for all
  using (public.is_admin())
  with check (public.is_admin());

-- Người dùng chỉ xem được đúng profile của mình; admin xem được tất cả
drop policy if exists "Read own profile" on public.profiles;
create policy "Read own profile"
  on public.profiles for select
  using (auth.uid() = id or public.is_admin());

-- =====================================================================
-- DỮ LIỆU MẪU (xoá đoạn dưới nếu anh muốn tự nhập từ đầu qua trang Admin)
-- =====================================================================
insert into public.tool_videos (code, name_vi, name_en, desc_vi, desc_en, youtube_id, sort_order) values
('01', 'AutoDim Structure Column', 'AutoDim Structure Column',
 'Tự động dim vị trí cột và vách kết cấu trên mặt bằng, theo đúng trục lưới, chống chồng chữ.',
 'Automatically dimensions structural columns and walls on the floor plan, aligned to grids, with overlap-free text.',
 'dQw4w9WgXcQ', 1),
('02', 'Dim Cọc', 'Dim Piles',
 'Tự động lập dimension cho hệ cọc theo lưới trục, xử lý cọc đơn và cụm cọc.',
 'Automatically dimensions pile groups against the grid, handling both single piles and clusters.',
 'dQw4w9WgXcQ', 2),
('03', 'Dim Đài cọc', 'Dim Pile Caps',
 'Dim kích thước và vị trí đài cọc, đồng bộ quy tắc với AutoDim Structure Column.',
 'Dimensions pile cap sizes and positions, following the same rules as AutoDim Structure Column.',
 'dQw4w9WgXcQ', 3),
('04', 'Rename Grids / Sheets', 'Rename Grids / Sheets',
 'Đổi tên hàng loạt trục và sheet theo chuỗi tăng dần, kiểm tra hợp lệ tự động.',
 'Bulk-renames grids and sheets using an incrementing sequence, with automatic validation.',
 'dQw4w9WgXcQ', 4)
on conflict do nothing;

insert into public.pricing_plans (name_vi, name_en, price, period_vi, period_en, seats_vi, seats_en, features_vi, features_en, is_contact, highlight, sort_order) values
('Cá nhân', 'Individual', '990.000', '/ năm', '/ year', '1 máy trạm', '1 workstation',
 array['Toàn bộ tool trong panel Auto Dimension','Cập nhật phiên bản mới','Hỗ trợ qua email'],
 array['All tools in the Auto Dimension panel','New version updates','Email support'],
 false, false, 1),
('Văn phòng', 'Studio', '3.490.000', '/ năm', '/ year', '5 máy trạm', '5 workstations',
 array['Toàn bộ tool hiện có và sắp ra mắt','Cập nhật phiên bản mới','Hỗ trợ ưu tiên qua Zalo','Đào tạo sử dụng ban đầu'],
 array['All current and upcoming tools','New version updates','Priority support via Zalo','Initial onboarding session'],
 false, true, 2),
('Doanh nghiệp', 'Enterprise', 'Liên hệ', '', '', 'Không giới hạn', 'Unlimited',
 array['Toàn bộ tool hiện có và sắp ra mắt','Triển khai qua NAS / mạng nội bộ','Hỗ trợ trực tiếp tại văn phòng','Tùy biến theo quy trình riêng'],
 array['All current and upcoming tools','NAS / internal network deployment','On-site support','Custom workflow integration'],
 true, false, 3)
on conflict do nothing;

-- =====================================================================
-- SAU KHI CHẠY XONG FILE NÀY:
-- 1. Vào Authentication → Users → Add user, tạo tài khoản admin cho chính anh
-- 2. Chạy lệnh dưới đây (thay email đúng của anh) để cấp quyền admin:
--    update public.profiles set is_admin = true where email = 'email-cua-anh@gmail.com';
-- =====================================================================
