"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";
import { useLang } from "../../lib/useLang";

const STR = {
  vi: {
    checkingTitle: "Đang kiểm tra link...",
    checkingSub: "Vui lòng đợi trong giây lát.",
    invalidTitle: "Link không hợp lệ",
    invalidSub:
      "Link đặt lại mật khẩu đã hết hạn hoặc không còn hiệu lực. Vui lòng yêu cầu gửi lại từ trang đăng nhập.",
    backToLogin: "← Quay lại đăng nhập",
    readyTitle: "Đặt mật khẩu mới",
    readySub: "Nhập mật khẩu mới cho tài khoản OneTools của bạn.",
    newPassword: "Mật khẩu mới",
    passwordPlaceholder: "Tối thiểu 6 ký tự",
    confirmPassword: "Nhập lại mật khẩu",
    saveBtn: "Lưu mật khẩu mới",
    saveBtnBusy: "Đang lưu...",
    doneTitle: "Thành công",
    doneMsg: "Mật khẩu đã được cập nhật. Bạn có thể đăng nhập lại bằng mật khẩu mới.",
    goToLogin: "Đến trang đăng nhập",
    errShort: "Mật khẩu cần ít nhất 6 ký tự.",
    errMismatch: "Mật khẩu nhập lại không khớp.",
  },
  en: {
    checkingTitle: "Checking link...",
    checkingSub: "Please wait a moment.",
    invalidTitle: "Invalid link",
    invalidSub:
      "This password reset link has expired or is no longer valid. Please request a new one from the login page.",
    backToLogin: "← Back to login",
    readyTitle: "Set a new password",
    readySub: "Enter a new password for your OneTools account.",
    newPassword: "New password",
    passwordPlaceholder: "At least 6 characters",
    confirmPassword: "Confirm password",
    saveBtn: "Save new password",
    saveBtnBusy: "Saving...",
    doneTitle: "Success",
    doneMsg: "Your password has been updated. You can now log in with your new password.",
    goToLogin: "Go to login",
    errShort: "Password must be at least 6 characters.",
    errMismatch: "Passwords do not match.",
  },
};

export default function ResetPasswordPage() {
  const router = useRouter();
  const { lang, setLang, mounted: langMounted } = useLang();
  const [phase, setPhase] = useState("checking"); // checking | ready | invalid | done
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState("idle"); // idle | saving | error
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const hash = typeof window !== "undefined" ? window.location.hash : "";

    if (hash.includes("error=")) {
      setPhase("invalid");
      return;
    }
    if (hash.includes("type=recovery")) {
      setPhase("ready");
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setPhase("ready");
      }
    });

    const timeout = setTimeout(() => {
      setPhase((current) => (current === "checking" ? "invalid" : current));
    }, 3000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  if (!langMounted) return null;
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

    setStatus("saving");
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setStatus("error");
      setErrorMsg(error.message);
      return;
    }

    setPhase("done");
  };

  return (
    <div className="reset-root">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Oswald:wght@600;700&family=JetBrains+Mono:wght@400;500&family=Inter:wght@400;500&display=swap');
        .reset-root {
          --bg: #161512; --bg-raised: #1F1D19; --line: #37342C;
          --text: #F3EFE6; --text-dim: #A79E8C; --accent: #C9A15F;
          min-height: 100vh; background: var(--bg); color: var(--text);
          font-family: 'Inter', sans-serif;
          display: flex; align-items: center; justify-content: center;
          padding: 24px; position: relative;
        }
        .reset-lang {
          position: absolute; top: 20px; right: 20px;
          display: inline-flex; border: 1px solid var(--line); font-size: 12px;
        }
        .reset-lang button {
          padding: 5px 10px; background: transparent; border: none;
          color: var(--text-dim); cursor: pointer; letter-spacing: 0.04em;
          font-family: 'Inter', -apple-system, sans-serif;
        }
        .reset-lang button.active { background: var(--accent); color: var(--bg); }
        .reset-card {
          width: 100%; max-width: 380px;
          border: 1px solid var(--line); background: var(--bg-raised);
          padding: 36px 32px;
        }
        .reset-title {
          font-family: 'Oswald', sans-serif; text-transform: uppercase;
          font-size: 22px; font-weight: 700; margin: 0 0 8px;
        }
        .reset-sub { font-size: 13.5px; color: var(--text-dim); margin: 0 0 24px; line-height: 1.5; }
        .reset-label {
          font-family: 'JetBrains Mono', monospace; font-size: 11px;
          color: var(--accent); letter-spacing: 0.1em; text-transform: uppercase;
          display: block; margin-bottom: 8px;
        }
        .reset-input {
          width: 100%; padding: 12px 14px; background: var(--bg);
          border: 1px solid var(--line); color: var(--text); font-size: 14px;
          margin-bottom: 18px; box-sizing: border-box;
        }
        .reset-input:focus { outline: none; border-color: var(--accent); }
        .reset-btn {
          width: 100%; padding: 13px; background: var(--accent); color: var(--bg);
          border: none; font-family: 'JetBrains Mono', monospace; font-weight: 600;
          font-size: 14px; cursor: pointer;
        }
        .reset-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .reset-msg { font-size: 13px; margin-top: 16px; line-height: 1.5; }
        .reset-msg.success { color: #7FBF7F; }
        .reset-msg.error { color: #E08080; }
        .reset-links { margin-top: 16px; font-size: 12.5px; text-align: center; }
        .reset-links a { color: var(--text-dim); text-decoration: none; }
        .reset-links a:hover { color: var(--accent); }
      `}</style>

      <div className="reset-lang">
        <button className={lang === "vi" ? "active" : ""} onClick={() => setLang("vi")}>VI</button>
        <button className={lang === "en" ? "active" : ""} onClick={() => setLang("en")}>EN</button>
      </div>

      <div className="reset-card">
        {phase === "checking" && (
          <>
            <h1 className="reset-title">{s.checkingTitle}</h1>
            <p className="reset-sub">{s.checkingSub}</p>
          </>
        )}

        {phase === "invalid" && (
          <>
            <h1 className="reset-title">{s.invalidTitle}</h1>
            <p className="reset-sub">{s.invalidSub}</p>
            <div className="reset-links">
              <a href="/login">{s.backToLogin}</a>
            </div>
          </>
        )}

        {phase === "ready" && (
          <>
            <h1 className="reset-title">{s.readyTitle}</h1>
            <p className="reset-sub">{s.readySub}</p>
            <form onSubmit={handleSubmit}>
              <label className="reset-label" htmlFor="password">{s.newPassword}</label>
              <input
                id="password"
                type="password"
                required
                className="reset-input"
                placeholder={s.passwordPlaceholder}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <label className="reset-label" htmlFor="confirm-password">{s.confirmPassword}</label>
              <input
                id="confirm-password"
                type="password"
                required
                className="reset-input"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              <button className="reset-btn" type="submit" disabled={status === "saving"}>
                {status === "saving" ? s.saveBtnBusy : s.saveBtn}
              </button>
              {status === "error" && <p className="reset-msg error">{errorMsg}</p>}
            </form>
          </>
        )}

        {phase === "done" && (
          <>
            <h1 className="reset-title">{s.doneTitle}</h1>
            <p className="reset-msg success">{s.doneMsg}</p>
            <button className="reset-btn" style={{ marginTop: 16 }} onClick={() => router.push("/login")}>
              {s.goToLogin}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
