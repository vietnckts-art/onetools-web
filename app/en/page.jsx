import EnRedirect from "./EnRedirect";

// Trang chia sẻ RIÊNG cho khách quốc tế (user yêu cầu 2026-10-23): dán link onetools-bim.com/en vào
// chat/mạng xã hội sẽ ra đúng preview (OG title/description) tiếng Anh — vì thẻ OG được bot quét TRƯỚC
// khi bất kỳ JS nào chạy, nên không thể dựa vào localStorage "onetools-lang" (toggle VI/EN trên trang
// chủ) để tự đổi theo. Người bấm vào link sẽ được chuyển thẳng về "/" ở chế độ hiển thị EN (xem
// EnRedirect.jsx) — nội dung trang chủ vẫn chỉ có 1 bản, không nhân đôi.
export const metadata = {
  title: "OneTools — Professional Add-in Suite for Autodesk Revit",
  description:
    "Precision in every feature, fully automating everything from minor details to complex BIM workflows.",
  alternates: {
    canonical: "https://www.onetools-bim.com/en",
  },
  openGraph: {
    title: "OneTools — Professional Add-in Suite for Autodesk Revit",
    description:
      "Precision in every feature, fully automating everything from minor details to complex BIM workflows.",
    url: "https://www.onetools-bim.com/en",
    siteName: "OneTools",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    locale: "en_US",
    type: "website",
  },
};

export default function EnLandingRedirect() {
  return <EnRedirect />;
}
