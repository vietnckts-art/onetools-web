"use client";

import Link from "next/link";
import { useLang } from "../../lib/useLang";
import PaymentMethodPanel from "./PaymentMethodPanel";

const STR = {
  vi: {
    back: "← Về trang giá",
    title: "Chọn phương thức thanh toán",
    notFoundTitle: "Không tìm thấy gói này",
    notFoundSub: "Gói giá có thể đã bị gỡ hoặc đường dẫn không đúng.",
    backHome: "Về trang chủ",
  },
  en: {
    back: "← Back to pricing",
    title: "Choose a payment method",
    notFoundTitle: "Plan not found",
    notFoundSub: "This plan may have been removed, or the link is incorrect.",
    backHome: "Back to homepage",
  },
};

// Trang /checkout?id=... — giờ chỉ còn giữ phần khung trang (tiêu đề, link quay lại, trạng thái
// "không tìm thấy gói"); khối chọn PayOS/Paddle thật sự dùng chung component `PaymentMethodPanel`
// với bản nhúng inline ở trang chủ (xem app/LandingClient.jsx) — tránh lặp code 2 nơi. Trang này vẫn
// cần giữ lại (không xoá) vì luồng redirect-back sau đăng nhập/đăng ký (?redirect=/checkout?id=...)
// dẫn khách quay lại đúng đây.
export default function CheckoutClient({ plan }) {
  const { lang, mounted } = useLang();

  if (!mounted) return null;
  const s = STR[lang];

  if (!plan) {
    return (
      <div className="checkout-root">
        <style>{checkoutCss}</style>
        <div className="checkout-wrap">
          <div className="checkout-card checkout-card-narrow">
            <h1 className="checkout-title">{s.notFoundTitle}</h1>
            <p className="checkout-sub">{s.notFoundSub}</p>
            <Link href="/" className="checkout-btn primary" style={{ display: "block", textAlign: "center", textDecoration: "none" }}>
              {s.backHome}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const name = lang === "vi" ? plan.name_vi : plan.name_en;
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

        <PaymentMethodPanel plan={plan} lang={lang} loginHref={loginHref} signupHref={signupHref} />
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
    display: flex; justify-content: center; padding: 56px 32px;
  }
  .checkout-wrap { width: 100%; max-width: 1180px; }
  .checkout-back { display: inline-block; color: var(--text-dim); text-decoration: none; font-size: 14.5px; margin-bottom: 28px; }
  .checkout-back:hover { color: var(--accent); }
  .checkout-title {
    font-family: 'Oswald', sans-serif; text-transform: uppercase;
    font-size: 32px; font-weight: 700; margin: 0 0 8px;
  }
  .checkout-plan-name { font-size: 16px; color: var(--accent); font-weight: 600; margin: 0 0 26px; }
  .checkout-card-narrow { max-width: 640px; margin: 0 auto; }
  .checkout-card {
    border: 1px solid var(--line); background: var(--bg-raised); padding: 36px 32px;
  }
  .checkout-sub { font-size: 15px; color: var(--text-dim); line-height: 1.6; margin: 0 0 22px; }
  .checkout-btn {
    display: block; width: 100%; box-sizing: border-box; text-align: center; padding: 16px;
    background: transparent; color: var(--text); border: 1px solid var(--line);
    font-size: 15.5px; font-weight: 600; cursor: pointer; text-decoration: none;
    font-family: 'Inter', -apple-system, sans-serif; margin-top: 10px;
  }
  .checkout-btn.primary { background: var(--accent); color: #292929; border-color: var(--accent); }
  @media (max-width: 600px) {
    .checkout-root { padding: 32px 16px; }
    .checkout-card { padding: 28px 22px; }
    .checkout-title { font-size: 24px; }
  }
`;
