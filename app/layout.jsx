import Script from "next/script";

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

// MỚI (2026-11-23): Google Ads tag (gtag.js) - CHỈ nạp khi đã đặt biến môi trường NEXT_PUBLIC_GADS_ID
// (dạng "AW-1234567890") trên Vercel. Chuyển đổi "Tải về" bắn ở LandingClient (lib/attribution.js
// trackAdsConversion + NEXT_PUBLIC_GADS_DOWNLOAD_LABEL). Chưa đặt biến = không nạp gì, web chạy như cũ.
const GADS_ID = process.env.NEXT_PUBLIC_GADS_ID;

// MỚI (2026-11-23): Meta (Facebook) Pixel - CHỈ nạp khi đã đặt NEXT_PUBLIC_META_PIXEL_ID (dãy số 15-16 chữ số,
// lấy trong Meta Events Manager). Tự gửi PageView khi mở trang; sự kiện "Lead" (bấm Tải về) và
// "CompleteRegistration" (đăng ký xong) bắn qua lib/attribution.js trackMetaEvent.
const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID;

export default function RootLayout({ children }) {
  return (
    <html lang="vi">
      <body style={{ margin: 0, padding: 0 }}>
        {children}
        {GADS_ID && (
          <>
            <Script src={`https://www.googletagmanager.com/gtag/js?id=${GADS_ID}`} strategy="afterInteractive" />
            <Script id="gads-init" strategy="afterInteractive">
              {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
window.gtag = gtag;
gtag('js', new Date());
gtag('config', '${GADS_ID}');`}
            </Script>
          </>
        )}
        {META_PIXEL_ID && (
          <Script id="meta-pixel" strategy="afterInteractive">
            {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
document,'script','https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '${META_PIXEL_ID}');
fbq('track', 'PageView');`}
          </Script>
        )}
      </body>
    </html>
  );
}
