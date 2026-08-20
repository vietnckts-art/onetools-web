"use client";

import React, { useState, useEffect, useRef, createContext, useContext } from "react";
import Link from "next/link";
import { supabase } from "../lib/supabaseClient";


// =====================================================================
// I18N — dictionary song ngữ VI / EN
// =====================================================================
const DICT = {
  vi: {
    nav: { tools: "Video hướng dẫn", pricing: "Bảng giá", docs: "Liên hệ", login: "Đăng nhập" },
    hero: {
      eyebrow: "Add-in cho Revit | BIM",
      titleAccent: "MỘT CÔNG CỤ",
      titleWhite: "MỌI GIẢI PHÁP",
      desc: "OneTools - bộ giải pháp tất cả trong một, tự động hóa từ những chi tiết nhỏ nhất đến quy trình triển khai phức tạp. Giải phóng bạn khỏi công việc lặp lại nhàm chán để tập trung hoàn toàn vào thiết kế.",
      ctaPrimary: "Xem gói đăng ký",
      ctaGhost: "Xem video hướng dẫn",
    },
    download: {
      title: "Tải OneTools Setup",
      sub: "v1.4.2 · Windows x64 · 18.3 MB",
      btn: "Tải về",
      revitLabel: "Revit",
      revitValue: "2025 · 2026 · 2027",
      updatedLabel: "Cập nhật",
      updatedValue: "05/08/2026",
      licenseLabel: "Giấy phép",
      licenseValue: "Dùng thử 15 ngày",
      guideLink: "Hướng dẫn cài đặt →",
    },
    stats: [
      { num: "50", label: "Công cụ đang hoạt động" },
      { num: "2025.2026.2027", label: "Phiên bản Revit hỗ trợ" },
      { num: "VI / EN", label: "Giao diện song ngữ" },
      { num: "24h", label: "Thời gian phản hồi hỗ trợ" },
    ],
    tools: {
      tag: "Hướng dẫn sử dụng",
      title: "Video demo từng công cụ",
      desc: "Mỗi tool có 1 video ngắn hướng dẫn thao tác thực tế trên mặt bằng công trình.",
      watchLabel: (name) => `Xem video ${name}`,
    },
    pricing: {
      tag: "Đăng ký",
      title: "Chọn gói phù hợp",
      billingYear: "Theo năm",
      billingMonth: "Theo tháng",
      contactLabel: "Liên hệ",
      contactBtn: "Liên hệ tư vấn",
      subscribeBtn: "Đăng ký ngay",
    },
    footer: { rights: "© 2026 ONE Architecture", version: "OneTools v1.0" },
  },

  en: {
    nav: { tools: "Tutorials", pricing: "Pricing", docs: "Contact", login: "Log in" },
    hero: {
      eyebrow: "Add-in for Revit | BIM",
      titleAccent: "ONE TOOLSET",
      titleWhite: "EVERY SOLUTION",
      desc: "OneTools is an all-in-one solution that automates everything from the smallest details to complex deployment workflows — freeing you from tedious repetitive work so you can focus entirely on design.",
      ctaPrimary: "View plans",
      ctaGhost: "Watch tutorials",
    },
    download: {
      title: "Download OneTools Setup",
      sub: "v1.4.2 · Windows x64 · 18.3 MB",
      btn: "Download",
      revitLabel: "Revit",
      revitValue: "2025 · 2026 · 2027",
      updatedLabel: "Updated",
      updatedValue: "Aug 5, 2026",
      licenseLabel: "License",
      licenseValue: "15-day free trial",
      guideLink: "Installation guide →",
    },
    stats: [
      { num: "50", label: "Active tools" },
      { num: "2025.2026.2027", label: "Revit version supported" },
      { num: "VI / EN", label: "Bilingual interface" },
      { num: "24h", label: "Support response time" },
    ],
    tools: {
      tag: "Tutorials",
      title: "Demo video for each tool",
      desc: "Every tool comes with a short video showing real usage on an actual floor plan.",
      watchLabel: (name) => `Watch ${name} video`,
    },
    pricing: {
      tag: "Subscribe",
      title: "Choose your plan",
      billingYear: "Yearly",
      billingMonth: "Monthly",
      contactLabel: "Contact",
      contactBtn: "Contact sales",
      subscribeBtn: "Subscribe",
    },
    footer: { rights: "© 2026 ONE Architecture", version: "OneTools v1.0" },
  },
};

