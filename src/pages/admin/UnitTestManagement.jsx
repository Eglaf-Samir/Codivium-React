import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import {
  getallInterviewPreprationadminlist,
  DeleteInterviewPrepration,
  CreateInterviewPrepration,
  UpdateInterviewPrepration,
  AllUnitTestListbyId,
  CreateInterviewPreprationUnitTest,
  DeleteInterviewPreprationUnitTest,
  CreateInterviewPreprationUsingFile,
  CreateInterviewPreprationUnitTestUsingFile,
  GetInterviewPrepration,
} from '../../api/interviewprepration/apiinterviewprepration';
import {
  GetallDifficultyLevel,
  GetallCategory,
  GetCategoriesByMode,
} from '../../api/mcq/apimcq';
import { createparamasync } from '../../api/paramMaster/apiparamMaster';
import { ParamMasterKey, baseURL } from '../../config';
import { logout } from '../../utils/auth';
import AdminPager from '../../components/AdminPager.jsx';
import AdminCodeEditor from '../../components/AdminCodeEditor.jsx';
import AdminRichEditor from '../../components/AdminRichEditor.jsx';
import AdminModal from '../../components/AdminModal.jsx';

const initialPrep = {
  id: '0',
  title: '',
  description: '',
  fontAwesomeIcon: '',
  instructions: '',
  suggestedSolution: '',
  isCoding: true,
  isArrays: true,
  isCompleted: false,
  isSubmitted: false,
  sequenceNo: 1,
  excerciseId: '',
  csInterviewPreprationId: '',
  difficultyLevelId: null,
  categoriesId: null,
  subCategoriesId: null,
  hints: '',
  miniTutorial: '',
  manualSuggestedSolution: '',
};

const initialUnit = { id: null, title: '', description: '', codeTemplate: '' };

function downloadFile(url, filename = 'Sample.xlsx') {
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  link.parentNode.removeChild(link);
}

const VALID_XLSX_TYPES = [
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];

const MODE = 'INTERVIEW';

