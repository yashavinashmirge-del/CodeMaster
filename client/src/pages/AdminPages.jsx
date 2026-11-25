/*
 * ============================================================
 * File Name     : AdminPages.jsx
 * Description   : Provides content authoring and Super Admin account tools.
 * Module        : Platform Administration
 * Author        : Your Name
 * Date          : 23/11/2026
 * ============================================================
 */

import { useEffect, useState } from "react";
import { ArrowRight, Eye, EyeOff, FilePlus2, Pencil, Plus, Save, ShieldCheck, Trash2, Users } from "lucide-react";
import api from "../services/api.js";
import { useAuth } from "../context/authContext.js";

const blankContent = { kind: "lesson", title: "", slug: "", description: "", body: "", language: "javascript", difficulty: "easy", published: false, hintsText: "", constraintsText: "", casesText: "[{\"input\":\"2 3\",\"expectedOutput\":\"5\",\"isHidden\":false}]" };
const apiError = (error) => error.response?.data?.message || "The request failed. Check the server connection and try again.";

/*
 * ============================================================
 * Function Name : AdminDashboardPage
 * Description   : Summarizes content responsibilities for platform staff.
 * Input         : Authenticated Admin or Super Admin session.
 * Output        : Content totals and direct authoring/account actions.
 * Author        : Your Name
 * Date          : 23/11/2026
 * ============================================================
 */
export function AdminDashboardPage() {
  const [items, setItems] = useState([]);
  const [users, setUsers] = useState(null);
  const [error, setError] = useState("");
  const { user } = useAuth();
  useEffect(() => {
    Promise.all([
      api.get("/content/manage"),
      ...(user.role === "superadmin" ? [api.get("/superadmin/users", { params: { limit: 1 } })] : []),
    ]).then(([contentResult, usersResult]) => { setItems(contentResult.data.items); if (usersResult) setUsers(usersResult.data.pagination.total); })
      .catch((requestError) => setError(apiError(requestError)));
  }, [user.role]);
  const published = items.filter((item) => item.published).length;
  const drafts = items.length - published;
  return <>
    <div className="page-heading"><div><p className="page-kicker">CONTENT OPERATIONS</p><h1>Admin workspace</h1><p>Review learning material and keep the student curriculum current.</p></div><a className="primary-cta" href="/admin/content">Open content studio <ArrowRight size={15} /></a></div>
    {error && <div className="inline-alert error-alert" role="alert">{error}</div>}
    <section className="overview-strip"><div><span>Total content items</span><strong>{items.length}</strong></div><div><span>Published</span><strong>{published}</strong></div><div><span>Drafts</span><strong>{drafts}</strong></div>{users !== null && <div><span>Platform users</span><strong>{users}</strong></div>}</section>
    <section className="content-section"><div className="section-heading"><div><h2>Content by type</h2><p>Lessons, notes, and practice questions managed from one place.</p></div></div><div className="analytics-table"><div className="analytics-head"><span>CONTENT TYPE</span><span>ITEMS</span><span>PUBLISHED</span></div>{["language", "topic", "lesson", "note", "question"].map((kind) => { const rows = items.filter((item) => item.kind === kind); return <div className="analytics-row" key={kind}><strong>{kind[0].toUpperCase() + kind.slice(1)}</strong><span>{rows.length}</span><span>{rows.filter((item) => item.published).length}</span></div>; })}</div></section>
    {user.role === "superadmin" && <section className="content-section"><div className="section-heading"><div><h2>Platform administration</h2><p>Create Admin accounts and manage account status.</p></div><a className="text-link" href="/superadmin/users">Manage users <ArrowRight size={15} /></a></div></section>}
  </>;
}


/*
 * ============================================================
 * Function Name : ContentStudioPage
 * Description   : Creates, edits, publishes, and removes learning content.
 * Input         : Authenticated Admin or Super Admin session.
 * Output        : Content list and validated authoring form.
 * Author        : Your Name
 * Date          : 23/11/2026
 * ============================================================
 */
