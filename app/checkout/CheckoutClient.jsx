"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabaseClient";
import { getPaddle } from "../../lib/paddleClient";
import { useLang } from "../../lib/useLang";
import { callEdgeFunction } from "../../lib/callEdgeFunction";

const STR = {
  vi: {
    back: "← Về trang giá",
    title: "Chọn phương thức thanh toán",
    notFoundTitle: "Không tìm thấy gói này",
    notFoundSub: "Gói giá có thể đã bị gỡ hoặc đường dẫn không đúng.",
    backHome: "Về trang chủ",
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
    perYear: "/ năm",
    agreePrefix: "Tôi đồng ý với ",
    agreeTerms: "Điều khoản sử dụng",
    agreeMid1: ", ",
    agreePrivacy: "Chính sách bảo mật",
    agreeMid2: " và ",
    agreeRefund: "Chính sách hoàn tiền",
    agreeSuffix: " của OneTools.",
    needAgree: "Vui lòng tích đồng ý điều khoản ở trên để tiếp tục thanh toán.",
    needLogin:
      "Cần đăng nhập trước khi thanh toán, để License được tự động gắn vào đúng tài khoản của bạn ngay sau khi mua.",
    loginBtn: "Đăng nhập",
    signupBtn: "Tạo tài khoản",
  },
  en: {
    back: "← Back to pricing",
    title: "Choose a payment method",
    notFoundTitle: "Plan not found",
    notFoundSub: "This plan may have been removed, or the link is incorrect.",
    backHome: "Back to homepage",
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
    perYear: "/ year",
    agreePrefix: "I agree to OneTools' ",
    agreeTerms: "Terms & Conditions",
    agreeMid1: ", ",
    agreePrivacy: "Privacy Policy",
    agreeMid2: ", and ",
    agreeRefund: "Refund Policy",
    agreeSuffix: ".",
    needAgree: "Please agree to the terms above to continue with payment.",
    needLogin:
      "You need to log in before paying, so your License is automatically attached to the right account right after purchase.",
    loginBtn: "Log in",
    signupBtn: "Create account",
  },
};

