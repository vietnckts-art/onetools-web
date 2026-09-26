import { headers } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import CheckoutClient from "./CheckoutClient";

// Server Component — lấy đúng 1 dòng pricing_plans theo ?id=... (query string) + mã quốc gia
// đoán từ IP (Vercel header) để CheckoutClient tự chọn tab mặc định (VN → PayOS, khác → Paddle).
async function getPlan(id) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey || !id) return null;

  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const { data } = await supabase
      .from("pricing_plans")
      .select("*")
      .eq("id", id)
      .eq("is_published", true)
      .maybeSingle();
    return data || null;
  } catch (err) {
    console.error("[Supabase] Lỗi khi tải gói giá cho /checkout:", err.message);
    return null;
  }
}

export default async function CheckoutPage({ searchParams }) {
  const plan = await getPlan(searchParams?.id);
  const country = headers().get("x-vercel-ip-country") || null;

  return <CheckoutClient plan={plan} country={country} />;
}
