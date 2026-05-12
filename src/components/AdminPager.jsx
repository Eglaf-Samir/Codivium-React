import React, { useMemo } from 'react';

/**
 * Shared numbered pagination footer for admin lists.
 * Matches the UserManagement page so all admin tables paginate the same way.
 */
export default function AdminPager({
  total,
  page,
  rowsPerPage,
  onPageChange,
  onRowsPerPageChange,
  rowsPerPageOptions = [10, 25, 50, 100],
}) {
  const pageCount = Math.max(1, Math.ceil(total / rowsPerPage));
  const pageSafe = Math.min(page, pageCount - 1);

  const window = useMemo(() => {
    const max = 5;
    const half = Math.floor(max / 2);
    let start = Math.max(0, pageSafe - half);
    let end = Math.min(pageCount, start + max);
    start = Math.max(0, end - max);
    return Array.from({ length: end - start }, (_, i) => start + i);
  }, [pageSafe, pageCount]);

  const from = total === 0 ? 0 : pageSafe * rowsPerPage + 1;
  const to = Math.min(total, (pageSafe + 1) * rowsPerPage);

  return (
    <div className="cv-admin-pagination">
      <div className="cv-admin-pagination-info">
        Showing {from}–{to} of {total}
      </div>

      <div className="cv-admin-pager" role="navigation" aria-label="Pagination">
        <button type="button" disabled={pageSafe === 0} onClick={() => onPageChange(0)} aria-label="First page">«</button>
        <button type="button" disabled={pageSafe === 0} onClick={() => onPageChange(pageSafe - 1)} aria-label="Previous page">‹</button>
        {window.map(i => (
          <button
            key={i}
            type="button"
            className={i === pageSafe ? 'is-active' : ''}
            onClick={() => onPageChange(i)}
            aria-current={i === pageSafe ? 'page' : undefined}
          >
            {i + 1}
          </button>
        ))}
        <button type="button" disabled={pageSafe >= pageCount - 1} onClick={() => onPageChange(pageSafe + 1)} aria-label="Next page">›</button>
        <button type="button" disabled={pageSafe >= pageCount - 1} onClick={() => onPageChange(pageCount - 1)} aria-label="Last page">»</button>
      </div>

      {onRowsPerPageChange && (
        <label className="cv-admin-page-size">
          Rows per page
          <select
            value={rowsPerPage}
            onChange={e => { onRowsPerPageChange(Number(e.target.value)); onPageChange(0); }}
          >
            {rowsPerPageOptions.map(n => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </label>
      )}
    </div>
  );
}
