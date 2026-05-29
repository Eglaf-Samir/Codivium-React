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

const emptyPrice = {
  billingPeriod: 'month',
  price: '',
  discountType: 'None',
  discountValue: 0,
  isDiscountedPriceOnRenewal: false,
};

const initialForm = {
  id: 0,
  packageName: '',
  description: '',
  isAccessToAllMCQ: true,
  isAccessToAllCodingQuestions: true,
  isDashboardShouldBeViewable: true,
  isAccountPageShouldBeViewable: true,
  isBlogShouldBeViewable: true,
  isTutorialsPageViewable: true,
  isAllOtherPageViewable: true,
  isCancellationPossible: false,
  isRefundPossible: false,
  isRecurring: true,
  refundOfDays: 0,
  packages: [{ ...emptyPrice }],
};

const DISCOUNT_TYPES = [
  { value: 'None', label: 'No discount' },
  { value: 'Percent', label: 'Percent (%)' },
  { value: 'Amount', label: 'Amount ($)' },
];

const BILLING_PERIODS = [
  { value: 'week', label: 'Weekly' },
  { value: 'month', label: 'Monthly' },
  { value: 'year', label: 'Yearly' },
];

const ALL_FLAGS = [
  ['isAccessToAllMCQ', 'Access to all MCQ'],
  ['isAccessToAllCodingQuestions', 'Access to all Coding questions'],
  ['isDashboardShouldBeViewable', 'Dashboard should be viewable'],
  ['isAccountPageShouldBeViewable', 'My account page also viewable'],
  ['isBlogShouldBeViewable', 'Blog should be viewable'],
  ['isTutorialsPageViewable', 'Tutorials page should be viewable'],
  ['isAllOtherPageViewable', 'All other pages should be viewable'],
  ['isCancellationPossible', 'Cancellation should be possible'],
  ['isRecurring', 'Recurring should be possible'],
  ['isRefundPossible', 'Refund should be possible'],
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

  function updatePriceRow(idx, key, value) {
    setForm(f => ({
      ...f,
      packages: f.packages.map((p, i) => (i === idx ? { ...p, [key]: value } : p)),
    }));
  }
  function addPriceRow() {
    setForm(f => {
      if (f.packages.length >= BILLING_PERIODS.length) return f;
      const used = f.packages.map(p => p.billingPeriod);
      const next = BILLING_PERIODS.find(b => !used.includes(b.value));
      if (!next) return f;
      return { ...f, packages: [...f.packages, { ...emptyPrice, billingPeriod: next.value }] };
    });
  }
  function removePriceRow(idx) {
    setForm(f => ({
      ...f,
      packages: f.packages.length > 1 ? f.packages.filter((_, i) => i !== idx) : f.packages,
    }));
  }

  async function submit(e) {
    e.preventDefault();
    if (!form.packageName.trim()) {
      Swal.fire({ title: 'Missing name', icon: 'warning' });
      return;
    }
    if (!isEditMode) {
      const validRows = form.packages.filter(p => Number(p.price) > 0);
      if (validRows.length === 0) {
        Swal.fire({ title: 'Price required', text: 'Add at least one price greater than 0.', icon: 'warning' });
        return;
      }
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
          id: 0,
          packageName: form.packageName,
          description: form.description,
          isAccessToAllMCQ: form.isAccessToAllMCQ,
          isAccessToAllCodingQuestions: form.isAccessToAllCodingQuestions,
          isDashboardShouldBeViewable: form.isDashboardShouldBeViewable,
          isAccountPageShouldBeViewable: form.isAccountPageShouldBeViewable,
          isBlogShouldBeViewable: form.isBlogShouldBeViewable,
          isTutorialsPageViewable: form.isTutorialsPageViewable,
          isAllOtherPageViewable: form.isAllOtherPageViewable,
          isCancellationPossible: form.isCancellationPossible,
          isRefundPossible: form.isRefundPossible,
          isRecurring: form.isRecurring,
          refundOfDays: Number(form.refundOfDays) || 0,
          createdby: userId,
          modifiedBy: userId,
          packages: form.packages
            .filter(p => Number(p.price) > 0)
            .map(p => ({
              billingPeriod: p.billingPeriod,
              price: Number(p.price) || 0,
              discountType: p.discountType === 'None' ? '' : p.discountType,
              discountValue: Number(p.discountValue) || 0,
              isDiscountedPriceOnRenewal: !!p.isDiscountedPriceOnRenewal,
            })),
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
                  <tr><th>Name</th><th>Billing</th><th>Pricing</th>
                  {/* <th>Recurring</th> */}
                  <th aria-label="Actions" >Action</th></tr>
                </thead>
                <tbody>
                  {visible.map(p => (
                    <tr key={p.id}>
                      <td className="cell-email">
                        {p.packageName || '—'}
                        {p.description && <div className="cell-muted" style={{ fontSize: 12, fontWeight: 400, marginTop: 2 }}>{p.description}</div>}
                      </td>
                      <td className="cell-muted">
                        {Array.isArray(p.packagePriceList) && p.packagePriceList.length > 0
                          ? (p.packagePriceList
                              .filter(pr => !pr.isdeleted)
                              .map(pr => pr.billingPeriod)
                              .filter(Boolean)
                              .join(', ') || '—')
                          : (p.billingPeriod || '—')}
                      </td>
                      <td className="cell-muted">
                        {Array.isArray(p.packagePriceList) && p.packagePriceList.length > 0
                          ? (p.packagePriceList
                              .filter(pr => !pr.isdeleted)
                              .map(pr => `${pr.currencyothername || pr.currencylogo || ''}${pr.price ?? pr.cost ?? ''}`)
                              .join(', ') || '—')
                          : (p.cost ? `${p.cost}` : '—')}
                      </td>
                      {/* <td className="cell-muted">{p.isRecurring ? 'Yes' : 'No'}</td> */}
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
                <div className="cv-admin-form-grid" style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
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
                      <fieldset className="cv-admin-field is-full" style={{ border: '1px solid var(--color-border-default)', borderRadius: 12, padding: 12, margin: 0 }}>
                        <legend style={{ fontSize: 11, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', padding: '0 6px' }}>Plans &amp; pricing (USD · recurring)</legend>
                        {form.packages.map((p, idx) => {
                          const usedByOthers = form.packages.filter((_, i) => i !== idx).map(x => x.billingPeriod);
                          const periodOpts = BILLING_PERIODS.filter(b => b.value === p.billingPeriod || !usedByOthers.includes(b.value));
                          return (
                            <div key={idx} style={{ position: 'relative', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: 8, alignItems: 'end', marginBottom: 10, paddingTop: form.packages.length > 1 ? 6 : 0, paddingBottom: 10, borderBottom: idx < form.packages.length - 1 ? '1px dashed var(--color-border-default)' : 'none' }}>
                              {/* Remove (×) — only when more than one row; at least one must always remain */}
                              {form.packages.length > 1 && (
                                <button
                                  type="button"
                                  aria-label="Remove this plan"
                                  title="Remove"
                                  onClick={() => removePriceRow(idx)}
                                  style={{ position: 'absolute', top: 0, right: 0, width: 22, height: 22, lineHeight: '20px', textAlign: 'center', borderRadius: '50%', border: '1px solid var(--color-border-default)', background: 'rgba(0,0,0,0.3)', color: 'var(--color-text-muted)', cursor: 'pointer', fontSize: 14, padding: 0, zIndex: 2 }}
                                >
                                  ×
                                </button>
                              )}
                              <div className="cv-admin-field" style={{ margin: 0 }}>
                                <label>Billing period</label>
                                <select value={p.billingPeriod} onChange={e => updatePriceRow(idx, 'billingPeriod', e.target.value)}>
                                  {periodOpts.map(b => <option key={b.value} value={b.value}>{b.label}</option>)}
                                </select>
                              </div>
                              <div className="cv-admin-field" style={{ margin: 0 }}>
                                <label>Price ($)</label>
                                <input type="number" min="0" step="0.01" value={p.price} onChange={e => updatePriceRow(idx, 'price', e.target.value)} />
                              </div>
                              <div className="cv-admin-field" style={{ margin: 0 }}>
                                <label>Discount type</label>
                                <select value={p.discountType} onChange={e => updatePriceRow(idx, 'discountType', e.target.value)}>
                                  {DISCOUNT_TYPES.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                                </select>
                              </div>
                              {p.discountType !== 'None' && (
                                <div className="cv-admin-field" style={{ margin: 0 }}>
                                  <label>Discount value</label>
                                  <input type="number" min="0" step="0.01" value={p.discountValue} onChange={e => updatePriceRow(idx, 'discountValue', e.target.value)} />
                                </div>
                              )}
                            </div>
                          );
                        })}
                        {form.packages.length < BILLING_PERIODS.length && (
                          <button type="button" className="cv-admin-btn" onClick={addPriceRow}>+ Add plan price</button>
                        )}
                      </fieldset>

                      <div className="cv-admin-field is-full">
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', columnGap: 16, rowGap: 14 }}>
                          {ALL_FLAGS.map(([key, label]) => (
                            <label
                              key={key}
                              style={{
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: 10,
                                minWidth: 0,
                                fontSize: 13,
                                fontWeight: 500,
                                letterSpacing: 0,
                                textTransform: 'none',
                                lineHeight: 1.3,
                                color: 'var(--color-text-secondary)',
                                cursor: 'pointer',
                              }}
                            >
                              <input
                                type="checkbox"
                                name={key}
                                checked={!!form[key]}
                                onChange={handleField}
                                style={{ flexShrink: 0, width: 16, height: 16, marginTop: 1 }}
                              />
                              <span style={{ minWidth: 0 }}>{label}</span>
                            </label>
                          ))}
                        </div>
                      </div>

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
