import { createClient } from "@supabase/supabase-js";
import VideosPageClient from "./VideosPageClient";

async function getAllVideos() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) return [];

  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const { data } = await supabase
      .from("tool_videos")
      .select("*")
      .eq("is_published", true)
      .order("sort_order", { ascending: true });
    return data || [];
  } catch (err) {
    console.error("[Supabase] Lỗi khi tải danh sách video:", err.message);
    return [];
  }
}

export const revalidate = 60;

export default async function VideosPage() {
  const videos = await getAllVideos();
  return <VideosPageClient videos={videos} />;
}
