import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { logout } from '../utils/auth';

// Keeps every open tab's session in sync: when one tab logs out (removes
// LoginToken from localStorage), the browser's `storage` event fires in
// every OTHER tab still open on an authenticated page, and this immediately
// logs those tabs out too and sends them to /login. `state.crossTabLogout`
// lets the login page explain why it redirected there.
export function useCrossTabLogoutSync() {
  const navigate = useNavigate();

  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === 'LoginToken' && e.newValue === null) {
        logout();
        navigate('/login', { replace: true, state: { crossTabLogout: true } });
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [navigate]);
}
