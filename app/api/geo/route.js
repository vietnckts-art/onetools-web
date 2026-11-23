// MỚI (2026-11-23): trả về mã quốc gia của khách (Vercel đoán từ IP, header x-vercel-ip-country).
// Dùng cho thống kê nguồn khách (lib/attribution.js -> getCountry). Không lưu gì ở đây.
export const dynamic = "force-dynamic";

export async function GET(request) {
  const country = request.headers.get("x-vercel-ip-country") || null;
  return Response.json({ country }, { headers: { "Cache-Control": "no-store" } });
}
