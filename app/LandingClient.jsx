"use client";

import React, { useState, useEffect, useRef, createContext, useContext } from "react";
import Link from "next/link";
import { supabase } from "../lib/supabaseClient";
import { getPaddle } from "../lib/paddleClient";
import PaymentMethodPanel from "./checkout/PaymentMethodPanel";


// =====================================================================
// I18N — dictionary song ngữ VI / EN
// =====================================================================
const DICT = {
  vi: {
    nav: { tools: "Video hướng dẫn", pricing: "Bảng giá", docs: "Liên hệ", login: "Đăng nhập", signup: "Đăng ký" },
    hero: {
      eyebrow: "Add-in cho Revit | BIM",
      titleAccent: "MỘT CÔNG CỤ",
      titleWhite: "MỌI GIẢI PHÁP",
      desc: "OneTools - bộ giải pháp tất cả trong một. Chuẩn xác trong từng tính năng, giúp tự động hóa trọn vẹn từ những chi tiết nhỏ nhất đến những quy trình triển khai phức tạp. Giải phóng bạn khỏi công việc lặp lại nhàm chán để tập trung hoàn toàn vào thiết kế.",
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
    footer: {
      rights: "© 2026 ONE",
      version: "OneTools v1.0",
      privacy: "Chính sách bảo mật",
      refund: "Chính sách hoàn tiền",
      terms: "Điều khoản sử dụng",
    },
  },

  en: {
    nav: { tools: "Tutorials", pricing: "Pricing", docs: "Contact", login: "Log in", signup: "Sign up" },
    hero: {
      eyebrow: "Add-in for Revit | BIM",
      titleAccent: "ONE TOOLSET",
      titleWhite: "EVERY SOLUTION",
      desc: "OneTools is an all-in-one solution. Precise in every feature, delivering full automation from the smallest details to the most complex deployment workflows — freeing you from tedious repetitive work so you can focus entirely on design.",
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
    footer: {
      rights: "© 2026 ONE",
      version: "OneTools v1.0",
      privacy: "Privacy Policy",
      refund: "Refund Policy",
      terms: "Terms & Conditions",
    },
  },
};

// Tự động lấy đúng YouTube Video ID dù người nhập dán cả link đầy đủ hay chỉ ID —
// tránh lỗi "Đã xảy ra lỗi" khi nhúng video do URL bị ghép sai định dạng.
function extractYoutubeId(input) {
  if (!input) return "";
  const raw = input.trim();

  // Nếu không chứa "youtu" và không có dấu "/" hay "?", coi như đã là ID thuần, dùng luôn.
  if (!raw.includes("youtu") && !raw.includes("/") && !raw.includes("?")) {
    return raw;
  }

  const patterns = [
    /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
  ];
  for (const re of patterns) {
    const match = raw.match(re);
    if (match) return match[1];
  }
  // Không khớp mẫu nào — trả lại nguyên văn để không làm mất dữ liệu,
  // nhưng trường hợp này gần như chắc chắn admin cần kiểm tra lại giá trị đã nhập.
  return raw;
}

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
          <>
            <img
              className="video-thumb"
              src={`https://img.youtube.com/vi/${tool.youtubeId}/hqdefault.jpg`}
              alt=""
              loading="lazy"
            />
            <button className="video-play-btn" onClick={() => setPlaying(true)} aria-label={t.tools.watchLabel(tool.name)}>
              <svg width="52" height="52" viewBox="0 0 52 52" fill="none">
                <circle cx="26" cy="26" r="25" stroke="#C2A47C" strokeWidth="1.5" />
                <path d="M21 16L36 26L21 36V16Z" fill="#C2A47C" />
              </svg>
            </button>
          </>
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

function OneToolsLandingInner({ videos, plans, release, country }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [previewByPriceId, setPreviewByPriceId] = useState({});
  // Gói đang được chọn để hiện khối "Chọn phương thức thanh toán" ngay bên dưới bảng giá (yêu cầu
  // user 2026-10-08: bấm "Đăng ký ngay" không chuyển sang /checkout nữa, mà hiện inline tại chỗ).
  const [selectedPlanId, setSelectedPlanId] = useState(null);
  const paymentPanelRef = useRef(null);
  const { lang, t } = useLang();

  useEffect(() => {
    if (selectedPlanId && paymentPanelRef.current) {
      paymentPanelRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [selectedPlanId]);

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

  // Lấy giá đã quy đổi theo khu vực (Paddle PricePreview) cho các gói có sẵn `paddle_price_id`
  // (cột lấy trực tiếp từ bảng pricing_plans) — gộp chung 1 lần gọi cho tất cả Price ID thay vì
  // gọi riêng từng gói. Nếu Paddle chưa cấu hình xong (thiếu env var) hoặc lỗi mạng, âm thầm bỏ
  // qua và vẫn hiện giá tĩnh (USD/VNĐ) đã có sẵn từ Supabase — không chặn trang.
  useEffect(() => {
    const priceIds = Array.from(
      new Set((plans || []).map((p) => p.paddle_price_id).filter(Boolean))
    );
    if (priceIds.length === 0) return;

    let cancelled = false;
    getPaddle()
      .then((paddle) =>
        paddle.PricePreview({
          items: priceIds.map((priceId) => ({ priceId, quantity: 1 })),
          ...(country ? { address: { countryCode: country } } : {}),
        })
      )
      .then((result) => {
        if (cancelled) return;
        const map = {};
        (result?.data?.details?.lineItems || []).forEach((item) => {
          if (item?.price?.id && item?.formattedTotals?.total) {
            map[item.price.id] = item.formattedTotals.total;
          }
        });
        setPreviewByPriceId(map);
      })
      .catch((err) => {
        console.error("[Paddle] Không lấy được giá theo khu vực (PricePreview):", err.message);
      });

    return () => {
      cancelled = true;
    };
  }, [plans, country]);

  // Dữ liệu từ Supabase (props) — chọn đúng field theo ngôn ngữ hiện tại.
  // Nếu Supabase chưa cấu hình / bảng trống, videos và plans sẽ là mảng rỗng
  // và trang vẫn hiển thị bình thường (chỉ không có nội dung động).
  const toolItems = (videos || []).map((v) => ({
    code: v.code,
    name: lang === "vi" ? v.name_vi : v.name_en,
    desc: lang === "vi" ? v.desc_vi : v.desc_en,
    youtubeId: extractYoutubeId(v.youtube_id),
  }));

  const planItems = (plans || []).map((p) => {
    // Nếu đang ở tiếng Anh mà chưa điền Giá USD trong admin, coi như "Liên hệ" —
    // tuyệt đối không lấy số VNĐ làm fallback (sẽ hiện sai đơn vị tiền tệ).
    const missingUsdPrice = lang === "en" && !p.price_usd;
    const isContact = p.is_contact || missingUsdPrice;
    const price = lang === "vi" ? p.price : p.price_usd;
    const currency = lang === "vi" ? "₫" : "$";
    const paddlePriceId = p.paddle_price_id || null;
    // Giá đã quy đổi theo khu vực do Paddle trả về (VD: "£31.00" cho khách UK) — CHỈ hiện khi có
    // sẵn (đã gọi PricePreview thành công), nếu không vẫn dùng giá tĩnh price/price_usd như cũ.
    const localizedPrice = paddlePriceId ? previewByPriceId[paddlePriceId] : null;
    return {
      id: p.id,
      name: lang === "vi" ? p.name_vi : p.name_en,
      price: isContact ? t.pricing.contactLabel : price,
      currency,
      isContact,
      period: lang === "vi" ? p.period_vi : p.period_en,
      seats: lang === "vi" ? p.seats_vi : p.seats_en,
      features: lang === "vi" ? p.features_vi : p.features_en,
      highlight: p.highlight,
      paddlePriceId,
      localizedPrice,
    };
  });

  // Gói đang mở khối thanh toán inline — cần đúng ROW GỐC từ Supabase (plan.price dạng VNĐ thô,
  // plan.paddle_price_id, name_vi/name_en) chứ không phải planItems đã bị format theo ngôn ngữ ở trên,
  // vì PaymentMethodPanel (dùng chung với /checkout) cần đúng field thô y hệt page.jsx server-side.
  const selectedPlan = selectedPlanId ? (plans || []).find((p) => p.id === selectedPlanId) : null;
  const selectedPlanName = selectedPlan ? (lang === "vi" ? selectedPlan.name_vi : selectedPlan.name_en) : "";
  const selectedPlanSelfUrl = selectedPlan ? `/checkout?id=${selectedPlan.id}` : "";
  const selectedPlanLoginHref = selectedPlan ? `/login?redirect=${encodeURIComponent(selectedPlanSelfUrl)}` : "";
  const selectedPlanSignupHref = selectedPlan ? `/signup?redirect=${encodeURIComponent(selectedPlanSelfUrl)}` : "";

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
        .mono { font-family: 'Inter', -apple-system, sans-serif; }

        .container {
          /* Rộng ra để vừa đúng 3 video/hàng (trước 1080px chỉ đủ chỗ cho 2) — toàn bộ section khác
             dùng chung class "container" nên tự kéo rộng theo, trang đỡ dài hơn (yêu cầu user 2026-10-08). */
          max-width: 1320px;
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
          max-width: 1320px;
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
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .lang-toggle {
          display: inline-flex;
          border: 1px solid var(--line);
          font-family: 'Inter', -apple-system, sans-serif;
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
          font-family: 'Inter', -apple-system, sans-serif;
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
        .nav-signup-link {
          color: var(--text-dim);
          text-decoration: none;
          font-size: 13px;
          font-family: 'Inter', -apple-system, sans-serif;
          transition: color 0.15s;
        }
        .nav-signup-link:hover { color: var(--text); }

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
          font-family: 'Inter', -apple-system, sans-serif;
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
          max-width: 50%;
          margin: 0 0 32px;
          text-align: justify;
        }
        .hero-actions { display: flex; gap: 14px; margin-bottom: 56px; }
        .hero-cta-link { text-decoration: none; display: inline-block; }

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
          font-family: 'Inter', -apple-system, sans-serif;
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
          font-family: 'Inter', -apple-system, sans-serif;
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
          font-family: 'Inter', -apple-system, sans-serif;
          font-size: 13px;
          color: var(--text);
          text-decoration: none;
          border-bottom: 1px solid var(--line);
          transition: border-color 0.15s;
        }
        .download-meta-link:hover { border-color: var(--accent); }
        .btn-primary {
          font-family: 'Inter', -apple-system, sans-serif;
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
          font-family: 'Inter', -apple-system, sans-serif;
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
        .ribbon-label {
          font-size: 11px;
          color: var(--accent);
          letter-spacing: 0.2em;
          text-transform: uppercase;
          margin-top: 12px;
          margin-bottom: 10px;
        }
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
          font-family: 'Inter', -apple-system, sans-serif;
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
          grid-template-columns: repeat(3, 1fr);
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
        .tools-more {
          display: flex;
          justify-content: center;
          margin-top: 28px;
        }
        .tools-more .tools-more-link {
          text-decoration: none;
          display: inline-block;
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
        .video-thumb {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          opacity: 0;
          filter: blur(1.5px) brightness(0.75);
          transform: scale(1.03);
          transition: opacity 0.35s ease, transform 0.35s ease, filter 0.35s ease;
        }
        .video-card:hover .video-thumb {
          opacity: 0.6;
          filter: blur(0.5px) brightness(0.85);
          transform: scale(1);
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
          z-index: 2;
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
          font-family: 'Inter', -apple-system, sans-serif;
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
        .plan-seats { font-family: 'Inter', -apple-system, sans-serif; font-size: 12px; color: var(--text-dim); margin-bottom: 20px; }
        .plan-price { font-family: 'Inter', -apple-system, sans-serif; font-size: 30px; font-weight: 700; margin-bottom: 2px; }
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
          font-family: 'Inter', -apple-system, sans-serif;
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
        .plan-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        a.plan-btn { display: block; box-sizing: border-box; text-align: center; text-decoration: none; }
        button.plan-btn { display: block; width: 100%; box-sizing: border-box; text-align: center; }
        .plan-btn.is-active { background: var(--accent); color: #292929; border-color: var(--accent); }
        .checkout-error {
          grid-column: 1 / -1; text-align: center; font-size: 13px; color: var(--warn); margin-top: 8px;
        }

        /* ---------- Khối "Chọn phương thức thanh toán" nhúng inline dưới bảng giá ---------- */
        .payment-panel {
          margin-top: 1px;
          border: 1px solid var(--line);
          border-top: none;
          background: var(--bg);
          padding: 32px 28px 36px;
        }
        .payment-panel-head {
          display: flex; align-items: center; justify-content: space-between;
          margin-bottom: 24px;
        }
        .payment-panel-head h3 {
          font-family: 'Oswald', sans-serif; text-transform: uppercase;
          font-size: 20px; font-weight: 700; margin: 0; color: var(--accent);
        }
        .payment-panel-close {
          width: 36px; height: 36px; flex-shrink: 0;
          background: transparent; border: 1px solid var(--line); color: var(--text-dim);
          font-size: 20px; line-height: 1; cursor: pointer; transition: all 0.15s;
        }
        .payment-panel-close:hover { border-color: var(--accent); color: var(--accent); }

        /* ---------- Footer ---------- */
        .footer {
          padding: 40px 0;
          display: flex;
          flex-wrap: wrap;
          gap: 14px;
          justify-content: space-between;
          align-items: center;
          font-size: 13px;
          color: var(--text-dim);
        }
        .footer .mono { color: var(--text-dim); }
        .footer-links { display: flex; flex-wrap: wrap; gap: 18px; }
        .footer-links a { color: var(--text-dim); text-decoration: none; transition: color 0.15s; }
        .footer-links a:hover { color: var(--accent); }
        .footer-meta { display: flex; gap: 18px; }
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
          .nav-cta-desktop,
          .nav-user-email {
            display: none;
          }
          .nav-burger { display: flex; }
          .nav-mobile-panel { display: flex; }
        }

        @media (max-width: 1100px) {
          .video-grid, .pricing-grid { grid-template-columns: repeat(2, 1fr); }
        }

        @media (max-width: 720px) {
          .hero h1 { font-size: 32px; }
          .hero p { max-width: 100%; }
          .stats { grid-template-columns: repeat(2, 1fr); }
          .stat:nth-child(2) { border-right: none; }
          .video-grid, .pricing-grid { grid-template-columns: 1fr; }
          .section-head { flex-direction: column; align-items: flex-start; }
          .section-desc { text-align: left; }
          .download-main { flex-wrap: wrap; }
          .download-btn { width: 100%; justify-content: center; }
          .download-meta { flex-direction: column; align-items: flex-start; gap: 12px; }
          .download-meta-link { margin-left: 0; }

          .social-bar { justify-content: center; }
          .footer { flex-direction: column; align-items: center; text-align: center; gap: 12px; }
          .footer-links { justify-content: center; }
          .footer-meta { justify-content: center; }
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
            <a href="#contact">{t.nav.docs}</a>
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
              <>
                <Link href="/signup" className="nav-signup-link nav-cta-desktop">
                  {t.nav.signup}
                </Link>
                <Link href="/login" className="nav-cta nav-cta-desktop">
                  {t.nav.login}
                </Link>
              </>
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
            <a href="#contact" onClick={() => setMobileMenuOpen(false)}>{t.nav.docs}</a>
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
              <>
                <Link href="/signup" className="nav-cta" onClick={() => setMobileMenuOpen(false)}>
                  {t.nav.signup}
                </Link>
                <Link href="/login" className="nav-cta" onClick={() => setMobileMenuOpen(false)}>
                  {t.nav.login}
                </Link>
              </>
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
            <a href="#pricing" className="btn-primary hero-cta-link">{t.hero.ctaPrimary}</a>
            <a href="#tools" className="btn-ghost hero-cta-link">{t.hero.ctaGhost}</a>
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

          <div className="ribbon-label mono">Light/Dark Mode</div>
          <div className="hero-ribbon-frame">
            <img src="/ribbon-lightdark.jpg" alt="OneTools ribbon trong Autodesk Revit" />
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
              // Luôn cắt theo ĐÚNG BỘI SỐ của 3 cột — nếu không tròn hàng thì mấy ô cuối trống nhưng
              // vẫn ăn màu nền var(--line) của .video-grid (kỹ thuật border-bằng-background-grid-gap),
              // hiện ra thành khối xám trống xấu (user báo 2026-10-08: "hiển thị thiếu"). User chốt
              // hiện 12 video (đủ 4 hàng x 3 cột) thay vì 9 trước đó.
              toolItems.slice(0, 12).map((tool) => <VideoCard key={tool.code} tool={tool} />)
            ) : (
              <p className="empty-state">
                {lang === "vi" ? "Chưa có video nào được đăng." : "No videos published yet."}
              </p>
            )}
          </div>
          {toolItems.length > 12 && (
            <div className="tools-more">
              <Link href="/videos" className="btn-primary tools-more-link">
                {lang === "vi" ? "Xem thêm" : "View more"}
              </Link>
            </div>
          )}
        </div>
      </section>

      <section className="section" id="pricing">
        <div className="container">
          <div className="section-head">
            <div>
              <div className="section-tag">{t.pricing.tag}</div>
              <h2>{t.pricing.title}</h2>
            </div>
          </div>
          <div className="pricing-grid">
            {planItems.length > 0 ? (
              planItems.map((plan) => (
                <div key={plan.name} className={`plan ${plan.highlight ? "highlight" : ""}`}>
                  <div className="plan-name">{plan.name}</div>
                  <div className="plan-seats mono">{plan.seats}</div>
                  <div className="plan-price mono">
                    {plan.isContact
                      ? plan.price
                      : (lang === "en" && plan.localizedPrice) || `${plan.currency}${plan.price}`}
                    {plan.period && <span className="period"> {plan.period}</span>}
                  </div>
                  <ul className="plan-features">
                    {plan.features.map((f) => (
                      <li key={f}>{f}</li>
                    ))}
                  </ul>
                  {plan.isContact ? (
                    <a href="#contact" className="plan-btn">
                      {t.pricing.contactBtn}
                    </a>
                  ) : plan.paddlePriceId ? (
                    // Có giá thật (paddle_price_id) — bấm vào hiện luôn khối "Chọn phương thức thanh
                    // toán" ngay bên dưới bảng giá (KHÔNG chuyển trang nữa — yêu cầu user 2026-10-08),
                    // bấm lại lần nữa (hoặc nút "×" trong khối) để đóng lại.
                    <button
                      type="button"
                      className={`plan-btn ${selectedPlanId === plan.id ? "is-active" : ""}`}
                      onClick={() => setSelectedPlanId((cur) => (cur === plan.id ? null : plan.id))}
                    >
                      {t.pricing.subscribeBtn}
                    </button>
                  ) : (
                    // Chưa gán paddle_price_id (VD: gói Free Trial) — Trial đã cấp miễn phí ngay
                    // lúc đăng ký tài khoản, không cần chọn phương thức thanh toán, trỏ thẳng /signup.
                    <Link href="/signup" className="plan-btn">
                      {t.pricing.subscribeBtn}
                    </Link>
                  )}
                </div>
              ))
            ) : (
              <p className="empty-state">
                {lang === "vi" ? "Chưa có gói giá nào được đăng." : "No pricing plans published yet."}
              </p>
            )}
          </div>

          {selectedPlan && (
            <div className="payment-panel" ref={paymentPanelRef}>
              <div className="payment-panel-head">
                <h3>{selectedPlanName}</h3>
                <button
                  type="button"
                  className="payment-panel-close"
                  onClick={() => setSelectedPlanId(null)}
                  aria-label={lang === "vi" ? "Đóng" : "Close"}
                >
                  ×
                </button>
              </div>
              <PaymentMethodPanel
                plan={selectedPlan}
                lang={lang}
                loginHref={selectedPlanLoginHref}
                signupHref={selectedPlanSignupHref}
              />
            </div>
          )}
        </div>
      </section>

      <div className="social-bar container" id="contact">
        <a href="https://www.youtube.com/playlist?list=PLXW_xxNjWdNQ" target="_blank" rel="noopener noreferrer" aria-label="YouTube" className="social-icon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M22 12s0-3.2-.4-4.7c-.2-.9-.9-1.6-1.8-1.8C18.1 5 12 5 12 5s-6.1 0-7.8.5c-.9.2-1.6.9-1.8 1.8C2 8.8 2 12 2 12s0 3.2.4 4.7c.2.9.9 1.6 1.8 1.8C5.9 19 12 19 12 19s6.1 0 7.8-.5c.9-.2 1.6-.9 1.8-1.8.4-1.5.4-4.7.4-4.7z" stroke="currentColor" strokeWidth="1.6"/>
            <path d="M10 9.5l5 2.5-5 2.5v-5z" fill="currentColor"/>
          </svg>
        </a>
        <a href="https://www.facebook.com/OneTools.BIM" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="social-icon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M15 8.5h2V5.5h-2c-2 0-3.5 1.6-3.5 3.5v2H9.5v3H11.5v7h3v-7h2l.5-3H14.5v-2c0-.3.2-.5.5-.5z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/>
          </svg>
        </a>
        <a href="mailto:support@onetools-bim.com" aria-label="Email" className="social-icon">
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
        <div className="footer-links">
          <Link href="/privacy-policy">{t.footer.privacy}</Link>
          <Link href="/refund-policy">{t.footer.refund}</Link>
          <Link href="/terms">{t.footer.terms}</Link>
        </div>
        <div className="footer-meta">
          <span className="mono">{t.footer.rights}</span>
          <span className="mono">{t.footer.version}</span>
        </div>
      </footer>
    </div>
  );
}

export default function OneToolsLanding({ videos, plans, release, country }) {
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
      <OneToolsLandingInner videos={videos} plans={plans} release={release} country={country} />
    </LangContext.Provider>
  );
}
