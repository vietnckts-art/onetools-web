"use client";

import { useEffect, useState } from "react";

// Dùng chung cho các trang không nằm trong cây LandingClient (login/signup/reset-password/account),
// nên không có sẵn LangContext của trang chủ. Đọc/ghi CÙNG 1 key localStorage ("onetools-lang") để
// lựa chọn ngôn ngữ đồng bộ giữa trang chủ và các trang này (giống cách app/legal/LegalPageShell.jsx
// đã làm).

export function detectInitialLang() {
  if (typeof window === "undefined") return "vi";
  try {
    const saved = window.localStorage.getItem("onetools-lang");
    if (saved === "vi" || saved === "en") return saved;
  } catch (e) {}
  const nav = (navigator.language || "vi").toLowerCase();
  return nav.startsWith("vi") ? "vi" : "en";
}

export function useLang() {
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

  return { lang, setLang, mounted };
}
