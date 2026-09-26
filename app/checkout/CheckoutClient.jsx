"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabaseClient";
import { getPaddle } from "../../lib/paddleClient";
import { useLang } from "../../lib/useLang";

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
    comingSoon: "Sắp ra mắt",
    comingSoonMsg:
      "Thanh toán PayOS đang được hoàn thiện, chưa sử dụng được. Vui lòng chọn tab Quốc tế (Paddle) để thanh toán ngay, hoặc liên hệ để được hỗ trợ chuyển khoản thủ công.",
    contactBtn: "Liên hệ hỗ trợ",
    payError: "Không tải được form thanh toán. Vui lòng tải lại trang hoặc liên hệ hỗ trợ.",
    noPaddlePrice: "Gói này chưa hỗ trợ thanh toán quốc tế qua Paddle. Vui lòng liên hệ hỗ trợ.",
    perYear: "/ năm",
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
    comingSoon: "Coming soon",
    comingSoonMsg:
      "PayOS payment is still being finished and isn't available yet. Please use the International (Paddle) tab to pay now, or contact us for manual bank transfer support.",
    contactBtn: "Contact support",
    payError: "Couldn't load the payment form. Please reload the page or contact support.",
    noPaddlePrice: "This plan doesn't support Paddle payment yet. Please contact support.",
    perYear: "/ year",
  },
};

// Class name (KHÔNG phải id) mà Paddle.js dùng để tìm đúng chỗ nhúng iframe khi
// displayMode: "inline" — xem developer.paddle.com/paddle-js/methods/paddle-checkout-open.
const PADDLE_FRAME_CLASS = "paddle-checkout-frame";

export default function CheckoutClient({ plan, country }) {
  const { lang, mounted } = useLang();
  const [method, setMethod] = useState(country === "VN" ? "payos" : "paddle");
  const [user, setUser] = useState(null);
  const [sessionChecked, setSessionChecked] = useState(false);
  const [error, setError] = useState("");
  const openedRef = useRef(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      setSessionChecked(true);
    });
  }, []);

  // Nhúng thẳng form Paddle Checkout (displayMode "inline") vào khối .paddle-checkout-frame ngay trong
  // trang này — KHÔNG mở popup/overlay riêng nữa. Chờ đã biết trạng thái đăng nhập (sessionChecked) để
  // prefill đúng email nếu có, và chỉ mở đúng 1 lần (openedRef) — 2 khối tab (PayOS/Paddle) luôn nằm sẵn
  // trong DOM, chỉ ẩn/hiện bằng CSS (xem className "hidden" bên dưới), nên form Paddle không bị mất khi
  // khách chuyển qua lại giữa 2 tab.
  useEffect(() => {
    if (!plan?.paddle_price_id || !sessionChecked || openedRef.current) return;
    openedRef.current = true;
    getPaddle()
      .then((paddle) => {
        paddle.Checkout.open({
          items: [{ priceId: plan.paddle_price_id, quantity: 1 }],
          ...(user?.email ? { customer: { email: user.email } } : {}),
          settings: {
            displayMode: "inline",
            frameTarget: PADDLE_FRAME_CLASS,
            frameInitialHeight: 450,
            frameStyle: "width: 100%; min-width: 280px; background-color: transparent; border: none;",
            successUrl: `${window.location.origin}/welcome`,
          },
        });
      })
      .catch((err) => {
        console.error("[Paddle] Không nhúng được Checkout inline:", err.message);
        openedRef.current = false;
        setError(STR[lang].payError);
      });
  }, [plan, user, sessionChecked, lang]);

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
          <span className="checkout-badge">{s.comingSoon}</span>
          <p className="checkout-sub" style={{ marginTop: 14 }}>
            {s.comingSoonMsg}
          </p>
          <a href="mailto:support@onetools-bim.com" className="checkout-btn">
            {s.contactBtn}
          </a>
        </div>

        <div className={`checkout-card ${method === "paddle" ? "" : "is-hidden"}`}>
          <p className="checkout-sub">{s.intlNote}</p>
          {plan.paddle_price_id ? (
            <>
              <div className={PADDLE_FRAME_CLASS}></div>
              {error && <p className="checkout-error">{error}</p>}
            </>
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
  .checkout-btn:disabled { opacity: 0.6; cursor: not-allowed; }
  .checkout-error { font-size: 13px; color: #E08080; margin-top: 14px; }
  .${PADDLE_FRAME_CLASS} { min-height: 420px; }
`;
