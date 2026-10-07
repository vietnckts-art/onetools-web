// Supabase Edge Function: payos-webhook
// Nhiệm vụ: nhận thông báo từ PayOS khi 1 đơn hàng (tạo bởi payos-create-payment) được thanh toán
// thành công → tự động tạo License mới và gắn vào đúng tài khoản Supabase của khách — giống hệt vai
// trò của `paddle-webhook` nhưng cho kênh nội địa PayOS.
//
// Cách xác định đúng tài khoản/gói: payos-create-payment đã lưu sẵn 1 dòng vào bảng `payos_orders`
// (order_code, user_id, plan_id) TRƯỚC khi tạo link thanh toán — hàm này chỉ cần tra lại theo
// `data.orderCode` mà PayOS gửi về (PayOS không hỗ trợ gửi kèm custom_data tự do như Paddle).
//
// Cách cấu hình phía PayOS (làm 1 lần, xem đầy đủ ở sql/schema_payos.sql):
// 1. Deploy function này lên Supabase, lấy URL dạng
//    https://<project-ref>.supabase.co/functions/v1/payos-webhook
// 2. Trang payos.vn → Kênh thanh toán đã tạo → mục cấu hình Webhook → dán URL ở bước 1 → "Xác nhận
//    Webhook" (PayOS sẽ tự gửi 1 request thử tới URL này để kiểm tra — hàm bên dưới luôn trả 200 nếu
//    chữ ký hợp lệ, kể cả khi orderCode không khớp đơn hàng nào, nên bước xác nhận này sẽ qua được).
// 3. Supabase Dashboard → Edge Functions → payos-webhook → Settings/Secrets, thêm:
//    PAYOS_CHECKSUM_KEY (CÙNG giá trị đã nhập ở payos-create-payment).
//
// PLAN_MAP: tra license_type/max_seats theo đúng pricing_plans.id (UUID) — PHẢI khớp với 2 dòng
// Individual (Pro)/Team Studio thật trong Supabase (lấy từ claude/PaddleRegistration_BankPayout_notes.md,
// cùng 2 id đã dùng để map Paddle Price ID live). Nếu sau này đổi/thêm gói sellable mới, nhớ cập nhật cả
// map này (giống hệt PRICE_MAP của paddle-webhook) — thiếu thì KHÔNG cấp License, chỉ ghi log cảnh báo.
// license_type PHẢI là 1 trong 5 giá trị hợp lệ của cột licenses.license_type: 'trial', 'dev_preview',
// 'pro', 'lifetime', 'business'.

import { serve } from "https://deno.land/std@0.203.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const PAYOS_CHECKSUM_KEY = Deno.env.get("PAYOS_CHECKSUM_KEY");

const PLAN_MAP: Record<string, { license_type: string; max_seats: number }> = {
  "9bdd1a07-7127-4e7b-a1d2-f24d746b6e21": { license_type: "pro", max_seats: 1 }, // Individual (Pro)
  "c806a733-571a-43b7-86ba-7373f213e2ac": { license_type: "business", max_seats: 3 }, // Team / Studio
};

const LICENSE_DURATION_DAYS = 365; // Mua 1 lần / dùng 1 năm, không tự động gia hạn — đúng model OneTools.

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
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

