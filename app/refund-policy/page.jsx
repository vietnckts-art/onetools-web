import LegalPageShell from "../legal/LegalPageShell";

export const metadata = {
  title: "Chính sách hoàn tiền — OneTools",
  description:
    "Chính sách hoàn tiền của OneTools: bảo đảm hoàn tiền 100% trong 14 ngày, không cần lý do.",
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
        "OneTools được bán dưới hình thức license mua 1 lần, thời hạn sử dụng 12 tháng kể từ ngày kích hoạt. Đây KHÔNG phải gói subscription — license không tự động gia hạn và không tự trừ phí định kỳ.",
      ],
    },
    {
      heading: "1. Bảo đảm hoàn tiền trong 14 ngày",
      paragraphs: [
        "Chúng tôi bảo đảm hoàn tiền 100% trong vòng 14 ngày kể từ ngày mua — không cần lý do. Nếu bạn không hài lòng với OneTools vì bất kỳ lý do gì, chỉ cần liên hệ support@onetools-bim.com trong vòng 14 ngày kể từ ngày mua để được hoàn tiền toàn bộ.",
      ],
    },
    {
      heading: "2. Thanh toán trùng lặp",
      paragraphs: [
        "Nếu bạn vô tình bị tính phí nhiều lần cho cùng một đơn hàng, chúng tôi sẽ hoàn lại toàn bộ khoản phí trùng lặp, không giới hạn bởi mốc 14 ngày ở Mục 1.",
      ],
    },
    {
      heading: "3. Quy trình yêu cầu hoàn tiền",
      paragraphs: [
        "Gửi email đến support@onetools-bim.com kèm Mã đơn hàng (Order ID). Tiền sẽ được hoàn về đúng phương thức thanh toán ban đầu qua Paddle/PayOS trong vòng 5–10 ngày làm việc, và License Key tương ứng sẽ bị vô hiệu hoá khi yêu cầu được xử lý.",
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
      heading: "1. 14-Day Money-Back Guarantee",
      paragraphs: [
        "We offer a full refund within 14 days of your purchase date. No questions asked. If you're not satisfied with OneTools for any reason, contact support@onetools-bim.com within 14 days of your purchase for a full refund.",
      ],
    },
    {
      heading: "2. Duplicate Payments",
      paragraphs: [
        "If you were accidentally charged more than once for the same order, we will refund the duplicate charge in full, regardless of the 14-day window in Section 1.",
      ],
    },
    {
      heading: "3. How to Request a Refund",
      paragraphs: [
        "Email support@onetools-bim.com with your Order ID. Your refund is returned to your original payment method via Paddle/PayOS within 5–10 business days, and the associated License Key is deactivated once the request is processed.",
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
