"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";
import { callEdgeFunction } from "../../lib/callEdgeFunction";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState("idle"); // idle | sending | error
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    if (password.length < 6) {
      setStatus("error");
      setErrorMsg("Mật khẩu cần ít nhất 6 ký tự.");
      return;
    }
    if (password !== confirmPassword) {
      setStatus("error");
      setErrorMsg("Mật khẩu nhập lại không khớp.");
      return;
    }

    setStatus("sending");

    const { ok, data } = await callEdgeFunction("sign-up", { email, password });

    if (!ok || data.status !== "ok") {
      setStatus("error");
      setErrorMsg(data.message || "Đăng ký thất bại, vui lòng thử lại.");
      return;
    }

    // Đăng ký xong, server đã trả sẵn access_token/refresh_token — set session luôn,
    // khỏi bắt người dùng đăng nhập lại lần nữa.
    const { error: sessionError } = await supabase.auth.setSession({
      access_token: data.access_token,
      refresh_token: data.refresh_token,
    });

    if (sessionError) {
      // Vẫn tạo tài khoản thành công — chỉ là set session tự động thất bại, cho qua trang login.
      router.push("/login");
      return;
    }

    router.push("/account");
  };

  return (
    <div className="signup-root">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Oswald:wght@600;700&family=JetBrains+Mono:wght@400;500&family=Inter:wght@400;500&display=swap');
        .signup-root {
          --bg: #161512; --bg-raised: #1F1D19; --line: #37342C;
          --text: #F3EFE6; --text-dim: #A79E8C; --accent: #C9A15F;
          min-height: 100vh; background: var(--bg); color: var(--text);
          font-family: 'Inter', sans-serif;
          display: flex; align-items: center; justify-content: center;
          padding: 24px;
        }
        .signup-card {
          width: 100%; max-width: 380px;
          border: 1px solid var(--line); background: var(--bg-raised);
          padding: 36px 32px;
        }
        .signup-title {
          font-family: 'Oswald', sans-serif; text-transform: uppercase;
          font-size: 22px; font-weight: 700; margin: 0 0 8px;
        }
        .signup-sub { font-size: 13.5px; color: var(--text-dim); margin: 0 0 24px; line-height: 1.5; }
        .signup-label {
          font-family: 'JetBrains Mono', monospace; font-size: 11px;
          color: var(--accent); letter-spacing: 0.1em; text-transform: uppercase;
          display: block; margin-bottom: 8px;
        }
        .signup-input {
          width: 100%; padding: 12px 14px; background: var(--bg);
          border: 1px solid var(--line); color: var(--text); font-size: 14px;
          margin-bottom: 18px; box-sizing: border-box;
        }
        .signup-input:focus { outline: none; border-color: var(--accent); }
        .signup-hint { font-size: 11.5px; color: var(--text-dim); margin: -12px 0 18px; }
        .signup-btn {
          width: 100%; padding: 13px; background: var(--accent); color: var(--bg);
          border: none; font-family: 'JetBrains Mono', monospace; font-weight: 600;
          font-size: 14px; cursor: pointer;
        }
        .signup-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .signup-msg { font-size: 13px; margin-top: 16px; line-height: 1.5; }
        .signup-msg.error { color: #E08080; }
        .signup-links { margin-top: 16px; font-size: 12.5px; text-align: center; }
        .signup-links a { color: var(--text-dim); text-decoration: none; }
        .signup-links a:hover { color: var(--accent); }
      `}</style>
      <div className="signup-card">
        <h1 className="signup-title">Đăng ký OneTools</h1>
        <p className="signup-sub">
          Tạo tài khoản để dùng thử miễn phí 15 ngày, hoặc kích hoạt license đã mua.
        </p>
        <form onSubmit={handleSubmit}>
          <label className="signup-label" htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            required
            className="signup-input"
            placeholder="ban@congty.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <label className="signup-label" htmlFor="password">Mật khẩu</label>
          <input
            id="password"
            type="password"
            required
            className="signup-input"
            placeholder="Tối thiểu 6 ký tự"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <label className="signup-label" htmlFor="confirm-password">Nhập lại mật khẩu</label>
          <input
            id="confirm-password"
            type="password"
            required
            className="signup-input"
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
          <button className="signup-btn" type="submit" disabled={status === "sending"}>
            {status === "sending" ? "Đang đăng ký..." : "Đăng ký"}
          </button>
          {status === "error" && <p className="signup-msg error">{errorMsg}</p>}
        </form>
        <div className="signup-links">
          <Link href="/login">Đã có tài khoản? Đăng nhập</Link>
        </div>
      </div>
    </div>
  );
}
