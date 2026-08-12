import { createClient } from "@supabase/supabase-js";
import LandingClient from "./LandingClient";

// Đây là Server Component (không có "use client") — chạy trên server lúc build/mỗi
// request, lấy dữ liệu công khai (video, gói giá) từ Supabase rồi truyền xuống phần
// giao diện tương tác (LandingClient). Cách này giúp trang tải nhanh vì dữ liệu đã có
// sẵn ngay từ lần render đầu tiên, không phải chờ gọi API phía trình duyệt.
async function getPageData() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Nếu chưa cấu hình biến môi trường Supabase, trả về mảng rỗng —
  // trang vẫn build và chạy được, chỉ hiển thị "Chưa có nội dung" ở 2 khu vực đó.
  if (!supabaseUrl || !supabaseAnonKey) {
    return { videos: [], plans: [] };
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    const [videosRes, plansRes] = await Promise.all([
      supabase
        .from("tool_videos")
        .select("*")
        .eq("is_published", true)
        .order("sort_order", { ascending: true }),
      supabase
        .from("pricing_plans")
        .select("*")
        .eq("is_published", true)
        .order("sort_order", { ascending: true }),
    ]);

    return {
      videos: videosRes.data || [],
      plans: plansRes.data || [],
    };
  } catch (err) {
    console.error("[Supabase] Lỗi khi tải dữ liệu trang chủ:", err.message);
    return { videos: [], plans: [] };
  }
}

export const revalidate = 60; // Tự tải lại dữ liệu mới sau mỗi 60 giây

export default async function Page() {
  const { videos, plans } = await getPageData();
  return <LandingClient videos={videos} plans={plans} />;
}
