// Định dạng số tiền Paddle trả về (PricePreview) ở đơn vị nhỏ nhất (vd cent) sau khi nhân hệ số giảm giá,
// theo đúng mã tiền tệ của khu vực (vd "$30.33", "£25.20"). Trả null nếu thiếu dữ liệu để nơi gọi tự dùng
// cách khác. Dùng chung cho thẻ giá trang chủ (LandingClient) và cột Paddle (PaymentMethodPanel).
export function formatPaddleMinor(preview, factor = 1) {
  if (!preview || !Number.isFinite(preview.minor) || !preview.currency) return null;
  try {
    const nf = new Intl.NumberFormat("en-US", { style: "currency", currency: preview.currency });
    const digits = nf.resolvedOptions().maximumFractionDigits;
    return nf.format(Math.round(preview.minor * factor) / Math.pow(10, digits));
  } catch {
    return null;
  }
}

// Đọc kết quả Paddle.PricePreview() thành map { priceId: { text, minor, currency } }.
export function mapPricePreview(result) {
  const map = {};
  const currency = result?.data?.currencyCode || null;
  (result?.data?.details?.lineItems || []).forEach((item) => {
    if (item?.price?.id && item?.formattedTotals?.total) {
      map[item.price.id] = {
        text: item.formattedTotals.total,
        minor: Number(item?.totals?.total),
        currency,
      };
    }
  });
  return map;
}
