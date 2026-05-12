// components/FeedbackModal.jsx
// Post-submission feedback modal — full React conversion of feedback.js v3.
// Same CSS classes, same visual output, same window.CodiviumFeedback.show() API.
// Charts are computed inline in JSX; no setTimeout DOM mutation needed.
import React, {
  useState, useEffect, useRef, useCallback,
  forwardRef, useImperativeHandle,
} from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';

/* ── Helpers ─────────────────────────────────────────────────────────────── */
function fmtTime(s) {
  if (s == null) return '—';
  const m = Math.floor(s / 60);
  const sec = Math.round(s % 60);
  return `${m}:${sec < 10 ? '0' : ''}${sec}`;
}

function fmtDelta(val) {
  if (val == null) return null;
  const r = Math.round(val);
  const cls  = val < 0 ? 'good' : val > 0 ? 'bad' : 'neutral';
  const sign = val > 0 ? '▲ +' : '▼ ';
  return { text: `${sign}${Math.abs(r)}%`, cls };
}

function buildPath(values, w, h, pad) {
  const min  = Math.min(...values);
  const max  = Math.max(...values);
  const span = Math.max(1, max - min);
  const step = (w - 2 * pad) / Math.max(1, values.length - 1);
  const pts  = values.map((v, i) => ({
    x: pad + i * step,
    y: pad + (h - 2 * pad) * (1 - (v - min) / span),
  }));
  const d = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(' ');
  return { pts, d, min, max };
}

function chartStats(values) {
  const sorted = [...values].sort((a, b) => a - b);
  return {
    best:   values.reduce((a, b) => Math.min(a, b)),
    median: sorted[Math.floor(sorted.length / 2)],
    latest: values[values.length - 1],
  };
}

/* ── Sub-components ──────────────────────────────────────────────────────── */
function Delta({ val }) {
  const d = fmtDelta(val);
  if (!d) return null;
  return <div className={`fb-delta ${d.cls}`}>{d.text}</div>;
}

function MetricCard({ label, value, unit, deltaVal, helpText }) {
  return (
    <div className="fb-card" aria-label={label}>
      <div className="fb-card-top">
        <div className="fb-card-label">{label}</div>
        <Delta val={deltaVal} />
      </div>
      <div className="fb-metric">
        <div className="val">{value}</div>
        <div className="unit">{unit}</div>
      </div>
      {helpText && <div className="fb-help">{helpText}</div>}
    </div>
  );
}

function TimeChart({ history }) {
  const W = 320, H = 110, PAD = 10;
  const values = history.map(h => h.timeToSuccessSeconds);
  if (!values.length) return null;
  const { pts, d }    = buildPath(values, W, H, PAD);
  const { best, median, latest } = chartStats(values);
  const areaD = `${d} L ${(W - PAD).toFixed(2)} ${(H - PAD).toFixed(2)} L ${PAD.toFixed(2)} ${(H - PAD).toFixed(2)} Z`;
  return (
    <div className="fb-card fb-chart" aria-label="Time to success trend">
      <div className="fb-chart-head">
        <div className="fb-chart-title">Time to Success Trend</div>
        <div className="fb-chart-sub">Last {Math.min(history.length, 8)} completions</div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-label="Time trend" role="img">
        <path d={areaD} fill="rgba(246,213,138,0.10)" />
        <path d={d} fill="none" stroke="rgba(246,213,138,0.95)" strokeWidth="2.6"
          strokeLinecap="round" strokeLinejoin="round" />
        {pts.map((p, i) => (
          // Slightly oversized invisible hit-area so the native tooltip fires
          // before the cursor reaches the visible 3px dot.
          <g key={i}>
            <circle cx={p.x.toFixed(2)} cy={p.y.toFixed(2)} r="3.1"
              fill="rgba(246,213,138,0.95)" stroke="rgba(0,0,0,0.30)" strokeWidth="1" />
            <circle cx={p.x.toFixed(2)} cy={p.y.toFixed(2)} r="9"
              fill="transparent" style={{ cursor: 'pointer' }}>
              <title>{`Solve ${i + 1}: ${fmtTime(values[i])}${history[i].attempts != null ? ` · ${history[i].attempts} attempt${history[i].attempts === 1 ? '' : 's'}` : ''}`}</title>
            </circle>
          </g>
        ))}
      </svg>
      <div className="fb-legend">
        <span>Best: {fmtTime(best)}</span>
        <span>Median: {fmtTime(median)}</span>
        <span>Latest: {fmtTime(latest)}</span>
      </div>
    </div>
  );
}

