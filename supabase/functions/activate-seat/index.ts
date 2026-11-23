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

// Gửi email OTP qua Resend khi cần xác nhận đổi máy.
async function sendSeatOtpEmail(toEmail: string, otpCode: string, licenseKey: string): Promise<boolean> {
  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  if (!resendApiKey) return false;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "OneTools <support@onetools-bim.com>",
        to: [toEmail],
        subject: "Device change confirmation code / Mã xác nhận đổi máy - OneTools",
        html:
          `<p>There is a request to sign in to your OneTools account (License <b>${licenseKey}</b>) on a new computer.</p>` +
          `<p>If this is you, enter the confirmation code below in ONE Tools to transfer access to this computer (the old computer will stop working):</p>` +
          `<p style="font-size:28px;font-weight:bold;letter-spacing:4px;">${otpCode}</p>` +
          `<p>This code is valid for <b>10 minutes</b>.</p>` +
          `<p style="color:#888;font-size:12px;">If you didn't make this request, someone may be trying to use your account - please change your password immediately.</p>` +
          `<hr style="border:none;border-top:1px solid #ddd;margin:24px 0;" />` +
          `<p>Có yêu cầu đăng nhập tài khoản OneTools (License <b>${licenseKey}</b>) trên một máy tính mới.</p>` +
          `<p>Nếu đây đúng là bạn, nhập mã xác nhận sau vào ONE Tools để chuyển quyền sang máy này (máy cũ sẽ ngừng hoạt động):</p>` +
          `<p style="font-size:28px;font-weight:bold;letter-spacing:4px;">${otpCode}</p>` +
          `<p>Mã có hiệu lực trong <b>10 phút</b>.</p>` +
          `<p style="color:#888;font-size:12px;">Nếu bạn không thực hiện yêu cầu này, có thể ai đó đang cố dùng tài khoản của bạn - vui lòng đổi mật khẩu ngay.</p>`,
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
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

    // SỬA (2026-10-21): nhận thêm preferred_license_key - key mà MÁY NÀY đã chủ động chọn dùng.
    // SỬA (2026-11-23): nhận thêm channel ("web" | "store") - add-in bản Autodesk App Store gửi "store".
    const { hwid, current_version, confirm_transfer, preferred_license_key, channel: rawChannel } = await req.json();
    const channel = normalizeChannel(rawChannel);
    if (!hwid) {
      return jsonResponse({ status: "error", message: "Thiếu hwid" }, 400);
    }

    // ----- Tất cả License thuộc tài khoản này (mới nhất trước) -----
    const { data: licenses } = await supabase
      .from("licenses")
      .select("*")
      .eq("owner_user_id", userData.user.id)
      .order("created_at", { ascending: false });

    if (!licenses || licenses.length === 0) {
      return jsonResponse({ status: "invalid", message: "Tài khoản chưa có License nào." });
    }

    const now = new Date();

    // SỬA (2026-10-21): CHỌN LICENSE theo thứ tự ưu tiên, hỗ trợ tài khoản có NHIỀU license:
    //   1. preferred_license_key (máy đã chọn) - nếu còn hợp lệ. Đây là "ưu tiên MỀM": không tìm thấy/
    //      hết hạn thì KHÔNG chặn, rơi xuống bước sau (tránh khóa oan khi key cũ đã hết hạn).
    //   2. License mà CHÍNH MÁY NÀY đã có ghế (ổn định - đừng nhảy máy sang license khác giữa chừng).
    //   3. Active còn hạn mới nhất -> Trial còn hạn mới nhất (như logic cũ).
    const valid = licenses.filter(
      (l) => (l.status === "active" || l.status === "trial") && new Date(l.expires_at) > now,
    );
    if (valid.length === 0) {
      return jsonResponse({ status: "expired", message: "License của tài khoản đã hết hạn." });
    }

    // SỬA (2026-10-26): lấy TOÀN BỘ seat của các license hợp lệ trong 1 query - vừa đếm số ghế đã dùng,
    // vừa biết máy này đang ngồi ở license nào. Dùng cho khâu chọn license bên dưới.
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

    const actives = valid.filter((l) => l.status === "active"); // đã sort created_at desc
    const trials = valid.filter((l) => l.status === "trial");

    // Thứ tự ưu tiên chọn license:
    //   1. preferred_license_key máy chủ động chọn (ưu tiên MỀM - không có/hết hạn thì bỏ qua).
    //   2. License ACTIVE (trả phí) dùng được: máy đang ngồi -> còn ghế. (NÂNG CẤP Trial->Pro ở đây:
    //      active luôn được ưu tiên TRƯỚC Trial, kể cả khi máy đang có ghế Trial.)
    //   3. License Trial dùng được.
    //   4. Fallback (không cái nào còn ghế -> trả về cái tốt nhất để đi luồng seat_full/OTP).
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

    // ----- Gán "seat" cho máy hiện tại (nếu chưa có) - từ chối nếu đã dùng hết số máy cho phép -----
    const { data: existingSeat } = await supabase
      .from("license_seats")
      .select("id, app_version")
      .eq("license_id", license.id)
      .eq("device_hwid", hwid)
      .maybeSingle();

    // SỬA (2026-11-12): ghi phiên bản OneTools máy đang chạy để thống kê lượng cập nhật.
    // version_updated_at chỉ đổi khi phiên bản khác lần trước (= thời điểm máy lên bản mới).
    const versionStr = typeof current_version === "string" && current_version.trim() ? current_version.trim() : null;

    if (existingSeat) {
      const seatUpdate: Record<string, unknown> = { last_seen_at: now.toISOString() };
      if (versionStr && existingSeat.app_version !== versionStr) {
        seatUpdate.app_version = versionStr;
        seatUpdate.version_updated_at = now.toISOString();
      }
      await supabase
        .from("license_seats")
        .update(seatUpdate)
        .eq("id", existingSeat.id);
    } else {
      const { count } = await supabase
        .from("license_seats")
        .select("id", { count: "exact", head: true })
        .eq("license_id", license.id);

      if ((count ?? 0) >= license.max_seats) {
        // Hết ghế - 2 bước: (1) chưa confirm -> chỉ báo seat_full; (2) confirm_transfer=true -> gửi OTP.
        if (!confirm_transfer) {
          return jsonResponse({
            status: "seat_full",
            message:
              "License đã được kích hoạt trên máy khác. Bạn cần thu hồi lại License để dùng cho máy này.",
          });
        }

        // SỬA (2026-10-21): OTP gửi về EMAIL TÀI KHOẢN ĐANG ĐĂNG NHẬP (danh tính đã xác thực), KHÔNG dùng
        // licenses.email nữa - trước đây nếu licenses.email khác email đăng nhập thì mã về sai hộp thư,
        // người dùng không nhận được -> bị khóa oan. Fallback về licenses.email nếu vì lý do nào đó email
        // tài khoản trống (gần như không xảy ra).
        const otpRecipient = userData.user.email ?? license.email;
        if (!otpRecipient) {
          return jsonResponse({
            status: "error",
            message: "Không xác định được email để gửi mã xác nhận. Vui lòng liên hệ hỗ trợ.",
          });
        }

        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpiresAt = new Date(now.getTime() + 10 * 60 * 1000);

        await supabase.from("license_transfer_otp").insert({
          license_key: license.license_key,
          requesting_hwid: hwid,
          otp_code: otpCode,
          expires_at: otpExpiresAt.toISOString(),
        });

        const emailSent = await sendSeatOtpEmail(otpRecipient, otpCode, license.license_key);

        if (!emailSent) {
          return jsonResponse({
            status: "error",
            message: "Không gửi được email xác nhận - vui lòng thử lại sau hoặc liên hệ hỗ trợ.",
          });
        }

        return jsonResponse({
          status: "otp_required",
          message: `Đã gửi mã xác nhận tới email ${otpRecipient} - vui lòng kiểm tra hộp thư và nhập mã.`,
        });
      }

      await supabase.from("license_seats").insert({
        license_id: license.id,
        device_hwid: hwid,
        app_version: versionStr,
        version_updated_at: versionStr ? now.toISOString() : null,
      });
    }

    // ----- Thông tin bản cập nhật mới nhất THEO KÊNH (2026-11-23) - giữ shape response cũ + update_channel -----
    return jsonResponse(await buildLicenseResponse(license, channel, current_version));
  } catch (e) {
    return jsonResponse({ status: "error", message: String(e) }, 500);
  }
});