export default function UnitTestManagement() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const fileInputUnitTestRef = useRef(null);

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [editOpen, setEditOpen] = useState(false);
  const [form, setForm] = useState(initialPrep);
  const [saving, setSaving] = useState(false);

  // Dropdown data
  const [difficultyLevels, setDifficultyLevels] = useState([]);
  const [categoryList, setCategoryList] = useState([]);
  const [subCategoryList, setSubCategoryList] = useState([]);

  // Inline add-new helpers
  const [showCategoryInput, setShowCategoryInput] = useState(false);
  const [showSubCategoryInput, setShowSubCategoryInput] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [newSubCategory, setNewSubCategory] = useState('');

  // IsHTML toggles + dual content buffers (matches source behaviour: each
  // mode keeps its own text; the toggle just switches which buffer is shown.
  // The currently-active buffer is the one that gets saved as `instructions`
  // / `miniTutorial`, and the flag tells the backend which mode it is.)
  const [isInstructionHtml, setIsInstructionHtml] = useState(false);
  const [isTutorialHtml, setIsTutorialHtml] = useState(false);
  const [instructionHtml, setInstructionHtml] = useState('');
  const [instructionMarkdown, setInstructionMarkdown] = useState('');
  const [tutorialHtml, setTutorialHtml] = useState('');
  const [tutorialMarkdown, setTutorialMarkdown] = useState('');

  // Unit-test sub-modal
  const [unitOpen, setUnitOpen] = useState(false);
  const [unitDetails, setUnitDetails] = useState(null);
  const [parentTitle, setParentTitle] = useState('');
  const [unitForm, setUnitForm] = useState(initialUnit);
  const [savingUnit, setSavingUnit] = useState(false);
  const [unitPage, setUnitPage] = useState(0);
  const [unitRowsPerPage, setUnitRowsPerPage] = useState(10);
  const [uploading, setUploading] = useState(false);
  const [uploadingUnit, setUploadingUnit] = useState(false);

  useEffect(() => {
    loadAll();
    loadDifficultyLevels();
    loadCategories();
    /* eslint-disable-next-line */
  }, []);

  function authFail() { logout(); navigate('/login', { replace: true }); }

  async function loadAll() {
    setLoading(true);
    const res = await getallInterviewPreprationadminlist();
    if (res?.status === 401) { authFail(); return; }
    setItems(Array.isArray(res?.data) ? res.data : []);
    setLoading(false);
  }

  async function loadDifficultyLevels() {
    const res = await GetallDifficultyLevel(ParamMasterKey.DifficultyLevel);
    if (res?.status === 200 && Array.isArray(res?.data)) setDifficultyLevels(res.data);
  }

  async function loadCategories() {
    const res = await GetCategoriesByMode(MODE);
    if (res?.status === 200 && Array.isArray(res?.data)) setCategoryList(res.data);
    else setCategoryList([]);
    setSubCategoryList([]);
  }

  async function loadSubCategories(categoryId) {
    if (!categoryId) { setSubCategoryList([]); return; }
    const res = await GetallCategory(categoryId, '');
    if (res?.status === 200 && Array.isArray(res?.data)) setSubCategoryList(res.data);
    else setSubCategoryList([]);
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter(it => (it.title || '').toLowerCase().includes(q));
  }, [items, search]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / rowsPerPage));
  const pageSafe = Math.min(page, pageCount - 1);
  const visible = filtered.slice(pageSafe * rowsPerPage, (pageSafe + 1) * rowsPerPage);

  function resetEditState() {
    setForm(initialPrep);
    setShowCategoryInput(false);
    setShowSubCategoryInput(false);
    setNewCategory('');
    setNewSubCategory('');
    setIsInstructionHtml(false);
    setIsTutorialHtml(false);
    setInstructionHtml('');
    setInstructionMarkdown('');
    setTutorialHtml('');
    setTutorialMarkdown('');
    setSubCategoryList([]);
  }

  function openNew() {
    resetEditState();
    setEditOpen(true);
  }

  async function openEdit(it) {
    resetEditState();
    // Hydrate form from full record (source uses GetInterviewPrepration to get
    // related fields like categories/subCategories nested objects).
    let merged = { ...initialPrep, ...it };
    try {
      const res = await GetInterviewPrepration(it.id);
      if (res?.status === 200 && res?.data) {
        const d = res.data;
        merged = {
          ...merged,
          ...d,
          difficultyLevelId: d.difficultyLevelId ?? d.difficultyLevel?.id ?? null,
          categoriesId: d.categoriesId ?? d.categories?.id ?? null,
          subCategoriesId: d.subCategoriesId ?? d.subCategories?.id ?? null,
        };
      }
    } catch { /* fallback to row data */ }

    setForm(merged);
    const instrIsHtml = !!merged.isInstructionHtml;
    const tutIsHtml = !!merged.isTutorialHtml;
    setIsInstructionHtml(instrIsHtml);
    setIsTutorialHtml(tutIsHtml);
    // Source pattern: load saved content into the buffer matching the saved flag
    if (instrIsHtml) {
      setInstructionHtml(merged.instructions || '');
      setInstructionMarkdown('');
    } else {
      setInstructionMarkdown(merged.instructions || '');
      setInstructionHtml('');
    }
    if (tutIsHtml) {
      setTutorialHtml(merged.miniTutorial || '');
      setTutorialMarkdown('');
    } else {
      setTutorialMarkdown(merged.miniTutorial || '');
      setTutorialHtml('');
    }
    if (merged.categoriesId) await loadSubCategories(merged.categoriesId);
    setEditOpen(true);
  }

  function closeEdit() {
    setEditOpen(false);
    resetEditState();
  }

  function handleField(e) {
    const { name, value, type, checked } = e.target;
    setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  }

  function handleDifficulty(e) {
    setForm(f => ({ ...f, difficultyLevelId: e.target.value }));
  }

  async function handleCategory(e) {
    const value = e.target.value;
    setForm(f => ({ ...f, categoriesId: value, subCategoriesId: null }));
    await loadSubCategories(value);
  }

  function handleSubCategory(e) {
    setForm(f => ({ ...f, subCategoriesId: e.target.value }));
  }

  async function handleAddCategory() {
    if (!newCategory.trim()) return;
    const body = {
      name: newCategory.trim(),
      otherName: newCategory.trim(),
      description: '',
      parentId: form.difficultyLevelId || 0,
      category: ParamMasterKey.Categories,
      mode: MODE,
    };
    try {
      const res = await createparamasync(JSON.stringify(body));
      if (res?.status === 200 && res?.data) {
        await loadCategories();
        setForm(f => ({ ...f, categoriesId: res.data.id, subCategoriesId: null }));
        await loadSubCategories(res.data.id);
        setNewCategory('');
        setShowCategoryInput(false);
      } else if (res?.status === 401) authFail();
      else Swal.fire({ title: 'Error', text: 'Could not add category.', icon: 'error' });
    } catch {
      Swal.fire({ title: 'Error', text: 'Could not add category.', icon: 'error' });
    }
  }

  async function handleAddSubCategory() {
    if (!newSubCategory.trim() || !form.categoriesId) return;
    const body = {
      name: newSubCategory.trim(),
      otherName: newSubCategory.trim(),
      description: '',
      parentId: form.categoriesId,
      category: ParamMasterKey.SubCategories,
    };
    try {
      const res = await createparamasync(JSON.stringify(body));
      if (res?.status === 200 && res?.data) {
        await loadSubCategories(form.categoriesId);
        setForm(f => ({ ...f, subCategoriesId: res.data.id }));
        setNewSubCategory('');
        setShowSubCategoryInput(false);
      } else if (res?.status === 401) authFail();
      else Swal.fire({ title: 'Error', text: 'Could not add subcategory.', icon: 'error' });
    } catch {
      Swal.fire({ title: 'Error', text: 'Could not add subcategory.', icon: 'error' });
    }
  }

  async function submitPrep(e) {
    e.preventDefault();
    if (!form.title.trim()) { Swal.fire({ title: 'Name required', icon: 'warning' }); return; }
    setSaving(true);
    const body = { ...form, isInstructionHtml, isTutorialHtml };
    let res;
    try {
      res = (Number(form.id) > 0)
        ? await UpdateInterviewPrepration(body)
        : await CreateInterviewPrepration(body);
    } catch (e) { res = e; }
    setSaving(false);
    if (res?.status === 200 && res?.data) {
      await loadAll();
      closeEdit();
      Swal.fire({ title: 'Success', icon: 'success' });
    } else if (res?.status === 401) authFail();
    else Swal.fire({ title: 'Error', text: res?.data || 'Could not save.', icon: 'error' });
  }

  async function removePrep(id) {
    const ok = await Swal.fire({
      title: 'Delete this exercise?', icon: 'warning', showCancelButton: true,
      confirmButtonText: 'Yes, delete', cancelButtonText: 'Cancel', reverseButtons: true,
    });
    if (!ok.isConfirmed) return;
    const res = await DeleteInterviewPrepration(id);
    if (res?.status === 401) { authFail(); return; }
    if (res?.data === true || res?.data === 'true') {
      await loadAll();
      Swal.fire({ title: 'Deleted', icon: 'success' });
    } else Swal.fire({ title: 'Error', text: res?.data || 'Delete failed.', icon: 'error' });
  }

  async function bulkUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!VALID_XLSX_TYPES.includes(file.type)) {
      Swal.fire({ title: 'Invalid file', text: 'Please upload a valid Excel file (.xls or .xlsx).', icon: 'warning' });
      e.target.value = '';
      return;
    }
    setUploading(true);
    const fd = new FormData();
    fd.append('File', file);
    const res = await CreateInterviewPreprationUsingFile(fd);
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (res?.status === 200 && res?.data) {
      await loadAll();
      Swal.fire({ title: 'Uploaded', icon: 'success' });
    } else if (res?.status === 401) authFail();
    else Swal.fire({ title: 'Error', text: 'Upload failed.', icon: 'error' });
  }

  // ── Unit-test sub-flow ─────────────────────────────────────────
  async function openUnits(item) {
    const res = await AllUnitTestListbyId(item.id);
    if (res?.status === 401) { authFail(); return; }
    if (res?.status === 200 && res?.data) {
      setUnitDetails(res.data);
      setParentTitle(item.title || '');
      setUnitForm(initialUnit);
      setUnitPage(0);
      setUnitOpen(true);
    } else {
      Swal.fire({ title: 'Error', text: 'Could not load unit tests.', icon: 'error' });
    }
  }

  function closeUnits() {
    setUnitOpen(false);
    setUnitDetails(null);
    setParentTitle('');
    setUnitForm(initialUnit);
  }

  function editUnit(u) {
    setUnitForm({
      id: u.id || null,
      title: u.name || u.title || '',
      description: u.description || '',
      codeTemplate: u.codeTemplate || '',
    });
  }

  function clearUnitForm() {
    setUnitForm(initialUnit);
  }

  async function refreshUnits() {
    if (!unitDetails?.id) return;
    const res = await AllUnitTestListbyId(unitDetails.id);
    if (res?.status === 200 && res?.data) setUnitDetails(res.data);
  }

  async function submitUnit(e) {
    e.preventDefault();
    if (!unitDetails || !unitForm.title.trim()) return;
    setSavingUnit(true);
    const body = {
      id: unitForm.id,
      csInterviewPreprationId: unitDetails.csInterviewPreprationId,
      excerciseId: unitDetails.excerciseId,
      title: unitForm.title,
      description: unitForm.description,
      codeTemplate: unitForm.codeTemplate,
    };
    let res;
    try { res = await CreateInterviewPreprationUnitTest(JSON.stringify(body)); }
    catch (e) { res = e; }
    setSavingUnit(false);
    if (res?.status === 200 && res?.data) {
      const wasEdit = !!unitForm.id;
      setUnitForm(initialUnit);
      await refreshUnits();
      Swal.fire({ title: wasEdit ? 'Updated' : 'Added', icon: 'success' });
    } else if (res?.status === 401) authFail();
    else Swal.fire({ title: 'Error', text: 'Could not save unit test.', icon: 'error' });
  }

  async function removeUnit(unitId) {
    if (!unitDetails) return;
    const ok = await Swal.fire({
      title: 'Delete this unit test?', icon: 'warning', showCancelButton: true,
      confirmButtonText: 'Yes, delete', cancelButtonText: 'Cancel', reverseButtons: true,
    });
    if (!ok.isConfirmed) return;
    const res = await DeleteInterviewPreprationUnitTest(
      unitDetails.csInterviewPreprationId,
      unitDetails.excerciseId,
      unitId,
    );
    if (res?.status === 401) { authFail(); return; }
    if (res?.data === true || res?.data === 'true') {
      if (unitForm.id === unitId) setUnitForm(initialUnit);
      await refreshUnits();
      Swal.fire({ title: 'Deleted', icon: 'success' });
    } else Swal.fire({ title: 'Error', text: res?.data || 'Delete failed.', icon: 'error' });
  }

  async function bulkUploadUnits(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!VALID_XLSX_TYPES.includes(file.type)) {
      Swal.fire({ title: 'Invalid file', text: 'Please upload a valid Excel file (.xls or .xlsx).', icon: 'warning' });
      e.target.value = '';
      return;
    }
    if (!unitDetails?.id) return;
    setUploadingUnit(true);
    const fd = new FormData();
    fd.append('File', file);
    fd.append('ID', unitDetails.id);
    const res = await CreateInterviewPreprationUnitTestUsingFile(fd);
    setUploadingUnit(false);
    if (fileInputUnitTestRef.current) fileInputUnitTestRef.current.value = '';
    if (res?.status === 200 && res?.data) {
      await refreshUnits();
      Swal.fire({ title: 'Uploaded', icon: 'success' });
    } else if (res?.status === 401) authFail();
    else Swal.fire({ title: 'Error', text: 'Upload failed.', icon: 'error' });
  }

  const unitList = unitDetails?.unittestlist || [];
  const unitPageCount = Math.max(1, Math.ceil(unitList.length / unitRowsPerPage));
  const unitPageSafe = Math.min(unitPage, unitPageCount - 1);
  const unitVisible = unitList.slice(
    unitPageSafe * unitRowsPerPage,
    unitPageSafe * unitRowsPerPage + unitRowsPerPage,
  );

  return (
    <main className="main" id="main-content">
      <div className="cv-admin-page">
        <header className="cv-admin-header">
          <div className="cv-admin-header-text">
            <div className="cv-admin-kicker">Superadmin</div>
            <h1 className="cv-admin-title">Unit Test Management</h1>
            <p className="cv-admin-subtitle">Interview preparation exercises and their unit tests.</p>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button
              type="button"
              className="cv-admin-btn"
              onClick={() => downloadFile(baseURL + 'Emoji/SampleFile/SampleUnitTest.xlsx', 'SampleUnitTest.xlsx')}
            >↓ Sample</button>
            <input ref={fileInputRef} type="file" accept=".xls,.xlsx" style={{ display: 'none' }} onChange={bulkUpload} />
            <button type="button" className="cv-admin-btn" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
              {uploading ? 'Uploading…' : '↑ Bulk upload'}
            </button>
            <button type="button" className="cv-admin-btn is-primary" onClick={openNew}>+ New Exercise</button>
          </div>
        </header>

        <section className="cv-admin-surface">
          <div className="cv-admin-surface-head">
            <h2>All Exercises</h2>
            <label className="cv-admin-search">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.8" /><path d="m20 20-3.5-3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
              <input type="search" placeholder="Search title…" value={search} onChange={e => { setSearch(e.target.value); setPage(0); }} />
            </label>
          </div>

          <div className="cv-admin-table-wrap">
            {loading ? (
              <div className="cv-admin-loading"><span className="cv-admin-spinner" />Loading…</div>
            ) : filtered.length === 0 ? (
              <div className="cv-admin-table-empty">{search ? 'No matches.' : 'No exercises yet.'}</div>
            ) : (
              <table className="cv-admin-table">
                <thead>
                  <tr><th>Title</th><th>Coding</th><th>Seq</th><th>Description</th><th aria-label="Actions" >Action</th></tr>
                </thead>
                <tbody>
                  {visible.map(it => (
                    <tr key={it.id}>
                      <td className="cell-email">{it.title || '—'}</td>
                      <td>
                        <span className={`cv-admin-pill ${it.isCoding ? 'is-active' : 'is-inactive'}`}>
                          <span className="cv-admin-pill-dot" />{it.isCoding ? 'Coding' : 'Other'}
                        </span>
                      </td>
                      <td className="cell-muted">{it.sequenceNo || '—'}</td>
                      <td className="cell-muted">
                        {(it.description || '').length > 120 ? (it.description || '').slice(0, 120) + '…' : (it.description || '—')}
                      </td>
                      <td>
                        <div className="cv-admin-actions">
                          <button type="button" className="cv-admin-btn" onClick={() => openEdit(it)}>Edit</button>
                          <button type="button" className="cv-admin-btn is-primary" onClick={() => openUnits(it)}>Unit Tests</button>
                          <button type="button" className="cv-admin-btn is-warn" onClick={() => removePrep(it.id)}>Delete</button>
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

      {/* Exercise edit modal */}
      <AdminModal open={editOpen} onClose={closeEdit}>
        <div className="cv-admin-modal" onClick={e => e.stopPropagation()}>
          <div className="cv-admin-modal-head">
            <h3>{Number(form.id) > 0 ? 'Update Unit Test' : 'Add Unit Test'}</h3>
            <button type="button" className="cv-admin-modal-close" onClick={closeEdit}>×</button>
          </div>
          <form onSubmit={submitPrep}>
            <div className="cv-admin-modal-body">
              <div className="cv-admin-form-grid">
                <div className="cv-admin-field">
                  <label>Name</label>
                  <input name="title" value={form.title} onChange={handleField} placeholder="Title" required />
                </div>
                <div className="cv-admin-field">
                  <label>Font Awesome Icon</label>
                  <input name="fontAwesomeIcon" value={form.fontAwesomeIcon} onChange={handleField} placeholder="Font Awesome Icon" />
                </div>

                <div className="cv-admin-field is-full">
                  <label>Description</label>
                  <textarea rows={3} name="description" value={form.description} onChange={handleField} placeholder="Description" />
                </div>

                <div className="cv-admin-field is-full">
                  <label>Difficulty Level</label>
                  <select value={form.difficultyLevelId || ''} onChange={handleDifficulty}>
                    <option value="">—</option>
                    {difficultyLevels.map(d => (
                      <option key={d.id} value={d.id}>{d.name || d.value}</option>
                    ))}
                  </select>
                </div>

                <div className="cv-admin-field is-full">
                  <label>Select Category</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <select style={{ flex: 1 }} value={form.categoriesId || ''} onChange={handleCategory}>
                      <option value="">—</option>
                      {categoryList.map(c => (
                        <option key={c.id} value={c.id}>{c.name || c.value}</option>
                      ))}
                    </select>
                    <button type="button" className="cv-admin-btn is-primary" onClick={() => setShowCategoryInput(s => !s)}>
                      {showCategoryInput ? 'Cancel' : 'Add'}
                    </button>
                  </div>
                  {showCategoryInput && (
                    <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                      <input style={{ flex: 1 }} placeholder="Enter new category" value={newCategory}
                        onChange={e => setNewCategory(e.target.value)} />
                      <button type="button" className="cv-admin-btn is-primary" onClick={handleAddCategory} disabled={!newCategory.trim()}>
                        Save
                      </button>
                    </div>
                  )}
                </div>

                <div className="cv-admin-field is-full">
                  <label>Select SubCategory</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <select style={{ flex: 1 }} value={form.subCategoriesId || ''} onChange={handleSubCategory} disabled={!form.categoriesId}>
                      <option value="">—</option>
                      {subCategoryList.map(s => (
                        <option key={s.id} value={s.id}>{s.name || s.value}</option>
                      ))}
                    </select>
                    <button type="button" className="cv-admin-btn is-primary" onClick={() => setShowSubCategoryInput(s => !s)} disabled={!form.categoriesId}>
                      {showSubCategoryInput ? 'Cancel' : 'Add'}
                    </button>
                  </div>
                  {showSubCategoryInput && (
                    <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                      <input style={{ flex: 1 }} placeholder="Enter new subcategory" value={newSubCategory}
                        onChange={e => setNewSubCategory(e.target.value)} />
                      <button type="button" className="cv-admin-btn is-primary" onClick={handleAddSubCategory} disabled={!newSubCategory.trim()}>
                        Save
                      </button>
                    </div>
                  )}
                </div>

                <div className="cv-admin-field is-full">
                  <div className="cv-admin-field-row">
                    <label style={{ flex: 1, margin: 0 }}>Instructions</label>
                    <span className="cv-admin-toggle">
                      <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>IsHTML</span>
                      <input type="checkbox" className="cv-admin-switch" checked={isInstructionHtml}
                        onChange={e => {
                          const next = e.target.checked;
                          setIsInstructionHtml(next);
                          // Sync form.instructions to the new active buffer's content
                          setForm(f => ({ ...f, instructions: next ? instructionHtml : instructionMarkdown }));
                        }} />
                    </span>
                  </div>
                  {isInstructionHtml ? (
                    <textarea rows={6} value={instructionHtml}
                      onChange={e => {
                        setInstructionHtml(e.target.value);
                        setForm(f => ({ ...f, instructions: e.target.value }));
                      }}
                      placeholder="Enter HTML instructions" />
                  ) : (
                    <textarea rows={6} value={instructionMarkdown}
                      onChange={e => {
                        setInstructionMarkdown(e.target.value);
                        setForm(f => ({ ...f, instructions: e.target.value }));
                      }}
                      placeholder="Enter Markdown instructions" />
                  )}
                </div>

                <div className="cv-admin-field is-full">
                  <label>Suggested Solution</label>
                  <AdminCodeEditor
                    value={form.suggestedSolution}
                    onChange={v => setForm(f => ({ ...f, suggestedSolution: v }))}
                    height="280px"
                    name="ut_solution"
                  />
                </div>

                <div className="cv-admin-field is-full">
                  <label>Manual Suggested Solution</label>
                  <AdminCodeEditor
                    value={form.manualSuggestedSolution}
                    onChange={v => setForm(f => ({ ...f, manualSuggestedSolution: v }))}
                    height="220px"
                    name="ut_manual_solution"
                  />
                </div>

                <div className="cv-admin-field is-full">
                  <label>Hints</label>
                  <AdminRichEditor
                    value={form.hints}
                    onChange={v => setForm(f => ({ ...f, hints: v }))}
                    placeholder="Hints"
                  />
                </div>

                <div className="cv-admin-field is-full">
                  <div className="cv-admin-field-row">
                    <label style={{ flex: 1, margin: 0 }}>Tutorial</label>
                    <span className="cv-admin-toggle">
                      <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>IsHTML</span>
                      <input type="checkbox" className="cv-admin-switch" checked={isTutorialHtml}
                        onChange={e => {
                          const next = e.target.checked;
                          setIsTutorialHtml(next);
                          setForm(f => ({ ...f, miniTutorial: next ? tutorialHtml : tutorialMarkdown }));
                        }} />
                    </span>
                  </div>
                  {isTutorialHtml ? (
                    <textarea rows={6} value={tutorialHtml}
                      onChange={e => {
                        setTutorialHtml(e.target.value);
                        setForm(f => ({ ...f, miniTutorial: e.target.value }));
                      }}
                      placeholder="Enter HTML tutorial" />
                  ) : (
                    <textarea rows={6} value={tutorialMarkdown}
                      onChange={e => {
                        setTutorialMarkdown(e.target.value);
                        setForm(f => ({ ...f, miniTutorial: e.target.value }));
                      }}
                      placeholder="Enter Markdown tutorial" />
                  )}
                </div>
              </div>
            </div>
            <div className="cv-admin-modal-foot">
              <button type="button" className="cv-admin-btn" onClick={closeEdit} disabled={saving}>Close</button>
              <button type="submit" className="cv-admin-btn is-primary" disabled={saving}>{saving ? 'Saving…' : 'Save Changes'}</button>
            </div>
          </form>
        </div>
      </AdminModal>

      {/* Unit tests modal */}
      <AdminModal open={unitOpen && !!unitDetails} onClose={closeUnits}>
        {unitDetails && (
          <div className="cv-admin-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 1080 }}>
            <div className="cv-admin-modal-head">
              <h3 className="cv-admin-modal-title">
                <span className="cv-admin-modal-title-kicker">Unit Test Details</span>
                <span className="cv-admin-modal-title-name" title={parentTitle}>
                  {parentTitle || 'Exercise'}
                </span>
              </h3>
              <button type="button" className="cv-admin-modal-close" onClick={closeUnits}>×</button>
            </div>
            <div className="cv-admin-modal-body">
              <form onSubmit={submitUnit} style={{ marginBottom: 18, padding: 14, border: '1px solid var(--color-border-default)', borderRadius: 12, background: 'rgba(0,0,0,0.18)' }}>
                <div style={{ marginBottom: 12, paddingBottom: 10, borderBottom: '1px solid var(--color-border-default)' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.10em', textTransform: 'uppercase', color: 'var(--color-text-muted)', marginBottom: 4 }}>
                    {unitForm.id ? 'Edit unit test' : 'Add new unit test'}
                  </div>
                  {unitForm.id && (
                    <div style={{ fontFamily: 'var(--font-brand)', fontSize: 16, fontWeight: 700, color: 'var(--color-text-accent)' }} title={unitForm.title}>
                      {unitForm.title || '—'}
                    </div>
                  )}
                </div>
                <div className="cv-admin-form-grid">
                  <div className="cv-admin-field is-full">
                    <label>Title</label>
                    <input value={unitForm.title} onChange={e => setUnitForm(u => ({ ...u, title: e.target.value }))} required />
                  </div>
                  <div className="cv-admin-field is-full">
                    <label>Description</label>
                    <textarea rows={2} value={unitForm.description} onChange={e => setUnitForm(u => ({ ...u, description: e.target.value }))} />
                  </div>
                  <div className="cv-admin-field is-full">
                    <label>Code template</label>
                    <AdminCodeEditor
                      value={unitForm.codeTemplate}
                      onChange={v => setUnitForm(u => ({ ...u, codeTemplate: v }))}
                      height="240px"
                      name="ut_code_template"
                    />
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 10 }}>
                  <button type="button" className="cv-admin-btn is-warn" onClick={clearUnitForm}>Clear</button>
                  <button type="submit" className="cv-admin-btn is-primary" disabled={savingUnit || !unitForm.title.trim()}>
                    {savingUnit ? 'Saving…' : (unitForm.id ? 'Update' : 'Add')}
                  </button>
                </div>
              </form>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
                <button
                  type="button"
                  className="cv-admin-btn"
                  onClick={() => downloadFile(baseURL + 'Emoji/SampleFile/SampleDeliberatePracticePreprationUnitTest.xlsx', 'SampleUnitTest.xlsx')}
                >↓ Download sample</button>
                <input ref={fileInputUnitTestRef} type="file" accept=".xls,.xlsx" style={{ display: 'none' }} onChange={bulkUploadUnits} />
                <button type="button" className="cv-admin-btn is-primary" onClick={() => fileInputUnitTestRef.current?.click()} disabled={uploadingUnit}>
                  {uploadingUnit ? 'Uploading…' : '↑ Upload'}
                </button>
              </div>

              {unitList.length === 0 ? (
                <div className="cv-admin-table-empty">No unit tests yet.</div>
              ) : (
                <>
                  <div className="cv-admin-table-wrap">
                    <table className="cv-admin-table" style={{ minWidth: 720 }}>
                      <thead>
                        <tr><th style={{ width: '20%' }}>Title</th><th style={{ width: '32%' }}>Description</th><th style={{ width: '32%' }}>Code template</th><th aria-label="Actions" /></tr>
                      </thead>
                      <tbody>
                        {unitVisible.map(u => (
                          <tr key={u.id}>
                            <td className="cell-email" style={{ wordBreak: 'break-word' }}>{u.name || u.title || '—'}</td>
                            <td className="cell-muted" style={{ wordBreak: 'break-word' }}>
                              {(u.description || '').length > 120 ? (u.description || '').slice(0, 120) + '…' : (u.description || '—')}
                            </td>
                            <td className="cell-muted" style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}>
                              {(u.codeTemplate || '').length > 80 ? (u.codeTemplate || '').slice(0, 80) + '…' : (u.codeTemplate || '—')}
                            </td>
                            <td>
                              <div className="cv-admin-actions">
                                <button type="button" className="cv-admin-btn" onClick={() => editUnit(u)}>Edit</button>
                                <button type="button" className="cv-admin-btn is-warn" onClick={() => removeUnit(u.id)}>Delete</button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {unitList.length > 0 && (
                    <AdminPager
                      total={unitList.length}
                      page={unitPageSafe}
                      rowsPerPage={unitRowsPerPage}
                      onPageChange={setUnitPage}
                      onRowsPerPageChange={setUnitRowsPerPage}
                      rowsPerPageOptions={[5, 10, 25, 50]}
                    />
                  )}
                </>
              )}
            </div>
            <div className="cv-admin-modal-foot">
              <button type="button" className="cv-admin-btn" onClick={closeUnits}>Close</button>
            </div>
          </div>
        )}
      </AdminModal>
    </main>
  );
}
