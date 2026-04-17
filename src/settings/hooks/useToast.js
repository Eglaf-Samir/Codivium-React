// hooks/useToast.js
import { useState, useRef, useCallback } from 'react';

export function useToast() {
  const [toast, setToast] = useState(null); // { msg, isError }
  const timerRef = useRef(null);

  const showToast = useCallback((msg, isError = false) => {
    clearTimeout(timerRef.current);
    setToast({ msg, isError });
    timerRef.current = setTimeout(() => setToast(null), 2800);
  }, []);

  return { toast, showToast };
}
