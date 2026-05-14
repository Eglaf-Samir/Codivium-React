import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import {
  Deletemcq,
  getallmcqlistbyadmin,
  getmcqdetails,
  GetallCategory,
  GetallDifficultyLevel,
  Createmcq,
  Updatemcq,
  CreatemcqUsingFile,
} from '../../api/mcq/apimcq';
import { ParamMasterKey, baseURL } from '../../config';
import { logout } from '../../utils/auth';
import AdminPager from '../../components/AdminPager.jsx';
import AdminRichEditor from '../../components/AdminRichEditor.jsx';
import AdminCodeEditor from '../../components/AdminCodeEditor.jsx';
import AdminModal from '../../components/AdminModal.jsx';

const initialForm = {
  id: null,
  mcqQuestionId: null,
  question: '',
  questionOptions: [],
  description: '',
  nanoTutorial: '',
  difficultyLevelId: '',
  categoriesId: '',
  subCategoriesId: '',
  createdBy: '',
  modifiedBy: '',
  ismultipleAnswer: false,
};

const initialOption = { optionId: null, optionName: '', isAnswers: false, isCoding: false };

export default function McqManagement() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [filterData, setFilterData] = useState({ difficultyLevelId: null, categoryId: null, subcategoryId: null });
  const [diffLevels, setDiffLevels] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [options, setOptions] = useState([{ ...initialOption }]);
  const [editCats, setEditCats] = useState([]);
  const [editSubs, setEditSubs] = useState([]);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Inline form errors keyed by field name. Cleared by handleField on edit.
  const [errors, setErrors] = useState({});

  // Quick "Options & Answers" peek modal — opens from the table row without
  // entering the full edit modal. Restored from legacy admin parity.
  const [optionsViewItem, setOptionsViewItem] = useState(null);

  useEffect(() => { loadAll(); loadDiffLevels(); /* eslint-disable-next-line */ }, []);

  function authFail() { logout(); navigate('/login', { replace: true }); }

  async function loadAll(filterBody = filterData) {
    setLoading(true);
    const res = await getallmcqlistbyadmin(JSON.stringify(filterBody));
    if (res?.status === 401) { authFail(); return; }
    setItems(Array.isArray(res?.data) ? res.data : []);
    setLoading(false);
  }

  async function loadDiffLevels() {
    const res = await GetallDifficultyLevel(ParamMasterKey.DifficultyLevel);
    if (Array.isArray(res?.data)) setDiffLevels(res.data);
  }

  async function loadCats(parentId, target /* 'filter' | 'edit' */) {
    if (!parentId) {
      if (target === 'filter') setCategories([]);
      else setEditCats([]);
      return;
    }
    const res = await GetallCategory(parentId);
    const list = Array.isArray(res?.data) ? res.data : [];
    if (target === 'filter') setCategories(list);
    else setEditCats(list);
  }

  async function loadSubs(parentId, target) {
    if (!parentId) {
      if (target === 'filter') setSubCategories([]);
      else setEditSubs([]);
      return;
    }
    const res = await GetallCategory(parentId);
    const list = Array.isArray(res?.data) ? res.data : [];
    if (target === 'filter') setSubCategories(list);
    else setEditSubs(list);
  }

  // ── Filter handlers ─────────────────────────────────────────
  function handleFilter(field, value) {
    const next = { ...filterData, [field]: value || null };
    if (field === 'difficultyLevelId') { next.categoryId = null; next.subcategoryId = null; setSubCategories([]); loadCats(value, 'filter'); }
    if (field === 'categoryId') { next.subcategoryId = null; loadSubs(value, 'filter'); }
    setFilterData(next);
    loadAll(next);
  }

  // ── Filtered list (client-side text search on top of server filter) ──
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter(i => (i.question || '').toLowerCase().includes(q));
  }, [items, search]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / rowsPerPage));
  const pageSafe = Math.min(page, pageCount - 1);
  const visible = filtered.slice(pageSafe * rowsPerPage, (pageSafe + 1) * rowsPerPage);

  // ── Form handling ───────────────────────────────────────────
  function openNew() {
    setForm(initialForm);
    setOptions([{ ...initialOption }]);
    setEditCats([]); setEditSubs([]);
    setErrors({});
    setOpen(true);
  }

  async function openEdit(item) {
    const res = await getmcqdetails(item.id, item.mcqQuestionId);
    if (res?.status === 401) { authFail(); return; }
    if (res?.status === 200 && res?.data) {
      const d = res.data;
      // Backend returns nested ParamMaster objects on the entity
      // (difficultyLevel/categories/subCategories), not flat *Id fields. Also
      // the boolean is `isMultipleAnswer` (capital M) on the entity. Read
      // from the nested shape; we still send flat *Id fields on save.
      const diffId = d.difficultyLevel?.id || '';
      const catId = d.categories?.id || '';
      const subId = d.subCategories?.id || '';
      setErrors({});
      setForm({
        id: d.id || null,
        mcqQuestionId: d.mcqQuestionId || null,
        question: d.question || '',
        description: d.description || '',
        nanoTutorial: d.nanoTutorial || d.NanoTutorial || '',
        difficultyLevelId: diffId,
        categoriesId: catId,
        subCategoriesId: subId,
        createdBy: d.createdBy || '',
        modifiedBy: d.modifiedBy || '',
        ismultipleAnswer: !!(d.isMultipleAnswer ?? d.ismultipleAnswer),
        questionOptions: d.questionOptions || [],
      });
      setOptions(Array.isArray(d.questionOptions) && d.questionOptions.length > 0
        ? d.questionOptions.map(o => ({ optionId: o.optionId || o.id || null, optionName: o.optionName || '', isAnswers: !!o.isAnswers, isCoding: !!o.isCoding }))
        : [{ ...initialOption }]);
      // Cascade both dropdowns so the existing values render selected. Run
      // sequentially — Category must resolve before Subcategory loads.
      if (diffId) await loadCats(diffId, 'edit');
      if (catId) await loadSubs(catId, 'edit');
      setOpen(true);
    } else {
      Swal.fire({ title: 'Error', text: 'Could not load MCQ.', icon: 'error' });
    }
  }

  function close() {
    setOpen(false);
    setForm(initialForm);
    setOptions([{ ...initialOption }]);
    setErrors({});
  }

  function handleField(e) {
    const { name, value, type, checked } = e.target;
    setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
    if (errors[name]) setErrors(es => ({ ...es, [name]: '' }));
    if (name === 'difficultyLevelId') { loadCats(value, 'edit'); setEditSubs([]); setForm(f => ({ ...f, categoriesId: '', subCategoriesId: '' })); }
    if (name === 'categoriesId') { loadSubs(value, 'edit'); setForm(f => ({ ...f, subCategoriesId: '' })); }
  }

  function openOptionsView(item) { setOptionsViewItem(item); }
  function closeOptionsView() { setOptionsViewItem(null); }

  function downloadTemplate() {
    const url = baseURL + 'Emoji/SampleFile/SampleMcq.xlsx';
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'SampleMcq.xlsx');
    document.body.appendChild(link);
    link.click();
    link.parentNode.removeChild(link);
  }

  function setOption(idx, field, value) {
    setOptions(opts => opts.map((o, i) => i === idx ? { ...o, [field]: value } : o));
    if (errors.options) setErrors(es => ({ ...es, options: '' }));
  }

  function addOption() {
    setOptions(opts => [...opts, { ...initialOption }]);
    if (errors.options) setErrors(es => ({ ...es, options: '' }));
  }
  function removeOption(idx) {
    setOptions(opts => opts.length === 1 ? opts : opts.filter((_, i) => i !== idx));
    if (errors.options) setErrors(es => ({ ...es, options: '' }));
  }

  // Collect every problem before failing so the user sees all required fields
  // at once rather than one popup at a time. Returns the errors object so
  // submit() can short-circuit when anything is set.
  function validateForm() {
    const errs = {};
    if (!form.question || !form.question.replace(/<[^>]*>/g, '').trim()) {
      errs.question = 'Question is required.';
    }
    if (!form.difficultyLevelId) errs.difficultyLevelId = 'Select a difficulty.';
    if (!form.categoriesId) errs.categoriesId = 'Select a category.';
    if (!form.subCategoriesId) errs.subCategoriesId = 'Select a subcategory.';
    if (!options.length || !options.some(o => o.isAnswers)) {
      errs.options = 'At least one correct answer is required.';
    } else if (options.some(o => !o.optionName.trim())) {
      errs.options = 'All options need text.';
    }
    return errs;
  }

  async function submit(e) {
    e.preventDefault();
    const errs = validateForm();
    setErrors(errs);
    if (Object.keys(errs).length > 0) {
      Swal.fire({ title: 'Please fix the highlighted fields', icon: 'warning' });
      return;
    }

    setSaving(true);
    const userId = localStorage.getItem('Userid');
    const body = {
      ...form,
      createdBy: form.createdBy || userId,
      modifiedBy: userId,
      questionOptions: options,
    };

    let res;
    try {
      res = (form.id) ? await Updatemcq(body) : await Createmcq(body);
    } catch (e) { res = e; }
    setSaving(false);

    if (res?.status === 200 && res?.data) {
      await loadAll();
      close();
      Swal.fire({ title: 'Success', icon: 'success' });
    } else if (res?.status === 401) authFail();
    else Swal.fire({ title: 'Error', text: 'Could not save MCQ.', icon: 'error' });
  }

  async function remove(item) {
    const ok = await Swal.fire({
      title: 'Delete this MCQ?', icon: 'warning', showCancelButton: true,
      confirmButtonText: 'Yes, delete', cancelButtonText: 'Cancel', reverseButtons: true,
    });
    if (!ok.isConfirmed) return;
    const res = await Deletemcq(item.id, item.mcqQuestionId);
    if (res?.status === 401) { authFail(); return; }
    if (res?.data === true || res?.data === 'true') {
      await loadAll();
      Swal.fire({ title: 'Deleted', icon: 'success' });
    } else Swal.fire({ title: 'Error', text: res?.data || 'Delete failed.', icon: 'error' });
  }

  async function uploadFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append('formFile', file);
    fd.append('CreatedBy', localStorage.getItem('Userid') || '');
    const res = await CreatemcqUsingFile(fd);
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (res?.status === 200) {
      await loadAll();
      Swal.fire({ title: 'Uploaded', text: 'MCQs imported from file.', icon: 'success' });
    } else if (res?.status === 401) authFail();
    else Swal.fire({ title: 'Error', text: res?.data || 'Upload failed.', icon: 'error' });
  }

  return (
    <main className="main" id="main-content">
      <div className="cv-admin-page">
        <header className="cv-admin-header">
          <div className="cv-admin-header-text">
            <div className="cv-admin-kicker">Superadmin</div>
            <h1 className="cv-admin-title">MCQ Management</h1>
            <p className="cv-admin-subtitle">{loading ? 'Loading…' : `${filtered.length} of ${items.length}`}</p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" style={{ display: 'none' }} onChange={uploadFile} />
            <button type="button" className="cv-admin-btn" onClick={downloadTemplate} title="Download sample MCQ XLSX template">
              ↓ Template
            </button>
            <button type="button" className="cv-admin-btn" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
              {uploading ? 'Uploading…' : '↑ Bulk upload'}
            </button>
            <button type="button" className="cv-admin-btn is-primary" onClick={openNew}>+ New MCQ</button>
          </div>
        </header>

        <section className="cv-admin-surface">
          <div className="cv-admin-surface-head" style={{ flexWrap: 'wrap', gap: 12 }}>
            <h2>All MCQs</h2>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              <select className="cv-admin-page-size" style={{ padding: '7px 10px', borderRadius: 8, border: '1px solid var(--color-border-default)', background: 'var(--color-btn-bg)', color: 'var(--color-text-primary)', fontSize: 12 }}
                value={filterData.difficultyLevelId || ''} onChange={e => handleFilter('difficultyLevelId', e.target.value)}>
                <option value="">All difficulty</option>
                {diffLevels.map(d => <option key={d.id} value={d.id}>{d.value || d.name}</option>)}
              </select>
              <select style={{ padding: '7px 10px', borderRadius: 8, border: '1px solid var(--color-border-default)', background: 'var(--color-btn-bg)', color: 'var(--color-text-primary)', fontSize: 12 }}
                value={filterData.categoryId || ''} onChange={e => handleFilter('categoryId', e.target.value)} disabled={!filterData.difficultyLevelId}>
                <option value="">All categories</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.value || c.name}</option>)}
              </select>
              <select style={{ padding: '7px 10px', borderRadius: 8, border: '1px solid var(--color-border-default)', background: 'var(--color-btn-bg)', color: 'var(--color-text-primary)', fontSize: 12 }}
                value={filterData.subcategoryId || ''} onChange={e => handleFilter('subcategoryId', e.target.value)} disabled={!filterData.categoryId}>
                <option value="">All subcategories</option>
                {subCategories.map(s => <option key={s.id} value={s.id}>{s.value || s.name}</option>)}
              </select>
              <label className="cv-admin-search" style={{ minWidth: 180 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.8" /><path d="m20 20-3.5-3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
                <input type="search" placeholder="Search question…" value={search} onChange={e => { setSearch(e.target.value); setPage(0); }} />
              </label>
            </div>
          </div>

          <div className="cv-admin-table-wrap">
            {loading ? (
              <div className="cv-admin-loading"><span className="cv-admin-spinner" />Loading…</div>
            ) : filtered.length === 0 ? (
              <div className="cv-admin-table-empty">{search ? 'No matches.' : 'No MCQs yet.'}</div>
            ) : (
              <table className="cv-admin-table">
                <thead>
                  <tr><th>Question</th><th>
                    Difficulty Level</th><th>Categories Name</th><th>
                      Subcategories Name</th><th aria-label="Actions" >
                      Action</th></tr>
                </thead>
                <tbody>
                  {visible.map(it => (
                    <tr key={`${it.id}-${it.mcqQuestionId}`}>
                      <td className="cell-email" style={{ maxWidth: 480 }}>
                        {(it.question || '').replace(/<[^>]*>/g, '').slice(0, 160) || '—'}
                      </td>
                      <td className="cell-muted">{it?.difficultyLevel?.name || '—'}</td>
                      <td className="cell-muted">{it?.categoriedetails?.name || '—'}</td>
                      <td className="cell-muted">{it?.subCategoriedetails?.name || '—'}</td>
                      <td>
                        <div className="cv-admin-actions">
                          <button type="button" className="cv-admin-btn" onClick={() => openOptionsView(it)} title="View options & answers">View</button>
                          <button type="button" className="cv-admin-btn" onClick={() => openEdit(it)}>Edit</button>
                          <button type="button" className="cv-admin-btn is-warn" onClick={() => remove(it)}>Delete</button>
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
        <div className="cv-admin-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 920 }}>
          <div className="cv-admin-modal-head">
            <h3>{form.id ? 'Edit MCQ' : 'New MCQ'}</h3>
            <button type="button" className="cv-admin-modal-close" onClick={close}>×</button>
          </div>
          <form onSubmit={submit}>
            <div className="cv-admin-modal-body">
              <div className="cv-admin-form-grid">
                <div className="cv-admin-field is-full">
                  <label>Question</label>
                  <AdminRichEditor
                    value={form.question}
                    onChange={v => {
                      setForm(f => ({ ...f, question: v }));
                      if (errors.question) setErrors(es => ({ ...es, question: '' }));
                    }}
                    placeholder="Enter the question"
                  />
                  {errors.question && <div className="cv-admin-field-error" style={{ color: '#ff7777', fontSize: 11, marginTop: 4 }}>{errors.question}</div>}
                </div>
                <div className="cv-admin-field is-full">
                  <label>Description / explanation</label>
                  <textarea rows={3} name="description" value={form.description} onChange={handleField} />
                </div>
                <div className="cv-admin-field is-full">
                  <label>Nano tutorial <span style={{ color: 'var(--color-text-muted)', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(optional — shown in the slide-in Tutorial panel during the quiz)</span></label>
                  <textarea rows={4} name="nanoTutorial" value={form.nanoTutorial} onChange={handleField}
                    placeholder="Short focused explanation of the concept this question tests. Supports markdown + code fences. Leave blank to hide the Tutorial button." />
                </div>
                <div className="cv-admin-field">
                  <label>Difficulty</label>
                  <select name="difficultyLevelId" value={form.difficultyLevelId} onChange={handleField}>
                    <option value="">—</option>
                    {diffLevels.map(d => <option key={d.id} value={d.id}>{d.value || d.name}</option>)}
                  </select>
                  {errors.difficultyLevelId && <div className="cv-admin-field-error" style={{ color: '#ff7777', fontSize: 11, marginTop: 4 }}>{errors.difficultyLevelId}</div>}
                </div>
                <div className="cv-admin-field">
                  <label>Category</label>
                  <select name="categoriesId" value={form.categoriesId} onChange={handleField} disabled={!form.difficultyLevelId}>
                    <option value="">—</option>
                    {editCats.map(c => <option key={c.id} value={c.id}>{c.value || c.name}</option>)}
                  </select>
                  {errors.categoriesId && <div className="cv-admin-field-error" style={{ color: '#ff7777', fontSize: 11, marginTop: 4 }}>{errors.categoriesId}</div>}
                </div>
                <div className="cv-admin-field">
                  <label>Subcategory</label>
                  <select name="subCategoriesId" value={form.subCategoriesId} onChange={handleField} disabled={!form.categoriesId}>
                    <option value="">—</option>
                    {editSubs.map(s => <option key={s.id} value={s.id}>{s.value || s.name}</option>)}
                  </select>
                  {errors.subCategoriesId && <div className="cv-admin-field-error" style={{ color: '#ff7777', fontSize: 11, marginTop: 4 }}>{errors.subCategoriesId}</div>}
                </div>
                <div className="cv-admin-field" style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <input type="checkbox" id="mcq-multi" name="ismultipleAnswer" checked={form.ismultipleAnswer} onChange={handleField} />
                  <label htmlFor="mcq-multi" style={{ margin: 0, textTransform: 'none', letterSpacing: 0, fontSize: 13 }}>
                    Allow multiple correct answers
                  </label>
                </div>

                <div className="cv-admin-field is-full">
                  <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>Answer options</span>
                    <button type="button" className="cv-admin-btn" onClick={addOption} style={{ padding: '4px 10px', fontSize: 11 }}>+ Add option</button>
                  </label>
                  {errors.options && <div className="cv-admin-field-error" style={{ color: '#ff7777', fontSize: 11, marginBottom: 6 }}>{errors.options}</div>}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {options.map((opt, idx) => (
                      <div key={idx} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', padding: 10, border: '1px solid var(--color-border-default)', borderRadius: 10, background: 'rgba(0,0,0,0.20)' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center', minWidth: 60 }}>
                          <label title="Correct answer" style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--color-text-muted)' }}>
                            <input type="checkbox" checked={opt.isAnswers} onChange={e => setOption(idx, 'isAnswers', e.target.checked)} />
                            ✓
                          </label>
                          <label title="Code option" style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--color-text-muted)' }}>
                            <input type="checkbox" checked={opt.isCoding} onChange={e => setOption(idx, 'isCoding', e.target.checked)} />
                            { } code
                          </label>
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          {opt.isCoding ? (
                            <AdminCodeEditor
                              value={opt.optionName}
                              onChange={v => setOption(idx, 'optionName', v)}
                              height="120px"
                              name={`mcq_opt_${idx}`}
                            />
                          ) : (
                            <textarea rows={2} value={opt.optionName} onChange={e => setOption(idx, 'optionName', e.target.value)}
                              placeholder={`Option ${idx + 1}`}
                              style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid var(--color-border-default)', background: 'rgba(0,0,0,0.30)', color: 'var(--color-text-primary)', fontFamily: 'inherit', fontSize: 13, resize: 'vertical', boxSizing: 'border-box' }}
                              required />
                          )}
                        </div>
                        <button type="button" className="cv-admin-btn is-warn" onClick={() => removeOption(idx)} disabled={options.length === 1} style={{ padding: '4px 10px', fontSize: 11 }}>×</button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="cv-admin-modal-foot">
              <button type="button" className="cv-admin-btn" onClick={close} disabled={saving}>Cancel</button>
              <button type="submit" className="cv-admin-btn is-primary" disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
            </div>
          </form>
        </div>
      </AdminModal>

      {/* Quick peek modal: shows the question + every option's text, answer
          flag, and isCoding flag without opening the full edit form. */}
      <AdminModal open={!!optionsViewItem} onClose={closeOptionsView}>
        <div className="cv-admin-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 720 }}>
          <div className="cv-admin-modal-head">
            <h3>Options &amp; Answers</h3>
            <button type="button" className="cv-admin-modal-close" onClick={closeOptionsView}>×</button>
          </div>
          <div className="cv-admin-modal-body">
            <div
              className="cv-mcq-question-preview"
              style={{ marginBottom: 16, color: 'var(--color-text-primary)' }}
              dangerouslySetInnerHTML={{ __html: optionsViewItem?.question || '<em>N/A</em>' }}
            />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 80px', gap: 8, padding: '8px 0', borderBottom: '1px solid var(--color-border-default)', fontWeight: 600, fontSize: 12 }}>
              <div>Option</div>
              <div>Answer</div>
              <div>isCoding</div>
            </div>
            {(optionsViewItem?.questionOptions || []).map((opt, i) => (
              <div key={opt.optionId || i} style={{
                display: 'grid', gridTemplateColumns: '1fr 80px 80px', gap: 8,
                padding: '8px 0', borderBottom: '1px solid var(--color-border-default)',
                background: opt.isAnswers ? 'rgba(120, 200, 120, 0.08)' : 'transparent',
                alignItems: 'center', fontSize: 13,
              }}>
                <div style={{ wordBreak: 'break-word', whiteSpace: 'pre-wrap', fontFamily: opt.isCoding ? 'monospace' : 'inherit' }}>
                  {opt.optionName || '—'}
                </div>
                <div>
                  <span className="cv-admin-badge" style={{ padding: '2px 8px', borderRadius: 4, fontSize: 11, background: opt.isAnswers ? 'rgba(120, 200, 120, 0.25)' : 'rgba(120,120,120,0.18)' }}>
                    {opt.isAnswers ? 'Yes' : 'No'}
                  </span>
                </div>
                <div>
                  <span className="cv-admin-badge" style={{ padding: '2px 8px', borderRadius: 4, fontSize: 11, background: opt.isCoding ? 'rgba(120, 160, 220, 0.25)' : 'rgba(120,120,120,0.18)' }}>
                    {opt.isCoding ? 'True' : 'False'}
                  </span>
                </div>
              </div>
            ))}
            {(!optionsViewItem?.questionOptions || optionsViewItem.questionOptions.length === 0) && (
              <div style={{ padding: 12, color: 'var(--color-text-muted)', fontSize: 12, textAlign: 'center' }}>No options recorded.</div>
            )}
          </div>
          <div className="cv-admin-modal-foot">
            <button type="button" className="cv-admin-btn" onClick={closeOptionsView}>Close</button>
          </div>
        </div>
      </AdminModal>
    </main>
  );
}