function detectInitialLang() {
  if (typeof window === "undefined") return "vi";
  try {
    const saved = window.localStorage.getItem("onetools-lang");
    if (saved === "vi" || saved === "en") return saved;
  } catch (e) {}
  const nav = (navigator.language || "vi").toLowerCase();
  return nav.startsWith("vi") ? "vi" : "en";
}

const LangContext = createContext({ lang: "vi", t: DICT.vi, setLang: () => {} });
const useLang = () => useContext(LangContext);

// ---------- Hero: animated dimension line ----------
function DimensionHero() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const start = performance.now();
    const duration = 1400;
    let raf;
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setProgress(eased);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  // 3 witness points along the dimension chain -> 2 segments
  const xs = [60, 320, 620, 900];
  const y = 90;
  const witnessTop = 30;

  return (
    <svg viewBox="0 0 960 180" className="dim-hero-svg" role="img" aria-label="Dimension line animation">
      {xs.map((x, i) => (
        <line
          key={`w-${i}`}
          x1={x}
          y1={witnessTop}
          x2={x}
          y2={y + 10}
          stroke="#3A3F4B"
          strokeWidth="1"
          style={{
            opacity: progress > i / xs.length ? 1 : 0,
            transition: "opacity 0.3s ease",
          }}
        />
      ))}
      <line
        x1={xs[0]}
        y1={y}
        x2={xs[0] + (xs[xs.length - 1] - xs[0]) * progress}
        y2={y}
        stroke="#C2A47C"
        strokeWidth="1.5"
      />
      {xs.slice(0, -1).map((x, i) => {
        const segMid = (xs[i] + xs[i + 1]) / 2;
        const yearLabels = ["2025", "2026", "2027"];
        const show = progress > (i + 1) / xs.length - 0.05;
        return (
          <g key={`seg-${i}`} style={{ opacity: show ? 1 : 0, transition: "opacity 0.4s ease" }}>
            <text
              x={segMid}
              y={y - 14}
              textAnchor="middle"
              fill="#D6803A"
              fontFamily="'JetBrains Mono', monospace"
              fontSize="13"
            >
              {yearLabels[i]}
            </text>
          </g>
        );
      })}
      {xs.map((x, i) => (
        <circle
          key={`tick-${i}`}
          cx={x}
          cy={y}
          r="2.5"
          fill="#C2A47C"
          style={{
            opacity: progress > i / xs.length ? 1 : 0,
            transition: "opacity 0.3s ease",
          }}
        />
      ))}
    </svg>
  );
}

function VideoCard({ tool }) {
  const [playing, setPlaying] = useState(false);
  const { t } = useLang();
  return (
    <div className="video-card">
      <div className="video-card-code">{tool.code}</div>
      <div className="video-frame">
        {playing ? (
          <iframe
            width="100%"
            height="100%"
            src={`https://www.youtube.com/embed/${tool.youtubeId}?autoplay=1`}
            title={tool.name}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <button className="video-play-btn" onClick={() => setPlaying(true)} aria-label={t.tools.watchLabel(tool.name)}>
            <svg width="52" height="52" viewBox="0 0 52 52" fill="none">
              <circle cx="26" cy="26" r="25" stroke="#C2A47C" strokeWidth="1.5" />
              <path d="M21 16L36 26L21 36V16Z" fill="#C2A47C" />
            </svg>
          </button>
        )}
      </div>
      <h3>{tool.name}</h3>
      <p>{tool.desc}</p>
    </div>
  );
}

function LangToggle() {
  const { lang, setLang } = useLang();
  return (
    <div className="lang-toggle" role="group" aria-label="Language switch">
      <button className={lang === "vi" ? "active" : ""} onClick={() => setLang("vi")}>
        VI
      </button>
      <button className={lang === "en" ? "active" : ""} onClick={() => setLang("en")}>
        EN
      </button>
    </div>
  );
}

