"use client";

// Khối "Chọn phương thức thanh toán" (PayOS trong nước / Paddle quốc tế) — tách ra component riêng
// để dùng chung ở 2 chỗ: trang `/checkout?id=...` (CheckoutClient.jsx) VÀ nhúng inline ngay dưới
// bảng giá ở trang chủ (LandingClient.jsx, yêu cầu user 2026-10-08: bấm "Đăng ký ngay" không chuyển
// trang nữa, mà hiện luôn khối chọn thanh toán ngay bên dưới; chỉ khi bấm nút PayOS/Paddle thật sự
// mới rời trang). Dùng tiền tố class "pm-" riêng (KHÔNG trùng "checkout-"/"ot-" của 2 nơi gọi nó) để
// không bao giờ đụng CSS sẵn có dù nhúng ở đâu. Đọc var(--bg)/--line/... có sẵn từ CSS của trang cha
// (ot-root và checkout-root đang dùng chung đúng 1 bảng màu) kèm giá trị dự phòng nếu nhúng nơi khác.
import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabaseClient";
import { getPaddle } from "../../lib/paddleClient";
import { callEdgeFunction } from "../../lib/callEdgeFunction";

const STR = {
  vi: {
    domesticTab: "Việt Nam (PayOS)",
    intlTab: "Quốc tế (Paddle)",
    domesticNote: "Dành cho khách thanh toán trong nước bằng VNĐ (chuyển khoản / QR ngân hàng).",
    intlNote: "Dành cho khách thanh toán quốc tế bằng thẻ Visa/Mastercard/PayPal, tự quy đổi theo khu vực.",
    payBtn: "Thanh toán qua PayOS",
    payLoading: "Đang tạo link thanh toán...",
    payosGenericError: "Không tạo được link thanh toán. Vui lòng thử lại hoặc liên hệ hỗ trợ.",
    payBtnPaddle: "Thanh toán qua Paddle",
    payLoadingPaddle: "Đang mở Paddle Checkout...",
    payError: "Không mở được form thanh toán. Vui lòng thử lại hoặc liên hệ hỗ trợ.",
    noPaddlePrice: "Gói này chưa hỗ trợ thanh toán quốc tế qua Paddle. Vui lòng liên hệ hỗ trợ.",
    agreePrefix: "Tôi đồng ý với ",
    agreeTerms: "Điều khoản sử dụng",
    agreeMid1: ", ",
    agreePrivacy: "Chính sách bảo mật",
    agreeMid2: " và ",
    agreeRefund: "Chính sách hoàn tiền",
    // Cột PayOS dùng chính sách hoàn tiền RIÊNG (trong nước), tách khỏi bản Paddle (user yêu cầu
    // 2026-10-23) — xem app/refund-policy-domestic/page.jsx.
    agreeRefundDomestic: "Chính sách hoàn tiền (trong nước)",
    agreeSuffix: " của OneTools.",
    needAgree: "Vui lòng tích đồng ý điều khoản ở trên để tiếp tục thanh toán.",
    needLogin:
      "Cần đăng nhập trước khi thanh toán, để License được tự động gắn vào đúng tài khoản của bạn ngay sau khi mua.",
    loginBtn: "Đăng nhập",
    signupBtn: "Tạo tài khoản",
    // Mã khuyến mãi cá nhân — độc lập với banner khuyến mại tự động ở trang chủ. Nếu nhập mã hợp lệ,
    // mã này THAY THẾ hoàn toàn % khuyến mại tự động (không cộng dồn).
    promoCodeLabel: "Gift Code / Voucher Code",
    promoCodePlaceholder: "Nhập mã...",
    promoCodeApply: "Áp dụng",
    promoCodeApplying: "Đang kiểm tra...",
    promoCodeRemove: "Bỏ mã",
    promoCodeGenericError: "Không kiểm tra được mã khuyến mãi. Vui lòng thử lại.",
    promoCodeApplied: (pct) => `Đã áp dụng mã giảm ${pct}%.`,
  },
  en: {
    domesticTab: "Vietnam (PayOS)",
    intlTab: "International (Paddle)",
    domesticNote: "For domestic customers paying in VND (bank transfer / QR).",
    intlNote: "For international customers paying by Visa/Mastercard/PayPal, auto-converted by region.",
    payBtn: "Pay with PayOS",
    payLoading: "Creating payment link...",
    payosGenericError: "Couldn't create a payment link. Please try again or contact support.",
    payBtnPaddle: "Pay with Paddle",
    payLoadingPaddle: "Opening Paddle Checkout...",
    payError: "Couldn't open the payment form. Please try again or contact support.",
    noPaddlePrice: "This plan doesn't support Paddle payment yet. Please contact support.",
    agreePrefix: "I agree to OneTools' ",
    agreeTerms: "Terms & Conditions",
    agreeMid1: ", ",
    agreePrivacy: "Privacy Policy",
    agreeMid2: ", and ",
    agreeRefund: "Refund Policy",
    agreeRefundDomestic: "Refund Policy (Domestic)",
    agreeSuffix: ".",
    needAgree: "Please agree to the terms above to continue with payment.",
    needLogin:
      "You need to log in before paying, so your License is automatically attached to the right account right after purchase.",
    loginBtn: "Log in",
    signupBtn: "Create account",
    promoCodeLabel: "Gift Code / Voucher Code",
    promoCodePlaceholder: "Enter code...",
    promoCodeApply: "Apply",
    promoCodeApplying: "Checking...",
    promoCodeRemove: "Remove",
    promoCodeGenericError: "Couldn't check the promo code. Please try again.",
    promoCodeApplied: (pct) => `${pct}% discount code applied.`,
  },
};