export default function CheckoutClient({ plan, country }) {
  const { lang, mounted } = useLang();
  const [method, setMethod] = useState(country === "VN" ? "payos" : "paddle");
  const [user, setUser] = useState(null);
  const [sessionChecked, setSessionChecked] = useState(false);
  const [error, setError] = useState("");
  // Bắt buộc tick đồng ý Điều khoản/Chính sách trước khi được thanh toán — theo yêu cầu ghi ở
  // OneToolsWebsite_progress_notes.md (Paddle hay soi khoản này khi review domain lên live).
  const [agreed, setAgreed] = useState(false);
  const [payosLoading, setPayosLoading] = useState(false);
  const [payosError, setPayosError] = useState("");
  const [paddleLoading, setPaddleLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      setSessionChecked(true);
    });
  }, []);

  // Gọi Edge Function `payos-create-payment` để PayOS tạo link thanh toán (QR/chuyển khoản), rồi chuyển
  // hẳn sang trang đó (ĐÃ THỬ nhúng inline bằng @payos/payos-checkout ngày 2026-10-07 nhưng khung nhúng
  // quá nhỏ/khó nhìn dù đã ép CSS, user yêu cầu quay lại cách chuyển hẳn trang như ban đầu — đơn giản hơn,
  // PayOS hosted page tự xử lý toàn bộ UI nhập thông tin/chuyển khoản, không phụ thuộc cách thư viện
  // nhúng tự set kích thước iframe).
  const startPayos = async () => {
    setPayosLoading(true);
    setPayosError("");
    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData.session?.access_token;
    const { ok, data } = await callEdgeFunction("payos-create-payment", { planId: plan.id }, accessToken);
    if (ok && data?.checkoutUrl) {
      window.location.href = data.checkoutUrl;
      return;
    }
    setPayosError(data?.error || s.payosGenericError);
    setPayosLoading(false);
  };

  // Mở Paddle Checkout dạng overlay (popup modal Paddle tự dựng, tự quyết định kích thước — rộng rãi hơn
  // hẳn khung nhúng "inline" hẹp 480px đã dùng trước đây, cùng vấn đề "giao diện quá bé" mà PayOS gặp
  // phải, user yêu cầu đồng bộ cách xử lý giữa 2 kênh — xem ghi chú ở startPayos). Giờ cũng bấm nút mới
  // mở, KHÔNG tự mở ngay khi tick đồng ý nữa — đồng bộ UX với tab PayOS.
  const startPaddle = async () => {
    setError("");
    setPaddleLoading(true);
    try {
      const paddle = await getPaddle();
      paddle.Checkout.open({
        items: [{ priceId: plan.paddle_price_id, quantity: 1 }],
        customer: { email: user.email },
        // Gắn thẳng user_id vào transaction — webhook đọc lại đúng field này để biết cấp License cho tài
        // khoản nào, KHÔNG cần dò theo email (tin cậy hơn, tránh sai nếu khách dùng email khác lúc thanh
        // toán so với lúc đăng ký).
        customData: { supabase_user_id: user.id },
        settings: {
          theme: "light",
          successUrl: `${window.location.origin}/welcome`,
        },
      });
    } catch (err) {
      console.error("[Paddle] Không mở được Checkout:", err.message);
      setError(STR[lang].payError);
    } finally {
      setPaddleLoading(false);
    }
  };

  if (!mounted) return null;
  const s = STR[lang];

  if (!plan) {
    return (
      <div className="checkout-root">
        <style>{checkoutCss}</style>
        <div className="checkout-card">
          <h1 className="checkout-title">{s.notFoundTitle}</h1>
          <p className="checkout-sub">{s.notFoundSub}</p>
          <Link href="/" className="checkout-btn primary" style={{ display: "block", textAlign: "center", textDecoration: "none" }}>
            {s.backHome}
          </Link>
        </div>
      </div>
    );
  }

  const name = lang === "vi" ? plan.name_vi : plan.name_en;
  const vndPrice = plan.price;
  // Quay lại đúng trang checkout này sau khi đăng nhập/đăng ký xong — gắn kèm query ?redirect= vào link
  // Đăng nhập/Tạo tài khoản bên dưới, cả 2 trang /login và /signup đều tự đọc lại param này để điều
  // hướng về đây thay vì mặc định /account (yêu cầu user 2026-10-07).
  const checkoutSelfUrl = `/checkout?id=${plan.id}`;
  const loginHref = `/login?redirect=${encodeURIComponent(checkoutSelfUrl)}`;
  const signupHref = `/signup?redirect=${encodeURIComponent(checkoutSelfUrl)}`;

  return (
    <div className="checkout-root">
      <style>{checkoutCss}</style>
      <div className="checkout-wrap">
        <Link href="/#pricing" className="checkout-back">
          {s.back}
        </Link>

        <h1 className="checkout-title">{s.title}</h1>
        <div className="checkout-plan-name">{name}</div>

        <div className="checkout-tabs">
          <button
            className={method === "payos" ? "active" : ""}
            onClick={() => setMethod("payos")}
          >
            {s.domesticTab}
          </button>
          <button
            className={method === "paddle" ? "active" : ""}
            onClick={() => setMethod("paddle")}
          >
            {s.intlTab}
          </button>
        </div>

        {/* 2 khối luôn nằm trong DOM, chỉ ẩn/hiện bằng CSS — giữ nguyên form Paddle đã nhúng khi đổi tab */}
        <div className={`checkout-card ${method === "payos" ? "" : "is-hidden"}`}>
          <p className="checkout-sub">{s.domesticNote}</p>
          <div className="checkout-price-big mono">{vndPrice ? `₫${vndPrice}` : "—"}</div>

          {!sessionChecked ? null : !user ? (
            <div className="checkout-login-gate">
              <p className="checkout-sub">{s.needLogin}</p>
              <div className="checkout-login-actions">
                <Link href={loginHref} className="checkout-btn">{s.loginBtn}</Link>
                <Link href={signupHref} className="checkout-btn primary">{s.signupBtn}</Link>
              </div>
            </div>
          ) : (
            <>
              <label className="checkout-agree">
                <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
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
              {!agreed ? (
                <p className="checkout-sub" style={{ marginTop: 14, fontStyle: "italic" }}>
                  {s.needAgree}
                </p>
              ) : (
                <>
                  <button
                    type="button"
                    className="checkout-btn primary"
                    disabled={payosLoading}
                    onClick={startPayos}
                    style={{ marginTop: 14 }}
                  >
                    {payosLoading ? s.payLoading : s.payBtn}
                  </button>
                  {payosError && <p className="checkout-error">{payosError}</p>}
                </>
              )}
            </>
          )}
        </div>

        <div className={`checkout-card ${method === "paddle" ? "" : "is-hidden"}`}>
          <p className="checkout-sub">{s.intlNote}</p>
          {plan.paddle_price_id ? (
            !sessionChecked ? null : !user ? (
              <div className="checkout-login-gate">
                <p className="checkout-sub">{s.needLogin}</p>
                <div className="checkout-login-actions">
                  <Link href={loginHref} className="checkout-btn">{s.loginBtn}</Link>
                  <Link href={signupHref} className="checkout-btn primary">{s.signupBtn}</Link>
                </div>
              </div>
            ) : !agreed ? (
              <>
                <label className="checkout-agree">
                  <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
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
                <p className="checkout-sub" style={{ marginTop: 14, fontStyle: "italic" }}>
                  {s.needAgree}
                </p>
              </>
            ) : (
              <>
                <button
                  type="button"
                  className="checkout-btn primary"
                  disabled={paddleLoading}
                  onClick={startPaddle}
                  style={{ marginTop: 14 }}
                >
                  {paddleLoading ? s.payLoadingPaddle : s.payBtnPaddle}
                </button>
                {error && <p className="checkout-error">{error}</p>}
              </>
            )
          ) : (
            <p className="checkout-error">{s.noPaddlePrice}</p>
          )}
        </div>
      </div>
    </div>
  );
}

