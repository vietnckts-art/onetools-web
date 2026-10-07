// Supabase Edge Function: payos-create-payment
// Nhiệm vụ: khách đã đăng nhập + đã tick đồng ý điều khoản ở tab "Việt Nam (PayOS)" của /checkout,
// bấm nút thanh toán → gọi hàm này để PayOS tạo 1 link thanh toán (QR/chuyển khoản), trả về
// `checkoutUrl` cho web redirect khách sang đó. KHÔNG tạo link thanh toán ở phía trình duyệt — PayOS
// bắt buộc ký checksum (HMAC) bằng Checksum Key, phải làm ở server để không lộ khoá ra client.
//
// Cách cấu hình (làm 1 lần, xem đầy đủ ở sql/schema_payos.sql):
// 1. Chạy sql/schema_payos.sql trong Supabase SQL Editor (tạo bảng payos_orders).
// 2. Deploy: `supabase functions deploy payos-create-payment`.
// 3. Supabase Dashboard → Edge Functions → payos-create-payment → Settings/Secrets, thêm:
//    PAYOS_CLIENT_ID, PAYOS_API_KEY, PAYOS_CHECKSUM_KEY (lấy từ Kênh thanh toán trên payos.vn),
//    SITE_URL = https://www.onetools-bim.com (để build cancelUrl/returnUrl).
//
// Lưu ý bảo mật: 3 giá trị PAYOS_* là bí mật — CHỈ nhập trực tiếp vào Secrets trên Supabase Dashboard,
// không dán vào code, không gửi cho ai kể cả Claude.

