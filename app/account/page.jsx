"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "../../lib/supabaseClient";
import { callEdgeFunction } from "../../lib/callEdgeFunction";
import { useLang } from "../../lib/useLang";

const STR = {
  vi: {
    backHome: "← Trang chủ",
    pageTitle: "Tài khoản OneTools",
    logout: "Đăng xuất",
    currentLicense: "License hiện tại",
    status: "Trạng thái",
    licenseType: "Loại license",
    expires: "Hết hạn",
    licenseKey: "License Key",
    maxSeats: "Số máy tối đa",
    noLicense:
      "Tài khoản chưa có License nào còn hiệu lực. Nếu bạn đã mua license, dùng ô bên dưới để nhập License Key.",
    devices: (used, max) => `Máy đã kích hoạt (${used}/${max})`,
    noActiveLicenseForDevices: "Chưa có License nào đang hoạt động.",
    noDevices: "Chưa có máy nào kích hoạt License này.",
    device: (n, hwid) => `Máy ${n} — ${hwid}`,
    deviceMeta: (bound, lastSeen) => `Kích hoạt: ${bound} · Hoạt động gần nhất: ${lastSeen}`,
    enterKey: "Nhập License Key",
    keyPlaceholder: "Dán License Key vào đây",
    activateBtn: "Kích hoạt",
    activateBtnBusy: "Đang xử lý...",
    claimSuccess: "Đã gắn License Key vào tài khoản.",
    claimErrGeneric: "Không nhận được License Key, vui lòng kiểm tra lại.",
    otherLicenses: "Lịch sử License khác",
    loading: "Đang tải...",
    statusLabel: { active: "Đang hoạt động", trial: "Dùng thử", expired: "Đã hết hạn" },
  },
  en: {
    backHome: "← Home",
    pageTitle: "OneTools Account",
    logout: "Log out",
    currentLicense: "Current License",
    status: "Status",
    licenseType: "License type",
    expires: "Expires",
    licenseKey: "License Key",
    maxSeats: "Max devices",
    noLicense:
      "Your account doesn't have an active license yet. If you've purchased one, use the box below to enter your License Key.",
    devices: (used, max) => `Activated devices (${used}/${max})`,
    noActiveLicenseForDevices: "No active license yet.",
    noDevices: "No devices have activated this license yet.",
    device: (n, hwid) => `Device ${n} — ${hwid}`,
    deviceMeta: (bound, lastSeen) => `Activated: ${bound} · Last seen: ${lastSeen}`,
    enterKey: "Enter License Key",
    keyPlaceholder: "Paste your License Key here",
    activateBtn: "Activate",
    activateBtnBusy: "Processing...",
    claimSuccess: "License Key linked to your account.",
    claimErrGeneric: "Couldn't activate this License Key, please check it and try again.",
    otherLicenses: "Other licenses",
    loading: "Loading...",
    statusLabel: { active: "Active", trial: "Trial", expired: "Expired" },
  },
};

const TYPE_LABEL = {
  trial: "Trial",
  pro: "Pro",
  business: "Business",
  lifetime: "Lifetime",
  dev_preview: "Dev Preview",
};

// Message lỗi từ server (Edge Function claim-license-key) luôn trả tiếng Việt cố định. Cách chắc chắn
// nhất là server trả kèm 1 "code" cố định không đổi theo ngôn ngữ (cần cập nhật Edge Function
// `claim-license-key`, xem claude/WebAuthSync_progress_notes.md). Trong lúc chờ, vẫn fallback dò theo
// nội dung tiếng Việt để không bị mất bản dịch.
const CLAIM_ERROR_CODE_EN = {
  LICENSE_KEY_NOT_FOUND: "This License Key doesn't exist.",
  LICENSE_KEY_TAKEN: "This License Key already belongs to another account.",
};

function translateServerMessage(data, lang) {
  const message = data?.message;
  if (lang !== "en" || !message) return message;
  if (data?.code && CLAIM_ERROR_CODE_EN[data.code]) return CLAIM_ERROR_CODE_EN[data.code];
  if (message.includes("không tồn tại")) return CLAIM_ERROR_CODE_EN.LICENSE_KEY_NOT_FOUND;
  if (message.includes("đã thuộc về một tài khoản khác")) return CLAIM_ERROR_CODE_EN.LICENSE_KEY_TAKEN;
  return message;
}

function formatDate(value, lang) {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleString(lang === "vi" ? "vi-VN" : "en-US", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return value;
  }
}

