// Supabase Edge Function: paddle-webhook
// Nhiệm vụ: nhận sự kiện "transaction.completed" từ Paddle (khách thanh toán xong ở /checkout, tab
// Quốc tế) → tự động tạo License mới và gắn vào đúng tài khoản Supabase của khách, KHÔNG cần khách tự
// nhập License Key tay (khác với `claim-license-key`, chỉ dành cho license cấp thủ công).
//
// Cách xác định đúng tài khoản: web (`app/checkout/CheckoutClient.jsx`) đã gắn sẵn
// `customData: { supabase_user_id: user.id }` khi mở Paddle Checkout — Paddle trả lại y nguyên field
// này trong `data.custom_data` của mọi event liên quan tới transaction đó, nên KHÔNG cần dò theo email.
//
// Cách cấu hình phía Paddle (làm 1 lần cho mỗi môi trường sandbox/live):
// 1. Deploy function này lên Supabase, lấy URL dạng
//    https://<project-ref>.supabase.co/functions/v1/paddle-webhook
// 2. Paddle Dashboard → Developer Tools → Notifications → "+ New destination":
//    - URL = URL ở bước 1
//    - Events = tick "transaction.completed" (KHÔNG cần tick event khác)
//    - Sau khi tạo xong, bấm vào destination vừa tạo → copy "Secret key" (dạng ntfset_...)
// 3. Supabase Dashboard → Edge Functions → paddle-webhook → Settings/Secrets, thêm biến
//    PADDLE_WEBHOOK_SECRET = secret key vừa copy (làm riêng cho sandbox và live nếu dùng 2 project
//    Supabase khác nhau; nếu dùng chung 1 project cho cả 2 thì phải chọn 1 trong 2 secret — khuyến nghị
//    tạo 2 Supabase project riêng cho sandbox/live giống cách Paddle tách 2 môi trường).
//
// Trước khi tạo lại catalog Price ở môi trường LIVE, nhớ thêm Price ID live vào PRICE_MAP bên dưới —
// thiếu thì webhook sẽ bỏ qua (không cấp License) và ghi log cảnh báo, không báo lỗi ra ngoài cho Paddle.

import { serve } from "https://deno.land/std@0.203.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const PADDLE_WEBHOOK_SECRET = Deno.env.get("PADDLE_WEBHOOK_SECRET");

