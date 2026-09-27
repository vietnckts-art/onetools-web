"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";
import { useLang } from "../../lib/useLang";

const STR = {
  vi: {
    loginTitle: "Đăng nhập OneTools",
    loginSub: "Nhập email và mật khẩu đã đăng ký license.",
    email: "Email",
    password: "Mật khẩu",
    loginBtn: "Đăng nhập",
    loginBtnBusy: "Đang đăng nhập...",
    forgot: "Quên mật khẩu?",
    noAccount: "Chưa có tài khoản? Đăng ký",
    forgotTitle: "Quên mật khẩu",
    forgotSub: "Nhập email tài khoản — hệ thống sẽ gửi link đặt lại mật khẩu.",
    forgotBtn: "Gửi email đặt lại mật khẩu",
    forgotBtnBusy: "Đang gửi...",
    sentMsg: (email) => (
      <>Đã gửi email đặt lại mật khẩu tới <strong>{email}</strong>. Vui lòng kiểm tra hộp thư.</>
    ),
    backToLogin: "← Quay lại đăng nhập",
    errGeneric: "Có lỗi xảy ra, vui lòng thử lại.",
    errInvalidCreds: "Email hoặc mật khẩu không đúng.",
    errNotConfirmed: "Email chưa được xác nhận. Vui lòng liên hệ support@onetools-bim.com.",
  },
  en: {
    loginTitle: "Log in to OneTools",
    loginSub: "Enter the email and password you registered your license with.",
    email: "Email",
    password: "Password",
    loginBtn: "Log in",
    loginBtnBusy: "Logging in...",
    forgot: "Forgot password?",
    noAccount: "Don't have an account? Sign up",
    forgotTitle: "Forgot password",
    forgotSub: "Enter your account email — we'll send you a password reset link.",
    forgotBtn: "Send reset email",
    forgotBtnBusy: "Sending...",
    sentMsg: (email) => (
      <>A password reset email has been sent to <strong>{email}</strong>. Please check your inbox.</>
    ),
    backToLogin: "← Back to login",
    errGeneric: "Something went wrong, please try again.",
    errInvalidCreds: "Incorrect email or password.",
    errNotConfirmed: "Email not confirmed yet. Please contact support@onetools-bim.com.",
  },
};

function mapErrorMessage(message, s) {
  if (!message) return s.errGeneric;
  if (message.includes("Invalid login credentials")) return s.errInvalidCreds;
  if (message.includes("Email not confirmed")) return s.errNotConfirmed;
  return message;
}

