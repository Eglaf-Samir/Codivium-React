import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import {
  createPackage,
  getpackageslistbyadmin,
  packagedelete,
  updatePackage,
} from '../../api/pricepackage/apipackage';
import { logout } from '../../utils/auth';
import AdminPager from '../../components/AdminPager.jsx';
import AdminModal from '../../components/AdminModal.jsx';

const initialForm = {
  id: 0,
  packageName: '',
  description: '',
  cost: 0,
  sequenceNo: 1,
  license: '',
  billingPeriod: 'month',
  isAccessToAllMCQ: false,
  isAccessToAllCodingQuestions: false,
  isDashboardShouldBeViewable: false,
  isAccountPageShouldBeViewable: false,
  isBlogShouldBeViewable: false,
  isTutorialsPageViewable: false,
  isAllOtherPageViewable: false,
  isCancellationPossible: false,
  isRefundPossible: false,
  isRecurring: false,
  refundOfDays: 0,
};

const BILLING_PERIODS = [
  { value: 'week', label: 'Weekly' },
  { value: 'month', label: 'Monthly' },
  { value: 'year', label: 'Yearly' },
];

const ACCESS_FLAGS = [
  ['isAccessToAllMCQ', 'All MCQs'],
  ['isAccessToAllCodingQuestions', 'All coding questions'],
  ['isDashboardShouldBeViewable', 'Dashboard'],
  ['isAccountPageShouldBeViewable', 'Account page'],
  ['isBlogShouldBeViewable', 'Blog'],
  ['isTutorialsPageViewable', 'Tutorials'],
  ['isAllOtherPageViewable', 'All other pages'],
];

