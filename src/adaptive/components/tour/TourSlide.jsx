// src/adaptive/components/tour/TourSlide.jsx
// Renders the content area of a single tour step.
import React, { useEffect, useRef } from 'react';
import TourOrientForm from './TourOrientForm.jsx';

// Minimal WAAPI cube spin — matches brand-cube.js behaviour
function useCubeSpin(ref) {
  useEffect(() => {
    const cube = ref.current;
    if (!cube || typeof cube.animate !== 'function') return;
    try {
      if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    } catch (_) {}

    let anim = null;
    function runPhase() {
      let currentTransform = '';
      try { currentTransform = getComputedStyle(cube).transform || ''; } catch (_) {}
      let base;
      try {
        base = new DOMMatrixReadOnly(
          currentTransform && currentTransform !== 'none'
            ? currentTransform
            : 'rotateX(-18deg) rotateY(32deg)'
        );
      } catch (_) { return; }
      const k1 = base.toString();
      let k2;
      try { k2 = base.rotate(0, 90, 0).toString(); } catch (_) { return; }
      try {
        anim = cube.animate([{ transform: k1 }, { transform: k2 }],
          { duration: 1500, easing: 'linear', fill: 'forwards' });
        anim.onfinish = () => { if (cube.isConnected) runPhase(); };
      } catch (_) {}
    }
    runPhase();
    return () => { try { anim?.cancel(); } catch (_) {} };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
}

function CubeFace({ cls, char }) {
  return <div className={`cvt-cube-face ${cls}`}>{char}</div>;
}

function Wordmark() {
  const cubeRef = useRef(null);
  useCubeSpin(cubeRef);
  return (
    <div className="cvt-wordmark">
      <div className="cvt-wordmark-cube" ref={cubeRef}>
        <CubeFace cls="front"  char="κ" />
        <CubeFace cls="right"  char="δ" />
        <CubeFace cls="back"   char="αδ" />
        <CubeFace cls="left"   char="ν" />
        <CubeFace cls="top"    char="η" />
        <CubeFace cls="bottom" char="φσα" />
      </div>
      <div className="cvt-wordmark-text">Codivium</div>
      <span className="cvt-badge-new">✦ New</span>
    </div>
  );
}

function VideoCard({ title, duration, icon, onClick }) {
  return (
    <div className="cvt-video-card" onClick={onClick} role="button" tabIndex={0}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') onClick(); }}>
      <div className="cvt-video-thumb">
        <div style={{ position:'absolute',inset:0,display:'flex',alignItems:'center',
          justifyContent:'center',fontSize:36,opacity:0.3 }}>{icon}</div>
        <div className="cvt-play-btn">
          <svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
        </div>
      </div>
      <div className="cvt-video-meta">
        <div className="cvt-video-title">{title}</div>
        <div className="cvt-video-dur">{duration}</div>
      </div>
    </div>
  );
}

export default function TourSlide({ step, stepIndex, totalSteps, formAnswers, onAnswer, onOpenVideo }) {
  return (
    <div className="cvt-slide active">
      {/* ── Header ── */}
      <div className="cvt-header">
        {step.id === 'welcome' && <Wordmark />}

        {/* Progress pips */}
        <div className="cvt-step-track">
          {Array.from({ length: totalSteps }, (_, i) => (
            <div key={i} className={
              `cvt-step-pip${i < stepIndex ? ' done' : i === stepIndex ? ' active' : ''}`
            } />
          ))}
        </div>

        <div className="cvt-step-label">
          {step.label}&nbsp;·&nbsp;Step {stepIndex + 1} of {totalSteps}
        </div>

        {/* Title — supports <em> via dangerouslySetInnerHTML (static data we own) */}
        <div className="cvt-title"
          dangerouslySetInnerHTML={{ __html: step.title }} />
      </div>

      {/* ── Body ── */}
      <div className="cvt-body">
        <p className="cvt-desc">{step.desc}</p>

        {/* Screenshot */}
        {step.screenshot && (
          <div className="cvt-screenshot" aria-hidden="true">
            <img src={step.screenshot} alt="" loading="eager"
              style={{ width:'100%',height:'auto',display:'block',borderRadius:0 }} />
          </div>
        )}

        {/* Fallback illustration for steps without screenshot and no spotlight */}
        {!step.screenshot && !step.spotlight && step.id !== 'final' && (
          <div className="cvt-illustration">
            <div className="cvt-illus-inner">
              <span className="cvt-illus-icon">{step.icon}</span>
              <div className="cvt-illus-caption">Live preview available once you start practising</div>
            </div>
          </div>
        )}

        {/* Pills */}
        {step.pills?.length > 0 && (
          <div className="cvt-pills">
            {step.pills.map((p, i) => (
              <div key={p.text || i} className="cvt-pill">
                <span className="cvt-pill-icon">{p.icon}</span>{p.text}
              </div>
            ))}
          </div>
        )}

        {/* Video cards (final step) */}
        {step.hasVideos && (
          <div className="cvt-videos">
            <VideoCard title="What is a Micro Challenge?" duration="1:45" icon="⚡"
              onClick={() => onOpenVideo('micro')} />
            <VideoCard title="How immediate feedback works" duration="2:10" icon="✅"
              onClick={() => onOpenVideo('feedback')} />
            <VideoCard title="How the dashboard helps later" duration="2:30" icon="📊"
              onClick={() => onOpenVideo('dashboard')} />
          </div>
        )}

        {/* Orientation form (final step) */}
        {step.id === 'final' && (
          <TourOrientForm answers={formAnswers} onAnswer={onAnswer} />
        )}
      </div>
    </div>
  );
}
