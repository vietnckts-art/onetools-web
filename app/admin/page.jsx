"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";

// Tự động lấy đúng YouTube Video ID dù admin dán cả link đầy đủ hay chỉ ID —
// tránh lưu nhầm cả URL vào database gây lỗi nhúng video trên trang chủ.
function extractYoutubeId(input) {
  if (!input) return "";
  const raw = input.trim();
  if (!raw.includes("youtu") && !raw.includes("/") && !raw.includes("?")) {
    return raw;
  }
  const patterns = [
    /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
  ];
  for (const re of patterns) {
    const match = raw.match(re);
    if (match) return match[1];
  }
  return raw;
}

const EMPTY_VIDEO = {
  code: "",
  name_vi: "",
  name_en: "",
  desc_vi: "",
  desc_en: "",
  youtube_id: "",
  sort_order: 0,
  is_published: true,
};

const EMPTY_PROMOTION = {
  title_vi: "",
  title_en: "",
  subtitle_vi: "",
  subtitle_en: "",
  discount_percent: "",
  valid_from: "",
  valid_to: "",
  is_active: true,
  paddle_discount_code: "",
};

const EMPTY_PROMO_CODE = {
  code: "",
  discount_percent: "",
  max_uses: "",
  assigned_email: "",
  valid_from: "",
  valid_to: "",
  is_active: true,
  note: "",
};

const EMPTY_PLAN = {
  name_vi: "",
  name_en: "",
  price: "",
  price_usd: "",
  period_vi: "",
  period_en: "",
  seats_vi: "",
  seats_en: "",
  features_vi: "",
  features_en: "",
  is_contact: false,
  highlight: false,
  sort_order: 0,
  is_published: true,
};

export default function AdminPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [tab, setTab] = useState("videos");

  useEffect(() => {
    (async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const session = sessionData.session;
      if (!session) {
        router.push("/admin/login");
        return;
      }
      const { data: profile } = await supabase
        .from("profiles")
        .select("is_admin")
        .eq("id", session.user.id)
        .single();

      if (!profile?.is_admin) {
        setChecking(false);
        setAuthorized(false);
        return;
      }
      setAuthorized(true);
      setChecking(false);
    })();
  }, [router]);

  if (checking) return <CenterMsg text="Đang kiểm tra quyền truy cập..." />;
  if (!authorized)
    return (
      <CenterMsg text="Tài khoản này không có quyền admin. Liên hệ chủ hệ thống để được cấp quyền (bảng profiles.is_admin)." />
    );

  return (
    <div className="admin-root">
      <style>{adminStyles}</style>
      <header className="admin-header">
        <h1>OneTools Admin</h1>
        <button
          className="btn-ghost"
          onClick={async () => {
            await supabase.auth.signOut();
            router.push("/admin/login");
          }}
        >
          Đăng xuất
        </button>
      </header>
      <nav className="admin-tabs">
        <button className={tab === "videos" ? "active" : ""} onClick={() => setTab("videos")}>
          Video hướng dẫn
        </button>
        <button className={tab === "pricing" ? "active" : ""} onClick={() => setTab("pricing")}>
          Gói giá
        </button>
        <button className={tab === "promotions" ? "active" : ""} onClick={() => setTab("promotions")}>
          Khuyến mại
        </button>
        <button className={tab === "promo_codes" ? "active" : ""} onClick={() => setTab("promo_codes")}>
          Mã khuyến mãi
        </button>
        <button className={tab === "releases" ? "active" : ""} onClick={() => setTab("releases")}>
          Bản cập nhật
        </button>
        <button className={tab === "feedback" ? "active" : ""} onClick={() => setTab("feedback")}>
          Phản hồi
        </button>
        <button className={tab === "acquisition" ? "active" : ""} onClick={() => setTab("acquisition")}>
          Nguồn khách
        </button>
      </nav>
      <main className="admin-main">
        {tab === "videos" && <VideosManager />}
        {tab === "pricing" && <PricingManager />}
        {tab === "promotions" && <PromotionsManager />}
        {tab === "promo_codes" && <PromoCodesManager />}
        {tab === "releases" && <ReleasesManager />}
        {tab === "feedback" && <FeedbackManager />}
        {tab === "acquisition" && <AcquisitionManager />}
      </main>
    </div>
  );
}

function CenterMsg({ text }) {
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#F4F2EE", color: "#222", fontFamily: "sans-serif", padding: 24, textAlign: "center" }}>
      {text}
    </div>
  );
}

