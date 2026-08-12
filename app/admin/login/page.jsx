"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabaseClient";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setErrorMsg(error.message);
      setLoading(false);
      return;
    }

    router.push("/admin");
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
        .card { width: 100%; max-width: 360px; border: 1px solid var(--line); background: var(--bg-raised); padding: 32px; }
        h1 { font-size: 18px; margin: 0 0 20px; }
        label { font-size: 12px; color: var(--accent); display: block; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.08em; }
        input { width: 100%; padding: 11px; background: var(--bg); border: 1px solid var(--line); color: var(--text); margin-bottom: 16px; box-sizing: border-box; font-size: 14px; }
        input:focus { outline: none; border-color: var(--accent); }
        button { width: 100%; padding: 12px; background: var(--accent); color: var(--bg); border: none; font-weight: 600; cursor: pointer; font-size: 14px; }
        button:disabled { opacity: 0.6; }
        .err { color: #E08080; font-size: 13px; margin-top: 12px; }
      `}</style>
      <div className="card">
        <h1>Đăng nhập quản trị OneTools</h1>
        <form onSubmit={handleSubmit}>
          <label htmlFor="email">Email</label>
          <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          <label htmlFor="password">Mật khẩu</label>
          <input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
          <button type="submit" disabled={loading}>{loading ? "Đang đăng nhập..." : "Đăng nhập"}</button>
          {errorMsg && <p className="err">{errorMsg}</p>}
        </form>
      </div>
    </div>
  );
}