export default function PackageManagement() {
  const navigate = useNavigate();
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [isEditMode, setIsEditMode] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadAll(); /* eslint-disable-next-line */ }, []);

  function authFail() { logout(); navigate('/login', { replace: true }); }

  async function loadAll() {
    setLoading(true);
    const res = await getpackageslistbyadmin();
    if (res?.status === 401) { authFail(); return; }
    setPackages(Array.isArray(res?.data) ? res.data : []);
    setLoading(false);
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return packages;
    return packages.filter(p => (p.packageName || '').toLowerCase().includes(q));
  }, [packages, search]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / rowsPerPage));
  const pageSafe = Math.min(page, pageCount - 1);
  const visible = filtered.slice(pageSafe * rowsPerPage, (pageSafe + 1) * rowsPerPage);

  function openNew() { setForm(initialForm); setIsEditMode(false); setOpen(true); }
  function openEdit(p) {
    setForm({ ...initialForm, ...p });
    setIsEditMode(true);
    setOpen(true);
  }
  function close() { setOpen(false); setForm(initialForm); }

  function handleField(e) {
    const { name, value, type, checked } = e.target;
    setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  }

  async function submit(e) {
    e.preventDefault();
    if (!form.packageName.trim()) {
      Swal.fire({ title: 'Missing name', icon: 'warning' });
      return;
    }
    if (!isEditMode && (!form.cost || Number(form.cost) <= 0)) {
      Swal.fire({ title: 'Cost required', text: 'Cost must be greater than 0.', icon: 'warning' });
      return;
    }
    if (form.isRefundPossible && (!form.refundOfDays || Number(form.refundOfDays) <= 0)) {
      Swal.fire({ title: 'Refund days required', icon: 'warning' });
      return;
    }

    setSaving(true);
    const userId = localStorage.getItem('Userid');
    let res;
    try {
      if (isEditMode) {
        const body = {
          id: form.id,
          packageName: form.packageName,
          description: form.description,
          modifiedBy: userId,
        };
        res = await updatePackage(JSON.stringify(body));
      } else {
        const body = {
          ...form,
          cost: Number(form.cost) || 0,
          sequenceNo: Number(form.sequenceNo) || 1,
          refundOfDays: Number(form.refundOfDays) || 0,
          createdby: userId,
          modifiedBy: userId,
          packagePriceList: [],
        };
        res = await createPackage(JSON.stringify(body));
      }
    } catch (e) { res = e; }
    setSaving(false);

    if (res?.status === 200 && res?.data) {
      await loadAll();
      close();
      Swal.fire({ title: 'Success', text: isEditMode ? 'Package updated.' : 'Package created.', icon: 'success' });
    } else if (res?.status === 401) authFail();
    else Swal.fire({ title: 'Error', text: 'Could not save package.', icon: 'error' });
  }

  async function remove(id) {
    const ok = await Swal.fire({
      title: 'Delete this package?', icon: 'warning', showCancelButton: true,
      confirmButtonText: 'Yes, delete', cancelButtonText: 'Cancel', reverseButtons: true,
    });
    if (!ok.isConfirmed) return;
    const res = await packagedelete(id);
    if (res?.status === 401) { authFail(); return; }
    if (res?.data === true || res?.data === 'true') {
      await loadAll();
      Swal.fire({ title: 'Deleted', icon: 'success' });
    } else Swal.fire({ title: 'Error', text: res?.data || 'Delete failed.', icon: 'error' });
  }

  return (
    <main className="main" id="main-content">
      <div className="cv-admin-page">
        <header className="cv-admin-header">
          <div className="cv-admin-header-text">
            <div className="cv-admin-kicker">Superadmin</div>
            <h1 className="cv-admin-title">Packages</h1>
            <p className="cv-admin-subtitle">{loading ? 'Loading…' : `${filtered.length} of ${packages.length}`}</p>
          </div>
          <button type="button" className="cv-admin-btn is-primary" onClick={openNew}>+ New Package</button>
        </header>

        <section className="cv-admin-surface">
          <div className="cv-admin-surface-head">
            <h2>All Packages</h2>
            <label className="cv-admin-search">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.8" /><path d="m20 20-3.5-3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
              <input type="search" placeholder="Search package name…" value={search} onChange={e => { setSearch(e.target.value); setPage(0); }} />
            </label>
          </div>

          <div className="cv-admin-table-wrap">
            {loading ? (
              <div className="cv-admin-loading"><span className="cv-admin-spinner" />Loading…</div>
            ) : filtered.length === 0 ? (
              <div className="cv-admin-table-empty">{search ? 'No matches.' : 'No packages yet.'}</div>
            ) : (
              <table className="cv-admin-table">
                <thead>
                  <tr><th>Name</th><th>Billing</th><th>Pricing</th><th>Recurring</th><th>Refund</th><th aria-label="Actions" /></tr>
                </thead>
                <tbody>
                  {visible.map(p => (
                    <tr key={p.id}>
                      <td className="cell-email">
                        {p.packageName || '—'}
                        {p.description && <div className="cell-muted" style={{ fontSize: 12, fontWeight: 400, marginTop: 2 }}>{p.description}</div>}
                      </td>
                      <td className="cell-muted">{p.billingPeriod || '—'}</td>
                      <td className="cell-muted">
                        {Array.isArray(p.packagePriceList) && p.packagePriceList.length > 0 ? (
                          p.packagePriceList.map((pr, i) => (
                            <div key={i}>{pr.currencylogo || ''}{pr.price ?? pr.cost ?? ''}</div>
                          ))
                        ) : (p.cost ? <span>{p.cost}</span> : '—')}
                      </td>
                      <td className="cell-muted">{p.isRecurring ? 'Yes' : 'No'}</td>
                      <td className="cell-muted">{p.isRefundPossible ? `${p.refundOfDays || 0}d` : 'No'}</td>
                      <td>
                        <div className="cv-admin-actions">
                          <button type="button" className="cv-admin-btn" onClick={() => openEdit(p)}>Edit</button>
                          <button type="button" className="cv-admin-btn is-warn" onClick={() => remove(p.id)}>Delete</button>
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
              <h3>{isEditMode ? 'Edit Package' : 'New Package'}</h3>
              <button type="button" className="cv-admin-modal-close" onClick={close}>×</button>
            </div>
            <form onSubmit={submit}>
              <div className="cv-admin-modal-body">
                <div className="cv-admin-form-grid">
                  <div className="cv-admin-field is-full">
                    <label>Package name</label>
                    <input name="packageName" value={form.packageName} onChange={handleField} required />
                  </div>
                  <div className="cv-admin-field is-full">
                    <label>Description</label>
                    <textarea rows={3} name="description" value={form.description} onChange={handleField} />
                  </div>

                  {!isEditMode && (
                    <>
                      <div className="cv-admin-field">
                        <label>Cost</label>
                        <input type="number" min="0" step="0.01" name="cost" value={form.cost} onChange={handleField} required />
                      </div>
                      <div className="cv-admin-field">
                        <label>Billing period</label>
                        <select name="billingPeriod" value={form.billingPeriod} onChange={handleField}>
                          {BILLING_PERIODS.map(b => <option key={b.value} value={b.value}>{b.label}</option>)}
                        </select>
                      </div>
                      <div className="cv-admin-field">
                        <label>Sequence #</label>
                        <input type="number" min="1" name="sequenceNo" value={form.sequenceNo} onChange={handleField} />
                      </div>
                      <div className="cv-admin-field">
                        <label>License</label>
                        <input name="license" value={form.license} onChange={handleField} />
                      </div>

                      <fieldset className="cv-admin-field is-full" style={{ border: '1px solid var(--color-border-default)', borderRadius: 12, padding: 12, margin: 0 }}>
                        <legend style={{ fontSize: 11, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', padding: '0 6px' }}>Access flags</legend>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 8 }}>
                          {ACCESS_FLAGS.map(([key, label]) => (
                            <label key={key} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--color-text-secondary)' }}>
                              <input type="checkbox" name={key} checked={!!form[key]} onChange={handleField} />
                              {label}
                            </label>
                          ))}
                        </div>
                      </fieldset>

                      <fieldset className="cv-admin-field is-full" style={{ border: '1px solid var(--color-border-default)', borderRadius: 12, padding: 12, margin: 0 }}>
                        <legend style={{ fontSize: 11, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', padding: '0 6px' }}>Billing options</legend>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, fontSize: 13, color: 'var(--color-text-secondary)' }}>
                          <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <input type="checkbox" name="isRecurring" checked={form.isRecurring} onChange={handleField} /> Recurring
                          </label>
                          <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <input type="checkbox" name="isCancellationPossible" checked={form.isCancellationPossible} onChange={handleField} /> Cancellation allowed
                          </label>
                          <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <input type="checkbox" name="isRefundPossible" checked={form.isRefundPossible} onChange={handleField} /> Refund allowed
                          </label>
                        </div>
                      </fieldset>

                      {form.isRefundPossible && (
                        <div className="cv-admin-field">
                          <label>Refund window (days)</label>
                          <input type="number" min="0" max="365" name="refundOfDays" value={form.refundOfDays} onChange={handleField} />
                        </div>
                      )}
                    </>
                  )}
                  {isEditMode && (
                    <div className="cv-admin-field is-full" style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                      Editing existing packages updates only name and description (other fields are immutable per backend rules).
                    </div>
                  )}
                </div>
              </div>
              <div className="cv-admin-modal-foot">
                <button type="button" className="cv-admin-btn" onClick={close} disabled={saving}>Cancel</button>
                <button type="submit" className="cv-admin-btn is-primary" disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
              </div>
            </form>
          </div>
      </AdminModal>
    </main>
  );
}
