import { createClient } from "@supabase/supabase-js";

// Hai biến này lấy từ Supabase Dashboard → Settings → API
// Đặt trong file .env.local (máy anh) và trong Vercel → Settings → Environment Variables (khi deploy)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // Không throw cứng để trang vẫn build được khi chưa cấu hình xong —
  // các hàm gọi Supabase sẽ tự fallback về dữ liệu mặc định (xem app/page.jsx)
  console.warn(
    "[Supabase] Thiếu NEXT_PUBLIC_SUPABASE_URL hoặc NEXT_PUBLIC_SUPABASE_ANON_KEY trong biến môi trường."
  );
}

export const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey || "placeholder-anon-key"
);
