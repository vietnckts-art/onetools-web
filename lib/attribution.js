// =====================================================================================================
// MỚI (2026-11-23): GHI NGUỒN KHÁCH (attribution) - khách đến từ quảng cáo nào.
//
// Gắn tham số UTM vào link quảng cáo, ví dụ:
//   YouTube (quốc tế):  https://onetools-bim.com/en?utm_source=youtube&utm_campaign=intl-video
//   Facebook (trong nước): https://onetools-bim.com/?utm_source=facebook&utm_campaign=vn-fb
// Khi khách vào web, captureAttribution() lưu nguồn vào localStorage (30 ngày) - sau đó lúc bấm "Tải về" hoặc
// đăng ký trên web, nguồn này được gửi kèm để thống kê trong /admin → tab "Nguồn khách".
//
// Không có UTM thì tự đoán: gclid -> google, fbclid -> facebook, nếu không thì theo trang giới thiệu (referrer,
// vd youtube.com / facebook.com / google.com). Vào thẳng web (gõ địa chỉ / bookmark) = "direct".
// Một nguồn mới có UTM/click-id luôn ghi đè nguồn cũ; "direct" KHÔNG ghi đè nguồn đã có (giữ nguồn quảng cáo).
// =====================================================================================================

const KEY = "onetools-attribution";
const TTL_MS = 30 * 24 * 60 * 60 * 1000;

function cut(v, n) {
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t ? t.slice(0, n) : null;
}

function sourceFromReferrer(host) {
  if (!host) return null;
  const h = host.toLowerCase();
  if (h.includes("youtube.") || h === "youtu.be") return "youtube";
  if (h.includes("facebook.") || h === "fb.com" || h.includes("fb.me") || h.includes("messenger.")) return "facebook";
  if (h.includes("google.")) return "google";
  if (h.includes("bing.")) return "bing";
  if (h.includes("zalo")) return "zalo";
  if (h.includes("linkedin.") || h === "lnkd.in") return "linkedin";
  if (h.includes("autodesk.")) return "autodesk";
  return h.replace(/^www\./, "").slice(0, 40);
}

export function captureAttribution() {
  if (typeof window === "undefined") return;
  try {
    const p = new URLSearchParams(window.location.search);
    let source = cut(p.get("utm_source"), 40);
    const campaign = cut(p.get("utm_campaign"), 60);

    let referrerHost = null;
    try {
      if (document.referrer) {
        const r = new URL(document.referrer);
        if (!r.hostname.endsWith("onetools-bim.com")) referrerHost = r.hostname;
      }
    } catch (e) {}

    if (!source && p.get("gclid")) source = "google";
    if (!source && p.get("fbclid")) source = "facebook";
    if (!source) source = sourceFromReferrer(referrerHost);

    const existing = readRaw();
    if (!source) {
      // Vào thẳng: chỉ ghi "direct" khi chưa có nguồn nào còn hạn.
      if (existing) return;
      source = "direct";
    }

    window.localStorage.setItem(
      KEY,
      JSON.stringify({
        utm_source: source.toLowerCase(),
        utm_campaign: campaign,
        referrer: referrerHost,
        ts: Date.now(),
      }),
    );
  } catch (e) {}
}

function readRaw() {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const a = JSON.parse(raw);
    if (!a || !a.ts || Date.now() - a.ts > TTL_MS) return null;
    return a;
  } catch (e) {
    return null;
  }
}

/** { utm_source, utm_campaign, referrer } hoặc giá trị rỗng nếu chưa có. */
export function getAttribution() {
  if (typeof window === "undefined") return { utm_source: null, utm_campaign: null, referrer: null };
  const a = readRaw();
  return {
    utm_source: a?.utm_source ?? null,
    utm_campaign: a?.utm_campaign ?? null,
    referrer: a?.referrer ?? null,
  };
}

/** Mã quốc gia 2 ký tự (từ IP, do Vercel đoán) - gọi /api/geo, nhớ trong phiên. */
export async function getCountry() {
  if (typeof window === "undefined") return null;
  try {
    const cached = window.sessionStorage.getItem("onetools-country");
    if (cached) return cached === "-" ? null : cached;
    const res = await fetch("/api/geo", { cache: "no-store" });
    const data = await res.json();
    const c = typeof data?.country === "string" && data.country ? data.country.toUpperCase() : null;
    window.sessionStorage.setItem("onetools-country", c || "-");
    return c;
  } catch (e) {
    return null;
  }
}

/**
 * Meta (Facebook) Pixel: bắn sự kiện chuẩn (vd "Lead", "CompleteRegistration") nếu đã cấu hình
 * NEXT_PUBLIC_META_PIXEL_ID (xem app/layout.jsx). Chưa cấu hình / bị chặn quảng cáo = bỏ qua, không lỗi.
 */
export function trackMetaEvent(name, params) {
  if (typeof window === "undefined") return;
  if (!process.env.NEXT_PUBLIC_META_PIXEL_ID || !name || typeof window.fbq !== "function") return;
  try {
    if (params) window.fbq("track", name, params);
    else window.fbq("track", name);
  } catch (e) {}
}

/** Google Ads: bắn sự kiện chuyển đổi nếu đã cấu hình NEXT_PUBLIC_GADS_ID + label (xem app/layout.jsx). */
export function trackAdsConversion(label) {
  if (typeof window === "undefined") return;
  const id = process.env.NEXT_PUBLIC_GADS_ID;
  if (!id || !label || typeof window.gtag !== "function") return;
  try {
    window.gtag("event", "conversion", { send_to: `${id}/${label}` });
  } catch (e) {}
}
