import LegalPageShell from "../legal/LegalPageShell";

export const metadata = {
  title: "Điều khoản sử dụng — OneTools",
  description:
    "Điều khoản sử dụng OneTools: giấy phép phần mềm, tài khoản người dùng, thanh toán, sở hữu trí tuệ và giới hạn trách nhiệm.",
  alternates: { canonical: "https://www.onetools-bim.com/terms" },
};

const TITLE = { vi: "Điều khoản sử dụng", en: "Terms & Conditions" };
const LAST_UPDATED = { vi: "Cập nhật lần cuối: Tháng 9/2026", en: "Last updated: September 2026" };
const CONTACT_HEADING = { vi: "12. Liên hệ", en: "12. Contact" };

const SECTIONS = {
  vi: [
    {
      heading: "1. Giới thiệu",
      paragraphs: [
        "Bằng việc truy cập website onetools-bim.com, tải, cài đặt hoặc sử dụng phần mềm OneTools, bạn đồng ý tuân thủ các Điều khoản sử dụng này. Nếu không đồng ý, vui lòng không sử dụng dịch vụ.",
      ],
    },
    {
      heading: "2. Mô tả dịch vụ",
      paragraphs: [
        "OneTools là bộ công cụ add-in mở rộng cho phần mềm Autodesk Revit, do CÔNG TY TNHH KIẾN TRÚC & NỘI THẤT ONE-ARCHITECTURE phát triển và phân phối, giúp tự động hoá các thao tác thiết kế lặp lại (dimension, đánh số, xuất bản vẽ và các tác vụ khác).",
      ],
    },
    {
      heading: "3. Giấy phép sử dụng",
      list: [
        "License được cấp cho 1 máy tính duy nhất, gắn với Machine ID / Hardware Serial Key tại thời điểm kích hoạt.",
        "Thời hạn license là 12 tháng kể từ ngày kích hoạt, mua 1 lần, không tự động gia hạn.",
        "Bạn không được sao chép, chia sẻ, cho thuê, bán lại hoặc dùng chung license key cho nhiều máy/nhiều người dùng ngoài phạm vi được cấp phép.",
      ],
    },
    {
      heading: "4. Tài khoản người dùng",
      paragraphs: [
        "Bạn chịu trách nhiệm bảo mật thông tin đăng nhập của mình và mọi hoạt động diễn ra dưới tài khoản đó. Vui lòng thông báo cho chúng tôi ngay nếu phát hiện truy cập trái phép.",
      ],
    },
    {
      heading: "5. Thanh toán & giá",
      paragraphs: [
        "Giao dịch mua license được xử lý qua Paddle (đóng vai trò Merchant of Record) hoặc PayOS. Giá hiển thị có thể thay đổi mà không cần báo trước; giá tại thời điểm bạn hoàn tất thanh toán là giá áp dụng cho đơn hàng đó.",
      ],
    },
    {
      heading: "6. Sở hữu trí tuệ",
      paragraphs: [
        "OneTools, mã nguồn, giao diện, tài liệu và toàn bộ nội dung liên quan là tài sản sở hữu trí tuệ của CÔNG TY TNHH KIẾN TRÚC & NỘI THẤT ONE-ARCHITECTURE. Việc mua license chỉ cấp cho bạn quyền sử dụng cá nhân/nội bộ, không chuyển nhượng quyền sở hữu.",
      ],
    },
    {
      heading: "7. Các hành vi bị nghiêm cấm",
      list: [
        "Dịch ngược (reverse engineer), bẻ khoá, hoặc can thiệp vào cơ chế kích hoạt/xác thực license.",
        "Phân phối lại, cho thuê hoặc bán lại phần mềm dưới bất kỳ hình thức nào.",
        "Sử dụng phần mềm cho mục đích trái pháp luật.",
      ],
    },
    {
      heading: "8. Giới hạn trách nhiệm",
      paragraphs: [
        "OneTools được cung cấp theo nguyên trạng (\"as is\"). Trong phạm vi pháp luật cho phép, chúng tôi không chịu trách nhiệm cho các thiệt hại gián tiếp, ngẫu nhiên hoặc hệ quả phát sinh từ việc sử dụng hoặc không thể sử dụng phần mềm.",
      ],
    },
    {
      heading: "9. Chấm dứt",
      paragraphs: [
        "Chúng tôi có quyền thu hồi license nếu phát hiện vi phạm các Điều khoản này, mà không hoàn lại phí đã thanh toán.",
      ],
    },
    {
      heading: "10. Luật áp dụng",
      paragraphs: [
        "Điều khoản này được điều chỉnh bởi pháp luật Việt Nam. Mọi tranh chấp phát sinh sẽ được giải quyết tại cơ quan có thẩm quyền tại Hà Nội, Việt Nam.",
      ],
    },
    {
      heading: "11. Thay đổi điều khoản",
      paragraphs: [
        "Chúng tôi có thể cập nhật Điều khoản sử dụng theo thời gian; thay đổi quan trọng sẽ được đăng tại trang này kèm ngày cập nhật mới.",
      ],
    },
  ],
  en: [
    {
      heading: "1. Introduction",
      paragraphs: [
        "By accessing onetools-bim.com, or downloading, installing, or using the OneTools software, you agree to these Terms & Conditions. If you do not agree, please do not use the service.",
      ],
    },
    {
      heading: "2. Service Description",
      paragraphs: [
        "OneTools is a suite of add-in tools for Autodesk Revit, developed and distributed by ONE-ARCHITECTURE CO., LTD, that automates repetitive design tasks (dimensioning, renumbering, sheet export, and more).",
      ],
    },
    {
      heading: "3. License Grant",
      list: [
        "The license is issued for a single computer, tied to the Machine ID / Hardware Serial Key at the time of activation.",
        "The license term is 12 months from the activation date, one-time purchase, non-auto-renewing.",
        "You may not copy, share, rent, resell, or use the license key across multiple machines or users beyond the granted scope.",
      ],
    },
    {
      heading: "4. User Accounts",
      paragraphs: [
        "You are responsible for keeping your login credentials secure and for all activity under your account. Notify us immediately if you suspect unauthorized access.",
      ],
    },
    {
      heading: "5. Payment & Pricing",
      paragraphs: [
        "License purchases are processed via Paddle (acting as Merchant of Record) or PayOS. Displayed prices may change without notice; the price at the time you complete checkout applies to that order.",
      ],
    },
    {
      heading: "6. Intellectual Property",
      paragraphs: [
        "OneTools, its source code, interface, documentation, and all related content are the intellectual property of ONE-ARCHITECTURE CO., LTD. Purchasing a license grants you a personal/internal right to use the software only — it does not transfer ownership.",
      ],
    },
    {
      heading: "7. Prohibited Conduct",
      list: [
        "Reverse-engineering, cracking, or tampering with the license activation/validation mechanism.",
        "Redistributing, renting, or reselling the software in any form.",
        "Using the software for any unlawful purpose.",
      ],
    },
    {
      heading: "8. Limitation of Liability",
      paragraphs: [
        "OneTools is provided \"as is\". To the extent permitted by law, we are not liable for indirect, incidental, or consequential damages arising from the use or inability to use the software.",
      ],
    },
    {
      heading: "9. Termination",
      paragraphs: [
        "We may revoke your license if we find you in breach of these Terms, without refunding fees already paid.",
      ],
    },
    {
      heading: "10. Governing Law",
      paragraphs: [
        "These Terms are governed by the laws of Vietnam. Any dispute will be resolved at the competent authority in Hanoi, Vietnam.",
      ],
    },
    {
      heading: "11. Changes to These Terms",
      paragraphs: [
        "We may update these Terms from time to time; material changes will be posted on this page with a new \"Last updated\" date.",
      ],
    },
  ],
};

export default function TermsPage() {
  return (
    <LegalPageShell
      slug="terms"
      title={TITLE}
      lastUpdated={LAST_UPDATED}
      contactHeading={CONTACT_HEADING}
      sections={SECTIONS}
    />
  );
}
