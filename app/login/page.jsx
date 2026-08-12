"use client";

import { useState } from "react";
import { supabase } from "../../lib/supabaseClient";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle"); // idle | sending | sent | error
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("sending");
    setErrorMsg("");

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo:
          typeof window !== "undefined" ? window.location.origin : undefined,
      },
    });

    if (error) {
      setStatus("error");
      setErrorMsg(error.message);
    } else {
      setStatus("sent");
    }
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
        .login-sub { font-size: 13.5px; color: var(--text-dim); margin: 0 0 24px; }
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
      `}</style>
      <div className="login-card">
        <h1 className="login-title">Đăng nhập OneTools</h1>
        <p className="login-sub">
          Nhập email đã đăng ký license — hệ thống sẽ gửi 1 đường link đăng nhập, không cần mật khẩu.
        </p>
        {status === "sent" ? (
          <p className="login-msg success">
            Đã gửi link đăng nhập tới <strong>{email}</strong>. Anh mở email và bấm vào link đó để tiếp tục.
          </p>
        ) : (
          <form onSubmit={handleSubmit}>
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
            <button className="login-btn" type="submit" disabled={status === "sending"}>
              {status === "sending" ? "Đang gửi..." : "Gửi link đăng nhập"}
            </button>
            {status === "error" && <p className="login-msg error">{errorMsg}</p>}
          </form>
        )}
      </div>
    </div>
  );
}