export default function LoginPage() {
  const router = useRouter();
  const { lang, setLang, mounted } = useLang();
  const [mode, setMode] = useState("login"); // login | forgot
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState("idle"); // idle | sending | sent | error
  const [errorMsg, setErrorMsg] = useState("");

  if (!mounted) return null;
  const s = STR[lang];

  const handleLogin = async (e) => {
    e.preventDefault();
    setStatus("sending");
    setErrorMsg("");

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setStatus("error");
      setErrorMsg(mapErrorMessage(error.message, s));
      return;
    }

    router.push("/account");
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setStatus("sending");
    setErrorMsg("");

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo:
        typeof window !== "undefined" ? `${window.location.origin}/reset-password` : undefined,
    });

    if (error) {
      setStatus("error");
      setErrorMsg(mapErrorMessage(error.message, s));
    } else {
      setStatus("sent");
    }
  };

  const switchMode = (nextMode) => {
    setMode(nextMode);
    setStatus("idle");
    setErrorMsg("");
  };

  return (
    <div className="login-root">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Oswald:wght@600;700&family=JetBrains+Mono:wght@400;500&family=Inter:wght@400;500&display=swap');
        .login-root {
          --bg: #161512; --bg-raised: #1F1D19; --line: #37342C;
          --text: #F3EFE6; --text-dim: #A79E8C; --accent: #C9A15F;
          min-height: 100vh; background: var(--bg); color: var(--text);
          font-family: 'Inter', sans-serif;
          display: flex; align-items: center; justify-content: center;
          padding: 24px; position: relative;
        }
        .login-lang {
          position: absolute; top: 20px; right: 20px;
          display: inline-flex; border: 1px solid var(--line); font-size: 12px;
        }
        .login-lang button {
          padding: 5px 10px; background: transparent; border: none;
          color: var(--text-dim); cursor: pointer; letter-spacing: 0.04em;
          font-family: 'Inter', -apple-system, sans-serif;
        }
        .login-lang button.active { background: var(--accent); color: var(--bg); }
        .login-card {
          width: 100%; max-width: 380px;
          border: 1px solid var(--line); background: var(--bg-raised);
          padding: 36px 32px;
        }
        .login-title {
          font-family: 'Oswald', sans-serif; text-transform: uppercase;
          font-size: 22px; font-weight: 700; margin: 0 0 8px;
        }
        .login-sub { font-size: 13.5px; color: var(--text-dim); margin: 0 0 24px; line-height: 1.5; }
        .login-label {
          font-family: 'JetBrains Mono', monospace; font-size: 11px;
          color: var(--accent); letter-spacing: 0.1em; text-transform: uppercase;
          display: block; margin-bottom: 8px;
        }
        .login-input {
          width: 100%; padding: 12px 14px; background: var(--bg);
          border: 1px solid var(--line); color: var(--text); font-size: 14px;
          margin-bottom: 18px; box-sizing: border-box;
        }
        .login-input:focus { outline: none; border-color: var(--accent); }
        .login-pw-wrap { position: relative; }
        .login-pw-wrap .login-input { padding-right: 42px; }
        .login-pw-toggle {
          position: absolute; top: 0; right: 0; height: 45px; width: 40px;
          background: none; border: none; padding: 0;
          display: flex; align-items: center; justify-content: center;
          color: var(--text-dim); cursor: pointer;
        }
        .login-pw-toggle:hover { color: var(--accent); }
        .login-btn {
          width: 100%; padding: 13px; background: var(--accent); color: var(--bg);
          border: none; font-family: 'JetBrains Mono', monospace; font-weight: 600;
          font-size: 14px; cursor: pointer;
        }
        .login-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .login-msg { font-size: 13px; margin-top: 16px; line-height: 1.5; }
        .login-msg.success { color: #7FBF7F; }
        .login-msg.error { color: #E08080; }
        .login-links {
          display: flex; justify-content: space-between; margin-top: 16px;
          font-size: 12.5px;
        }
        .login-links a, .login-links button.linklike {
          color: var(--text-dim); text-decoration: none; background: none;
          border: none; padding: 0; font: inherit; cursor: pointer;
        }
        .login-links a:hover, .login-links button.linklike:hover { color: var(--accent); }
      `}</style>
      <div className="login-lang">
        <button className={lang === "vi" ? "active" : ""} onClick={() => setLang("vi")}>VI</button>
        <button className={lang === "en" ? "active" : ""} onClick={() => setLang("en")}>EN</button>
      </div>
      <div className="login-card">
        {mode === "login" ? (
          <>
            <h1 className="login-title">{s.loginTitle}</h1>
            <p className="login-sub">{s.loginSub}</p>
            <form onSubmit={handleLogin}>
              <label className="login-label" htmlFor="email">{s.email}</label>
              <input
                id="email"
                type="email"
                required
                className="login-input"
                placeholder="ban@congty.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <label className="login-label" htmlFor="password">{s.password}</label>
              <div className="login-pw-wrap">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  className="login-input"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="login-pw-toggle"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? (lang === "vi" ? "Ẩn mật khẩu" : "Hide password") : (lang === "vi" ? "Hiện mật khẩu" : "Show password")}
                >
                  {showPassword ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                      <line x1="1" y1="1" x2="23" y2="23"></line>
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                      <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                  )}
                </button>
              </div>
              <button className="login-btn" type="submit" disabled={status === "sending"}>
                {status === "sending" ? s.loginBtnBusy : s.loginBtn}
              </button>
              {status === "error" && <p className="login-msg error">{errorMsg}</p>}
            </form>
            <div className="login-links">
              <button type="button" className="linklike" onClick={() => switchMode("forgot")}>
                {s.forgot}
              </button>
              <Link href="/signup">{s.noAccount}</Link>
            </div>
          </>
        ) : (
          <>
            <h1 className="login-title">{s.forgotTitle}</h1>
            <p className="login-sub">{s.forgotSub}</p>
            {status === "sent" ? (
              <p className="login-msg success">{s.sentMsg(email)}</p>
            ) : (
              <form onSubmit={handleForgotPassword}>
                <label className="login-label" htmlFor="forgot-email">{s.email}</label>
                <input
                  id="forgot-email"
                  type="email"
                  required
                  className="login-input"
                  placeholder="ban@congty.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <button className="login-btn" type="submit" disabled={status === "sending"}>
                  {status === "sending" ? s.forgotBtnBusy : s.forgotBtn}
                </button>
                {status === "error" && <p className="login-msg error">{errorMsg}</p>}
              </form>
            )}
            <div className="login-links">
              <button type="button" className="linklike" onClick={() => switchMode("login")}>
                {s.backToLogin}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