// =====================================================================
// QUẢN LÝ VIDEO
// =====================================================================
function VideosManager() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // null | 'new' | row object
  const [form, setForm] = useState(EMPTY_VIDEO);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("tool_videos").select("*").order("sort_order");
    setRows(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const startEdit = (row) => {
    setEditing(row.id);
    setForm(row);
  };
  const startNew = () => {
    setEditing("new");
    setForm(EMPTY_VIDEO);
  };
  const cancel = () => {
    setEditing(null);
    setForm(EMPTY_VIDEO);
  };

  const save = async () => {
    setSaving(true);
    const payload = { ...form, sort_order: Number(form.sort_order), youtube_id: extractYoutubeId(form.youtube_id) };
    if (editing === "new") {
      await supabase.from("tool_videos").insert([payload]);
    } else {
      await supabase.from("tool_videos").update(payload).eq("id", editing);
    }
    setSaving(false);
    cancel();
    load();
  };

  const remove = async (id) => {
    if (!confirm("Xoá video này? Không thể hoàn tác.")) return;
    await supabase.from("tool_videos").delete().eq("id", id);
    load();
  };

  if (loading) return <p>Đang tải...</p>;

  return (
    <div>
      {editing ? (
        <VideoForm form={form} setForm={setForm} onSave={save} onCancel={cancel} saving={saving} />
      ) : (
        <button className="btn-primary" onClick={startNew}>+ Thêm video mới</button>
      )}

      <table className="admin-table">
        <thead>
          <tr>
            <th>Mã</th><th>Tên (VI)</th><th>YouTube ID</th><th>Thứ tự</th><th>Đăng</th><th></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id}>
              <td>{r.code}</td>
              <td>{r.name_vi}</td>
              <td className="mono">{r.youtube_id}</td>
              <td>{r.sort_order}</td>
              <td>{r.is_published ? "✓" : "—"}</td>
              <td className="actions">
                <button onClick={() => startEdit(r)}>Sửa</button>
                <button className="danger" onClick={() => remove(r.id)}>Xoá</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function VideoForm({ form, setForm, onSave, onCancel, saving }) {
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  return (
    <div className="admin-form">
      <div className="form-row">
        <label>Mã hiển thị (vd 01)</label>
        <input value={form.code} onChange={set("code")} />
      </div>
      <div className="form-row">
        <label>Tên tool (Tiếng Việt)</label>
        <input value={form.name_vi} onChange={set("name_vi")} />
      </div>
      <div className="form-row">
        <label>Tên tool (English)</label>
        <input value={form.name_en} onChange={set("name_en")} />
      </div>
      <div className="form-row">
        <label>Mô tả (Tiếng Việt)</label>
        <textarea value={form.desc_vi} onChange={set("desc_vi")} />
      </div>
      <div className="form-row">
        <label>Mô tả (English)</label>
        <textarea value={form.desc_en} onChange={set("desc_en")} />
      </div>
      <div className="form-row">
        <label>YouTube Video ID (chỉ phần ID, không phải cả link)</label>
        <input value={form.youtube_id} onChange={set("youtube_id")} placeholder="vd: dQw4w9WgXcQ" />
      </div>
      <div className="form-row">
        <label>Thứ tự hiển thị (số nhỏ hiện trước)</label>
        <input type="number" value={form.sort_order} onChange={set("sort_order")} />
      </div>
      <div className="form-row checkbox">
        <label>
          <input
            type="checkbox"
            checked={form.is_published}
            onChange={(e) => setForm({ ...form, is_published: e.target.checked })}
          />
          Đăng công khai (bỏ tick để ẩn tạm, không hiện trên web)
        </label>
      </div>
      <div className="form-actions">
        <button className="btn-primary" onClick={onSave} disabled={saving}>{saving ? "Đang lưu..." : "Lưu"}</button>
        <button className="btn-ghost" onClick={onCancel}>Huỷ</button>
      </div>
    </div>
  );
}

// =====================================================================
// QUẢN LÝ GÓI GIÁ
// =====================================================================
function PricingManager() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_PLAN);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("pricing_plans").select("*").order("sort_order");
    setRows(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const toFormShape = (row) => ({
    ...row,
    features_vi: (row.features_vi || []).join("\n"),
    features_en: (row.features_en || []).join("\n"),
  });

  const startEdit = (row) => {
    setEditing(row.id);
    setForm(toFormShape(row));
  };
  const startNew = () => {
    setEditing("new");
    setForm(EMPTY_PLAN);
  };
  const cancel = () => {
    setEditing(null);
    setForm(EMPTY_PLAN);
  };

  const [saveError, setSaveError] = useState("");

  const save = async () => {
    setSaving(true);
    setSaveError("");
    const payload = {
      ...form,
      sort_order: Number(form.sort_order),
      features_vi: form.features_vi.split("\n").map((s) => s.trim()).filter(Boolean),
      features_en: form.features_en.split("\n").map((s) => s.trim()).filter(Boolean),
    };
    const { error } =
      editing === "new"
        ? await supabase.from("pricing_plans").insert([payload])
        : await supabase.from("pricing_plans").update(payload).eq("id", editing);

    setSaving(false);
    if (error) {
      setSaveError(
        "Lưu thất bại: " +
          error.message +
          (error.message.includes("price_usd")
            ? " — có thể chưa chạy sql/schema_price_usd.sql trong Supabase."
            : "")
      );
      return;
    }
    cancel();
    load();
  };

  const remove = async (id) => {
    if (!confirm("Xoá gói giá này? Không thể hoàn tác.")) return;
    await supabase.from("pricing_plans").delete().eq("id", id);
    load();
  };

  if (loading) return <p>Đang tải...</p>;

  return (
    <div>
      {editing ? (
        <PlanForm form={form} setForm={setForm} onSave={save} onCancel={cancel} saving={saving} saveError={saveError} />
      ) : (
        <button className="btn-primary" onClick={startNew}>+ Thêm gói mới</button>
      )}

      <table className="admin-table">
        <thead>
          <tr>
            <th>Tên (VI)</th><th>Giá VNĐ</th><th>Giá USD</th><th>Nổi bật</th><th>Thứ tự</th><th>Đăng</th><th></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id}>
              <td>{r.name_vi}</td>
              <td>{r.price}</td>
              <td>{r.price_usd || "—"}</td>
              <td>{r.highlight ? "✓" : "—"}</td>
              <td>{r.sort_order}</td>
              <td>{r.is_published ? "✓" : "—"}</td>
              <td className="actions">
                <button onClick={() => startEdit(r)}>Sửa</button>
                <button className="danger" onClick={() => remove(r.id)}>Xoá</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PlanForm({ form, setForm, onSave, onCancel, saving, saveError }) {
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  return (
    <div className="admin-form">
      <div className="form-row"><label>Tên gói (VI)</label><input value={form.name_vi} onChange={set("name_vi")} /></div>
      <div className="form-row"><label>Tên gói (EN)</label><input value={form.name_en} onChange={set("name_en")} /></div>
      <div className="form-row"><label>Giá VNĐ (để "Liên hệ" nếu không niêm yết giá)</label><input value={form.price} onChange={set("price")} /></div>
      <div className="form-row"><label>Giá USD (hiển thị khi web ở chế độ Tiếng Anh, vd 39 — không cần gõ dấu $)</label><input value={form.price_usd} onChange={set("price_usd")} placeholder="vd: 39" /></div>
      <div className="form-row"><label>Chu kỳ (VI, vd "/ năm")</label><input value={form.period_vi} onChange={set("period_vi")} /></div>
      <div className="form-row"><label>Chu kỳ (EN, vd "/ year")</label><input value={form.period_en} onChange={set("period_en")} /></div>
      <div className="form-row"><label>Số máy trạm (VI)</label><input value={form.seats_vi} onChange={set("seats_vi")} /></div>
      <div className="form-row"><label>Số máy trạm (EN)</label><input value={form.seats_en} onChange={set("seats_en")} /></div>
      <div className="form-row"><label>Tính năng (VI) — mỗi dòng 1 mục</label><textarea rows={4} value={form.features_vi} onChange={set("features_vi")} /></div>
      <div className="form-row"><label>Tính năng (EN) — mỗi dòng 1 mục</label><textarea rows={4} value={form.features_en} onChange={set("features_en")} /></div>
      <div className="form-row"><label>Thứ tự hiển thị</label><input type="number" value={form.sort_order} onChange={set("sort_order")} /></div>
      <div className="form-row checkbox">
        <label><input type="checkbox" checked={form.is_contact} onChange={(e) => setForm({ ...form, is_contact: e.target.checked })} /> Gói "Liên hệ" (nút sẽ hiện "Liên hệ tư vấn" thay vì "Đăng ký ngay")</label>
      </div>
      <div className="form-row checkbox">
        <label><input type="checkbox" checked={form.highlight} onChange={(e) => setForm({ ...form, highlight: e.target.checked })} /> Gói nổi bật (viền đồng, nền sáng hơn)</label>
      </div>
      <div className="form-row checkbox">
        <label><input type="checkbox" checked={form.is_published} onChange={(e) => setForm({ ...form, is_published: e.target.checked })} /> Đăng công khai</label>
      </div>
      <div className="form-actions">
        <button className="btn-primary" onClick={onSave} disabled={saving}>{saving ? "Đang lưu..." : "Lưu"}</button>
        <button className="btn-ghost" onClick={onCancel}>Huỷ</button>
      </div>
      {saveError && <p style={{ color: "#C0392B", fontSize: 12.5, marginTop: 10 }}>{saveError}</p>}
    </div>
  );
}

// =====================================================================
// QUẢN LÝ KHUYẾN MẠI (banner hiển thị ở cột PayOS trong /checkout, trừ giá thật qua
// payos-create-payment — xem sql/schema_promotions.sql. CHỈ áp dụng kênh PayOS, không áp dụng Paddle.)
// =====================================================================
function PromotionsManager() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_PROMOTION);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("promotions").select("*").order("created_at", { ascending: false });
    setRows(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const toFormShape = (row) => ({
    ...row,
    subtitle_vi: row.subtitle_vi || "",
    subtitle_en: row.subtitle_en || "",
    paddle_discount_code: row.paddle_discount_code || "",
    valid_from: (row.valid_from || "").slice(0, 10),
    valid_to: (row.valid_to || "").slice(0, 10),
  });

  const startEdit = (row) => {
    setEditing(row.id);
    setForm(toFormShape(row));
    setSaveError("");
  };
  const startNew = () => {
    setEditing("new");
    setForm(EMPTY_PROMOTION);
    setSaveError("");
  };
  const cancel = () => {
    setEditing(null);
    setForm(EMPTY_PROMOTION);
    setSaveError("");
  };

  const save = async () => {
    if (!form.title_vi.trim() || !form.title_en.trim()) {
      setSaveError("Cần nhập nội dung banner (cả VI và EN).");
      return;
    }
    if (!form.discount_percent || Number(form.discount_percent) <= 0 || Number(form.discount_percent) > 100) {
      setSaveError("% giảm giá phải từ 1 đến 100.");
      return;
    }
    if (!form.valid_from || !form.valid_to) {
      setSaveError("Cần chọn đủ ngày bắt đầu và ngày kết thúc.");
      return;
    }
    setSaving(true);
    setSaveError("");
    const payload = {
      title_vi: form.title_vi,
      title_en: form.title_en,
      subtitle_vi: form.subtitle_vi?.trim() || null,
      subtitle_en: form.subtitle_en?.trim() || null,
      discount_percent: Number(form.discount_percent),
      // Lưu trọn ngày bắt đầu (00:00) tới hết ngày kết thúc (23:59:59) — khách thanh toán trong suốt
      // ngày cuối cùng vẫn được tính là còn hiệu lực.
      valid_from: `${form.valid_from}T00:00:00`,
      valid_to: `${form.valid_to}T23:59:59`,
      is_active: form.is_active,
      // Mã Discount đã tạo sẵn trên Paddle (Catalog → Discounts, có bật "Checkout discount code").
      // Có mã thì web tự gắn vào Paddle Checkout trong thời gian đợt này chạy; để trống = Paddle không giảm.
      paddle_discount_code: form.paddle_discount_code?.trim() || null,
    };
    const { error } =
      editing === "new"
        ? await supabase.from("promotions").insert([payload])
        : await supabase.from("promotions").update(payload).eq("id", editing);

    setSaving(false);
    if (error) {
      setSaveError(
        "Lưu thất bại: " + error.message +
          (error.message.includes("paddle_discount_code")
            ? " — có thể chưa chạy sql/schema_promo_paddle.sql trong Supabase."
            : error.message.includes("subtitle")
            ? " — có thể chưa chạy sql/schema_promo_v2.sql trong Supabase."
            : error.message.includes("promotions")
            ? " — có thể chưa chạy sql/schema_promotions.sql trong Supabase."
            : "")
      );
      return;
    }
    cancel();
    load();
  };

  const remove = async (id) => {
    if (!confirm("Xoá đợt khuyến mại này? Không thể hoàn tác.")) return;
    await supabase.from("promotions").delete().eq("id", id);
    load();
  };

  const isCurrentlyLive = (r) => {
    const now = new Date();
    return r.is_active && new Date(r.valid_from) <= now && now <= new Date(r.valid_to);
  };

  if (loading) return <p>Đang tải...</p>;

  return (
    <div>
      <p style={{ fontSize: 12.5, color: "#6B6558", marginTop: -8, marginBottom: 18, maxWidth: 560 }}>
        Hiển thị banner ở `/checkout` và trang chủ. PayOS (trong nước): tự trừ đúng % này vào giá VNĐ thật
        khi tạo đơn. Paddle (quốc tế): chỉ giảm khi nhập "Mã giảm giá Paddle" — web tự gắn mã đó vào Paddle
        Checkout, khách không phải nhập.
      </p>
      {editing ? (
        <PromotionForm form={form} setForm={setForm} onSave={save} onCancel={cancel} saving={saving} saveError={saveError} />
      ) : (
        <button className="btn-primary" onClick={startNew}>+ Thêm đợt khuyến mại</button>
      )}

      <table className="admin-table">
        <thead>
          <tr>
            <th>Nội dung (VI)</th><th>Giảm</th><th>Mã Paddle</th><th>Từ ngày</th><th>Đến ngày</th><th>Bật</th><th>Đang chạy</th><th></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id}>
              <td>{r.title_vi}</td>
              <td>{r.discount_percent}%</td>
              <td className="mono">{r.paddle_discount_code || "— (Paddle không giảm)"}</td>
              <td>{new Date(r.valid_from).toLocaleDateString("vi-VN")}</td>
              <td>{new Date(r.valid_to).toLocaleDateString("vi-VN")}</td>
              <td>{r.is_active ? "✓" : "—"}</td>
              <td>{isCurrentlyLive(r) ? "✓ Đang hiện trên web" : "—"}</td>
              <td className="actions">
                <button onClick={() => startEdit(r)}>Sửa</button>
                <button className="danger" onClick={() => remove(r.id)}>Xoá</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PromotionForm({ form, setForm, onSave, onCancel, saving, saveError }) {
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  return (
    <div className="admin-form">
      <div className="form-row"><label>Nội dung banner (VI) — dòng trên, chữ trắng</label><input value={form.title_vi} onChange={set("title_vi")} placeholder="vd: Khuyến mại mừng ra mắt" /></div>
      <div className="form-row"><label>Nội dung banner (EN) — dòng trên, chữ trắng</label><input value={form.title_en} onChange={set("title_en")} placeholder="e.g. Launch promotion" /></div>
      <div className="form-row"><label>Dòng phụ (VI) — không bắt buộc, chữ nhỏ màu vàng, vd thời gian áp dụng</label><input value={form.subtitle_vi} onChange={set("subtitle_vi")} placeholder="vd: (từ ngày 26/10/2026 đến 01/12/2026)" /></div>
      <div className="form-row"><label>Dòng phụ (EN) — không bắt buộc, chữ nhỏ màu vàng</label><input value={form.subtitle_en} onChange={set("subtitle_en")} placeholder="e.g. (from Oct 26 to Dec 1, 2026)" /></div>
      <div className="form-row"><label>% giảm giá</label><input type="number" min="1" max="100" value={form.discount_percent} onChange={set("discount_percent")} /></div>
      <div className="form-row">
        <label>Mã giảm giá Paddle — không bắt buộc. Nhập đúng "Checkout discount code" đã tạo trên Paddle (Catalog → Discounts), cùng % ở trên và hạn dùng trên Paddle không sớm hơn "Đến ngày". Để trống = khách Paddle trả giá gốc.</label>
        <input value={form.paddle_discount_code} onChange={set("paddle_discount_code")} placeholder="vd: ONETOOLS30" />
      </div>
      <div className="form-row"><label>Từ ngày</label><input type="date" value={form.valid_from} onChange={set("valid_from")} /></div>
      <div className="form-row"><label>Đến ngày</label><input type="date" value={form.valid_to} onChange={set("valid_to")} /></div>
      <div className="form-row checkbox">
        <label><input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} /> Bật (bỏ tick để tắt ngay mà không cần xoá/sửa ngày)</label>
      </div>
      <div className="form-actions">
        <button className="btn-primary" onClick={onSave} disabled={saving}>{saving ? "Đang lưu..." : "Lưu"}</button>
        <button className="btn-ghost" onClick={onCancel}>Huỷ</button>
      </div>
      {saveError && <p style={{ color: "#C0392B", fontSize: 12.5, marginTop: 10 }}>{saveError}</p>}
    </div>
  );
}

