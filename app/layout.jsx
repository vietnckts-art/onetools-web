export const metadata = {
  metadataBase: new URL("https://www.onetools-bim.com/"),
  title: "OneTools — Revit Add-in Suite",
  description:
    "Bộ công cụ Revit dành cho ONE Architecture — tự động hoá dimension cột, vách, cọc và các thao tác lặp lại.",
  icons: {
    icon: "/logo.png",
  },
  alternates: {
    canonical: "https://www.onetools-bim.com/",
  },
  openGraph: {
    title: "OneTools — Revit Add-in Suite",
    description:
      "Bộ công cụ Revit dành cho ONE Architecture — tự động hoá dimension cột, vách, cọc và các thao tác lặp lại.",
    url: "https://www.onetools-bim.com/",
    siteName: "OneTools",
    images: ["/logo.png"],
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
