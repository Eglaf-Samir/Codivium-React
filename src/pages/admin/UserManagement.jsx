import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import {
  GetalladminUserslist,
  UpdateActiveInactive,
  SuperAdminUpdatePassword,
  SuperAdminUpdateUserDetails,
} from '../../api/auth/apiauth';
import { getallparamListBykey } from '../../api/paramMaster/apiparamMaster';
import { ParamMasterKey } from '../../config';
import { logout } from '../../utils/auth';
import AdminPager from '../../components/AdminPager.jsx';
import AdminModal from '../../components/AdminModal.jsx';

const initialForm = {
  id: '',
  email: '',
  firstName: '',
  lastName: '',
  middleName: '',
  dateOfBirth: '',
  street: '',
  address1: '',
  address2: '',
  city: '',
  county: '',
  zipCode: '',
  country: '',
  occupationId: '',
  programmingLevel: '',
  houseNumber: '',
  phoneNumber: '',
};

function fmtYear(d) {
  if (!d) return '';
  const dt = new Date(d);
  return Number.isNaN(dt.getTime()) ? '' : String(dt.getFullYear());
}

function toDateInput(d) {
  if (!d) return '';
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return '';
  const yyyy = dt.getFullYear();
  const mm = String(dt.getMonth() + 1).padStart(2, '0');
  const dd = String(dt.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export default function UserManagement() {
  const navigate = useNavigate();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [programmingLevels, setProgrammingLevels] = useState([]);
  const [occupations, setOccupations] = useState([]);

  const [editOpen, setEditOpen] = useState(false);
  const [account, setAccount] = useState(initialForm);
  const [savingEdit, setSavingEdit] = useState(false);

  const [pwdOpen, setPwdOpen] = useState(false);
  const [pwdForm, setPwdForm] = useState({ userId: '', newPassword: '' });
  const [savingPwd, setSavingPwd] = useState(false);

  useEffect(() => {
    fetchUsers();
    fetchParams();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleAuthFailure() {
    logout();
    navigate('/login', { replace: true });
  }

  async function fetchUsers() {
    setLoading(true);
    const res = await GetalladminUserslist();
    if (res?.status === 200 && Array.isArray(res?.data)) {
      setUsers(res.data);
    } else if (res?.status === 401) {
      handleAuthFailure();
      return;
    } else {
      setUsers([]);
    }
    setLoading(false);
  }

  async function fetchParams() {
    const [lvl, occ] = await Promise.all([
      getallparamListBykey(ParamMasterKey.ProgrammingLevel),
      getallparamListBykey(ParamMasterKey.Occupation),
    ]);
    if (lvl?.status === 200 && Array.isArray(lvl?.data)) setProgrammingLevels(lvl.data);
    if (occ?.status === 200 && Array.isArray(occ?.data)) setOccupations(occ.data);
  }

  // ── Filtering + pagination ─────────────────────────────────────
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter(u => {
      const fields = [u.firstName, u.middleName, u.lastName, u.email, u.country];
      return fields.some(f => (f || '').toLowerCase().includes(q));
    });
  }, [users, search]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / rowsPerPage));
  const pageSafe = Math.min(page, pageCount - 1);
  const visible = filtered.slice(pageSafe * rowsPerPage, pageSafe * rowsPerPage + rowsPerPage);

  // ── Edit ───────────────────────────────────────────────────────
  function openEdit(user) {
    console.log('user==>', user)
    setAccount({
      id: user.id || '',
      email: user.email || '',
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      middleName: user.middleName || '',
      dateOfBirth: toDateInput(user.dateOfBirth),
      street: user.street || '',
      address1: user.address1 || '',
      address2: user.address2 || '',
      city: user.city || '',
      county: user.county || '',
      zipCode: user.zipCode || '',
      country: user.country || '',
      occupationId: user.occupationId || '',
      programmingLevel: user.programmingLevel || '',
      houseNumber: user.houseNumber || '',
      phoneNumber: user.phoneNumber || '',
    });
    setEditOpen(true);
  }

  function closeEdit() {
    setEditOpen(false);
    setAccount(initialForm);
  }

  function handleEditChange(e) {
    const { name, value } = e.target;
    setAccount(prev => ({ ...prev, [name]: value }));
  }

  async function submitEdit(e) {
    e.preventDefault();
    if (!account.id) return;
    setSavingEdit(true);
    const payload = {
      ...account,
      dateOfBirth: account.dateOfBirth ? new Date(account.dateOfBirth).toISOString() : null,
    };
    const res = await SuperAdminUpdateUserDetails(account.id, JSON.stringify(payload));
    setSavingEdit(false);

    if (res?.status === 200 && res?.data) {
      await fetchUsers();
      closeEdit();
      Swal.fire({ title: 'Success', text: 'User updated.', icon: 'success' });
    } else if (res?.status === 401) {
      handleAuthFailure();
    } else if (res?.status === 404) {
      Swal.fire({ title: 'Error', text: res?.data || 'Update failed.', icon: 'error' });
    } else {
      Swal.fire({ title: 'Error', text: 'User has not been updated.', icon: 'error' });
    }
  }

  // ── Password reset ─────────────────────────────────────────────
  function openPwd(userId) {
    setPwdForm({ userId, newPassword: '' });
    setPwdOpen(true);
  }

  function closePwd() {
    setPwdOpen(false);
    setPwdForm({ userId: '', newPassword: '' });
  }

  async function submitPwd(e) {
    e.preventDefault();
    if (!pwdForm.userId || !pwdForm.newPassword) return;
    setSavingPwd(true);
    const res = await SuperAdminUpdatePassword(JSON.stringify(pwdForm));
    setSavingPwd(false);

    if (res?.status === 200 && res?.data) {
      closePwd();
      Swal.fire({ title: 'Success', text: 'Password updated.', icon: 'success' });
    } else if (res?.status === 401) {
      handleAuthFailure();
    } else if (res?.status === 404) {
      Swal.fire({ title: 'Error', text: res?.data || 'Password update failed.', icon: 'error' });
    } else {
      Swal.fire({ title: 'Error', text: 'Password has not been updated.', icon: 'error' });
    }
  }

  // ── Toggle active/inactive ─────────────────────────────────────
  async function toggleActive(user) {
    const becomingActive = !user.isActive;
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: becomingActive ? 'Activate this user?' : 'Deactivate this user?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: becomingActive ? 'Yes, activate' : 'Yes, deactivate',
      cancelButtonText: 'Cancel',
      reverseButtons: true,
    });
    if (!result.isConfirmed) return;

    const res = await UpdateActiveInactive(user.id, becomingActive);
    if (res?.status === 401) {
      handleAuthFailure();
      return;
    }
    if (res?.data === true || res?.data === 'true') {
      await fetchUsers();
      Swal.fire({
        title: 'Success',
        text: becomingActive ? 'User activated.' : 'User deactivated.',
        icon: 'success',
      });
    } else if (res?.data) {
      Swal.fire({ title: 'Error', text: String(res.data), icon: 'error' });
    } else {
      Swal.fire({ title: 'Error', text: 'Action failed.', icon: 'error' });
    }
  }
  console.log('account', account)
  return (
    <main className="main" id="main-content">
      <div className="cv-admin-page">
        <header className="cv-admin-header">
          <div className="cv-admin-header-text">
            <div className="cv-admin-kicker">Superadmin</div>
            <h1 className="cv-admin-title">User Management</h1>
            <p className="cv-admin-subtitle">
              {loading ? 'Loading users…' : `${filtered.length} of ${users.length} users`}
            </p>
          </div>
        </header>

        <section className="cv-admin-surface">
          <div className="cv-admin-surface-head">
            <h2>All Users</h2>
            <label className="cv-admin-search">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.8" />
                <path d="m20 20-3.5-3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
              <input
                type="search"
                placeholder="Search by name, email, country…"
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(0); }}
              />
            </label>
          </div>

          <div className="cv-admin-table-wrap">
            {loading ? (
              <div className="cv-admin-loading">
                <span className="cv-admin-spinner" aria-hidden="true" />
                Loading users…
              </div>
            ) : filtered.length === 0 ? (
              <div className="cv-admin-table-empty">
                {search ? 'No users match your search.' : 'No users found.'}
              </div>
            ) : (
              <table className="cv-admin-table" aria-label="Users">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>DOB</th>
                    <th>Country</th>
                    <th>Level</th>
                    <th>Occupation</th>
                    <th>Status</th>
                    <th aria-label="Actions" >Action</th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map(user => (
                    <tr key={user.id}>
                      <td>
                        {[user.firstName, user.middleName, user.lastName].filter(Boolean).join(' ') || '—'}
                      </td>
                      <td className="cell-email">{user.email || '—'}</td>
                      <td className="cell-muted">{fmtYear(user.dateOfBirth) || '—'}</td>
                      <td className="cell-muted">{user.country || '—'}</td>
                      <td className="cell-muted">{user.programmingLevelName || '—'}</td>
                      <td className="cell-muted">{user.occupationName || '—'}</td>
                      <td>
                        <span className={`cv-admin-pill ${user.isActive ? 'is-active' : 'is-inactive'}`}>
                          <span className="cv-admin-pill-dot" aria-hidden="true" />
                          {user.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>
                        <div className="cv-admin-actions">
                          <button type="button" className="cv-admin-btn is-primary" onClick={() => openPwd(user.id)}>
                            Password
                          </button>
                          <button type="button" className="cv-admin-btn" onClick={() => openEdit(user)}>
                            View
                          </button>
                          <button
                            type="button"
                            className={`cv-admin-btn ${user.isActive ? 'is-warn' : 'is-success'}`}
                            onClick={() => toggleActive(user)}
                          >
                            {user.isActive ? 'Deactivate' : 'Activate'}
                          </button>
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

      {/* ── Edit user modal ── */}
      <AdminModal open={editOpen} onClose={closeEdit} labelledBy="cvAdminEditTitle">
        <div className="cv-admin-modal" onClick={e => e.stopPropagation()}>
          <div className="cv-admin-modal-head">
            <h3 id="cvAdminEditTitle">User Details</h3>
            <button type="button" className="cv-admin-modal-close" aria-label="Close" onClick={closeEdit}>×</button>
          </div>
          <form onSubmit={submitEdit}>
            <div className="cv-admin-modal-body">
              <div className="cv-admin-form-grid">
                <div className="cv-admin-field is-full">
                  <label htmlFor="cv-email">Email</label>
                  <input id="cv-email" type="email" name="email" value={account.email} onChange={handleEditChange} disabled />
                </div>
                <div className="cv-admin-field">
                  <label htmlFor="cv-fn">First name</label>
                  <input id="cv-fn" name="firstName" value={account.firstName} onChange={handleEditChange} />
                </div>
                <div className="cv-admin-field">
                  <label htmlFor="cv-mn">Middle name</label>
                  <input id="cv-mn" name="middleName" value={account.middleName} onChange={handleEditChange} />
                </div>
                <div className="cv-admin-field">
                  <label htmlFor="cv-ln">Last name</label>
                  <input id="cv-ln" name="lastName" value={account.lastName} onChange={handleEditChange} />
                </div>
                <div className="cv-admin-field">
                  <label htmlFor="cv-dob">Date of birth</label>
                  <input id="cv-dob" type="date" name="dateOfBirth" value={account.dateOfBirth} onChange={handleEditChange} />
                </div>
                {/* <div className="cv-admin-field">
                  <label htmlFor="cv-phone">Phone</label>
                  <input id="cv-phone" name="phoneNumber" value={account.phoneNumber} onChange={handleEditChange} />
                </div> */}
                <div className="cv-admin-field">
                  <label htmlFor="cv-country">Country</label>
                  <input id="cv-country" name="country" value={account.country} onChange={handleEditChange} />
                </div>
                <div className="cv-admin-field">
                  <label htmlFor="cv-level">Programming level</label>
                  <select id="cv-level" name="programmingLevel" value={account.programmingLevel} onChange={handleEditChange}>
                    <option value="">—</option>
                    {programmingLevels.map(l => (
                      <option key={l.id} value={l.id}>{l.value || l.name || l.title}</option>
                    ))}
                  </select>
                </div>
                <div className="cv-admin-field">
                  <label htmlFor="cv-occ">Occupation</label>
                  <select id="cv-occ" name="occupationId" value={account.occupationId} onChange={handleEditChange}>
                    <option value="">—</option>
                    {occupations.map(o => (
                      <option key={o.id} value={o.id}>{o.value || o.name || o.title}</option>
                    ))}
                  </select>
                </div>
                <div className="cv-admin-field">
                  <label htmlFor="cv-house">House number</label>
                  <input id="cv-house" name="houseNumber" value={account.houseNumber} onChange={handleEditChange} />
                </div>
                <div className="cv-admin-field">
                  <label htmlFor="cv-street">Street</label>
                  <input id="cv-street" name="street" value={account.street} onChange={handleEditChange} />
                </div>
                <div className="cv-admin-field">
                  <label htmlFor="cv-addr1">Address line 1</label>
                  <input id="cv-addr1" name="address1" value={account.address1} onChange={handleEditChange} />
                </div>
                <div className="cv-admin-field">
                  <label htmlFor="cv-addr2">Address line 2</label>
                  <input id="cv-addr2" name="address2" value={account.address2} onChange={handleEditChange} />
                </div>
                <div className="cv-admin-field">
                  <label htmlFor="cv-city">City</label>
                  <input id="cv-city" name="city" value={account.city} onChange={handleEditChange} />
                </div>
                <div className="cv-admin-field">
                  <label htmlFor="cv-county">County</label>
                  <input id="cv-county" name="county" value={account.county} onChange={handleEditChange} />
                </div>
                <div className="cv-admin-field">
                  <label htmlFor="cv-zip">Postcode</label>
                  <input id="cv-zip" name="zipCode" value={account.zipCode} onChange={handleEditChange} />
                </div>
              </div>
            </div>
            <div className="cv-admin-modal-foot">
              <button type="button" className="cv-admin-btn" onClick={closeEdit} disabled={savingEdit}>
                Close
              </button>
              {/* <button type="submit" className="cv-admin-btn is-primary" disabled={savingEdit}>
                {savingEdit ? 'Saving…' : 'Save changes'}
              </button> */}
            </div>
          </form>
        </div>
      </AdminModal>

      {/* ── Reset password modal ── */}
      <AdminModal open={pwdOpen} onClose={closePwd} labelledBy="cvAdminPwdTitle">
        <div className="cv-admin-modal is-narrow" onClick={e => e.stopPropagation()}>
          <div className="cv-admin-modal-head">
            <h3 id="cvAdminPwdTitle">Reset Password</h3>
            <button type="button" className="cv-admin-modal-close" aria-label="Close" onClick={closePwd}>×</button>
          </div>
          <form onSubmit={submitPwd}>
            <div className="cv-admin-modal-body">
              <div className="cv-admin-field is-full">
                <label htmlFor="cv-newpwd">New password</label>
                <input
                  id="cv-newpwd"
                  type="password"
                  autoComplete="new-password"
                  value={pwdForm.newPassword}
                  onChange={e => setPwdForm(f => ({ ...f, newPassword: e.target.value }))}
                  required
                  minLength={6}
                />
              </div>
            </div>
            <div className="cv-admin-modal-foot">
              <button type="button" className="cv-admin-btn" onClick={closePwd} disabled={savingPwd}>
                Cancel
              </button>
              <button type="submit" className="cv-admin-btn is-primary" disabled={savingPwd || !pwdForm.newPassword}>
                {savingPwd ? 'Saving…' : 'Update password'}
              </button>
            </div>
          </form>
        </div>
      </AdminModal>
    </main>
  );
}