export function ContentStudioPage() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(blankContent);
  const [editingId, setEditingId] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const loadItems = () => api.get("/content/manage").then(({ data }) => setItems(data.items)).catch((requestError) => setError(apiError(requestError))).finally(() => setLoading(false));
  useEffect(() => { loadItems(); }, []);
  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  /*
   * ============================================================
   * Function Name : saveContent
   * Description   : Validates and persists content through the API.
   * Input         : Content form submit event.
   * Output        : Updated content list or an actionable error message.
   * Author        : Your Name
   * Date          : 23/11/2026
   * ============================================================
   */
  const saveContent = async (event) => {
    event.preventDefault(); setError(""); setMessage("");
    if (!form.title.trim() || !form.slug.trim() || !form.body.trim()) return setError("Add a title, URL slug, and learning content before saving.");
    let testCases = [];
    if (form.kind === "question") {
      try { testCases = JSON.parse(form.casesText); if (!Array.isArray(testCases)) throw new Error(); }
      catch { return setError("Test cases must be a valid JSON array with input, expectedOutput, and optional isHidden fields."); }
    }
    setBusy(true);
    const payload = { ...form, hints: form.hintsText.split("\n").map((line) => line.trim()).filter(Boolean), constraints: form.constraintsText.split("\n").map((line) => line.trim()).filter(Boolean), testCases };
    delete payload.hintsText; delete payload.constraintsText; delete payload.casesText;
    try {
      if (editingId) await api.put(`/content/${editingId}`, payload); else await api.post("/content", payload);
      setMessage(editingId ? "Content changes saved." : "Content created.");
      setForm(blankContent); setEditingId(""); await loadItems();
    } catch (requestError) { setError(apiError(requestError)); }
    finally { setBusy(false); }
  };

  /*
   * ============================================================
   * Function Name : editItem
   * Description   : Loads a selected content record into the editor.
   * Input         : One managed content item.
   * Output        : Populated authoring form and edit mode.
   * Author        : Your Name
   * Date          : 23/11/2026
   * ============================================================
   */
  const editItem = (item) => {
    setEditingId(item._id);
    setForm({ ...blankContent, ...item, hintsText: item.hints?.join("\n") || "", constraintsText: item.constraints?.join("\n") || "", casesText: JSON.stringify(item.testCases || [], null, 2) });
    setMessage(""); setError("");
    document.getElementById("content-editor")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  const deleteItem = async (item) => {
    if (!window.confirm(`Delete “${item.title}”? This cannot be undone.`)) return;
    try { await api.delete(`/content/${item._id}`); setItems((current) => current.filter((entry) => entry._id !== item._id)); if (editingId === item._id) { setEditingId(""); setForm(blankContent); } setMessage("Content deleted."); }
    catch (requestError) { setError(apiError(requestError)); }
  };
  const cancelEdit = () => { setEditingId(""); setForm(blankContent); setMessage(""); setError(""); };

  return <>
    <div className="page-heading"><div><p className="page-kicker">CONTENT MANAGEMENT</p><h1>Content studio</h1><p>Create lessons, notes, questions, and language topics for students.</p></div><a className="secondary-button" href="#content-editor"><Plus size={15} />New content</a></div>
    <div className="admin-content-grid">
      <section className="admin-list-panel"><div className="section-heading"><div><h2>Published and draft content</h2><p>{items.length} items in the platform library.</p></div></div>{loading ? <p className="muted-line">Loading content…</p> : items.length ? <div className="managed-list">{items.map((item) => <div className="managed-row" key={item._id}><div className="managed-main"><strong>{item.title}</strong><span>{item.kind} · {item.language || "general"} · {item.published ? "published" : "draft"}</span></div><button className="icon-button" onClick={() => editItem(item)} aria-label={`Edit ${item.title}`}><Pencil size={15} /></button><button className="icon-button danger-icon" onClick={() => deleteItem(item)} aria-label={`Delete ${item.title}`}><Trash2 size={15} /></button></div>)}</div> : <div className="empty-inline">No content yet. Create the first learning item in the editor.</div>}</section>
      <section className="admin-editor-panel" id="content-editor"><div className="section-heading"><div><h2>{editingId ? "Edit content" : "Create content"}</h2><p>Save as a draft or publish it to student libraries.</p></div>{editingId ? <button className="quiet-button" onClick={cancelEdit}>Cancel edit</button> : <FilePlus2 size={17} />}</div>
        <form className="content-form" onSubmit={saveContent}>
          <div className="form-grid two-cols"><label>Content type<select value={form.kind} onChange={(event) => update("kind", event.target.value)}><option value="language">Language</option><option value="topic">Topic</option><option value="lesson">Lesson</option><option value="note">Note</option><option value="question">Question</option></select></label><label>Language<select value={form.language} onChange={(event) => update("language", event.target.value)}>{Object.entries({ c: "C", cpp: "C++", java: "Java", javascript: "JavaScript" }).map(([key, value]) => <option key={key} value={key}>{value}</option>)}</select></label></div>
          <label>Title<input value={form.title} maxLength={160} onChange={(event) => update("title", event.target.value)} required /></label>
          <label>URL slug<input value={form.slug} maxLength={180} onChange={(event) => update("slug", event.target.value.toLowerCase().replace(/\s+/g, "-"))} required /></label>
          <label>Short description<input value={form.description} maxLength={1200} onChange={(event) => update("description", event.target.value)} /></label>
          {form.kind === "question" && <label>Difficulty<select value={form.difficulty} onChange={(event) => update("difficulty", event.target.value)}><option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option></select></label>}
          <label>Learning content<textarea value={form.body} onChange={(event) => update("body", event.target.value)} rows={9} required maxLength={30000} placeholder="Explain the concept or describe the problem…" /></label>
          {form.kind === "question" && <><label>Hints <span className="optional-label">one per line</span><textarea value={form.hintsText} onChange={(event) => update("hintsText", event.target.value)} rows={3} /></label><label>Constraints <span className="optional-label">one per line</span><textarea value={form.constraintsText} onChange={(event) => update("constraintsText", event.target.value)} rows={3} /></label><label>Test cases <span className="optional-label">JSON array; hidden tests are never shown to students</span><textarea className="mono-input" value={form.casesText} onChange={(event) => update("casesText", event.target.value)} rows={7} /></label></>}
          <label className="publish-toggle"><input type="checkbox" checked={form.published} onChange={(event) => update("published", event.target.checked)} /><span><strong>Publish this item</strong><small>Published material appears in student learning libraries.</small></span></label>
          {error && <p className="form-error" role="alert">{error}</p>}{message && <p className="form-success" role="status">{message}</p>}
          <button className="primary-cta" type="submit" disabled={busy}>{busy ? "Saving…" : editingId ? "Save changes" : "Create content"}<Save size={15} /></button>
        </form>
      </section>
    </div>
  </>;
}