// Paddle Price ID -> gói OneTools tương ứng. Xem bảng đầy đủ (kèm Product ID) ở
// claude/PaddleRegistration_BankPayout_notes.md, mục "Sandbox catalog đã tạo".
const PRICE_MAP: Record<string, { license_type: string; max_seats: number }> = {
  // ----- Sandbox (Test mode) -----
  "pri_01m3exa7pr17a917vy47bg1gv2": { license_type: "individual", max_seats: 1 }, // Individual (Pro) $39/năm
  "pri_01m3espztc22znnhaq4wrh59nb": { license_type: "team", max_seats: 3 }, // Team / Studio $98/năm
  // ----- Live (điền sau khi tạo lại catalog ở live) -----
  // "pri_xxx_live_individual": { license_type: "individual", max_seats: 1 },
  // "pri_xxx_live_team": { license_type: "team", max_seats: 3 },
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

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  // Đọc RAW body (chuỗi thô, chưa parse) — chữ ký Paddle tính trên đúng bytes gốc, parse rồi
  // stringify lại có thể lệch 1 ký tự khoảng trắng là verify sai ngay.
  const rawBody = await req.text();

  // ----- 1) Xác thực Paddle-Signature — bắt buộc, bỏ qua bước này là ai cũng giả mạo được request để
  // tự cấp License miễn phí cho mình. Header dạng: "ts=1717000000;h1=<hex hmac sha256>". -----
  const sigHeader = req.headers.get("Paddle-Signature") || "";
  const sigParts: Record<string, string> = {};
  for (const kv of sigHeader.split(";")) {
    const [k, v] = kv.split("=");
    if (k && v) sigParts[k.trim()] = v.trim();
  }
  const ts = sigParts.ts;
  const h1 = sigParts.h1;

  if (!PADDLE_WEBHOOK_SECRET) {
    console.error("[paddle-webhook] Thiếu env PADDLE_WEBHOOK_SECRET trên Supabase — chưa cấu hình xong.");
    return new Response(JSON.stringify({ error: "Chưa cấu hình PADDLE_WEBHOOK_SECRET" }), { status: 500 });
  }
  if (!ts || !h1) {
    return new Response(JSON.stringify({ error: "Thiếu header Paddle-Signature" }), { status: 401 });
  }
  const expected = await hmacHex(PADDLE_WEBHOOK_SECRET, `${ts}:${rawBody}`);
  if (!timingSafeEqual(expected, h1)) {
    console.error("[paddle-webhook] Chữ ký không khớp — request không đến từ Paddle hoặc sai secret.");
    return new Response(JSON.stringify({ error: "Chữ ký không hợp lệ" }), { status: 401 });
  }

  let event: any;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return new Response(JSON.stringify({ error: "Body không phải JSON hợp lệ" }), { status: 400 });
  }

  // ----- 2) Chỉ xử lý đúng sự kiện thanh toán 1 lần đã hoàn tất. Mọi event khác trả 200 luôn (không
  // báo lỗi) để Paddle không lặp lại gửi vô ích — nhưng KHÔNG làm gì cả. -----
  if (event.event_type !== "transaction.completed") {
    return new Response(JSON.stringify({ received: true, skipped: event.event_type }), { status: 200 });
  }

  const txn = event.data || {};
  const txnId: string | undefined = txn.id;
  const userId: string | undefined = txn.custom_data?.supabase_user_id;
  const priceId: string | undefined = txn.items?.[0]?.price?.id || txn.items?.[0]?.price_id;

  const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

  if (!txnId || !userId || !priceId || !PRICE_MAP[priceId]) {
    console.error("[paddle-webhook] Thiếu dữ liệu cần thiết hoặc price_id lạ — bỏ qua, cần kiểm tra tay:", {
      txnId,
      userId,
      priceId,
    });
    // Vẫn trả 200 để Paddle coi là đã nhận (tránh retry vô hạn) — nhưng KHÔNG cấp License, cần tự vào
    // Paddle Dashboard xem lại transaction này và cấp License thủ công qua `claim-license-key` nếu cần.
    return new Response(JSON.stringify({ received: true, warning: "missing_fields_or_unknown_price" }), {
      status: 200,
    });
  }

  // ----- 3) Chống xử lý trùng — Paddle có thể gửi lại cùng 1 event nhiều lần (retry mạng, v.v.). -----
  const { data: existing } = await supabase
    .from("licenses")
    .select("id")
    .eq("paddle_transaction_id", txnId)
    .maybeSingle();
  if (existing) {
    return new Response(JSON.stringify({ received: true, already_processed: true }), { status: 200 });
  }

  const { license_type, max_seats } = PRICE_MAP[priceId];

  // Lấy email thật của tài khoản để lưu kèm License (cột `email` trong bảng `licenses`) — không bắt
  // buộc phải khớp email lúc thanh toán, chỉ để hiển thị/tra cứu cho dễ.
  const { data: userRes, error: userErr } = await supabase.auth.admin.getUserById(userId);
  if (userErr) {
    console.error("[paddle-webhook] Không tìm thấy user_id từ custom_data:", userId, userErr.message);
  }
  const email = userRes?.user?.email || txn.customer?.email || null;

  // Sinh license_key theo đúng hàm đang dùng ở luồng sign-up (RPC `generate_license_key`) — giữ cùng 1
  // định dạng key cho toàn hệ thống thay vì tự bịa cách sinh key riêng ở đây.
  const { data: licenseKey, error: keyErr } = await supabase.rpc("generate_license_key");
  if (keyErr || !licenseKey) {
    console.error("[paddle-webhook] RPC generate_license_key lỗi:", keyErr?.message);
    return new Response(JSON.stringify({ error: "generate_license_key thất bại" }), { status: 500 });
  }

  const expiresAt = new Date(Date.now() + LICENSE_DURATION_DAYS * 24 * 60 * 60 * 1000).toISOString();

  const { error: insertErr } = await supabase.from("licenses").insert({
    license_key: licenseKey,
    email,
    status: "active",
    license_type,
    max_seats,
    expires_at: expiresAt,
    owner_user_id: userId,
    paddle_transaction_id: txnId,
  });

  if (insertErr) {
    console.error("[paddle-webhook] Insert vào bảng licenses lỗi:", insertErr.message);
    return new Response(JSON.stringify({ error: "Không tạo được License" }), { status: 500 });
  }

  console.log(`[paddle-webhook] Đã cấp License ${licenseKey} (${license_type}) cho user ${userId}, txn ${txnId}`);
  return new Response(JSON.stringify({ received: true, license_key: licenseKey }), { status: 200 });
});
