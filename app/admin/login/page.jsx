"use client";

import { useState } from "react";
import { supabase } from "../../../lib/supabaseClient";

export default function AdminLoginPage() {
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
        // Sau khi bấm link trong email, đưa thẳng về trang /admin thay vì trang chủ
        emailRedirectTo:
          typeof window !== "undefined" ? `${window.location.origin}/admin` : undefined,
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
    <div className="admin-login-root">
      <style>{`
        .admin-login-root {
          --bg: #161512; --bg-raised: #1F1D19; --line: #37342C;
          --text: #F3EFE6; --text-dim: #A79E8C; --accent: #C9A15F;
          min-height: 100vh; background: var(--bg); color: var(--text);
          font-family: -apple-system, sans-serif;
          display: flex; align-items: center; justify-content: center;
          padding: 24px;
        }
        .card { width: 100%; max-width: 380px; border: 1px solid var(--line); background: var(--bg-raised); padding: 32px; }
        h1 { font-size: 18px; margin: 0 0 8px; }
        .sub { font-size: 13px; color: var(--text-dim); margin: 0 0 20px; line-height: 1.5; }
        label { font-size: 12px; color: var(--accent); display: block; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.08em; }
        input { width: 100%; padding: 11px; background: var(--bg); border: 1px solid var(--line); color: var(--text); margin-bottom: 16px; box-sizing: border-box; font-size: 14px; }
        input:focus { outline: none; border-color: var(--accent); }
        button { width: 100%; padding: 12px; background: var(--accent); color: var(--bg); border: none; font-weight: 600; cursor: pointer; font-size: 14px; }
        button:disabled { opacity: 0.6; }
        .msg { font-size: 13px; margin-top: 12px; line-height: 1.5; }
        .msg.success { color: #7FBF7F; }
        .msg.error { color: #E08080; }
      `}</style>
      <div className="card">
        <h1>Đăng nhập quản trị OneTools</h1>
        <p className="sub">
          Dùng đúng email đã được cấp quyền admin — hệ thống gửi 1 link đăng nhập, không cần mật khẩu.
        </p>
        {status === "sent" ? (
          <p className="msg success">
            Đã gửi link đăng nhập tới <strong>{email}</strong>. Mở email và bấm vào link để vào trang quản trị.
          </p>
        ) : (
          <form onSubmit={handleSubmit}>
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <button type="submit" disabled={status === "sending"}>
              {status === "sending" ? "Đang gửi..." : "Gửi link đăng nhập"}
            </button>
            {status === "error" && <p className="msg error">{errorMsg}</p>}
          </form>
        )}
      </div>
    </div>
  );
}
