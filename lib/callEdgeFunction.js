// Gọi 1 Supabase Edge Function (sign-up, activate-seat, confirm-seat-otp, claim-license-key, ...)
// và LUÔN cố đọc JSON trả về dù request thành công hay lỗi (các hàm bên add-in luôn trả JSON
// { status, message, ... } kể cả khi HTTP status là 400/401/403/404/500).
//
// accessToken: truyền vào khi gọi 1 hàm cần đăng nhập (activate-seat, confirm-seat-otp,
// claim-license-key...) — là access_token của session hiện tại (supabase.auth.getSession()).
// Không truyền (hoặc để trống) khi gọi hàm public như sign-up — lúc đó dùng anonKey.

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export async function callEdgeFunction(name, body, accessToken) {
  if (!supabaseUrl || !anonKey) {
    return {
      ok: false,
      data: {
        status: "error",
        message: "Thiếu cấu hình Supabase (NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY).",
      },
    };
  }

  let res;
  try {
    res = await fetch(`${supabaseUrl}/functions/v1/${name}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: anonKey,
        Authorization: `Bearer ${accessToken || anonKey}`,
      },
      body: JSON.stringify(body ?? {}),
    });
  } catch (e) {
    return {
      ok: false,
      data: { status: "error", message: "Không kết nối được tới máy chủ. Vui lòng thử lại." },
    };
  }

  let data;
  try {
    data = await res.json();
  } catch {
    data = { status: "error", message: `Lỗi không xác định (HTTP ${res.status}).` };
  }

  return { ok: res.ok, data };
}
