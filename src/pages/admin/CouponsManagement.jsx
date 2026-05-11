import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import {
  getallcouponlist,
  postCreateCoupon,
  putUpdateCoupon,
  couponDelete,
  createpromotioncodesodes,
  getallPromocodelistbyCouponId,
  PromotionCodeActive,
  PromotionCodeDeActive,
} from '../../api/coupon/apicoupon';
import { getpackageslistbyadmin } from '../../api/pricepackage/apipackage';
import { logout } from '../../utils/auth';
import AdminPager from '../../components/AdminPager.jsx';
import AdminModal from '../../components/AdminModal.jsx';

const initialCoupon = {
  id: 0,
  couponName: '',
  discountType: 'percentagediscount',
  percentOff: 0,
  iSApplySpecificProduct: false,
  duration: 'forever',
  durationinMonths: 0,
  isLimitDateRange: false,
  isLimitTotalNumber: false,
  redeemBy: '',
  maxRedeemed: 0,
  packageId: [],
};

const DURATIONS = [
  { value: 'forever', label: 'Forever' },
  { value: 'once', label: 'Once' },
  { value: 'repeating', label: 'Repeating' },
];

export default function CouponsManagement() {
  const navigate = useNavigate();
  const [coupons, setCoupons] = useState([]);
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [editOpen, setEditOpen] = useState(false);
  const [form, setForm] = useState(initialCoupon);
  const [saving, setSaving] = useState(false);

  const [promoOpen, setPromoOpen] = useState(false);
  const [promoCoupon, setPromoCoupon] = useState(null);
  const [promoCode, setPromoCode] = useState('');
  const [promoList, setPromoList] = useState([]);
  const [savingPromo, setSavingPromo] = useState(false);

  useEffect(() => { loadAll(); /* eslint-disable-next-line */ }, []);

  function authFail() { logout(); navigate('/login', { replace: true }); }

  async function loadAll() {
    setLoading(true);
    const [cRes, pRes] = await Promise.all([getallcouponlist(), getpackageslistbyadmin()]);
    if (cRes?.status === 401) { authFail(); return; }
    setCoupons(Array.isArray(cRes?.data) ? cRes.data : []);
    if (Array.isArray(pRes?.data)) setPackages(pRes.data.filter(p => !p.isDefault));
    setLoading(false);
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return coupons;
    return coupons.filter(c => (c.couponName || '').toLowerCase().includes(q));
  }, [coupons, search]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / rowsPerPage));
  const pageSafe = Math.min(page, pageCount - 1);
  const visible = filtered.slice(pageSafe * rowsPerPage, (pageSafe + 1) * rowsPerPage);

  function openNew() { setForm(initialCoupon); setEditOpen(true); }
  function openEdit(c) {
    setForm({
      ...initialCoupon,
      ...c,
      redeemBy: c.redeemBy ? c.redeemBy.split('T')[0] : '',
      packageId: Array.isArray(c.packageId) ? c.packageId : (c.packageId ? [c.packageId] : []),
    });
    setEditOpen(true);
  }
  function closeEdit() { setEditOpen(false); setForm(initialCoupon); }

  function handleField(e) {
    const { name, value, type, checked } = e.target;
    setForm(f => {
      const next = { ...f, [name]: type === 'checkbox' ? checked : value };
      if (name === 'duration') next.durationinMonths = 0;
      if (name === 'iSApplySpecificProduct' && !checked) next.packageId = [];
      return next;
    });
  }

  function togglePackage(id) {
    setForm(f => {
      const has = f.packageId.includes(id);
      return { ...f, packageId: has ? f.packageId.filter(p => p !== id) : [...f.packageId, id] };
    });
  }

  async function submitCoupon(e) {
    e.preventDefault();
    if (!form.couponName.trim()) {
      Swal.fire({ title: 'Missing name', icon: 'warning' });
      return;
    }
    setSaving(true);
    const body = {
      ...form,
      percentOff: Number(form.percentOff) || 0,
      durationinMonths: Number(form.durationinMonths) || 0,
      maxRedeemed: Number(form.maxRedeemed) || 0,
      redeemBy: form.redeemBy ? new Date(form.redeemBy).toISOString() : null,
    };
    let res;
    try {
      res = form.id ? await putUpdateCoupon(JSON.stringify(body)) : await postCreateCoupon(JSON.stringify(body));
    } catch (e) { res = e; }
    setSaving(false);

    if (res?.status === 200 && res?.data) {
      await loadAll();
      closeEdit();
      Swal.fire({ title: 'Success', text: form.id ? 'Coupon updated.' : 'Coupon created.', icon: 'success' });
    } else if (res?.status === 401) authFail();
    else Swal.fire({ title: 'Error', text: res?.data || 'Could not save coupon.', icon: 'error' });
  }

  async function remove(id) {
    const ok = await Swal.fire({
      title: 'Delete this coupon?', icon: 'warning', showCancelButton: true,
      confirmButtonText: 'Yes, delete', cancelButtonText: 'Cancel', reverseButtons: true,
    });
    if (!ok.isConfirmed) return;
    const res = await couponDelete(id);
    if (res?.status === 401) { authFail(); return; }
    if (res?.data === true || res?.data === 'true') {
      await loadAll();
      Swal.fire({ title: 'Deleted', icon: 'success' });
    } else Swal.fire({ title: 'Error', text: res?.data || 'Delete failed.', icon: 'error' });
  }

  // ── Promo codes ───────────────────────────────────────────────
  async function openPromo(coupon) {
    setPromoCoupon(coupon);
    setPromoCode('');
    setPromoList([]);
    setPromoOpen(true);
    const res = await getallPromocodelistbyCouponId(coupon.id);
    if (res?.status === 200 && Array.isArray(res?.data)) setPromoList(res.data);
  }

  function closePromo() { setPromoOpen(false); setPromoCoupon(null); setPromoCode(''); setPromoList([]); }

  async function addPromo(e) {
    e.preventDefault();
    if (!promoCoupon?.id || !promoCode.trim()) return;
    setSavingPromo(true);
    let res;
    try {
      res = await createpromotioncodesodes(JSON.stringify({ couponId: promoCoupon.id, promotionCode: promoCode.trim() }));
    } catch (e) { res = e; }
    setSavingPromo(false);
    if (res?.status === 200 && res?.data) {
      const refreshed = await getallPromocodelistbyCouponId(promoCoupon.id);
      if (Array.isArray(refreshed?.data)) setPromoList(refreshed.data);
      setPromoCode('');
      Swal.fire({ title: 'Promo code added', icon: 'success' });
    } else if (res?.status === 401) authFail();
    else Swal.fire({ title: 'Error', text: res?.data || 'Could not add code.', icon: 'error' });
  }

  async function togglePromoActive(p) {
    const fn = p.isActive ? PromotionCodeDeActive : PromotionCodeActive;
    const res = await fn(p.id);
    if (res?.status === 401) { authFail(); return; }
    const refreshed = await getallPromocodelistbyCouponId(promoCoupon.id);
    if (Array.isArray(refreshed?.data)) setPromoList(refreshed.data);
  }

  return (
    <main className="main" id="main-content">
      <div className="cv-admin-page">
        <header className="cv-admin-header">
          <div className="cv-admin-header-text">
            <div className="cv-admin-kicker">Superadmin</div>
            <h1 className="cv-admin-title">Coupons</h1>
            <p className="cv-admin-subtitle">{loading ? 'Loading…' : `${filtered.length} of ${coupons.length}`}</p>
          </div>
          <button type="button" className="cv-admin-btn is-primary" onClick={openNew}>+ New Coupon</button>
        </header>

        <section className="cv-admin-surface">
          <div className="cv-admin-surface-head">
            <h2>All Coupons</h2>
            <label className="cv-admin-search">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.8" /><path d="m20 20-3.5-3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
              <input type="search" placeholder="Search coupon name…" value={search} onChange={e => { setSearch(e.target.value); setPage(0); }} />
            </label>
          </div>

          <div className="cv-admin-table-wrap">
            {loading ? (
              <div className="cv-admin-loading"><span className="cv-admin-spinner" />Loading…</div>
            ) : filtered.length === 0 ? (
              <div className="cv-admin-table-empty">{search ? 'No matches.' : 'No coupons yet.'}</div>
            ) : (
              <table className="cv-admin-table">
                <thead>
                  <tr>
                    <th>Name</th><th>Discount</th><th>Duration</th><th>Redeem by</th><th>Max</th><th aria-label="Actions" />
                  </tr>
                </thead>
                <tbody>
                  {visible.map(c => (
                    <tr key={c.id}>
                      <td className="cell-email">{c.couponName || '—'}</td>
                      <td>{c.percentOff ? `${c.percentOff}%` : '—'}</td>
                      <td className="cell-muted">{c.duration}{c.duration === 'repeating' && c.durationinMonths ? ` · ${c.durationinMonths}m` : ''}</td>
                      <td className="cell-muted">{c.redeemBy ? new Date(c.redeemBy).toLocaleDateString() : '—'}</td>
                      <td className="cell-muted">{c.maxRedeemed || '∞'}</td>
                      <td>
                        <div className="cv-admin-actions">
                          <button type="button" className="cv-admin-btn" onClick={() => openEdit(c)}>Edit</button>
                          <button type="button" className="cv-admin-btn is-primary" onClick={() => openPromo(c)}>Promo Codes</button>
                          <button type="button" className="cv-admin-btn is-warn" onClick={() => remove(c.id)}>Delete</button>
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

      {/* Edit modal */}
      <AdminModal open={editOpen} onClose={closeEdit}>
        <div className="cv-admin-modal" onClick={e => e.stopPropagation()}>
            <div className="cv-admin-modal-head">
              <h3>{form.id ? 'Edit Coupon' : 'New Coupon'}</h3>
              <button type="button" className="cv-admin-modal-close" onClick={closeEdit}>×</button>
            </div>
            <form onSubmit={submitCoupon}>
              <div className="cv-admin-modal-body">
                <div className="cv-admin-form-grid">
                  <div className="cv-admin-field is-full">
                    <label>Coupon name</label>
                    <input name="couponName" value={form.couponName} onChange={handleField} required />
                  </div>
                  <div className="cv-admin-field">
                    <label>Discount type</label>
                    <select name="discountType" value={form.discountType} onChange={handleField}>
                      <option value="percentagediscount">Percentage</option>
                      <option value="amountdiscount">Fixed amount</option>
                    </select>
                  </div>
                  <div className="cv-admin-field">
                    <label>Percent off</label>
                    <input type="number" min="0" max="100" name="percentOff" value={form.percentOff} onChange={handleField} />
                  </div>
                  <div className="cv-admin-field">
                    <label>Duration</label>
                    <select name="duration" value={form.duration} onChange={handleField}>
                      {DURATIONS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                    </select>
                  </div>
                  {form.duration === 'repeating' && (
                    <div className="cv-admin-field">
                      <label>Duration (months)</label>
                      <input type="number" min="0" name="durationinMonths" value={form.durationinMonths} onChange={handleField} />
                    </div>
                  )}
                  <div className="cv-admin-field is-full" style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <input type="checkbox" id="cp-limitdate" name="isLimitDateRange" checked={form.isLimitDateRange} onChange={handleField} />
                    <label htmlFor="cp-limitdate" style={{ margin: 0, textTransform: 'none', letterSpacing: 0, fontSize: 13 }}>Limit date range</label>
                  </div>
                  {form.isLimitDateRange && (
                    <div className="cv-admin-field">
                      <label>Redeem by</label>
                      <input type="date" name="redeemBy" value={form.redeemBy} onChange={handleField} />
                    </div>
                  )}
                  <div className="cv-admin-field is-full" style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <input type="checkbox" id="cp-limitnum" name="isLimitTotalNumber" checked={form.isLimitTotalNumber} onChange={handleField} />
                    <label htmlFor="cp-limitnum" style={{ margin: 0, textTransform: 'none', letterSpacing: 0, fontSize: 13 }}>Limit total redemptions</label>
                  </div>
                  {form.isLimitTotalNumber && (
                    <div className="cv-admin-field">
                      <label>Max redemptions</label>
                      <input type="number" min="0" name="maxRedeemed" value={form.maxRedeemed} onChange={handleField} />
                    </div>
                  )}
                  <div className="cv-admin-field is-full" style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <input type="checkbox" id="cp-specific" name="iSApplySpecificProduct" checked={form.iSApplySpecificProduct} onChange={handleField} />
                    <label htmlFor="cp-specific" style={{ margin: 0, textTransform: 'none', letterSpacing: 0, fontSize: 13 }}>Apply to specific packages only</label>
                  </div>
                  {form.iSApplySpecificProduct && (
                    <div className="cv-admin-field is-full">
                      <label>Packages</label>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, padding: '8px 0' }}>
                        {packages.length === 0 && <span style={{ color: 'var(--color-text-muted)', fontSize: 12 }}>No packages available.</span>}
                        {packages.map(p => {
                          const checked = form.packageId.includes(p.id);
                          return (
                            <label key={p.id} className="cv-admin-btn" style={{ cursor: 'pointer', borderColor: checked ? 'var(--color-border-accent)' : undefined, color: checked ? 'var(--color-text-accent)' : undefined }}>
                              <input type="checkbox" checked={checked} onChange={() => togglePackage(p.id)} style={{ display: 'none' }} />
                              {checked ? '✓ ' : ''}{p.packageName}
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="cv-admin-modal-foot">
                <button type="button" className="cv-admin-btn" onClick={closeEdit} disabled={saving}>Cancel</button>
                <button type="submit" className="cv-admin-btn is-primary" disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
              </div>
            </form>
          </div>
      </AdminModal>

      {/* Promo codes modal */}
      <AdminModal open={promoOpen && !!promoCoupon} onClose={closePromo}>
        {promoCoupon && (
          <div className="cv-admin-modal" onClick={e => e.stopPropagation()}>
            <div className="cv-admin-modal-head">
              <h3>Promo codes — {promoCoupon.couponName}</h3>
              <button type="button" className="cv-admin-modal-close" onClick={closePromo}>×</button>
            </div>
            <div className="cv-admin-modal-body">
              <form onSubmit={addPromo} style={{ display: 'flex', gap: 10, alignItems: 'flex-end', marginBottom: 16 }}>
                <div className="cv-admin-field" style={{ flex: 1 }}>
                  <label>New promotion code</label>
                  <input value={promoCode} onChange={e => setPromoCode(e.target.value)} placeholder="e.g. SAVE20" required />
                </div>
                <button type="submit" className="cv-admin-btn is-primary" disabled={savingPromo || !promoCode.trim()}>
                  {savingPromo ? 'Adding…' : 'Add'}
                </button>
              </form>
              {promoList.length === 0 ? (
                <div className="cv-admin-table-empty">No promo codes yet.</div>
              ) : (
                <table className="cv-admin-table" style={{ minWidth: 0 }}>
                  <thead><tr><th>Code</th><th>Status</th><th aria-label="Actions" /></tr></thead>
                  <tbody>
                    {promoList.map(p => (
                      <tr key={p.id}>
                        <td className="cell-email">{p.promotionCode}</td>
                        <td>
                          <span className={`cv-admin-pill ${p.isActive ? 'is-active' : 'is-inactive'}`}>
                            <span className="cv-admin-pill-dot" />
                            {p.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td>
                          <button type="button" className={`cv-admin-btn ${p.isActive ? 'is-warn' : 'is-success'}`} onClick={() => togglePromoActive(p)}>
                            {p.isActive ? 'Deactivate' : 'Activate'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            <div className="cv-admin-modal-foot">
              <button type="button" className="cv-admin-btn" onClick={closePromo}>Close</button>
            </div>
          </div>
        )}
      </AdminModal>
    </main>
  );
}