// Chữ ký webhook PayOS tính trên object "data": sắp key theo alphabet, nối "key=value&...", null/undefined
// thành chuỗi rỗng — KHÁC với chữ ký lúc tạo link thanh toán (chỉ 5 field cố định, xem
// payos-create-payment).
async function buildDataSignature(data: Record<string, unknown>, checksumKey: string): Promise<string> {
  const keys = Object.keys(data).sort();
  const parts = keys.map((k) => {
    const v = data[k];
    return `${k}=${v === null || v === undefined ? "" : v}`;
  });
  return hmacHex(checksumKey, parts.join("&"));
}

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const rawBody = await req.text();
  let payload: any;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return new Response(JSON.stringify({ error: "Body không phải JSON hợp lệ" }), { status: 400 });
  }

  if (!PAYOS_CHECKSUM_KEY) {
    console.error("[payos-webhook] Thiếu env PAYOS_CHECKSUM_KEY trên Supabase — chưa cấu hình xong.");
    return new Response(JSON.stringify({ error: "Chưa cấu hình PAYOS_CHECKSUM_KEY" }), { status: 500 });
  }

  const data = payload?.data;
  const receivedSignature = payload?.signature;
  if (!data || !receivedSignature) {
    // PayOS có thể gửi request thử nghiệm rỗng lúc xác nhận Webhook URL lần đầu — trả 200 để không
    // chặn bước xác nhận, nhưng không làm gì cả.
    return new Response(JSON.stringify({ received: true, skipped: "missing_data_or_signature" }), {
      status: 200,
    });
  }

  const expected = await buildDataSignature(data, PAYOS_CHECKSUM_KEY);
  if (!timingSafeEqual(expected, receivedSignature)) {
    console.error("[payos-webhook] Chữ ký không khớp — request không đến từ PayOS hoặc sai Checksum Key.");
    return new Response(JSON.stringify({ error: "Chữ ký không hợp lệ" }), { status: 401 });
  }

  // ----- Chỉ cấp License khi đúng là thanh toán thành công -----
  if (payload.code !== "00" || payload.success !== true) {
    return new Response(JSON.stringify({ received: true, skipped: "not_success" }), { status: 200 });
  }

  const orderCode = data.orderCode;
  const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

  const { data: order, error: orderErr } = await supabase
    .from("payos_orders")
    .select("*")
    .eq("order_code", orderCode)
    .maybeSingle();

  if (orderErr || !order) {
    console.error("[payos-webhook] Không tìm thấy đơn hàng ứng với orderCode:", orderCode);
    // Có thể là request xác nhận Webhook thử nghiệm của PayOS (orderCode mẫu không có thật) — vẫn trả
    // 200 để không chặn việc xác nhận Webhook URL, nhưng cần tự kiểm tra tay nếu gặp case này ngoài lúc
    // xác nhận webhook lần đầu.
    return new Response(JSON.stringify({ received: true, warning: "order_not_found" }), { status: 200 });
  }

  // ----- Chống xử lý trùng — PayOS có thể gửi lại cùng 1 thông báo. -----
  if (order.status === "paid") {
    return new Response(JSON.stringify({ received: true, already_processed: true }), { status: 200 });
  }

  const planInfo = PLAN_MAP[order.plan_id];
  if (!planInfo) {
    console.error("[payos-webhook] plan_id không có trong PLAN_MAP — cần kiểm tra tay:", order.plan_id);
    return new Response(JSON.stringify({ received: true, warning: "unknown_plan" }), { status: 200 });
  }

  const { data: userRes, error: userErr } = await supabase.auth.admin.getUserById(order.user_id);
  if (userErr) {
    console.error("[payos-webhook] Không tìm thấy user_id từ đơn hàng:", order.user_id, userErr.message);
  }
  const email = userRes?.user?.email || null;

  // Sinh license_key theo đúng RPC đang dùng ở luồng sign-up/paddle-webhook — giữ cùng 1 định dạng key
  // cho toàn hệ thống.
  const { data: licenseKey, error: keyErr } = await supabase.rpc("generate_license_key");
  if (keyErr || !licenseKey) {
    console.error("[payos-webhook] RPC generate_license_key lỗi:", keyErr?.message);
    return new Response(JSON.stringify({ error: "generate_license_key thất bại" }), { status: 500 });
  }

  const expiresAt = new Date(Date.now() + LICENSE_DURATION_DAYS * 24 * 60 * 60 * 1000).toISOString();

  const { error: insertErr } = await supabase.from("licenses").insert({
    license_key: licenseKey,
    email,
    status: "active",
    license_type: planInfo.license_type,
    max_seats: planInfo.max_seats,
    expires_at: expiresAt,
    owner_user_id: order.user_id,
    payos_order_code: orderCode,
    owner_name: "PAY", // License tự động cấp qua thanh toán — giống quy ước của luồng Paddle.
  });

  if (insertErr) {
    console.error("[payos-webhook] Insert vào bảng licenses lỗi:", insertErr.message);
    return new Response(JSON.stringify({ error: "Không tạo được License" }), { status: 500 });
  }

  await supabase
    .from("payos_orders")
    .update({ status: "paid", paid_at: new Date().toISOString(), license_key: licenseKey })
    .eq("order_code", orderCode);

  console.log(
    `[payos-webhook] Đã cấp License ${licenseKey} (${planInfo.license_type}) cho user ${order.user_id}, order ${orderCode}`
  );
  return new Response(JSON.stringify({ received: true, license_key: licenseKey }), { status: 200 });
});