export default function PaymentMethodPanel({ plan, lang, loginHref, signupHref }) {
  const s = STR[lang] || STR.vi;
  const [user, setUser] = useState(null);
  const [sessionChecked, setSessionChecked] = useState(false);
  // 2 checkbox đồng ý điều khoản RIÊNG cho từng kênh (yêu cầu user 2026-10-08) — trước đó gộp chung 1
  // cái cho cả 2 cột, nhưng user muốn mỗi kênh tự xác nhận đồng ý độc lập trước khi bấm nút kênh đó.
  const [agreedPayos, setAgreedPayos] = useState(false);
  const [agreedPaddle, setAgreedPaddle] = useState(false);
  const [payosLoading, setPayosLoading] = useState(false);
  const [payosError, setPayosError] = useState("");
  const [paddleLoading, setPaddleLoading] = useState(false);
  const [paddleError, setPaddleError] = useState("");
  // Khuyến mại đang hiệu lực (nếu có) — CHỈ áp dụng kênh PayOS, đọc từ bảng `promotions` (xem
  // sql/schema_promotions.sql). Giá giảm hiển thị ở đây chỉ để THAM KHẢO trước khi bấm thanh toán —
  // số tiền thật thu được payos-create-payment tự tính lại từ CÙNG bảng này ở phía server, nên luôn
  // khớp nhau (user yêu cầu 2026-10-26: "các thông tin được khớp tự động với nhau").
  const [promo, setPromo] = useState(null);
  // Mã khuyến mãi cá nhân (tặng riêng, admin tạo/kiểm soát ở /admin → "Mã khuyến mãi") — ĐỘC LẬP với
  // `promo` tự động ở trên (user yêu cầu 2026-10-26). Nếu áp mã thành công, mã này THAY THẾ hoàn toàn
  // % khuyến mại tự động, không cộng dồn. appliedPromoCode giữ nguyên object trả về từ Edge Function
  // validate-promo-code (đã có sẵn discount_percent).
  const [promoCodeInput, setPromoCodeInput] = useState("");
  const [appliedPromoCode, setAppliedPromoCode] = useState(null);
  const [promoCodeLoading, setPromoCodeLoading] = useState(false);
  const [promoCodeError, setPromoCodeError] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      setSessionChecked(true);
    });
  }, []);

  useEffect(() => {
    (async () => {
      const nowIso = new Date().toISOString();
      const { data } = await supabase
        .from("promotions")
        .select("*")
        .eq("is_active", true)
        .lte("valid_from", nowIso)
        .gte("valid_to", nowIso)
        .order("created_at", { ascending: false })
        .limit(1);
      setPromo(data?.[0] || null);
    })();
  }, []);

  const parseVnd = (text) => {
    const digits = (text || "").replace(/[^\d]/g, "");
    return digits ? parseInt(digits, 10) : NaN;
  };
  const formatVnd = (n) => n.toLocaleString("vi-VN");
  const vndOriginalNum = parseVnd(plan.price);
  const usdOriginalNum = parseFloat(plan.price_usd);
  // Mã khuyến mãi cá nhân (nếu đã áp) THAY THẾ hoàn toàn % khuyến mại tự động — không cộng dồn.
  const activeDiscountPercent = appliedPromoCode
    ? appliedPromoCode.discount_percent
    : promo
    ? promo.discount_percent
    : null;
  const discountedVnd =
    activeDiscountPercent != null && Number.isFinite(vndOriginalNum)
      ? Math.round(vndOriginalNum * (1 - activeDiscountPercent / 100))
      : null;
  // Giá USD cột Paddle — CHỈ hiển thị tham khảo (user xác nhận 2026-10-26: giá thật qua Paddle tự
  // cấu hình riêng trong Paddle Dashboard, không bị ràng buộc bởi % này).
  const discountedUsd =
    activeDiscountPercent != null && Number.isFinite(usdOriginalNum)
      ? Math.round(usdOriginalNum * (1 - activeDiscountPercent / 100) * 100) / 100
      : null;

  const applyPromoCode = async () => {
    if (!promoCodeInput.trim()) return;
    setPromoCodeLoading(true);
    setPromoCodeError("");
    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData.session?.access_token;
    const { ok, data } = await callEdgeFunction(
      "validate-promo-code",
      { planId: plan.id, code: promoCodeInput.trim() },
      accessToken
    );
    setPromoCodeLoading(false);
    if (ok && data?.valid) {
      setAppliedPromoCode(data);
      setPromoCodeError("");
    } else {
      setAppliedPromoCode(null);
      setPromoCodeError(data?.error || s.promoCodeGenericError);
    }
  };

  const removePromoCode = () => {
    setAppliedPromoCode(null);
    setPromoCodeInput("");
    setPromoCodeError("");
  };

  // Gọi Edge Function `payos-create-payment` rồi chuyển hẳn sang trang PayOS hosted (redirect toàn
  // trang) — ĐÃ ỔN ĐỊNH, giữ nguyên cách này (user xác nhận 2026-10-08: "trang mới Payos đã ok").
  const startPayos = async () => {
    setPayosLoading(true);
    setPayosError("");
    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData.session?.access_token;
    const { ok, data } = await callEdgeFunction(
      "payos-create-payment",
      { planId: plan.id, promoCode: appliedPromoCode?.code || undefined },
      accessToken
    );
    if (ok && data?.checkoutUrl) {
      window.location.href = data.checkoutUrl;
      return;
    }
    setPayosError(data?.error || s.payosGenericError);
    setPayosLoading(false);
  };

  // Mở Paddle Checkout dạng overlay full-màn-hình mặc định của Paddle (theme sáng). ĐÃ THỬ chuyển
  // sang displayMode:"inline" nhúng vào khung tự dựng để ép rộng cố định (2026-10-08), nhưng user xác
  // nhận lại: inline chỉ hiện mỗi form thanh toán trơ trọi (KHÔNG có cột order-summary bên trái, KHÔNG
  // có header "Return to..."/"Test Mode") — cái layout 2 cột to đẹp (order summary + payment) chỉ có
  // ở overlay mặc định của Paddle, inline không tái tạo được. Nên ĐÃ REVERT lại overlay mặc định này.
  // Bước đầu ("Your details": nhập email + quốc gia) do Paddle tự thiết kế nhỏ/1 cột — đây là hành vi
  // chuẩn của Paddle để thu thập thông tin tính VAT, sau khi bấm Continue sẽ tự chuyển sang bước
  // "Payment" to, 2 cột như mong muốn. KHÔNG có setting nào của Paddle.js để ép to ngay từ bước 1.
  const startPaddle = async () => {
    setPaddleError("");
    setPaddleLoading(true);
    try {
      const paddle = await getPaddle();
      paddle.Checkout.open({
        items: [{ priceId: plan.paddle_price_id, quantity: 1 }],
        customer: { email: user.email },
        customData: { supabase_user_id: user.id },
        settings: {
          theme: "light",
          successUrl: `${window.location.origin}/welcome`,
        },
      });
    } catch (err) {
      console.error("[Paddle] Không mở được Checkout:", err.message);
      setPaddleError(s.payError);
    } finally {
      setPaddleLoading(false);
    }
  };

  const vndPrice = plan.price;

  return (
    <div className="pm-root">
      <style>{pmCss}</style>

      {!sessionChecked ? null : !user ? (
        <div className="pm-card pm-card-narrow">
          <p className="pm-sub">{s.needLogin}</p>
          <div className="pm-login-actions">
            <Link href={loginHref} className="pm-btn">{s.loginBtn}</Link>
            <Link href={signupHref} className="pm-btn primary">{s.signupBtn}</Link>
          </div>
        </div>
      ) : (
        <>
          <div className="pm-promo-code">
            <label className="pm-promo-code-label" htmlFor="pm-promo-code-input">{s.promoCodeLabel}</label>
            <div className="pm-promo-code-row">
              <input
                id="pm-promo-code-input"
                className="pm-promo-code-input mono"
                value={promoCodeInput}
                onChange={(e) => setPromoCodeInput(e.target.value)}
                placeholder={s.promoCodePlaceholder}
                disabled={!!appliedPromoCode || promoCodeLoading}
              />
              {appliedPromoCode ? (
                <button type="button" className="pm-btn" onClick={removePromoCode}>{s.promoCodeRemove}</button>
              ) : (
                <button
                  type="button"
                  className="pm-btn"
                  disabled={promoCodeLoading || !promoCodeInput.trim()}
                  onClick={applyPromoCode}
                >
                  {promoCodeLoading ? s.promoCodeApplying : s.promoCodeApply}
                </button>
              )}
            </div>
            {appliedPromoCode && <p className="pm-promo-code-success">{s.promoCodeApplied(appliedPromoCode.discount_percent)}</p>}
            {promoCodeError && <p className="pm-error">{promoCodeError}</p>}
          </div>

          <div className="pm-grid">
          <div className="pm-card">
            <div className="pm-card-head">{s.domesticTab}</div>
            <p className="pm-sub">{s.domesticNote}</p>

            <div className="pm-price mono">
              {!vndPrice ? (
                "—"
              ) : activeDiscountPercent != null && discountedVnd !== null ? (
                <>
                  <span className="pm-price-old">₫{vndPrice}</span>
                  <span className="pm-price-new">₫{formatVnd(discountedVnd)}</span>
                </>
              ) : (
                `₫${vndPrice}`
              )}
            </div>

            <label className="pm-agree">
              <input type="checkbox" checked={agreedPayos} onChange={(e) => setAgreedPayos(e.target.checked)} />
              <span>
                {s.agreePrefix}
                <Link href="/terms" target="_blank">{s.agreeTerms}</Link>
                {s.agreeMid1}
                <Link href="/privacy-policy" target="_blank">{s.agreePrivacy}</Link>
                {s.agreeMid2}
                <Link href="/refund-policy-domestic" target="_blank">{s.agreeRefundDomestic}</Link>
                {s.agreeSuffix}
              </span>
            </label>

            {!agreedPayos ? (
              <p className="pm-sub pm-italic">{s.needAgree}</p>
            ) : (
              <>
                <button type="button" className="pm-btn primary" disabled={payosLoading} onClick={startPayos}>
                  {payosLoading ? s.payLoading : s.payBtn}
                </button>
                {payosError && <p className="pm-error">{payosError}</p>}
              </>
            )}
          </div>

          <div className="pm-card">
            <div className="pm-card-head">{s.intlTab}</div>
            <p className="pm-sub">{s.intlNote}</p>
            {plan.paddle_price_id ? (
              <>
                <div className="pm-price mono">
                  {!plan.price_usd ? (
                    "—"
                  ) : activeDiscountPercent != null && discountedUsd !== null ? (
                    <>
                      <span className="pm-price-old">${plan.price_usd}</span>
                      <span className="pm-price-new">${discountedUsd}</span>
                    </>
                  ) : (
                    `$${plan.price_usd}`
                  )}
                </div>

                <label className="pm-agree">
                  <input type="checkbox" checked={agreedPaddle} onChange={(e) => setAgreedPaddle(e.target.checked)} />
                  <span>
                    {s.agreePrefix}
                    <Link href="/terms" target="_blank">{s.agreeTerms}</Link>
                    {s.agreeMid1}
                    <Link href="/privacy-policy" target="_blank">{s.agreePrivacy}</Link>
                    {s.agreeMid2}
                    <Link href="/refund-policy" target="_blank">{s.agreeRefund}</Link>
                    {s.agreeSuffix}
                  </span>
                </label>

                {!agreedPaddle ? (
                  <p className="pm-sub pm-italic">{s.needAgree}</p>
                ) : (
                  <>
                    <button type="button" className="pm-btn primary" disabled={paddleLoading} onClick={startPaddle}>
                      {paddleLoading ? s.payLoadingPaddle : s.payBtnPaddle}
                    </button>
                    {paddleError && <p className="pm-error">{paddleError}</p>}
                  </>
                )}
              </>
            ) : (
              <p className="pm-error">{s.noPaddlePrice}</p>
            )}
          </div>
          </div>
        </>
      )}
    </div>
  );
}

