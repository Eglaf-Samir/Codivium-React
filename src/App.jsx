import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Layout    from './components/Layout.jsx';
import PublicWrapper from './components/PublicWrapper.jsx';
import { LeaveConfirmProvider } from './context/LeaveConfirmContext.jsx';
import { isLoggedIn } from './utils/auth.js';

// App pages
import AdaptivePage  from './pages/AdaptivePage/index.jsx';
import MenuPage      from './pages/MenuPage/index.jsx';
import EditorPage    from './pages/EditorPage/index.jsx';
import McqSetupPage  from './pages/mcq-parent/McqParentPage.jsx';
import McqQuizPage   from './pages/mcq-quiz/McqQuizPage.jsx';
import SettingsPage  from './pages/SettingsPage.jsx';
import InsightsPage  from './pages/InsightsPage.jsx';

// Public pages
import Landing       from './pages/Landing.jsx';
import Login         from './pages/Login.jsx';
import Join          from './pages/Join.jsx';
import Legal         from './pages/Legal.jsx';
import Faq           from './pages/Faq.jsx';
import Pricing       from './pages/Pricing.jsx';
import Contact       from './pages/Contact.jsx';
import Articles      from './pages/Articles.jsx';
import Article       from './pages/Article.jsx';
import ResetPassword  from './pages/ResetPassword.jsx';
import ForgetPassword from './pages/ForgetPassword.jsx';

const PAGE_TITLES = {
  '/':                  'Codivium',
  '/adaptive-practice': 'Adaptive Practice',
  '/menu':              'Exercise Menu',
  '/editor':            'Exercise Workspace',
  '/mcq':               'MCQ Setup',
  '/mcq/quiz':          'MCQ Quiz',
  '/insights':          'Performance Insights',
  '/settings':          'Account & Settings',
};

// ── Block unauthenticated users from app pages ───────────────────
function RequireAuth({ children }) {
  if (!isLoggedIn()) return <Navigate to="/login" replace />;
  return children;
}

// Forces EditorPage to remount on a new attempt or a new exercise so timer,
// code, and REPL state reset cleanly (e.g. "Try Again" from the feedback modal).
function KeyedEditorPage() {
  const loc = useLocation();
  const k =
    loc.state?.attemptKey ??
    `${loc.pathname}:${loc.state?.item?.id || loc.state?.item?.excerciseId || ''}`;
  return <EditorPage key={k} />;
}

// ── App route wrapper ────────────────────────────────────────────
function AppRoute({ component: Component, bodyClass = '' }) {
  const location = useLocation();

  useEffect(() => {
    const label = PAGE_TITLES[location.pathname] || 'Codivium';
    document.title = `Codivium — ${label}`;
    // Note: do NOT clear data-page here. AppRoute's useEffect fires AFTER
    // child page effects (React runs parent effects after children), so
    // wiping data-page would undo whatever the child page just set (e.g.
    // InsightsDashboard's 'Performance Insights'). Each page that sets
    // data-page is responsible for restoring it in its own cleanup.
    document.body.style.overflow = '';
    document.documentElement.style.overflow = '';

    // Apply app body classes
    ['mcq-quiz','mcq-parent','cv-settings','drawer-collapsed','cv-app'].forEach(c =>
      document.body.classList.remove(c)
    );
    document.body.classList.add('cv-app');
    if (bodyClass) bodyClass.split(' ').forEach(c => c && document.body.classList.add(c));
  }, [location.pathname, bodyClass]);

  return (
    <Layout>
      <Component />
    </Layout>
  );
}

// ── Redirect logged-in users away from guest-only pages ──────────
function GuestOnly({ children }) {
  if (isLoggedIn()) return <Navigate to="/adaptive-practice" replace />;
  return children;
}

// ── Public route wrapper ─────────────────────────────────────────
function PubRoute({ component: Component, page, title }) {
  const location = useLocation();
  useEffect(() => {
    document.title = title ? `Codivium — ${title}` : 'Codivium';
    // Remove all app classes
    ['sidebar-collapsed','mcq-quiz','mcq-parent','cv-settings','drawer-collapsed','cv-app']
      .forEach(c => document.body.classList.remove(c));
  }, [location.pathname, title]);

  return (
    <PublicWrapper page={page}>
      <Component />
    </PublicWrapper>
  );
}

