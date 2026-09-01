-- =====================================================================
-- OneTools — Bổ sung: cho phép admin xem feedback + ảnh đính kèm trong trang /admin
-- Chạy file này trong Supabase SQL Editor (project onetools-license) — an toàn,
-- chỉ thêm policy, không đụng dữ liệu hay cấu trúc bảng hiện có.
-- =====================================================================

-- Đảm bảo RLS đã bật cho bảng feedback (không ảnh hưởng gì nếu đã bật sẵn)
alter table public.feedback enable row level security;

-- Chỉ admin (is_admin() đã định nghĩa sẵn từ trước) mới đọc được danh sách feedback
drop policy if exists "Admin read feedback" on public.feedback;
create policy "Admin read feedback"
  on public.feedback for select
  using (public.is_admin());

-- Chỉ admin mới được đọc file trong bucket feedback-attachments (bucket này đang ở
-- chế độ riêng tư — đúng vì có thể chứa thông tin nhạy cảm của khách hàng).
-- Policy này cần thiết để trang Admin tạo được "signed URL" xem ảnh.
drop policy if exists "Admin read feedback attachments" on storage.objects;
create policy "Admin read feedback attachments"
  on storage.objects for select
  using (bucket_id = 'feedback-attachments' and public.is_admin());

-- =====================================================================
-- Sau khi chạy xong: vào /admin → tab "Phản hồi" sẽ xem được danh sách + ảnh đính kèm.
-- =====================================================================
