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
        <button className={tab === "releases" ? "active" : ""} onClick={() => setTab("releases")}>
          Bản cập nhật
        </button>
        <button className={tab === "feedback" ? "active" : ""} onClick={() => setTab("feedback")}>
          Phản hồi
        </button>
      </nav>
      <main className="admin-main">
        {tab === "videos" && <VideosManager />}
        {tab === "pricing" && <PricingManager />}
        {tab === "releases" && <ReleasesManager />}
        {tab === "feedback" && <FeedbackManager />}
      </main>
    </div>
  );
}

function CenterMsg({ text }) {
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#161512", color: "#F3EFE6", fontFamily: "sans-serif", padding: 24, textAlign: "center" }}>
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
      {saveError && <p style={{ color: "#E08080", fontSize: 12.5, marginTop: 10 }}>{saveError}</p>}
    </div>
  );
}

// =====================================================================
// QUẢN LÝ BẢN CẬP NHẬT (upload file cài đặt + thông tin phiên bản)
// =====================================================================
const EMPTY_RELEASE = {
  version: "",
  revit_versions: "2025 · 2026",
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

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("releases").select("*").order("published_at", { ascending: false });
    setRows(data || []);
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
        {uploadMsg && <p style={{ fontSize: 13, marginTop: 10, color: "#C9A15F" }}>{uploadMsg}</p>}
      </div>

      {editingId && (
        <div className="admin-form">
          <h3 style={{ marginTop: 0 }}>
            Sửa bản {rows.find((r) => r.id === editingId)?.version}
          </h3>
          <div className="form-row">
            <label>File hiện tại</label>
            <p style={{ margin: 0, fontSize: 13, color: "#A79E8C" }} className="mono">
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
          {editMsg && <p style={{ fontSize: 13, marginTop: 10, color: "#E08080" }}>{editMsg}</p>}
        </div>
      )}

      {loading ? (
        <p>Đang tải...</p>
      ) : (
        <table className="admin-table">
          <thead>
            <tr>
              <th>Phiên bản</th><th>File</th><th>Dung lượng</th><th>Mới nhất</th><th>Ngày đăng</th><th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td>{r.version}</td>
                <td className="mono">{r.file_name}</td>
                <td>{r.file_size_mb} MB</td>
                <td>{r.is_latest ? "✓" : "—"}</td>
                <td>{new Date(r.published_at).toLocaleDateString("vi-VN")}</td>
                <td className="actions">
                  <button onClick={() => startEdit(r)}>Sửa</button>
                  {!r.is_latest && <button onClick={() => markLatest(r.id)}>Đặt làm mới nhất</button>}
                  <button className="danger" onClick={() => remove(r)}>Xoá</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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
          background: "#161512",
          border: "1px solid #37342C",
          color: "#F3EFE6",
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
            border: "1px solid #37342C",
            color: "#F3EFE6",
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
            background: "#C9A15F",
            color: "#161512",
            border: "none",
            cursor: "pointer",
          }}
        >
          {status === "sending" ? "Đang gửi..." : "Gửi qua hệ thống"}
        </button>
      </div>
      {status === "sent" && <p style={{ color: "#7FBF7F", fontSize: 11.5, marginTop: 4 }}>Đã gửi.</p>}
      {status === "error" && <p style={{ color: "#E08080", fontSize: 11.5, marginTop: 4 }}>{errorMsg}</p>}
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
  if (errorMsg) return <p style={{ color: "#E08080", fontSize: 13 }}>{errorMsg}</p>;

  return (
    <div>
      {rows.length === 0 && <p style={{ color: "#A79E8C", fontSize: 13 }}>Chưa có phản hồi nào.</p>}

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
                <div style={{ color: "#A79E8C", fontSize: 12 }}>{r.sender_phone}</div>
              </td>
              <td style={{ maxWidth: 320 }}>{r.message}</td>
              <td className="mono">{r.app_version}</td>
              <td>
                {r.imageUrl ? (
                  <img
                    src={r.imageUrl}
                    alt="Ảnh đính kèm"
                    style={{ width: 64, height: 64, objectFit: "cover", cursor: "pointer", border: "1px solid #37342C" }}
                    onClick={() => setLightboxUrl(r.imageUrl)}
                  />
                ) : r.image_path ? (
                  <span style={{ color: "#E08080", fontSize: 12 }}>Lỗi tải ảnh</span>
                ) : (
                  <span style={{ color: "#A79E8C", fontSize: 12 }}>—</span>
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
  .admin-root { min-height: 100vh; background: #161512; color: #F3EFE6; font-family: -apple-system, sans-serif; }
  .admin-header { display: flex; justify-content: space-between; align-items: center; padding: 20px 32px; border-bottom: 1px solid #37342C; }
  .admin-header h1 { font-size: 18px; margin: 0; }
  .admin-tabs { display: flex; gap: 4px; padding: 0 32px; border-bottom: 1px solid #37342C; }
  .admin-tabs button { padding: 12px 18px; background: transparent; border: none; color: #A79E8C; cursor: pointer; font-size: 14px; border-bottom: 2px solid transparent; }
  .admin-tabs button.active { color: #C9A15F; border-bottom-color: #C9A15F; }
  .admin-main { padding: 28px 32px; max-width: 900px; }
  .btn-primary { background: #C9A15F; color: #161512; border: none; padding: 10px 18px; font-weight: 600; cursor: pointer; font-size: 13px; margin-bottom: 20px; }
  .btn-ghost { background: transparent; color: #F3EFE6; border: 1px solid #37342C; padding: 10px 18px; cursor: pointer; font-size: 13px; }
  .admin-table { width: 100%; border-collapse: collapse; font-size: 13.5px; margin-top: 8px; }
  .admin-table th { text-align: left; padding: 10px; border-bottom: 1px solid #37342C; color: #A79E8C; font-weight: 500; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; }
  .admin-table td { padding: 10px; border-bottom: 1px solid #2A2822; }
  .admin-table .mono { font-family: monospace; color: #A79E8C; }
  .admin-table .actions { display: flex; gap: 8px; }
  .admin-table .actions button { background: transparent; border: 1px solid #37342C; color: #F3EFE6; padding: 5px 10px; cursor: pointer; font-size: 12px; }
  .admin-table .actions button.danger { color: #E08080; border-color: #4a2c2c; }
  .admin-form { border: 1px solid #37342C; background: #1F1D19; padding: 24px; margin-bottom: 24px; }
  .form-row { margin-bottom: 14px; }
  .form-row label { display: block; font-size: 12px; color: #A79E8C; margin-bottom: 6px; }
  .form-row input, .form-row textarea { width: 100%; padding: 9px 11px; background: #161512; border: 1px solid #37342C; color: #F3EFE6; font-size: 13.5px; box-sizing: border-box; font-family: inherit; }
  .form-row textarea { resize: vertical; min-height: 60px; }
  .form-row.checkbox label { display: flex; align-items: center; gap: 8px; font-size: 13px; color: #F3EFE6; }
  .form-row.checkbox input { width: auto; }
  .form-actions { display: flex; gap: 10px; margin-top: 18px; }
`;
