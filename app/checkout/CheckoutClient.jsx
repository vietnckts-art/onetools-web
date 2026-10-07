"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { usePayOS } from "@payos/payos-checkout";
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
    payError: "Không tải được form thanh toán. Vui lòng tải lại trang hoặc liên hệ hỗ trợ.",
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
    payError: "Couldn't load the payment form. Please reload the page or contact support.",
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

// Class name (KHÔNG phải id) mà Paddle.js dùng để tìm đúng chỗ nhúng iframe khi
// displayMode: "inline" — xem developer.paddle.com/paddle-js/methods/paddle-checkout-open.
const PADDLE_FRAME_CLASS = "paddle-checkout-frame";

// id của div dùng để nhúng giao diện thanh toán PayOS (thư viện @payos/payos-checkout tự tìm theo
// đúng id này — xem payos.vn/docs/checkout/quick-start-payos-embedded-form, mục "React").
const PAYOS_ELEMENT_ID = "payos-checkout-embed";

export default function CheckoutClient({ plan, country }) {
  const router = useRouter();
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
  const openedRef = useRef(false);
  const payosOpenedRef = useRef(false);

  // Config cho hook usePayOS (thư viện chính thức của PayOS để NHÚNG giao diện thanh toán ngay trong
  // trang, thay vì chuyển hẳn khách sang pay.payos.vn ở tab khác — theo yêu cầu user 2026-10-07).
  // CHECKOUT_URL để rỗng lúc đầu — chỉ có giá trị sau khi gọi xong payos-create-payment; hook sẽ tự
  // không làm gì nếu CHECKOUT_URL rỗng, ta tự gọi open() trong useEffect bên dưới khi có giá trị.
  const [payOSConfig, setPayOSConfig] = useState(() => ({
    RETURN_URL: typeof window !== "undefined" ? `${window.location.origin}/welcome` : "",
    ELEMENT_ID: PAYOS_ELEMENT_ID,
    CHECKOUT_URL: "",
    embedded: true,
    onSuccess: () => {
      // Thanh toán thành công — đóng khung nhúng rồi chuyển sang trang cảm ơn. Việc cấp License tự
      // động vẫn do webhook `payos-webhook` xử lý ở backend (độc lập, không phụ thuộc sự kiện này).
      exit();
      router.push("/welcome");
    },
    onCancel: () => {
      payosOpenedRef.current = false;
      setPayOSConfig((prev) => ({ ...prev, CHECKOUT_URL: "" }));
    },
    onExit: () => {
      payosOpenedRef.current = false;
      setPayOSConfig((prev) => ({ ...prev, CHECKOUT_URL: "" }));
    },
  }));
  const { open, exit } = usePayOS(payOSConfig);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      setSessionChecked(true);
    });
  }, []);

  // Gọi Edge Function `payos-create-payment` để PayOS tạo link thanh toán (QR/chuyển khoản), rồi NHÚNG
  // thẳng giao diện đó vào khối #payos-checkout-embed ngay trong trang này (giống cách Paddle nhúng
  // inline bên dưới) — KHÔNG chuyển hẳn khách sang tab/domain khác nữa.
  const startPayos = async () => {
    setPayosLoading(true);
    setPayosError("");
    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData.session?.access_token;
    const { ok, data } = await callEdgeFunction("payos-create-payment", { planId: plan.id }, accessToken);
    if (ok && data?.checkoutUrl) {
      setPayOSConfig((prev) => ({ ...prev, CHECKOUT_URL: data.checkoutUrl }));
      setPayosLoading(false);
      return;
    }
    setPayosError(data?.error || s.payosGenericError);
    setPayosLoading(false);
  };

  // Chỉ mở đúng 1 lần cho mỗi link thanh toán mới (payosOpenedRef) — tránh gọi open() lặp lại mỗi lần
  // component re-render trong lúc khung nhúng đang hiện.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!payOSConfig.CHECKOUT_URL || payosOpenedRef.current) return;
    payosOpenedRef.current = true;
    open();
  }, [payOSConfig.CHECKOUT_URL]);

  // Nhúng thẳng form Paddle Checkout (displayMode "inline") vào khối .paddle-checkout-frame ngay trong
  // trang này — KHÔNG mở popup/overlay riêng nữa. Chờ đã biết trạng thái đăng nhập (sessionChecked) để
  // prefill đúng email nếu có, và chỉ mở đúng 1 lần (openedRef) — 2 khối tab (PayOS/Paddle) luôn nằm sẵn
  // trong DOM, chỉ ẩn/hiện bằng CSS (xem className "hidden" bên dưới), nên form Paddle không bị mất khi
  // khách chuyển qua lại giữa 2 tab.
  useEffect(() => {
    if (!plan?.paddle_price_id || !sessionChecked || !user || !agreed || openedRef.current) return;
    openedRef.current = true;
    getPaddle()
      .then((paddle) => {
        paddle.Checkout.open({
          items: [{ priceId: plan.paddle_price_id, quantity: 1 }],
          customer: { email: user.email },
          // Gắn thẳng user_id vào transaction — webhook đọc lại đúng field này để biết cấp License cho
          // tài khoản nào, KHÔNG cần dò theo email (tin cậy hơn, tránh sai nếu khách dùng email khác lúc
          // thanh toán so với lúc đăng ký).
          customData: { supabase_user_id: user.id },
          settings: {
            displayMode: "inline",
            theme: "dark",
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
  }, [plan, user, sessionChecked, agreed, lang]);
  // Chờ đủ 4 điều kiện: có price_id, đã biết trạng thái đăng nhập, ĐÃ đăng nhập, và đã tick đồng ý điều
  // khoản — thiếu bất kỳ điều kiện nào cũng không mở Checkout (xem nhánh hiển thị tương ứng bên dưới).

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

        {/* 2 khối luôn nằm trong DOM, chỉ ẩn/hiện bằng CSS — giữ nguyên form Paddle/PayOS đã nhúng khi
            đổi tab */}
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
              ) : !payOSConfig.CHECKOUT_URL ? (
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
              ) : (
                <div id={PAYOS_ELEMENT_ID} className="payos-checkout-frame"></div>
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
                <div className={PADDLE_FRAME_CLASS}></div>
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
  .${PADDLE_FRAME_CLASS} { min-height: 420px; }
  #${PAYOS_ELEMENT_ID} { min-height: 420px; margin-top: 14px; }
`;
