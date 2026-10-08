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
    agreeSuffix: " của OneTools.",
    needAgree: "Vui lòng tích đồng ý điều khoản ở trên để tiếp tục thanh toán.",
    needLogin:
      "Cần đăng nhập trước khi thanh toán, để License được tự động gắn vào đúng tài khoản của bạn ngay sau khi mua.",
    loginBtn: "Đăng nhập",
    signupBtn: "Tạo tài khoản",
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
    agreeSuffix: ".",
    needAgree: "Please agree to the terms above to continue with payment.",
    needLogin:
      "You need to log in before paying, so your License is automatically attached to the right account right after purchase.",
    loginBtn: "Log in",
    signupBtn: "Create account",
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

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      setSessionChecked(true);
    });
  }, []);

  // Gọi Edge Function `payos-create-payment` rồi chuyển hẳn sang trang PayOS hosted (redirect toàn
  // trang) — ĐÃ ỔN ĐỊNH, giữ nguyên cách này (user xác nhận 2026-10-08: "trang mới Payos đã ok").
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

  // Mở Paddle Checkout dạng overlay full-màn-hình (theme sáng, Paddle tự dựng kích thước) — ĐÃ ỔN
  // ĐỊNH, giữ nguyên (user xác nhận 2026-10-08: Paddle cần "mở ra hẳn trang mới" giống bản này).
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
        <div className="pm-grid">
          <div className="pm-card">
            <div className="pm-card-head">{s.domesticTab}</div>
            <p className="pm-sub">{s.domesticNote}</p>
            <div className="pm-price mono">{vndPrice ? `₫${vndPrice}` : "—"}</div>

            <label className="pm-agree">
              <input type="checkbox" checked={agreedPayos} onChange={(e) => setAgreedPayos(e.target.checked)} />
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
                {/* Thêm giá USD tĩnh (plan.price_usd) — trước đây thiếu dòng này nên checkbox "Tôi đồng
                    ý" của cột Paddle bị lệch lên cao hơn hẳn cột PayOS (cột PayOS có thêm dòng giá VNĐ
                    phía trên checkbox). Thêm giá vào đây vừa đúng yêu cầu "bổ sung giá đô", vừa làm 2
                    checkbox tự thẳng hàng vì cấu trúc 2 cột giờ giống hệt nhau (user 2026-10-08). */}
                <div className="pm-price mono">{plan.price_usd ? `$${plan.price_usd}` : "—"}</div>
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
      )}
    </div>
  );
}

const pmCss = `
  .pm-root { font-family: 'Inter', -apple-system, sans-serif; color: var(--text, #FFFFFF); }
  .pm-root * { box-sizing: border-box; }
  /* Định nghĩa riêng .mono ở đây (không dựa vào trang cha có định nghĩa sẵn hay không) — panel này
     được nhúng ở 2 nơi khác nhau (trang chủ và /checkout), chỉ trang chủ (LandingClient.jsx) tự định
     nghĩa .mono, nên nếu không có dòng này giá tiền trên /checkout sẽ bị thiếu font monospace. */
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
  .pm-price { font-size: 38px; font-weight: 700; margin-bottom: 20px; color: var(--text, #FFFFFF); }
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
  @media (max-width: 900px) {
    .pm-grid { grid-template-columns: 1fr; }
  }
`;
