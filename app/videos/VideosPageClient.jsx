"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

const STRINGS = {
  vi: {
    title: "Toàn bộ video hướng dẫn",
    back: "← Về trang chủ",
    watchLabel: (name) => `Xem video ${name}`,
    empty: "Chưa có video nào được đăng.",
  },
  en: {
    title: "All tutorial videos",
    back: "← Back to home",
    watchLabel: (name) => `Watch ${name} video`,
    empty: "No videos published yet.",
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

function VideoCard({ tool, lang }) {
  const [playing, setPlaying] = useState(false);
  const t = STRINGS[lang];
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
            <button className="video-play-btn" onClick={() => setPlaying(true)} aria-label={t.watchLabel(tool.name)}>
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

function extractYoutubeId(input) {
  if (!input) return "";
  const raw = input.trim();
  if (!raw.includes("youtu") && !raw.includes("/") && !raw.includes("?")) return raw;
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
  return raw;
}

export default function VideosPageClient({ videos }) {
  const [lang, setLang] = useState("vi");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setLang(detectInitialLang());
    setMounted(true);
  }, []);

  if (!mounted) return null;
  const t = STRINGS[lang];

  const toolItems = (videos || []).map((v) => ({
    code: v.code,
    name: lang === "vi" ? v.name_vi : v.name_en,
    desc: lang === "vi" ? v.desc_vi : v.desc_en,
    youtubeId: extractYoutubeId(v.youtube_id),
  }));

  return (
    <div className="videos-root">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Oswald:wght@600;700&family=JetBrains+Mono:wght@400;500;600&family=Inter:wght@400;500;600&display=swap');
        .videos-root {
          --bg: #292929; --bg-raised: #323232; --line: #454545;
          --text: #FFFFFF; --text-dim: #B5AA9A; --accent: #C2A47C;
          font-family: 'Inter', -apple-system, sans-serif;
          background: var(--bg); color: var(--text);
          min-height: 100vh; line-height: 1.5;
        }
        .videos-root * { box-sizing: border-box; }
        .mono { font-family: 'JetBrains Mono', monospace; }
        .container { max-width: 1080px; margin: 0 auto; padding: 0 24px; }
        .videos-nav { border-bottom: 1px solid var(--line); padding: 20px 0; }
        .videos-nav a { color: var(--accent); text-decoration: none; font-family: 'JetBrains Mono', monospace; font-size: 13px; }
        .videos-header { padding: 48px 0 32px; }
        .videos-header h1 {
          font-family: 'Oswald', sans-serif; text-transform: uppercase;
          font-size: 32px; font-weight: 700; margin: 0;
        }
        .video-grid {
          display: grid; grid-template-columns: repeat(2, 1fr); gap: 1px;
          background: var(--line); border: 1px solid var(--line); margin-bottom: 60px;
        }
        .video-card { background: var(--bg); padding: 26px 22px; position: relative; }
        .video-card-code {
          font-family: 'Oswald', sans-serif; font-size: 46px; font-weight: 700; line-height: 1;
          color: transparent; -webkit-text-stroke: 1.5px var(--accent); margin-bottom: 6px;
        }
        .video-frame {
          aspect-ratio: 16/9; background: var(--bg-raised); border: 1px solid var(--line);
          margin-bottom: 16px; position: relative; overflow: hidden;
        }
        .video-thumb {
          position: absolute; inset: 0; width: 100%; height: 100%;
          object-fit: cover; opacity: 0;
          filter: blur(1.5px) brightness(0.75); transform: scale(1.03);
          transition: opacity 0.35s ease, transform 0.35s ease, filter 0.35s ease;
        }
        .video-card:hover .video-thumb {
          opacity: 0.6; filter: blur(0.5px) brightness(0.85); transform: scale(1);
        }
        .video-play-btn {
          position: absolute; inset: 0; width: 100%; height: 100%;
          background: transparent; border: none; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          z-index: 2;
        }
        .video-frame iframe { border: none; }
        .video-card h3 { font-size: 16px; margin: 0 0 8px; font-weight: 600; }
        .video-card p { font-size: 13.5px; color: var(--text-dim); margin: 0; }
        .empty-state { grid-column: 1 / -1; padding: 48px 24px; text-align: center; color: var(--text-dim); }
        @media (max-width: 720px) {
          .video-grid { grid-template-columns: 1fr; }
        }
      `}</style>
      <nav className="videos-nav">
        <div className="container">
          <Link href="/">{t.back}</Link>
        </div>
      </nav>
      <header className="videos-header container">
        <h1>{t.title}</h1>
      </header>
      <div className="container">
        <div className="video-grid">
          {toolItems.length > 0 ? (
            toolItems.map((tool) => <VideoCard key={tool.code} tool={tool} lang={lang} />)
          ) : (
            <p className="empty-state">{t.empty}</p>
          )}
        </div>
      </div>
    </div>
  );
}