function OneToolsLandingInner({ videos, plans, release }) {
  const [billingAnnual, setBillingAnnual] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const { lang, t } = useLang();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  // Dữ liệu từ Supabase (props) — chọn đúng field theo ngôn ngữ hiện tại.
  // Nếu Supabase chưa cấu hình / bảng trống, videos và plans sẽ là mảng rỗng
  // và trang vẫn hiển thị bình thường (chỉ không có nội dung động).
  const toolItems = (videos || []).map((v) => ({
    code: v.code,
    name: lang === "vi" ? v.name_vi : v.name_en,
    desc: lang === "vi" ? v.desc_vi : v.desc_en,
    youtubeId: v.youtube_id,
  }));

  const planItems = (plans || []).map((p) => ({
    name: lang === "vi" ? p.name_vi : p.name_en,
    price: p.is_contact ? t.pricing.contactLabel : p.price,
    period: lang === "vi" ? p.period_vi : p.period_en,
    seats: lang === "vi" ? p.seats_vi : p.seats_en,
    features: lang === "vi" ? p.features_vi : p.features_en,
    highlight: p.highlight,
  }));

  return (
    <div className="ot-root">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&family=Inter:wght@400;500;600;700&display=swap');

        .ot-root {
          --bg: #292929;
          --bg-raised: #323232;
          --line: #454545;
          --line-soft: #3A3A3A;
          --text: #FFFFFF;
          --text-dim: #B5AA9A;
          --accent: #C2A47C;
          --accent-dim: #8F7A5C;
          --warn: #D6803A;
          font-family: 'Inter', -apple-system, sans-serif;
          background: var(--bg);
          color: var(--text);
          min-height: 100vh;
          line-height: 1.5;
        }
        .display {
          font-family: 'Oswald', sans-serif;
          text-transform: uppercase;
          letter-spacing: 0.01em;
        }
        .ot-root * { box-sizing: border-box; }
        .mono { font-family: 'JetBrains Mono', monospace; }

        .container {
          max-width: 1080px;
          margin: 0 auto;
          padding: 0 24px;
        }

        /* ---------- Nav ---------- */
        .nav {
          border-bottom: 1px solid var(--line);
          position: sticky;
          top: 0;
          background: rgba(38,35,29,0.96);
          backdrop-filter: blur(8px);
          z-index: 10;
        }
        .nav-inner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 18px 24px;
          max-width: 1080px;
          margin: 0 auto;
        }
        .nav-brand {
          display: flex;
          align-items: center;
          gap: 10px;
          font-family: 'Oswald', sans-serif;
          text-transform: uppercase;
          font-weight: 600;
          font-size: 26px;
          letter-spacing: 0.04em;
        }
        .nav-brand-mark {
          width: 77px;
          height: 77px;
          display: block;
          object-fit: contain;
        }
        .nav-links {
          display: flex;
          gap: 28px;
          font-size: 14px;
          color: var(--text-dim);
        }
        .nav-links a { color: inherit; text-decoration: none; transition: color 0.15s; }
        .nav-links a:hover { color: var(--text); }
        .nav-right {
          display: flex;
          align-items: center;
          gap: 14px;
        }
        .nav-user {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .nav-user-email {
          font-size: 12px;
          color: var(--text-dim);
          max-width: 140px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .lang-toggle {
          display: inline-flex;
          border: 1px solid var(--line);
          font-family: 'JetBrains Mono', monospace;
          font-size: 12px;
        }
        .lang-toggle button {
          padding: 6px 11px;
          background: transparent;
          border: none;
          color: var(--text-dim);
          cursor: pointer;
          letter-spacing: 0.04em;
        }
        .lang-toggle button.active { background: var(--accent); color: #292929; }
        .nav-cta {
          font-size: 13px;
          font-family: 'JetBrains Mono', monospace;
          padding: 8px 16px;
          border: 1px solid var(--accent);
          color: var(--accent);
          background: transparent;
          cursor: pointer;
          transition: all 0.15s;
          text-decoration: none;
          display: inline-block;
        }
        .nav-cta:hover { background: var(--accent); color: #292929; }

        .nav-burger {
          display: none;
          width: 32px;
          height: 32px;
          background: transparent;
          border: 1px solid var(--line);
          cursor: pointer;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 5px;
          padding: 0;
        }
        .nav-burger-line {
          width: 16px;
          height: 1.5px;
          background: var(--text);
          transition: transform 0.2s ease, opacity 0.2s ease;
        }
        .nav-burger-line.open:first-child { transform: translateY(3.25px) rotate(45deg); }
        .nav-burger-line.open:last-child { transform: translateY(-3.25px) rotate(-45deg); }

        .nav-mobile-panel {
          display: none;
          flex-direction: column;
          border-top: 1px solid var(--line);
          padding: 14px 24px 20px;
        }
        .nav-mobile-panel a {
          color: var(--text-dim);
          text-decoration: none;
          font-size: 15px;
          padding: 12px 0;
          border-bottom: 1px solid var(--line-soft);
        }
        .nav-mobile-panel .nav-cta {
          margin-top: 16px;
          text-align: center;
        }

        /* ---------- Hero ---------- */
        .hero {
          padding: 80px 0 40px;
          border-bottom: 1px solid var(--line);
        }
        .hero-eyebrow {
          font-family: 'JetBrains Mono', monospace;
          font-size: 12px;
          color: var(--accent);
          letter-spacing: 0.28em;
          text-transform: uppercase;
          margin-bottom: 20px;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .hero-eyebrow::before {
          content: '';
          width: 24px;
          height: 1px;
          background: var(--accent);
        }
        .hero h1 {
          font-family: 'Oswald', sans-serif;
          text-transform: uppercase;
          font-size: 52px;
          font-weight: 700;
          line-height: 1.35;
          margin: 0 0 20px;
          letter-spacing: 0.005em;
          max-width: 720px;
        }
        .hero h1 span { color: var(--accent); }
        .hero p {
          font-size: 17px;
          color: var(--text-dim);
          max-width: 720px;
          margin: 0 0 32px;
          text-align: justify;
        }
        .hero-actions { display: flex; gap: 14px; margin-bottom: 56px; }

        /* ---------- Download card ---------- */
        .download-card {
          border: 1.5px solid var(--accent);
          background: var(--bg-raised);
          margin: 0 0 28px;
          position: relative;
        }
        .download-card::before {
          content: 'FILE';
          position: absolute;
          top: -1px;
          right: -1px;
          font-family: 'JetBrains Mono', monospace;
          font-size: 10px;
          letter-spacing: 0.15em;
          color: var(--bg);
          background: var(--accent);
          padding: 4px 9px;
        }
        .download-main {
          display: flex;
          align-items: center;
          gap: 20px;
          padding: 24px 26px;
          border-bottom: 1px solid var(--line);
        }
        .download-icon {
          width: 52px;
          height: 52px;
          min-width: 52px;
          background: var(--accent);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .download-copy { flex: 1; }
        .download-title {
          font-size: 20px;
          font-weight: 600;
          letter-spacing: 0.01em;
          margin-bottom: 4px;
        }
        .download-sub {
          font-size: 12.5px;
          color: var(--text-dim);
          letter-spacing: 0.02em;
        }
        .download-btn {
          font-family: 'JetBrains Mono', monospace;
          font-size: 14px;
          font-weight: 600;
          padding: 13px 22px;
          background: var(--accent);
          color: var(--bg);
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 9px;
          white-space: nowrap;
          transition: opacity 0.15s;
        }
        .download-btn:hover { opacity: 0.88; }
        .download-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .download-btn { text-decoration: none; }
        .download-btn-arrow { font-size: 15px; }
        .download-meta {
          display: flex;
          align-items: center;
          padding: 14px 26px;
          gap: 28px;
          flex-wrap: wrap;
        }
        .download-meta-item {
          display: flex;
          flex-direction: column;
          gap: 3px;
        }
        .download-meta-label {
          font-size: 10.5px;
          color: var(--accent);
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }
        .download-meta-value {
          font-size: 13px;
          color: var(--text-dim);
        }
        .download-meta-link {
          margin-left: auto;
          font-family: 'JetBrains Mono', monospace;
          font-size: 13px;
          color: var(--text);
          text-decoration: none;
          border-bottom: 1px solid var(--line);
          transition: border-color 0.15s;
        }
        .download-meta-link:hover { border-color: var(--accent); }
        .btn-primary {
          font-family: 'JetBrains Mono', monospace;
          font-size: 14px;
          font-weight: 600;
          padding: 13px 24px;
          background: var(--accent);
          color: #292929;
          border: none;
          cursor: pointer;
          transition: opacity 0.15s;
        }
        .btn-primary:hover { opacity: 0.88; }
        .btn-ghost {
          font-family: 'JetBrains Mono', monospace;
          font-size: 14px;
          padding: 13px 24px;
          background: transparent;
          color: var(--text);
          border: 1px solid var(--line);
          cursor: pointer;
          transition: border-color 0.15s;
        }
        .btn-ghost:hover { border-color: var(--text-dim); }

        .dim-hero-svg { width: 100%; max-width: 720px; height: auto; display: block; margin: 0 auto 28px; }
        .hero-ribbon-frame {
          border: 1px solid var(--line);
          background: var(--bg-raised);
          padding: 14px;
          margin-top: 24px;
        }
        .hero-ribbon-frame img {
          display: block;
          width: 100%;
          height: auto;
        }

        /* ---------- Stats strip ---------- */
        .stats {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          border-bottom: 1px solid var(--line);
        }
        .stat {
          padding: 24px;
          border-right: 1px solid var(--line);
        }
        .stat:last-child { border-right: none; }
        .stat-num {
          font-family: 'Oswald', sans-serif;
          font-size: clamp(15px, 3vw, 30px);
          font-weight: 700;
          color: var(--accent);
          white-space: nowrap;
        }
        .stat-label {
          font-size: 12.5px;
          color: var(--text-dim);
          margin-top: 4px;
        }

        /* ---------- Section heading ---------- */
        .section { padding: 72px 0; border-bottom: 1px solid var(--line); }
        .section-head {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          margin-bottom: 40px;
          gap: 24px;
        }
        .section-tag {
          font-family: 'JetBrains Mono', monospace;
          font-size: 12px;
          color: var(--accent);
          letter-spacing: 0.28em;
          text-transform: uppercase;
          margin-bottom: 10px;
        }
        .section h2 {
          font-family: 'Oswald', sans-serif;
          text-transform: uppercase;
          font-size: 34px;
          margin: 0;
          font-weight: 700;
          letter-spacing: 0.005em;
        }
        .section-desc { color: var(--text-dim); font-size: 15px; max-width: 420px; text-align: right; }

        /* ---------- Video grid ---------- */
        .video-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1px;
          background: var(--line);
          border: 1px solid var(--line);
        }
        .empty-state {
          grid-column: 1 / -1;
          padding: 48px 24px;
          text-align: center;
          color: var(--text-dim);
          font-size: 14px;
          background: var(--bg);
        }
        .video-card {
          background: var(--bg);
          padding: 26px 22px;
          position: relative;
        }
        .video-card-code {
          font-family: 'Oswald', sans-serif;
          font-size: 46px;
          font-weight: 700;
          line-height: 1;
          color: transparent;
          -webkit-text-stroke: 1.5px var(--accent-dim);
          margin-bottom: 6px;
          letter-spacing: 0.02em;
        }
        .video-frame {
          aspect-ratio: 16/9;
          background: var(--bg-raised);
          border: 1px solid var(--line);
          margin-bottom: 16px;
          position: relative;
          overflow: hidden;
        }
        .video-play-btn {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          background: transparent;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .video-frame iframe { border: none; }
        .video-card h3 {
          font-family: 'Oswald', sans-serif;
          text-transform: uppercase;
          font-size: 20px;
          margin: 0 0 8px;
          font-weight: 600;
          letter-spacing: 0.01em;
        }
        .video-card p { font-size: 13.5px; color: var(--text-dim); margin: 0; }

        /* ---------- Pricing ---------- */
        .billing-toggle {
          display: inline-flex;
          border: 1px solid var(--line);
          font-family: 'JetBrains Mono', monospace;
          font-size: 13px;
        }
        .billing-toggle button {
          padding: 8px 16px;
          background: transparent;
          border: none;
          color: var(--text-dim);
          cursor: pointer;
        }
        .billing-toggle button.active { background: var(--accent); color: #292929; }

        .pricing-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1px;
          background: var(--line);
          border: 1px solid var(--line);
        }
        .plan {
          background: var(--bg);
          padding: 32px 26px;
          display: flex;
          flex-direction: column;
        }
        .plan.highlight { background: var(--bg-raised); }
        .plan-name { font-size: 15px; font-weight: 600; margin-bottom: 4px; }
        .plan-seats { font-family: 'JetBrains Mono', monospace; font-size: 12px; color: var(--text-dim); margin-bottom: 20px; }
        .plan-price { font-family: 'JetBrains Mono', monospace; font-size: 30px; font-weight: 700; margin-bottom: 2px; }
        .plan-price .period { font-size: 13px; color: var(--text-dim); font-weight: 400; }
        .plan-features { list-style: none; padding: 0; margin: 24px 0 28px; flex: 1; }
        .plan-features li {
          font-size: 13.5px;
          color: var(--text-dim);
          padding: 9px 0;
          border-top: 1px solid var(--line-soft);
          display: flex;
          gap: 10px;
        }
        .plan-features li::before { content: '—'; color: var(--accent); }
        .plan-btn {
          font-family: 'JetBrains Mono', monospace;
          font-size: 13px;
          font-weight: 600;
          padding: 12px;
          border: 1px solid var(--line);
          background: transparent;
          color: var(--text);
          cursor: pointer;
          transition: all 0.15s;
        }
        .plan.highlight .plan-btn { background: var(--accent); color: #292929; border-color: var(--accent); }
        .plan-btn:hover { border-color: var(--accent); }

        /* ---------- Footer ---------- */
        .footer {
          padding: 40px 0;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 13px;
          color: var(--text-dim);
        }
        .footer .mono { color: var(--text-dim); }
        .social-bar {
          display: flex;
          gap: 14px;
          padding-top: 32px;
          border-top: 1px solid var(--line);
        }
        .social-icon {
          width: 38px;
          height: 38px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid var(--line);
          color: var(--text-dim);
          text-decoration: none;
          transition: all 0.15s;
        }
        .social-icon:hover {
          color: var(--bg);
          background: var(--accent);
          border-color: var(--accent);
        }

        @media (max-width: 860px) {
          .nav-links-desktop,
          .nav-cta-desktop {
            display: none;
          }
          .nav-burger { display: flex; }
          .nav-mobile-panel { display: flex; }
        }

        @media (max-width: 720px) {
          .hero h1 { font-size: 32px; }
          .stats { grid-template-columns: repeat(2, 1fr); }
          .stat:nth-child(2) { border-right: none; }
          .video-grid, .pricing-grid { grid-template-columns: 1fr; }
          .section-head { flex-direction: column; align-items: flex-start; }
          .section-desc { text-align: left; }
          .download-main { flex-wrap: wrap; }
          .download-btn { width: 100%; justify-content: center; }
          .download-meta { flex-direction: column; align-items: flex-start; gap: 12px; }
          .download-meta-link { margin-left: 0; }
        }

        @media (max-width: 380px) {
          .nav-inner { padding: 14px 16px; }
          .nav-brand { font-size: 20px; }
          .lang-toggle button { padding: 5px 8px; font-size: 11px; }
        }
      `}</style>

      <nav className="nav">
        <div className="nav-inner">
          <div className="nav-brand">
            <img className="nav-brand-mark" src="/logo.png" alt="OneTools" />
            OneTools
          </div>
          <div className="nav-links nav-links-desktop">
            <a href="#tools">{t.nav.tools}</a>
            <a href="#pricing">{t.nav.pricing}</a>
            <a href="#">{t.nav.docs}</a>
          </div>
          <div className="nav-right">
            <LangToggle />
            {user ? (
              <div className="nav-user">
                <span className="nav-user-email mono">{user.email}</span>
                <button className="nav-cta nav-cta-desktop" onClick={handleLogout}>
                  {lang === "vi" ? "Đăng xuất" : "Log out"}
                </button>
              </div>
            ) : (
              <Link href="/login" className="nav-cta nav-cta-desktop">
                {t.nav.login}
              </Link>
            )}
            <button
              className="nav-burger"
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileMenuOpen}
              onClick={() => setMobileMenuOpen((v) => !v)}
            >
              <span className={`nav-burger-line ${mobileMenuOpen ? "open" : ""}`}></span>
              <span className={`nav-burger-line ${mobileMenuOpen ? "open" : ""}`}></span>
            </button>
          </div>
        </div>
        {mobileMenuOpen && (
          <div className="nav-mobile-panel">
            <a href="#tools" onClick={() => setMobileMenuOpen(false)}>{t.nav.tools}</a>
            <a href="#pricing" onClick={() => setMobileMenuOpen(false)}>{t.nav.pricing}</a>
            <a href="#" onClick={() => setMobileMenuOpen(false)}>{t.nav.docs}</a>
            {user ? (
              <button
                className="nav-cta"
                onClick={() => {
                  handleLogout();
                  setMobileMenuOpen(false);
                }}
              >
                {lang === "vi" ? "Đăng xuất" : "Log out"} ({user.email})
              </button>
            ) : (
              <Link href="/login" className="nav-cta" onClick={() => setMobileMenuOpen(false)}>
                {t.nav.login}
              </Link>
            )}
          </div>
        )}
      </nav>

      <header className="hero">
        <div className="container">
          <div className="hero-eyebrow">{t.hero.eyebrow}</div>
          <h1>
            <span>{t.hero.titleAccent}</span><br />{t.hero.titleWhite}
          </h1>
          <p>{t.hero.desc}</p>
          <div className="hero-actions">
            <button className="btn-primary">{t.hero.ctaPrimary}</button>
            <button className="btn-ghost">{t.hero.ctaGhost}</button>
          </div>

          <div className="download-card">
            <div className="download-main">
              <div className="download-icon">
                <svg width="30" height="30" viewBox="0 0 30 30" fill="none">
                  <path d="M15 3V19M15 19L9 13M15 19L21 13" stroke="#292929" strokeWidth="2" strokeLinecap="square" />
                  <path d="M5 24H25" stroke="#292929" strokeWidth="2" strokeLinecap="square" />
                </svg>
              </div>
              <div className="download-copy">
                <div className="download-title display">{t.download.title}</div>
                <div className="download-sub mono">
                  {release
                    ? `v${release.version} · Windows x64 · ${release.file_size_mb} MB`
                    : t.download.sub}
                </div>
              </div>
              {release ? (
                <a className="download-btn" href={release.download_url}>
                  {t.download.btn}
                  <span className="download-btn-arrow">↓</span>
                </a>
              ) : (
                <button className="download-btn" disabled>
                  {t.download.btn}
                  <span className="download-btn-arrow">↓</span>
                </button>
              )}
            </div>
            <div className="download-meta">
              <div className="download-meta-item">
                <span className="download-meta-label mono">{t.download.revitLabel}</span>
                <span className="download-meta-value">
                  {release ? release.revit_versions : t.download.revitValue}
                </span>
              </div>
              <div className="download-meta-item">
                <span className="download-meta-label mono">{t.download.updatedLabel}</span>
                <span className="download-meta-value">
                  {release
                    ? new Date(release.published_at).toLocaleDateString(lang === "vi" ? "vi-VN" : "en-US")
                    : t.download.updatedValue}
                </span>
              </div>
              <div className="download-meta-item">
                <span className="download-meta-label mono">{t.download.licenseLabel}</span>
                <span className="download-meta-value">{t.download.licenseValue}</span>
              </div>
              <a className="download-meta-link" href="#">{t.download.guideLink}</a>
            </div>
          </div>

          <DimensionHero />

          <div className="hero-ribbon-frame">
            <img src="/ribbon-lightdark.png" alt="OneTools ribbon - Light and Dark Mode" />
          </div>
        </div>
      </header>

      <div className="stats">
        {t.stats.map((s) => (
          <div className="stat" key={s.label}>
            <div className="stat-num mono">{s.num}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      <section className="section" id="tools">
        <div className="container">
          <div className="section-head">
            <div>
              <div className="section-tag">{t.tools.tag}</div>
              <h2>{t.tools.title}</h2>
            </div>
          </div>
          <div className="video-grid">
            {toolItems.length > 0 ? (
              toolItems.map((tool) => <VideoCard key={tool.code} tool={tool} />)
            ) : (
              <p className="empty-state">
                {lang === "vi" ? "Chưa có video nào được đăng." : "No videos published yet."}
              </p>
            )}
          </div>
        </div>
      </section>

      <section className="section" id="pricing">
        <div className="container">
          <div className="section-head">
            <div>
              <div className="section-tag">{t.pricing.tag}</div>
              <h2>{t.pricing.title}</h2>
            </div>
            <div className="billing-toggle">
              <button className={billingAnnual ? "active" : ""} onClick={() => setBillingAnnual(true)}>
                {t.pricing.billingYear}
              </button>
              <button className={!billingAnnual ? "active" : ""} onClick={() => setBillingAnnual(false)}>
                {t.pricing.billingMonth}
              </button>
            </div>
          </div>
          <div className="pricing-grid">
            {planItems.length > 0 ? (
              planItems.map((plan) => (
                <div key={plan.name} className={`plan ${plan.highlight ? "highlight" : ""}`}>
                  <div className="plan-name">{plan.name}</div>
                  <div className="plan-seats mono">{plan.seats}</div>
                  <div className="plan-price mono">
                    {plan.price === t.pricing.contactLabel ? plan.price : `₫${plan.price}`}
                    {plan.period && <span className="period"> {plan.period}</span>}
                  </div>
                  <ul className="plan-features">
                    {plan.features.map((f) => (
                      <li key={f}>{f}</li>
                    ))}
                  </ul>
                  <button className="plan-btn">
                    {plan.price === t.pricing.contactLabel ? t.pricing.contactBtn : t.pricing.subscribeBtn}
                  </button>
                </div>
              ))
            ) : (
              <p className="empty-state">
                {lang === "vi" ? "Chưa có gói giá nào được đăng." : "No pricing plans published yet."}
              </p>
            )}
          </div>
        </div>
      </section>

      <div className="social-bar container">
        <a href="https://www.youtube.com/channel/UCU_XrxQWA4m-3sylSzsBULg" target="_blank" rel="noopener noreferrer" aria-label="YouTube" className="social-icon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M22 12s0-3.2-.4-4.7c-.2-.9-.9-1.6-1.8-1.8C18.1 5 12 5 12 5s-6.1 0-7.8.5c-.9.2-1.6.9-1.8 1.8C2 8.8 2 12 2 12s0 3.2.4 4.7c.2.9.9 1.6 1.8 1.8C5.9 19 12 19 12 19s6.1 0 7.8-.5c.9-.2 1.6-.9 1.8-1.8.4-1.5.4-4.7.4-4.7z" stroke="currentColor" strokeWidth="1.6"/>
            <path d="M10 9.5l5 2.5-5 2.5v-5z" fill="currentColor"/>
          </svg>
        </a>
        <a href="https://www.facebook.com/OneTools-BIM/" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="social-icon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M15 8.5h2V5.5h-2c-2 0-3.5 1.6-3.5 3.5v2H9.5v3H11.5v7h3v-7h2l.5-3H14.5v-2c0-.3.2-.5.5-.5z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/>
          </svg>
        </a>
        <a href="mailto:onetools.bim@gmail.com" aria-label="Email" className="social-icon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <rect x="3" y="5.5" width="18" height="13" rx="1.5" stroke="currentColor" strokeWidth="1.6"/>
            <path d="M4 7l8 6 8-6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </a>
        <a href="tel:+84945363468" aria-label="Phone" className="social-icon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M6 3.5h3l1.5 4-2 1.5c.8 2 2.2 3.4 4.2 4.2l1.5-2 4 1.5v3c0 1-.8 1.8-1.8 1.7C10.9 17 7 13.1 6.3 7.3 6.2 6.3 5 5.5 6 5.5V3.5z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/>
          </svg>
        </a>
      </div>

      <footer className="footer container">
        <span className="mono">{t.footer.rights}</span>
        <span className="mono">{t.footer.version}</span>
      </footer>
    </div>
  );
}

export default function OneToolsLanding({ videos, plans, release }) {
  const [lang, setLangState] = useState("vi");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setLangState(detectInitialLang());
    setMounted(true);
  }, []);

  const setLang = (next) => {
    setLangState(next);
    try {
      window.localStorage.setItem("onetools-lang", next);
    } catch (e) {}
  };

  if (!mounted) return null;

  return (
    <LangContext.Provider value={{ lang, t: DICT[lang], setLang }}>
      <OneToolsLandingInner videos={videos} plans={plans} release={release} />
    </LangContext.Provider>
  );
}