import { serve } from "https://deno.land/std@0.203.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const PAYOS_CLIENT_ID = Deno.env.get("PAYOS_CLIENT_ID");
const PAYOS_API_KEY = Deno.env.get("PAYOS_API_KEY");
const PAYOS_CHECKSUM_KEY = Deno.env.get("PAYOS_CHECKSUM_KEY");
const SITE_URL = Deno.env.get("SITE_URL") || "https://www.onetools-bim.com";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function hmacHex(secret: string, message: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(message));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// pricing_plans.price lưu dạng text kiểu Việt Nam, vd "990.000" (dấu chấm phân cách nghìn) — bóc hết
// ký tự không phải số để ra đúng số nguyên VNĐ. Gói "Liên hệ" (is_contact) sẽ ra NaN → bị chặn bên dưới.
function parseVndPrice(priceText: string): number {
  const digits = (priceText || "").replace(/[^\d]/g, "");
  return digits ? parseInt(digits, 10) : NaN;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  if (!PAYOS_CLIENT_ID || !PAYOS_API_KEY || !PAYOS_CHECKSUM_KEY) {
    console.error(
      "[payos-create-payment] Thiếu biến môi trường PAYOS_CLIENT_ID/PAYOS_API_KEY/PAYOS_CHECKSUM_KEY."
    );
    return json({ error: "Chưa cấu hình xong PayOS trên server." }, 500);
  }

  // ----- 1) Xác thực người gọi — bắt buộc đăng nhập vì License phải gắn đúng tài khoản. -----
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return json({ error: "Thiếu Authorization header" }, 401);

  const userClient = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: userData, error: userErr } = await userClient.auth.getUser();
  if (userErr || !userData?.user) {
    return json({ error: "Không xác thực được người dùng — vui lòng đăng nhập lại." }, 401);
  }
  const user = userData.user;

  // ----- 2) Đọc đúng giá từ DB theo plan_id — KHÔNG tin số tiền do trình duyệt gửi lên, tránh khách
  // tự sửa amount trước khi gọi API. -----
  let planId: string | undefined;
  try {
    const body = await req.json();
    planId = body?.planId;
  } catch {
    return json({ error: "Body không phải JSON hợp lệ" }, 400);
  }
  if (!planId) return json({ error: "Thiếu planId" }, 400);

  const adminClient = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
  const { data: plan, error: planErr } = await adminClient
    .from("pricing_plans")
    .select("id, price, is_contact, is_published")
    .eq("id", planId)
    .eq("is_published", true)
    .maybeSingle();

  if (planErr || !plan || plan.is_contact) {
    return json({ error: "Gói giá không hợp lệ hoặc chưa hỗ trợ thanh toán PayOS." }, 400);
  }
  const amount = parseVndPrice(plan.price);
  if (!amount || amount <= 0) {
    return json({ error: "Gói này chưa có giá VNĐ hợp lệ." }, 400);
  }

  // ----- 3) Tạo link thanh toán PayOS -----
  // orderCode: PayOS yêu cầu số nguyên, chỉ cần không trùng — dùng mốc thời gian (ms) cho đơn giản
  // (xác suất 2 khách bấm trùng đúng 1 mili-giây gần như bằng 0 ở quy mô hiện tại).
  const orderCode = Date.now();
  const description = `OneTools ${orderCode}`.slice(0, 25); // PayOS giới hạn description tối đa 25 ký tự
  const returnUrl = `${SITE_URL}/welcome`;
  // cancelUrl: khi khách bấm "Hủy" trên trang PayOS, đưa về trang chủ — trước đây trỏ lại
  // /checkout?id=... nhưng PayOS không giữ query string khi redirect nên khách bị rơi vào trang lỗi
  // "Không tìm thấy gói này" (CheckoutClient không có `id` → không load được plan). Về trang chủ là
  // trải nghiệm an toàn và dễ chịu hơn khi hủy.
  const cancelUrl = `${SITE_URL}/`;

  // Chữ ký khi TẠO link thanh toán: đúng 5 field cố định, sắp theo alphabet (đã đúng thứ tự dưới đây) —
  // KHÁC với chữ ký kiểm tra webhook (tính trên toàn bộ object "data" trả về, xem payos-webhook).
  const signatureData = `amount=${amount}&cancelUrl=${cancelUrl}&description=${description}&orderCode=${orderCode}&returnUrl=${returnUrl}`;
  const signature = await hmacHex(PAYOS_CHECKSUM_KEY, signatureData);

  let payosRes: Response;
  try {
    payosRes = await fetch("https://api-merchant.payos.vn/v2/payment-requests", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-client-id": PAYOS_CLIENT_ID,
        "x-api-key": PAYOS_API_KEY,
      },
      body: JSON.stringify({
        orderCode,
        amount,
        description,
        cancelUrl,
        returnUrl,
        signature,
        buyerEmail: user.email || undefined,
      }),
    });
  } catch (e) {
    console.error("[payos-create-payment] Không gọi được PayOS API:", e.message);
    return json({ error: "Không kết nối được tới PayOS. Vui lòng thử lại." }, 502);
  }

  const payosBody = await payosRes.json().catch(() => null);
  if (!payosRes.ok || !payosBody || payosBody.code !== "00" || !payosBody.data?.checkoutUrl) {
    console.error("[payos-create-payment] PayOS từ chối tạo link thanh toán:", payosBody);
    return json({ error: payosBody?.desc || "PayOS từ chối tạo link thanh toán." }, 502);
  }

  const { checkoutUrl, paymentLinkId } = payosBody.data;

  // ----- 4) Lưu đơn hàng "pending" — payos-webhook sẽ tra lại đúng dòng này (theo order_code) khi
  // PayOS báo thanh toán thành công, để biết cấp License gói nào cho user nào (PayOS không hỗ trợ gửi
  // kèm custom_data tự do như Paddle, nên phải tự lưu mapping này ở phía mình). -----
  const { error: insertErr } = await adminClient.from("payos_orders").insert({
    order_code: orderCode,
    user_id: user.id,
    plan_id: planId,
    amount,
    status: "pending",
    payment_link_id: paymentLinkId,
    checkout_url: checkoutUrl,
  });
  if (insertErr) {
    console.error("[payos-create-payment] Không lưu được payos_orders:", insertErr.message);
    return json({ error: "Lỗi hệ thống khi tạo đơn hàng. Vui lòng thử lại." }, 500);
  }

  return json({ checkoutUrl });
});