const pmCss = `
  .pm-root { font-family: 'Inter', -apple-system, sans-serif; color: var(--text, #FFFFFF); }
  .pm-root * { box-sizing: border-box; }
  .pm-root .mono { font-family: 'JetBrains Mono', 'Inter', -apple-system, sans-serif; }
  .pm-card-narrow { max-width: 640px; margin: 0 auto; }
  .pm-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 28px; align-items: stretch; }
  .pm-card-head {
    font-family: 'Oswald', sans-serif; text-transform: uppercase; font-size: 16px; font-weight: 700;
    color: var(--accent, #C2A47C); margin: 0 0 16px; padding-bottom: 14px; border-bottom: 1px solid var(--line, #454545);
  }
  .pm-card {
    border: 1px solid var(--line, #454545); background: var(--bg-raised, #323232); padding: 36px 32px;
    display: flex; flex-direction: column;
  }
  .pm-sub { font-size: 15px; color: var(--text-dim, #B5AA9A); line-height: 1.6; margin: 0 0 18px; }
  .pm-italic { font-style: italic; margin-top: 8px; margin-bottom: 0; }
  .pm-price {
    display: flex; align-items: baseline; flex-wrap: wrap; gap: 10px;
    font-size: 38px; font-weight: 700; margin-bottom: 20px; color: var(--text, #FFFFFF);
  }
  .pm-price-old {
    font-size: 18px; font-weight: 400; color: var(--text-dim, #B5AA9A);
    text-decoration: line-through;
  }
  .pm-price-new { color: var(--accent, #C2A47C); }
  .pm-btn {
    display: block; width: 100%; box-sizing: border-box; text-align: center; padding: 16px;
    background: transparent; color: var(--text, #FFFFFF); border: 1px solid var(--line, #454545);
    font-size: 15.5px; font-weight: 600; cursor: pointer; text-decoration: none;
    font-family: 'Inter', -apple-system, sans-serif; margin-top: 8px;
  }
  .pm-btn.primary { background: var(--accent, #C2A47C); color: #292929; border-color: var(--accent, #C2A47C); }
  .pm-btn:disabled { opacity: 0.5; cursor: not-allowed; }
  .pm-error { font-size: 14px; color: #E08080; margin-top: 14px; }
  .pm-agree {
    display: flex; align-items: flex-start; gap: 10px; margin-top: 4px; margin-bottom: 4px;
    font-size: 13.5px; color: var(--text-dim, #B5AA9A); line-height: 1.5; cursor: pointer;
  }
  .pm-agree input { width: 17px; height: 17px; margin-top: 2px; accent-color: var(--accent, #C2A47C); cursor: pointer; flex-shrink: 0; }
  .pm-agree a { color: var(--accent, #C2A47C); text-decoration: underline; }
  .pm-login-actions { display: flex; gap: 12px; }
  .pm-promo-code { margin-bottom: 24px; }
  .pm-promo-code-label { display: block; font-size: 13px; color: var(--text-dim, #B5AA9A); margin-bottom: 8px; }
  .pm-promo-code-row { display: flex; gap: 10px; max-width: 420px; }
  .pm-promo-code-input {
    /* font-size PHẢI >= 16px — dưới ngưỡng này Safari trên iPhone tự động zoom cả trang khi bấm vào
       ô input, gây cảm giác "xô lệch, không đứng yên" (user báo lỗi 2026-10-26). Không phải lỗi CSS
       khoá vị trí — đây là hành vi mặc định của iOS, chỉ cần tránh font-size nhỏ là hết. */
    flex: 1; min-width: 0; padding: 12px 14px; background: var(--bg, #292929);
    border: 1px solid var(--line, #454545); color: var(--text, #FFFFFF); font-size: 16px;
  }
  .pm-promo-code-row .pm-btn { width: auto; margin-top: 0; padding: 12px 20px; white-space: nowrap; }
  .pm-promo-code-success { font-size: 13px; color: var(--accent, #C2A47C); margin: 8px 0 0; }
  @media (max-width: 900px) {
    .pm-grid { grid-template-columns: 1fr; }
  }
  @media (max-width: 600px) {
    .pm-card { padding: 26px 20px; }
    .pm-price { font-size: 30px; }
    .pm-price-old { font-size: 15px; }
  }
`;
