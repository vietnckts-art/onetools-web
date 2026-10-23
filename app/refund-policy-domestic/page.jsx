import LegalPageShell from "../legal/LegalPageShell";

// Chính sách hoàn tiền DÀNH RIÊNG cho khách thanh toán qua PayOS (trong nước) — tạo mới 2026-10-23
// theo yêu cầu user, TÁCH HẲN khỏi /refund-policy (bản dành cho khách thanh toán qua Paddle, PHẢI giữ
// vô điều kiện 14 ngày vì Paddle — merchant of record — từng chặn payout khi chính sách công khai có
// điều kiện/ngoại lệ, xem claude/PaddleRegistration_BankPayout_notes.md). Trang này KHÔNG áp dụng cho
// giao dịch Paddle — chỉ link từ checkbox "Tôi đồng ý..." ở cột PayOS trong app/checkout/PaymentMethodPanel.jsx.
export const metadata = {
  title: "Chính sách hoàn tiền (Trong nước) — OneTools",
  description:
    "Chính sách hoàn tiền của OneTools cho khách thanh toán trong nước qua PayOS: áp dụng khi có lỗi kỹ thuật không khắc phục được hoặc sai khác so với quảng cáo.",
  alternates: { canonical: "https://www.onetools-bim.com/refund-policy-domestic" },
};

const TITLE = { vi: "Chính sách hoàn tiền (Trong nước)", en: "Refund Policy (Domestic)" };
const LAST_UPDATED = { vi: "Cập nhật lần cuối: Tháng 10/2026", en: "Last updated: October 2026" };
const CONTACT_HEADING = { vi: "5. Liên hệ", en: "5. Contact" };

const SECTIONS = {
  vi: [
    {
      heading: "Loại giấy phép",
      paragraphs: [
        "OneTools được bán dưới hình thức license mua 1 lần, thời hạn sử dụng 12 tháng kể từ ngày kích hoạt. Đây KHÔNG phải gói subscription — license không tự động gia hạn và không tự trừ phí định kỳ.",
      ],
    },
    {
      heading: "Phạm vi áp dụng",
      paragraphs: [
        "Chính sách này áp dụng RIÊNG cho đơn hàng thanh toán qua PayOS (chuyển khoản / QR ngân hàng trong nước). Khách thanh toán quốc tế qua Paddle (thẻ Visa/Mastercard/PayPal) áp dụng Chính sách hoàn tiền (Quốc tế) riêng — bảo đảm hoàn tiền vô điều kiện trong 14 ngày.",
      ],
    },
    {
      heading: "1. Điều kiện hoàn tiền",
      paragraphs: [
        "Chúng tôi hoàn tiền khi thuộc một trong hai trường hợp sau, với yêu cầu được gửi trong vòng 14 ngày kể từ ngày mua:",
      ],
      list: [
        "Sản phẩm gặp lỗi kỹ thuật thực sự khiến không thể sử dụng được, và đội ngũ hỗ trợ không khắc phục được trong thời gian hợp lý sau khi tiếp nhận.",
        "Sản phẩm có sai khác rõ ràng so với mô tả/tính năng được quảng cáo công khai trên website onetools-bim.com.",
      ],
    },
    {
      heading: "2. Quy trình xét duyệt",
      paragraphs: [
        "Gửi mô tả chi tiết lỗi kèm bằng chứng (ảnh chụp màn hình, video, hoặc file log lỗi) đến support@onetools-bim.com. Đội ngũ kỹ thuật sẽ tiếp nhận, xác minh và thử khắc phục trong một khoảng thời gian hợp lý trước khi đưa ra quyết định hoàn tiền. Yêu cầu hoàn tiền vì lý do đổi ý hoặc không liên quan đến lỗi/sai khác nêu trên sẽ không được chấp nhận theo chính sách này.",
      ],
    },
    {
      heading: "3. Thanh toán trùng lặp",
      paragraphs: [
        "Nếu bạn vô tình bị tính phí nhiều lần cho cùng một đơn hàng, chúng tôi sẽ hoàn lại toàn bộ khoản phí trùng lặp, không giới hạn bởi mốc 14 ngày ở Mục 1.",
      ],
    },
    {
      heading: "4. Thời gian hoàn tiền",
      paragraphs: [
        "Sau khi yêu cầu được chấp thuận, tiền sẽ được hoàn về đúng phương thức thanh toán PayOS ban đầu trong vòng 5–10 ngày làm việc, và License Key tương ứng sẽ bị vô hiệu hoá khi yêu cầu được xử lý.",
      ],
    },
  ],
  en: [
    {
      heading: "License Type",
      paragraphs: [
        "OneTools is sold as a one-time purchase with a 12-month term from the activation date. This is NOT a subscription — the license does not auto-renew and does not charge recurring fees.",
      ],
    },
    {
      heading: "Scope",
      paragraphs: [
        "This policy applies ONLY to orders paid via PayOS (domestic Vietnamese bank transfer / QR). International customers paying via Paddle (Visa/Mastercard/PayPal) are covered by a separate (International) Refund Policy — an unconditional 14-day money-back guarantee.",
      ],
    },
    {
      heading: "1. Refund Conditions",
      paragraphs: [
        "We issue a refund in either of the following cases, provided the request is made within 14 days of purchase:",
      ],
      list: [
        "The product has a genuine technical issue that makes it unusable, and our support team is unable to resolve it within a reasonable time after being notified.",
        "The product clearly differs from the features publicly advertised on onetools-bim.com.",
      ],
    },
    {
      heading: "2. Review Process",
      paragraphs: [
        "Send a detailed description of the issue along with evidence (screenshots, video, or error logs) to support@onetools-bim.com. Our technical team will review, attempt to resolve the issue within a reasonable time, and then decide on the refund. Requests made simply because you changed your mind, unrelated to the issues above, are not covered by this policy.",
      ],
    },
    {
      heading: "3. Duplicate Payments",
      paragraphs: [
        "If you were accidentally charged more than once for the same order, we will refund the duplicate charge in full, regardless of the 14-day window in Section 1.",
      ],
    },
    {
      heading: "4. Refund Timeline",
      paragraphs: [
        "Once approved, your refund is returned to your original PayOS payment method within 5–10 business days, and the associated License Key is deactivated once the request is processed.",
      ],
    },
  ],
};

export default function RefundPolicyDomesticPage() {
  return (
    <LegalPageShell
      slug="refund-policy-domestic"
      title={TITLE}
      lastUpdated={LAST_UPDATED}
      contactHeading={CONTACT_HEADING}
      sections={SECTIONS}
    />
  );
}
