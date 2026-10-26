// Supabase Edge Function: validate-promo-code
// Nhiệm vụ: khách đã đăng nhập, ở bước thanh toán (/checkout, PaymentMethodPanel.jsx) nhập 1 "Mã
// khuyến mãi" cá nhân (khác với banner khuyến mại tự động theo ngày ở bảng `promotions`) → hàm này
// tra bảng `promo_codes` bằng Service Role (bypass RLS — bảng này CỐ Ý không có policy select công
// khai để tránh lộ danh sách mã), kiểm tra còn hiệu lực/còn lượt dùng/đúng email được gán hay không,
// rồi trả về % giảm + giá đã tính sẵn cho cả VNĐ (PayOS) và USD (Paddle, chỉ để hiển thị).
//
// CHỈ validate + trả giá — KHÔNG tăng used_count ở đây (tránh đếm nhầm khi khách nhập thử rồi bỏ
// giữa chừng, không thanh toán). used_count chỉ tăng ở payos-webhook, sau khi PayOS xác nhận thanh
// toán thành công thật sự.
//
// Mã khuyến mãi THAY THẾ hoàn toàn % của đợt khuyến mại tự động đang chạy (không cộng dồn) — quyết
// định của user khi làm tính năng này (2026-10-26). payos-create-payment (bước tạo link thanh toán
// thật) sẽ tự validate lại y hệt logic ở đây, không tin số % mà hàm này trả về trước đó.
//
// Cách cấu hình (xem đầy đủ ở sql/schema_promo_v2.sql):
// 1. Chạy sql/schema_promo_v2.sql trong Supabase SQL Editor (tạo bảng promo_codes).
// 2. Deploy: `supabase functions deploy validate-promo-code` (hoặc dán code lên Dashboard → Deploy).
//    Dùng chung biến môi trường SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY đã có sẵn (tự động cấp bởi
//    Supabase cho mọi Edge Function, không cần nhập tay).

import { serve } from "https://deno.land/std@0.203.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

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

// pricing_plans.price lưu dạng text kiểu Việt Nam, vd "990.000" — giống hệt payos-create-payment.
function parseVndPrice(priceText: string): number {
  const digits = (priceText || "").replace(/[^\d]/g, "");
  return digits ? parseInt(digits, 10) : NaN;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ valid: false, error: "Method not allowed" }, 405);

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return json({ valid: false, error: "Thiếu Authorization header" }, 401);

  const userClient = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: userData, error: userErr } = await userClient.auth.getUser();
  if (userErr || !userData?.user) {
    return json({ valid: false, error: "Không xác thực được người dùng — vui lòng đăng nhập lại." }, 401);
  }
  const userEmail = (userData.user.email || "").trim().toLowerCase();

  let planId: string | undefined;
  let rawCode: string | undefined;
  try {
    const body = await req.json();
    planId = body?.planId;
    rawCode = body?.code;
  } catch {
    return json({ valid: false, error: "Body không phải JSON hợp lệ" }, 400);
  }
  if (!planId) return json({ valid: false, error: "Thiếu planId" }, 400);
  if (!rawCode || !rawCode.trim()) return json({ valid: false, error: "Vui lòng nhập mã khuyến mãi." }, 400);
  const code = rawCode.trim().toUpperCase();

  const adminClient = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

  const { data: plan, error: planErr } = await adminClient
    .from("pricing_plans")
    .select("id, price, price_usd, is_contact, is_published")
    .eq("id", planId)
    .eq("is_published", true)
    .maybeSingle();
  if (planErr || !plan || plan.is_contact) {
    return json({ valid: false, error: "Gói giá không hợp lệ." }, 400);
  }

  const { data: promoCode, error: codeErr } = await adminClient
    .from("promo_codes")
    .select("*")
    .eq("code", code)
    .maybeSingle();

  if (codeErr || !promoCode || !promoCode.is_active) {
    return json({ valid: false, error: "Mã khuyến mãi không tồn tại hoặc đã bị tắt." });
  }

  const now = new Date();
  if (promoCode.valid_from && now < new Date(promoCode.valid_from)) {
    return json({ valid: false, error: "Mã khuyến mãi chưa tới ngày áp dụng." });
  }
  if (promoCode.valid_to && now > new Date(promoCode.valid_to)) {
    return json({ valid: false, error: "Mã khuyến mãi đã hết hạn." });
  }
  if (promoCode.max_uses != null && promoCode.used_count >= promoCode.max_uses) {
    return json({ valid: false, error: "Mã khuyến mãi đã hết lượt sử dụng." });
  }
  if (promoCode.assigned_email && promoCode.assigned_email.trim().toLowerCase() !== userEmail) {
    return json({ valid: false, error: "Mã khuyến mãi này không áp dụng cho tài khoản của bạn." });
  }

  const discountPercent = promoCode.discount_percent;

  const originalAmountVnd = parseVndPrice(plan.price);
  const discountedAmountVnd = Number.isFinite(originalAmountVnd) && originalAmountVnd > 0
    ? Math.round(originalAmountVnd * (1 - discountPercent / 100))
    : null;

  const originalPriceUsd = parseFloat(plan.price_usd);
  const discountedPriceUsd = Number.isFinite(originalPriceUsd) && originalPriceUsd > 0
    ? Math.round(originalPriceUsd * (1 - discountPercent / 100) * 100) / 100
    : null;

  return json({
    valid: true,
    code,
    discount_percent: discountPercent,
    original_amount_vnd: Number.isFinite(originalAmountVnd) ? originalAmountVnd : null,
    discounted_amount_vnd: discountedAmountVnd,
    original_price_usd: Number.isFinite(originalPriceUsd) ? originalPriceUsd : null,
    discounted_price_usd: discountedPriceUsd,
  });
});