// =====================================================================
// QUẢN LÝ MÃ KHUYẾN MÃI (tặng riêng cá nhân — khách nhập ở bước thanh toán, xem
// supabase/functions/validate-promo-code + sql/schema_promo_v2.sql). ĐỘC LẬP với tab "Khuyến mại" ở
// trên — mã ở đây, nếu khách áp thành công, THAY THẾ hoàn toàn % khuyến mại tự động, không cộng dồn.
// Bảng promo_codes CỐ Ý không cho web đọc trực tiếp (không có policy select công khai) nên component
// này chỉ hoạt động khi đăng nhập admin (is_admin() true, policy "for all" đã cho phép admin đọc/ghi).
// =====================================================================
function PromoCodesManager() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_PROMO_CODE);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("promo_codes").select("*").order("created_at", { ascending: false });
    setRows(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const toFormShape = (row) => ({
    ...row,
    max_uses: row.max_uses == null ? "" : String(row.max_uses),
    assigned_email: row.assigned_email || "",
    valid_from: (row.valid_from || "").slice(0, 10),
    valid_to: (row.valid_to || "").slice(0, 10),
    note: row.note || "",
  });

  const startEdit = (row) => {
    setEditing(row.id);
    setForm(toFormShape(row));
    setSaveError("");
  };
  const startNew = () => {
    setEditing("new");
    setForm(EMPTY_PROMO_CODE);
    setSaveError("");
  };
  const cancel = () => {
    setEditing(null);
    setForm(EMPTY_PROMO_CODE);
    setSaveError("");
  };

  const save = async () => {
    if (!form.code.trim()) {
      setSaveError("Cần nhập mã.");
      return;
    }
    if (!form.discount_percent || Number(form.discount_percent) <= 0 || Number(form.discount_percent) > 100) {
      setSaveError("% giảm giá phải từ 1 đến 100.");
      return;
    }
    setSaving(true);
    setSaveError("");
    const payload = {
      code: form.code.trim().toUpperCase(),
      discount_percent: Number(form.discount_percent),
      max_uses: form.max_uses.trim() ? Number(form.max_uses) : null,
      assigned_email: form.assigned_email.trim() || null,
      // Để trống ngày = không giới hạn (null) — khác với tab "Khuyến mại" tự động (bắt buộc chọn đủ
      // ngày), vì mã tặng riêng thường không cần giới hạn thời gian.
      valid_from: form.valid_from ? `${form.valid_from}T00:00:00` : null,
      valid_to: form.valid_to ? `${form.valid_to}T23:59:59` : null,
      is_active: form.is_active,
      note: form.note.trim() || null,
    };
    const { error } =
      editing === "new"
        ? await supabase.from("promo_codes").insert([payload])
        : await supabase.from("promo_codes").update(payload).eq("id", editing);

    setSaving(false);
    if (error) {
      setSaveError(
        "Lưu thất bại: " + error.message +
          (error.message.includes("promo_codes") ? " — có thể chưa chạy sql/schema_promo_v2.sql trong Supabase." : "") +
          (error.message.includes("duplicate") || error.message.includes("unique") ? " — mã này đã tồn tại, hãy dùng mã khác." : "")
      );
      return;
    }
    cancel();
    load();
  };

  const remove = async (id) => {
    if (!confirm("Xoá mã khuyến mãi này? Không thể hoàn tác.")) return;
    await supabase.from("promo_codes").delete().eq("id", id);
    load();
  };

  if (loading) return <p>Đang tải...</p>;

  return (
    <div>
      <p style={{ fontSize: 12.5, color: "#6B6558", marginTop: -8, marginBottom: 18, maxWidth: 620 }}>
        Mã tặng riêng cho cá nhân — khách nhập ở ô "Mã khuyến mãi" trong bước thanh toán. Nếu áp thành
        công, mã này THAY THẾ hoàn toàn % của đợt khuyến mại tự động (tab "Khuyến mại"), không cộng dồn.
        Giá thật chỉ bị trừ ở kênh PayOS — Paddle chỉ hiển thị tham khảo, giống tab "Khuyến mại".
      </p>
      {editing ? (
        <PromoCodeForm form={form} setForm={setForm} onSave={save} onCancel={cancel} saving={saving} saveError={saveError} />
      ) : (
        <button className="btn-primary" onClick={startNew}>+ Thêm mã mới</button>
      )}

      <table className="admin-table">
        <thead>
          <tr>
            <th>Mã</th><th>Giảm</th><th>Đã dùng / Tối đa</th><th>Riêng cho email</th><th>Hiệu lực</th><th>Bật</th><th>Ghi chú</th><th></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id}>
              <td className="mono">{r.code}</td>
              <td>{r.discount_percent}%</td>
              <td>{r.used_count}{r.max_uses != null ? ` / ${r.max_uses}` : " / —"}</td>
              <td>{r.assigned_email || "—"}</td>
              <td>
                {r.valid_from ? new Date(r.valid_from).toLocaleDateString("vi-VN") : "…"}
                {" → "}
                {r.valid_to ? new Date(r.valid_to).toLocaleDateString("vi-VN") : "…"}
              </td>
              <td>{r.is_active ? "✓" : "—"}</td>
              <td>{r.note || "—"}</td>
              <td className="actions">
                <button onClick={() => startEdit(r)}>Sửa</button>
                <button className="danger" onClick={() => remove(r.id)}>Xoá</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PromoCodeForm({ form, setForm, onSave, onCancel, saving, saveError }) {
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  return (
    <div className="admin-form">
      <div className="form-row"><label>Mã (không phân biệt hoa/thường, tự chuyển IN HOA khi lưu)</label><input value={form.code} onChange={set("code")} placeholder="vd: TANG_TUAN_30" /></div>
      <div className="form-row"><label>% giảm giá</label><input type="number" min="1" max="100" value={form.discount_percent} onChange={set("discount_percent")} /></div>
      <div className="form-row"><label>Giới hạn số lần dùng (để trống = không giới hạn)</label><input type="number" min="1" value={form.max_uses} onChange={set("max_uses")} placeholder="vd: 1" /></div>
      <div className="form-row"><label>Chỉ cho đúng email này dùng (để trống = ai cũng dùng được)</label><input value={form.assigned_email} onChange={set("assigned_email")} placeholder="vd: khach@gmail.com" /></div>
      <div className="form-row"><label>Có hiệu lực từ ngày (để trống = không giới hạn)</label><input type="date" value={form.valid_from} onChange={set("valid_from")} /></div>
      <div className="form-row"><label>Đến ngày (để trống = không giới hạn)</label><input type="date" value={form.valid_to} onChange={set("valid_to")} /></div>
      <div className="form-row"><label>Ghi chú nội bộ (chỉ admin thấy, không hiện cho khách)</label><input value={form.note} onChange={set("note")} placeholder="vd: Tặng anh Tuấn - KOL" /></div>
      <div className="form-row checkbox">
        <label><input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} /> Bật (bỏ tick để tắt ngay mà không cần xoá)</label>
      </div>
      <div className="form-actions">
        <button className="btn-primary" onClick={onSave} disabled={saving}>{saving ? "Đang lưu..." : "Lưu"}</button>
        <button className="btn-ghost" onClick={onCancel}>Huỷ</button>
      </div>
      {saveError && <p style={{ color: "#C0392B", fontSize: 12.5, marginTop: 10 }}>{saveError}</p>}
    </div>
  );
}

