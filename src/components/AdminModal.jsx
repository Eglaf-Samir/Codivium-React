import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';

/**
 * Centred, scrollable modal that renders in document.body via portal so it
 * always covers the full viewport (independent of any fixed-positioned or
 * overflow-clipping ancestor like `.main`). The modal content scrolls
 * internally; the backdrop reserves a 10px gap on every side.
 *
 * Children should follow the standard structure:
 *   <div className="cv-admin-modal" ...>
 *     <div className="cv-admin-modal-head">...</div>
 *     <div className="cv-admin-modal-body">...</div>
 *     <div className="cv-admin-modal-foot">...</div>
 *   </div>
 */
export default function AdminModal({ open, onClose, children, labelledBy }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    document.addEventListener('keydown', onKey);
    // Lock background scroll while modal is open
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      className="cv-admin-modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby={labelledBy}
      onMouseDown={(e) => {
        // Close only when the backdrop itself is clicked, not the modal panel
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      {children}
    </div>,
    document.body,
  );
}
