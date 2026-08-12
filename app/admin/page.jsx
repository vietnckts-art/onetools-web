"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";

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
      </nav>
      <main className="admin-main">
        {tab === "videos" ? <VideosManager /> : <PricingManager />}
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
    if (editing === "new") {
      await supabase.from("tool_videos").insert([{ ...form, sort_order: Number(form.sort_order) }]);
    } else {
      await supabase.from("tool_videos").update({ ...form, sort_order: Number(form.sort_order) }).eq("id", editing);
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

  const save = async () => {
    setSaving(true);
    const payload = {
      ...form,
      sort_order: Number(form.sort_order),
      features_vi: form.features_vi.split("\n").map((s) => s.trim()).filter(Boolean),
      features_en: form.features_en.split("\n").map((s) => s.trim()).filter(Boolean),
    };
    if (editing === "new") {
      await supabase.from("pricing_plans").insert([payload]);
    } else {
      await supabase.from("pricing_plans").update(payload).eq("id", editing);
    }
    setSaving(false);
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
        <PlanForm form={form} setForm={setForm} onSave={save} onCancel={cancel} saving={saving} />
      ) : (
        <button className="btn-primary" onClick={startNew}>+ Thêm gói mới</button>
      )}

      <table className="admin-table">
        <thead>
          <tr>
            <th>Tên (VI)</th><th>Giá</th><th>Nổi bật</th><th>Thứ tự</th><th>Đăng</th><th></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id}>
              <td>{r.name_vi}</td>
              <td>{r.price}</td>
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

function PlanForm({ form, setForm, onSave, onCancel, saving }) {
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  return (
    <div className="admin-form">
      <div className="form-row"><label>Tên gói (VI)</label><input value={form.name_vi} onChange={set("name_vi")} /></div>
      <div className="form-row"><label>Tên gói (EN)</label><input value={form.name_en} onChange={set("name_en")} /></div>
      <div className="form-row"><label>Giá (để "Liên hệ" nếu không niêm yết giá)</label><input value={form.price} onChange={set("price")} /></div>
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
