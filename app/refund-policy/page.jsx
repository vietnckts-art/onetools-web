import LegalPageShell from "../legal/LegalPageShell";

export const metadata = {
  title: "Chính sách hoàn tiền — OneTools",
  description:
    "Chính sách hoàn tiền của OneTools: điều kiện được/không được hoàn tiền, thời hạn 14 ngày và quy trình gửi yêu cầu.",
  alternates: { canonical: "https://www.onetools-bim.com/refund-policy" },
};

const TITLE = { vi: "Chính sách hoàn tiền", en: "Refund Policy" };
const LAST_UPDATED = { vi: "Cập nhật lần cuối: Tháng 9/2026", en: "Last updated: September 2026" };
const CONTACT_HEADING = { vi: "5. Liên hệ", en: "5. Contact" };

const SECTIONS = {
  vi: [
    {
      heading: "Loại giấy phép",
      paragraphs: [
        "OneTools được bán dưới hình thức license mua 1 lần, thời hạn sử dụng 12 tháng kể từ ngày kích hoạt. Đây KHÔNG phải gói subscription — license không tự động gia hạn, không tự trừ phí định kỳ, và không thể huỷ giữa kỳ để hoàn tiền theo tỷ lệ, ngoại trừ các trường hợp nêu tại Mục 1 và 2 dưới đây.",
      ],
    },
    {
      heading: "1. Bảo đảm hoàn tiền trong 14 ngày",
      paragraphs: [
        "Chúng tôi hoàn tiền 100% trong vòng 14 ngày kể từ ngày mua nếu bạn gặp lỗi kỹ thuật nghiêm trọng khiến OneTools không thể hoạt động trên môi trường Autodesk Revit được hỗ trợ, và đội ngũ hỗ trợ của chúng tôi không thể khắc phục trong vòng 3 ngày làm việc.",
      ],
    },
    {
      heading: "2. Thanh toán trùng lặp",
      paragraphs: [
        "Nếu bạn vô tình bị tính phí nhiều lần cho cùng một đơn hàng, chúng tôi sẽ hoàn lại toàn bộ khoản phí trùng lặp.",
      ],
    },
    {
      heading: "3. Trường hợp không được hoàn tiền",
      list: [
        "Yêu cầu gửi sau 14 ngày kể từ ngày mua.",
        "Lỗi tương thích do phần cứng hoặc cấu hình bên thứ ba không đạt yêu cầu hệ thống tối thiểu của Autodesk Revit.",
        "Đổi ý sau khi đã mua — OneTools đã cung cấp sẵn bản dùng thử miễn phí 15 ngày trước khi mua để bạn trải nghiệm.",
        "Huỷ giữa kỳ license năm đang hoạt động vì lý do khác ngoài Mục 1.",
      ],
    },
    {
      heading: "4. Quy trình yêu cầu hoàn tiền",
      paragraphs: [
        "Gửi email đến support@onetools-bim.com kèm Mã đơn hàng (Order ID) và mô tả sự cố. Sau khi được duyệt, tiền sẽ được hoàn về đúng phương thức thanh toán ban đầu qua Paddle/PayOS trong vòng 5–10 ngày làm việc, và License Key tương ứng sẽ bị vô hiệu hoá ngay khi yêu cầu được chấp thuận.",
      ],
    },
  ],
  en: [
    {
      heading: "License Type",
      paragraphs: [
        "OneTools is sold as a one-time purchase with a 12-month term from the activation date. This is NOT a subscription — the license does not auto-renew, does not charge recurring fees, and cannot be cancelled mid-term for a pro-rated refund, except as described in Sections 1 and 2 below.",
      ],
    },
    {
      heading: "1. 14-Day Money-Back Guarantee",
      paragraphs: [
        "We offer a full refund within 14 days of your purchase date if you experience a critical technical issue that prevents OneTools from functioning in your supported Autodesk Revit environment, and our support team is unable to resolve it within 3 business days.",
      ],
    },
    {
      heading: "2. Duplicate Payments",
      paragraphs: [
        "If you were accidentally charged more than once for the same order, we will refund the duplicate charge in full.",
      ],
    },
    {
      heading: "3. Non-Refundable Conditions",
      list: [
        "Requests made more than 14 days after the purchase date.",
        "Incompatibility caused by hardware or third-party setups that do not meet Autodesk's minimum system requirements for Revit.",
        "Change of mind after purchase — a 15-day free trial is available before you buy, for you to evaluate OneTools first.",
        "Mid-term cancellation of an active annual license for reasons outside Section 1.",
      ],
    },
    {
      heading: "4. How to Request a Refund",
      paragraphs: [
        "Email support@onetools-bim.com with your Order ID and a description of the issue. Once approved, your refund is returned to your original payment method via Paddle/PayOS within 5–10 business days, and the associated License Key is deactivated immediately upon approval.",
      ],
    },
  ],
};

export default function RefundPolicyPage() {
  return (
    <LegalPageShell
      slug="refund-policy"
      title={TITLE}
      lastUpdated={LAST_UPDATED}
      contactHeading={CONTACT_HEADING}
      sections={SECTIONS}
    />
  );
}