function AttemptsChart({ history }) {
  const W = 320, H = 110, PAD = 10;
  const values = history.map(h => h.attempts);
  if (!values.length) return null;
  const max  = Math.max(...values);
  const n    = values.length;
  const gap  = 8;
  const barW = (W - 2 * PAD - gap * (n - 1)) / n;
  const baseY = H - PAD;
  const { d } = buildPath(values, W, H, PAD);
  const { best, median, latest } = chartStats(values);
  return (
    <div className="fb-card fb-chart" aria-label="Attempts trend">
      <div className="fb-chart-head">
        <div className="fb-chart-title">Attempts Trend</div>
        <div className="fb-chart-sub">Last {Math.min(history.length, 8)} completions</div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-label="Attempts trend" role="img">
        {values.map((a, i) => {
          const x    = PAD + i * (barW + gap);
          const barH = (H - 2 * PAD) * (a / Math.max(1, max));
          const y    = baseY - barH;
          const alpha = i === n - 1 ? 0.85 : 0.50;
          const time = history[i]?.timeToSuccessSeconds;
          return (
            <rect key={i} x={x.toFixed(2)} y={y.toFixed(2)}
              width={barW.toFixed(2)} height={barH.toFixed(2)}
              rx="6" fill={`rgba(246,213,138,${alpha})`}
              style={{ cursor: 'pointer' }}>
              <title>{`Solve ${i + 1}: ${a} attempt${a === 1 ? '' : 's'}${time != null ? ` · ${fmtTime(time)}` : ''}`}</title>
            </rect>
          );
        })}
        <path d={d} fill="none" stroke="rgba(245,245,252,0.72)"
          strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <div className="fb-legend">
        <span>Best: {best}</span>
        <span>Median: {median}</span>
        <span>Latest: {latest}</span>
      </div>
    </div>
  );
}

