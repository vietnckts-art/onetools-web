# Bật tính năng "Gửi qua hệ thống" cho tab Phản hồi

Nút "Mở email" trong `/admin` → tab Phản hồi đã dùng được ngay, không cần làm gì thêm.
Phần dưới đây là để bật thêm nút "Gửi qua hệ thống" — gửi email thật ngay trong trang web,
không cần mở app email nào.

## Điều kiện cần có trước

- Đã có tài khoản Resend + domain đã verify (anh đã làm bước này khi setup license system)
- Lấy **API Key** của Resend: Resend Dashboard → API Keys → tạo mới hoặc dùng key có sẵn

## Bước 1 — Cài Supabase CLI (nếu máy chưa có)

Mở PowerShell hoặc Git Bash, chạy:
```
npm install -g supabase
```

## Bước 2 — Đăng nhập và liên kết đúng project

```
supabase login
supabase link --project-ref fnxmrpelwrlbqigrpbrd
```
(Lệnh `login` sẽ mở trình duyệt để xác thực tài khoản Supabase của anh)

## Bước 3 — Khai báo API Key Resend làm secret (KHÔNG ghi thẳng vào code)

```
supabase secrets set RESEND_API_KEY=dán-api-key-resend-vào-đây
```

## Bước 4 — Sửa đúng email gửi đi trong code

Mở file `supabase-edge-functions/reply-feedback/index.ts`, tìm dòng:
```ts
const FROM_EMAIL = "OneTools <noreply@onetools-bim.com>";
```
Đổi `noreply@onetools-bim.com` thành đúng địa chỉ email đã verify trên Resend cho domain của anh.

## Bước 5 — Deploy function

Từ thư mục gốc project (`onetools-nextjs`), chạy:
```
supabase functions deploy reply-feedback --project-ref fnxmrpelwrlbqigrpbrd
```

## Bước 6 — Kiểm tra

Vào `/admin` → tab Phản hồi → gõ thử nội dung trả lời → bấm **"Gửi qua hệ thống"**.
Nếu báo lỗi, thường do 1 trong các nguyên nhân sau:
- Chưa chạy `supabase secrets set RESEND_API_KEY=...` (Bước 3)
- Email ở Bước 4 chưa verify trên Resend
- Tài khoản đang đăng nhập `/admin` chưa được cấp `is_admin = true` trong bảng `profiles`

---

**Nếu anh không muốn làm bước deploy CLI này ngay** — không sao, nút "Mở email" vẫn hoạt động
bình thường như một cách trả lời nhanh, không bị ảnh hưởng gì.
