import LegalPageShell from "../legal/LegalPageShell";

export const metadata = {
  title: "Điều khoản sử dụng — OneTools",
  description:
    "Điều khoản sử dụng và Thỏa thuận cấp phép người dùng cuối (EULA) của OneTools: giấy phép phần mềm, dùng thử, tài khoản, cập nhật, thanh toán, sở hữu trí tuệ và giới hạn trách nhiệm.",
  alternates: { canonical: "https://www.onetools-bim.com/terms" },
};

// CẬP NHẬT 2026-11-23: trang này đồng thời là EULA của add-in (cửa sổ EULA trong OneTools chỉ hiện tóm tắt +
// link tới đây) — bổ sung: cấp phép theo tài khoản/số máy, dùng thử 15 ngày, xác minh trực tuyến, kênh phân phối
// Autodesk App Store, nhãn hiệu Autodesk.
const TITLE = { vi: "Điều khoản sử dụng", en: "Terms & Conditions" };
const LAST_UPDATED = { vi: "Cập nhật lần cuối: Tháng 11/2026", en: "Last updated: November 2026" };
const CONTACT_HEADING = { vi: "15. Liên hệ", en: "15. Contact" };

const SECTIONS = {
  vi: [
    {
      heading: "1. Giới thiệu",
      paragraphs: [
        "Bằng việc truy cập website onetools-bim.com, tải, cài đặt hoặc sử dụng phần mềm OneTools (từ website hoặc từ Autodesk App Store), bạn đồng ý tuân thủ các Điều khoản sử dụng này. Điều khoản này đồng thời là Thỏa thuận cấp phép người dùng cuối (EULA) của phần mềm OneTools. Nếu không đồng ý, vui lòng không cài đặt hoặc sử dụng phần mềm.",
      ],
    },
    {
      heading: "2. Mô tả dịch vụ",
      paragraphs: [
        "OneTools là bộ công cụ add-in mở rộng cho phần mềm Autodesk Revit, do CÔNG TY TNHH KIẾN TRÚC & NỘI THẤT ONE-ARCHITECTURE phát triển và phân phối, giúp tự động hoá các thao tác thiết kế lặp lại (view & sheet, ghi chú kích thước, đánh số, quản lý BIM, dựng MEP và các tác vụ khác).",
      ],
    },
    {
      heading: "3. Giấy phép sử dụng",
      list: [
        "OneTools được cấp phép sử dụng, không bán đứt. Chúng tôi cấp cho bạn quyền sử dụng không độc quyền, không chuyển nhượng trong thời hạn và phạm vi của License.",
        "License gắn với tài khoản OneTools (email + mật khẩu) của bạn. Mỗi License cho phép dùng trên một số máy tính (seat) nhất định tuỳ gói đã mua; khi đủ số máy, việc chuyển sang máy mới cần xác nhận bằng mã gửi về email tài khoản và máy cũ nhất sẽ bị gỡ.",
        "Thời hạn License là 12 tháng kể từ ngày kích hoạt, mua 1 lần, không tự động gia hạn.",
        "Bạn không được sao chép, cho thuê, bán lại, hoặc chia sẻ tài khoản/License cho người khác hay cho số máy vượt quá phạm vi được cấp phép.",
      ],
    },
    {
      heading: "4. Dùng thử",
      paragraphs: [
        "Tài khoản OneTools mới được dùng thử miễn phí 15 ngày với đầy đủ công cụ. Khi hết thời gian dùng thử, hoặc khi License hết hạn, các công cụ OneTools bị khoá cho tới khi bạn mua hoặc gia hạn License tại onetools-bim.com và đăng nhập bằng cùng tài khoản.",
      ],
    },
    {
      heading: "5. Tài khoản người dùng",
      paragraphs: [
        "Bạn chịu trách nhiệm bảo mật thông tin đăng nhập của mình và mọi hoạt động diễn ra dưới tài khoản đó. Vui lòng thông báo cho chúng tôi ngay nếu phát hiện truy cập trái phép.",
      ],
    },
    {
      heading: "6. Kết nối Internet và xác minh License",
      paragraphs: [
        "License được xác minh trực tuyến khi khởi động Revit và định kỳ trong lúc sử dụng; khi mất kết nối, phần mềm cho phép dùng ngoại tuyến trong một thời gian ngắn. Để xác minh, phần mềm gửi lên máy chủ email tài khoản, mã nhận diện ẩn danh của máy, phiên bản và kênh phát hành của OneTools — chi tiết tại Chính sách bảo mật. Phần mềm không đọc hay tải lên mô hình Revit của bạn.",
      ],
    },
    {
      heading: "7. Kênh phân phối và cập nhật",
      list: [
        "Bản cài đặt tải từ onetools-bim.com có chức năng thông báo và tự cài đặt bản cập nhật.",
        "Bản cài đặt từ Autodesk App Store nhận bản cập nhật qua Autodesk App Store (sau khi Autodesk duyệt); phần mềm chỉ thông báo khi có bản mới.",
        "License, tài khoản và giá áp dụng như nhau cho cả hai kênh. License luôn được mua tại onetools-bim.com.",
      ],
    },
    {
      heading: "8. Thanh toán & giá",
      paragraphs: [
        "Giao dịch mua License được xử lý qua Paddle (đóng vai trò Merchant of Record) hoặc PayOS. Giá hiển thị có thể thay đổi mà không cần báo trước; giá tại thời điểm bạn hoàn tất thanh toán là giá áp dụng cho đơn hàng đó. Việc hoàn tiền theo Chính sách hoàn tiền đăng trên website.",
      ],
    },
    {
      heading: "9. Sở hữu trí tuệ",
      paragraphs: [
        "OneTools, mã nguồn, giao diện, tài liệu và toàn bộ nội dung liên quan là tài sản sở hữu trí tuệ của CÔNG TY TNHH KIẾN TRÚC & NỘI THẤT ONE-ARCHITECTURE. Việc mua License chỉ cấp cho bạn quyền sử dụng cá nhân/nội bộ, không chuyển nhượng quyền sở hữu.",
        "Autodesk và Revit là nhãn hiệu hoặc nhãn hiệu đã đăng ký của Autodesk, Inc. OneTools không do Autodesk, Inc. sản xuất, bảo trợ hay xác nhận.",
      ],
    },
    {
      heading: "10. Các hành vi bị nghiêm cấm",
      list: [
        "Dịch ngược (reverse engineer), giải mã, bẻ khoá, hoặc can thiệp vào cơ chế kích hoạt/xác thực License.",
        "Phân phối lại, cho thuê hoặc bán lại phần mềm dưới bất kỳ hình thức nào.",
        "Chia sẻ tài khoản hoặc License vượt quá số máy/người dùng được cấp phép.",
        "Sử dụng phần mềm cho mục đích trái pháp luật.",
      ],
    },
    {
      heading: "11. Giới hạn trách nhiệm",
      paragraphs: [
        "OneTools được cung cấp theo nguyên trạng (\"as is\"), không kèm bất kỳ bảo đảm nào. Bạn nên kiểm tra lại kết quả trong mô hình trước khi phát hành hồ sơ và thường xuyên sao lưu file. Trong phạm vi pháp luật cho phép, chúng tôi không chịu trách nhiệm cho các thiệt hại gián tiếp, ngẫu nhiên hoặc hệ quả, kể cả mất dữ liệu hay lợi nhuận, phát sinh từ việc sử dụng hoặc không thể sử dụng phần mềm; tổng trách nhiệm của chúng tôi không vượt quá số tiền bạn đã trả cho License trong 12 tháng gần nhất.",
      ],
    },
    {
      heading: "12. Chấm dứt",
      paragraphs: [
        "Quyền sử dụng chấm dứt khi License hết hạn. Chúng tôi có quyền thu hồi License nếu phát hiện vi phạm các Điều khoản này, mà không hoàn lại phí đã thanh toán.",
      ],
    },
    {
      heading: "13. Luật áp dụng",
      paragraphs: [
        "Điều khoản này được điều chỉnh bởi pháp luật Việt Nam. Mọi tranh chấp phát sinh sẽ được giải quyết tại cơ quan có thẩm quyền tại Hà Nội, Việt Nam.",
      ],
    },
    {
      heading: "14. Thay đổi điều khoản",
      paragraphs: [
        "Chúng tôi có thể cập nhật Điều khoản sử dụng theo thời gian; thay đổi quan trọng sẽ được đăng tại trang này kèm ngày cập nhật mới.",
      ],
    },
  ],
  en: [
    {
      heading: "1. Introduction",
      paragraphs: [
        "By accessing onetools-bim.com, or downloading, installing, or using the OneTools software (from our website or from Autodesk App Store), you agree to these Terms & Conditions. These Terms are also the End User License Agreement (EULA) for the OneTools software. If you do not agree, please do not install or use the software.",
      ],
    },
    {
      heading: "2. Service Description",
      paragraphs: [
        "OneTools is a suite of add-in tools for Autodesk Revit, developed and distributed by ONE-ARCHITECTURE CO., LTD, that automates repetitive design tasks (views & sheets, dimensioning, renumbering, BIM management, MEP modelling, and more).",
      ],
    },
    {
      heading: "3. License Grant",
      list: [
        "OneTools is licensed, not sold. We grant you a non-exclusive, non-transferable right to use it within the term and scope of your license.",
        "Your license is tied to your OneTools account (email + password). Each license may be used on a set number of computers (seats) depending on the plan purchased; once all seats are in use, moving to a new computer requires confirmation via a code sent to the account email, and the oldest computer is removed.",
        "The license term is 12 months from the activation date, one-time purchase, non-auto-renewing.",
        "You may not copy, rent, resell, or share your account/license with other people or on more computers than permitted.",
      ],
    },
    {
      heading: "4. Trial",
      paragraphs: [
        "A new OneTools account gets a free 15-day trial with all tools unlocked. When the trial ends, or when your license expires, the OneTools tools are disabled until you purchase or renew a license at onetools-bim.com and sign in with the same account.",
      ],
    },
    {
      heading: "5. User Accounts",
      paragraphs: [
        "You are responsible for keeping your login credentials secure and for all activity under your account. Notify us immediately if you suspect unauthorized access.",
      ],
    },
    {
      heading: "6. Internet Connection and License Verification",
      paragraphs: [
        "The license is verified online when Revit starts and periodically while in use; a short offline grace period applies if the connection is lost. For verification, the software sends our server your account email, an anonymous device identifier, and the OneTools version and distribution channel — see the Privacy Policy for details. The software does not read or upload your Revit models.",
      ],
    },
    {
      heading: "7. Distribution Channels and Updates",
      list: [
        "The installer downloaded from onetools-bim.com notifies you of updates and can install them automatically.",
        "The version installed from Autodesk App Store receives updates through Autodesk App Store (after Autodesk's review); the software only notifies you when a new version is available.",
        "Licenses, accounts, and prices are the same for both channels. Licenses are always purchased at onetools-bim.com.",
      ],
    },
    {
      heading: "8. Payment & Pricing",
      paragraphs: [
        "License purchases are processed via Paddle (acting as Merchant of Record) or PayOS. Displayed prices may change without notice; the price at the time you complete checkout applies to that order. Refunds follow the Refund Policy published on our website.",
      ],
    },
    {
      heading: "9. Intellectual Property",
      paragraphs: [
        "OneTools, its source code, interface, documentation, and all related content are the intellectual property of ONE-ARCHITECTURE CO., LTD. Purchasing a license grants you a personal/internal right to use the software only — it does not transfer ownership.",
        "Autodesk and Revit are registered trademarks or trademarks of Autodesk, Inc. OneTools is not made, sponsored, or endorsed by Autodesk, Inc.",
      ],
    },
    {
      heading: "10. Prohibited Conduct",
      list: [
        "Reverse-engineering, decompiling, cracking, or tampering with the license activation/validation mechanism.",
        "Redistributing, renting, or reselling the software in any form.",
        "Sharing your account or license beyond the permitted number of computers/users.",
        "Using the software for any unlawful purpose.",
      ],
    },
    {
      heading: "11. Limitation of Liability",
      paragraphs: [
        "OneTools is provided \"as is\", without warranty of any kind. You should check results in your models before issuing documents and back up your files regularly. To the extent permitted by law, we are not liable for indirect, incidental, or consequential damages, including loss of data or profit, arising from the use or inability to use the software; our total liability is limited to the amount you paid for the license in the last 12 months.",
      ],
    },
    {
      heading: "12. Termination",
      paragraphs: [
        "Your right to use the software ends when your license expires. We may revoke your license if we find you in breach of these Terms, without refunding fees already paid.",
      ],
    },
    {
      heading: "13. Governing Law",
      paragraphs: [
        "These Terms are governed by the laws of Vietnam. Any dispute will be resolved at the competent authority in Hanoi, Vietnam.",
      ],
    },
    {
      heading: "14. Changes to These Terms",
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
