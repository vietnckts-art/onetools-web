import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, serviceRoleKey);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function jsonResponse(body: object, statusCode = 200) {
  return new Response(JSON.stringify(body), {
    status: statusCode,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}

// ===================================================================================================
// MỚI (2026-11-23, Autodesk App Store): KÊNH PHÁT HÀNH. Add-in gửi `channel` = "web" | "store".
//  - Bản mới nhất: web = releases.is_latest (như cũ); store = bản releases.on_store = true có số phiên bản
//    CAO NHẤT (bấm "Đã có trên Store" trong /admin sau khi Autodesk duyệt). Store không có download_url.
//  - Khoá buộc cập nhật theo kênh: bảng app_channel_policy.min_version - máy chạy bản THẤP HƠN min_version
//    của kênh mình -> status "force_update" (add-in chặn tool + báo cập nhật; bản Store báo cài từ Store).
//  - Response thêm `update_channel` để add-in bản Store biết server đã tính riêng cho Store.
// ===================================================================================================
function parseVer(v: unknown): number[] | null {
  if (typeof v !== "string" || !v.trim()) return null;
  const t = v.trim().replace(/^[vV]/, "").split(/[-+ ]/)[0];
  const parts = t.split(".").map((x) => Number(x));
  return parts.some((n) => !Number.isFinite(n)) ? null : parts;
}

// >0 nếu a > b, <0 nếu a < b, 0 nếu bằng hoặc không so được.
function compareVer(a: unknown, b: unknown): number {
  const pa = parseVer(a), pb = parseVer(b);
  if (!pa || !pb) return 0;
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const d = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (d !== 0) return d;
  }
  return 0;
}

function normalizeChannel(c: unknown): "web" | "store" {
  return c === "store" ? "store" : "web";
}

const RELEASE_COLS = "version, download_url, file_name, sha256, release_notes_vi, release_notes_en, revit_versions";

async function getLatestRelease(channel: "web" | "store") {
  if (channel === "store") {
    const { data } = await supabase.from("releases").select(RELEASE_COLS).eq("on_store", true);
    let best: any = null;
    for (const r of data ?? []) if (!best || compareVer(r.version, best.version) > 0) best = r;
    return best;
  }
  const { data } = await supabase.from("releases").select(RELEASE_COLS).eq("is_latest", true).limit(1).maybeSingle();
  return data;
}

// Trả về response "force_update" nếu bản đang chạy thấp hơn min_version của kênh; null nếu không chặn.
// Lỗi đọc bảng (chưa chạy SQL) -> không chặn ai.
async function checkForceUpdate(channel: "web" | "store", currentVersion: unknown) {
  try {
    const { data: policy } = await supabase
      .from("app_channel_policy")
      .select("min_version, message_vi, message_en")
      .eq("channel", channel)
      .maybeSingle();
    if (!policy?.min_version || !currentVersion) return null;
    if (compareVer(currentVersion, policy.min_version) >= 0) return null;
    return {
      status: "force_update",
      message: policy.message_vi || policy.message_en || null,
      min_version: policy.min_version,
      update_channel: channel,
    };
  } catch {
    return null;
  }
}

async function buildLicenseResponse(license: any, channel: "web" | "store", currentVersion: unknown) {
  const latestRelease = await getLatestRelease(channel);
  const updateAvailable = channel === "store"
    ? !!latestRelease && !!currentVersion && compareVer(latestRelease.version, currentVersion) > 0
    : !!latestRelease && !!currentVersion && latestRelease.version !== currentVersion;

  return {
    status: license.status,
    expires_at: license.expires_at,
    license_type: license.license_type ?? "trial",
    license_key: license.license_key,
    latest_version: latestRelease?.version ?? null,
    // Bản Store không được tự tải bản cài -> không gửi link tải.
    download_url: channel === "store" ? null : latestRelease?.download_url ?? null,
    file_name: channel === "store" ? null : latestRelease?.file_name ?? null,
    sha256: channel === "store" ? null : latestRelease?.sha256 ?? null,
    release_notes_vi: latestRelease?.release_notes_vi ?? null,
    release_notes_en: latestRelease?.release_notes_en ?? null,
    revit_versions: latestRelease?.revit_versions ?? null,
    update_available: updateAvailable,
    update_channel: channel,
  };
}

/// Xác nhận mã OTP đã gửi từ activate-seat (khi hết ghế) - nếu đúng: GỠ ghế CŨ NHẤT của License này
/// (theo last_seen_at) và GÁN ghế cho máy hiện tại - máy cũ ngừng hoạt động ngay từ lần poll tiếp theo.
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const jwt = authHeader.replace("Bearer ", "");

    const { data: userData, error: userError } = await supabase.auth.getUser(jwt);
    if (userError || !userData.user) {
      return jsonResponse({ status: "error", message: "Phiên đăng nhập không hợp lệ hoặc đã hết hạn." }, 401);
    }

    // SỬA (2026-10-21): nhận thêm preferred_license_key - PHẢI khớp với license mà activate-seat đã cấp
    // OTP, nếu không server chọn license khác -> OTP báo "không đúng" oan (khi tài khoản có nhiều license).
    // SỬA (2026-11-23): nhận thêm channel ("web" | "store").
    const { hwid, otp_code, current_version, preferred_license_key, channel: rawChannel } = await req.json();
    const channel = normalizeChannel(rawChannel);
    if (!hwid || !otp_code) {
      return jsonResponse({ status: "error", message: "Thiếu thông tin bắt buộc." }, 400);
    }

    // ----- Chọn License giống HỆT activate-seat (preferred -> ghế sẵn có -> active/trial mới nhất) -----
    const { data: licenses } = await supabase
      .from("licenses")
      .select("*")
      .eq("owner_user_id", userData.user.id)
      .order("created_at", { ascending: false });

    if (!licenses || licenses.length === 0) {
      return jsonResponse({ status: "invalid", message: "Tài khoản chưa có License nào." });
    }

    const now = new Date();
    const valid = licenses.filter(
      (l) => (l.status === "active" || l.status === "trial") && new Date(l.expires_at) > now,
    );
    if (valid.length === 0) {
      return jsonResponse({ status: "expired", message: "License của tài khoản đã hết hạn." });
    }

    // SỬA (2026-10-26): chọn license giống HỆT activate-seat - active (trả phí) ưu tiên trước Trial.
    const validIds = valid.map((l) => l.id);
    const { data: allSeats } = await supabase
      .from("license_seats")
      .select("license_id, device_hwid")
      .in("license_id", validIds);
    const usedCount: Record<string, number> = {};
    const mySeatIds = new Set<string>();
    for (const s of allSeats ?? []) {
      usedCount[s.license_id] = (usedCount[s.license_id] ?? 0) + 1;
      if (s.device_hwid === hwid) mySeatIds.add(s.license_id);
    }
    const canUse = (l: any) => mySeatIds.has(l.id) || (usedCount[l.id] ?? 0) < l.max_seats;

    const actives = valid.filter((l) => l.status === "active");
    const trials = valid.filter((l) => l.status === "trial");
    const pickUsable = (list: any[]) =>
      list.find((l) => mySeatIds.has(l.id)) ?? list.find((l) => canUse(l)) ?? null;

    let license =
      (preferred_license_key ? valid.find((l) => l.license_key === preferred_license_key) : null) ?? null;
    if (!license) license = pickUsable(actives);
    if (!license) license = pickUsable(trials);
    if (!license) license = actives[0] ?? trials[0] ?? null;

    if (!license) {
      return jsonResponse({ status: "expired", message: "License của tài khoản đã hết hạn." });
    }

    // MỚI (2026-11-23): khoá buộc cập nhật theo kênh (app_channel_policy.min_version).
    const forced = await checkForceUpdate(channel, current_version);
    if (forced) return jsonResponse(forced);

    // ----- Xác minh mã OTP: đúng license_key + đúng hwid đã xin + đúng mã + chưa dùng + chưa hết hạn -----
    const { data: otpRow, error: otpError } = await supabase
      .from("license_transfer_otp")
      .select("*")
      .eq("license_key", license.license_key)
      .eq("requesting_hwid", hwid)
      .eq("otp_code", otp_code)
      .eq("used", false)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (otpError || !otpRow) {
      return jsonResponse({ status: "error", message: "Mã xác nhận không đúng." }, 400);
    }

    if (new Date(otpRow.expires_at) < now) {
      return jsonResponse({ status: "error", message: "Mã xác nhận đã hết hạn - vui lòng thử lại." }, 400);
    }

    await supabase.from("license_transfer_otp").update({ used: true }).eq("id", otpRow.id);

    // ----- Gỡ ghế CŨ NHẤT (last_seen_at nhỏ nhất) để nhường chỗ cho máy hiện tại -----
    const { data: oldestSeat } = await supabase
      .from("license_seats")
      .select("id")
      .eq("license_id", license.id)
      .order("last_seen_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (oldestSeat) {
      await supabase.from("license_seats").delete().eq("id", oldestSeat.id);
    }

    // SỬA (2026-11-12): ghi phiên bản OneTools của máy mới để thống kê lượng cập nhật.
    const versionStr = typeof current_version === "string" && current_version.trim() ? current_version.trim() : null;
    await supabase.from("license_seats").insert({
      license_id: license.id,
      device_hwid: hwid,
      app_version: versionStr,
      version_updated_at: versionStr ? now.toISOString() : null,
    });

    // ----- Thông tin bản cập nhật mới nhất THEO KÊNH (2026-11-23) - giữ shape response cũ + update_channel -----
    return jsonResponse(await buildLicenseResponse(license, channel, current_version));
  } catch (e) {
    return jsonResponse({ status: "error", message: String(e) }, 500);
  }
});