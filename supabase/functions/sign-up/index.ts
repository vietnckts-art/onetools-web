import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
const supabase = createClient(supabaseUrl, serviceRoleKey);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function jsonResponse(body: object, statusCode = 200) {
  return new Response(JSON.stringify(body), {
    status: statusCode,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}

// MỚI (2026-11-23): cắt chuỗi an toàn cho các trường thống kê (client gửi lên, không tin tuyệt đối).
function cut(v: unknown, n: number): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t ? t.slice(0, n) : null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // SỬA (2026-11-23): nhận thêm các trường THỐNG KÊ NGUỒN KHÁCH (đều tuỳ chọn - client cũ không gửi vẫn chạy):
    //   via ("addin" | "web"), country (web: theo IP qua Vercel), os_region / os_language / time_zone (add-in: cài
    //   đặt Windows), utm_source / utm_campaign (web), channel ("web" | "store"), app_version.
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return jsonResponse(
        { status: "error", code: "MISSING_FIELDS", message: "Thiếu email hoặc mật khẩu." },
        400
      );
    }
    if (password.length < 6) {
      return jsonResponse(
        { status: "error", code: "PASSWORD_TOO_SHORT", message: "Mật khẩu cần tối thiểu 6 ký tự." },
        400
      );
    }

    // ----- Tạo tài khoản qua Auth Admin API - tự xác nhận email luôn (email_confirm: true) vì đây là
    // luồng đăng ký trực tiếp trong add-in Desktop, không có trang xác nhận email riêng ở bước này. -----
    const { data: created, error: createError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (createError || !created.user) {
      // Email đã tồn tại là lỗi phổ biến nhất - trả message rõ ràng thay vì lỗi kỹ thuật thô.
      const emailTaken = createError?.message?.includes("already");
      const code = emailTaken ? "EMAIL_ALREADY_EXISTS" : "CREATE_USER_FAILED";
      const msg = emailTaken
        ? "Email này đã có tài khoản - vui lòng đăng nhập thay vì đăng ký."
        : (createError?.message ?? "Không tạo được tài khoản.");
      return jsonResponse({ status: "error", code, message: msg }, 400);
    }

    // ----- Tự động cấp License Trial 15 ngày, gắn thẳng với tài khoản vừa tạo (owner_user_id) -----
    const { data: keyData } = await supabase.rpc("generate_license_key");
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 15);

    await supabase.from("licenses").insert({
      license_key: keyData as string,
      email,
      status: "trial",
      expires_at: expiresAt.toISOString(),
      license_type: "trial",
      owner_user_id: created.user.id,
      max_seats: 1,
    });

    // ----- MỚI (2026-11-23): ghi 1 dòng thống kê nguồn khách (signup_events). Lỗi ở đây KHÔNG ảnh hưởng đăng ký. -----
    try {
      // Quốc gia: web gửi sẵn (Vercel). Không có thì thử header cf-ipcountry nếu hạ tầng có gắn (không đảm bảo).
      let country = cut(body.country, 2)?.toUpperCase() ?? null;
      if (!country) {
        const h = cut(req.headers.get("cf-ipcountry"), 2)?.toUpperCase() ?? null;
        if (h && h !== "XX" && h !== "T1") country = h;
      }
      await supabase.from("signup_events").insert({
        user_id: created.user.id,
        email,
        via: cut(body.via, 10) ?? "addin",
        country,
        os_region: cut(body.os_region, 3)?.toUpperCase() ?? null,
        os_language: cut(body.os_language, 20),
        time_zone: cut(body.time_zone, 60),
        utm_source: cut(body.utm_source, 40)?.toLowerCase() ?? null,
        utm_campaign: cut(body.utm_campaign, 60),
        channel: cut(body.channel, 10),
        app_version: cut(body.app_version, 20),
      });
    } catch (_) {
      // bỏ qua - chỉ là thống kê
    }

    // ----- Đăng nhập ngay sau khi tạo xong để trả về access_token/refresh_token cho client dùng luôn,
    // khỏi bắt người dùng phải đăng nhập thêm 1 lần nữa ngay sau khi vừa đăng ký. -----
    const signInRes = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
      method: "POST",
      headers: { apikey: anonKey, "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const signInJson = await signInRes.json();

    if (!signInRes.ok) {
      return jsonResponse(
        {
          status: "error",
          code: "AUTO_LOGIN_FAILED",
          message: "Tạo tài khoản thành công nhưng đăng nhập tự động thất bại - vui lòng đăng nhập thủ công.",
        },
        500
      );
    }

    return jsonResponse({
      status: "ok",
      access_token: signInJson.access_token,
      refresh_token: signInJson.refresh_token,
      user_id: created.user.id,
    });
  } catch (e) {
    return jsonResponse({ status: "error", code: "INTERNAL_ERROR", message: String(e) }, 500);
  }
});
