"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";

// Trang này là đích đến của link "Đặt lại mật khẩu" trong email Supabase gửi (Site URL +
// /reset-password đã được thêm vào Auth → URL Configuration → Redirect URLs).
//
// Khi bấm vào link, Supabase xác thực token rồi redirect về đây kèm access_token/refresh_token
// trong URL (dạng #access_token=...&type=recovery...) — supabase-js tự đọc phần này khi khởi tạo
// (detectSessionInUrl mặc định bật) và bắn sự kiện "PASSWORD_RECOVERY". Trang chỉ cần lắng nghe sự
// kiện đó (và tự kiểm tra thêm URL hash phòng trường hợp sự kiện bắn ra trước khi kịp lắng nghe) để
// biết lúc nào được phép hiện form đặt mật khẩu mới.
export default function ResetPasswordPage() {
  const router = useRouter();
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

    // Nếu sau 3s vẫn chưa xác định được (không có hash hợp lệ, không có sự kiện) → coi như link
    // không hợp lệ / đã hết hạn, tránh giữ người dùng mãi ở màn hình "đang kiểm tra".
    const timeout = setTimeout(() => {
      setPhase((current) => (current === "checking" ? "invalid" : current));
    }, 3000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

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
          padding: 24px;
        }
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
      <div className="reset-card">
        {phase === "checking" && (
          <>
            <h1 className="reset-title">Đang kiểm tra link...</h1>
            <p className="reset-sub">Vui lòng đợi trong giây lát.</p>
          </>
        )}

        {phase === "invalid" && (
          <>
            <h1 className="reset-title">Link không hợp lệ</h1>
            <p className="reset-sub">
              Link đặt lại mật khẩu đã hết hạn hoặc không còn hiệu lực. Vui lòng yêu cầu gửi lại từ
              trang đăng nhập.
            </p>
            <div className="reset-links">
              <a href="/login">← Quay lại đăng nhập</a>
            </div>
          </>
        )}

        {phase === "ready" && (
          <>
            <h1 className="reset-title">Đặt mật khẩu mới</h1>
            <p className="reset-sub">Nhập mật khẩu mới cho tài khoản OneTools của bạn.</p>
            <form onSubmit={handleSubmit}>
              <label className="reset-label" htmlFor="password">Mật khẩu mới</label>
              <input
                id="password"
                type="password"
                required
                className="reset-input"
                placeholder="Tối thiểu 6 ký tự"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <label className="reset-label" htmlFor="confirm-password">Nhập lại mật khẩu</label>
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
                {status === "saving" ? "Đang lưu..." : "Lưu mật khẩu mới"}
              </button>
              {status === "error" && <p className="reset-msg error">{errorMsg}</p>}
            </form>
          </>
        )}

        {phase === "done" && (
          <>
            <h1 className="reset-title">Thành công</h1>
            <p className="reset-msg success">
              Mật khẩu đã được cập nhật. Bạn có thể đăng nhập lại bằng mật khẩu mới.
            </p>
            <button className="reset-btn" style={{ marginTop: 16 }} onClick={() => router.push("/login")}>
              Đến trang đăng nhập
            </button>
          </>
        )}
      </div>
    </div>
  );
}