export default function App() {
  return (
    <LeaveConfirmProvider>
    <Routes>
      {/* ── PUBLIC PAGES ── */}
      <Route path="/"                element={<PubRoute component={Landing}        page="landing"         title="Become Python Pro" />} />
      <Route path="/login"           element={<GuestOnly><PubRoute component={Login} page="login" title="Login" /></GuestOnly>} />
      <Route path="/join"            element={<GuestOnly><PubRoute component={Join}  page="join"  title="Join" /></GuestOnly>} />
      <Route path="/legal"           element={<PubRoute component={Legal}          page="legal"           title="Terms & Privacy" />} />
      <Route path="/faq"             element={<PubRoute component={Faq}            page="faq"             title="FAQ" />} />
      <Route path="/pricing"         element={<PubRoute component={Pricing}        page="pricing"         title="Pricing" />} />
      <Route path="/contact"         element={<PubRoute component={Contact}        page="contact"         title="Contact" />} />
      <Route path="/articles"        element={<PubRoute component={Articles}       page="articles"        title="Articles" />} />
      <Route path="/article"         element={<PubRoute component={Article}        page="article"         title="Article" />} />
      <Route path="/password_reset"  element={<PubRoute component={ResetPassword}  page="password_reset"  title="Reset Password" />} />
      <Route path="/forget_password" element={<PubRoute component={ForgetPassword} page="password_reset"  title="Reset Password" />} />

      {/* ── APP PAGES ── */}
      <Route path="/adaptive-practice" element={<RequireAuth><AppRoute component={AdaptivePage} bodyClass="drawer-collapsed" /></RequireAuth>} />
      <Route path="/menu"              element={<RequireAuth><AppRoute component={MenuPage}      bodyClass="drawer-collapsed" /></RequireAuth>} />
      <Route path="/editor"            element={<RequireAuth><AppRoute component={KeyedEditorPage} bodyClass="drawer-collapsed" /></RequireAuth>} />
      <Route path="/interview/CodingQue"          element={<RequireAuth><AppRoute component={KeyedEditorPage} bodyClass="drawer-collapsed" /></RequireAuth>} />
      <Route path="/DeliberatePractice/CodingQue" element={<RequireAuth><AppRoute component={KeyedEditorPage} bodyClass="drawer-collapsed" /></RequireAuth>} />
      <Route path="/mcq"               element={<RequireAuth><AppRoute component={McqSetupPage}  bodyClass="mcq-parent" /></RequireAuth>} />
      <Route path="/mcq/quiz"          element={<RequireAuth><AppRoute component={McqQuizPage}   bodyClass="mcq-quiz" /></RequireAuth>} />
      <Route path="/insights"          element={<RequireAuth><AppRoute key="insights" component={InsightsPage} bodyClass="drawer-collapsed" /></RequireAuth>} />
      <Route path="/settings"          element={<RequireAuth><AppRoute component={SettingsPage}  bodyClass="cv-settings" /></RequireAuth>} />

      {/* ── LEGACY REDIRECTS ── */}
      <Route path="/adaptive-practice.html"           element={<Navigate to="/adaptive-practice" replace />} />
      <Route path="/menu-page.html"                   element={<Navigate to="/menu" replace />} />
      <Route path="/editor.html"                      element={<Navigate to="/editor" replace />} />
      <Route path="/mcq-parent.html"                  element={<Navigate to="/mcq" replace />} />
      <Route path="/mcq-quiz.html"                    element={<Navigate to="/mcq/quiz" replace />} />
      <Route path="/account-settings.html"            element={<Navigate to="/settings" replace />} />
      <Route path="/codivium_insights_embedded.html"  element={<Navigate to="/insights" replace />} />
      <Route path="*"                                 element={<Navigate to="/adaptive-practice" replace />} />
    </Routes>
    </LeaveConfirmProvider>
  );
}