function pickCurrentLicense(licenses) {
  const now = new Date();
  const active = licenses.find((l) => l.status === "active" && new Date(l.expires_at) > now);
  if (active) return active;
  const trial = licenses.find((l) => l.status === "trial" && new Date(l.expires_at) > now);
  if (trial) return trial;
  return null;
}

export default function AccountPage() {
  const router = useRouter();
  const { lang, setLang, mounted: langMounted } = useLang();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [licenses, setLicenses] = useState([]);
  const [seats, setSeats] = useState([]);
  const [errorMsg, setErrorMsg] = useState("");

  const [licenseKeyInput, setLicenseKeyInput] = useState("");
  const [claimStatus, setClaimStatus] = useState("idle"); // idle | sending | error | success
  const [claimMsg, setClaimMsg] = useState("");

  const loadData = useCallback(async () => {
    setErrorMsg("");

    const { data: sessionData } = await supabase.auth.getSession();
    const session = sessionData?.session;

    if (!session) {
      router.push("/login");
      return;
    }

    setUser(session.user);

    const { data: licenseRows, error: licenseError } = await supabase
      .from("licenses")
      .select("*")
      .eq("owner_user_id", session.user.id)
      .order("created_at", { ascending: false });

    if (licenseError) {
      setErrorMsg(licenseError.message);
      setLoading(false);
      return;
    }

    setLicenses(licenseRows || []);

    const current = pickCurrentLicense(licenseRows || []);
    if (current) {
      const { data: seatRows, error: seatError } = await supabase
        .from("license_seats")
        .select("*")
        .eq("license_id", current.id)
        .order("last_seen_at", { ascending: false });

      if (!seatError) {
        setSeats(seatRows || []);
      }
    } else {
      setSeats([]);
    }

    setLoading(false);
  }, [router]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (!langMounted) return null;
  const s = STR[lang];

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const handleClaim = async (e) => {
    e.preventDefault();
    setClaimMsg("");

    if (!licenseKeyInput.trim()) return;

    setClaimStatus("sending");

    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData?.session?.access_token;

    const { ok, data } = await callEdgeFunction(
      "claim-license-key",
      { license_key: licenseKeyInput.trim() },
      accessToken
    );

    if (!ok || data.status !== "ok") {
      setClaimStatus("error");
      setClaimMsg(translateServerMessage(data, lang) || s.claimErrGeneric);
      return;
    }

    setClaimStatus("success");
    setClaimMsg(s.claimSuccess);
    setLicenseKeyInput("");
    setLoading(true);
    await loadData();
  };

  const current = pickCurrentLicense(licenses);
  const otherLicenses = licenses.filter((l) => !current || l.id !== current.id);

  return (
    <div className="acc-root">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Oswald:wght@600;700&family=JetBrains+Mono:wght@400;500&family=Inter:wght@400;500&display=swap');
        .acc-root {
          --bg: #161512; --bg-raised: #1F1D19; --line: #37342C;
          --text: #F3EFE6; --text-dim: #A79E8C; --accent: #C9A15F;
          --ok: #7FBF7F; --warn: #E0C070; --error: #E08080;
          min-height: 100vh; background: var(--bg); color: var(--text);
          font-family: 'Inter', sans-serif;
          padding: 40px 24px 80px;
          overflow-x: hidden;
        }
        /* Reset box-sizing cho toàn bộ trang — THIẾU dòng này là nguyên nhân bị tràn ngang trên mobile
           (user phản ánh 2026-10-08: "chạy lung tung khi lướt, phải zoom nhỏ mới cố định"): padding +
           width mặc định (content-box) cộng dồn làm vài phần tử rộng hơn màn hình thật. */
        .acc-root, .acc-root *, .acc-root *::before, .acc-root *::after { box-sizing: border-box; }
        .acc-shell { max-width: 900px; margin: 0 auto; width: 100%; }
        .acc-back {
          display: inline-block; color: var(--text-dim); text-decoration: none;
          font-size: 14px; margin-bottom: 18px;
        }
        .acc-back:hover { color: var(--accent); }
        .acc-header {
          display: flex; justify-content: space-between; align-items: center;
          margin-bottom: 28px; flex-wrap: wrap; gap: 12px;
        }
        .acc-header-left { display: flex; align-items: center; gap: 14px; flex-wrap: wrap; min-width: 0; }
        .acc-title {
          font-family: 'Oswald', sans-serif; text-transform: uppercase;
          font-size: 28px; font-weight: 700; margin: 0;
        }
        .acc-email { font-size: 13px; color: var(--text-dim); margin-top: 4px; word-break: break-all; }
        .acc-header-right { display: flex; align-items: center; gap: 10px; }
        .acc-lang {
          display: inline-flex; border: 1px solid var(--line); font-size: 12px;
        }
        .acc-lang button {
          padding: 5px 10px; background: transparent; border: none;
          color: var(--text-dim); cursor: pointer; letter-spacing: 0.04em;
          font-family: 'Inter', -apple-system, sans-serif;
        }
        .acc-lang button.active { background: var(--accent); color: var(--bg); }
        .acc-logout {
          background: none; border: 1px solid var(--line); color: var(--text-dim);
          padding: 9px 16px; font-size: 13px; cursor: pointer;
          font-family: 'JetBrains Mono', monospace;
        }
        .acc-logout:hover { border-color: var(--accent); color: var(--accent); }
        .acc-card {
          border: 1px solid var(--line); background: var(--bg-raised);
          padding: 32px 36px; margin-bottom: 22px;
        }
        .acc-card-title {
          font-family: 'JetBrains Mono', monospace; font-size: 12px;
          color: var(--accent); letter-spacing: 0.1em; text-transform: uppercase;
          margin: 0 0 18px;
        }
        .acc-badge {
          display: inline-block; padding: 3px 10px; font-size: 11.5px;
          font-family: 'JetBrains Mono', monospace; text-transform: uppercase;
          border: 1px solid var(--line); border-radius: 2px;
        }
        .acc-badge.active { color: var(--ok); border-color: var(--ok); }
        .acc-badge.trial { color: var(--warn); border-color: var(--warn); }
        .acc-badge.expired { color: var(--error); border-color: var(--error); }
        .acc-row {
          display: flex; justify-content: space-between; gap: 12px;
          padding: 10px 0; border-bottom: 1px solid var(--line); font-size: 14.5px;
        }
        .acc-row:last-child { border-bottom: none; }
        .acc-row-label { color: var(--text-dim); flex-shrink: 0; }
        /* min-width: 0 là chỗ mấu chốt — mặc định 1 item trong flex row KHÔNG tự co nhỏ hơn độ rộng
           nội dung của nó (vd License Key dài không dấu cách), nên "word-break: break-all" không có
           tác dụng và cả hàng bị tràn ra ngoài màn hình (đúng lỗi user báo trên mobile). */
        .acc-row-value { text-align: right; word-break: break-all; min-width: 0; }
        .acc-empty { font-size: 13.5px; color: var(--text-dim); line-height: 1.6; }
        .acc-seat {
          padding: 10px 0; border-bottom: 1px solid var(--line); font-size: 13px;
        }
        .acc-seat:last-child { border-bottom: none; }
        .acc-seat-hwid {
          font-family: 'JetBrains Mono', monospace; font-size: 12px; color: var(--text);
          word-break: break-all;
        }
        .acc-seat-meta { color: var(--text-dim); font-size: 12px; margin-top: 2px; }
        .acc-form { display: flex; gap: 10px; flex-wrap: wrap; }
        .acc-input {
          flex: 1; min-width: 200px; padding: 11px 14px; background: var(--bg);
          border: 1px solid var(--line); color: var(--text); font-size: 14px;
          font-family: 'JetBrains Mono', monospace;
        }
        .acc-input:focus { outline: none; border-color: var(--accent); }
        .acc-btn {
          padding: 11px 20px; background: var(--accent); color: var(--bg);
          border: none; font-family: 'JetBrains Mono', monospace; font-weight: 600;
          font-size: 13.5px; cursor: pointer; white-space: nowrap;
        }
        .acc-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .acc-msg { font-size: 13px; margin-top: 12px; line-height: 1.5; }
        .acc-msg.success { color: var(--ok); }
        .acc-msg.error { color: var(--error); }
        .acc-history-item {
          display: flex; justify-content: space-between; align-items: center;
          padding: 8px 0; border-bottom: 1px solid var(--line); font-size: 13px;
          gap: 10px; flex-wrap: wrap;
        }
        .acc-history-item:last-child { border-bottom: none; }
        .acc-history-key { min-width: 0; word-break: break-all; }
        .acc-loading, .acc-error { text-align: center; padding: 60px 20px; color: var(--text-dim); }

        @media (max-width: 480px) {
          .acc-root { padding: 28px 16px 60px; }
          .acc-card { padding: 22px 18px; }
          .acc-title { font-size: 22px; }
          .acc-form { flex-direction: column; }
          .acc-input { min-width: 0; width: 100%; }
          .acc-btn { width: 100%; }
        }
      `}</style>

      <div className="acc-shell">
        <Link href="/" className="acc-back">{s.backHome}</Link>
        <div className="acc-header">
          <div className="acc-header-left">
            <div>
              <h1 className="acc-title">{s.pageTitle}</h1>
              {user && <p className="acc-email">{user.email}</p>}
            </div>
          </div>
          <div className="acc-header-right">
            <div className="acc-lang">
              <button className={lang === "vi" ? "active" : ""} onClick={() => setLang("vi")}>VI</button>
              <button className={lang === "en" ? "active" : ""} onClick={() => setLang("en")}>EN</button>
            </div>
            {user && <button className="acc-logout" onClick={handleLogout}>{s.logout}</button>}
          </div>
        </div>

        {loading ? (
          <div className="acc-loading">{s.loading}</div>
        ) : errorMsg ? (
          <div className="acc-error">{errorMsg}</div>
        ) : (
          <>
            <div className="acc-card">
              <p className="acc-card-title">{s.currentLicense}</p>
              {current ? (
                <>
                  <div className="acc-row">
                    <span className="acc-row-label">{s.status}</span>
                    <span className="acc-row-value">
                      <span className={`acc-badge ${current.status}`}>
                        {s.statusLabel[current.status] || current.status}
                      </span>
                    </span>
                  </div>
                  <div className="acc-row">
                    <span className="acc-row-label">{s.licenseType}</span>
                    <span className="acc-row-value">
                      {TYPE_LABEL[current.license_type] || current.license_type || "—"}
                    </span>
                  </div>
                  <div className="acc-row">
                    <span className="acc-row-label">{s.expires}</span>
                    <span className="acc-row-value">{formatDate(current.expires_at, lang)}</span>
                  </div>
                  <div className="acc-row">
                    <span className="acc-row-label">{s.licenseKey}</span>
                    <span className="acc-row-value">{current.license_key}</span>
                  </div>
                  <div className="acc-row">
                    <span className="acc-row-label">{s.maxSeats}</span>
                    <span className="acc-row-value">{current.max_seats}</span>
                  </div>
                </>
              ) : (
                <p className="acc-empty">{s.noLicense}</p>
              )}
            </div>

            <div className="acc-card">
              <p className="acc-card-title">
                {current ? s.devices(seats.length, current.max_seats) : s.devices(0, 0)}
              </p>
              {!current ? (
                <p className="acc-empty">{s.noActiveLicenseForDevices}</p>
              ) : seats.length === 0 ? (
                <p className="acc-empty">{s.noDevices}</p>
              ) : (
                seats.map((seat, index) => (
                  <div className="acc-seat" key={seat.id}>
                    <div className="acc-seat-hwid">{s.device(index + 1, seat.device_hwid)}</div>
                    <div className="acc-seat-meta">
                      {s.deviceMeta(formatDate(seat.bound_at, lang), formatDate(seat.last_seen_at, lang))}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="acc-card">
              <p className="acc-card-title">{s.enterKey}</p>
              <form className="acc-form" onSubmit={handleClaim}>
                <input
                  className="acc-input"
                  placeholder={s.keyPlaceholder}
                  value={licenseKeyInput}
                  onChange={(e) => setLicenseKeyInput(e.target.value)}
                />
                <button className="acc-btn" type="submit" disabled={claimStatus === "sending"}>
                  {claimStatus === "sending" ? s.activateBtnBusy : s.activateBtn}
                </button>
              </form>
              {claimStatus === "error" && <p className="acc-msg error">{claimMsg}</p>}
              {claimStatus === "success" && <p className="acc-msg success">{claimMsg}</p>}
            </div>

            {otherLicenses.length > 0 && (
              <div className="acc-card">
                <p className="acc-card-title">{s.otherLicenses}</p>
                {otherLicenses.map((l) => (
                  <div className="acc-history-item" key={l.id}>
                    <span className="acc-history-key">{TYPE_LABEL[l.license_type] || l.license_type} · {l.license_key}</span>
                    <span className={`acc-badge ${l.status}`}>
                      {s.statusLabel[l.status] || l.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