/* ── Modal ───────────────────────────────────────────────────────────────── */
function Modal({ result, onHide }) {
  const modalRef = useRef(null);
  const navigate = useNavigate();
  const c = result.current || {};
  const h = (result.history || []).slice(-8);
  const chips = Array.isArray(result.chips) ? result.chips : [];

  // Cursor glow tracking
  useEffect(() => {
    const el = modalRef.current;
    if (!el) return;
    let raf = null, lastE = null;
    const onMove = (e) => {
      lastE = e;
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = null;
        if (!lastE) return;
        const r = el.getBoundingClientRect();
        el.style.setProperty('--mx', `${((lastE.clientX - r.left) / r.width)  * 100}%`);
        el.style.setProperty('--my', `${((lastE.clientY - r.top)  / r.height) * 100}%`);
      });
    };
    el.addEventListener('mousemove', onMove, { passive: true });
    return () => el.removeEventListener('mousemove', onMove);
  }, []);

  // Focus last button on open
  useEffect(() => {
    const btns = modalRef.current?.querySelectorAll('button');
    if (btns?.length) btns[btns.length - 1].focus();
  }, []);

  // SPA-aware navigation: map old .html paths → React Router paths
  function navTo(url) {
    if (!url) return;
    const spa = url
      .replace(/codivium_insights_embedded\.html(\?.*)?/, '/insights')
      .replace(/menu-page\.html/, '/menu')
      .replace(/editor\.html/, '/editor')
      .replace(/mcq-parent\.html/, '/mcq')
      .replace(/account-settings\.html/, '/settings');
    if (spa.startsWith('/') || spa.startsWith('#')) {
      navigate(spa);
    } else {
      window.location.href = url; // external / unknown URL fallback
    }
  }

  const tierClass = result.performanceTier ? `tier-${result.performanceTier}` : '';
  const difficulty = result.difficulty
    ? result.difficulty.charAt(0).toUpperCase() + result.difficulty.slice(1) : '';

  return (
    <div className="fb-overlay is-open" role="dialog" aria-modal="true" aria-label="Immediate feedback">
      <div className="fb-backdrop" aria-hidden="true" />
      <div className="fb-modal" id="cvFeedbackModal" ref={modalRef}>

        {/* Header */}
        <header className="fb-head">
          <div className="fb-title">
            <div className="fb-seal" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.6"
                  strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div className="fb-hgroup">
              <div className="fb-kicker">Submission accepted</div>
              <h2 className="fb-exercise-name" title={result.exerciseName}>
                {result.exerciseName || 'Exercise'}
              </h2>
              <div className="fb-pills">
                <span className="fb-pill cat">{result.category || ''}</span>
                {difficulty && <span className="fb-pill level">{difficulty}</span>}
                <span className="fb-pill tests">
                  Tests: {result.testsPassed || 0} / {result.testsTotal || 0}
                </span>
                {result.performanceTier && (
                  <span className={`fb-pill ${tierClass}`}>
                    {result.performanceTier.charAt(0).toUpperCase() +
                      result.performanceTier.slice(1).replace('-', ' ')}
                  </span>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Body */}
        <div className="fb-body">

          {/* Row 1: primary metrics + insight */}
          <div className="fb-grid2">
            <div className="fb-metrics" aria-label="Primary metrics">
              <MetricCard
                label="Time to Success" value={fmtTime(c.timeToSuccessSeconds)} unit="mm:ss"
                deltaVal={result.deltas?.timeToSuccess}
                helpText="Total time from opening the exercise to first fully passing submission."
              />
              <MetricCard
                label="Attempts" value={String(c.attempts || 0)} unit="submissions"
                deltaVal={result.deltas?.attempts}
                helpText="Number of submissions made until all tests passed."
              />
            </div>
            <aside className="fb-insight" aria-label="Insight">
              <h3>Insight</h3>
              <p>{result.insightText || ''}</p>
              {(chips.length > 0 || result.nextSuggestion) && (
                <div className="fb-chips">
                  {chips.map((ch, i) => <span key={i} className="fb-pill">{ch}</span>)}
                  {result.nextSuggestion && (
                    <span className="fb-pill">→ {result.nextSuggestion}</span>
                  )}
                </div>
              )}
            </aside>
          </div>

          {/* Row 2: micro metrics */}
          <div className="fb-micro" aria-label="Secondary metrics">
            <MetricCard label="Time to First Attempt" value={fmtTime(c.timeToFirstAttemptSecs)} unit="mm:ss" />
            <MetricCard label="Best Pre-Success"
              value={c.bestPreSuccessPercent != null ? String(c.bestPreSuccessPercent) : '—'}
              unit="% tests" />
            <MetricCard label="Avg Iteration" value={fmtTime(c.avgIterationSeconds)} unit="mm:ss" />
          </div>

          {/* Row 3: charts (2+ history entries only) */}
          {h.length >= 2 && (
            <div className="fb-charts" aria-label="Trends over time">
              <TimeChart history={h} />
              <AttemptsChart history={h} />
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="fb-foot">
          <div className="fb-foot-left">
            <div className="fb-stamp">
              <strong>Codivium</strong> &mdash; Immediate feedback
            </div>
          </div>
          <div className="fb-foot-actions">
            <button className="fb-btn ghost" type="button"
              onClick={() => navigate('/insights')}>
              Dashboard
            </button>
            <button className="fb-btn ghost" type="button"
              onClick={() => {
                const raw = result.returnMenuUrl || '/menu';
                navTo(raw);
              }}>
              Return to Menu
            </button>
            <button className="fb-btn gold" type="button" onClick={() => {
              if (result.nextExerciseId) {
                // Try Next Exercise: keep existing URL-based navigation
                const from = result.returnMenuUrl
                  ? encodeURIComponent(
                      result.returnMenuUrl
                        .replace(/menu-page\.html/, '/menu')
                        .replace(/mcq-parent\.html/, '/mcq')
                    )
                  : '';
                navigate(
                  `/editor?id=${encodeURIComponent(result.nextExerciseId)}${from ? `&from=${from}` : ''}`,
                );
                onHide();
                return;
              }

              // Try Again: re-enter the same exercise via the route the user
              // came from, mirroring MenuPage's navigateFresh state shape.
              // attemptKey drives KeyedEditorPage to remount the workspace,
              // resetting timer / code / REPL / submit state.
              if (result.item) {
                const route = result.editorRoute || '/editor';
                navigate(route, {
                  state: {
                    item: result.item,
                    oldcode: null,
                    isStartFresh: true,
                    initialTimeInSeconds: 0,
                    attemptKey: Date.now(),
                  },
                });
                onHide();
                return;
              }

              // No item context — fall back to menu so the user can re-enter.
              const fallback = result.returnMenuUrl || '/menu';
              navTo(fallback);
              onHide();
            }}>
              {result.nextExerciseId ? 'Try Next Exercise' : 'Try Again'}
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}

/* ── Public component (imperative ref + window compat) ───────────────────── */
const FeedbackModal = forwardRef(function FeedbackModal(_, ref) {
  const [result, setResult] = useState(null);

  const show = useCallback((r) => setResult(r), []);
  const hide = useCallback(()  => setResult(null), []);

  // Preserve window.CodiviumFeedback API for backward compatibility
  // (backend teams or other scripts calling it directly)
  useEffect(() => {
    window.CodiviumFeedback = { show, hide };
    return () => { /* leave the global in place on unmount */ };
  }, [show, hide]);

  // Expose to parent via ref
  useImperativeHandle(ref, () => ({ show, hide }), [show, hide]);

  if (!result) return null;

  return createPortal(
    <Modal result={result} onHide={hide} />,
    document.body
  );
});

export default FeedbackModal;
