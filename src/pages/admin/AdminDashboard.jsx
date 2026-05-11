import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getsuperadmindashbord } from '../../api/dashbord/apiDashbord';
import { logout } from '../../utils/auth';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [visitors, setVisitors] = useState(0);
  const [subscriptions, setSubscriptions] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await getsuperadmindashbord();
      if (cancelled) return;

      if (res?.status === 200 && res?.data) {
        setVisitors(res.data.todayVisitCount || 0);
        setSubscriptions(res.data.todayUserCount || 0);
      } else if (res?.status === 401) {
        logout();
        navigate('/login', { replace: true });
        return;
      } else {
        setVisitors(0);
        setSubscriptions(0);
      }
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [navigate]);

  return (
    <main className="main" id="main-content">
      <div className="cv-admin-page">
        <header className="cv-admin-header">
          <div className="cv-admin-header-text">
            <div className="cv-admin-kicker">Superadmin</div>
            <h1 className="cv-admin-title">Dashboard</h1>
            <p className="cv-admin-subtitle">Today's activity at a glance.</p>
          </div>
        </header>

        <section className="cv-admin-stats" aria-label="Today's metrics">
          <article className="cv-admin-stat">
            <div className="cv-admin-stat-ico" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none">
                <circle cx="9" cy="8" r="3.4" stroke="currentColor" strokeWidth="1.8" />
                <path d="M2.8 19.5c0-3.2 2.8-5.5 6.2-5.5s6.2 2.3 6.2 5.5"
                  stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                <circle cx="17" cy="9" r="2.6" stroke="currentColor" strokeWidth="1.8" />
                <path d="M14.8 14.5c.7-.3 1.4-.5 2.2-.5 2.6 0 4.6 1.7 4.6 4"
                  stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </div>
            <div className="cv-admin-stat-body">
              <div className="cv-admin-stat-label">Visitors Today</div>
              <div className="cv-admin-stat-value">
                {loading ? <span className="cv-admin-spinner" /> : visitors.toLocaleString()}
              </div>
              <div className="cv-admin-stat-hint">Total site visits in last 24 hours</div>
            </div>
          </article>

          <article className="cv-admin-stat">
            <div className="cv-admin-stat-ico" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M12 3l2.6 5.4 5.9.9-4.3 4.2 1 5.9L12 16.6 6.8 19.4l1-5.9L3.5 9.3l5.9-.9L12 3Z"
                  stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
              </svg>
            </div>
            <div className="cv-admin-stat-body">
              <div className="cv-admin-stat-label">New Registrations</div>
              <div className="cv-admin-stat-value">
                {loading ? <span className="cv-admin-spinner" /> : subscriptions.toLocaleString()}
              </div>
              <div className="cv-admin-stat-hint">New user accounts created today</div>
            </div>
          </article>
        </section>
      </div>
    </main>
  );
}
