export const metadata = {
  title: "OneTools — Revit Add-in Suite",
  description:
    "Bộ công cụ Revit dành cho ONE Architecture — tự động hoá dimension cột, vách, cọc và các thao tác lặp lại.",
  icons: {
    icon: "/logo.png",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="vi">
      <body style={{ margin: 0, padding: 0 }}>{children}</body>
    </html>
  );
}
