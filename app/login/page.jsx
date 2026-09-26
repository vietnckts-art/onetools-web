"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";

function mapErrorMessage(message) {
  if (!message) return "Có lỗi xảy ra, vui lòng thử lại.";
  if (message.includes("Invalid login credentials")) {
    return "Email hoặc mật khẩu không đúng.";
  }
  if (message.includes("Email not confirmed")) {
    return "Email chưa được xác nhận. Vui lòng liên hệ support@onetools-bim.com.";
  }
  return message;
}

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState("login"); // login | forgot
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("idle"); // idle | sending | sent | error
  const [errorMsg, setErrorMsg] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setStatus("sending");
    setErrorMsg("");

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setStatus("error");
      setErrorMsg(mapErrorMessage(error.message));
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
      setErrorMsg(mapErrorMessage(error.message));
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
          padding: 24px;
        }
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
      <div className="login-card">
        {mode === "login" ? (
          <>
            <h1 className="login-title">Đăng nhập OneTools</h1>
            <p className="login-sub">Nhập email và mật khẩu đã đăng ký license.</p>
            <form onSubmit={handleLogin}>
              <label className="login-label" htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                required
                className="login-input"
                placeholder="ban@congty.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <label className="login-label" htmlFor="password">Mật khẩu</label>
              <input
                id="password"
                type="password"
                required
                className="login-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button className="login-btn" type="submit" disabled={status === "sending"}>
                {status === "sending" ? "Đang đăng nhập..." : "Đăng nhập"}
              </button>
              {status === "error" && <p className="login-msg error">{errorMsg}</p>}
            </form>
            <div className="login-links">
              <button type="button" className="linklike" onClick={() => switchMode("forgot")}>
                Quên mật khẩu?
              </button>
              <Link href="/signup">Chưa có tài khoản? Đăng ký</Link>
            </div>
          </>
        ) : (
          <>
            <h1 className="login-title">Quên mật khẩu</h1>
            <p className="login-sub">
              Nhập email tài khoản — hệ thống sẽ gửi link đặt lại mật khẩu.
            </p>
            {status === "sent" ? (
              <p className="login-msg success">
                Đã gửi email đặt lại mật khẩu tới <strong>{email}</strong>. Vui lòng kiểm tra hộp thư.
              </p>
            ) : (
              <form onSubmit={handleForgotPassword}>
                <label className="login-label" htmlFor="forgot-email">Email</label>
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
                  {status === "sending" ? "Đang gửi..." : "Gửi email đặt lại mật khẩu"}
                </button>
                {status === "error" && <p className="login-msg error">{errorMsg}</p>}
              </form>
            )}
            <div className="login-links">
              <button type="button" className="linklike" onClick={() => switchMode("login")}>
                ← Quay lại đăng nhập
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
