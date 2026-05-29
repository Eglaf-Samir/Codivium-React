import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import {
  getallfaq,
  createfaqasync,
  updatefaqasync,
  deletefaqasync,
} from '../../api/faqmanagement/apifaqmanagement';
import { logout } from '../../utils/auth';
import AdminPager from '../../components/AdminPager.jsx';
import AdminModal from '../../components/AdminModal.jsx';

const initialForm = { id: '', title: '', description: '' };

export default function FaqManagement() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadAll(); /* eslint-disable-next-line */ }, []);

  function authFail() { logout(); navigate('/login', { replace: true }); }

  async function loadAll() {
    setLoading(true);
    const res = await getallfaq();
    if (res?.status === 200 && Array.isArray(res?.data)) setItems(res.data);
    else if (res?.status === 401) { authFail(); return; }
    else setItems([]);
    setLoading(false);
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter(f =>
      (f.question || '').toLowerCase().includes(q) ||
      (f.answer || '').toLowerCase().includes(q)
    );
  }, [items, search]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / rowsPerPage));
  const pageSafe = Math.min(page, pageCount - 1);
  const visible = filtered.slice(pageSafe * rowsPerPage, (pageSafe + 1) * rowsPerPage);

  function openNew() { setForm(initialForm); setOpen(true); }
  function openEdit(it) { setForm({ id: it.id, title: it.question || '', description: it.answer || '' }); setOpen(true); }
  function close() { setOpen(false); setForm(initialForm); }

  async function submit(e) {
    e.preventDefault();
    if (!form.title.trim() || !form.description.trim()) {
      Swal.fire({ title: 'Missing fields', text: 'Both question and answer are required.', icon: 'warning' });
      return;
    }
    setSaving(true);
    const body = { id: form.id || 0, title: form.title, description: form.description };
    const res = form.id
      ? await updatefaqasync(JSON.stringify(body))
      : await createfaqasync(JSON.stringify(body));
    setSaving(false);

    if (res?.status === 200 && res?.data) {
      await loadAll();
      close();
      Swal.fire({ title: 'Success', text: form.id ? 'FAQ updated.' : 'FAQ created.', icon: 'success' });
    } else if (res?.status === 401) authFail();
    else Swal.fire({ title: 'Error', text: 'Could not save FAQ.', icon: 'error' });
  }

  async function remove(id) {
    const ok = await Swal.fire({
      title: 'Delete this FAQ?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete',
      cancelButtonText: 'Cancel',
      reverseButtons: true,
    });
    if (!ok.isConfirmed) return;
    const res = await deletefaqasync(id);
    if (res?.status === 401) { authFail(); return; }
    if (res?.data === true || res?.data === 'true') {
      await loadAll();
      Swal.fire({ title: 'Deleted', icon: 'success' });
    } else {
      Swal.fire({ title: 'Error', text: res?.data || 'Delete failed.', icon: 'error' });
    }
  }

  return (
    <main className="main" id="main-content">
      <div className="cv-admin-page">
        <header className="cv-admin-header">
          <div className="cv-admin-header-text">
            <div className="cv-admin-kicker">Superadmin</div>
            <h1 className="cv-admin-title">FAQ Management</h1>
            <p className="cv-admin-subtitle">
              {loading ? 'Loading…' : `${filtered.length} of ${items.length} entries`}
            </p>
          </div>
          <button type="button" className="cv-admin-btn is-primary" onClick={openNew}>+ New FAQ</button>
        </header>

        <section className="cv-admin-surface">
          <div className="cv-admin-surface-head">
            <h2>All FAQs</h2>
            <label className="cv-admin-search">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.8" />
                <path d="m20 20-3.5-3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
              <input type="search" placeholder="Search question or answer…"
                value={search} onChange={e => { setSearch(e.target.value); setPage(0); }} />
            </label>
          </div>

          <div className="cv-admin-table-wrap">
            {loading ? (
              <div className="cv-admin-loading"><span className="cv-admin-spinner" />Loading…</div>
            ) : filtered.length === 0 ? (
              <div className="cv-admin-table-empty">{search ? 'No matches.' : 'No FAQs yet.'}</div>
            ) : (
              <table className="cv-admin-table">
                <thead>
                  <tr><th style={{ width: '32%' }}>Question</th><th>Answer</th><th aria-label="Actions" /></tr>
                </thead>
                <tbody>
                  {visible.map(it => (
                    <tr key={it.id}>
                      <td className="cell-email">{it.question || '—'}</td>
                      <td className="cell-muted" style={{ whiteSpace: 'pre-wrap' }}>
                        {(it.answer || '').length > 220 ? (it.answer || '').slice(0, 220) + '…' : (it.answer || '—')}
                      </td>
                      <td>
                        <div className="cv-admin-actions">
                          <button type="button" className="cv-admin-btn" onClick={() => openEdit(it)}>Edit</button>
                          <button type="button" className="cv-admin-btn is-warn" onClick={() => remove(it.id)}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {!loading && filtered.length > 0 && (
            <AdminPager
              total={filtered.length}
              page={pageSafe}
              rowsPerPage={rowsPerPage}
              onPageChange={setPage}
              onRowsPerPageChange={setRowsPerPage}
            />
          )}
        </section>
      </div>

      <AdminModal open={open} onClose={close}>
        <div className="cv-admin-modal" onClick={e => e.stopPropagation()}>
            <div className="cv-admin-modal-head">
              <h3>{form.id ? 'Edit FAQ' : 'New FAQ'}</h3>
              <button type="button" className="cv-admin-modal-close" onClick={close} aria-label="Close">×</button>
            </div>
            <form onSubmit={submit}>
              <div className="cv-admin-modal-body">
                <div className="cv-admin-form-grid">
                  <div className="cv-admin-field is-full">
                    <label htmlFor="faq-title">Question</label>
                    <input id="faq-title" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required />
                  </div>
                  <div className="cv-admin-field is-full">
                    <label htmlFor="faq-desc">Answer</label>
                    <textarea id="faq-desc" rows={6} value={form.description}
                      onChange={e => setForm(f => ({ ...f, description: e.target.value }))} required />
                  </div>
                </div>
              </div>
              <div className="cv-admin-modal-foot">
                <button type="button" className="cv-admin-btn" onClick={close} disabled={saving}>Cancel</button>
                <button type="submit" className="cv-admin-btn is-primary" disabled={saving}>
                  {saving ? 'Saving…' : (form.id ? 'Save changes' : 'Create FAQ')}
                </button>
              </div>
            </form>
          </div>
      </AdminModal>
    </main>
  );
}
