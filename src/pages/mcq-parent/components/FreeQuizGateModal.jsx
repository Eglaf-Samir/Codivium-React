// components/FreeQuizGateModal.jsx
//
// Shown when a user without full MCQ package access clicks Start Quiz.
// Tells them how many free questions (superadmin-flagged isFree) exist for
// their current difficulty/category selection, and offers a choice: take a
// quiz built from just that free pool, or open the package picker to unlock
// the full question bank (same PackagePickerModal used elsewhere).
import { createPortal } from 'react-dom';

export default function FreeQuizGateModal({ open, freeCount, requestedCount, onContinueFree, onGetPackage, onClose }) {
  if (!open) return null;
  const hasFree = Number(freeCount) > 0;

  return createPortal(
    <div
      role="presentation"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.55)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        display: 'grid',
        placeItems: 'center',
        zIndex: 1000,
        padding: 22,
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Free quiz limit"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--color-bg-elevated, #15151b)',
          color: 'var(--color-text-primary, #eee)',
          borderRadius: 16,
          maxWidth: 460,
          width: '100%',
          padding: 24,
          boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
          border: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
          <h2 style={{ margin: 0, fontSize: 19 }}>
            {hasFree ? 'Free questions available' : 'No free questions here'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={{ background: 'transparent', border: 'none', color: 'inherit', fontSize: 24, cursor: 'pointer', lineHeight: 1 }}
          >
            ×
          </button>
        </div>

        <p style={{ margin: '6px 0 0', opacity: 0.85, fontSize: 14, lineHeight: 1.5 }}>
          {hasFree
            ? `You have ${freeCount} free question${freeCount === 1 ? '' : 's'} available for this selection.`
            : 'None of the questions in this selection are part of the free plan.'}
        </p>
        <p style={{ margin: '8px 0 0', opacity: 0.85, fontSize: 14, lineHeight: 1.5 }}>
          To take a quiz with up to {requestedCount} questions, you’ll need an active package.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 20 }}>
          {hasFree && (
            <button
              type="button"
              onClick={onContinueFree}
              style={{
                background: 'linear-gradient(180deg, var(--color-accent, #d8b268), #b8924a)',
                color: '#1a1408',
                border: 'none',
                borderRadius: 10,
                padding: '12px 16px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Continue with {freeCount} free question{freeCount === 1 ? '' : 's'}
            </button>
          )}
          <button
            type="button"
            onClick={onGetPackage}
            style={{
              background: hasFree ? 'transparent' : 'linear-gradient(180deg, var(--color-accent, #d8b268), #b8924a)',
              color: hasFree ? 'inherit' : '#1a1408',
              border: hasFree ? '1px solid rgba(255,255,255,0.18)' : 'none',
              borderRadius: 10,
              padding: '12px 16px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Get Package
          </button>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: 'inherit', opacity: 0.7, padding: '4px 0', cursor: 'pointer', fontSize: 13 }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
