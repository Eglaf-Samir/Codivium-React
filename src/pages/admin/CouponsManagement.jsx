import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import {
  getallcouponlist,
  postCreateCoupon,
  putUpdateCoupon,
  couponDelete,
  createpromotioncodesodes,
  getallcouponDetails,
  getallTrackCoupon,
  getallAdminuser,
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

const initialPromo = {
  codeName: '',
  isAddExpirationDate: false,
  expirationDate: '',
  isFirstTimeOnly: false,
  isRedeemed: false,
  maxUses: 0,
  isSpecificCustomer: false,
  userId: '',
};

const DURATIONS = [
  { value: 'forever', label: 'Forever' },
  { value: 'once', label: 'Once' },
  { value: 'repeating', label: 'Repeating' },
];

// dd/mm/yyyy — matches the rest of the billing UI.
function fmtDate(value) {
  if (!value) return 'N/A';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return 'N/A';
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}/${d.getFullYear()}`;
}

export default function CouponsManagement() {
  const navigate = useNavigate();
  const [coupons, setCoupons] = useState([]);
  const [packages, setPackages] = useState([]);
  const [adminUsers, setAdminUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Create / edit
  const [editOpen, setEditOpen] = useState(false);
  const [form, setForm] = useState(initialCoupon);
  const [saving, setSaving] = useState(false);

  // View details (coupon summary + applicable products + promo codes)
  const [viewOpen, setViewOpen] = useState(false);
  const [viewLoading, setViewLoading] = useState(false);
  const [viewData, setViewData] = useState(null);
  const [viewCouponId, setViewCouponId] = useState(0);
  const [promoForm, setPromoForm] = useState(initialPromo);
  const [savingPromo, setSavingPromo] = useState(false);

  // Track coupon usage
  const [trackOpen, setTrackOpen] = useState(false);
  const [trackCoupon, setTrackCoupon] = useState(null);
  const [trackPromos, setTrackPromos] = useState([]);
  const [trackPromoId, setTrackPromoId] = useState('');
  const [trackRows, setTrackRows] = useState([]);
  const [trackLoading, setTrackLoading] = useState(false);

  useEffect(() => { loadAll(); /* eslint-disable-next-line */ }, []);

  function authFail() { logout(); navigate('/login', { replace: true }); }

  async function loadAll() {
    setLoading(true);
    const [cRes, pRes, uRes] = await Promise.all([
      getallcouponlist(),
      getpackageslistbyadmin(),
      getallAdminuser(),
    ]);
    if (cRes?.status === 401) { authFail(); return; }
    setCoupons(Array.isArray(cRes?.data) ? cRes.data : []);
    if (Array.isArray(pRes?.data)) setPackages(pRes.data.filter(p => !p.isDefault));
    if (Array.isArray(uRes?.data)) setAdminUsers(uRes.data);
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

  // ── Create / edit ──────────────────────────────────────────────
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

  // ── View details ───────────────────────────────────────────────
  async function openView(coupon) {
    setViewCouponId(coupon.id);
    setViewData(null);
    setPromoForm(initialPromo);
    setViewOpen(true);
    await refreshView(coupon.id);
  }

  async function refreshView(couponId) {
    setViewLoading(true);
    const res = await getallcouponDetails(couponId);
    if (res?.status === 401) { authFail(); return; }
    if (res?.status === 200 && res?.data) setViewData(res.data);
    setViewLoading(false);
  }

  function closeView() {
    setViewOpen(false);
    setViewData(null);
    setViewCouponId(0);
    setPromoForm(initialPromo);
  }

  function handlePromoField(e) {
    const { name, value, type, checked } = e.target;
    setPromoForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  }

  async function addPromo(e) {
    e.preventDefault();
    if (!viewCouponId || !promoForm.codeName.trim()) return;
    setSavingPromo(true);
    // Backend binds PromotionCodesRequest: CodeName, ExpirationDate/IsAddExpirationDate,
    // IsFirstTimeOnly, IsRedeemed + MaxUses (max redemptions), IsSpecificCustomer + UserId.
    const body = {
      couponId: viewCouponId,
      codeName: promoForm.codeName.trim(),
      isAddExpirationDate: !!promoForm.isAddExpirationDate,
      expirationDate: promoForm.isAddExpirationDate && promoForm.expirationDate
        ? new Date(promoForm.expirationDate).toISOString()
        : null,
      isFirstTimeOnly: !!promoForm.isFirstTimeOnly,
      isRedeemed: !!promoForm.isRedeemed,
      maxUses: promoForm.isRedeemed ? Number(promoForm.maxUses) || 0 : 0,
      isSpecificCustomer: !!promoForm.isSpecificCustomer,
      userId: promoForm.isSpecificCustomer && promoForm.userId ? promoForm.userId : null,
    };
    let res;
    try {
      res = await createpromotioncodesodes(JSON.stringify(body));
    } catch (e) { res = e; }
    setSavingPromo(false);

    // Backend returns "true" on success, or an error string otherwise.
    const ok = res?.status === 200 && (res.data === 'true' || res.data === true);
    if (ok) {
      setPromoForm(initialPromo);
      await refreshView(viewCouponId);
      Swal.fire({ title: 'Promo code added', icon: 'success' });
    } else if (res?.status === 401) authFail();
    else Swal.fire({ title: 'Error', text: (res?.data && res.data !== 'false' ? res.data : 'Could not add code.'), icon: 'error' });
  }

  async function togglePromoActive(p) {
    const isActive = (p.status || '').toLowerCase() === 'active';
    const fn = isActive ? PromotionCodeDeActive : PromotionCodeActive;
    const res = await fn(p.id);
    if (res?.status === 401) { authFail(); return; }
    await refreshView(viewCouponId);
  }

  // ── Track coupon usage ─────────────────────────────────────────
  async function openTrack(coupon) {
    setTrackCoupon(coupon);
    setTrackRows([]);
    setTrackPromoId('');
    setTrackPromos([]);
    setTrackOpen(true);
    // Load this coupon's promo codes for the dropdown.
    const res = await getallcouponDetails(coupon.id);
    if (res?.status === 200 && res?.data) {
      const promos = res.data.couponPromotionCodeMappingResponses || [];
      setTrackPromos(promos);
    }
    // Default view = "All codes": show every usage row for the coupon.
    await loadTrack(coupon.id, 0);
  }

  async function loadTrack(couponId, promoId) {
    if (!couponId) return;
    setTrackLoading(true);
    // PromoCodeID 0 = all usage for the coupon; otherwise scoped to one code.
    const res = await getallTrackCoupon(couponId, promoId || 0);
    if (res?.status === 401) { authFail(); return; }
    setTrackRows(res?.status === 200 && Array.isArray(res.data) ? res.data : []);
    setTrackLoading(false);
  }

  function closeTrack() {
    setTrackOpen(false);
    setTrackCoupon(null);
    setTrackRows([]);
    setTrackPromoId('');
    setTrackPromos([]);
  }

  async function onTrackPromoChange(e) {
    const promoId = e.target.value;
    setTrackPromoId(promoId);
    await loadTrack(trackCoupon?.id, promoId || 0);
  }

  // Helper accessors tolerant of the API's camelCase quirks.
  const applySpecific = (d) => d?.iSApplySpecificProduct ?? d?.isApplySpecificProduct ?? false;

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
                    <th>Coupon</th><th>Percent Off</th><th>Redemptions</th><th>Duration</th><th>Expires</th><th aria-label="Actions" />
                  </tr>
                </thead>
                <tbody>
                  {visible.map(c => (
                    <tr key={c.id}>
                      <td className="cell-email">{c.couponName || '—'}</td>
                      <td>{c.percentOff ? `${c.percentOff} %` : '—'}</td>
                      <td className="cell-muted">{c.maxRedeemed ? c.maxRedeemed : '∞'}</td>
                      <td className="cell-muted">{c.duration}</td>
                      <td className="cell-muted">{c.isLimitDateRange && c.redeemBy ? fmtDate(c.redeemBy) : 'N/A'}</td>
                      <td>
                        <div className="cv-admin-actions">
                          <button type="button" className="cv-admin-btn" onClick={() => openView(c)}>View</button>
                          <button type="button" className="cv-admin-btn" onClick={() => openEdit(c)}>Edit</button>
                          <button type="button" className="cv-admin-btn is-warn" onClick={() => remove(c.id)}>Delete</button>
                          <button type="button" className="cv-admin-btn is-primary" onClick={() => openTrack(c)}>Track Coupon</button>
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

      {/* Create / edit modal */}
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
                {/* On edit only the name is changeable (Stripe coupons are immutable). */}
                {!form.id && (<>
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
                </>)}
              </div>
            </div>
            <div className="cv-admin-modal-foot">
              <button type="button" className="cv-admin-btn" onClick={closeEdit} disabled={saving}>Cancel</button>
              <button type="submit" className="cv-admin-btn is-primary" disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
            </div>
          </form>
        </div>
      </AdminModal>

      {/* View details modal: summary + applicable products + promo codes */}
      <AdminModal open={viewOpen} onClose={closeView}>
        <div className="cv-admin-modal" style={{ maxWidth: 980 }} onClick={e => e.stopPropagation()}>
          <div className="cv-admin-modal-head">
            <h3>{viewData?.couponName ? `Coupon — ${viewData.couponName}` : 'Coupon details'}</h3>
            <button type="button" className="cv-admin-modal-close" onClick={closeView}>×</button>
          </div>
          <div className="cv-admin-modal-body">
            {viewLoading || !viewData ? (
              <div className="cv-admin-loading"><span className="cv-admin-spinner" />Loading…</div>
            ) : (
              <>
                {/* Summary */}
                <div className="cv-admin-form-grid" style={{ marginBottom: 18 }}>
                  <div className="cv-admin-field"><label>Name</label><div>{viewData.couponName || '—'}</div></div>
                  <div className="cv-admin-field"><label>Created</label><div>{fmtDate(viewData.createdAt)}</div></div>
                  <div className="cv-admin-field"><label>Valid</label><div>{viewData.valid ? 'Yes' : 'No'}</div></div>
                  <div className="cv-admin-field"><label>Percentage discount</label><div>{viewData.percentOff != null ? `${viewData.percentOff} %` : '—'}</div></div>
                  <div className="cv-admin-field"><label>Duration</label><div>{viewData.duration}{viewData.duration === 'repeating' && viewData.durationinMonths ? ` · ${viewData.durationinMonths}m` : ''}</div></div>
                  <div className="cv-admin-field"><label>Expires</label><div>{viewData.isLimitDateRange && viewData.redeemBy ? fmtDate(viewData.redeemBy) : 'N/A'}</div></div>
                  <div className="cv-admin-field"><label>Max redemptions</label><div>{viewData.maxRedeemed != null ? viewData.maxRedeemed : '∞'}</div></div>
                </div>

                {/* Applicable products */}
                {applySpecific(viewData) && (
                  <>
                    <h4 style={{ margin: '6px 0 8px', fontSize: 13, color: 'var(--color-text-accent)' }}>Applicable Products</h4>
                    {(viewData.specificProductResponses || []).length === 0 ? (
                      <div className="cv-admin-table-empty" style={{ marginBottom: 16 }}>No products linked.</div>
                    ) : (
                      <table className="cv-admin-table" style={{ marginBottom: 18 }}>
                        <thead><tr><th>Name</th><th>Price</th><th>Updated</th></tr></thead>
                        <tbody>
                          {viewData.specificProductResponses.map(p => (
                            <tr key={p.packageId}>
                              <td className="cell-email">{p.packageName}</td>
                              <td className="cell-muted">{(p.packageCurrencyothername || p.packageCurrencyname || '')}{p.packageAmount} {p.packageBillingPeriod ? `/ ${p.packageBillingPeriod}` : ''}</td>
                              <td className="cell-muted">{fmtDate(p.packageModifiedAt)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </>
                )}

                {/* Promotion codes */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '6px 0 10px' }}>
                  <h4 style={{ margin: 0, fontSize: 13, color: 'var(--color-text-accent)' }}>Promotion Codes</h4>
                </div>

                {/* Add promo */}
                <form onSubmit={addPromo} className="cv-admin-form-grid" style={{ marginBottom: 16 }}>
                  <div className="cv-admin-field">
                    <label>New promotion code</label>
                    <input name="codeName" value={promoForm.codeName} onChange={handlePromoField} placeholder="e.g. SAVE20" required />
                  </div>
                  <div className="cv-admin-field" style={{ flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'end' }}>
                    <input type="checkbox" id="pf-exp" name="isAddExpirationDate" checked={promoForm.isAddExpirationDate} onChange={handlePromoField} />
                    <label htmlFor="pf-exp" style={{ margin: 0, textTransform: 'none', letterSpacing: 0, fontSize: 13 }}>Set expiry</label>
                  </div>
                  {promoForm.isAddExpirationDate && (
                    <div className="cv-admin-field">
                      <label>Expires on</label>
                      <input type="date" name="expirationDate" value={promoForm.expirationDate} onChange={handlePromoField} />
                    </div>
                  )}
                  <div className="cv-admin-field" style={{ flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'end' }}>
                    <input type="checkbox" id="pf-first" name="isFirstTimeOnly" checked={promoForm.isFirstTimeOnly} onChange={handlePromoField} />
                    <label htmlFor="pf-first" style={{ margin: 0, textTransform: 'none', letterSpacing: 0, fontSize: 13 }}>First-time customers only</label>
                  </div>
                  <div className="cv-admin-field" style={{ flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'end' }}>
                    <input type="checkbox" id="pf-max" name="isRedeemed" checked={promoForm.isRedeemed} onChange={handlePromoField} />
                    <label htmlFor="pf-max" style={{ margin: 0, textTransform: 'none', letterSpacing: 0, fontSize: 13 }}>Limit redemptions</label>
                  </div>
                  {promoForm.isRedeemed && (
                    <div className="cv-admin-field">
                      <label>Max redemptions</label>
                      <input type="number" min="0" name="maxUses" value={promoForm.maxUses} onChange={handlePromoField} />
                    </div>
                  )}
                  {adminUsers.length > 0 && (
                    <>
                      <div className="cv-admin-field" style={{ flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'end' }}>
                        <input type="checkbox" id="pf-spec" name="isSpecificCustomer" checked={promoForm.isSpecificCustomer} onChange={handlePromoField} />
                        <label htmlFor="pf-spec" style={{ margin: 0, textTransform: 'none', letterSpacing: 0, fontSize: 13 }}>Specific customer</label>
                      </div>
                      {promoForm.isSpecificCustomer && (
                        <div className="cv-admin-field">
                          <label>Customer</label>
                          <select name="userId" value={promoForm.userId} onChange={handlePromoField}>
                            <option value="">Select customer…</option>
                            {adminUsers.map(u => (
                              <option key={u.id} value={u.id}>{u.email || u.userName || u.id}</option>
                            ))}
                          </select>
                        </div>
                      )}
                    </>
                  )}
                  <div className="cv-admin-field is-full" style={{ alignItems: 'flex-start' }}>
                    <button type="submit" className="cv-admin-btn is-primary" disabled={savingPromo || !promoForm.codeName.trim()}>
                      {savingPromo ? 'Adding…' : '+ Add a promotion code'}
                    </button>
                  </div>
                </form>

                {(viewData.couponPromotionCodeMappingResponses || []).length === 0 ? (
                  <div className="cv-admin-table-empty">No promo codes yet.</div>
                ) : (
                  <table className="cv-admin-table">
                    <thead>
                      <tr>
                        <th>Promotion Code</th><th>Redemptions</th><th>Expires</th><th>Status</th>
                        <th>Specific Customer</th><th>First Time Only</th><th>Created</th><th aria-label="Actions" />
                      </tr>
                    </thead>
                    <tbody>
                      {viewData.couponPromotionCodeMappingResponses.map(p => {
                        const isActive = (p.status || '').toLowerCase() === 'active';
                        return (
                          <tr key={p.id}>
                            <td className="cell-email">{p.codeName}</td>
                            <td className="cell-muted">{p.usedCount || 0}{p.maxUses ? ` / ${p.maxUses}` : ''}</td>
                            <td className="cell-muted">{p.expirationDate ? fmtDate(p.expirationDate) : 'N/A'}</td>
                            <td>
                              <span className={`cv-admin-pill ${isActive ? 'is-active' : 'is-inactive'}`}>
                                <span className="cv-admin-pill-dot" />{isActive ? 'Active' : 'Inactive'}
                              </span>
                            </td>
                            <td className="cell-muted">{p.isSpecificCustomer ? 'Yes' : 'No'}</td>
                            <td className="cell-muted">{p.isFirstTimeOnly ? 'Yes' : 'No'}</td>
                            <td className="cell-muted">{fmtDate(p.modifiedAt)}</td>
                            <td>
                              <button type="button" className={`cv-admin-btn ${isActive ? 'is-warn' : 'is-success'}`} onClick={() => togglePromoActive(p)}>
                                {isActive ? 'Deactivate' : 'Activate'}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </>
            )}
          </div>
          <div className="cv-admin-modal-foot">
            <button type="button" className="cv-admin-btn" onClick={closeView}>Close</button>
          </div>
        </div>
      </AdminModal>

      {/* Track coupon usage modal */}
      <AdminModal open={trackOpen && !!trackCoupon} onClose={closeTrack}>
        {trackCoupon && (
          <div className="cv-admin-modal" style={{ maxWidth: 980 }} onClick={e => e.stopPropagation()}>
            <div className="cv-admin-modal-head">
              <h3>Track Coupon — {trackCoupon.couponName}</h3>
              <button type="button" className="cv-admin-modal-close" onClick={closeTrack}>×</button>
            </div>
            <div className="cv-admin-modal-body">
              <div className="cv-admin-field" style={{ maxWidth: 320, marginBottom: 16 }}>
                <label>Promotion code</label>
                <select value={trackPromoId} onChange={onTrackPromoChange}>
                  <option value="">All codes</option>
                  {trackPromos.map(p => (
                    <option key={p.id} value={p.id}>{p.codeName}</option>
                  ))}
                </select>
              </div>
              {trackLoading ? (
                <div className="cv-admin-loading"><span className="cv-admin-spinner" />Loading…</div>
              ) : trackRows.length === 0 ? (
                <div className="cv-admin-table-empty">No usage records yet.</div>
              ) : (
                <table className="cv-admin-table">
                  <thead>
                    <tr>
                      <th>Full Name</th><th>Email</th><th>Date Of Coupon Use</th><th>Coupon Name</th><th>Promocode Name</th><th>Package</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trackRows.map((r, i) => (
                      <tr key={i}>
                        <td className="cell-email">{
                          [r.firstName, r.middleName, r.lastName].filter(Boolean).join(' ')
                          || (r.userName && !String(r.userName).includes('@') ? r.userName : '')
                          || '—'
                        }</td>
                        <td className="cell-muted">{r.email || '—'}</td>
                        <td className="cell-muted">{fmtDate(r.dateOfCouponUse)}</td>
                        <td className="cell-muted">{r.couponName || '—'}</td>
                        <td className="cell-muted">{r.couponPromotionCodeName || '—'}</td>
                        <td className="cell-muted">
                          {r.packageName || '—'}
                          {r.billingPeriod ? ` / ${r.billingPeriod}` : ''}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            <div className="cv-admin-modal-foot">
              <button type="button" className="cv-admin-btn" onClick={closeTrack}>Close</button>
            </div>
          </div>
        )}
      </AdminModal>
    </main>
  );
}
