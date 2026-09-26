"use client";

import Link from "next/link";
import { useLang } from "../../lib/useLang";

const STR = {
  vi: {
    title: "Cảm ơn bạn!",
    sub: "Thanh toán đã được ghi nhận. Chúng tôi đang xử lý và sẽ cấp License cho tài khoản của bạn trong ít phút.",
    subSandbox: "(Đây là giao dịch thử ở môi trường Sandbox — chưa phải thanh toán thật.)",
    goAccount: "Xem tài khoản & License",
    goHome: "Về trang chủ",
  },
  en: {
    title: "Thank you!",
    sub: "Your payment has been received. We're processing it and your license will appear on your account shortly.",
    subSandbox: "(This was a test transaction in the Sandbox environment — no real payment was made.)",
    goAccount: "View account & license",
    goHome: "Back to homepage",
  },
};

export default function WelcomePage() {
  const { lang, mounted } = useLang();
  if (!mounted) return null;
  const s = STR[lang];
  const isSandbox = process.env.NEXT_PUBLIC_PADDLE_ENVIRONMENT === "sandbox";

  return (
    <div className="welcome-root">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Oswald:wght@600;700&family=Inter:wght@400;500&display=swap');
        .welcome-root {
          --bg: #292929; --bg-raised: #323232; --line: #454545;
          --text: #FFFFFF; --text-dim: #B5AA9A; --accent: #C2A47C;
          min-height: 100vh; background: var(--bg); color: var(--text);
          font-family: 'Inter', -apple-system, sans-serif;
          display: flex; align-items: center; justify-content: center;
          padding: 24px;
        }
        .welcome-card {
          width: 100%; max-width: 420px; text-align: center;
          border: 1px solid var(--line); background: var(--bg-raised);
          padding: 40px 32px;
        }
        .welcome-title {
          font-family: 'Oswald', sans-serif; text-transform: uppercase;
          font-size: 24px; font-weight: 700; margin: 0 0 12px; color: var(--accent);
        }
        .welcome-sub { font-size: 14px; color: var(--text-dim); line-height: 1.6; margin: 0 0 8px; }
        .welcome-sandbox-note { font-size: 12px; color: var(--text-dim); opacity: 0.7; margin: 0 0 28px; }
        .welcome-actions { display: flex; flex-direction: column; gap: 10px; }
        .welcome-btn {
          padding: 12px; font-size: 13px; font-weight: 600; text-decoration: none;
          border: 1px solid var(--line); color: var(--text); transition: all 0.15s;
        }
        .welcome-btn.primary { background: var(--accent); color: #292929; border-color: var(--accent); }
        .welcome-btn:hover { border-color: var(--accent); }
      `}</style>
      <div className="welcome-card">
        <h1 className="welcome-title">{s.title}</h1>
        <p className="welcome-sub">{s.sub}</p>
        {isSandbox && <p className="welcome-sandbox-note">{s.subSandbox}</p>}
        <div className="welcome-actions">
          <Link href="/account" className="welcome-btn primary">{s.goAccount}</Link>
          <Link href="/" className="welcome-btn">{s.goHome}</Link>
        </div>
      </div>
    </div>
  );
}