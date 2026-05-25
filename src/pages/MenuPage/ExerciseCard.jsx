// components/ExerciseCard.jsx
// Renders a single exercise card. Exact same visual output as buildCard() in menu-data.js.
// Cursor tracking (--mx/--my) is handled via onMouseMove/onMouseLeave.
import React, { useCallback, useRef } from 'react';
import { getCategoryPath, STATUS_ICON_PATHS, STATUS_CLASS, STATUS_LABEL } from './categoryIcons.js';

function norm(s) { return String(s || '').trim().toLowerCase(); }

function cap(s) {
  s = String(s || '');
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function truncate(s, max) {
  s = String(s || '');
  return s.length > max ? s.slice(0, max - 1) : s;
}

export default function ExerciseCard({ exercise: ex, returnUrl, onClick }) {
  const cardRef = useRef(null);
  const rafRef  = useRef(null);

  const statusKey   = (ex.completionStatus || 'not_started').replace(/-/g, '_');
  const statusCls   = STATUS_CLASS[statusKey] || 'todo';
  const statusLabel = STATUS_LABEL[statusKey]  || 'Not started';
  const diffCls     = norm(ex.difficulty);
  const diffLabel   = cap(ex.difficulty);
  const href = `/editor?id=${encodeURIComponent(ex.id)}&from=${encodeURIComponent(returnUrl)}`;

  const handleClick = useCallback(
    (e) => {
      if (onClick) {
        e.preventDefault();
        onClick(ex);
      }
    },
    [onClick, ex],
  );

  const handleMouseMove = useCallback((e) => {
    if (rafRef.current) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      const card = cardRef.current;
      if (!card) return;
      const r = card.getBoundingClientRect();
      card.style.setProperty('--mx', `${(((e.clientX - r.left) / r.width)  * 100).toFixed(2)}%`);
      card.style.setProperty('--my', `${(((e.clientY - r.top)  / r.height) * 100).toFixed(2)}%`);
    });
  }, []);

  const handleMouseLeave = useCallback(() => {
    const card = cardRef.current;
    if (card) {
      card.style.removeProperty('--mx');
      card.style.removeProperty('--my');
    }
  }, []);

  const categoryPath  = getCategoryPath(ex.category);
  const statusPath    = STATUS_ICON_PATHS[statusKey] || STATUS_ICON_PATHS['not_started'];

  return (
    <a
      ref={cardRef}
      className="exercise-card"
      href={href}
      aria-label={`${ex.name}${diffLabel ? ` (${diffLabel})` : ''}`}
      data-cat={norm(ex.category)}
      data-level={norm(ex.difficulty)}
      data-status={norm(statusKey.replace(/_/g, '-'))}
      data-id={ex.id}
      data-name={norm(ex.name)}
      data-desc={norm(ex.shortDescription || '')}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
    >
      {ex.isFree && (
        <div
          className="card-free-badge"
          aria-label="Free"
          style={{
            position: 'absolute',
            top: 10,
            left: 10,
            zIndex: 5,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '4px 10px 4px 7px',
            borderRadius: 999,
            background: 'rgba(10,10,14,0.6)',
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)',
            border: '1px solid rgba(255,255,255,0.14)',
            boxShadow: '0 3px 10px rgba(0,0,0,0.35)',
            pointerEvents: 'none',
          }}
        >
          {/* Red gift/tag icon */}
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M20 12v8a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-8M2 7h20v5H2zM12 21V7M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7zM12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"
              stroke="#ff4d4f"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span
            style={{
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: '#fff',
            }}
          >
            Free
          </span>
        </div>
      )}

      <div className="card-icon" aria-hidden="true">
        <svg fill="none" viewBox="0 0 24 24" aria-hidden="true"
          dangerouslySetInnerHTML={{ __html: categoryPath }} />
      </div>

      <div className={`card-status ${statusCls}`} aria-label={statusLabel}>
        <svg fill="none" viewBox="0 0 24 24" aria-hidden="true"
          dangerouslySetInnerHTML={{ __html: statusPath }} />
      </div>

      <div className="card-body">
        <h3 className="card-title">{truncate(ex.name, 40)}</h3>
        <div className="card-sub">{ex.name}</div>
        <div className="card-desc">{ex.shortDescription || ''}</div>
      </div>

      <div className="pill-row">
        <span className="pill">{ex.category}</span>
        <span className={`pill pill-level ${diffCls}`}>{diffLabel}</span>
      </div>
    </a>
  );
}
