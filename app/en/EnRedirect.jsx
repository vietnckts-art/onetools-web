"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Đặt sẵn ngôn ngữ EN (đúng key "onetools-lang" mà LandingClient.jsx/LegalPageShell.jsx đọc khi mount)
// rồi chuyển thẳng về trang chủ — người thật bấm vào link /en sẽ thấy trang chủ ở chế độ tiếng Anh
// ngay lập tức, không phải tự bấm nút EN lần nữa.
export default function EnRedirect() {
  const router = useRouter();

  useEffect(() => {
    try {
      window.localStorage.setItem("onetools-lang", "en");
    } catch (e) {}
    // ĐỔI (2026-11-23): giữ nguyên tham số UTM (?utm_source=...) khi chuyển về trang chủ để thống kê nguồn khách.
    router.replace("/" + (window.location.search || ""));
  }, [router]);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#292929",
        color: "#FFFFFF",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "-apple-system, sans-serif",
        fontSize: 14,
      }}
    >
      Redirecting…
    </div>
  );
}