const checkoutCss = `
  @import url('https://fonts.googleapis.com/css2?family=Oswald:wght@600;700&family=JetBrains+Mono:wght@400;500&family=Inter:wght@400;500&display=swap');
  .checkout-root {
    --bg: #292929; --bg-raised: #323232; --line: #454545;
    --text: #FFFFFF; --text-dim: #B5AA9A; --accent: #C2A47C; --warn: #D6803A;
    min-height: 100vh; background: var(--bg); color: var(--text);
    font-family: 'Inter', -apple-system, sans-serif;
    display: flex; justify-content: center; padding: 48px 20px;
  }
  .checkout-wrap { width: 100%; max-width: 480px; }
  .checkout-back { display: inline-block; color: var(--text-dim); text-decoration: none; font-size: 13px; margin-bottom: 24px; }
  .checkout-back:hover { color: var(--accent); }
  .checkout-title {
    font-family: 'Oswald', sans-serif; text-transform: uppercase;
    font-size: 22px; font-weight: 700; margin: 0 0 6px;
  }
  .checkout-plan-name { font-size: 13px; color: var(--accent); font-weight: 600; margin: 0 0 18px; }
  .checkout-tabs { display: flex; border: 1px solid var(--line); margin-bottom: 0; }
  .checkout-tabs button {
    flex: 1; padding: 12px; background: transparent; border: none; color: var(--text-dim);
    font-size: 13px; font-weight: 600; cursor: pointer; font-family: 'Inter', -apple-system, sans-serif;
  }
  .checkout-tabs button.active { background: var(--accent); color: #292929; }
  .checkout-card { border: 1px solid var(--line); border-top: none; background: var(--bg-raised); padding: 28px 20px; }
  .checkout-card.is-hidden { display: none; }
  .checkout-sub { font-size: 13.5px; color: var(--text-dim); line-height: 1.6; margin: 0 0 18px; }
  .checkout-price-big { font-size: 30px; font-weight: 700; margin-bottom: 14px; }
  .checkout-badge {
    display: inline-block; font-size: 11px; font-weight: 600; letter-spacing: 0.05em;
    text-transform: uppercase; background: var(--warn); color: #292929; padding: 4px 10px; margin-bottom: 4px;
  }
  .checkout-btn {
    display: block; width: 100%; box-sizing: border-box; text-align: center; padding: 13px;
    background: transparent; color: var(--text); border: 1px solid var(--line);
    font-size: 14px; font-weight: 600; cursor: pointer; text-decoration: none;
    font-family: 'Inter', -apple-system, sans-serif; margin-top: 6px;
  }
  .checkout-btn.primary { background: var(--accent); color: #292929; border-color: var(--accent); }
  .checkout-btn:disabled, .checkout-btn[aria-disabled="true"] { opacity: 0.5; cursor: not-allowed; }
  .checkout-error { font-size: 13px; color: #E08080; margin-top: 14px; }
  .checkout-agree {
    display: flex; align-items: flex-start; gap: 9px; margin-top: 6px;
    font-size: 12.5px; color: var(--text-dim); line-height: 1.5; cursor: pointer;
  }
  .checkout-agree input { margin-top: 3px; accent-color: var(--accent); cursor: pointer; flex-shrink: 0; }
  .checkout-agree a { color: var(--accent); text-decoration: underline; }
  .checkout-login-actions { display: flex; gap: 10px; }
  .checkout-login-actions .checkout-btn { margin-top: 0; }
`;