// =====================================================================
// MỚI (2026-11-23): NGUỒN KHÁCH - lượt tải web + lượt đăng ký Trial theo nguồn quảng cáo / quốc gia.
// Đọc thẳng 2 bảng download_events + signup_events (RLS: chỉ admin đọc được) rồi gộp số ở trình duyệt.
// Cần chạy sql/schema_attribution.sql trước.
// =====================================================================
const UNKNOWN = "(chưa rõ)";

// ĐỔI (2026-11-23): bỏ emoji cờ (Windows không vẽ được, hiện thành "VN VN") -> "VN · Việt Nam".
let _regionNames = null;
function countryLabel(code) {
  if (!code || code === UNKNOWN) return code || "—";
  const c = code.toUpperCase();
  try {
    if (!_regionNames) _regionNames = new Intl.DisplayNames(["vi"], { type: "region" });
    const name = _regionNames.of(c);
    return name && name !== c ? `${c} · ${name}` : c;
  } catch (e) {
    return c;
  }
}

function countBy(rows, keyFn) {
  const m = new Map();
  for (const r of rows) {
    const k = keyFn(r) || UNKNOWN;
    m.set(k, (m.get(k) || 0) + 1);
  }
  return [...m.entries()].sort((a, b) => b[1] - a[1]);
}

