import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import {
  getAllArticlesAdmin,
  createArticleAsync,
  updateArticleAsync,
  deleteArticleAsync,
} from '../../api/articles/apiArticles';
import { logout } from '../../utils/auth';
import AdminPager from '../../components/AdminPager.jsx';
import AdminModal from '../../components/AdminModal.jsx';
import AdminRichEditor from '../../components/AdminRichEditor.jsx';

const initialForm = {
  id: '',
  slug: '',
  title: '',
  category: '',
  publishedDate: new Date().toISOString().slice(0, 10),
  readTime: '',
  subtitle: '',
  author: '',
  isFeatured: false,
  popularity: 0,
  keywords: '',
  bodyHtml: '',
  isPublished: true,
};

export default function ArticleManagement() {
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
    const res = await getAllArticlesAdmin();
    if (res?.status === 200 && Array.isArray(res?.data)) setItems(res.data);
    else if (res?.status === 401) { authFail(); return; }
    else setItems([]);
    setLoading(false);
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter(a =>
      (a.title || '').toLowerCase().includes(q) ||
      (a.slug || '').toLowerCase().includes(q) ||
      (a.category || '').toLowerCase().includes(q)
    );
  }, [items, search]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / rowsPerPage));
  const pageSafe = Math.min(page, pageCount - 1);
  const visible = filtered.slice(pageSafe * rowsPerPage, (pageSafe + 1) * rowsPerPage);

  function openNew() { setForm(initialForm); setOpen(true); }
  function openEdit(it) {
    setForm({
      id: it.id,
      slug: it.slug || '',
      title: it.title || '',
      category: it.category || '',
      publishedDate: (it.publishedDate || '').slice(0, 10) || initialForm.publishedDate,
      readTime: it.readTime || '',
      subtitle: it.subtitle || '',
      author: it.author || '',
      isFeatured: !!it.isFeatured,
      popularity: it.popularity ?? 0,
      keywords: (it.keywords || []).join(', '),
      bodyHtml: it.bodyHtml || '',
      isPublished: it.isPublished !== false,
    });
    setOpen(true);
  }
  function close() { setOpen(false); setForm(initialForm); }

  async function submit(e) {
    e.preventDefault();
    if (!form.slug.trim() || !form.title.trim()) {
      Swal.fire({ title: 'Missing fields', text: 'Slug and Title are required.', icon: 'warning' });
      return;
    }
    setSaving(true);
    const body = JSON.stringify({
      id: form.id || 0,
      slug: form.slug.trim().toLowerCase(),
      title: form.title,
      category: form.category,
      publishedDate: form.publishedDate,
      readTime: form.readTime,
      subtitle: form.subtitle,
      author: form.author,
      isFeatured: form.isFeatured,
      popularity: Number(form.popularity) || 0,
      keywords: form.keywords.split(',').map(k => k.trim()).filter(Boolean),
      bodyHtml: form.bodyHtml,
      isPublished: form.isPublished,
    });
    const res = form.id
      ? await updateArticleAsync(body)
      : await createArticleAsync(body);
    setSaving(false);

    if (res?.status === 200 && res?.data) {
      await loadAll();
      close();
      Swal.fire({ title: 'Success', text: form.id ? 'Article updated.' : 'Article created.', icon: 'success' });
    } else if (res?.status === 401) authFail();
    else Swal.fire({ title: 'Error', text: res?.data?.error || res?.data || 'Could not save article.', icon: 'error' });
  }

  async function remove(id) {
    const ok = await Swal.fire({
      title: 'Delete this article?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete',
      cancelButtonText: 'Cancel',
      reverseButtons: true,
    });
    if (!ok.isConfirmed) return;
    const res = await deleteArticleAsync(id);
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
            <h1 className="cv-admin-title">Article Management</h1>
            <p className="cv-admin-subtitle">
              {loading ? 'Loading…' : `${filtered.length} of ${items.length} articles`}
            </p>
          </div>
          <button type="button" className="cv-admin-btn is-primary" onClick={openNew}>+ New Article</button>
        </header>

        <section className="cv-admin-surface">
          <div className="cv-admin-surface-head">
            <h2>All Articles</h2>
            <label className="cv-admin-search">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.8" />
                <path d="m20 20-3.5-3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
              <input type="search" placeholder="Search title, slug or category…"
                value={search} onChange={e => { setSearch(e.target.value); setPage(0); }} />
            </label>
          </div>

          <div className="cv-admin-table-wrap">
            {loading ? (
              <div className="cv-admin-loading"><span className="cv-admin-spinner" />Loading…</div>
            ) : filtered.length === 0 ? (
              <div className="cv-admin-table-empty">{search ? 'No matches.' : 'No articles yet.'}</div>
            ) : (
              <table className="cv-admin-table">
                <thead>
                  <tr><th style={{ width: '32%' }}>Title</th><th>Category</th><th>Published</th><th>Status</th><th aria-label="Actions" /></tr>
                </thead>
                <tbody>
                  {visible.map(it => (
                    <tr key={it.id}>
                      <td className="cell-email">{it.title || '—'}</td>
                      <td className="cell-muted">{it.category || '—'}</td>
                      <td className="cell-muted">{(it.publishedDate || '').slice(0, 10)}</td>
                      <td className="cell-muted">{it.isPublished ? 'Published' : 'Draft'}{it.isFeatured ? ' · Featured' : ''}</td>
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
            <h3>{form.id ? 'Edit Article' : 'New Article'}</h3>
            <button type="button" className="cv-admin-modal-close" onClick={close} aria-label="Close">×</button>
          </div>
          <form onSubmit={submit}>
            <div className="cv-admin-modal-body">
              <div className="cv-admin-form-grid">
                <div className="cv-admin-field">
                  <label htmlFor="art-slug">Slug</label>
                  <input id="art-slug" placeholder="01-example-slug" value={form.slug}
                    onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} required />
                </div>
                <div className="cv-admin-field">
                  <label htmlFor="art-category">Category</label>
                  <input id="art-category" value={form.category}
                    onChange={e => setForm(f => ({ ...f, category: e.target.value }))} />
                </div>
                <div className="cv-admin-field is-full">
                  <label htmlFor="art-title">Title</label>
                  <input id="art-title" value={form.title}
                    onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required />
                </div>
                <div className="cv-admin-field is-full">
                  <label htmlFor="art-subtitle">Subtitle / dek</label>
                  <input id="art-subtitle" value={form.subtitle}
                    onChange={e => setForm(f => ({ ...f, subtitle: e.target.value }))} />
                </div>
                <div className="cv-admin-field">
                  <label htmlFor="art-date">Published date</label>
                  <input id="art-date" type="date" value={form.publishedDate}
                    onChange={e => setForm(f => ({ ...f, publishedDate: e.target.value }))} />
                </div>
                <div className="cv-admin-field">
                  <label htmlFor="art-readtime">Read time</label>
                  <input id="art-readtime" placeholder="~9 min" value={form.readTime}
                    onChange={e => setForm(f => ({ ...f, readTime: e.target.value }))} />
                </div>
                <div className="cv-admin-field">
                  <label htmlFor="art-author">Author</label>
                  <input id="art-author" value={form.author}
                    onChange={e => setForm(f => ({ ...f, author: e.target.value }))} />
                </div>
                <div className="cv-admin-field">
                  <label htmlFor="art-popularity">Popularity (sort weight)</label>
                  <input id="art-popularity" type="number" value={form.popularity}
                    onChange={e => setForm(f => ({ ...f, popularity: e.target.value }))} />
                </div>
                <div className="cv-admin-field is-full">
                  <label htmlFor="art-keywords">Keywords (comma-separated)</label>
                  <input id="art-keywords" placeholder="Python, Mastery" value={form.keywords}
                    onChange={e => setForm(f => ({ ...f, keywords: e.target.value }))} />
                </div>
                <div className="cv-admin-field">
                  <label htmlFor="art-featured">
                    <input id="art-featured" type="checkbox" checked={form.isFeatured}
                      onChange={e => setForm(f => ({ ...f, isFeatured: e.target.checked }))} />
                    {' '}Featured
                  </label>
                </div>
                <div className="cv-admin-field">
                  <label htmlFor="art-published">
                    <input id="art-published" type="checkbox" checked={form.isPublished}
                      onChange={e => setForm(f => ({ ...f, isPublished: e.target.checked }))} />
                    {' '}Published
                  </label>
                </div>
                <div className="cv-admin-field is-full">
                  <label htmlFor="art-body">Body content</label>
                  <AdminRichEditor
                    value={form.bodyHtml}
                    onChange={v => setForm(f => ({ ...f, bodyHtml: v }))}
                    placeholder="Article body…"
                  />
                </div>
              </div>
            </div>
            <div className="cv-admin-modal-foot">
              <button type="button" className="cv-admin-btn" onClick={close} disabled={saving}>Cancel</button>
              <button type="submit" className="cv-admin-btn is-primary" disabled={saving}>
                {saving ? 'Saving…' : (form.id ? 'Save changes' : 'Create Article')}
              </button>
            </div>
          </form>
        </div>
      </AdminModal>
    </main>
  );
}
