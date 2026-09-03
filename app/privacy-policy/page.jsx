import LegalPageShell from "../legal/LegalPageShell";

export const metadata = {
  title: "Chính sách bảo mật — OneTools",
  description:
    "Chính sách bảo mật của OneTools: thông tin chúng tôi thu thập, cách sử dụng, chia sẻ với bên thứ ba và quyền của bạn đối với dữ liệu cá nhân.",
  alternates: { canonical: "https://www.onetools-bim.com/privacy-policy" },
};

const TITLE = { vi: "Chính sách bảo mật", en: "Privacy Policy" };
const LAST_UPDATED = { vi: "Cập nhật lần cuối: Tháng 9/2026", en: "Last updated: September 2026" };
const CONTACT_HEADING = { vi: "7. Liên hệ", en: "7. Contact Us" };

const SECTIONS = {
  vi: [
    {
      heading: "1. Thông tin chúng tôi thu thập",
      list: [
        "Thông tin cá nhân: Họ tên, email, số điện thoại và thông tin thanh toán do bạn cung cấp khi đăng ký tài khoản hoặc thanh toán.",
        "Định danh phần cứng: Machine ID / Hardware Serial Key, dùng để cấp phát và xác thực license phần mềm OneTools.",
        "Dữ liệu thanh toán: Chúng tôi KHÔNG lưu trữ hay xử lý trực tiếp số thẻ tín dụng/tài khoản ngân hàng của bạn trên máy chủ của mình. Toàn bộ giao dịch được xử lý bảo mật qua các đối tác thanh toán được uỷ quyền là Paddle và PayOS. Khi thanh toán qua Paddle, Paddle đóng vai trò Merchant of Record (bên bán chính thức về mặt pháp lý) và giao dịch của bạn tuân theo Chính sách bảo mật riêng của Paddle.",
      ],
    },
    {
      heading: "2. Mục đích sử dụng thông tin",
      list: [
        "Cấp phát, quản lý và xác thực license key phần mềm OneTools.",
        "Gửi thông báo tài khoản, hoá đơn, nhắc gia hạn license và hỗ trợ kỹ thuật khi có sự cố.",
        "Cải thiện hiệu năng phần mềm và trải nghiệm người dùng.",
      ],
    },
    {
      heading: "3. Thời gian lưu trữ dữ liệu",
      paragraphs: [
        "Chúng tôi lưu trữ dữ liệu tài khoản và license của bạn trong suốt thời gian tài khoản còn hoạt động, và trong phạm vi cần thiết để tuân thủ nghĩa vụ pháp lý/thuế. Bạn có thể yêu cầu xoá dữ liệu bất kỳ lúc nào (xem Mục 5).",
      ],
    },
    {
      heading: "4. Bảo vệ & chia sẻ dữ liệu",
      paragraphs: [
        "Chúng tôi không bán, trao đổi hay cho thuê thông tin cá nhân của bạn cho bên thứ ba. Dữ liệu chỉ được chia sẻ với các đối tác hạ tầng cần thiết để vận hành OneTools:",
      ],
      list: [
        "Supabase — lưu trữ cơ sở dữ liệu tài khoản.",
        "Paddle / PayOS — xử lý thanh toán.",
        "Đối tác gửi email giao dịch (thông báo, hoá đơn, nhắc gia hạn).",
      ],
    },
    {
      heading: "5. Quyền của bạn",
      paragraphs: [
        "Bạn có quyền yêu cầu truy xuất, chỉnh sửa hoặc xoá vĩnh viễn dữ liệu cá nhân của mình khỏi hệ thống, cũng như từ chối nhận email marketing bất kỳ lúc nào. Để thực hiện các quyền này, liên hệ chúng tôi theo thông tin tại Mục 7.",
      ],
    },
    {
      heading: "6. Thay đổi chính sách",
      paragraphs: [
        "Chính sách này có thể được cập nhật theo thời gian. Mọi thay đổi quan trọng sẽ được đăng tại trang này kèm ngày cập nhật mới.",
      ],
    },
  ],
  en: [
    {
      heading: "1. Information We Collect",
      list: [
        "Personal Information: Name, email address, phone number, and billing information you provide when creating an account or checking out.",
        "Hardware Identifiers: Machine ID / Hardware Serial Key, used strictly to issue and verify your OneTools license activation.",
        "Payment Data: We do NOT store or process your credit card or bank account details on our own servers. All transactions are securely handled by our authorized payment processors, Paddle and PayOS. When you check out via Paddle, Paddle acts as the Merchant of Record and your transaction is subject to Paddle's own Privacy Policy.",
      ],
    },
    {
      heading: "2. How We Use Your Information",
      list: [
        "To issue, manage, and validate your OneTools license key.",
        "To send account updates, receipts, license renewal reminders, and technical support notices.",
        "To improve our software performance and user experience.",
      ],
    },
    {
      heading: "3. Data Retention",
      paragraphs: [
        "We retain your account and license data for as long as your account is active, and as needed to meet our legal and tax obligations. You may request deletion at any time (see Section 5).",
      ],
    },
    {
      heading: "4. Data Protection & Sharing",
      paragraphs: [
        "We do not sell, trade, or rent your personal information to third parties. Data is shared only with the infrastructure partners needed to run OneTools:",
      ],
      list: [
        "Supabase — account database hosting.",
        "Paddle / PayOS — payment processing.",
        "Our transactional email provider (notifications, receipts, renewal reminders).",
      ],
    },
    {
      heading: "5. Your Rights",
      paragraphs: [
        "You may request access to, correction of, or deletion of your personal data, and opt out of marketing emails at any time. To exercise these rights, contact us using the details in Section 7.",
      ],
    },
    {
      heading: "6. Changes to This Policy",
      paragraphs: [
        "We may update this Privacy Policy from time to time. Material changes will be posted on this page with a new \"Last updated\" date.",
      ],
    },
  ],
};

export default function PrivacyPolicyPage() {
  return (
    <LegalPageShell
      slug="privacy-policy"
      title={TITLE}
      lastUpdated={LAST_UPDATED}
      contactHeading={CONTACT_HEADING}
      sections={SECTIONS}
    />
  );
}