// ĐỔI (2026-11-23, user: "rối quá"): bảng dạng thẻ có tiêu đề nền xám, dòng xen kẽ màu, thanh % trực quan;
// ô tổng số dạng thẻ lớn; tuỳ chọn ẩn lượt "(chưa rõ)" (lượt tải trước khi có theo dõi nguồn).
function CountTable({ title, rows, isCountry, note, unit = "lượt" }) {
  const total = rows.reduce((n, r) => n + r[1], 0);
  const max = rows.reduce((m, r) => Math.max(m, r[1]), 0);
  return (
    <div className="acq-card">
      <div className="acq-card-head">
        <span>{title}</span>
        <span className="acq-card-total">{total} {unit}</span>
      </div>
      {note && <div className="acq-card-note">{note}</div>}
      <table className="acq-table">
        <tbody>
          {rows.length === 0 && (
            <tr><td className="acq-empty" colSpan={3}>Chưa có dữ liệu</td></tr>
          )}
          {rows.map(([k, n]) => {
            const pct = total ? Math.round((n * 100) / total) : 0;
            return (
              <tr key={k} className={k === UNKNOWN ? "acq-unknown" : ""}>
                <td className="acq-label">
                  <div>{isCountry ? countryLabel(k) : k}</div>
                  <div className="acq-bar"><div style={{ width: (max ? (n * 100) / max : 0) + "%" }} /></div>
                </td>
                <td className="acq-num">{n}</td>
                <td className="acq-pct">{pct}%</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function AcquisitionManager() {
  const [days, setDays] = useState(30);
  const [downloads, setDownloads] = useState([]);
  const [signups, setSignups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [hideUnknown, setHideUnknown] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
    const [dl, su] = await Promise.all([
      supabase
        .from("download_events")
        .select("created_at, version, utm_source, utm_campaign, country, referrer")
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(5000),
      supabase
        .from("signup_events")
        .select("created_at, email, via, country, os_region, os_language, time_zone, utm_source, utm_campaign, channel")
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(5000),
    ]);
    if (dl.error || su.error) {
      setError(
        "Chưa đọc được dữ liệu: " + (dl.error || su.error).message + " (Đã chạy sql/schema_attribution.sql chưa?)",
      );
    }
    setDownloads(dl.data || []);
    setSignups(su.data || []);
    setLoading(false);
  }, [days]);

  useEffect(() => { load(); }, [load]);

  // Quốc gia khi đăng ký: ưu tiên quốc gia theo IP (đăng ký trên web), nếu không có thì vùng Windows (đăng ký trong Revit).
  const signupCountry = (r) => r.country || r.os_region;
  const signupSource = (r) => r.utm_source || (r.via === "addin" ? "trong Revit (không rõ quảng cáo)" : null);
  const sourceLabel = (r) => (r.utm_source ? r.utm_source + (r.utm_campaign ? " · " + r.utm_campaign : "") : null);

  // Lượt tải chưa có theo dõi (trước 23/11/2026): không có cả nguồn lẫn quốc gia.
  const untracked = downloads.filter((r) => !r.utm_source && !r.country).length;
  const dlRows = hideUnknown ? downloads.filter((r) => r.utm_source || r.country) : downloads;
  const strip = (rows) => (hideUnknown ? rows.filter(([k]) => k !== UNKNOWN) : rows);
  const tracked = downloads.length - untracked;
  const rate = tracked ? Math.round((signups.length * 1000) / tracked) / 10 : null;

  return (
    <div className="acq">
      <div className="acq-toolbar">
        <span className="acq-muted">Khoảng thời gian</span>
        <div className="acq-seg">
          {[7, 30, 90].map((d) => (
            <button key={d} className={days === d ? "on" : ""} onClick={() => setDays(d)}>
              {d} ngày
            </button>
          ))}
        </div>
        <button className="acq-btn" onClick={load}>↻ Tải lại</button>
        <label className="acq-check">
          <input type="checkbox" checked={hideUnknown} onChange={(e) => setHideUnknown(e.target.checked)} />
          Ẩn lượt chưa rõ nguồn
        </label>
      </div>

      {error && <p className="acq-error">{error}</p>}

      {loading ? (
        <p className="acq-muted">Đang tải...</p>
      ) : (
        <>
          <div className="acq-kpis">
            <div className="acq-kpi">
              <div className="acq-kpi-label">Lượt bấm Tải về</div>
              <div className="acq-kpi-value">{downloads.length}</div>
              <div className="acq-kpi-sub">{tracked} có nguồn · {untracked} chưa rõ</div>
            </div>
            <div className="acq-kpi">
              <div className="acq-kpi-label">Đăng ký Trial</div>
              <div className="acq-kpi-value">{signups.length}</div>
              <div className="acq-kpi-sub">{days} ngày qua</div>
            </div>
            <div className="acq-kpi">
              <div className="acq-kpi-label">Đăng ký / lượt tải có nguồn</div>
              <div className="acq-kpi-value">{rate === null ? "—" : rate + "%"}</div>
              <div className="acq-kpi-sub">tỉ lệ chuyển đổi ước tính</div>
            </div>
          </div>

          <div className="acq-section">Lượt tải về</div>
          <div className="acq-grid">
            <CountTable title="Theo nguồn" rows={strip(countBy(dlRows, sourceLabel))} />
            <CountTable title="Theo quốc gia" rows={strip(countBy(dlRows, (r) => r.country))} isCountry />
          </div>

          <div className="acq-section">Đăng ký Trial</div>
          <div className="acq-grid">
            <CountTable title="Theo nguồn" rows={countBy(signups, signupSource)} />
            <CountTable
              title="Theo quốc gia"
              rows={countBy(signups, signupCountry)}
              isCountry
              note="Đăng ký trên web: theo IP · Đăng ký trong Revit: theo vùng cài trong Windows."
            />
          </div>

          <div className="acq-section">Đăng ký gần đây</div>
          <div className="acq-card">
            <table className="acq-table acq-list">
              <thead>
                <tr>
                  <th>Thời gian</th><th>Email</th><th>Nơi đăng ký</th><th>Quốc gia</th>
                  <th>Ngôn ngữ / múi giờ</th><th>Nguồn</th>
                </tr>
              </thead>
              <tbody>
                {signups.length === 0 && (
                  <tr><td className="acq-empty" colSpan={6}>Chưa có lượt đăng ký</td></tr>
                )}
                {signups.slice(0, 50).map((r, i) => (
                  <tr key={i}>
                    <td className="acq-nowrap">{new Date(r.created_at).toLocaleString("vi-VN")}</td>
                    <td className="acq-mono">{r.email}</td>
                    <td>
                      <span className={"acq-tag " + (r.via === "web" ? "web" : "addin")}>
                        {r.via === "web" ? "Web" : r.via === "addin" ? "Revit" + (r.channel === "store" ? " · Store" : "") : r.via || "—"}
                      </span>
                    </td>
                    <td>{signupCountry(r) ? countryLabel(signupCountry(r)) : "—"}</td>
                    <td className="acq-small">{[r.os_language, r.time_zone].filter(Boolean).join(" · ") || "—"}</td>
                    <td>{sourceLabel(r) ? <span className="acq-tag src">{sourceLabel(r)}</span> : <span className="acq-muted">—</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <details className="acq-help">
            <summary>Cách gắn nguồn cho link quảng cáo</summary>
            <div>
              YouTube: <span className="acq-mono">onetools-bim.com/en?utm_source=youtube&amp;utm_campaign=intl-video</span><br />
              Facebook: <span className="acq-mono">onetools-bim.com/?utm_source=facebook&amp;utm_campaign=vn-fb</span><br />
              Lượt tải trước 23/11/2026 không có nguồn/quốc gia (hiện là "chưa rõ").
            </div>
          </details>
        </>
      )}
    </div>
  );
}

// =====================================================================
// QUẢN LÝ BẢN CẬP NHẬT (upload file cài đặt + thông tin phiên bản)
// =====================================================================
const EMPTY_RELEASE = {
  version: "",
  revit_versions: "2025 · 2026 · 2027",
  release_notes_vi: "",
  release_notes_en: "",
  is_latest: true,
};

function ReleasesManager() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY_RELEASE);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState("");

  // Sửa bản đã đăng: chỉnh lại thông tin (và có thể thay file cài đặt nếu cần) mà không phải xoá/đăng lại.
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState(EMPTY_RELEASE);
  const [editFile, setEditFile] = useState(null);
  const [editSaving, setEditSaving] = useState(false);
  const [editMsg, setEditMsg] = useState("");

  // Thống kê theo phiên bản (RPC admin_version_stats - chỉ admin gọi được):
  //   dl_total / dl_7d = lượt bấm "Tải về" trên web; devices_30d = số máy đang chạy bản đó (30 ngày qua).
  const [stats, setStats] = useState({});
  const [statsError, setStatsError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const [{ data }, statsRes] = await Promise.all([
      supabase.from("releases").select("*").order("published_at", { ascending: false }),
      supabase.rpc("admin_version_stats"),
    ]);
    setRows(data || []);
    if (statsRes.error) {
      setStats({});
      setStatsError("Chưa đọc được thống kê: " + statsRes.error.message);
    } else {
      const map = {};
      for (const r of statsRes.data || []) map[r.ver ?? "__unknown__"] = r;
      setStats(map);
      setStatsError("");
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      setUploadMsg("Chưa chọn file .exe nào.");
      return;
    }
    if (!form.version.trim()) {
      setUploadMsg("Cần nhập số phiên bản (vd 1.5.0).");
      return;
    }

    setUploading(true);
    setUploadMsg("Đang tải file lên...");

    try {
      // Đặt tên file trong Storage có kèm version để không bị trùng/ghi đè bản cũ
      const path = `OneToolsSetup_v${form.version.trim()}_${Date.now()}.exe`;

      const { error: uploadError } = await supabase.storage
        .from("installers")
        .upload(path, file, { upsert: false });

      if (uploadError) throw uploadError;

      // Ép tên file hiện ra khi khách bấm "Tải về" luôn sạch là "OneTools-Setup-<version>.exe" — KHÔNG
      // phụ thuộc tên path lưu nội bộ trong Storage (path trên có kèm timestamp để tránh trùng/ghi đè
      // bản cũ, nhưng không nên lộ ra ngoài). Tham số `download` của Supabase Storage set sẵn header
      // Content-Disposition đúng tên này — trình duyệt tải về sẽ dùng tên này, không còn "đuôi lạ".
      const cleanFileName = `OneTools-Setup-${form.version.trim()}.exe`;
      const { data: publicUrlData } = supabase.storage
        .from("installers")
        .getPublicUrl(path, { download: cleanFileName });
      const downloadUrl = publicUrlData.publicUrl;
      const sizeMb = (file.size / (1024 * 1024)).toFixed(1);

      const { error: insertError } = await supabase.from("releases").insert([
        {
          version: form.version.trim(),
          file_name: file.name,
          download_url: downloadUrl,
          file_size_mb: Number(sizeMb),
          revit_versions: form.revit_versions,
          release_notes_vi: form.release_notes_vi,
          release_notes_en: form.release_notes_en,
          is_latest: form.is_latest,
        },
      ]);

      if (insertError) throw insertError;

      setUploadMsg("Đã đăng bản cập nhật thành công.");
      setForm(EMPTY_RELEASE);
      setFile(null);
      load();
    } catch (err) {
      setUploadMsg("Lỗi: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  const markLatest = async (id) => {
    await supabase.from("releases").update({ is_latest: true }).eq("id", id);
    load();
  };

  // MỚI (2026-11-23, Autodesk App Store): đánh dấu bản này ĐÃ CÓ trên Autodesk App Store (Autodesk duyệt xong).
  // Edge Function activate-seat / confirm-seat-otp lấy bản on_store mới nhất để báo "có bản mới" cho khách cài
  // từ Store (channel = "store") — khách web vẫn theo cột "Mới nhất" như cũ.
  const toggleOnStore = async (row) => {
    const next = !row.on_store;
    if (next && !confirm(`Xác nhận bản ${row.version} ĐÃ được Autodesk duyệt và đang có trên Autodesk App Store?\nKhách cài bản Store đang dùng bản cũ hơn sẽ nhận thông báo cập nhật.`)) return;
    const { error } = await supabase.from("releases").update({ on_store: next }).eq("id", row.id);
    if (error) alert("Lỗi: " + error.message + "\n(Đã chạy sql/schema_store_channel.sql chưa?)");
    load();
  };

  const remove = async (row) => {
    if (!confirm(`Xoá bản ${row.version}? File trong Storage sẽ không tự xoá theo, cần xoá thủ công nếu muốn dọn dẹp.`)) return;
    await supabase.from("releases").delete().eq("id", row.id);
    load();
  };

  const startEdit = (row) => {
    setEditingId(row.id);
    setEditForm({
      version: row.version || "",
      revit_versions: row.revit_versions || "",
      release_notes_vi: row.release_notes_vi || "",
      release_notes_en: row.release_notes_en || "",
      is_latest: row.is_latest,
    });
    setEditFile(null);
    setEditMsg("");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm(EMPTY_RELEASE);
    setEditFile(null);
    setEditMsg("");
  };

  const saveEdit = async () => {
    if (!editForm.version.trim()) {
      setEditMsg("Cần nhập số phiên bản (vd 1.5.0).");
      return;
    }

    setEditSaving(true);
    setEditMsg("");

    try {
      const payload = {
        version: editForm.version.trim(),
        revit_versions: editForm.revit_versions,
        release_notes_vi: editForm.release_notes_vi,
        release_notes_en: editForm.release_notes_en,
        is_latest: editForm.is_latest,
      };

      // Chỉ thay file cài đặt trong Storage nếu admin có chọn file mới — để trống thì giữ nguyên file cũ.
      if (editFile) {
        const path = `OneToolsSetup_v${editForm.version.trim()}_${Date.now()}.exe`;
        const { error: uploadError } = await supabase.storage
          .from("installers")
          .upload(path, editFile, { upsert: false });
        if (uploadError) throw uploadError;

        // Giống handleUpload ở trên — ép tên tải về sạch, không lộ timestamp trong path Storage.
        const cleanFileName = `OneTools-Setup-${editForm.version.trim()}.exe`;
        const { data: publicUrlData } = supabase.storage
          .from("installers")
          .getPublicUrl(path, { download: cleanFileName });
        payload.download_url = publicUrlData.publicUrl;
        payload.file_name = editFile.name;
        payload.file_size_mb = Number((editFile.size / (1024 * 1024)).toFixed(1));
      }

      const { error: updateError } = await supabase.from("releases").update(payload).eq("id", editingId);
      if (updateError) throw updateError;

      cancelEdit();
      load();
    } catch (err) {
      setEditMsg("Lỗi: " + err.message);
    } finally {
      setEditSaving(false);
    }
  };

  return (
    <div>
      <div className="admin-form">
        <h3 style={{ marginTop: 0 }}>Đăng bản cập nhật mới</h3>
        <div className="form-row">
          <label>File cài đặt (.exe)</label>
          <input type="file" accept=".exe" onChange={(e) => setFile(e.target.files[0])} />
        </div>
        <div className="form-row">
          <label>Số phiên bản (vd 1.5.0)</label>
          <input value={form.version} onChange={(e) => setForm({ ...form, version: e.target.value })} />
        </div>
        <div className="form-row">
          <label>Phiên bản Revit hỗ trợ</label>
          <input value={form.revit_versions} onChange={(e) => setForm({ ...form, revit_versions: e.target.value })} />
        </div>
        <div className="form-row">
          <label>Changelog (Tiếng Việt)</label>
          <textarea value={form.release_notes_vi} onChange={(e) => setForm({ ...form, release_notes_vi: e.target.value })} />
        </div>
        <div className="form-row">
          <label>Changelog (English)</label>
          <textarea value={form.release_notes_en} onChange={(e) => setForm({ ...form, release_notes_en: e.target.value })} />
        </div>
        <div className="form-row checkbox">
          <label>
            <input
              type="checkbox"
              checked={form.is_latest}
              onChange={(e) => setForm({ ...form, is_latest: e.target.checked })}
            />
            Đặt làm bản mới nhất (nút "Tải về" trên web sẽ trỏ tới bản này)
          </label>
        </div>
        <div className="form-actions">
          <button className="btn-primary" onClick={handleUpload} disabled={uploading}>
            {uploading ? "Đang xử lý..." : "Tải lên & Đăng"}
          </button>
        </div>
        {uploadMsg && <p style={{ fontSize: 13, marginTop: 10, color: "#A06C28" }}>{uploadMsg}</p>}
      </div>

      {editingId && (
        <div className="admin-form">
          <h3 style={{ marginTop: 0 }}>
            Sửa bản {rows.find((r) => r.id === editingId)?.version}
          </h3>
          <div className="form-row">
            <label>File hiện tại</label>
            <p style={{ margin: 0, fontSize: 13, color: "#6B6558" }} className="mono">
              {rows.find((r) => r.id === editingId)?.file_name}
            </p>
          </div>
          <div className="form-row">
            <label>Thay file cài đặt mới (.exe) — để trống nếu chỉ sửa thông tin bên dưới</label>
            <input type="file" accept=".exe" onChange={(e) => setEditFile(e.target.files[0])} />
          </div>
          <div className="form-row">
            <label>Số phiên bản (vd 1.5.0)</label>
            <input
              value={editForm.version}
              onChange={(e) => setEditForm({ ...editForm, version: e.target.value })}
            />
          </div>
          <div className="form-row">
            <label>Phiên bản Revit hỗ trợ</label>
            <input
              value={editForm.revit_versions}
              onChange={(e) => setEditForm({ ...editForm, revit_versions: e.target.value })}
            />
          </div>
          <div className="form-row">
            <label>Changelog (Tiếng Việt)</label>
            <textarea
              value={editForm.release_notes_vi}
              onChange={(e) => setEditForm({ ...editForm, release_notes_vi: e.target.value })}
            />
          </div>
          <div className="form-row">
            <label>Changelog (English)</label>
            <textarea
              value={editForm.release_notes_en}
              onChange={(e) => setEditForm({ ...editForm, release_notes_en: e.target.value })}
            />
          </div>
          <div className="form-row checkbox">
            <label>
              <input
                type="checkbox"
                checked={editForm.is_latest}
                onChange={(e) => setEditForm({ ...editForm, is_latest: e.target.checked })}
              />
              Đặt làm bản mới nhất (nút "Tải về" trên web sẽ trỏ tới bản này)
            </label>
          </div>
          <div className="form-actions">
            <button className="btn-primary" onClick={saveEdit} disabled={editSaving}>
              {editSaving ? "Đang lưu..." : "Lưu thay đổi"}
            </button>
            <button className="btn-ghost" onClick={cancelEdit}>Huỷ</button>
          </div>
          {editMsg && <p style={{ fontSize: 13, marginTop: 10, color: "#C0392B" }}>{editMsg}</p>}
        </div>
      )}

      {loading ? (
        <p>Đang tải...</p>
      ) : (
        <>
        <ReleaseStatsSummary rows={rows} stats={stats} statsError={statsError} />
        <table className="admin-table">
          <thead>
            <tr>
              <th>Phiên bản</th><th>File</th><th>Dung lượng</th><th>Mới nhất</th>
              <th title="Bản này đã được Autodesk duyệt và có trên Autodesk App Store">Trên Store</th>
              <th>Ngày đăng</th>
              <th title="Số lượt bấm nút Tải về trên web (tổng / 7 ngày qua)">Lượt tải web</th>
              <th title="Số máy đang chạy phiên bản này, có mở OneTools trong 30 ngày qua">Máy đang dùng</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td>{r.version}</td>
                <td className="mono">{r.file_name}</td>
                <td>{r.file_size_mb} MB</td>
                <td>{r.is_latest ? "✓" : "—"}</td>
                <td>{r.on_store ? "✓" : "—"}</td>
                <td>{new Date(r.published_at).toLocaleDateString("vi-VN")}</td>
                <td>
                  {Number(stats[r.version]?.dl_total ?? 0)}
                  <span style={{ opacity: 0.55, fontSize: 12 }}> / {Number(stats[r.version]?.dl_7d ?? 0)} (7 ngày)</span>
                </td>
                <td>{Number(stats[r.version]?.devices_30d ?? 0)}</td>
                <td className="actions">
                  <button onClick={() => startEdit(r)}>Sửa</button>
                  {!r.is_latest && <button onClick={() => markLatest(r.id)}>Đặt làm mới nhất</button>}
                  <button onClick={() => toggleOnStore(r)}>{r.on_store ? "Bỏ Store" : "Đã có trên Store"}</button>
                  <button className="danger" onClick={() => remove(r)}>Xoá</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </>
      )}
    </div>
  );
}

// Dòng tóm tắt phía trên bảng phiên bản: tổng lượt tải web, tổng máy hoạt động 30 ngày,
// số máy chưa rõ phiên bản (chưa mở Revit kể từ khi bắt đầu ghi phiên bản) và các phiên bản
// đang có máy dùng nhưng không còn trong danh sách phát hành (vd bản DEV/bản đã xoá).
function ReleaseStatsSummary({ rows, stats, statsError }) {
  if (statsError) {
    return <p style={{ fontSize: 13, color: "#C0392B", margin: "4px 0 12px" }}>{statsError}</p>;
  }
  const all = Object.values(stats);
  const totalDl = all.reduce((n, r) => n + Number(r.dl_total || 0), 0);
  const totalDl7 = all.reduce((n, r) => n + Number(r.dl_7d || 0), 0);
  const totalDevices = all.reduce((n, r) => n + Number(r.devices_30d || 0), 0);
  const unknown = Number(stats.__unknown__?.devices_30d || 0);
  const known = new Set(rows.map((r) => r.version));
  const others = all.filter((r) => r.ver && !known.has(r.ver) && Number(r.devices_30d || 0) > 0);

  return (
    <div style={{ fontSize: 13, margin: "4px 0 14px", lineHeight: 1.7, opacity: 0.9 }}>
      <div>
        Lượt tải web: <b>{totalDl}</b> (7 ngày qua: <b>{totalDl7}</b>) · Máy hoạt động 30 ngày: <b>{totalDevices}</b>
        {unknown > 0 && <> · Chưa rõ phiên bản: <b>{unknown}</b></>}
      </div>
      {others.length > 0 && (
        <div style={{ opacity: 0.75 }}>
          Phiên bản khác đang dùng: {others.map((r) => `${r.ver} (${Number(r.devices_30d)} máy)`).join(", ")}
        </div>
      )}
    </div>
  );
}

// =====================================================================
// XEM PHẢN HỒI TỪ NGƯỜI DÙNG (kèm ảnh đính kèm)
// =====================================================================
// Ô trả lời cho từng dòng feedback — 2 cách gửi:
// 1) "Mở email" — luôn hoạt động ngay, không cần cấu hình gì, mở app email trên máy admin.
// 2) "Gửi qua hệ thống" — gửi thật từ trong trang web qua Edge Function + Resend (cần deploy trước,
//    xem sql/supabase-edge-function-reply-feedback/README.md để biết cách bật tính năng này).
function ReplyBox({ feedback }) {
  const [text, setText] = useState("");
  const [status, setStatus] = useState("idle"); // idle | sending | sent | error
  const [errorMsg, setErrorMsg] = useState("");

  const mailtoHref = `mailto:${feedback.sender_email}?subject=${encodeURIComponent(
    "Re: Phản hồi OneTools - " + feedback.license_key
  )}&body=${encodeURIComponent(text)}`;

  const sendViaSystem = async () => {
    if (!text.trim()) return;
    setStatus("sending");
    setErrorMsg("");
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

      const res = await fetch(`${supabaseUrl}/functions/v1/reply-feedback`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          to: feedback.sender_email,
          licenseKey: feedback.license_key,
          originalMessage: feedback.message,
          replyMessage: text,
        }),
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.error || `Lỗi ${res.status}`);
      }

      setStatus("sent");
      setText("");
    } catch (err) {
      setStatus("error");
      setErrorMsg(err.message);
    }
  };

  return (
    <div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Nhập nội dung trả lời..."
        rows={2}
        style={{
          width: "100%",
          padding: 7,
          background: "#FFFFFF",
          border: "1px solid #D9D5CC",
          color: "#222",
          fontSize: 12.5,
          boxSizing: "border-box",
          marginBottom: 6,
          fontFamily: "inherit",
        }}
      />
      <div style={{ display: "flex", gap: 6 }}>
        <a
          href={mailtoHref}
          style={{
            fontSize: 11.5,
            padding: "5px 10px",
            border: "1px solid #D9D5CC",
            color: "#222",
            textDecoration: "none",
          }}
        >
          Mở email
        </a>
        <button
          onClick={sendViaSystem}
          disabled={status === "sending" || !text.trim()}
          style={{
            fontSize: 11.5,
            padding: "5px 10px",
            background: "#B98236",
            color: "#FFFFFF",
            border: "none",
            cursor: "pointer",
          }}
        >
          {status === "sending" ? "Đang gửi..." : "Gửi qua hệ thống"}
        </button>
      </div>
      {status === "sent" && <p style={{ color: "#2E8B57", fontSize: 11.5, marginTop: 4 }}>Đã gửi.</p>}
      {status === "error" && <p style={{ color: "#C0392B", fontSize: 11.5, marginTop: 4 }}>{errorMsg}</p>}
    </div>
  );
}

function FeedbackManager() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [lightboxUrl, setLightboxUrl] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setErrorMsg("");

    const { data, error } = await supabase
      .from("feedback")
      .select("*")
      .order("id", { ascending: false });

    if (error) {
      setErrorMsg(
        "Không tải được danh sách phản hồi. Kiểm tra đã chạy sql/schema_feedback_access.sql chưa. Chi tiết: " +
          error.message
      );
      setLoading(false);
      return;
    }

    // Với mỗi dòng có ảnh đính kèm, tạo "signed URL" tạm thời (hết hạn sau 1 giờ) —
    // vì bucket feedback-attachments ở chế độ riêng tư, không thể dùng link công khai trực tiếp.
    const withImages = await Promise.all(
      (data || []).map(async (row) => {
        if (!row.image_path) return { ...row, imageUrl: null };
        const { data: signed, error: signErr } = await supabase.storage
          .from("feedback-attachments")
          .createSignedUrl(row.image_path, 3600);
        return { ...row, imageUrl: signErr ? null : signed?.signedUrl };
      })
    );

    setRows(withImages);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <p>Đang tải...</p>;
  if (errorMsg) return <p style={{ color: "#C0392B", fontSize: 13 }}>{errorMsg}</p>;

  return (
    <div>
      {rows.length === 0 && <p style={{ color: "#6B6558", fontSize: 13 }}>Chưa có phản hồi nào.</p>}

      <table className="admin-table">
        <thead>
          <tr>
            <th>License</th>
            <th>Người gửi</th>
            <th>Nội dung</th>
            <th>Phiên bản</th>
            <th>Ảnh</th>
            <th>Trả lời</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id}>
              <td className="mono">{r.license_key}</td>
              <td>
                <div>{r.sender_email}</div>
                <div style={{ color: "#6B6558", fontSize: 12 }}>{r.sender_phone}</div>
              </td>
              <td style={{ maxWidth: 320 }}>{r.message}</td>
              <td className="mono">{r.app_version}</td>
              <td>
                {r.imageUrl ? (
                  <img
                    src={r.imageUrl}
                    alt="Ảnh đính kèm"
                    style={{ width: 64, height: 64, objectFit: "cover", cursor: "pointer", border: "1px solid #D9D5CC" }}
                    onClick={() => setLightboxUrl(r.imageUrl)}
                  />
                ) : r.image_path ? (
                  <span style={{ color: "#C0392B", fontSize: 12 }}>Lỗi tải ảnh</span>
                ) : (
                  <span style={{ color: "#6B6558", fontSize: 12 }}>—</span>
                )}
              </td>
              <td style={{ minWidth: 220 }}>
                <ReplyBox feedback={r} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {lightboxUrl && (
        <div
          onClick={() => setLightboxUrl(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.85)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 50,
            cursor: "zoom-out",
            padding: 24,
          }}
        >
          <img src={lightboxUrl} alt="Ảnh đính kèm phóng to" style={{ maxWidth: "90%", maxHeight: "90%", objectFit: "contain" }} />
        </div>
      )}
    </div>
  );
}

const adminStyles = `
  /* ĐỔI (2026-11-23): giao diện SÁNG cho dễ nhìn. Bảng màu:
     nền trang #F4F2EE · thẻ/bảng trắng · tiêu đề bảng #ECE9E3 · dòng xen kẽ #F8F7F4 · viền #D9D5CC
     chữ #222 · chữ phụ #6B6558 · chữ mờ #8A8478 · nhấn (đồng) #A06C28 · nút chính nền #B98236 chữ trắng. */
  .admin-root { min-height: 100vh; background: #F4F2EE; color: #222; font-family: -apple-system, "Segoe UI", sans-serif; font-size: 15px; }
  /* mọi tab căn giữa trang, rộng tối đa 1200px; viền ngang vẫn tràn hết chiều rộng. */
  .admin-header { display: flex; justify-content: space-between; align-items: center; padding: 22px max(32px, calc((100% - 1200px) / 2)); background: #FFFFFF; border-bottom: 1px solid #E8E5DF; }
  .admin-header h1 { font-size: 21px; margin: 0; color: #222; }
  .admin-tabs { display: flex; gap: 4px; padding: 0 max(32px, calc((100% - 1200px) / 2)); background: #FFFFFF; border-bottom: 1px solid #D9D5CC; flex-wrap: wrap; }
  .admin-tabs button { padding: 14px 20px; background: transparent; border: none; color: #6B6558; cursor: pointer; font-size: 15.5px; border-bottom: 3px solid transparent; }
  .admin-tabs button:hover { color: #222; }
  .admin-tabs button.active { color: #A06C28; border-bottom-color: #B98236; font-weight: 600; }
  .admin-main { padding: 32px 32px 60px; max-width: 1200px; margin: 0 auto; box-sizing: border-box; }
  .btn-primary { background: #B98236; color: #FFFFFF; border: none; padding: 11px 20px; font-weight: 600; cursor: pointer; font-size: 14.5px; margin-bottom: 20px; border-radius: 4px; }
  .btn-primary:hover { background: #A06C28; }
  .btn-primary:disabled { opacity: 0.6; cursor: default; }
  .btn-ghost { background: #FFFFFF; color: #222; border: 1px solid #D9D5CC; padding: 11px 20px; cursor: pointer; font-size: 14.5px; border-radius: 4px; }
  .btn-ghost:hover { background: #F1EEE8; }
  .admin-table { width: 100%; border-collapse: collapse; font-size: 15px; margin-top: 8px; background: #FFFFFF; border: 1px solid #D9D5CC; }
  .admin-table th { text-align: left; padding: 12px; background: #ECE9E3; border-bottom: 1px solid #D9D5CC; color: #6B6558; font-weight: 600; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em; }
  .admin-table td { padding: 12px; border-bottom: 1px solid #E8E5DF; }
  .admin-table tbody tr:nth-child(even) td { background: #F8F7F4; }
  .admin-table tbody tr:hover td { background: #F1EEE8; }
  .admin-table .mono { font-family: monospace; color: #6B6558; }
  .admin-table .actions { display: flex; gap: 8px; }
  .admin-table .actions button { background: #FFFFFF; border: 1px solid #D9D5CC; color: #222; padding: 5px 10px; cursor: pointer; font-size: 13.5px; border-radius: 4px; }
  .admin-table .actions button:hover { background: #F1EEE8; }
  .admin-table .actions button.danger { color: #C0392B; border-color: #E9C3BE; }
  .admin-form { border: 1px solid #D9D5CC; background: #FFFFFF; padding: 24px; margin-bottom: 24px; border-radius: 6px; }
  .form-row { margin-bottom: 14px; }
  .form-row label { display: block; font-size: 13.5px; color: #6B6558; margin-bottom: 6px; }
  .form-row input, .form-row textarea { width: 100%; padding: 9px 11px; background: #FFFFFF; border: 1px solid #D9D5CC; color: #222; font-size: 15px; box-sizing: border-box; font-family: inherit; border-radius: 4px; }
  .form-row input:focus, .form-row textarea:focus { outline: none; border-color: #B98236; box-shadow: 0 0 0 2px rgba(185,130,54,0.18); }
  .form-row textarea { resize: vertical; min-height: 60px; }
  .form-row.checkbox label { display: flex; align-items: center; gap: 8px; font-size: 14.5px; color: #222; }
  .form-row.checkbox input { width: auto; }
  .form-actions { display: flex; gap: 10px; margin-top: 18px; }
  .acq-muted { color: #8A8478; font-size: 14px; }
  .acq-toolbar { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; margin-bottom: 20px; }
  .acq-seg { display: inline-flex; border: 1px solid #D9D5CC; background: #FFFFFF; border-radius: 4px; overflow: hidden; }
  .acq-seg button { background: transparent; color: #444; border: none; border-right: 1px solid #D9D5CC; padding: 9px 18px; font-size: 14.5px; cursor: pointer; }
  .acq-seg button:last-child { border-right: none; }
  .acq-seg button.on { background: #B98236; color: #FFFFFF; font-weight: 600; }
  .acq-btn { background: #FFFFFF; color: #222; border: 1px solid #D9D5CC; padding: 9px 18px; font-size: 14.5px; cursor: pointer; border-radius: 4px; }
  .acq-btn:hover { background: #F1EEE8; }
  .acq-check { display: inline-flex; align-items: center; gap: 6px; font-size: 14.5px; color: #444; margin-left: auto; cursor: pointer; }
  .acq-error { font-size: 13px; color: #C0392B; }
  .acq-kpis { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; margin-bottom: 8px; }
  .acq-kpi { background: #FFFFFF; border: 1px solid #D9D5CC; border-left: 4px solid #B98236; padding: 18px 20px; border-radius: 6px; }
  .acq-kpi-label { font-size: 13px; color: #6B6558; text-transform: uppercase; letter-spacing: 0.05em; }
  .acq-kpi-value { font-size: 36px; font-weight: 700; margin: 4px 0 2px; color: #222; }
  .acq-kpi-sub { font-size: 13px; color: #8A8478; }
  .acq-section { margin: 32px 0 12px; font-size: 18px; font-weight: 600; color: #A06C28; padding-bottom: 6px; border-bottom: 1px solid #D9D5CC; }
  .acq-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; }
  .acq-card { background: #FFFFFF; border: 1px solid #D9D5CC; overflow: hidden; border-radius: 6px; }
  .acq-card-head { display: flex; justify-content: space-between; align-items: center; background: #ECE9E3; padding: 12px 16px; font-weight: 600; font-size: 15.5px; color: #222; }
  .acq-card-total { font-weight: 400; font-size: 13.5px; color: #6B6558; }
  .acq-card-note { font-size: 13px; color: #8A8478; padding: 8px 16px 0; }
  .acq-table { width: 100%; border-collapse: collapse; font-size: 15px; }
  .acq-table td { padding: 11px 16px; border-top: 1px solid #E8E5DF; vertical-align: middle; }
  .acq-table tbody tr:nth-child(even) td { background: #F8F7F4; }
  .acq-table tbody tr:hover td { background: #F1EEE8; }
  .acq-table th { text-align: left; padding: 11px 16px; background: #ECE9E3; color: #6B6558; font-weight: 600; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em; }
  .acq-label { width: 100%; }
  .acq-bar { height: 5px; background: #ECE9E3; margin-top: 6px; border-radius: 3px; overflow: hidden; }
  .acq-bar > div { height: 100%; background: #B98236; }
  .acq-num { text-align: right; font-weight: 600; width: 60px; }
  .acq-pct { text-align: right; width: 60px; color: #8A8478; font-size: 14px; }
  .acq-unknown td { color: #8A8478; font-style: italic; }
  .acq-unknown .acq-bar > div { background: #C8C3B8; }
  .acq-empty { color: #8A8478; text-align: center; padding: 16px !important; }
  .acq-mono { font-family: monospace; color: #444; font-size: 14px; }
  .acq-small { font-size: 13.5px; color: #6B6558; }
  .acq-nowrap { white-space: nowrap; }
  .acq-tag { display: inline-block; padding: 3px 10px; font-size: 13.5px; border: 1px solid #D9D5CC; background: #F4F2EE; border-radius: 10px; }
  .acq-tag.web { color: #1F5F8B; border-color: #B9D3E6; background: #EAF3FA; }
  .acq-tag.addin { color: #8A5A1C; border-color: #E6CFA8; background: #FBF3E6; }
  .acq-tag.src { color: #2E6B37; border-color: #BFDDC3; background: #ECF6EE; }
  .acq-help { margin-top: 26px; font-size: 14px; color: #6B6558; }
  .acq-help summary { cursor: pointer; }
  .acq-help div { margin-top: 8px; line-height: 1.8; padding: 10px 14px; background: #FFFFFF; border: 1px solid #E8E5DF; border-radius: 6px; }
  @media (max-width: 760px) { .acq-grid, .acq-kpis { grid-template-columns: 1fr; } }
`;
