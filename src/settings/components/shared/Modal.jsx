// components/shared/Modal.jsx
// Portal-based modal with focus trap and Escape key. Used by all six modal forms.

import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

export default function Modal({ id, title, titleId, body, isOpen, onClose, children }) {
  const backdropRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    const backdrop = backdropRef.current;
    if (!backdrop) return;

    // Focus first interactive element
    const firstField = backdrop.querySelector('input, select, textarea, button:not([data-close])');
    if (firstField) {
      const raf = requestAnimationFrame(() => firstField.focus());
      return () => cancelAnimationFrame(raf);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    function trapFocus(e) {
      if (e.key !== 'Tab') return;
      const backdrop = backdropRef.current;
      if (!backdrop) return;
      const focusable = Array.from(backdrop.querySelectorAll(
        'a, button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])'
      )).filter(el => !el.closest('[hidden]'));
      if (!focusable.length) return;
      const first = focusable[0], last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }

    function onKeydown(e) { if (e.key === 'Escape') onClose(); }

    document.addEventListener('keydown', trapFocus);
    document.addEventListener('keydown', onKeydown);
    return () => {
      document.removeEventListener('keydown', trapFocus);
      document.removeEventListener('keydown', onKeydown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div
      className="as-modal-backdrop open"
      id={`modal-${id}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId || `modal-title-${id}`}
      ref={backdropRef}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="as-modal">
        <div className="as-modal-title" id={titleId || `modal-title-${id}`}>{title}</div>
        {body && <div className="as-modal-body">{body}</div>}
        {children}
      </div>
    </div>,
    document.body
  );
}
