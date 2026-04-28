import React, { createContext, useCallback, useContext, useRef, useState } from 'react';
import LeaveConfirmModal from '../components/LeaveConfirmModal.jsx';

// Imperative confirm dialog backed by the themed LeaveConfirmModal.
// Consumers call `confirm({ title, message, confirmText, cancelText })`
// and receive a Promise<boolean> — same ergonomics as Swal.fire(...) but
// rendered with the app's dark/gold modal theme.
const LeaveConfirmContext = createContext(null);

export function LeaveConfirmProvider({ children }) {
  const [state, setState] = useState({ open: false, opts: null });
  // Stash the resolver so confirm/cancel handlers can settle the Promise
  // without us having to thread it through state.
  const resolverRef = useRef(null);

  const close = useCallback((value) => {
    setState({ open: false, opts: null });
    resolverRef.current?.(value);
    resolverRef.current = null;
  }, []);

  const confirm = useCallback((opts) => {
    return new Promise((resolve) => {
      resolverRef.current = resolve;
      setState({ open: true, opts });
    });
  }, []);

  return (
    <LeaveConfirmContext.Provider value={confirm}>
      {children}
      <LeaveConfirmModal
        open={state.open}
        title={state.opts?.title || 'Are you sure?'}
        message={state.opts?.message || ''}
        confirmText={state.opts?.confirmText || 'Confirm'}
        cancelText={state.opts?.cancelText || 'Cancel'}
        onConfirm={() => close(true)}
        onCancel={() => close(false)}
      />
    </LeaveConfirmContext.Provider>
  );
}

// Returns the imperative `confirm({...})` function. Resolves true / false.
// If used outside the provider returns a no-op that always resolves true so
// nothing breaks — but the provider should wrap the whole app.
export function useLeaveConfirm() {
  return useContext(LeaveConfirmContext) || (() => Promise.resolve(true));
}
