import { redirect } from "next/navigation";

// =====================================================================================================
// MỚI (2026-11-23): đường dẫn CỐ ĐỊNH mà nút "Mở OneTools trên Autodesk App Store" trong add-in (bản Store)
// trỏ tới: https://onetools-bim.com/autodesk-store -> chuyển tiếp sang trang OneTools trên Autodesk App Store.
//
// Add-in đã phát hành thì KHÔNG đổi được link ghi trong DLL, nên mọi bản Store đều trỏ về đây. Khi Autodesk
// duyệt xong và cấp trang sản phẩm (dạng https://apps.autodesk.com/RVT/en/Detail/Index?id=...), CHỈ CẦN sửa
// AUTODESK_STORE_URL bên dưới rồi git push - mọi bản add-in đang dùng sẽ trỏ đúng trang ngay.
// =====================================================================================================
const AUTODESK_STORE_URL =
  "https://apps.autodesk.com/RVT/en/List/Search?isAppSearch=True&searchboxstore=RVT&facet=&collection=&sort=&query=OneTools";

export const metadata = {
  title: "OneTools on Autodesk App Store",
  robots: { index: false },
};

export default function AutodeskStoreRedirect() {
  redirect(AUTODESK_STORE_URL);
}
