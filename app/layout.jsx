// Mô tả cập nhật 2026-10-23 (user yêu cầu): bản cũ chỉ nhắc "dimension cột, vách, cọc" — quá hẹp so với
// bộ công cụ thật (Grid & Level, cửa/cửa sổ, cầu thang, phòng/không gian, đánh số lại, kiểm tra LOD &
// sức khoẻ mô hình, CAD-to-Revit, xuất bản vẽ hàng loạt...). `openGraph.images` đổi từ "/logo.png" (ảnh
// vuông 966×966, bị app/trình duyệt crop mất phần trên khi nhét vào khung preview ngang) sang
// "/og-image.png" (1200×630, logo đặt giữa nền --bg, không bị crop).
export const metadata = {
  metadataBase: new URL("https://www.onetools-bim.com/"),
  title: "OneTools — Revit Add-in Suite",
  description:
    "OneTools — Bộ giải pháp Add-in chuyên nghiệp cho Autodesk Revit. Chuẩn xác trong từng tính năng, tự động hóa toàn bộ từ các chi tiết nhỏ đến quy trình BIM phức tạp.",
  icons: {
    icon: "/logo.png",
  },
  alternates: {
    canonical: "https://www.onetools-bim.com/",
  },
  openGraph: {
    title: "OneTools — Revit Add-in Suite",
    description:
      "OneTools — Bộ giải pháp Add-in chuyên nghiệp cho Autodesk Revit. Chuẩn xác trong từng tính năng, tự động hóa toàn bộ từ các chi tiết nhỏ đến quy trình BIM phức tạp.",
    url: "https://www.onetools-bim.com/",
    siteName: "OneTools",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    locale: "vi_VN",
    type: "website",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="vi">
      <body style={{ margin: 0, padding: 0 }}>{children}</body>
    </html>
  );
}