/*
 * ============================================================
 * Function Name : SuperAdminUsersPage
 * Description   : Creates Admin accounts and manages user activation.
 * Input         : Authenticated Super Admin account.
 * Output        : Account creation form and paginated user list.
 * Author        : Your Name
 * Date          : 23/11/2026
 * ============================================================
 */
export function SuperAdminUsersPage() {
  const [users, setUsers] = useState([]); const [values, setValues] = useState({ name: "", email: "", password: "" });
  const [busy, setBusy] = useState(false); const [loading, setLoading] = useState(true); const [error, setError] = useState(""); const [message, setMessage] = useState("");
  const load = () => api.get("/superadmin/users", { params: { limit: 100 } }).then(({ data }) => setUsers(data.users)).catch((requestError) => setError(apiError(requestError))).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);
  const createAdmin = async (event) => {
    event.preventDefault(); setError(""); setMessage("");
    if (values.name.trim().length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim()) || values.password.length < 12) return setError("Enter a valid name and email. Admin passwords must contain at least 12 characters.");
    setBusy(true);
    try { await api.post("/admin/create", { ...values, name: values.name.trim(), email: values.email.trim().toLowerCase() }); setValues({ name: "", email: "", password: "" }); setMessage("Admin account created. The Admin can now sign in with these credentials."); await load(); }
    catch (requestError) { setError(apiError(requestError)); }
    finally { setBusy(false); }
  };
  const toggleActive = async (user) => {
    try { const { data } = await api.patch(`/superadmin/users/${user._id}/status`, { active: !user.isActive }); setUsers((current) => current.map((entry) => entry._id === user._id ? data.user : entry)); }
    catch (requestError) { setError(apiError(requestError)); }
  };
  return <>
    <div className="page-heading"><div><p className="page-kicker">PLATFORM ADMINISTRATION</p><h1>User accounts</h1><p>Create Admin access and control student and Admin account status.</p></div></div>
    <section className="admin-create-panel"><div className="section-heading"><div><h2>Create an Admin</h2><p>Only Super Admins can create content manager accounts.</p></div><ShieldCheck size={18} /></div><form className="content-form" onSubmit={createAdmin}><div className="form-grid three-cols"><label>Name<input value={values.name} onChange={(event) => setValues({ ...values, name: event.target.value })} maxLength={60} required /></label><label>Email<input type="email" value={values.email} onChange={(event) => setValues({ ...values, email: event.target.value })} maxLength={254} required /></label><label>Password<input type="password" value={values.password} onChange={(event) => setValues({ ...values, password: event.target.value })} minLength={12} required /><small>At least 12 characters</small></label></div>{error && <p className="form-error" role="alert">{error}</p>}{message && <p className="form-success" role="status">{message}</p>}<button className="primary-cta" disabled={busy}>{busy ? "Creating…" : "Create Admin account"}<Users size={15} /></button></form></section>
    <section className="content-section"><div className="section-heading"><div><h2>Platform users</h2><p>Super Admin accounts are protected from deactivation here.</p></div></div>{loading ? <p className="muted-line">Loading user accounts…</p> : <div className="table-scroll"><table className="data-table"><thead><tr><th>NAME</th><th>EMAIL</th><th>ROLE</th><th>STATUS</th><th>LAST SIGN IN</th><th>ACTION</th></tr></thead><tbody>{users.map((user) => <tr key={user._id}><td>{user.name}</td><td>{user.email}</td><td>{user.role}</td><td><span className={`result-chip ${user.isActive ? "success" : "failed"}`}>{user.isActive ? "Active" : "Inactive"}</span></td><td>{user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : "Never"}</td><td>{user.role === "superadmin" ? <span className="muted-line">Protected</span> : <button className="quiet-button" onClick={() => toggleActive(user)}>{user.isActive ? <><EyeOff size={14} /> Deactivate</> : <><Eye size={14} /> Activate</>}</button>}</td></tr>)}</tbody></table></div>}</section>
  </>;
}
