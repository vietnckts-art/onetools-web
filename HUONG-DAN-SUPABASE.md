# Hướng dẫn kết nối Supabase vào web OneTools

## Những gì đã có trong bản này

- Trang chủ lấy **video hướng dẫn** và **gói giá** trực tiếp từ Supabase (không còn viết cứng trong code)
- Trang `/login` — khách đăng nhập bằng email (magic link, không cần mật khẩu)
- Trang `/admin` — anh tự thêm/sửa/xoá video và gói giá, không cần đụng code
- Trang `/admin/login` — đăng nhập riêng cho admin (email + mật khẩu)

---

## Bước 1 — Chạy SQL để tạo bảng

1. Vào **Supabase Dashboard** → chọn đúng project `fnxmrpelwrlbqigrpbrd`
2. Vào **SQL Editor** (menu bên trái) → **New query**
3. Mở file `sql/schema.sql` trong project này, copy toàn bộ nội dung, dán vào ô query
4. Bấm **Run**

File này chỉ **tạo bảng mới** (`tool_videos`, `pricing_plans`, `profiles`), không đụng tới bảng license/user hiện có của anh. Chạy xong sẽ có sẵn 4 video mẫu và 3 gói giá mẫu để anh xem thử giao diện trước khi tự sửa lại nội dung thật.

## Bước 2 — Lấy API key

1. Trong Supabase Dashboard → **Settings** → **API**
2. Copy 2 giá trị:
   - **Project URL** (dạng `https://fnxmrpelwrlbqigrpbrd.supabase.co`)
   - **anon public key** (chuỗi dài bắt đầu bằng `eyJ...`)

## Bước 3 — Cấu hình biến môi trường

**Trên máy (để test trước khi deploy):**
- Copy file `.env.example` thành `.env.local`
- Dán đúng 2 giá trị vừa lấy ở Bước 2 vào

**Trên Vercel (để chạy thật):**
1. Vào project trên Vercel → **Settings** → **Environment Variables**
2. Thêm 2 biến, tên phải giống hệt:
   - `NEXT_PUBLIC_SUPABASE_URL` = Project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = anon public key
3. Bấm **Save**, sau đó vào tab **Deployments** → bấm **Redeploy** ở bản mới nhất để áp dụng

## Bước 4 — Tạo tài khoản admin cho chính anh

1. Supabase Dashboard → **Authentication** → **Users** → **Add user** → **Create new user**
2. Nhập email + mật khẩu cho tài khoản admin (đây là tài khoản anh sẽ dùng đăng nhập `/admin`)
3. Quay lại **SQL Editor**, chạy lệnh sau (thay đúng email vừa tạo):
   ```sql
   update public.profiles set is_admin = true where email = 'email-cua-anh@gmail.com';
   ```
4. Xong — giờ anh vào `onetools-bim.com/admin/login`, đăng nhập bằng email/mật khẩu vừa tạo

## Bước 5 — Quản lý nội dung hàng ngày

Từ `/admin`, anh có 2 tab:
- **Video hướng dẫn**: thêm tool mới, sửa mô tả, đổi link YouTube (chỉ cần dán đúng phần ID, ví dụ link `youtube.com/watch?v=dQw4w9WgXcQ` thì ID là `dQw4w9WgXcQ`), tick/bỏ tick "Đăng công khai" để ẩn tạm 1 video mà không cần xoá
- **Gói giá**: thêm/sửa gói, phần "Tính năng" mỗi dòng là 1 mục (Enter xuống dòng để thêm mục mới)

Mọi thay đổi có hiệu lực ngay trên web trong tối đa 60 giây (trang tự làm mới dữ liệu mỗi phút).

---

## Về đăng nhập khách hàng (`/login`) và license

Trang `/login` hiện tại mới dừng ở mức **xác thực danh tính bằng email** (khách đăng nhập được, web biết đúng email nào đang online). Việc hiển thị **tình trạng license** (còn hạn hay không, gói nào, máy nào đang active) cần nối thêm vào Edge Function `check-license` đã có sẵn của anh — phần này chưa làm trong bản này vì cần biết chính xác cấu trúc request/response của Edge Function đó để gọi đúng. Khi anh sẵn sàng, quay lại và mình sẽ nối tiếp phần này.
