"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { COMPANY } from "../../lib/companyInfo";

// Khung dùng chung cho 3 trang pháp lý: Privacy Policy, Refund Policy, Terms &
// Conditions. Giữ đúng theme/tone của trang chủ (nav sticky, màu --bg/--accent,
// font Oswald/Inter, toggle ngôn ngữ lưu vào localStorage "onetools-lang") để 3
// trang này trông như một phần liền mạch của website, không phải trang rời rạc.

const NAV_STRINGS = {
  vi: { back: "← Về trang chủ", contactHeadingFallback: "Liên hệ" },
  en: { back: "← Back to home", contactHeadingFallback: "Contact" },
};

const LEGAL_LINKS = [
  { href: "/privacy-policy", labelVi: "Chính sách bảo mật", labelEn: "Privacy Policy" },
  { href: "/refund-policy", labelVi: "Chính sách hoàn tiền", labelEn: "Refund Policy" },
  { href: "/terms", labelVi: "Điều khoản sử dụng", labelEn: "Terms & Conditions" },
];

function detectInitialLang() {
  if (typeof window === "undefined") return "vi";
  try {
    const saved = window.localStorage.getItem("onetools-lang");
    if (saved === "vi" || saved === "en") return saved;
  } catch (e) {}
  const nav = (navigator.language || "vi").toLowerCase();
  return nav.startsWith("vi") ? "vi" : "en";
}

/**
 * @param {string} slug - route hiện tại ("privacy-policy" | "refund-policy" | "terms"), để lược bớt tự-link trong footer.
 * @param {{vi:string,en:string}} title
 * @param {{vi:string,en:string}} lastUpdated
 * @param {{vi:string,en:string}} contactHeading - ví dụ {vi:"7. Liên hệ", en:"7. Contact"}
 * @param {{vi:Array,en:Array}} sections - mỗi phần tử: {heading, paragraphs?: string[], list?: string[]}
 */
