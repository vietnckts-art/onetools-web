"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";
import { callEdgeFunction } from "../../lib/callEdgeFunction";
import { useLang } from "../../lib/useLang";

const STR = {
  vi: {
    title: "Đăng ký OneTools",
    sub: "Tạo tài khoản để dùng thử miễn phí 15 ngày, hoặc kích hoạt license đã mua.",
    email: "Email",
    password: "Mật khẩu",
    passwordPlaceholder: "Tối thiểu 6 ký tự",
    confirmPassword: "Nhập lại mật khẩu",
    submitBtn: "Đăng ký",
    submitBtnBusy: "Đang đăng ký...",
    haveAccount: "Đã có tài khoản? Đăng nhập",
    errShort: "Mật khẩu cần ít nhất 6 ký tự.",
    errMismatch: "Mật khẩu nhập lại không khớp.",
    errGeneric: "Đăng ký thất bại, vui lòng thử lại.",
  },
  en: {
    title: "Sign up for OneTools",
    sub: "Create an account to start a 15-day free trial, or activate a license you've purchased.",
    email: "Email",
    password: "Password",
    passwordPlaceholder: "At least 6 characters",
    confirmPassword: "Confirm password",
    submitBtn: "Sign up",
    submitBtnBusy: "Signing up...",
    haveAccount: "Already have an account? Log in",
    errShort: "Password must be at least 6 characters.",
    errMismatch: "Passwords do not match.",
    errGeneric: "Sign up failed, please try again.",
  },
};

// Message lỗi từ server (Edge Function) luôn trả tiếng Việt cố định. Cách chắc chắn nhất là server
// trả kèm 1 "code" cố định không đổi theo ngôn ngữ (xem ghi chú trong claude/WebAuthSync_progress_notes.md
// — cần cập nhật Edge Function `sign-up` để thêm field này). Trong lúc chờ, vẫn fallback dò theo nội
// dung tiếng Việt để không bị mất bản dịch.
const ERROR_CODE_EN = {
  EMAIL_ALREADY_EXISTS: "This email already has an account — please log in instead of signing up.",
};

function translateServerMessage(data, lang) {
  const message = data?.message;
  if (lang !== "en" || !message) return message;
  if (data?.code && ERROR_CODE_EN[data.code]) return ERROR_CODE_EN[data.code];
  if (message.includes("đã có tài khoản")) return ERROR_CODE_EN.EMAIL_ALREADY_EXISTS;
  return message;
}

export default function SignupPage() {
  const router = useRouter();
  const { lang, setLang, mounted } = useLang();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState("idle"); // idle | sending | error
  const [errorMsg, setErrorMsg] = useState("");

  if (!mounted) return null;
  const s = STR[lang];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    if (password.length < 6) {
      setStatus("error");
      setErrorMsg(s.errShort);
      return;
    }
    if (password !== confirmPassword) {
      setStatus("error");
      setErrorMsg(s.errMismatch);
      return;
    }

    setStatus("sending");

    const { ok, data } = await callEdgeFunction("sign-up", { email, password });

    if (!ok || data.status !== "ok") {
      setStatus("error");
      setErrorMsg(translateServerMessage(data, lang) || s.errGeneric);
      return;
    }

    const { error: sessionError } = await supabase.auth.setSession({
      access_token: data.access_token,
      refresh_token: data.refresh_token,
    });

    if (sessionError) {
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
          padding: 24px; position: relative;
        }
        .signup-lang {
          position: absolute; top: 20px; right: 20px;
          display: inline-flex; border: 1px solid var(--line); font-size: 12px;
        }
        .signup-lang button {
          padding: 5px 10px; background: transparent; border: none;
          color: var(--text-dim); cursor: pointer; letter-spacing: 0.04em;
          font-family: 'Inter', -apple-system, sans-serif;
        }
        .signup-lang button.active { background: var(--accent); color: var(--bg); }
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
      <div className="signup-lang">
        <button className={lang === "vi" ? "active" : ""} onClick={() => setLang("vi")}>VI</button>
        <button className={lang === "en" ? "active" : ""} onClick={() => setLang("en")}>EN</button>
      </div>
      <div className="signup-card">
        <h1 className="signup-title">{s.title}</h1>
        <p className="signup-sub">{s.sub}</p>
        <form onSubmit={handleSubmit}>
          <label className="signup-label" htmlFor="email">{s.email}</label>
          <input
            id="email"
            type="email"
            required
            className="signup-input"
            placeholder="ban@congty.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <label className="signup-label" htmlFor="password">{s.password}</label>
          <input
            id="password"
            type="password"
            required
            className="signup-input"
            placeholder={s.passwordPlaceholder}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <label className="signup-label" htmlFor="confirm-password">{s.confirmPassword}</label>
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
            {status === "sending" ? s.submitBtnBusy : s.submitBtn}
          </button>
          {status === "error" && <p className="signup-msg error">{errorMsg}</p>}
        </form>
        <div className="signup-links">
          <Link href="/login">{s.haveAccount}</Link>
        </div>
      </div>
    </div>
  );
}