export default function LegalPageShell({ slug, title, lastUpdated, contactHeading, sections }) {
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

  const nav = NAV_STRINGS[lang];
  const items = sections[lang] || [];
  const heading = (contactHeading && contactHeading[lang]) || nav.contactHeadingFallback;

  return (
    <div className="legal-root">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Oswald:wght@600;700&family=Inter:wght@400;500;600;700&display=swap');
        .legal-root {
          --bg: #292929; --bg-raised: #323232; --line: #454545;
          --text: #FFFFFF; --text-dim: #B5AA9A; --accent: #C2A47C; --accent-dim: #8F7A5C;
          font-family: 'Inter', -apple-system, sans-serif;
          background: var(--bg); color: var(--text);
          min-height: 100vh; line-height: 1.65;
        }
        .legal-root * { box-sizing: border-box; }
        .container { max-width: 780px; margin: 0 auto; padding: 0 24px; }
        .legal-nav {
          border-bottom: 1px solid var(--line);
          padding: 18px 0;
          position: sticky; top: 0;
          background: rgba(41,41,41,0.96);
          backdrop-filter: blur(8px);
          z-index: 10;
        }
        .legal-nav-inner {
          max-width: 780px; margin: 0 auto; padding: 0 24px;
          display: flex; align-items: center; justify-content: space-between;
        }
        .legal-nav a.back { color: var(--accent); text-decoration: none; font-size: 13px; }
        .lang-toggle {
          display: inline-flex; border: 1px solid var(--line); font-size: 12px;
        }
        .lang-toggle button {
          padding: 5px 10px; background: transparent; border: none;
          color: var(--text-dim); cursor: pointer; letter-spacing: 0.04em;
          font-family: 'Inter', -apple-system, sans-serif;
        }
        .lang-toggle button.active { background: var(--accent); color: #292929; }
        .legal-header { padding: 48px 0 12px; }
        .legal-header h1 {
          font-family: 'Oswald', sans-serif; text-transform: uppercase;
          font-size: 30px; font-weight: 700; margin: 0 0 8px;
          letter-spacing: 0.01em;
        }
        .legal-updated { font-size: 13px; color: var(--text-dim); }
        .legal-article { padding: 24px 0 64px; }
        .legal-section { margin-bottom: 30px; }
        .legal-section h2 {
          font-size: 17px; font-weight: 600; margin: 0 0 10px; color: var(--text);
        }
        .legal-section p { font-size: 14.5px; color: var(--text-dim); margin: 0 0 10px; }
        .legal-section ul { margin: 0 0 10px; padding-left: 20px; }
        .legal-section li {
          font-size: 14.5px; color: var(--text-dim); margin-bottom: 8px; padding-left: 4px;
        }
        .legal-contact {
          border: 1px solid var(--line); background: var(--bg-raised);
          padding: 20px 22px; margin-top: 8px;
        }
        .legal-contact .company-name { color: var(--text); font-weight: 600; font-size: 14.5px; margin-bottom: 4px; }
        .legal-contact p { margin: 0 0 4px; font-size: 13.5px; color: var(--text-dim); }
        .legal-contact a { color: var(--accent); text-decoration: none; }
        .legal-contact a:hover { text-decoration: underline; }
        .legal-footer {
          border-top: 1px solid var(--line);
          padding: 28px 0 40px;
        }
        .legal-footer-links { display: flex; flex-wrap: wrap; gap: 18px; margin-bottom: 12px; }
        .legal-footer-links a { color: var(--text-dim); text-decoration: none; font-size: 13px; }
        .legal-footer-links a:hover { color: var(--accent); }
        .legal-footer-rights { font-size: 12.5px; color: var(--text-dim); opacity: 0.8; }
      `}</style>

      <nav className="legal-nav">
        <div className="legal-nav-inner">
          <Link className="back" href="/">{nav.back}</Link>
          <div className="lang-toggle">
            <button className={lang === "vi" ? "active" : ""} onClick={() => setLang("vi")}>VI</button>
            <button className={lang === "en" ? "active" : ""} onClick={() => setLang("en")}>EN</button>
          </div>
        </div>
      </nav>

      <header className="legal-header container">
        <h1>{title[lang]}</h1>
        <div className="legal-updated">{lastUpdated[lang]}</div>
      </header>

      <article className="legal-article container">
        {items.map((sec) => (
          <section className="legal-section" key={sec.heading}>
            <h2>{sec.heading}</h2>
            {(sec.paragraphs || []).map((p, i) => (
              <p key={i}>{p}</p>
            ))}
            {sec.list && (
              <ul>
                {sec.list.map((li, i) => (
                  <li key={i}>{li}</li>
                ))}
              </ul>
            )}
          </section>
        ))}

        <section className="legal-section">
          <h2>{heading}</h2>
          <div className="legal-contact">
            <div className="company-name">
              {lang === "vi" ? COMPANY.legalNameVi : COMPANY.legalNameEn} ({COMPANY.shortName})
            </div>
            <p>{lang === "vi" ? "Mã số doanh nghiệp" : "Business Registration No."}: {COMPANY.taxCode}</p>
            <p>{lang === "vi" ? COMPANY.addressVi : COMPANY.addressEn}</p>
            <p>
              {lang === "vi" ? "Điện thoại" : "Phone"}: <a href={COMPANY.phoneHref}>{COMPANY.phone}</a>
              {" · "}Email: <a href={COMPANY.emailHref}>{COMPANY.email}</a>
            </p>
          </div>
        </section>
      </article>

      <footer className="legal-footer container">
        <div className="legal-footer-links">
          <Link href="/">{lang === "vi" ? "Trang chủ" : "Home"}</Link>
          {LEGAL_LINKS.filter((l) => l.href !== `/${slug}`).map((l) => (
            <Link key={l.href} href={l.href}>{lang === "vi" ? l.labelVi : l.labelEn}</Link>
          ))}
        </div>
        <div className="legal-footer-rights mono">© 2026 {COMPANY.shortName} — OneTools</div>
      </footer>
    </div>
  );
}
